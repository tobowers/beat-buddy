import React, { useEffect, useRef, useState } from "react";
import { CameraStage } from "../../CameraStage";
import { Figure } from "../../Figure";
import { footLifted } from "../../balance";
import { beep, chime } from "../../sfx";

const NIGHT_SECONDS = 3; // fixed — the app never pushes for longer

/**
 * One-foot balance with eyes closed — an ADVANCED, grown-up-supervised
 * challenge. The app cannot (and does not try to) detect closed eyes;
 * a person taps the button to start a fixed 3-second audio countdown.
 * Beeps mark each second because the child's eyes are shut. There are no
 * records and no streaks here on purpose: no hero mode.
 */
export function NightTree({ onBack }: { onBack: () => void }) {
  const [phase, setPhase] = useState<"gate" | "play">("gate");
  const [ready, setReady] = useState(false); // a foot is currently lifted
  const [counting, setCounting] = useState<number | null>(null); // seconds left
  const [outcome, setOutcome] = useState<"held" | "wobble" | null>(null);

  const phaseRef = useRef(phase);
  phaseRef.current = phase;
  const night = useRef({ active: false, lastLifted: 0, footCame: false });
  const timeouts = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => () => timeouts.current.forEach(clearTimeout), []);

  const onFrame = (lm: any, now: number) => {
    if (phaseRef.current !== "play") return;
    const lifted = footLifted(lm);
    setReady(!!lifted);
    const n = night.current;
    if (n.active) {
      if (lifted) n.lastLifted = now;
      else if (now - n.lastLifted > 450) n.footCame = true;
    }
  };

  const startNight = () => {
    setOutcome(null);
    night.current = { active: true, lastLifted: performance.now(), footCame: false };
    setCounting(NIGHT_SECONDS);
    beep(660);
    for (let i = 1; i <= NIGHT_SECONDS; i++) {
      timeouts.current.push(
        setTimeout(() => {
          if (i < NIGHT_SECONDS) {
            beep(660);
            setCounting(NIGHT_SECONDS - i);
          } else {
            chime();
            setCounting(null);
            night.current.active = false;
            setOutcome(night.current.footCame ? "wobble" : "held");
          }
        }, i * 1000),
      );
    }
  };

  if (phase === "gate") {
    return (
      <div className="screen">
        <div className="screen-top">
          <button className="btn btn-ghost" onClick={onBack}>⟵ Balance games</button>
          <h1 className="screen-title accent-grape">Night Tree</h1>
        </div>
        <div className="demo-stage color-grape">
          <Figure pose="TREE" size={150} accent="var(--grape)" pop />
          <div className="demo-label">Eyes closed — advanced!</div>
          <ul className="safety-list">
            <li>🛋️ Stand right next to a couch or wall.</li>
            <li>🧑‍🤝‍🧑 A grown-up stays right there with you.</li>
            <li>👀 Eyes open first — then just {NIGHT_SECONDS} sleepy seconds.</li>
            <li>🦶 Putting your foot down is always okay.</li>
            <li>🛑 You can stop any time. No hero mode!</li>
          </ul>
          <p className="gate-note">
            For grown-ups: this is an advanced vestibular challenge — best if an OT has
            recommended it. The app keeps it to {NIGHT_SECONDS} seconds and never pushes for more.
          </p>
        </div>
        <div className="demo-actions">
          <button className="btn btn-big btn-grape" onClick={() => setPhase("play")}>
            A grown-up is here — let's go
          </button>
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
          <div className="play-hits" />
        </div>

        {counting !== null && (
          <div className="countin night-countin" key={counting}>
            <span>{counting}</span>
            <p>Sleepy seconds… beeps will count for you</p>
          </div>
        )}

        <div className="play-hud-bottom">
          {outcome && (
            <div className="stage-card color-grape">
              {outcome === "held"
                ? "🌙 Night tree stood strong! Open your eyes!"
                : "🌙 The tree wobbled — that's exactly how practice works!"}
            </div>
          )}
          {counting === null && (
            <>
              <div className="big-timer accent-grape">
                <span className="big-timer-label">
                  {ready ? "Root is ready! Close your eyes when the beeps start" : "Lift one foot to grow your root"}
                </span>
              </div>
              <div className="side-chips">
                <button className="btn btn-grape" disabled={!ready} onClick={startNight}>
                  Start {NIGHT_SECONDS} sleepy seconds
                </button>
                <button className="btn stage-done-btn" onClick={onBack}>All done</button>
              </div>
            </>
          )}
        </div>
      </CameraStage>
    </div>
  );
}
