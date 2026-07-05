import React, { useEffect, useRef, useState } from "react";
import { getCameraStream } from "./camera";
import { getPoseLandmarker, drawSkeleton, type NormalizedLandmark } from "./pose";
import { isHug } from "./detect";
import { Figure } from "./Figure";
import { chime } from "./sfx";

/**
 * Camera + pose loop + skeleton overlay in one component. Balance games put
 * their per-frame logic in `onFrame` (kept in a ref, so it can close over
 * fresh state) and render their HUD as children on top of the stage.
 *
 * With `hugStart`, the stage waits behind a "give yourself a big hug"
 * overlay (same gesture as the beat rounds) and only starts calling
 * `onFrame` once the hug is held — so the child can start from position.
 */
export function CameraStage({
  onFrame,
  hugStart,
  className = "",
  children,
}: {
  onFrame?: (lm: NormalizedLandmark[] | undefined, now: number) => void;
  hugStart?: { accent?: string; onStart?: () => void };
  className?: string;
  children?: React.ReactNode;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const onFrameRef = useRef(onFrame);
  onFrameRef.current = onFrame;
  const onStartRef = useRef(hugStart?.onStart);
  onStartRef.current = hugStart?.onStart;
  const [status, setStatus] = useState<"loading" | "on" | "error">("loading");
  const [waiting, setWaiting] = useState(!!hugStart);
  const waitingRef = useRef(waiting);

  const start = () => {
    if (!waitingRef.current) return;
    waitingRef.current = false;
    setWaiting(false);
    chime();
    onStartRef.current?.();
  };

  useEffect(() => {
    let cancelled = false;
    let raf = 0;
    (async () => {
      const [stream, landmarker] = await Promise.all([getCameraStream(), getPoseLandmarker()]);
      if (cancelled) return;
      const video = videoRef.current!;
      video.srcObject = stream;
      await video.play();
      if (cancelled) return;
      setStatus("on");

      let lastTime = -1;
      let hugSince: number | null = null;
      const loop = () => {
        if (cancelled) return;
        raf = requestAnimationFrame(loop);
        if (video.readyState < 2 || video.currentTime === lastTime) return;
        lastTime = video.currentTime;
        const now = performance.now();
        const result = landmarker.detectForVideo(video, now);
        const lm = result.landmarks?.[0];

        const canvas = canvasRef.current;
        if (canvas && video.videoWidth) {
          if (canvas.width !== video.videoWidth) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
          }
          const ctx = canvas.getContext("2d")!;
          if (lm) drawSkeleton(ctx, lm, canvas.width, canvas.height, "rgba(255,253,248,0.9)");
          else ctx.clearRect(0, 0, canvas.width, canvas.height);
        }

        if (waitingRef.current) {
          // hold the hug briefly so a passing arm-cross doesn't trigger it
          if (isHug(lm)) {
            if (hugSince === null) hugSince = now;
            else if (now - hugSince > 600) start();
          } else {
            hugSince = null;
          }
          return;
        }
        onFrameRef.current?.(lm, now);
      };
      loop();
    })().catch((err) => {
      console.error(err);
      if (!cancelled) setStatus("error");
    });
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div className={`play-stage ${className}`}>
      <video ref={videoRef} className="mirrored play-video" playsInline muted />
      <canvas ref={canvasRef} className="mirrored play-overlay" />
      {status === "loading" && <div className="cam-status">Waking up the camera…</div>}
      {status === "error" && (
        <div className="cam-status">Camera trouble — a grown-up may need to allow it, then refresh.</div>
      )}
      {status === "on" && waiting && (
        <div className="hug-wait">
          <Figure pose="HUG" size={130} accent={hugStart?.accent ?? "var(--sun)"} pop />
          <p className="hug-wait-label">Give yourself a big hug to start!</p>
          <button className="btn hug-wait-btn" onClick={start}>
            or tap here
          </button>
        </div>
      )}
      {children}
    </div>
  );
}
