let stream: MediaStream | null = null;

/** Shared camera stream so we don't re-prompt / flicker between screens. */
export async function getCameraStream(): Promise<MediaStream> {
  if (stream && stream.getVideoTracks().some((t) => t.readyState === "live")) {
    return stream;
  }
  stream = await navigator.mediaDevices.getUserMedia({
    video: { width: { ideal: 960 }, height: { ideal: 720 }, facingMode: "user" },
    audio: false,
  });
  return stream;
}

export function stopCamera() {
  if (stream) {
    for (const track of stream.getTracks()) track.stop();
    stream = null;
  }
}
