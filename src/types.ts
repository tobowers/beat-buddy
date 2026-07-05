export type MovementEvent =
  | "CLAP"
  | "LEFT_HAND_RIGHT_KNEE"
  | "RIGHT_HAND_LEFT_KNEE"
  | "STARFISH";

export type BeatStep = {
  beat: number;
  expected: MovementEvent;
  /** Kid-facing label shown during demo + play */
  label: string;
};

export type GamePattern = {
  id: string;
  name: string;
  tagline: string;
  difficulty: string;
  color: "coral" | "teal" | "grape";
  steps: BeatStep[];
};

export type Speed = "slow" | "medium" | "fast";
export type FeedbackMode = "gentle" | "score" | "none";

export type Settings = {
  speed: Speed;
  roundSeconds: 20 | 30 | 60;
  feedback: FeedbackMode;
  /** Huge HUD text for playing from across the room */
  bigUi: boolean;
  /** Show a big "do this move" figure card during play */
  showMoves: boolean;
};

export const BPM: Record<Speed, number> = {
  slow: 50,
  medium: 60,
  fast: 75,
};

/** Easy-mode timing window (ms either side of the beat). Forgiving on purpose. */
export const TIMING_WINDOW_MS = 400;

export type BeatResult = {
  index: number;
  beatTime: number;
  expected: MovementEvent;
  matched: boolean;
  eventTime?: number;
  offsetMs?: number;
};

export type RoundResult = {
  gameId: string;
  hits: number;
  total: number;
  bestStreak: number;
  results: BeatResult[];
};
