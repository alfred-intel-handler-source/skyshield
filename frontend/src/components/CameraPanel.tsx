import { useRef, useEffect, useCallback } from "react";
import type { TrackData } from "../types";

interface Props {
  track: TrackData;
  onClose: () => void;
}

const CANVAS_W = 640;
const CANVAS_H = 480;
const RETICLE_COLOR = "#3fb95088";
const HUD_COLOR = "#3fb950";

function calcRange(x: number, y: number): number {
  return Math.sqrt(x * x + y * y);
}

function calcBearing(x: number, y: number): number {
  // Bearing from origin (base) to target, 0=N, clockwise
  const rad = Math.atan2(x, -y);
  return ((rad * 180) / Math.PI + 360) % 360;
}

/** Noise density factor from 0 (clear) to 1 (heavy) based on range */
function noiseFactor(rangeKm: number): number {
  if (rangeKm < 0.3) return 0.05;
  if (rangeKm < 0.8) return 0.25;
  if (rangeKm < 1.5) return 0.55;
  return 0.8;
}

/** Silhouette scale factor — closer = bigger */
function silhouetteScale(rangeKm: number): number {
  if (rangeKm < 0.15) return 2.5;
  if (rangeKm < 0.3) return 2.0;
  if (rangeKm < 0.5) return 1.5;
  if (rangeKm < 0.8) return 1.0;
  if (rangeKm < 1.5) return 0.6;
  return 0.35;
}

// ---------------------------------------------------------------------------
// Silhouette drawing helpers
// ---------------------------------------------------------------------------

function drawCommercialQuad(ctx: CanvasRenderingContext2D, s: number) {
  const armLen = 28 * s;
  const rotorR = 8 * s;
  const bodyW = 12 * s;
  const bodyH = 8 * s;

  ctx.fillRect(-bodyW / 2, -bodyH / 2, bodyW, bodyH);

  const angles = [Math.PI / 4, (3 * Math.PI) / 4, (5 * Math.PI) / 4, (7 * Math.PI) / 4];
  for (const a of angles) {
    const ex = Math.cos(a) * armLen;
    const ey = Math.sin(a) * armLen;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(ex, ey);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(ex, ey, rotorR, 0, Math.PI * 2);
    ctx.stroke();
  }
}

function drawFixedWing(ctx: CanvasRenderingContext2D, s: number) {
  // Fuselage
  const fuseL = 40 * s;
  const fuseW = 6 * s;
  ctx.fillRect(-fuseL / 2, -fuseW / 2, fuseL, fuseW);

  // Wings (swept)
  ctx.beginPath();
  ctx.moveTo(-4 * s, 0);
  ctx.lineTo(-22 * s, -28 * s);
  ctx.lineTo(-16 * s, -28 * s);
  ctx.lineTo(4 * s, 0);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(-4 * s, 0);
  ctx.lineTo(-22 * s, 28 * s);
  ctx.lineTo(-16 * s, 28 * s);
  ctx.lineTo(4 * s, 0);
  ctx.closePath();
  ctx.fill();

  // Tail
  ctx.beginPath();
  ctx.moveTo(-fuseL / 2, 0);
  ctx.lineTo(-fuseL / 2 - 6 * s, -10 * s);
  ctx.lineTo(-fuseL / 2 - 3 * s, -10 * s);
  ctx.lineTo(-fuseL / 2 + 2 * s, 0);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(-fuseL / 2, 0);
  ctx.lineTo(-fuseL / 2 - 6 * s, 10 * s);
  ctx.lineTo(-fuseL / 2 - 3 * s, 10 * s);
  ctx.lineTo(-fuseL / 2 + 2 * s, 0);
  ctx.closePath();
  ctx.fill();
}

function drawMicro(ctx: CanvasRenderingContext2D, s: number) {
  const armLen = 14 * s;
  const rotorR = 4 * s;
  const bodyR = 4 * s;

  ctx.beginPath();
  ctx.arc(0, 0, bodyR, 0, Math.PI * 2);
  ctx.fill();

  const angles = [Math.PI / 4, (3 * Math.PI) / 4, (5 * Math.PI) / 4, (7 * Math.PI) / 4];
  for (const a of angles) {
    const ex = Math.cos(a) * armLen;
    const ey = Math.sin(a) * armLen;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(ex, ey);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(ex, ey, rotorR, 0, Math.PI * 2);
    ctx.stroke();
  }
}

function drawBird(ctx: CanvasRenderingContext2D, s: number) {
  // Body
  ctx.beginPath();
  ctx.ellipse(0, 0, 18 * s, 8 * s, 0, 0, Math.PI * 2);
  ctx.fill();

  // Head
  ctx.beginPath();
  ctx.arc(20 * s, -2 * s, 5 * s, 0, Math.PI * 2);
  ctx.fill();

  // Left wing (arched)
  ctx.beginPath();
  ctx.moveTo(-4 * s, -6 * s);
  ctx.quadraticCurveTo(-12 * s, -34 * s, -28 * s, -18 * s);
  ctx.lineTo(-8 * s, -6 * s);
  ctx.closePath();
  ctx.fill();

  // Right wing
  ctx.beginPath();
  ctx.moveTo(-4 * s, 6 * s);
  ctx.quadraticCurveTo(-12 * s, 34 * s, -28 * s, 18 * s);
  ctx.lineTo(-8 * s, 6 * s);
  ctx.closePath();
  ctx.fill();
}

function drawBalloon(ctx: CanvasRenderingContext2D, s: number) {
  // Balloon envelope
  ctx.beginPath();
  ctx.ellipse(0, -14 * s, 20 * s, 26 * s, 0, 0, Math.PI * 2);
  ctx.fill();

  // Tether
  ctx.beginPath();
  ctx.moveTo(0, 12 * s);
  ctx.lineTo(0, 36 * s);
  ctx.stroke();

  // Payload box
  ctx.fillRect(-6 * s, 36 * s, 12 * s, 8 * s);
}

function drawImprovised(ctx: CanvasRenderingContext2D, s: number) {
  // Irregular hexagon
  ctx.beginPath();
  const pts: [number, number][] = [
    [12 * s, -4 * s],
    [8 * s, -16 * s],
    [-6 * s, -14 * s],
    [-16 * s, -2 * s],
    [-10 * s, 12 * s],
    [6 * s, 14 * s],
  ];
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
  ctx.closePath();
  ctx.fill();

  // Asymmetric protrusions
  ctx.fillRect(12 * s, -8 * s, 10 * s, 4 * s);
  ctx.fillRect(-16 * s, 4 * s, 8 * s, 3 * s);
  ctx.fillRect(-2 * s, 14 * s, 5 * s, 9 * s);
}

function drawUnknownBlob(ctx: CanvasRenderingContext2D, s: number) {
  ctx.beginPath();
  ctx.ellipse(0, 0, 16 * s, 12 * s, 0.3, 0, Math.PI * 2);
  ctx.fill();
}

function drawSilhouette(
  ctx: CanvasRenderingContext2D,
  classification: string | null,
  scale: number,
) {
  ctx.fillStyle = "rgba(230,230,230,0.9)";
  ctx.strokeStyle = "rgba(230,230,230,0.9)";
  ctx.lineWidth = Math.max(1, 1.5 * scale);

  switch (classification) {
    case "commercial_quad":
      drawCommercialQuad(ctx, scale);
      break;
    case "fixed_wing":
      drawFixedWing(ctx, scale);
      break;
    case "micro":
      drawMicro(ctx, scale);
      break;
    case "bird":
      drawBird(ctx, scale);
      break;
    case "weather_balloon":
      drawBalloon(ctx, scale);
      break;
    case "improvised":
      drawImprovised(ctx, scale);
      break;
    default:
      drawUnknownBlob(ctx, scale);
      break;
  }
}

// ---------------------------------------------------------------------------
// Reticle
// ---------------------------------------------------------------------------

function drawReticle(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const cx = w / 2;
  const cy = h / 2;
  const gap = 18;
  const lineLen = 60;
  const tickSpacing = 15;
  const tickSize = 4;

  ctx.strokeStyle = RETICLE_COLOR;
  ctx.lineWidth = 1;

  // Crosshair lines with gap
  // Horizontal
  ctx.beginPath();
  ctx.moveTo(cx - lineLen, cy);
  ctx.lineTo(cx - gap, cy);
  ctx.moveTo(cx + gap, cy);
  ctx.lineTo(cx + lineLen, cy);
  // Vertical
  ctx.moveTo(cx, cy - lineLen);
  ctx.lineTo(cx, cy - gap);
  ctx.moveTo(cx, cy + gap);
  ctx.lineTo(cx, cy + lineLen);
  ctx.stroke();

  // Tick marks along crosshairs
  for (let d = tickSpacing; d <= lineLen; d += tickSpacing) {
    // Horizontal ticks
    ctx.beginPath();
    ctx.moveTo(cx - d, cy - tickSize);
    ctx.lineTo(cx - d, cy + tickSize);
    ctx.moveTo(cx + d, cy - tickSize);
    ctx.lineTo(cx + d, cy + tickSize);
    // Vertical ticks
    ctx.moveTo(cx - tickSize, cy - d);
    ctx.lineTo(cx + tickSize, cy - d);
    ctx.moveTo(cx - tickSize, cy + d);
    ctx.lineTo(cx + tickSize, cy + d);
    ctx.stroke();
  }

  // Corner brackets
  const boxHalf = 80;
  const bracketLen = 20;

  const corners: [number, number, number, number][] = [
    [-1, -1, cx - boxHalf, cy - boxHalf],
    [1, -1, cx + boxHalf, cy - boxHalf],
    [-1, 1, cx - boxHalf, cy + boxHalf],
    [1, 1, cx + boxHalf, cy + boxHalf],
  ];

  ctx.lineWidth = 1.5;
  for (const [dx, dy, bx, by] of corners) {
    ctx.beginPath();
    ctx.moveTo(bx, by + dy * -bracketLen);
    ctx.lineTo(bx, by);
    ctx.lineTo(bx + dx * bracketLen, by);
    ctx.stroke();
  }
}

// ---------------------------------------------------------------------------
// Noise
// ---------------------------------------------------------------------------

function drawNoise(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  density: number,
) {
  const count = Math.floor(w * h * density * 0.003);
  ctx.fillStyle = "rgba(180,200,180,0.12)";
  for (let i = 0; i < count; i++) {
    const px = Math.random() * w;
    const py = Math.random() * h;
    const sz = Math.random() < 0.3 ? 2 : 1;
    ctx.fillRect(px, py, sz, sz);
  }

  // Occasional scanlines
  if (density > 0.2) {
    const lineCount = Math.floor(density * 8);
    ctx.strokeStyle = `rgba(160,200,160,${0.03 * density})`;
    ctx.lineWidth = 1;
    for (let i = 0; i < lineCount; i++) {
      const ly = Math.random() * h;
      ctx.beginPath();
      ctx.moveTo(0, ly);
      ctx.lineTo(w, ly);
      ctx.stroke();
    }
  }
}

// ---------------------------------------------------------------------------
// Background gradient (thermal sky)
// ---------------------------------------------------------------------------

function drawBackground(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, "#0c0e10");
  grad.addColorStop(0.5, "#15191d");
  grad.addColorStop(1, "#1c2228");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function CameraPanel({ track, onClose }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;

    const rangeKm = calcRange(track.x, track.y);
    const noise = noiseFactor(rangeKm);
    const scale = silhouetteScale(rangeKm);

    // Jitter
    const jx = (Math.random() - 0.5) * 3;
    const jy = (Math.random() - 0.5) * 3;

    // Clear
    drawBackground(ctx, w, h);

    // Silhouette
    ctx.save();
    ctx.translate(w / 2 + jx, h / 2 + jy);

    // At long range blur the silhouette via shadow
    if (rangeKm > 0.8) {
      ctx.shadowColor = "rgba(200,210,200,0.5)";
      ctx.shadowBlur = 12;
    } else if (rangeKm > 0.3) {
      ctx.shadowColor = "rgba(200,210,200,0.3)";
      ctx.shadowBlur = 5;
    }

    drawSilhouette(ctx, track.classification, scale);
    ctx.restore();

    // Noise overlay
    drawNoise(ctx, w, h, noise);

    // Reticle
    drawReticle(ctx, w, h);

    rafRef.current = requestAnimationFrame(draw);
  }, [track]);

  useEffect(() => {
    rafRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafRef.current);
  }, [draw]);

  const rangeKm = calcRange(track.x, track.y);
  const bearingDeg = calcBearing(track.x, track.y);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        background: "rgba(0,0,0,0.85)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          background: "#0d1117",
          border: "1px solid #30363d",
          borderRadius: 6,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          maxWidth: "95vw",
          maxHeight: "95vh",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "8px 14px",
            background: "#161b22",
            borderBottom: "1px solid #30363d",
          }}
        >
          <span
            style={{
              fontFamily: "monospace",
              fontSize: 13,
              color: HUD_COLOR,
              letterSpacing: 1.5,
              fontWeight: 600,
            }}
          >
            EO/IR CAMERA FEED
          </span>
          <span
            style={{
              fontFamily: "monospace",
              fontSize: 12,
              color: "#8b949e",
            }}
          >
            TGT: {track.id.toUpperCase()}
          </span>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "1px solid #30363d",
              color: "#8b949e",
              cursor: "pointer",
              fontFamily: "monospace",
              fontSize: 14,
              padding: "2px 8px",
              borderRadius: 4,
              lineHeight: 1,
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color = "#f85149";
              (e.currentTarget as HTMLButtonElement).style.borderColor = "#f85149";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color = "#8b949e";
              (e.currentTarget as HTMLButtonElement).style.borderColor = "#30363d";
            }}
          >
            X
          </button>
        </div>

        {/* Viewport */}
        <div
          style={{
            position: "relative",
            width: CANVAS_W,
            height: CANVAS_H,
          }}
        >
          <canvas
            ref={canvasRef}
            width={CANVAS_W}
            height={CANVAS_H}
            style={{ display: "block", width: CANVAS_W, height: CANVAS_H }}
          />

          {/* HUD Overlay */}
          {/* Top-left */}
          <span
            style={{
              position: "absolute",
              top: 10,
              left: 12,
              fontFamily: "monospace",
              fontSize: 11,
              color: HUD_COLOR,
              textShadow: "0 0 6px rgba(63,185,80,0.5)",
              pointerEvents: "none",
            }}
          >
            TGT: {track.id.toUpperCase()}
          </span>

          {/* Top-right */}
          <span
            style={{
              position: "absolute",
              top: 10,
              right: 12,
              fontFamily: "monospace",
              fontSize: 11,
              color: HUD_COLOR,
              textShadow: "0 0 6px rgba(63,185,80,0.5)",
              pointerEvents: "none",
            }}
          >
            RNG: {rangeKm.toFixed(2)} km
          </span>

          {/* Bottom-left */}
          <span
            style={{
              position: "absolute",
              bottom: 10,
              left: 12,
              fontFamily: "monospace",
              fontSize: 11,
              color: HUD_COLOR,
              textShadow: "0 0 6px rgba(63,185,80,0.5)",
              pointerEvents: "none",
            }}
          >
            BRG: {String(Math.round(bearingDeg)).padStart(3, "0")}&deg;
          </span>

          {/* Bottom-right */}
          <span
            style={{
              position: "absolute",
              bottom: 10,
              right: 12,
              fontFamily: "monospace",
              fontSize: 11,
              color: HUD_COLOR,
              textShadow: "0 0 6px rgba(63,185,80,0.5)",
              pointerEvents: "none",
            }}
          >
            ALT: {Math.round(track.altitude_ft)} ft
          </span>

          {/* Center-bottom */}
          <span
            style={{
              position: "absolute",
              bottom: 10,
              left: "50%",
              transform: "translateX(-50%)",
              fontFamily: "monospace",
              fontSize: 11,
              color: HUD_COLOR,
              textShadow: "0 0 6px rgba(63,185,80,0.5)",
              pointerEvents: "none",
            }}
          >
            ZOOM: 4x
          </span>
        </div>
      </div>
    </div>
  );
}
