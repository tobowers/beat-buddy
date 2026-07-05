import React, { useEffect, useState } from "react";
import { Metronome } from "../metronome";
import { Figure, BeatDots } from "../Figure";
import type { GamePattern, Settings } from "../types";
import { BPM } from "../types";

/**
 * Looping demo of the pattern — Beat Buddy performs each move on the beat
 * until the child says they're ready.
 */
export function Demo({
  game,
  settings,
  onBack,
  onStart,
}: {
  game: GamePattern;
  settings: Settings;
  onBack: () => void;
  onStart: () => void;
}) {
  const [beat, setBeat] = useState(-1);
  const len = game.steps.length;

  useEffect(() => {
    const met = new Metronome();
    met.start({
      bpm: BPM[settings.speed],
      totalBeats: 100000, // loops until the screen unmounts
      accentEvery: len,
      onBeat: (i) => setBeat(i),
    });
    return () => met.stop();
  }, [game.id, settings.speed, len]);

  const stepIdx = beat >= 0 ? beat % len : 0;
  const step = game.steps[stepIdx]!;

  return (
    <div className="screen demo-screen">
      <div className="screen-top">
        <button className="btn btn-ghost" onClick={onBack}>⟵ Setup</button>
        <h1 className={`screen-title accent-${game.color}`}>Watch me first!</h1>
      </div>

      <div className={`demo-stage color-${game.color}`}>
        <div className="demo-figure">
          <Figure pose={beat >= 0 ? step.expected : "idle"} size={210} accent={`var(--${game.color})`} pop />
        </div>
        <div className="demo-label" key={beat >= 0 ? stepIdx : -1}>
          {beat >= 0 ? step.label : "Listen for the beat…"}
        </div>
        <BeatDots count={len} active={beat >= 0 ? stepIdx : -1} color={`var(--${game.color})`} />
      </div>

      <div className="demo-actions">
        <button className={`btn btn-big btn-${game.color}`} onClick={onStart}>
          I'm ready — let's play!
        </button>
      </div>
    </div>
  );
}
