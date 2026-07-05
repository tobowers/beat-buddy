import React, { useRef, useState } from "react";
import { CameraStage } from "../../CameraStage";
import { Figure } from "../../Figure";
import { isCrouch, isTallTree } from "../../balance";
import { blip, chime } from "../../sfx";

const REPS_TARGET = 5;
const TALL_HOLD_MS = 3000;
const SLOW_RISE_MS = 2500; // rising slower than this earns the "slow grower" cheer

type Stage = "seed" | "rise" | "tall";

/**
 * Growing Tree: crouch down like a seed, rise sloooowly to a tall tree with
 * arms up, hold for 3 seconds, repeat. The whole point is slow, controlled
 * movement, so a slow rise gets celebrated (a fast one is still fine).
 */
export function GrowingTree({ onBack }: { onBack: () => void }) {
  const [phase, setPhase] = useState<"intro" | "play" | "done">("intro");
  const [stage, setStage] = useState<Stage>("seed");
  const [reps, setReps] = useState(0);
  const [msg, setMsg] = useState("Crouch down small, like a tiny seed");
  const [slowReps, setSlowReps] = useState(0);

  const phaseRef = useRef(phase);
  phaseRef.current = phase;
  const repsRef = useRef(reps);
  repsRef.current = reps;
  const st = useRef({
    stage: "seed" as Stage,
    crouchSince: 0,
    riseStart: 0,
    riseMs: 0,
    tallStart: 0,
    lastTall: 0,
  });

  const onFrame = (lm: any, now: number) => {
    if (phaseRef.current !== "play") return;
    const s = st.current;
    const crouch = isCrouch(lm);
    const tall = isTallTree(lm);

    if (s.stage === "seed") {
      if (crouch) {
        if (s.crouchSince === 0) s.crouchSince = now;
        if (now - s.crouchSince > 400) {
          s.stage = "rise";
          s.riseStart = now;
          setStage("rise");
          blip(660);
          setMsg("Now grow… slooooowly… up up up");
        }
      } else {
        s.crouchSince = 0;
      }
    } else if (s.stage === "rise") {
      if (tall) {
        s.riseMs = now - s.riseStart;
        s.stage = "tall";
        s.tallStart = now;
        s.lastTall = now;
        setStage("tall");
        setMsg("Branches up! Hold your tree…");
      }
    } else if (s.stage === "tall") {
      if (tall) {
        s.lastTall = now;
        if (now - s.tallStart >= TALL_HOLD_MS) {
          chime();
          const slow = s.riseMs >= SLOW_RISE_MS;
          if (slow) setSlowReps((n) => n + 1);
          const done = repsRef.current + 1;
          setReps(done);
          s.stage = "seed";
          s.crouchSince = 0;
          setStage("seed");
          if (done >= REPS_TARGET) {
            setPhase("done");
          } else {
            setMsg(
              slow
                ? "Beautiful slow growing! Back to a seed…"
                : "Great tree! Try growing even slower… back to a seed",
            );
          }
        }
      } else if (now - s.lastTall > 500) {
        s.stage = "rise";
        setStage("rise");
        setMsg("Reach those branches back up!");
      }
    }
  };

  if (phase === "intro") {
    return (
      <div className="screen">
        <div className="screen-top">
          <button className="btn btn-ghost" onClick={onBack}>⟵ Balance games</button>
          <h1 className="screen-title accent-grass">Growing Tree</h1>
        </div>
        <div className="demo-stage color-grass">
          <div className="grow-demo">
            <Figure pose="SEED" size={110} accent="var(--grass)" />
            <span className="grow-arrow">➜</span>
            <Figure pose="TALL_TREE" size={140} accent="var(--grass)" />
          </div>
          <div className="demo-label">Seed… to tree… slooowly</div>
          <ol className="how-list">
            <li>Crouch down small like a seed.</li>
            <li>Grow up as SLOWLY as you can.</li>
            <li>Stretch tall, branches (arms) up high.</li>
            <li>Hold your tree for 3 seconds.</li>
            <li>Melt back to a seed and grow {REPS_TARGET} trees!</li>
          </ol>
        </div>
        <div className="demo-actions">
          <button className="btn btn-big btn-grass" onClick={() => setPhase("play")}>
            Plant me ➜
          </button>
        </div>
      </div>
    );
  }

  if (phase === "done") {
    return (
      <div className="screen result-screen">
        <div className="result-card color-grass">
          <Figure pose="TALL_TREE" size={140} accent="var(--grass)" pop />
          <p className="result-round">Growing Tree</p>
          <h1 className="result-title">A whole forest!</h1>
          <div className="result-stats">
            <div><strong>{REPS_TARGET}</strong><span>trees grown</span></div>
            <div><strong>{slowReps}</strong><span>extra-slow grows</span></div>
          </div>
          <div className="result-actions">
            <button
              className="btn btn-big btn-grass"
              onClick={() => {
                setReps(0);
                setSlowReps(0);
                st.current.stage = "seed";
                st.current.crouchSince = 0;
                setStage("seed");
                setMsg("Crouch down small, like a tiny seed");
                setPhase("play");
              }}
            >
              Grow more trees
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
          <div className="play-hits">🌳 {reps}/{REPS_TARGET}</div>
        </div>
        <div className="play-hud-bottom">
          <div className="grow-stages">
            <span className={`grow-stage ${stage === "seed" ? "on" : ""}`}>
              <Figure pose="SEED" size={54} accent="var(--grass)" /> seed
            </span>
            <span className={`grow-stage ${stage === "rise" ? "on" : ""}`}>⬆ grow</span>
            <span className={`grow-stage ${stage === "tall" ? "on" : ""}`}>
              <Figure pose="TALL_TREE" size={54} accent="var(--grass)" /> tree
            </span>
          </div>
          <div className="big-timer accent-grass">
            <span className="big-timer-label">{msg}</span>
          </div>
        </div>
      </CameraStage>
    </div>
  );
}
