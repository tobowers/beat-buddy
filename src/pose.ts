import { FilesetResolver, PoseLandmarker } from "@mediapipe/tasks-vision";
import type { NormalizedLandmark } from "@mediapipe/tasks-vision";

export type { NormalizedLandmark };

// MediaPipe Pose landmark indices
export const LM = {
  nose: 0,
  leftShoulder: 11,
  rightShoulder: 12,
  leftElbow: 13,
  rightElbow: 14,
  leftWrist: 15,
  rightWrist: 16,
  leftHip: 23,
  rightHip: 24,
  leftKnee: 25,
  rightKnee: 26,
  leftAnkle: 27,
  rightAnkle: 28,
} as const;

const WASM_URL = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm";
const MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task";

let landmarkerPromise: Promise<PoseLandmarker> | null = null;

/** Singleton — the model download + wasm init is slow, do it once. */
export function getPoseLandmarker(): Promise<PoseLandmarker> {
  if (!landmarkerPromise) {
    landmarkerPromise = (async () => {
      const fileset = await FilesetResolver.forVisionTasks(WASM_URL);
      const make = (delegate: "GPU" | "CPU") =>
        PoseLandmarker.createFromOptions(fileset, {
          baseOptions: { modelAssetPath: MODEL_URL, delegate },
          runningMode: "VIDEO",
          numPoses: 1,
        });
      try {
        return await make("GPU");
      } catch {
        return await make("CPU");
      }
    })();
    landmarkerPromise.catch(() => {
      landmarkerPromise = null; // allow retry after a failed load
    });
  }
  return landmarkerPromise;
}

const BODY_CHECK = [
  LM.nose,
  LM.leftShoulder,
  LM.rightShoulder,
  LM.leftHip,
  LM.rightHip,
  LM.leftKnee,
  LM.rightKnee,
  LM.leftAnkle,
  LM.rightAnkle,
];

/** Rough "whole body fits in frame" check for the setup screen. */
export function fullBodyVisible(lm: NormalizedLandmark[] | undefined): boolean {
  if (!lm || lm.length < 33) return false;
  return BODY_CHECK.every((i) => {
    const p = lm[i]!;
    const vis = p.visibility ?? 1;
    return vis > 0.5 && p.x > 0.02 && p.x < 0.98 && p.y > 0.02 && p.y < 0.99;
  });
}

const CONNECTIONS: [number, number][] = [
  [LM.leftShoulder, LM.rightShoulder],
  [LM.leftShoulder, LM.leftElbow],
  [LM.leftElbow, LM.leftWrist],
  [LM.rightShoulder, LM.rightElbow],
  [LM.rightElbow, LM.rightWrist],
  [LM.leftShoulder, LM.leftHip],
  [LM.rightShoulder, LM.rightHip],
  [LM.leftHip, LM.rightHip],
  [LM.leftHip, LM.leftKnee],
  [LM.leftKnee, LM.leftAnkle],
  [LM.rightHip, LM.rightKnee],
  [LM.rightKnee, LM.rightAnkle],
];

const JOINTS = [
  LM.leftShoulder, LM.rightShoulder, LM.leftElbow, LM.rightElbow,
  LM.leftWrist, LM.rightWrist, LM.leftHip, LM.rightHip,
  LM.leftKnee, LM.rightKnee, LM.leftAnkle, LM.rightAnkle,
];

/**
 * Draw a chunky, friendly skeleton. The canvas is expected to be mirrored via
 * CSS along with the video, so we draw in raw (unmirrored) coordinates.
 */
export function drawSkeleton(
  ctx: CanvasRenderingContext2D,
  lm: NormalizedLandmark[],
  w: number,
  h: number,
  color: string,
) {
  ctx.clearRect(0, 0, w, h);
  ctx.lineWidth = Math.max(5, w / 110);
  ctx.lineCap = "round";
  ctx.strokeStyle = color;
  ctx.fillStyle = color;

  for (const [a, b] of CONNECTIONS) {
    const p = lm[a]!;
    const q = lm[b]!;
    if ((p.visibility ?? 1) < 0.4 || (q.visibility ?? 1) < 0.4) continue;
    ctx.beginPath();
    ctx.moveTo(p.x * w, p.y * h);
    ctx.lineTo(q.x * w, q.y * h);
    ctx.stroke();
  }
  for (const i of JOINTS) {
    const p = lm[i]!;
    if ((p.visibility ?? 1) < 0.4) continue;
    ctx.beginPath();
    ctx.arc(p.x * w, p.y * h, Math.max(4, w / 140), 0, Math.PI * 2);
    ctx.fill();
  }
  // head bubble
  const nose = lm[LM.nose]!;
  if ((nose.visibility ?? 1) >= 0.4) {
    ctx.beginPath();
    ctx.arc(nose.x * w, nose.y * h, Math.max(10, w / 40), 0, Math.PI * 2);
    ctx.lineWidth = Math.max(4, w / 160);
    ctx.stroke();
  }
}
