import React from "react";
import { BALANCE_GAMES, type BalanceGameId } from "../balance";
import { Figure } from "../Figure";

export function BalancePick({
  onPick,
  onBack,
}: {
  onPick: (id: BalanceGameId) => void;
  onBack: () => void;
}) {
  return (
    <div className="screen pick-screen">
      <div className="screen-top">
        <button className="btn btn-ghost" onClick={onBack}>⟵ Beat games</button>
      </div>

      <header className="hero hero-small">
        <div className="hero-buddy">
          <Figure pose="TREE" size={100} accent="var(--grass)" />
        </div>
        <h1 className="hero-title hero-title-small">
          <span className="tilt-l alt-a">Balance</span> <span className="tilt-r alt-b">Challenges</span>
        </h1>
        <p className="hero-sub">Hold steady. Move slow. Strong roots!</p>
      </header>

      <div className="game-grid balance-grid">
        {BALANCE_GAMES.map((game, i) => (
          <button
            key={game.id}
            className={`game-card color-${game.color}`}
            style={{ animationDelay: `${i * 80}ms` }}
            onClick={() => onPick(game.id)}
          >
            {game.badge && <span className="game-diff">{game.badge}</span>}
            <div className="game-figure">
              <Figure pose={game.figure} size={92} accent={`var(--${game.color})`} />
            </div>
            <h2 className="game-name">{game.name}</h2>
            <p className="game-tag">{game.tagline}</p>
            <span className="game-start">Start ➜</span>
          </button>
        ))}
      </div>

      <footer className="privacy-note">
        Balance games are practice, not tests — putting a foot down is always okay.
        Play near a couch or wall.
      </footer>
    </div>
  );
}
