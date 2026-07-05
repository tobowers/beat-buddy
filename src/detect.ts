import { LM, type NormalizedLandmark } from "./pose";
import type { MovementEvent } from "./types";

type Pt = { x: number; y: number };

function dist(a: Pt, b: Pt): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

/**
 * Self-hug: each wrist wrapped to the opposite shoulder. Used as the
 * hands-free "start the round" gesture — distinct from every game move.
 */
export function isHug(lm: NormalizedLandmark[] | undefined): boolean {
  if (!lm || lm.length < 33) return false;
  const ls = lm[LM.leftShoulder]!;
  const rs = lm[LM.rightShoulder]!;
  const lh = lm[LM.leftHip]!;
  const rh = lm[LM.rightHip]!;
  const lw = lm[LM.leftWrist]!;
  const rw = lm[LM.rightWrist]!;
  const torso = (dist(ls, lh) + dist(rs, rh)) / 2;
  if (torso < 0.05) return false;
  return dist(lw, rs) < 0.4 * torso && dist(rw, ls) < 0.4 * torso;
}

/**
 * Edge-triggered movement event detector with hysteresis.
 *
 * Each event fires once when its condition becomes true, then re-arms only
 * after the condition clearly releases (wider exit threshold), so holding a
 * pose doesn't spam events. All distance thresholds are scaled by torso
 * length so it works at any distance from the camera.
 */
export class EventDetector {
  private armed: Record<MovementEvent, boolean> = {
    CLAP: true,
    LEFT_HAND_RIGHT_KNEE: true,
    RIGHT_HAND_LEFT_KNEE: true,
    STARFISH: true,
  };
  private lastFired: Record<MovementEvent, number> = {
    CLAP: -1e9,
    LEFT_HAND_RIGHT_KNEE: -1e9,
    RIGHT_HAND_LEFT_KNEE: -1e9,
    STARFISH: -1e9,
  };
  private static REFRACTORY_MS = 300;

  /** Feed one frame of landmarks; returns events that fired this frame. */
  update(lm: NormalizedLandmark[], now: number): MovementEvent[] {
    if (!lm || lm.length < 33) return [];

    const ls = lm[LM.leftShoulder]!;
    const rs = lm[LM.rightShoulder]!;
    const lh = lm[LM.leftHip]!;
    const rh = lm[LM.rightHip]!;
    const lw = lm[LM.leftWrist]!;
    const rw = lm[LM.rightWrist]!;
    const lk = lm[LM.leftKnee]!;
    const rk = lm[LM.rightKnee]!;
    const la = lm[LM.leftAnkle]!;
    const ra = lm[LM.rightAnkle]!;

    const torso = (dist(ls, lh) + dist(rs, rh)) / 2;
    if (torso < 0.05) return []; // person too small / bogus frame

    const fired: MovementEvent[] = [];
    const check = (ev: MovementEvent, entered: boolean, released: boolean) => {
      if (this.armed[ev] && entered && now - this.lastFired[ev] > EventDetector.REFRACTORY_MS) {
        this.armed[ev] = false;
        this.lastFired[ev] = now;
        fired.push(ev);
      } else if (!this.armed[ev] && released) {
        this.armed[ev] = true;
      }
    };

    // --- opposite hand to knee ---
    const lwrk = dist(lw, rk) / torso;
    check("LEFT_HAND_RIGHT_KNEE", lwrk < 0.45, lwrk > 0.7);

    const rwlk = dist(rw, lk) / torso;
    check("RIGHT_HAND_LEFT_KNEE", rwlk < 0.45, rwlk > 0.7);

    // --- clap: wrists snap together in front of the torso ---
    const wristGap = dist(lw, rw) / torso;
    const shoulderY = Math.min(ls.y, rs.y);
    const hipY = Math.max(lh.y, rh.y);
    const midY = (lw.y + rw.y) / 2;
    const atChest = midY > shoulderY - 0.3 * torso && midY < hipY + 0.15 * torso;
    check("CLAP", wristGap < 0.32 && atChest, wristGap > 0.55);

    // --- starfish: arms flung wide + feet wider than hips ---
    const leftArmOut = Math.abs(lw.x - ls.x) > 0.5 * torso && lw.y < lh.y;
    const rightArmOut = Math.abs(rw.x - rs.x) > 0.5 * torso && rw.y < rh.y;
    const feetWide = Math.abs(la.x - ra.x) > Math.abs(lh.x - rh.x) * 1.35;
    const isStar = leftArmOut && rightArmOut && feetWide;
    check("STARFISH", isStar, !leftArmOut || !rightArmOut);

    return fired;
  }
}
