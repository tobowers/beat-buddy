import type { GamePattern } from "./types";

export const GAMES: GamePattern[] = [
  {
    id: "cross-crawl-march",
    name: "Cross-Crawl March",
    tagline: "Hand to the other knee, back and forth!",
    difficulty: "Warm-up",
    color: "teal",
    steps: [
      { beat: 1, expected: "LEFT_HAND_RIGHT_KNEE", label: "Left hand → right knee" },
      { beat: 2, expected: "RIGHT_HAND_LEFT_KNEE", label: "Right hand → left knee" },
    ],
  },
  {
    id: "starfish-cross",
    name: "Starfish Cross",
    tagline: "Go BIG like a starfish, then cross!",
    difficulty: "Twisty",
    color: "grape",
    steps: [
      { beat: 1, expected: "STARFISH", label: "Big starfish!" },
      { beat: 2, expected: "RIGHT_HAND_LEFT_KNEE", label: "Right hand → left knee" },
      { beat: 3, expected: "STARFISH", label: "Big starfish!" },
      { beat: 4, expected: "LEFT_HAND_RIGHT_KNEE", label: "Left hand → right knee" },
    ],
  },
  {
    id: "clap-knee",
    name: "Clap-Knee",
    tagline: "Clap, then cross. Clap, then cross!",
    difficulty: "Tricky",
    color: "coral",
    steps: [
      { beat: 1, expected: "CLAP", label: "Clap!" },
      { beat: 2, expected: "RIGHT_HAND_LEFT_KNEE", label: "Right hand → left knee" },
      { beat: 3, expected: "CLAP", label: "Clap!" },
      { beat: 4, expected: "LEFT_HAND_RIGHT_KNEE", label: "Left hand → right knee" },
    ],
  },
];

export function gameById(id: string): GamePattern {
  const g = GAMES.find((g) => g.id === id);
  if (!g) throw new Error(`unknown game ${id}`);
  return g;
}
