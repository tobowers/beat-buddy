import React, { useRef, useState } from "react";
import { CameraStage } from "../../CameraStage";
import { Figure } from "../../Figure";
import { isStarfishShape } from "../../balance";
import { chime } from "../../sfx";

const REPS_TARGET = 3;

/**
 * Standing Starfish: hold the big starfish shape still for the target time.
 * The bar fills while the shape is held (short flickers are forgiven);
 * three filled bars completes the challenge.
 */
export function StarfishHold({ onBack }: { onBack: () => void }) {
  const [phase, setPhase] = useState<"intro" | "play" | "done">("intro");
  const [targetSec, setTargetSec] = useState<5 | 10>(5);
  const [progress, setProgress] = useState(0);
  const [reps, setReps] = useState(0);
  const [msg, setMsg] = useState("Make your biggest starfish!");

  const phaseRef = useRef(phase);
  phaseRef.current = phase;
  const repsRef = useRef(reps);
  repsRef.current = reps;
  const targetRef = useRef(targetSec);
  targetRef.current = targetSec;
  const st = useRef({ in: false, start: 0, last: 0, cooldownUntil: 0 });

  const onFrame = (lm: any, now: number) => {
    if (phaseRef.current !== "play") return;
    const s = st.current;
    if (now < s.cooldownUntil) return;
    // strict shape to start a hold, relaxed shape to keep it going
    const shape = isStarfishShape(lm, { relaxed: s.in });
    if (shape) {
      if (!s.in) {
        s.in = true;
        s.start = now;
        setMsg("Hold it… big and still!");
      }
      s.last = now;
      const cur = now - s.start;
      setProgress(Math.min(1, cur / (targetRef.current * 1000)));
      if (cur >= targetRef.current * 1000) {
        s.in = false;
        s.cooldownUntil = now + 2500;
        chime();
        setProgress(0);
        const done = repsRef.current + 1;
        setReps(done);
        if (done >= REPS_TARGET) {
          setPhase("done");
        } else {
          setMsg("Shake it out… then starfish again!");
        }
      }
    } else if (s.in && now - s.last > 1000) {
      s.in = false;
      setProgress(0);
      setMsg("Arms wide, feet wide — try again!");
    }
  };

  if (phase === "intro") {
    return (
      <div className="screen">
        <div className="screen-top">
          <button className="btn btn-ghost" onClick={onBack}>⟵ Balance games</button>
          <h1 className="screen-title accent-sky">Standing Starfish</h1>
        </div>
        <div className="demo-stage color-sky">
          <Figure pose="STARFISH" size={170} accent="var(--sky)" pop />
          <div className="demo-label">Big shape, super still</div>
          <ol className="how-list">
            <li>Stand with your feet wider than your hips.</li>
            <li>Stretch both arms way out to the sides.</li>
            <li>Hold the starfish shape until the bar fills up.</li>
            <li>Do it {REPS_TARGET} times!</li>
          </ol>
          <div className="chip-row chip-row-center">
            {([5, 10] as const).map((s) => (
              <button
                key={s}
                className={`chip ${targetSec === s ? "chip-on" : ""}`}
                onClick={() => setTargetSec(s)}
              >
                {s}s hold
              </button>
            ))}
          </div>
        </div>
        <div className="demo-actions">
          <button className="btn btn-big btn-sky" onClick={() => setPhase("play")}>
            Starfish time ➜
          </button>
        </div>
      </div>
    );
  }

  if (phase === "done") {
    return (
      <div className="screen result-screen">
        <div className="result-card color-sky">
          <Figure pose="STARFISH" size={130} accent="var(--sky)" pop />
          <p className="result-round">Standing Starfish</p>
          <h1 className="result-title">Super steady!</h1>
          <div className="result-stats">
            <div><strong>{REPS_TARGET}</strong><span>starfish holds</span></div>
            <div><strong>{targetSec}s</strong><span>each hold</span></div>
          </div>
          <div className="result-actions">
            <button
              className="btn btn-big btn-sky"
              onClick={() => {
                setReps(0);
                setProgress(0);
                st.current = { in: false, start: 0, last: 0, cooldownUntil: 0 };
                setPhase("play");
              }}
            >
              Again!
            </button>
            <button className="btn" onClick={onBack}>Balance games</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="screen play-screen">
      <CameraStage onFrame={onFrame}>
        <div className="play-hud-top">
          <button className="btn btn-ghost btn-quit" onClick={onBack}>✕</button>
          <div className="play-timer" />
          <div className="play-hits">
            {"★".repeat(reps)}{"☆".repeat(REPS_TARGET - reps)}
          </div>
        </div>
        <div className="play-hud-bottom">
          <div className="big-timer accent-sky">
            <span className="big-timer-label">{msg}</span>
          </div>
          <div className="hold-bar">
            <div className="hold-bar-fill" style={{ width: `${progress * 100}%` }} />
          </div>
        </div>
      </CameraStage>
    </div>
  );
}
