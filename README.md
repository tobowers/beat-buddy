# Beat Buddy 🥁

A browser-based metronome movement game for kids. Pick a rhythm pattern, stand in
front of the camera, and try to match the beat. MediaPipe Pose (running entirely
in the browser) checks whether the expected body movement happened near each beat,
and the app gives simple, forgiving feedback — beat hits and streaks, never "wrong".

## Games

- **Cross-Crawl March** — left hand to right knee, right hand to left knee, alternating
- **Starfish Cross** — big starfish shape, then opposite hand to knee
- **Clap-Knee** — clap, then opposite hand to knee

Each game has three settings: speed (50/60/75 BPM), round length (20/30/60s), and
feedback mode (Gentle / Score / Quiet).

## Run it

```sh
bun install
bun run dev     # http://localhost:4321 (hot reload)
```

Use Chrome/Edge/Safari with a webcam. The pose model (~5 MB) loads from Google's
CDN on first play.

## Privacy

Camera video stays on the device. The app uses the camera only to detect body
landmarks during the game — no video is saved or uploaded, no analytics, no audio
recording. Settings are stored in localStorage only.

## How it works

Full technical documentation lives at [`docs/index.html`](docs/index.html) — served
at [http://localhost:4321/docs](http://localhost:4321/docs) when the app is running.
In short:

- `src/metronome.ts` — Web Audio lookahead scheduler; returns the exact beat
  schedule so scoring can compare movement timestamps against beat timestamps
- `src/pose.ts` — MediaPipe PoseLandmarker singleton (GPU with CPU fallback) +
  skeleton drawing + full-body visibility check
- `src/detect.ts` — edge-triggered movement event detector (clap, opposite
  hand-to-knee, starfish) with hysteresis; thresholds scale with torso size
- `src/scorer.ts` — matches events to beats within a ±400 ms window (easy mode)
- `src/screens/` — Pick → Setup → Demo → Play → Result

```sh
bun test        # scorer + detector unit tests
```
