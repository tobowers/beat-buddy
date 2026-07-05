import React, { useMemo } from "react";
import { Figure } from "../Figure";
import type { GamePattern, RoundResult, Settings, Speed } from "../types";

const SLOWER: Record<Speed, Speed | null> = {
  fast: "medium",
  medium: "slow",
  slow: null,
};

const CONFETTI_COLORS = ["var(--coral)", "var(--teal)", "var(--sun)", "var(--grape)", "var(--sky)"];

function tier(pct: number): { title: string; note: string; stars: number } {
  if (pct >= 0.9) return { title: "Superstar!", note: "You and the beat were best friends.", stars: 3 };
  if (pct >= 0.7) return { title: "Awesome rhythm!", note: "Your body found the beat!", stars: 3 };
  if (pct >= 0.5) return { title: "Great practice!", note: "You kept going the whole round.", stars: 2 };
  return { title: "Good try!", note: "Every round makes your body smarter.", stars: 1 };
}

export function Result({
  game,
  settings,
  result,
  onAgain,
  onSlower,
  onPickAnother,
}: {
  game: GamePattern;
  settings: Settings;
  result: RoundResult;
  onAgain: () => void;
  onSlower: () => void;
  onPickAnother: () => void;
}) {
  const pct = result.total > 0 ? result.hits / result.total : 0;
  const t = tier(pct);
  const slower = SLOWER[settings.speed];
  const celebrate = pct >= 0.7;

  const confetti = useMemo(
    () =>
      Array.from({ length: 26 }, (_, i) => ({
        left: `${(i * 37) % 100}%`,
        delay: `${(i % 9) * 0.18}s`,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length]!,
        spin: i % 2 === 0 ? "1" : "-1",
      })),
    [],
  );

  return (
    <div className="screen result-screen">
      {celebrate &&
        confetti.map((c, i) => (
          <span
            key={i}
            className="confetti"
            style={{
              left: c.left,
              animationDelay: c.delay,
              background: c.color,
              ["--spin" as string]: c.spin,
            }}
          />
        ))}

      <div className={`result-card color-${game.color}`}>
        <div className="result-buddy">
          <Figure pose={celebrate ? "STARFISH" : "CLAP"} size={140} accent={`var(--${game.color})`} pop />
        </div>
        <p className="result-round">Round complete</p>
        <h1 className="result-title">{t.title}</h1>
        <div className="result-stars" aria-label={`${t.stars} of 3 stars`}>
          {[1, 2, 3].map((n) => (
            <span key={n} className={n <= t.stars ? "star on" : "star"} style={{ animationDelay: `${n * 0.15}s` }}>
              ★
            </span>
          ))}
        </div>
        <p className="result-note">{t.note}</p>

        {settings.feedback === "score" && (
          <div className="result-stats">
            <div>
              <strong>{result.hits} / {result.total}</strong>
              <span>beats matched</span>
            </div>
            <div>
              <strong>{result.bestStreak}</strong>
              <span>best streak</span>
            </div>
            <div>
              <strong>{Math.round(pct * 100)}%</strong>
              <span>on the beat</span>
            </div>
          </div>
        )}
        {settings.feedback === "gentle" && (
          <div className="result-stats">
            <div>
              <strong>{result.hits}</strong>
              <span>beat hits</span>
            </div>
            <div>
              <strong>{result.bestStreak}</strong>
              <span>in a row</span>
            </div>
          </div>
        )}

        <div className="result-actions">
          <button className={`btn btn-big btn-${game.color}`} onClick={onAgain}>
            Play again
          </button>
          {slower && (
            <button className="btn" onClick={onSlower}>
              Try it slower
            </button>
          )}
          <button className="btn" onClick={onPickAnother}>
            Pick another game
          </button>
        </div>
      </div>
    </div>
  );
}
