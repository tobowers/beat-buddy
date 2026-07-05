import { test, expect } from "bun:test";
import { EventDetector } from "./detect";
import type { NormalizedLandmark } from "./pose";

/** Build a full 33-landmark frame from a base standing pose, with overrides. */
function frame(overrides: Record<number, { x: number; y: number }> = {}): NormalizedLandmark[] {
  const lm: NormalizedLandmark[] = Array.from({ length: 33 }, () => ({
    x: 0.5,
    y: 0.5,
    z: 0,
    visibility: 1,
  }));
  const base: Record<number, { x: number; y: number }> = {
    0: { x: 0.5, y: 0.1 }, // nose
    11: { x: 0.4, y: 0.3 }, // shoulders
    12: { x: 0.6, y: 0.3 },
    13: { x: 0.38, y: 0.42 }, // elbows
    14: { x: 0.62, y: 0.42 },
    15: { x: 0.36, y: 0.55 }, // wrists
    16: { x: 0.64, y: 0.55 },
    23: { x: 0.44, y: 0.6 }, // hips
    24: { x: 0.56, y: 0.6 },
    25: { x: 0.43, y: 0.78 }, // knees
    26: { x: 0.57, y: 0.78 },
    27: { x: 0.42, y: 0.95 }, // ankles
    28: { x: 0.58, y: 0.95 },
  };
  for (const [i, p] of Object.entries({ ...base, ...overrides })) {
    lm[Number(i)] = { x: p.x, y: p.y, z: 0, visibility: 1 };
  }
  return lm;
}

test("standing still fires nothing", () => {
  const d = new EventDetector();
  expect(d.update(frame(), 0)).toEqual([]);
  expect(d.update(frame(), 100)).toEqual([]);
});

test("left hand to right knee fires once, then re-arms after release", () => {
  const d = new EventDetector();
  d.update(frame(), 0);
  // left wrist (15) moves onto right knee (26)
  const touching = frame({ 15: { x: 0.57, y: 0.77 } });
  expect(d.update(touching, 500)).toEqual(["LEFT_HAND_RIGHT_KNEE"]);
  // holding the pose does not re-fire
  expect(d.update(touching, 600)).toEqual([]);
  // release, then touch again -> fires again
  d.update(frame(), 1200);
  expect(d.update(touching, 1800)).toEqual(["LEFT_HAND_RIGHT_KNEE"]);
});

test("clap fires when wrists snap together at chest height", () => {
  const d = new EventDetector();
  d.update(frame(), 0);
  const clap = frame({ 15: { x: 0.49, y: 0.45 }, 16: { x: 0.51, y: 0.45 } });
  expect(d.update(clap, 400)).toEqual(["CLAP"]);
  expect(d.update(clap, 500)).toEqual([]);
});

test("hands together overhead is not a clap", () => {
  const d = new EventDetector();
  d.update(frame(), 0);
  const overhead = frame({ 15: { x: 0.49, y: 0.05 }, 16: { x: 0.51, y: 0.05 } });
  expect(d.update(overhead, 400)).toEqual([]);
});

test("starfish fires when arms and legs go wide", () => {
  const d = new EventDetector();
  d.update(frame(), 0);
  const star = frame({
    15: { x: 0.1, y: 0.2 },
    16: { x: 0.9, y: 0.2 },
    13: { x: 0.25, y: 0.25 },
    14: { x: 0.75, y: 0.25 },
    27: { x: 0.3, y: 0.95 },
    28: { x: 0.7, y: 0.95 },
  });
  expect(d.update(star, 400)).toEqual(["STARFISH"]);
  expect(d.update(star, 500)).toEqual([]);
});
