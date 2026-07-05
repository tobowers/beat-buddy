import React, { useEffect, useMemo, useRef, useState } from "react";
import { getCameraStream } from "../camera";
import { getPoseLandmarker, drawSkeleton, fullBodyVisible } from "../pose";
import { EventDetector, isHug, crossRatios } from "../detect";
import { Metronome } from "../metronome";
import { chime } from "../sfx";
import { Scorer, type BeatSpec } from "../scorer";
import { Figure, BeatDots } from "../Figure";
import type { GamePattern, RoundResult, Settings } from "../types";
import { BPM, timingWindowMs } from "../types";

const COUNT_IN = 4;

const CHEERS = [
  "Nice, keep going!",
  "Follow the beat!",
  "You've got this!",
  "Looking good!",
  "Keep moving!",
];

export function Play({
  game,
  settings,
  onDone,
  onQuit,
}: {
  game: GamePattern;
  settings: Settings;
  onDone: (result: RoundResult) => void;
  onQuit: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [status, setStatus] = useState<"loading" | "playing" | "error">("loading");
  const [waiting, setWaiting] = useState(true);
  const [beatIdx, setBeatIdx] = useState(-1);
  const [hits, setHits] = useState(0);
  const [flash, setFlash] = useState(0);
  const [bodyOk, setBodyOk] = useState(true);
  const [cheer, setCheer] = useState(0);
  const startRoundRef = useRef<() => void>(() => {});
  // ?debug shows pose fps, how close each wrist gets to the opposite knee
  // (2s rolling minimum, torso-scaled), and every fired event + credit status
  const debug = useMemo(() => new URLSearchParams(location.search).has("debug"), []);
  const [lastEvent, setLastEvent] = useState("");
  const [debugStats, setDebugStats] = useState("");

  const len = game.steps.length;
  const bpm = BPM[settings.speed];
  const windowMs = timingWindowMs(bpm);
  const scoredCount = useMemo(() => {
    const raw = Math.floor((settings.roundSeconds * bpm) / 60 / len) * len;
    return Math.max(len * 2, raw);
  }, [settings.roundSeconds, bpm, len]);

  useEffect(() => {
    let cancelled = false;
    let raf = 0;
    let endTimeout: ReturnType<typeof setTimeout> | undefined;
    const met = new Metronome();
    const detector = new EventDetector();
    let scorer: Scorer | null = null;

    (async () => {
      const [stream, landmarker] = await Promise.all([getCameraStream(), getPoseLandmarker()]);
      if (cancelled) return;
      const video = videoRef.current!;
      video.srcObject = stream;
      await video.play();
      if (cancelled) return;
      setStatus("playing");

      // --- metronome round: 4 count-in beats, then the scored round.
      //     Starts on the hug gesture (or the fallback button). ---
      let started = false;
      const startRound = () => {
        if (started || cancelled) return;
        started = true;
        setWaiting(false);
        chime();
        const beats = met.start({
          bpm,
          totalBeats: COUNT_IN + scoredCount,
          accentEvery: len,
          onBeat: (i) => setBeatIdx(i),
        });
        const specs: BeatSpec[] = beats.slice(COUNT_IN).map((b, j) => ({
          index: b.index,
          perfTime: b.perfTime,
          expected: game.steps[j % len]!.expected,
        }));
        scorer = new Scorer(specs, windowMs);

        const last = beats[beats.length - 1]!;
        const endDelay = last.perfTime - performance.now() + windowMs + 350;
        endTimeout = setTimeout(() => {
          if (cancelled) return;
          const final = scorer!.finalize();
          onDone({ gameId: game.id, ...final });
        }, endDelay);
      };
      startRoundRef.current = startRound;

      // --- pose loop: wait for the hug, then fire movement events into the scorer ---
      let lastTime = -1;
      let hugSince: number | null = null;
      let dbgFrames = 0;
      let dbgFps = 0;
      let dbgFpsT = 0;
      let dbgMinL = Infinity;
      let dbgMinR = Infinity;
      let dbgStatsT = 0;
      const loop = () => {
        if (cancelled) return;
        raf = requestAnimationFrame(loop);
        if (video.readyState < 2 || video.currentTime === lastTime) return;
        lastTime = video.currentTime;
        const now = performance.now();
        const result = landmarker.detectForVideo(video, now);
        const lm = result.landmarks?.[0];
        setBodyOk(fullBodyVisible(lm));

        const canvas = canvasRef.current;
        if (canvas && video.videoWidth) {
          if (canvas.width !== video.videoWidth) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
          }
          const ctx = canvas.getContext("2d")!;
          if (lm) drawSkeleton(ctx, lm, canvas.width, canvas.height, "rgba(255,253,248,0.9)");
          else ctx.clearRect(0, 0, canvas.width, canvas.height);
        }

        if (debug) {
          dbgFrames++;
          if (dbgFpsT === 0) dbgFpsT = now;
          if (now - dbgFpsT >= 1000) {
            dbgFps = dbgFrames;
            dbgFrames = 0;
            dbgFpsT = now;
          }
          const r = crossRatios(lm);
          if (r) {
            dbgMinL = Math.min(dbgMinL, r.lwrk);
            dbgMinR = Math.min(dbgMinR, r.rwlk);
          }
          if (now - dbgStatsT >= 2000) {
            const f = (v: number) => (v === Infinity ? "–" : v.toFixed(2));
            setDebugStats(`${dbgFps}fps · L→Rk ${f(dbgMinL)} · R→Lk ${f(dbgMinR)}`);
            dbgMinL = Infinity;
            dbgMinR = Infinity;
            dbgStatsT = now;
          }
        }

        if (!started) {
          // hold the hug briefly so a passing arm-cross doesn't trigger it
          if (isHug(lm)) {
            if (hugSince === null) hugSince = now;
            else if (now - hugSince > 600) startRound();
          } else {
            hugSince = null;
          }
          return;
        }

        if (lm && scorer) {
          for (const ev of detector.update(lm, now)) {
            const matched = scorer.addEvent(ev, now);
            if (debug) setLastEvent(`${ev} ${matched !== null ? "✓ hit" : "✗ no beat"}`);
            if (matched !== null) {
              if (settings.feedback !== "none") met.playHit();
              setHits(scorer.hits);
              setFlash((f) => f + 1);
            }
          }
        }
      };
      loop();
    })().catch((err) => {
      console.error(err);
      if (!cancelled) setStatus("error");
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      if (endTimeout) clearTimeout(endTimeout);
      met.stop();
    };
  }, []);

  // rotate gentle encouragement
  useEffect(() => {
    if (settings.feedback !== "gentle") return;
    const t = setInterval(() => setCheer((c) => c + 1), 7000);
    return () => clearInterval(t);
  }, [settings.feedback]);

  const inCountIn = beatIdx >= 0 && beatIdx < COUNT_IN;
  const scoredIdx = beatIdx - COUNT_IN;
  const stepIdx = scoredIdx >= 0 ? scoredIdx % len : -1;
  const step = stepIdx >= 0 ? game.steps[stepIdx]! : null;
  const progress = scoredIdx >= 0 ? Math.min(1, (scoredIdx + 1) / scoredCount) : 0;
  const secondsLeft = Math.max(0, Math.ceil(((scoredCount - scoredIdx - 1) * 60) / bpm));

  return (
    <div className="screen play-screen">
      <div className="play-stage">
        <video ref={videoRef} className="mirrored play-video" playsInline muted />
        <canvas ref={canvasRef} className="mirrored play-overlay" />

        {status === "loading" && <div className="cam-status">Getting ready…</div>}
        {status === "error" && (
          <div className="cam-status">Camera trouble — head back and try again.</div>
        )}

        {/* beat pulse ring */}
        {beatIdx >= 0 && (
          <div key={`ring-${beatIdx}`} className={`beat-ring accent-${game.color}`} />
        )}

        {/* hit star burst */}
        {flash > 0 && (
          <div key={`hit-${flash}`} className="hit-burst">★</div>
        )}

        {status === "playing" && waiting && (
          <div className="hug-wait">
            <Figure pose="HUG" size={settings.bigUi ? 190 : 130} accent={`var(--${game.color})`} pop />
            <p className="hug-wait-label">Give yourself a big hug to start!</p>
            <button className="btn hug-wait-btn" onClick={() => startRoundRef.current()}>
              or tap here
            </button>
          </div>
        )}

        {inCountIn && (
          <div className="countin" key={`count-${beatIdx}`}>
            <span>{beatIdx + 1}</span>
            <p>Get ready…</p>
          </div>
        )}

        {!bodyOk && status === "playing" && !inCountIn && (
          <div className="body-warn">Step back so I can see you!</div>
        )}

        {debug && (debugStats || lastEvent) && (
          <div
            style={{
              position: "absolute", top: 64, left: "50%", transform: "translateX(-50%)",
              background: "rgba(0,0,0,0.65)", color: "#fff", padding: "4px 14px",
              borderRadius: 10, fontFamily: "monospace", fontSize: 14, zIndex: 9,
            }}
          >
            {debugStats}
            {lastEvent && ` · ${lastEvent}`}
          </div>
        )}

        <div className="play-hud-top">
          <button className="btn btn-ghost btn-quit" onClick={onQuit}>✕</button>
          <div className="play-timer">{beatIdx >= COUNT_IN ? `${secondsLeft}s` : ""}</div>
          {settings.feedback === "score" ? (
            <div className="play-hits">⭐ {hits}</div>
          ) : (
            <div className="play-hits" />
          )}
        </div>

        <div className="play-hud-bottom">
          {step && settings.showMoves && (
            <div className={`move-card color-${game.color}`} key={`move-${scoredIdx}`}>
              <Figure
                pose={step.expected}
                size={settings.bigUi ? 160 : 72}
                accent={`var(--${game.color})`}
              />
              <div>
                <div className="move-label">{step.label}</div>
                <BeatDots count={len} active={stepIdx} color={`var(--${game.color})`} />
              </div>
            </div>
          )}
          {step && !settings.showMoves && (
            <div className="move-label-bare" key={`movebare-${scoredIdx}`}>
              {step.label}
            </div>
          )}
          {settings.feedback === "gentle" && beatIdx >= COUNT_IN && (
            <div className="cheer" key={`cheer-${cheer}`}>{CHEERS[cheer % CHEERS.length]}</div>
          )}
        </div>

        <div className="play-progress">
          <div className="play-progress-fill" style={{ width: `${progress * 100}%` }} />
        </div>
      </div>
    </div>
  );
}
