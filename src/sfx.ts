/** Tiny standalone sound effects for the balance games (no metronome needed). */

let ctx: AudioContext | null = null;

function ac(): AudioContext {
  if (!ctx) ctx = new AudioContext();
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
}

function tone(freq: number, start: number, durSec: number, vol: number, type: OscillatorType) {
  const c = ac();
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(vol, start + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + durSec);
  osc.connect(gain).connect(c.destination);
  osc.start(start);
  osc.stop(start + durSec + 0.05);
}

/** Short soft blip — a hold ended, a step completed. */
export function blip(freq = 880) {
  tone(freq, ac().currentTime, 0.12, 0.2, "triangle");
}

/** Clear single beep — used for eyes-closed counting in Night Tree. */
export function beep(freq = 660) {
  tone(freq, ac().currentTime, 0.18, 0.3, "sine");
}

/** Happy three-note chime — a challenge was completed. */
export function chime() {
  const t = ac().currentTime;
  tone(1047, t, 0.14, 0.22, "triangle");
  tone(1319, t + 0.09, 0.14, 0.22, "triangle");
  tone(1568, t + 0.18, 0.2, 0.22, "triangle");
}
