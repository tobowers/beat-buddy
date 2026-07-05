import React from "react";
import type { MovementEvent } from "./types";

export type FigurePose =
  | MovementEvent
  | "idle"
  | "TREE"
  | "SOCK"
  | "SEED"
  | "TALL_TREE";

type XY = [number, number];

/**
 * Joint positions in a 100x120 viewBox.
 * The figure is drawn MIRROR-STYLE: the child's LEFT hand is the limb on the
 * VIEWER'S left, so kids can copy it like a mirror.
 */
type Joints = {
  head: XY;
  neck: XY;
  sL: XY; eL: XY; wL: XY;
  sR: XY; eR: XY; wR: XY;
  hL: XY; kL: XY; aL: XY;
  hR: XY; kR: XY; aR: XY;
  touch?: XY;
};

const IDLE: Joints = {
  head: [50, 15], neck: [50, 28],
  sL: [37, 33], eL: [34, 47], wL: [32, 60],
  sR: [63, 33], eR: [66, 47], wR: [68, 60],
  hL: [43, 64], kL: [41, 87], aL: [40, 109],
  hR: [57, 64], kR: [59, 87], aR: [60, 109],
};

const POSES: Record<FigurePose, Joints> = {
  idle: IDLE,
  CLAP: {
    ...IDLE,
    eL: [30, 48], wL: [46, 42],
    eR: [70, 48], wR: [54, 42],
    touch: [50, 41],
  },
  // child's left hand crosses to raised right knee
  LEFT_HAND_RIGHT_KNEE: {
    ...IDLE,
    eL: [42, 50], wL: [56, 66],
    eR: [73, 40], wR: [82, 30],
    kR: [61, 72], aR: [66, 92],
    touch: [58, 68],
  },
  RIGHT_HAND_LEFT_KNEE: {
    ...IDLE,
    eR: [58, 50], wR: [44, 66],
    eL: [27, 40], wL: [18, 30],
    kL: [39, 72], aL: [34, 92],
    touch: [42, 68],
  },
  STARFISH: {
    ...IDLE,
    eL: [26, 22], wL: [14, 11],
    eR: [74, 22], wR: [86, 11],
    kL: [35, 86], aL: [26, 108],
    kR: [65, 86], aR: [74, 108],
  },
  // one-foot balance: right foot tucked to the standing leg, arms out
  TREE: {
    ...IDLE,
    eL: [26, 38], wL: [16, 26],
    eR: [74, 38], wR: [84, 26],
    kR: [66, 76], aR: [54, 84],
  },
  // reaching both hands to a lifted foot (sock on/off)
  SOCK: {
    ...IDLE,
    kR: [62, 66], aR: [68, 80],
    eL: [40, 52], wL: [64, 76],
    eR: [70, 54], wR: [70, 78],
    touch: [68, 79],
  },
  // crouched like a tiny seed
  SEED: {
    head: [50, 52], neck: [50, 63],
    sL: [39, 66], eL: [32, 78], wL: [42, 92],
    sR: [61, 66], eR: [68, 78], wR: [58, 92],
    hL: [44, 86], kL: [34, 88], aL: [38, 108],
    hR: [56, 86], kR: [66, 88], aR: [62, 108],
  },
  // grown tall: legs together, branches (arms) reaching up
  TALL_TREE: {
    ...IDLE,
    eL: [31, 18], wL: [40, 3],
    eR: [69, 18], wR: [60, 3],
    hL: [45, 64], kL: [45, 87], aL: [45, 109],
    hR: [55, 64], kR: [55, 87], aR: [55, 109],
  },
};

function pts(...points: XY[]): string {
  return points.map((p) => p.join(",")).join(" ");
}

export function Figure({
  pose,
  size = 130,
  ink = "var(--ink)",
  accent = "var(--sun)",
  pop = false,
}: {
  pose: FigurePose;
  size?: number;
  ink?: string;
  accent?: string;
  /** re-triggers the bounce animation when the pose changes */
  pop?: boolean;
}) {
  const j = POSES[pose];
  const hipMid: XY = [(j.hL[0] + j.hR[0]) / 2, (j.hL[1] + j.hR[1]) / 2];
  return (
    <svg
      viewBox="-6 -2 112 124"
      width={size}
      height={(size * 124) / 112}
      className={pop ? "figure-pop" : undefined}
      key={pop ? pose : undefined}
      aria-hidden
    >
      <g stroke={ink} strokeWidth={6.5} strokeLinecap="round" strokeLinejoin="round" fill="none">
        <line x1={j.neck[0]} y1={j.neck[1]} x2={hipMid[0]} y2={hipMid[1]} />
        <line x1={j.sL[0]} y1={j.sL[1]} x2={j.sR[0]} y2={j.sR[1]} />
        <line x1={j.hL[0]} y1={j.hL[1]} x2={j.hR[0]} y2={j.hR[1]} />
        <polyline points={pts(j.sL, j.eL, j.wL)} />
        <polyline points={pts(j.sR, j.eR, j.wR)} />
        <polyline points={pts(j.hL, j.kL, j.aL)} />
        <polyline points={pts(j.hR, j.kR, j.aR)} />
      </g>
      <circle cx={j.head[0]} cy={j.head[1]} r={11.5} fill={accent} stroke={ink} strokeWidth={3.5} />
      {/* face */}
      <circle cx={j.head[0] - 4} cy={j.head[1] - 1.5} r={1.6} fill={ink} />
      <circle cx={j.head[0] + 4} cy={j.head[1] - 1.5} r={1.6} fill={ink} />
      <path
        d={`M ${j.head[0] - 4.5} ${j.head[1] + 3.5} Q ${j.head[0]} ${j.head[1] + 8} ${j.head[0] + 4.5} ${j.head[1] + 3.5}`}
        stroke={ink}
        strokeWidth={2.2}
        strokeLinecap="round"
        fill="none"
      />
      {/* contact burst */}
      {j.touch && (
        <g className="figure-burst">
          <circle cx={j.touch[0]} cy={j.touch[1]} r={9} fill="none" stroke={accent} strokeWidth={3} strokeDasharray="4 5" />
        </g>
      )}
      {pose === "STARFISH" && (
        <g fill={accent} className="figure-burst">
          <circle cx={8} cy={4} r={3} />
          <circle cx={92} cy={4} r={3} />
          <circle cx={18} cy={116} r={3} />
          <circle cx={82} cy={116} r={3} />
        </g>
      )}
    </svg>
  );
}

/** Row of chunky beat dots; the active one pops. */
export function BeatDots({
  count,
  active,
  color = "var(--coral)",
}: {
  count: number;
  active: number;
  color?: string;
}) {
  return (
    <div className="beat-dots" aria-hidden>
      {Array.from({ length: count }, (_, i) => (
        <span
          key={i}
          className={`beat-dot${i === active ? " on" : ""}`}
          style={i === active ? { background: color } : undefined}
        />
      ))}
    </div>
  );
}
