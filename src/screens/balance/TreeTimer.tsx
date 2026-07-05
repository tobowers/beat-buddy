import React, { useRef, useState } from "react";
import { CameraStage } from "../../CameraStage";
import { Figure } from "../../Figure";
import { footLifted, getBest, saveBest, type Side } from "../../balance";
import { blip, chime } from "../../sfx";

type Hold = { side: Side; ms: number };

const sideName = (s: Side) => (s === "left" ? "Left" : "Right");

/**
 * One-foot balance, eyes open. The timer runs while a lifted foot is
 * detected; each hold is recorded per side with local personal bests.
 */
export function TreeTimer({ onBack }: { onBack: () => void }) {
  const [phase, setPhase] = useState<"intro" | "play" | "done">("intro");
  const [live, setLive] = useState<{ side: Side; ms: number } | null>(null);
  const [holds, setHolds] = useState<Hold[]>([]);
  const [newBests, setNewBests] = useState<Side[]>([]);

  const phaseRef = useRef(phase);
  phaseRef.current = phase;
  const st = useRef({
    holding: false,
    side: "left" as Side,
    start: 0,
    lastSeen: 0,
    cand: null as Side | null,
    candSince: 0,
  });

  const endHold = (now: number) => {
    const s = st.current;
    s.holding = false;
    const ms = s.lastSeen - s.start;
    if (ms > 600) {
      blip();
      setHolds((h) => [...h, { side: s.side, ms }]);
    }
  };

  const onFrame = (lm: any, now: number) => {
    if (phaseRef.current !== "play") return;
    const lifted = footLifted(lm);
    const s = st.current;
    if (s.holding) {
      if (lifted === s.side) {
        s.lastSeen = now;
      } else if (now - s.lastSeen > 450) {
        endHold(now); // grace expired — the foot really came down
      }
    } else if (lifted) {
      if (s.cand === lifted) {
        if (now - s.candSince > 300) {
          s.holding = true;
          s.side = lifted;
          s.start = s.candSince;
          s.lastSeen = now;
        }
      } else {
        s.cand = lifted;
        s.candSince = now;
      }
    } else {
      s.cand = null;
    }
    setLive(s.holding ? { side: s.side, ms: now - s.start } : null);
  };

  const bestFor = (side: Side) =>
    holds.filter((h) => h.side === side).reduce((m, h) => Math.max(m, h.ms), 0);

  const finish = () => {
    if (st.current.holding) endHold(performance.now());
    const bests: Side[] = [];
    for (const side of ["left", "right"] as Side[]) {
      const b = bestFor(side);
      if (b > 0 && saveBest(`tree-${side}`, b)) bests.push(side);
    }
    setNewBests(bests);
    if (holds.length > 0) chime();
    setPhase("done");
  };

  if (phase === "intro") {
    return (
      <div className="screen">
        <div className="screen-top">
          <button className="btn btn-ghost" onClick={onBack}>⟵ Balance games</button>
          <h1 className="screen-title accent-teal">Tree Timer</h1>
        </div>
        <div className="demo-stage color-teal">
          <Figure pose="TREE" size={170} accent="var(--teal)" pop />
          <div className="demo-label">One-root tree!</div>
          <ol className="how-list">
            <li>Stand near a wall or couch.</li>
            <li>Lift one foot a little bit.</li>
            <li>Hold as long as you can — the timer runs by itself.</li>
            <li>Switch sides and try the other root!</li>
          </ol>
        </div>
        <div className="demo-actions">
          <button className="btn btn-big btn-teal" onClick={() => setPhase("play")}>
            Grow my root ➜
          </button>
        </div>
      </div>
    );
  }

  if (phase === "done") {
    const bl = bestFor("left");
    const br = bestFor("right");
    return (
      <div className="screen result-screen">
        <div className="result-card color-teal">
          <Figure pose="TREE" size={130} accent="var(--teal)" pop />
          <p className="result-round">Tree Timer</p>
          <h1 className="result-title">{holds.length > 0 ? "Strong roots!" : "Good practice!"}</h1>
          <div className="result-stats">
            <div>
              <strong>{bl > 0 ? `${(bl / 1000).toFixed(1)}s` : "—"}</strong>
              <span>left root {newBests.includes("left") && "⭐ new best"}</span>
            </div>
            <div>
              <strong>{br > 0 ? `${(br / 1000).toFixed(1)}s` : "—"}</strong>
              <span>right root {newBests.includes("right") && "⭐ new best"}</span>
            </div>
            <div>
              <strong>{holds.length}</strong>
              <span>holds</span>
            </div>
          </div>
          <div className="result-actions">
            <button
              className="btn btn-big btn-teal"
              onClick={() => {
                setHolds([]);
                setNewBests([]);
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
      <CameraStage onFrame={onFrame} hugStart={{ accent: "var(--teal)" }}>
        <div className="play-hud-top">
          <button className="btn btn-ghost btn-quit" onClick={onBack}>✕</button>
          <div className="play-timer" />
          <div className="play-hits" />
        </div>
        <div className="play-hud-bottom">
          <div className="big-timer accent-teal">
            {live ? (
              <>
                <span className="big-timer-num">{(live.ms / 1000).toFixed(1)}s</span>
                <span className="big-timer-label">{sideName(live.side)} root!</span>
              </>
            ) : (
              <span className="big-timer-label">Stand tall… then lift one foot</span>
            )}
          </div>
          <div className="side-chips">
            <span className="side-chip">
              Left best: {bestFor("left") > 0 ? `${(bestFor("left") / 1000).toFixed(1)}s` : "—"}
              {getBest("tree-left") ? ` (record ${(getBest("tree-left")! / 1000).toFixed(1)}s)` : ""}
            </span>
            <span className="side-chip">
              Right best: {bestFor("right") > 0 ? `${(bestFor("right") / 1000).toFixed(1)}s` : "—"}
              {getBest("tree-right") ? ` (record ${(getBest("tree-right")! / 1000).toFixed(1)}s)` : ""}
            </span>
          </div>
          <button className="btn stage-done-btn" onClick={finish}>I'm done</button>
        </div>
      </CameraStage>
    </div>
  );
}
