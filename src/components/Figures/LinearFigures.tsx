import React, { useEffect, useMemo, useRef, useState } from 'react';
import { InlineMath } from '../RichText';
import {
  academicRamp,
  Camera3D,
  drawAxes3D,
  project3D,
  setupCanvasDPR,
  Vec3,
} from '../../utils/projection3d';

interface LinearFiguresProps {
  lectureCode: 'L01' | 'L02.1' | 'L02.2' | 'L03';
  isDark: boolean;
}

export const LinearFigures: React.FC<LinearFiguresProps> = ({ lectureCode, isDark }) => {
  const [yaw, setYaw] = useState(0.66);
  const [pitch, setPitch] = useState(0.48);
  const dragRef = useRef({ active: false, x: 0, y: 0 });
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // L01 state: 3D Ridge surface + 2D L1/L2 contour
  const [lam, setLam] = useState(0.6);
  const [budget, setBudget] = useState(1.0);

  // L02.1 state: Dual Gaussian KL + Softmax Temperature
  const [mu2, setMu2] = useState(1.4);
  const [sigma2, setSigma2] = useState(1.2);
  const [temp, setTemp] = useState(1.0);

  // L02.2 state: XOR 3D feature lift (x1, x2, x1*x2)
  const [liftZ, setLiftZ] = useState(1.0); // 0 = flat 2D inseparable, 1 = lifted 3D separable!

  // L03 state: Bias-Variance degree visual
  const [deg, setDeg] = useState(3);

  // --- L01 3D Ridge Surface ---
  useEffect(() => {
    if (lectureCode !== 'L01') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const W = 380;
    const H = 260;
    const ctx = setupCanvasDPR(canvas, W, H);
    if (!ctx) return;

    const cam: Camera3D = { yaw, pitch, dist: 4.9, fov: 330 };
    ctx.clearRect(0, 0, W, H);

    const N = 18;
    const evalJ = (w1: number, w2: number) =>
      0.75 * (w1 + w2 - 0.7) ** 2 + 0.5 * lam * (w1 * w1 + w2 * w2);
    const maxH = 2.6;
    const to3D = (w1: number, w2: number): Vec3 => ({
      x: w1,
      y: (Math.min(maxH, evalJ(w1, w2)) / maxH) * 1.4 - 0.65,
      z: w2,
    });

    const grid: Vec3[][] = Array.from({ length: N + 1 }, (_, i) => {
      const w1 = -1.5 + (3 * i) / N;
      return Array.from({ length: N + 1 }, (_, j) => to3D(w1, -1.5 + (3 * j) / N));
    });

    const quads: { pts: Vec3[]; depth: number; norm: number }[] = [];
    for (let i = 0; i < N; i++) {
      for (let j = 0; j < N; j++) {
        const pts = [grid[i][j], grid[i + 1][j], grid[i + 1][j + 1], grid[i][j + 1]];
        const mid = {
          x: (pts[0].x + pts[2].x) / 2,
          y: (pts[0].y + pts[2].y) / 2,
          z: (pts[0].z + pts[2].z) / 2,
        };
        quads.push({
          pts,
          depth: project3D(mid, cam, W, H).depth,
          norm: (mid.y + 0.65) / 1.4,
        });
      }
    }
    quads.sort((a, b) => b.depth - a.depth);
    for (const q of quads) {
      const pr = q.pts.map((pt) => project3D(pt, cam, W, H));
      ctx.beginPath();
      ctx.moveTo(pr[0].x, pr[0].y);
      ctx.lineTo(pr[1].x, pr[1].y);
      ctx.lineTo(pr[2].x, pr[2].y);
      ctx.lineTo(pr[3].x, pr[3].y);
      ctx.closePath();
      ctx.fillStyle = academicRamp(q.norm, 0.8);
      ctx.fill();
      ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(15,23,42,0.16)';
      ctx.lineWidth = 0.55;
      ctx.stroke();
    }
    drawAxes3D(ctx, cam, W, H, 1.65, ['w₁', 'J(w)', 'w₂'], isDark);

    if (lam < 0.02) {
      const p1 = project3D(to3D(-0.7, 1.4), cam, W, H);
      const p2 = project3D(to3D(1.4, -0.7), cam, W, H);
      ctx.strokeStyle = '#dc2626';
      ctx.lineWidth = 2.5;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
      ctx.setLineDash([]);
    } else {
      const optW = 1.05 / (3.0 + lam);
      const pOpt = project3D(to3D(optW, optW), cam, W, H);
      ctx.beginPath();
      ctx.arc(pOpt.x, pOpt.y, 5, 0, Math.PI * 2);
      ctx.fillStyle = '#059669';
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1.6;
      ctx.stroke();
    }
  }, [lectureCode, yaw, pitch, lam, isDark]);

  // --- L02.2 3D XOR Feature Lift (x1, x2, x1*x2) ---
  useEffect(() => {
    if (lectureCode !== 'L02.2') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const W = 380;
    const H = 260;
    const ctx = setupCanvasDPR(canvas, W, H);
    if (!ctx) return;

    const cam: Camera3D = { yaw, pitch, dist: 4.5, fov: 330 };
    ctx.clearRect(0, 0, W, H);
    drawAxes3D(ctx, cam, W, H, 1.45, ['x₁', 'x₃ = x₁x₂', 'x₂'], isDark);

    // Draw translucent separating hyperplane in 3D when lifted: x3 = 0.5*(x1 + x2) - 0.25 => y = 0.5*(x+z) - 0.25
    // Map [0,1] -> [-0.8, 0.8]
    const mapC = (u: number) => (u - 0.5) * 1.6;
    const planeCorners: Vec3[] = [
      { x: mapC(0), y: liftZ * 0.35 - 0.4, z: mapC(0) },
      { x: mapC(1), y: liftZ * 0.35 - 0.4, z: mapC(0) },
      { x: mapC(1), y: liftZ * 0.35 - 0.4, z: mapC(1) },
      { x: mapC(0), y: liftZ * 0.35 - 0.4, z: mapC(1) },
    ];
    // Better exact separating plane for XOR in (x1, x2, x1*x2):
    // Class +1: (0,0,0) and (1,1,1); Class 0: (1,0,0) and (0,1,0)
    // Plane: 2*x3 - x1 - x2 + 0.5 = 0  =>  x3 = 0.5*(x1 + x2 - 0.5)
    const sepPlane: Vec3[] = [
      [0, 0],
      [1, 0],
      [1, 1],
      [0, 1],
    ].map(([u, v]) => ({
      x: mapC(u),
      y: liftZ * (0.5 * (u + v - 0.5)) * 1.25 - 0.25,
      z: mapC(v),
    }));

    if (liftZ > 0.2) {
      const pp = sepPlane.map((pt) => project3D(pt, cam, W, H));
      ctx.beginPath();
      pp.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
      ctx.closePath();
      ctx.fillStyle = isDark ? 'rgba(59, 130, 246, 0.2)' : 'rgba(29, 78, 216, 0.14)';
      ctx.fill();
      ctx.strokeStyle = '#2563eb';
      ctx.lineWidth = 1.4;
      ctx.stroke();
    }
    void planeCorners;

    const xorPts: { u: number; v: number; y: 0 | 1; label: string }[] = [
      { u: 0, v: 0, y: 1, label: '(0,0) y=1' },
      { u: 1, v: 1, y: 1, label: '(1,1) y=1' },
      { u: 1, v: 0, y: 0, label: '(1,0) y=0' },
      { u: 0, v: 1, y: 0, label: '(0,1) y=0' },
    ];

    const projPts = xorPts.map((pt) => {
      const x3 = pt.u * pt.v * liftZ;
      const p3: Vec3 = { x: mapC(pt.u), y: x3 * 1.25 - 0.25, z: mapC(pt.v) };
      const pFloor: Vec3 = { x: mapC(pt.u), y: -0.25, z: mapC(pt.v) };
      return { ...pt, p: project3D(p3, cam, W, H), floor: project3D(pFloor, cam, W, H) };
    });

    projPts.sort((a, b) => b.p.depth - a.p.depth);
    for (const pt of projPts) {
      if (pt.u === 1 && pt.v === 1 && liftZ > 0.05) {
        ctx.strokeStyle = '#059669';
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(pt.floor.x, pt.floor.y);
        ctx.lineTo(pt.p.x, pt.p.y);
        ctx.stroke();
        ctx.setLineDash([]);
      }
      ctx.beginPath();
      ctx.arc(pt.p.x, pt.p.y, 6.5, 0, Math.PI * 2);
      ctx.fillStyle = pt.y === 1 ? '#059669' : '#dc2626';
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.8;
      ctx.stroke();
      ctx.fillStyle = isDark ? '#e4e4e7' : '#292524';
      ctx.font = '600 10px "JetBrains Mono", monospace';
      ctx.fillText(pt.label, pt.p.x + 9, pt.p.y + 3);
    }
  }, [lectureCode, yaw, pitch, liftZ, isDark]);

  // Helper for L01 2D L1/L2 contour optimum
  const l1l2Opt = useMemo(() => {
    const ox = 1.55;
    const oy = 0.55;
    const mse = (x: number, y: number) => 1.8 * (x - ox) ** 2 + 0.9 * (y - oy) ** 2 + 0.6 * (x - ox) * (y - oy);
    let b1: [number, number] = [0, 0];
    let v1 = Infinity;
    let b2: [number, number] = [0, 0];
    let v2 = Infinity;
    for (let i = 0; i <= 360; i++) {
      const a = (i / 360) * Math.PI * 2;
      const c1 = budget * Math.cos(a);
      const c2 = budget * Math.sin(a);
      if (mse(c1, c2) < v2) { v2 = mse(c1, c2); b2 = [c1, c2]; }
      const s = Math.abs(Math.cos(a)) + Math.abs(Math.sin(a));
      const d1 = (budget * Math.cos(a)) / s;
      const d2 = (budget * Math.sin(a)) / s;
      if (mse(d1, d2) < v1) { v1 = mse(d1, d2); b1 = [d1, d2]; }
    }
    return { ox, oy, b1, b2 };
  }, [budget]);

  const bindDrag = {
    onMouseDown: (e: React.MouseEvent) => { dragRef.current = { active: true, x: e.clientX, y: e.clientY }; },
    onMouseMove: (e: React.MouseEvent) => {
      if (!dragRef.current.active) return;
      const dx = e.clientX - dragRef.current.x;
      const dy = e.clientY - dragRef.current.y;
      dragRef.current.x = e.clientX;
      dragRef.current.y = e.clientY;
      setYaw((v) => v + dx * 0.01);
      setPitch((v) => Math.max(0.1, Math.min(1.25, v + dy * 0.01)));
    },
    onMouseUp: () => { dragRef.current.active = false; },
    onMouseLeave: () => { dragRef.current.active = false; },
  };

  if (lectureCode === 'L01') {
    return (
      <figure className="rounded-lg border border-stone-200 bg-white overflow-hidden dark:border-zinc-800 dark:bg-[#11151d]">
        <div className="border-b border-stone-200 bg-stone-50/70 px-5 py-2.5 flex flex-wrap justify-between gap-2 text-xs dark:border-zinc-800 dark:bg-zinc-900/60">
          <span className="font-mono font-semibold text-stone-700 dark:text-zinc-300">
            Fig. 1.1 · 3D Ridge 损失曲面地形与 2D LASSO / Ridge 约束几何对比
          </span>
          <span className="font-mono text-[11px] text-stone-400">左图可鼠标拖拽旋转 3D 视角</span>
        </div>
        <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          <div className="space-y-2.5 flex flex-col items-center">
            <canvas ref={canvasRef} {...bindDrag} className="w-full max-w-[380px] aspect-[380/260] rounded border border-stone-200 bg-stone-50 dark:border-zinc-800 dark:bg-zinc-950 cursor-grab active:cursor-grabbing" />
            <div className="w-full max-w-[380px] space-y-1 text-xs">
              <div className="flex justify-between font-mono">
                <span>Ridge λ = {lam.toFixed(2)} {lam < 0.02 ? '(奇异平谷 · 无穷多解)' : '(严格凸碗 · 唯一解)'}</span>
              </div>
              <input type="range" min={0} max={2.0} step={0.05} value={lam} onChange={(e) => setLam(parseFloat(e.target.value))} className="w-full" />
            </div>
          </div>

          <div className="space-y-2.5 flex flex-col items-center">
            <svg viewBox="0 0 280 240" className="w-full max-w-[300px] h-auto rounded border border-stone-200 bg-stone-50 dark:border-zinc-800 dark:bg-zinc-950">
              <line x1={140} x2={140} y1={10} y2={230} className="stroke-stone-300 dark:stroke-zinc-700" />
              <line x1={10} x2={270} y1={120} y2={120} className="stroke-stone-300 dark:stroke-zinc-700" />
              {[0.35, 0.7, 1.1, 1.5].map((s) => (
                <ellipse key={s} cx={140 + l1l2Opt.ox * 50} cy={120 - l1l2Opt.oy * 50} rx={s * 36} ry={s * 54} transform={`rotate(-18 ${140 + l1l2Opt.ox * 50} ${120 - l1l2Opt.oy * 50})`} fill="none" className="stroke-stone-400/50" strokeDasharray="3 3" />
              ))}
              <circle cx={140} cy={120} r={budget * 50} fill="rgba(29,78,216,0.1)" stroke="#1d4ed8" strokeWidth={1.8} />
              <polygon points={`${140},${120 - budget * 50} ${140 + budget * 50},${120} ${140},${120 + budget * 50} ${140 - budget * 50},${120}`} fill="rgba(185,28,28,0.1)" stroke="#b91c1c" strokeWidth={1.8} />
              <circle cx={140 + l1l2Opt.ox * 50} cy={120 - l1l2Opt.oy * 50} r={4} className="fill-stone-900 dark:fill-white" />
              <circle cx={140 + l1l2Opt.b2[0] * 50} cy={120 - l1l2Opt.b2[1] * 50} r={5} fill="#1d4ed8" stroke="#fff" strokeWidth={1.5} />
              <circle cx={140 + l1l2Opt.b1[0] * 50} cy={120 - l1l2Opt.b1[1] * 50} r={5} fill="#b91c1c" stroke="#fff" strokeWidth={1.5} />
            </svg>
            <div className="w-full max-w-[300px] space-y-1 text-xs">
              <div className="flex justify-between font-mono text-[11px]">
                <span className="text-red-700 dark:text-red-400">L1: ({l1l2Opt.b1[0].toFixed(2)}, {l1l2Opt.b1[1].toFixed(2)})</span>
                <span className="text-blue-700 dark:text-blue-400">L2: ({l1l2Opt.b2[0].toFixed(2)}, {l1l2Opt.b2[1].toFixed(2)})</span>
              </div>
              <input type="range" min={0.45} max={1.5} step={0.05} value={budget} onChange={(e) => setBudget(parseFloat(e.target.value))} className="w-full" />
            </div>
          </div>
        </div>
        <figcaption className="border-t border-stone-100 px-5 py-2.5 text-xs text-stone-500 dark:border-zinc-800 dark:text-zinc-400">
          左：λ=0 时共线特征形成底部全平的奇异槽（红虚线），加上 λ‖w‖₂² 后弯曲成严格凸碗（绿点为唯一解）。右：L1 菱形尖角使 MSE 椭圆最先触碰坐标轴（w₂ 精确归零实现特征选择），L2 圆周则平滑收缩。
        </figcaption>
      </figure>
    );
  }

  if (lectureCode === 'L02.1') {
    const klCurve = Array.from({ length: 81 }, (_, i) => {
      const m = -2.5 + (5 * i) / 80;
      const kl = Math.log(sigma2) + (1 + m * m) / (2 * sigma2 * sigma2) - 0.5;
      const ce = 0.5 * Math.log(2 * Math.PI * Math.E) + kl;
      return { m, kl, ce };
    });
    const toP = (key: 'kl' | 'ce') =>
      klCurve
        .map((pt, i) => {
          const x = 32 + ((pt.m + 2.5) / 5) * 260;
          const y = 165 - (Math.min(5.5, pt[key]) / 5.5) * 140;
          return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
        })
        .join(' ');

    const logits = [2.4, 1.1, -0.3, -1.2];
    const scaled = logits.map((z) => z / temp);
    const mx = Math.max(...scaled);
    const exps = scaled.map((z) => Math.exp(z - mx));
    const sumE = exps.reduce((a, b) => a + b, 0);
    const probs = exps.map((e) => e / sumE);

    return (
      <figure className="rounded-lg border border-stone-200 bg-white overflow-hidden dark:border-zinc-800 dark:bg-[#11151d]">
        <div className="border-b border-stone-200 bg-stone-50/70 px-5 py-2.5 text-xs font-mono font-semibold text-stone-700 dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-300">
          Fig. 2.1 · 双高斯 KL / 交叉熵随 μ₂ 偏移曲线（WA1 Q6）与 Softmax 温度 T 分布形态
        </div>
        <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-6 items-center text-xs">
          <div className="space-y-2">
            <svg viewBox="0 0 310 190" className="w-full h-auto rounded border border-stone-200 bg-stone-50 dark:border-zinc-800 dark:bg-zinc-950">
              <line x1={32} x2={292} y1={165} y2={165} className="stroke-stone-300 dark:stroke-zinc-700" />
              <line x1={162} x2={162} y1={18} y2={165} className="stroke-stone-300 dark:stroke-zinc-700" strokeDasharray="3 3" />
              <path d={toP('ce')} fill="none" stroke="#1d4ed8" strokeWidth={2} />
              <path d={toP('kl')} fill="none" stroke="#b91c1c" strokeWidth={2} />
              <line x1={32 + ((mu2 + 2.5) / 5) * 260} x2={32 + ((mu2 + 2.5) / 5) * 260} y1={18} y2={165} stroke="#047857" strokeDasharray="3 2" />
              <text x={38} y={28} className="fill-blue-700 dark:fill-blue-400 text-[9.5px] font-mono">─ H(p,q) = H(p)+KL</text>
              <text x={38} y={42} className="fill-red-700 dark:fill-red-400 text-[9.5px] font-mono">─ D_KL(N(0,1)‖N(μ₂,σ₂²))</text>
              <text x={162} y={180} textAnchor="middle" className="fill-stone-400 text-[9.5px] font-mono">μ₂ ∈ [-2.5, 2.5]</text>
            </svg>
            <div className="grid grid-cols-2 gap-3 font-mono text-[11px]">
              <label>μ₂={mu2.toFixed(1)}<input type="range" min={-2.2} max={2.2} step={0.1} value={mu2} onChange={(e) => setMu2(parseFloat(e.target.value))} className="w-full" /></label>
              <label>σ₂={sigma2.toFixed(1)}<input type="range" min={0.6} max={2.0} step={0.1} value={sigma2} onChange={(e) => setSigma2(parseFloat(e.target.value))} className="w-full" /></label>
            </div>
          </div>

          <div className="space-y-3">
            <div className="font-mono text-[11px] text-stone-600 dark:text-zinc-400">
              固定 logits = [2.4, 1.1, −0.3, −1.2]，调节 Softmax 温度 T = {temp.toFixed(2)}：
            </div>
            <div className="space-y-2 font-mono text-[11px]">
              {probs.map((p, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="w-16 text-stone-500">z={logits[i].toFixed(1)}</span>
                  <div className="flex-1 h-4 rounded bg-stone-100 dark:bg-zinc-900 overflow-hidden">
                    <div className="h-full bg-blue-700 dark:bg-blue-500 transition-all" style={{ width: `${p * 100}%` }} />
                  </div>
                  <span className="w-12 text-right font-semibold">{(p * 100).toFixed(1)}%</span>
                </div>
              ))}
            </div>
            <input type="range" min={0.2} max={3.0} step={0.1} value={temp} onChange={(e) => setTemp(parseFloat(e.target.value))} className="w-full" />
            <div className="text-[11px] text-stone-500">
              T → 0 退化为 argmax one-hot（梯度趋近 0）；T → ∞ 退化为均匀分布（最大熵）。
            </div>
          </div>
        </div>
      </figure>
    );
  }

  if (lectureCode === 'L02.2') {
    const surrPath = (fn: (m: number) => number) =>
      Array.from({ length: 81 }, (_, i) => {
        const m = -2.2 + (4.4 * i) / 80;
        const y = Math.min(3.8, fn(m));
        const x = 28 + ((m + 2.2) / 4.4) * 264;
        const py = 170 - (y / 3.8) * 145;
        return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${py.toFixed(1)}`;
      }).join(' ');

    return (
      <figure className="rounded-lg border border-stone-200 bg-white overflow-hidden dark:border-zinc-800 dark:bg-[#11151d]">
        <div className="border-b border-stone-200 bg-stone-50/70 px-5 py-2.5 flex flex-wrap justify-between gap-2 text-xs dark:border-zinc-800 dark:bg-zinc-900/60">
          <span className="font-mono font-semibold text-stone-700 dark:text-zinc-300">
            Fig. 2.2 · 0/1 误差的凸代理上界曲线 & XOR 三维特征升维 (x₁, x₂, x₁x₂) 线性可分几何
          </span>
          <span className="font-mono text-[11px] text-stone-400">右图可鼠标拖拽旋转 3D 超平面</span>
        </div>
        <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-6 items-center text-xs">
          <div className="space-y-2">
            <svg viewBox="0 0 310 190" className="w-full h-auto rounded border border-stone-200 bg-stone-50 dark:border-zinc-800 dark:bg-zinc-950">
              <line x1={28} x2={292} y1={170} y2={170} className="stroke-stone-300 dark:stroke-zinc-700" />
              <line x1={160} x2={160} y1={18} y2={170} className="stroke-stone-300 dark:stroke-zinc-700" strokeDasharray="3 3" />
              <path d="M 28 131.8 L 160 131.8 L 160 170 L 292 170" fill="none" className="stroke-stone-900 dark:stroke-zinc-200" strokeWidth={2} />
              <path d={surrPath((m) => Math.log2(1 + Math.exp(-m)))} fill="none" stroke="#1d4ed8" strokeWidth={2} />
              <path d={surrPath((m) => Math.max(0, 1 - m))} fill="none" stroke="#047857" strokeWidth={2} />
              <path d={surrPath((m) => Math.exp(-m))} fill="none" stroke="#b91c1c" strokeWidth={1.6} strokeDasharray="4 3" />
              <text x={172} y={32} className="fill-blue-700 dark:fill-blue-400 text-[9.5px] font-mono">─ Logistic</text>
              <text x={172} y={45} className="fill-emerald-700 dark:fill-emerald-400 text-[9.5px] font-mono">─ Hinge (SVM)</text>
              <text x={172} y={58} className="fill-red-700 dark:fill-red-400 text-[9.5px] font-mono">-- Exponential</text>
              <text x={160} y={184} textAnchor="middle" className="fill-stone-400 text-[9.5px] font-mono">Margin m = y·f(x)</text>
            </svg>
          </div>

          <div className="space-y-2 flex flex-col items-center">
            <canvas ref={canvasRef} {...bindDrag} className="w-full max-w-[380px] aspect-[380/260] rounded border border-stone-200 bg-stone-50 dark:border-zinc-800 dark:bg-zinc-950 cursor-grab active:cursor-grabbing" />
            <div className="w-full max-w-[380px] space-y-1 font-mono text-[11px]">
              <div className="flex justify-between">
                <span>三维特征升维系数 x₃ = {(liftZ).toFixed(2)}·(x₁x₂)</span>
                <span className="text-blue-700 dark:text-blue-400">{liftZ < 0.2 ? '2D 不可分' : '3D 平面线性可分'}</span>
              </div>
              <input type="range" min={0} max={1} step={0.05} value={liftZ} onChange={(e) => setLiftZ(parseFloat(e.target.value))} className="w-full" />
            </div>
          </div>
        </div>
        <figcaption className="border-t border-stone-100 px-5 py-3 text-[13px] math-prose text-stone-600 dark:border-zinc-800 dark:text-zinc-400">
          右图直击 WA1 Q4：在原 2D 平面（lift <InlineMath latex="= 0" />）无法用单条直线分开红/绿点；一旦引入交叉特征 <InlineMath latex="x_3 = x_1 x_2" /> 把点 <InlineMath latex="(1, 1)" /> 抬起至三维空间，蓝色线性超平面即可 <InlineMath latex="0" /> 误差切分！
        </figcaption>
      </figure>
    );
  }

  // --- L03: Bias-Variance U-Curve SVG ---
  const uData = [
    { d: 1, bias: 0.42, var: 0.03 },
    { d: 2, bias: 0.21, var: 0.05 },
    { d: 3, bias: 0.04, var: 0.08 },
    { d: 4, bias: 0.025, var: 0.12 },
    { d: 5, bias: 0.02, var: 0.19 },
    { d: 7, bias: 0.015, var: 0.36 },
    { d: 9, bias: 0.012, var: 0.62 },
  ];
  const irr = 0.06;
  const toUPath = (fn: (r: typeof uData[number]) => number) =>
    uData
      .map((r, i) => {
        const x = 42 + (i / (uData.length - 1)) * 460;
        const y = 185 - (Math.min(0.85, fn(r)) / 0.85) * 155;
        return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(' ');

  return (
    <figure className="rounded-lg border border-stone-200 bg-white overflow-hidden dark:border-zinc-800 dark:bg-[#11151d]">
      <div className="border-b border-stone-200 bg-stone-50/70 px-5 py-2.5 flex justify-between text-xs dark:border-zinc-800 dark:bg-zinc-900/60">
        <span className="font-mono font-semibold text-stone-700 dark:text-zinc-300">
          Fig. 3.1 · 期望测试误差随模型容量 d 演化的经典 U 形 Bias²–Variance 权衡曲线
        </span>
      </div>
      <div className="p-5 space-y-3">
        <svg viewBox="0 0 540 210" className="w-full h-auto rounded border border-stone-200 bg-stone-50 dark:border-zinc-800 dark:bg-zinc-950">
          <line x1={42} x2={502} y1={185} y2={185} className="stroke-stone-300 dark:stroke-zinc-700" />
          <line x1={42} x2={502} y1={185 - (irr / 0.85) * 155} y2={185 - (irr / 0.85) * 155} stroke="#78716c" strokeDasharray="4 3" />
          <path d={toUPath((r) => r.bias)} fill="none" stroke="#b91c1c" strokeWidth={2.2} />
          <path d={toUPath((r) => r.var)} fill="none" stroke="#1d4ed8" strokeWidth={2.2} />
          <path d={toUPath((r) => r.bias + r.var + irr)} fill="none" className="stroke-stone-900 dark:stroke-zinc-100" strokeWidth={2.8} />
          {uData.map((r, i) => {
            const x = 42 + (i / (uData.length - 1)) * 460;
            return (
              <g key={r.d}>
                <text x={x} y={200} textAnchor="middle" className="fill-stone-500 text-[10px] font-mono">
                  d={r.d}
                </text>
                {r.d === deg && (
                  <line x1={x} x2={x} y1={22} y2={185} stroke="#047857" strokeWidth={1.6} strokeDasharray="3 2" />
                )}
              </g>
            );
          })}
          <text x={55} y={32} className="fill-stone-900 dark:fill-zinc-100 text-[10px] font-mono font-semibold">─ Total Expected MSE</text>
          <text x={205} y={32} className="fill-red-700 dark:fill-red-400 text-[10px] font-mono">─ Bias²</text>
          <text x={275} y={32} className="fill-blue-700 dark:fill-blue-400 text-[10px] font-mono">─ Variance</text>
          <text x={365} y={32} className="fill-stone-500 text-[10px] font-mono">-- Noise σ²</text>
        </svg>
        <div className="flex items-center gap-3 text-xs font-mono">
          <span>定位复杂度 d = {deg}:</span>
          {[1, 2, 3, 4, 5, 7, 9].map((d) => (
            <button
              key={d}
              onClick={() => setDeg(d)}
              className={`rounded border px-2 py-0.5 cursor-pointer ${
                deg === d ? 'border-blue-600 bg-blue-600 text-white' : 'border-stone-300 dark:border-zinc-700'
              }`}
            >
              d={d}
            </button>
          ))}
        </div>
      </div>
    </figure>
  );
};
