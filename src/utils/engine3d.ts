export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export interface Camera3D {
  yaw: number;   // horizontal rotation (radians)
  pitch: number; // vertical tilt (radians)
  dist: number;  // camera distance
  fov: number;   // focal length scale
}

export interface Projected2D {
  x: number;
  y: number;
  depth: number; // larger = farther from camera
  scale: number;
}

export function rotatePoint(p: Vec3, yaw: number, pitch: number): Vec3 {
  // Rotate around Y axis (yaw)
  const cy = Math.cos(yaw);
  const sy = Math.sin(yaw);
  const x1 = p.x * cy - p.z * sy;
  const z1 = p.x * sy + p.z * cy;

  // Rotate around X axis (pitch)
  const cp = Math.cos(pitch);
  const sp = Math.sin(pitch);
  const y2 = p.y * cp - z1 * sp;
  const z2 = p.y * sp + z1 * cp;

  return { x: x1, y: y2, z: z2 };
}

export function projectPoint(
  p: Vec3,
  cam: Camera3D,
  width: number,
  height: number
): Projected2D {
  const r = rotatePoint(p, cam.yaw, cam.pitch);
  const zCam = cam.dist - r.z;
  const safeZ = Math.max(0.6, zCam);
  const scale = cam.fov / safeZ;
  return {
    x: width / 2 + r.x * scale,
    y: height / 2 - r.y * scale,
    depth: safeZ,
    scale,
  };
}

export function setupHiDPICanvas(
  canvas: HTMLCanvasElement,
  cssW: number,
  cssH: number
): CanvasRenderingContext2D | null {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const targetW = Math.round(cssW * dpr);
  const targetH = Math.round(cssH * dpr);
  if (canvas.width !== targetW || canvas.height !== targetH) {
    canvas.width = targetW;
    canvas.height = targetH;
  }
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return ctx;
}

export function draw3DAxes(
  ctx: CanvasRenderingContext2D,
  cam: Camera3D,
  w: number,
  h: number,
  extent = 1.6,
  labels: [string, string, string] = ['x₁', 'y', 'x₂']
) {
  const origin = projectPoint({ x: 0, y: 0, z: 0 }, cam, w, h);
  const axes: { end: Vec3; color: string; label: string }[] = [
    { end: { x: extent, y: 0, z: 0 }, color: 'rgba(96, 165, 250, 0.55)', label: labels[0] },
    { end: { x: 0, y: extent, z: 0 }, color: 'rgba(52, 211, 153, 0.55)', label: labels[1] },
    { end: { x: 0, y: 0, z: extent }, color: 'rgba(167, 139, 250, 0.55)', label: labels[2] },
  ];

  ctx.save();
  ctx.lineWidth = 1.2;
  ctx.font = '600 11px "JetBrains Mono", monospace';
  for (const ax of axes) {
    const p2 = projectPoint(ax.end, cam, w, h);
    ctx.strokeStyle = ax.color;
    ctx.beginPath();
    ctx.moveTo(origin.x, origin.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.stroke();

    ctx.fillStyle = ax.color.replace('0.55', '0.9');
    ctx.fillText(ax.label, p2.x + 5, p2.y + 3);
  }
  ctx.restore();
}

export function draw3DArrow(
  ctx: CanvasRenderingContext2D,
  from: Projected2D,
  to: Projected2D,
  color: string,
  lineWidth = 2,
  headLen = 7
) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const len = Math.hypot(dx, dy);
  if (len < 2) return;
  const angle = Math.atan2(dy, dx);

  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.beginPath();
  ctx.moveTo(from.x, from.y);
  ctx.lineTo(to.x, to.y);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(to.x, to.y);
  ctx.lineTo(
    to.x - headLen * Math.cos(angle - Math.PI / 6),
    to.y - headLen * Math.sin(angle - Math.PI / 6)
  );
  ctx.lineTo(
    to.x - headLen * Math.cos(angle + Math.PI / 6),
    to.y - headLen * Math.sin(angle + Math.PI / 6)
  );
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

/** Viridis / Plasma-inspired luminous scientific color ramp for t in [0, 1] */
export function scientificRamp(t: number, alpha = 0.88): string {
  const c = Math.max(0, Math.min(1, t));
  // Deep Indigo -> Electric Blue -> Emerald/Teal -> Warm Amber -> Coral Rose
  let r = 0;
  let g = 0;
  let b = 0;
  if (c < 0.33) {
    const u = c / 0.33;
    r = Math.round(30 + u * 29);
    g = Math.round(41 + u * 120);
    b = Math.round(135 + u * 110);
  } else if (c < 0.66) {
    const u = (c - 0.33) / 0.33;
    r = Math.round(59 + u * 180);
    g = Math.round(161 + u * 30);
    b = Math.round(245 - u * 150);
  } else {
    const u = (c - 0.66) / 0.34;
    r = Math.round(239 + u * 12);
    g = Math.round(191 - u * 120);
    b = Math.round(95 + u * 35);
  }
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
