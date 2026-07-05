import { test, expect } from "bun:test";
import { footLifted, isCrouch, isTallTree, isStarfishShape } from "./balance";
import type { NormalizedLandmark } from "./pose";

/** Standing pose (same base as detect.test.ts) with overrides. */
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

test("standing on both feet: no foot lifted", () => {
  expect(footLifted(frame())).toBeNull();
  expect(footLifted(undefined)).toBeNull();
});

test("raised left ankle reads as left foot lifted", () => {
  expect(footLifted(frame({ 27: { x: 0.42, y: 0.82 } }))).toBe("left");
});

test("raised right ankle reads as right foot lifted", () => {
  expect(footLifted(frame({ 28: { x: 0.58, y: 0.82 } }))).toBe("right");
});

test("standing straight is not a crouch", () => {
  expect(isCrouch(frame())).toBe(false);
});

test("hips dropped to knee height is a crouch", () => {
  expect(isCrouch(frame({ 23: { x: 0.44, y: 0.72 }, 24: { x: 0.56, y: 0.72 } }))).toBe(true);
});

test("standing with arms down is not a tall tree", () => {
  expect(isTallTree(frame())).toBe(false);
});

test("standing with both hands above the head is a tall tree", () => {
  expect(
    isTallTree(frame({ 15: { x: 0.45, y: 0.05 }, 16: { x: 0.55, y: 0.05 } })),
  ).toBe(true);
});

test("crouching with hands up is not a tall tree", () => {
  expect(
    isTallTree(
      frame({
        15: { x: 0.45, y: 0.05 },
        16: { x: 0.55, y: 0.05 },
        23: { x: 0.44, y: 0.72 },
        24: { x: 0.56, y: 0.72 },
      }),
    ),
  ).toBe(false);
});

test("arms and legs wide is a starfish shape", () => {
  const star = frame({
    15: { x: 0.1, y: 0.2 },
    16: { x: 0.9, y: 0.2 },
    27: { x: 0.3, y: 0.95 },
    28: { x: 0.7, y: 0.95 },
  });
  expect(isStarfishShape(star)).toBe(true);
  expect(isStarfishShape(frame())).toBe(false);
});
