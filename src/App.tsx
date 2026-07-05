import React, { useEffect, useState } from "react";
import { Pick } from "./screens/Pick";
import { Setup } from "./screens/Setup";
import { Demo } from "./screens/Demo";
import { Play } from "./screens/Play";
import { Result } from "./screens/Result";
import { BalancePick } from "./screens/BalancePick";
import { BalanceGameScreen } from "./screens/balance";
import { stopCamera } from "./camera";
import { gameById } from "./games";
import type { BalanceGameId } from "./balance";
import type { GamePattern, RoundResult, Settings } from "./types";

type Screen = "pick" | "setup" | "demo" | "play" | "result" | "balance-pick" | "balance";

const SETTINGS_KEY = "beat-buddy-settings";

const DEFAULT_SETTINGS: Settings = {
  speed: "slow",
  roundSeconds: 30,
  feedback: "gentle",
  bigUi: true,
  showMoves: true,
};

function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {}
  return DEFAULT_SETTINGS;
}

export function App() {
  const [screen, setScreen] = useState<Screen>("pick");
  const [game, setGame] = useState<GamePattern | null>(null);
  const [balanceId, setBalanceId] = useState<BalanceGameId | null>(null);
  const [settings, setSettings] = useState<Settings>(loadSettings);
  const [result, setResult] = useState<RoundResult | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch {}
  }, [settings]);

  // release the camera whenever we're back on a menu
  useEffect(() => {
    if (screen === "pick" || screen === "balance-pick") stopCamera();
  }, [screen]);

  return (
    <div className={`app ${settings.bigUi ? "big-ui" : ""}`}>
      {(screen === "pick" || screen === "balance-pick") && (
        <button
          className={`ui-size-toggle ${settings.bigUi ? "on" : ""}`}
          onClick={() => setSettings((s) => ({ ...s, bigUi: !s.bigUi }))}
          title="Make in-game text huge for playing far from the screen"
        >
          🔠 Huge text: {settings.bigUi ? "ON" : "OFF"}
        </button>
      )}
      {screen === "pick" && (
        <Pick
          onPick={(g) => {
            setGame(g);
            setScreen("setup");
          }}
          onBalance={() => setScreen("balance-pick")}
        />
      )}
      {screen === "balance-pick" && (
        <BalancePick
          onPick={(id) => {
            setBalanceId(id);
            setScreen("balance");
          }}
          onBack={() => setScreen("pick")}
        />
      )}
      {screen === "balance" && balanceId && (
        <BalanceGameScreen
          key={balanceId}
          id={balanceId}
          onBack={() => setScreen("balance-pick")}
        />
      )}
      {screen === "setup" && game && (
        <Setup
          game={game}
          settings={settings}
          onSettings={setSettings}
          onBack={() => setScreen("pick")}
          onReady={() => setScreen("demo")}
        />
      )}
      {screen === "demo" && game && (
        <Demo
          game={game}
          settings={settings}
          onBack={() => setScreen("setup")}
          onStart={() => setScreen("play")}
        />
      )}
      {screen === "play" && game && (
        <Play
          key={`${game.id}-${settings.speed}-${settings.roundSeconds}`}
          game={game}
          settings={settings}
          onQuit={() => setScreen("setup")}
          onDone={(r) => {
            setResult(r);
            setScreen("result");
          }}
        />
      )}
      {screen === "result" && game && result && (
        <Result
          game={gameById(result.gameId)}
          settings={settings}
          result={result}
          onAgain={() => setScreen("play")}
          onSlower={() => {
            setSettings((s) => ({
              ...s,
              speed: s.speed === "fast" ? "medium" : "slow",
            }));
            setScreen("play");
          }}
          onPickAnother={() => setScreen("pick")}
        />
      )}
    </div>
  );
}
