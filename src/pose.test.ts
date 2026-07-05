import { test, expect } from "bun:test";
import { toAnatomical, LM, type NormalizedLandmark } from "./pose";

function frame(): NormalizedLandmark[] {
  return Array.from({ length: 33 }, (_, i) => ({
    x: i / 100,
    y: 0.5,
    z: 0,
    visibility: 1,
  }));
}

test("toAnatomical swaps every left/right landmark pair", () => {
  const raw = frame();
  const lm = toAnatomical(raw)!;
  expect(lm[LM.leftWrist]).toBe(raw[LM.rightWrist]!);
  expect(lm[LM.rightWrist]).toBe(raw[LM.leftWrist]!);
  expect(lm[LM.leftShoulder]).toBe(raw[LM.rightShoulder]!);
  expect(lm[LM.leftHip]).toBe(raw[LM.rightHip]!);
  expect(lm[LM.leftKnee]).toBe(raw[LM.rightKnee]!);
  expect(lm[LM.leftAnkle]).toBe(raw[LM.rightAnkle]!);
});

test("toAnatomical keeps midline landmarks and passes through bad input", () => {
  const raw = frame();
  const lm = toAnatomical(raw)!;
  expect(lm[LM.nose]).toBe(raw[LM.nose]!);
  expect(toAnatomical(undefined)).toBeUndefined();
});

test("toAnatomical does not mutate the input array", () => {
  const raw = frame();
  const original15 = raw[15]!;
  toAnatomical(raw);
  expect(raw[15]).toBe(original15);
});
