export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export interface Camera3D {
  yaw: number;
  pitch: number;
  dist: number;
  fov: number;
}

export interface Projected2D {
  x: number;
  y: number;
  depth: number;
  scale: number;
}

export function rotate3D(p: Vec3, yaw: number, pitch: number): Vec3 {
  const cy = Math.cos(yaw);
  const sy = Math.sin(yaw);
  const x1 = p.x * cy - p.z * sy;
  const z1 = p.x * sy + p.z * cy;
  const cp = Math.cos(pitch);
  const sp = Math.sin(pitch);
  const y2 = p.y * cp - z1 * sp;
  const z2 = p.y * sp + z1 * cp;
  return { x: x1, y: y2, z: z2 };
}

export function project3D(p: Vec3, cam: Camera3D, w: number, h: number): Projected2D {
  const r = rotate3D(p, cam.yaw, cam.pitch);
  const depth = Math.max(0.6, cam.dist - r.z);
  const scale = cam.fov / depth;
  return {
    x: w / 2 + r.x * scale,
    y: h / 2 - r.y * scale,
    depth,
    scale,
  };
}

export function setupCanvasDPR(
  canvas: HTMLCanvasElement,
  cssW: number,
  cssH: number
): CanvasRenderingContext2D | null {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const tw = Math.round(cssW * dpr);
  const th = Math.round(cssH * dpr);
  if (canvas.width !== tw || canvas.height !== th) {
    canvas.width = tw;
    canvas.height = th;
  }
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return ctx;
}

/** Publication-grade Cividis/Viridis-inspired restrained scientific ramp */
export function academicRamp(t: number, alpha = 0.85): string {
  const c = Math.max(0, Math.min(1, t));
  let r = 0;
  let g = 0;
  let b = 0;
  if (c < 0.5) {
    const u = c / 0.5;
    r = Math.round(28 + u * 24);
    g = Math.round(62 + u * 86);
    b = Math.round(138 + u * 18);
  } else {
    const u = (c - 0.5) / 0.5;
    r = Math.round(52 + u * 165);
    g = Math.round(148 + u * 26);
    b = Math.round(156 - u * 102);
  }
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function drawAxes3D(
  ctx: CanvasRenderingContext2D,
  cam: Camera3D,
  w: number,
  h: number,
  extent: number,
  labels: [string, string, string],
  isDark: boolean
) {
  const o = project3D({ x: 0, y: 0, z: 0 }, cam, w, h);
  const axisColor = isDark ? 'rgba(161, 161, 170, 0.55)' : 'rgba(87, 83, 78, 0.55)';
  const labelColor = isDark ? '#d4d4d8' : '#44403c';
  const ends: Vec3[] = [
    { x: extent, y: 0, z: 0 },
    { x: 0, y: extent, z: 0 },
    { x: 0, y: 0, z: extent },
  ];

  ctx.save();
  ctx.strokeStyle = axisColor;
  ctx.fillStyle = labelColor;
  ctx.lineWidth = 1.1;
  ctx.font = '600 10.5px "JetBrains Mono", monospace';
  ends.forEach((e, idx) => {
    const p = project3D(e, cam, w, h);
    ctx.beginPath();
    ctx.moveTo(o.x, o.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    ctx.fillText(labels[idx], p.x + 4, p.y + 3);
  });
  ctx.restore();
}
