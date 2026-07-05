import React from "react";
import { GAMES } from "../games";
import { Figure } from "../Figure";
import type { GamePattern } from "../types";

const PREVIEW_POSE = {
  "cross-crawl-march": "LEFT_HAND_RIGHT_KNEE",
  "starfish-cross": "STARFISH",
  "clap-knee": "CLAP",
} as const;

export function Pick({ onPick }: { onPick: (game: GamePattern) => void }) {
  return (
    <div className="screen pick-screen">
      <header className="hero">
        <div className="hero-buddy">
          <Figure pose="STARFISH" size={110} accent="var(--sun)" />
        </div>
        <h1 className="hero-title">
          <span className="tilt-l">Beat</span> <span className="tilt-r">Buddy</span>
        </h1>
        <p className="hero-sub">Pick a game. Follow the beat. Move your body!</p>
      </header>

      <div className="game-grid">
        {GAMES.map((game, i) => (
          <button
            key={game.id}
            className={`game-card color-${game.color}`}
            style={{ animationDelay: `${i * 90}ms` }}
            onClick={() => onPick(game)}
          >
            <span className="game-diff">{game.difficulty}</span>
            <div className="game-figure">
              <Figure
                pose={PREVIEW_POSE[game.id as keyof typeof PREVIEW_POSE] ?? "idle"}
                size={104}
                accent={`var(--${game.color})`}
              />
            </div>
            <h2 className="game-name">{game.name}</h2>
            <p className="game-tag">{game.tagline}</p>
            <span className="game-start">Start ➜</span>
          </button>
        ))}
      </div>

      <footer className="privacy-note">
        <strong>For grown-ups:</strong> camera video stays on this device. The app uses the
        camera only to spot body landmarks during the game. Nothing is saved or uploaded.
      </footer>
    </div>
  );
}
