import React, { useEffect, useRef, useState } from "react";
import { getCameraStream } from "../camera";
import { getPoseLandmarker, drawSkeleton, fullBodyVisible, toAnatomical } from "../pose";
import type { GamePattern, Settings, Speed, FeedbackMode } from "../types";
import { BPM } from "../types";

const SPEEDS: { key: Speed; label: string }[] = [
  { key: "slow", label: "Slow" },
  { key: "medium", label: "Medium" },
  { key: "fast", label: "Fast" },
];
const LENGTHS: (20 | 30 | 60)[] = [20, 30, 60];
const FEEDBACK: { key: FeedbackMode; label: string; hint: string }[] = [
  { key: "gentle", label: "Gentle", hint: "cheers you on" },
  { key: "score", label: "Score", hint: "shows numbers" },
  { key: "none", label: "Quiet", hint: "just plays" },
];

export function Setup({
  game,
  settings,
  onSettings,
  onBack,
  onReady,
}: {
  game: GamePattern;
  settings: Settings;
  onSettings: (s: Settings) => void;
  onBack: () => void;
  onReady: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [camState, setCamState] = useState<"loading" | "on" | "error">("loading");
  const [bodyOk, setBodyOk] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let raf = 0;
    (async () => {
      const [stream, landmarker] = await Promise.all([getCameraStream(), getPoseLandmarker()]);
      if (cancelled) return;
      const video = videoRef.current!;
      video.srcObject = stream;
      await video.play();
      if (cancelled) return;
      setCamState("on");

      let lastTime = -1;
      const loop = () => {
        if (cancelled) return;
        raf = requestAnimationFrame(loop);
        if (video.readyState < 2 || video.currentTime === lastTime) return;
        lastTime = video.currentTime;
        const result = landmarker.detectForVideo(video, performance.now());
        const lm = toAnatomical(result.landmarks?.[0]);
        setBodyOk(fullBodyVisible(lm));
        const canvas = canvasRef.current;
        if (!canvas) return;
        if (canvas.width !== video.videoWidth) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
        }
        const ctx = canvas.getContext("2d")!;
        if (lm) drawSkeleton(ctx, lm, canvas.width, canvas.height, "rgba(255,253,248,0.95)");
        else ctx.clearRect(0, 0, canvas.width, canvas.height);
      };
      loop();
    })().catch((err) => {
      console.error(err);
      if (!cancelled) setCamState("error");
    });
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div className="screen setup-screen">
      <div className="screen-top">
        <button className="btn btn-ghost" onClick={onBack}>⟵ Games</button>
        <h1 className={`screen-title accent-${game.color}`}>{game.name}</h1>
      </div>

      <div className="setup-layout">
        <div className={`cam-card ${bodyOk ? "cam-ok" : ""}`}>
          <div className="cam-frame">
            <video ref={videoRef} className="mirrored" playsInline muted />
            <canvas ref={canvasRef} className="mirrored cam-overlay" />
            {camState === "loading" && (
              <div className="cam-status">Waking up the camera…</div>
            )}
            {camState === "error" && (
              <div className="cam-status">
                Hmm, no camera. A grown-up may need to allow it, then refresh.
              </div>
            )}
          </div>
          <p className={`cam-hint ${bodyOk ? "ok" : ""}`}>
            {camState === "on"
              ? bodyOk
                ? "Perfect! I can see all of you ✔"
                : "Stand back so your whole body fits"
              : " "}
          </p>
        </div>

        <div className="settings-col">
          <div className="setting-group">
            <h3>Speed</h3>
            <div className="chip-row">
              {SPEEDS.map((s) => (
                <button
                  key={s.key}
                  className={`chip ${settings.speed === s.key ? "chip-on" : ""}`}
                  onClick={() => onSettings({ ...settings, speed: s.key })}
                >
                  {s.label}
                  <small>{BPM[s.key]} bpm</small>
                </button>
              ))}
            </div>
          </div>

          <div className="setting-group">
            <h3>Round length</h3>
            <div className="chip-row">
              {LENGTHS.map((sec) => (
                <button
                  key={sec}
                  className={`chip ${settings.roundSeconds === sec ? "chip-on" : ""}`}
                  onClick={() => onSettings({ ...settings, roundSeconds: sec })}
                >
                  {sec}s
                </button>
              ))}
            </div>
          </div>

          <div className="setting-group">
            <h3>Feedback</h3>
            <div className="chip-row">
              {FEEDBACK.map((f) => (
                <button
                  key={f.key}
                  className={`chip ${settings.feedback === f.key ? "chip-on" : ""}`}
                  onClick={() => onSettings({ ...settings, feedback: f.key })}
                >
                  {f.label}
                  <small>{f.hint}</small>
                </button>
              ))}
            </div>
          </div>

          <div className="setting-group">
            <h3>Playing far from the screen?</h3>
            <div className="chip-row">
              <button
                className={`chip ${settings.bigUi ? "chip-on" : ""}`}
                onClick={() => onSettings({ ...settings, bigUi: true })}
              >
                Huge text
                <small>stand way back</small>
              </button>
              <button
                className={`chip ${!settings.bigUi ? "chip-on" : ""}`}
                onClick={() => onSettings({ ...settings, bigUi: false })}
              >
                Normal
                <small>up close</small>
              </button>
            </div>
          </div>

          <div className="setting-group">
            <h3>Move pictures</h3>
            <div className="chip-row">
              <button
                className={`chip ${settings.showMoves ? "chip-on" : ""}`}
                onClick={() => onSettings({ ...settings, showMoves: true })}
              >
                Show each move
                <small>big helper figure</small>
              </button>
              <button
                className={`chip ${!settings.showMoves ? "chip-on" : ""}`}
                onClick={() => onSettings({ ...settings, showMoves: false })}
              >
                Words only
                <small>I know the moves!</small>
              </button>
            </div>
          </div>

          <button className={`btn btn-big btn-${game.color}`} onClick={onReady}>
            Show me the moves ➜
          </button>
        </div>
      </div>
    </div>
  );
}
