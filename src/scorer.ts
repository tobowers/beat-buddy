import type { BeatResult, MovementEvent } from "./types";

export type BeatSpec = {
  index: number;
  perfTime: number;
  expected: MovementEvent;
};

/**
 * Matches detected movement events to scheduled beats. An event counts if the
 * expected movement lands within ±windowMs of its beat. Each event can only
 * satisfy one beat, matched to the nearest eligible one.
 */
export class Scorer {
  private results: Map<number, BeatResult>;

  constructor(
    private beats: BeatSpec[],
    private windowMs: number,
  ) {
    this.results = new Map(
      beats.map((b) => [
        b.index,
        { index: b.index, beatTime: b.perfTime, expected: b.expected, matched: false },
      ]),
    );
  }

  /** Returns the matched beat index, or null if the event matched nothing. */
  addEvent(type: MovementEvent, eventTime: number): number | null {
    let best: BeatSpec | null = null;
    let bestOffset = Infinity;
    for (const b of this.beats) {
      if (b.expected !== type) continue;
      if (this.results.get(b.index)!.matched) continue;
      const offset = Math.abs(eventTime - b.perfTime);
      if (offset <= this.windowMs && offset < bestOffset) {
        best = b;
        bestOffset = offset;
      }
    }
    if (!best) return null;
    const r = this.results.get(best.index)!;
    r.matched = true;
    r.eventTime = eventTime;
    r.offsetMs = Math.round(eventTime - best.perfTime);
    return best.index;
  }

  get hits(): number {
    let n = 0;
    for (const r of this.results.values()) if (r.matched) n++;
    return n;
  }

  get total(): number {
    return this.beats.length;
  }

  finalize(): { hits: number; total: number; bestStreak: number; results: BeatResult[] } {
    const ordered = [...this.results.values()].sort((a, b) => a.index - b.index);
    let best = 0;
    let run = 0;
    for (const r of ordered) {
      run = r.matched ? run + 1 : 0;
      best = Math.max(best, run);
    }
    return { hits: this.hits, total: this.total, bestStreak: best, results: ordered };
  }
}
