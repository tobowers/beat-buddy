import { LM, type NormalizedLandmark } from "./pose";

export type BalanceGameId =
  | "sock-mission"
  | "tree-timer"
  | "night-tree"
  | "standing-starfish"
  | "growing-tree";

export type BalanceGame = {
  id: BalanceGameId;
  name: string;
  tagline: string;
  color: "coral" | "teal" | "grape" | "sky" | "grass";
  badge?: string;
  figure: "TREE" | "SOCK" | "SEED" | "TALL_TREE" | "STARFISH";
};

export const BALANCE_GAMES: BalanceGame[] = [
  {
    id: "tree-timer",
    name: "Tree Timer",
    tagline: "One-root tree! How long can you hold?",
    color: "teal",
    figure: "TREE",
  },
  {
    id: "standing-starfish",
    name: "Standing Starfish",
    tagline: "Go BIG and hold super still.",
    color: "sky",
    figure: "STARFISH",
  },
  {
    id: "growing-tree",
    name: "Growing Tree",
    tagline: "Grow from a tiny seed — slow as can be.",
    color: "grass",
    figure: "TALL_TREE",
  },
  {
    id: "sock-mission",
    name: "Sock Mission",
    tagline: "Sock ninja! Off and back on — don't touch the lava.",
    color: "coral",
    figure: "SOCK",
  },
  {
    id: "night-tree",
    name: "Night Tree",
    tagline: "Eyes closed for 3 sleepy seconds.",
    color: "grape",
    badge: "With a grown-up",
    figure: "TREE",
  },
];

export function balanceGameById(id: BalanceGameId): BalanceGame {
  const g = BALANCE_GAMES.find((g) => g.id === id);
  if (!g) throw new Error(`unknown balance game ${id}`);
  return g;
}

/* ------------------------------------------------------------------
   Pose predicates for balance games. All thresholds scale with torso
   length so they work at any distance from the camera.
   ------------------------------------------------------------------ */

type Pt = { x: number; y: number };

function dist(a: Pt, b: Pt): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function torso(lm: NormalizedLandmark[]): number {
  return (
    (dist(lm[LM.leftShoulder]!, lm[LM.leftHip]!) +
      dist(lm[LM.rightShoulder]!, lm[LM.rightHip]!)) /
    2
  );
}

function ok(lm: NormalizedLandmark[] | undefined): lm is NormalizedLandmark[] {
  return !!lm && lm.length >= 33 && torso(lm) > 0.05;
}

function visible(lm: NormalizedLandmark[], ...idx: number[]): boolean {
  return idx.every((i) => (lm[i]!.visibility ?? 1) > 0.5);
}

export type Side = "left" | "right";

/**
 * Which foot (the child's own left/right) is lifted, if any.
 * A foot counts as lifted when its ankle is clearly higher than the other.
 */
export function footLifted(lm: NormalizedLandmark[] | undefined): Side | null {
  if (!ok(lm)) return null;
  if (!visible(lm, LM.leftAnkle, LM.rightAnkle, LM.leftHip, LM.rightHip)) return null;
  const T = torso(lm);
  const la = lm[LM.leftAnkle]!;
  const ra = lm[LM.rightAnkle]!;
  if (ra.y - la.y > 0.12 * T) return "left"; // left ankle is higher
  if (la.y - ra.y > 0.12 * T) return "right";
  return null;
}

/**
 * Big starfish shape: arms flung wide + feet wider than hips.
 *
 * `relaxed` is the hysteresis mode for holds: once a hold has started, the
 * shape is judged against much looser thresholds so small drifts and landmark
 * jitter don't break it — only really coming out of the shape does.
 */
export function isStarfishShape(
  lm: NormalizedLandmark[] | undefined,
  { relaxed = false }: { relaxed?: boolean } = {},
): boolean {
  if (!ok(lm)) return false;
  const T = torso(lm);
  const armOut = relaxed ? 0.35 : 0.5;
  const feetRatio = relaxed ? 1.15 : 1.35;
  const wristSlack = relaxed ? 0.2 * T : 0; // wrists may sag a bit below the hips
  const lw = lm[LM.leftWrist]!;
  const rw = lm[LM.rightWrist]!;
  const ls = lm[LM.leftShoulder]!;
  const rs = lm[LM.rightShoulder]!;
  const lh = lm[LM.leftHip]!;
  const rh = lm[LM.rightHip]!;
  const la = lm[LM.leftAnkle]!;
  const ra = lm[LM.rightAnkle]!;
  const leftArmOut = Math.abs(lw.x - ls.x) > armOut * T && lw.y < lh.y + wristSlack;
  const rightArmOut = Math.abs(rw.x - rs.x) > armOut * T && rw.y < rh.y + wristSlack;
  const feetWide = Math.abs(la.x - ra.x) > Math.abs(lh.x - rh.x) * feetRatio;
  return leftArmOut && rightArmOut && feetWide;
}

/** Crouched like a seed: hips have dropped close to knee height. */
export function isCrouch(lm: NormalizedLandmark[] | undefined): boolean {
  if (!ok(lm)) return false;
  if (!visible(lm, LM.leftHip, LM.rightHip, LM.leftKnee, LM.rightKnee)) return false;
  const T = torso(lm);
  const hipY = (lm[LM.leftHip]!.y + lm[LM.rightHip]!.y) / 2;
  const kneeY = (lm[LM.leftKnee]!.y + lm[LM.rightKnee]!.y) / 2;
  return kneeY - hipY < 0.3 * T;
}

/** Tall tree: standing up straight with both hands reaching above the head. */
export function isTallTree(lm: NormalizedLandmark[] | undefined): boolean {
  if (!ok(lm)) return false;
  if (!visible(lm, LM.leftWrist, LM.rightWrist, LM.nose)) return false;
  const T = torso(lm);
  const hipY = (lm[LM.leftHip]!.y + lm[LM.rightHip]!.y) / 2;
  const kneeY = (lm[LM.leftKnee]!.y + lm[LM.rightKnee]!.y) / 2;
  const standing = kneeY - hipY > 0.55 * T;
  const noseY = lm[LM.nose]!.y;
  const armsUp = lm[LM.leftWrist]!.y < noseY && lm[LM.rightWrist]!.y < noseY;
  return standing && armsUp;
}

/* ------------------------------------------------------------------
   Personal bests — local only, per balance game + side.
   ------------------------------------------------------------------ */

const BESTS_KEY = "beat-buddy-balance-bests";

function loadBests(): Record<string, number> {
  try {
    return JSON.parse(localStorage.getItem(BESTS_KEY) ?? "{}");
  } catch {
    return {};
  }
}

export function getBest(key: string): number | null {
  return loadBests()[key] ?? null;
}

/** Records value if it beats the stored best; returns true when it's a new best. */
export function saveBest(key: string, value: number): boolean {
  const bests = loadBests();
  if ((bests[key] ?? 0) >= value) return false;
  bests[key] = value;
  try {
    localStorage.setItem(BESTS_KEY, JSON.stringify(bests));
  } catch {}
  return true;
}
