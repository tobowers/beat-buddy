import React, { useEffect, useRef, useState } from "react";
import { CameraStage } from "../../CameraStage";
import { Figure } from "../../Figure";
import { footLifted } from "../../balance";
import { blip, chime } from "../../sfx";

type Level = "A" | "B" | "C";
type Step = "lift" | "off" | "on";
type Mission = { ms: number; dips: number };

const LEVELS: { key: Level; name: string; hint: string }[] = [
  { key: "A", name: "Sitting", hint: "on a chair or the floor" },
  { key: "B", name: "Wall helper", hint: "stand near a couch or wall" },
  { key: "C", name: "Full ninja", hint: "one foot, no touching down" },
];

/**
 * Sock Mission: take a sock off and put it back on while balancing.
 * Pose detection can't see the sock itself, so the sock steps are big
 * kid-pressable buttons; the camera tracks foot lifts and counts "lava
 * dips" (foot-downs) on the standing levels. Time and dips per foot.
 */
export function SockMission({ onBack }: { onBack: () => void }) {
  const [phase, setPhase] = useState<"intro" | "play" | "between" | "done">("intro");
  const [started, setStarted] = useState(false); // hug done, mission clock running
  const [level, setLevel] = useState<Level>("B");
  const [step, setStep] = useState<Step>("lift");
  const [dips, setDips] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [missions, setMissions] = useState<Mission[]>([]);

  const phaseRef = useRef(phase);
  phaseRef.current = phase;
  const stepRef = useRef(step);
  stepRef.current = step;
  const levelRef = useRef(level);
  levelRef.current = level;
  const st = useRef({ start: 0, lifted: false, lastLifted: 0, liftedSince: 0 });

  // mission clock
  useEffect(() => {
    if (phase !== "play") return;
    const t = setInterval(() => setElapsed(performance.now() - st.current.start), 100);
    return () => clearInterval(t);
  }, [phase]);

  const beginMission = () => {
    st.current = { start: performance.now(), lifted: false, lastLifted: 0, liftedSince: 0 };
    setDips(0);
    setElapsed(0);
    setStarted(false);
    setStep(level === "A" ? "off" : "lift");
    setPhase("play");
  };

  // the mission clock starts at the hug, not at the intro button
  const onHugStart = () => {
    st.current.start = performance.now();
    setElapsed(0);
    setStarted(true);
  };

  const onFrame = (lm: any, now: number) => {
    if (phaseRef.current !== "play" || levelRef.current === "A") return;
    const lifted = footLifted(lm);
    const s = st.current;
    if (lifted) {
      if (!s.lifted) {
        if (s.liftedSince === 0) s.liftedSince = now;
        if (now - s.liftedSince > 300) {
          s.lifted = true;
          if (stepRef.current === "lift") {
            blip();
            setStep("off");
          }
        }
      }
      s.lastLifted = now;
    } else {
      s.liftedSince = 0;
      if (s.lifted && now - s.lastLifted > 450) {
        s.lifted = false;
        setDips((d) => d + 1); // a lava dip — counted gently, never scolded
      }
    }
  };

  const completeMission = () => {
    chime();
    setMissions((m) => [...m, { ms: performance.now() - st.current.start, dips }]);
    setPhase(missions.length === 0 ? "between" : "done");
  };

  const fmt = (ms: number) => `${(ms / 1000).toFixed(1)}s`;

  if (phase === "intro") {
    return (
      <div className="screen">
        <div className="screen-top">
          <button className="btn btn-ghost" onClick={onBack}>⟵ Balance games</button>
          <h1 className="screen-title accent-coral">Sock Mission</h1>
        </div>
        <div className="demo-stage color-coral">
          <Figure pose="SOCK" size={160} accent="var(--coral)" pop />
          <div className="demo-label">Sock ninja challenge!</div>
          <p className="demo-copy">
            Take your sock off and put it back on — without touching the lava.
            Grab a sock and pick your ninja level:
          </p>
          <div className="chip-row chip-row-center">
            {LEVELS.map((l) => (
              <button
                key={l.key}
                className={`chip ${level === l.key ? "chip-on" : ""}`}
                onClick={() => setLevel(l.key)}
              >
                {l.name}
                <small>{l.hint}</small>
              </button>
            ))}
          </div>
        </div>
        <div className="demo-actions">
          <button className="btn btn-big btn-coral" onClick={beginMission}>
            Start the mission ➜
          </button>
        </div>
      </div>
    );
  }

  if (phase === "between") {
    const m = missions[0]!;
    return (
      <div className="screen result-screen">
        <div className="result-card color-coral">
          <Figure pose="SOCK" size={120} accent="var(--coral)" pop />
          <p className="result-round">Foot one complete</p>
          <h1 className="result-title">Sock ninja!</h1>
          <div className="result-stats">
            <div><strong>{fmt(m.ms)}</strong><span>mission time</span></div>
            {level !== "A" && <div><strong>{m.dips}</strong><span>lava dips</span></div>}
          </div>
          <p className="result-note">Now the other foot?</p>
          <div className="result-actions">
            <button className="btn btn-big btn-coral" onClick={beginMission}>Switch feet ➜</button>
            <button className="btn" onClick={() => setPhase("done")}>I'm done</button>
          </div>
        </div>
      </div>
    );
  }

  if (phase === "done") {
    return (
      <div className="screen result-screen">
        <div className="result-card color-coral">
          <Figure pose="STARFISH" size={130} accent="var(--coral)" pop />
          <p className="result-round">Sock Mission</p>
          <h1 className="result-title">Mission complete!</h1>
          <div className="result-stats">
            {missions.map((m, i) => (
              <div key={i}>
                <strong>{fmt(m.ms)}</strong>
                <span>
                  foot {i + 1}
                  {level !== "A" ? ` · ${m.dips} lava dip${m.dips === 1 ? "" : "s"}` : ""}
                </span>
              </div>
            ))}
          </div>
          <div className="result-actions">
            <button
              className="btn btn-big btn-coral"
              onClick={() => {
                setMissions([]);
                setPhase("intro");
              }}
            >
              New mission
            </button>
            <button className="btn" onClick={onBack}>Balance games</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="screen play-screen">
      <CameraStage onFrame={onFrame} hugStart={{ accent: "var(--coral)", onStart: onHugStart }}>
        <div className="play-hud-top">
          <button className="btn btn-ghost btn-quit" onClick={onBack}>✕</button>
          <div className="play-timer">{started ? fmt(elapsed) : ""}</div>
          {level !== "A" ? <div className="play-hits">🌋 {dips}</div> : <div className="play-hits" />}
        </div>
        <div className="play-hud-bottom">
          <div className="big-timer accent-coral">
            <span className="big-timer-label">
              {step === "lift" && "Lift the sock foot to start!"}
              {step === "off" && "Ninja move 1: take the sock OFF"}
              {step === "on" && "Ninja move 2: put the sock back ON"}
            </span>
          </div>
          <div className="side-chips">
            {step === "off" && (
              <button className="btn btn-coral" onClick={() => { blip(1047); setStep("on"); }}>
                🧦 Sock is OFF!
              </button>
            )}
            {step === "on" && (
              <button className="btn btn-coral" onClick={completeMission}>
                🧦 Sock is back ON!
              </button>
            )}
          </div>
        </div>
      </CameraStage>
    </div>
  );
}
