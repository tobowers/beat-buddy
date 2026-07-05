import React, { useEffect, useRef, useState } from "react";
import { getCameraStream } from "./camera";
import { getPoseLandmarker, drawSkeleton, toAnatomical, type NormalizedLandmark } from "./pose";

/**
 * Camera + pose loop + skeleton overlay in one component. Balance games put
 * their per-frame logic in `onFrame` (kept in a ref, so it can close over
 * fresh state) and render their HUD as children on top of the stage.
 */
export function CameraStage({
  onFrame,
  className = "",
  children,
}: {
  onFrame?: (lm: NormalizedLandmark[] | undefined, now: number) => void;
  className?: string;
  children?: React.ReactNode;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const onFrameRef = useRef(onFrame);
  onFrameRef.current = onFrame;
  const [status, setStatus] = useState<"loading" | "on" | "error">("loading");

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
      const loop = () => {
        if (cancelled) return;
        raf = requestAnimationFrame(loop);
        if (video.readyState < 2 || video.currentTime === lastTime) return;
        lastTime = video.currentTime;
        const now = performance.now();
        const result = landmarker.detectForVideo(video, now);
        const lm = toAnatomical(result.landmarks?.[0]);

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
      {children}
    </div>
  );
}
