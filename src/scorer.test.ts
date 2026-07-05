import { test, expect } from "bun:test";
import { Scorer, type BeatSpec } from "./scorer";

const beats: BeatSpec[] = [
  { index: 0, perfTime: 1000, expected: "LEFT_HAND_RIGHT_KNEE" },
  { index: 1, perfTime: 2000, expected: "RIGHT_HAND_LEFT_KNEE" },
  { index: 2, perfTime: 3000, expected: "LEFT_HAND_RIGHT_KNEE" },
  { index: 3, perfTime: 4000, expected: "RIGHT_HAND_LEFT_KNEE" },
];

test("event inside the window matches its beat", () => {
  const s = new Scorer(beats, 400);
  expect(s.addEvent("LEFT_HAND_RIGHT_KNEE", 1150)).toBe(0);
  expect(s.hits).toBe(1);
});

test("event outside the window matches nothing", () => {
  const s = new Scorer(beats, 400);
  expect(s.addEvent("LEFT_HAND_RIGHT_KNEE", 1500)).toBeNull();
  expect(s.hits).toBe(0);
});

test("wrong movement type does not match", () => {
  const s = new Scorer(beats, 400);
  expect(s.addEvent("CLAP", 1000)).toBeNull();
});

test("each beat can only be matched once", () => {
  const s = new Scorer(beats, 400);
  expect(s.addEvent("LEFT_HAND_RIGHT_KNEE", 1000)).toBe(0);
  expect(s.addEvent("LEFT_HAND_RIGHT_KNEE", 1100)).toBeNull(); // beat 2 is too far away
  expect(s.hits).toBe(1);
});

test("event matches the nearest eligible beat", () => {
  const s = new Scorer(beats, 400);
  expect(s.addEvent("LEFT_HAND_RIGHT_KNEE", 2900)).toBe(2);
});

test("early events (before the beat) still count", () => {
  const s = new Scorer(beats, 400);
  expect(s.addEvent("RIGHT_HAND_LEFT_KNEE", 1700)).toBe(1);
});

test("finalize reports hits, total, and best streak", () => {
  const s = new Scorer(beats, 400);
  s.addEvent("LEFT_HAND_RIGHT_KNEE", 1000);
  s.addEvent("RIGHT_HAND_LEFT_KNEE", 2100);
  s.addEvent("RIGHT_HAND_LEFT_KNEE", 4050); // beat 2 missed
  const r = s.finalize();
  expect(r.hits).toBe(3);
  expect(r.total).toBe(4);
  expect(r.bestStreak).toBe(2);
  expect(r.results[2]!.matched).toBe(false);
  expect(r.results[1]!.offsetMs).toBe(100);
});
