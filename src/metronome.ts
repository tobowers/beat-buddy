export type ScheduledBeat = {
  index: number;
  /** performance.now()-domain timestamp of this beat */
  perfTime: number;
};

/**
 * Web Audio metronome using a lookahead scheduler (setInterval only wakes the
 * scheduler; actual tick timing rides the AudioContext clock).
 *
 * The full beat schedule is computed up front and returned from start(), so
 * the scorer can match movement events against exact beat times.
 */
export class Metronome {
  private ctx: AudioContext | null = null;
  private interval: ReturnType<typeof setInterval> | null = null;
  private timeouts: ReturnType<typeof setTimeout>[] = [];

  start(opts: {
    bpm: number;
    totalBeats: number;
    /** beats-per-measure; beat 0 of each measure gets an accented tick */
    accentEvery: number;
    onBeat: (index: number, perfTime: number) => void;
  }): ScheduledBeat[] {
    this.stop();
    const ctx = new AudioContext();
    this.ctx = ctx;

    const spb = 60 / opts.bpm;
    const LEAD = 0.35; // give the context a moment to spin up
    const startAudio = ctx.currentTime + LEAD;
    const startPerf = performance.now() + LEAD * 1000;

    const beats: ScheduledBeat[] = Array.from({ length: opts.totalBeats }, (_, i) => ({
      index: i,
      perfTime: startPerf + i * spb * 1000,
    }));

    let next = 0;
    const schedule = () => {
      if (!this.ctx) return;
      while (next < opts.totalBeats && startAudio + next * spb < ctx.currentTime + 0.15) {
        const audioTime = startAudio + next * spb;
        this.tick(audioTime, next % opts.accentEvery === 0);
        const beat = beats[next]!;
        const delay = Math.max(0, beat.perfTime - performance.now());
        this.timeouts.push(setTimeout(() => opts.onBeat(beat.index, beat.perfTime), delay));
        next++;
      }
      if (next >= opts.totalBeats && this.interval) {
        clearInterval(this.interval);
        this.interval = null;
      }
    };
    this.interval = setInterval(schedule, 25);
    schedule();
    return beats;
  }

  private tick(when: number, accent: boolean) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = accent ? 988 : 660;
    gain.gain.setValueAtTime(0.0001, when);
    gain.gain.exponentialRampToValueAtTime(0.5, when + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.0001, when + 0.09);
    osc.connect(gain).connect(this.ctx.destination);
    osc.start(when);
    osc.stop(when + 0.12);
  }

  /** Soft two-note blip when the child lands a beat. */
  playHit() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    for (const [i, freq] of [1319, 1760].entries()) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "triangle";
      osc.frequency.value = freq;
      const start = t + i * 0.06;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.18, start + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.12);
      osc.connect(gain).connect(this.ctx.destination);
      osc.start(start);
      osc.stop(start + 0.15);
    }
  }

  stop() {
    if (this.interval) clearInterval(this.interval);
    this.interval = null;
    for (const t of this.timeouts) clearTimeout(t);
    this.timeouts = [];
    if (this.ctx) {
      this.ctx.close().catch(() => {});
      this.ctx = null;
    }
  }
}
