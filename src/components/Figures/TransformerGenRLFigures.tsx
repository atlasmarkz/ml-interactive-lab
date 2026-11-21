import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  academicRamp,
  Camera3D,
  drawAxes3D,
  project3D,
  setupCanvasDPR,
  Vec3,
} from '../../utils/projection3d';

interface TransformerGenRLFiguresProps {
  lectureCode: 'L08' | 'L09' | 'L10' | 'L11';
  isDark: boolean;
}

function mulberry(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const TransformerGenRLFigures: React.FC<TransformerGenRLFiguresProps> = ({
  lectureCode,
  isDark,
}) => {
  const [yaw, setYaw] = useState(0.62);
  const [pitch, setPitch] = useState(0.45);
  const dragRef = useRef({ active: false, x: 0, y: 0 });
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // L08: Sinusoidal PE distance & scaled softmax variance
  const [dkVal, setDkVal] = useState(64);

  // L09: CLIP 3D unit hypersphere alignment progress
  const [clipAlign, setClipAlign] = useState(0.8);

  // L10: 3D Swiss-Roll Diffusion vs Flow t
  const [diffT, setDiffT] = useState(0.3);
  const [diffMode, setDiffMode] = useState<'ddpm' | 'flow'>('ddpm');

  // L11: 3D Bellman Value Surface gamma + PPO adv
  const [gamma, setGamma] = useState(0.88);
  const [ppoAdv, setPpoAdv] = useState<1 | -1>(1);
  const [ppoEps, setPpoEps] = useState(0.2);

  // --- L09: 3D CLIP Unit Hypersphere S^2 ---
  useEffect(() => {
    if (lectureCode !== 'L09') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const W = 400;
    const H = 270;
    const ctx = setupCanvasDPR(canvas, W, H);
    if (!ctx) return;

    const cam: Camera3D = { yaw, pitch, dist: 4.1, fov: 320 };
    ctx.clearRect(0, 0, W, H);

    // Wireframe S^2 Sphere
    ctx.strokeStyle = isDark ? 'rgba(161, 161, 170, 0.16)' : 'rgba(87, 83, 78, 0.16)';
    ctx.lineWidth = 0.9;
    for (const lat of [-0.6, 0, 0.6]) {
      const r = Math.cos(lat);
      const y = Math.sin(lat);
      ctx.beginPath();
      for (let s = 0; s <= 40; s++) {
        const a = (s / 40) * Math.PI * 2;
        const p = project3D({ x: r * Math.cos(a), y, z: r * Math.sin(a) }, cam, W, H);
        if (s === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      }
      ctx.stroke();
    }
    for (let k = 0; k < 4; k++) {
      const lon = (k * Math.PI) / 4;
      ctx.beginPath();
      for (let s = 0; s <= 40; s++) {
        const a = (s / 40) * Math.PI * 2;
        const p = project3D({ x: Math.cos(a) * Math.cos(lon), y: Math.sin(a), z: Math.cos(a) * Math.sin(lon) }, cam, W, H);
        if (s === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      }
      ctx.stroke();
    }

    const pairs = [
      { label: 'Class 1', color: '#1d4ed8', tgt: { x: 0.85, y: 0.42, z: 0.31 }, i0: { x: -0.5, y: 0.7, z: -0.5 }, t0: { x: 0.3, y: -0.8, z: 0.5 } },
      { label: 'Class 2', color: '#047857', tgt: { x: -0.78, y: 0.52, z: 0.35 }, i0: { x: 0.6, y: -0.4, z: 0.68 }, t0: { x: -0.4, y: 0.85, z: -0.3 } },
      { label: 'Class 3', color: '#b91c1c', tgt: { x: 0.12, y: -0.84, z: 0.53 }, i0: { x: -0.8, y: -0.2, z: -0.56 }, t0: { x: 0.7, y: 0.65, z: -0.28 } },
      { label: 'Class 4', color: '#6d28d9', tgt: { x: -0.15, y: 0.18, z: -0.97 }, i0: { x: 0.3, y: 0.45, z: 0.84 }, t0: { x: -0.7, y: -0.68, z: -0.2 } },
    ];
    const norm3 = (v: Vec3): Vec3 => {
      const n = Math.hypot(v.x, v.y, v.z) || 1;
      return { x: v.x / n, y: v.y / n, z: v.z / n };
    };
    const lerp = (a: Vec3, b: Vec3, t: number): Vec3 =>
      norm3({ x: a.x + t * (b.x - a.x), y: a.y + t * (b.y - a.y), z: a.z + t * (b.z - a.z) });

    const o = project3D({ x: 0, y: 0, z: 0 }, cam, W, H);
    for (const pr of pairs) {
      const vI = lerp(pr.i0, pr.tgt, clipAlign);
      const vT = lerp(pr.t0, pr.tgt, clipAlign);
      const pI = project3D(vI, cam, W, H);
      const pT = project3D(vT, cam, W, H);

      ctx.strokeStyle = pr.color;
      ctx.globalAlpha = 0.4;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(pI.x, pI.y);
      ctx.lineTo(pT.x, pT.y);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalAlpha = 0.75;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(o.x, o.y);
      ctx.lineTo(pI.x, pI.y);
      ctx.moveTo(o.x, o.y);
      ctx.lineTo(pT.x, pT.y);
      ctx.stroke();
      ctx.globalAlpha = 1;

      // Solid square = Image, Hollow circle = Text
      ctx.fillStyle = pr.color;
      ctx.fillRect(pI.x - 4.5, pI.y - 4.5, 9, 9);
      ctx.beginPath();
      ctx.arc(pT.x, pT.y, 5, 0, Math.PI * 2);
      ctx.fillStyle = isDark ? '#0b0e14' : '#ffffff';
      ctx.fill();
      ctx.strokeStyle = pr.color;
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }, [lectureCode, yaw, pitch, clipAlign, isDark]);

  // --- L10: 3D Swiss-Roll Manifold Diffusion vs Flow ---
  const swissParticles = useMemo(() => {
    const rng = mulberry(42);
    const randn = () => Math.sqrt(-2 * Math.log(Math.max(1e-7, rng()))) * Math.cos(2 * Math.PI * rng());
    return Array.from({ length: 280 }, (_, i) => {
      const u = i / 280;
      const th = 1.5 * Math.PI + u * 2.6 * Math.PI;
      const r = 0.13 * th;
      return {
        x0: { x: r * Math.cos(th) * 0.85, y: (rng() - 0.5) * 1.15, z: r * Math.sin(th) * 0.85 },
        eps: { x: randn() * 0.75, y: randn() * 0.75, z: randn() * 0.75 },
        bend: { x: (rng() - 0.5) * 0.6, y: (rng() - 0.5) * 0.6, z: (rng() - 0.5) * 0.6 },
        u,
      };
    });
  }, []);

  useEffect(() => {
    if (lectureCode !== 'L10') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const W = 400;
    const H = 270;
    const ctx = setupCanvasDPR(canvas, W, H);
    if (!ctx) return;

    const cam: Camera3D = { yaw, pitch, dist: 4.3, fov: 310 };
    ctx.clearRect(0, 0, W, H);
    drawAxes3D(ctx, cam, W, H, 1.45, ['x₁', 'x₂', 'x₃'], isDark);

    const ab = Math.pow(Math.cos(((diffT + 0.008) / 1.008) * (Math.PI / 2)), 2);
    const sc = diffMode === 'ddpm' ? Math.sqrt(ab) : 1 - diffT;
    const nc = diffMode === 'ddpm' ? Math.sqrt(1 - ab) : diffT;
    const bendNow = diffMode === 'ddpm' ? Math.sin(diffT * Math.PI) * 0.32 : 0;

    // 8 representative trajectories
    for (let i = 0; i < 8; i++) {
      const pt = swissParticles[i * 32];
      ctx.beginPath();
      for (let s = 0; s <= 18; s++) {
        const ts = s / 18;
        const abs = Math.pow(Math.cos(((ts + 0.008) / 1.008) * (Math.PI / 2)), 2);
        const s1 = diffMode === 'ddpm' ? Math.sqrt(abs) : 1 - ts;
        const n1 = diffMode === 'ddpm' ? Math.sqrt(1 - abs) : ts;
        const b1 = diffMode === 'ddpm' ? Math.sin(ts * Math.PI) * 0.32 : 0;
        const p2 = project3D(
          {
            x: s1 * pt.x0.x + n1 * pt.eps.x + b1 * pt.bend.x,
            y: s1 * pt.x0.y + n1 * pt.eps.y + b1 * pt.bend.y,
            z: s1 * pt.x0.z + n1 * pt.eps.z + b1 * pt.bend.z,
          },
          cam,
          W,
          H
        );
        if (s === 0) ctx.moveTo(p2.x, p2.y);
        else ctx.lineTo(p2.x, p2.y);
      }
      ctx.strokeStyle = diffMode === 'ddpm' ? 'rgba(185,28,28,0.32)' : 'rgba(4,120,87,0.38)';
      ctx.lineWidth = 1.2;
      ctx.stroke();
    }

    const proj = swissParticles.map((pt) => ({
      u: pt.u,
      p: project3D(
        {
          x: sc * pt.x0.x + nc * pt.eps.x + bendNow * pt.bend.x,
          y: sc * pt.x0.y + nc * pt.eps.y + bendNow * pt.bend.y,
          z: sc * pt.x0.z + nc * pt.eps.z + bendNow * pt.bend.z,
        },
        cam,
        W,
        H
      ),
    }));
    proj.sort((a, b) => b.p.depth - a.p.depth);
    for (const item of proj) {
      ctx.beginPath();
      ctx.arc(item.p.x, item.p.y, Math.max(1.6, 2.7 * (item.p.scale / 75)), 0, Math.PI * 2);
      ctx.fillStyle = academicRamp(item.u, 0.85);
      ctx.fill();
    }
  }, [lectureCode, yaw, pitch, diffT, diffMode, swissParticles, isDark]);

  // --- L11: 3D Bellman Value Surface V*(x, y) ---
  useEffect(() => {
    if (lectureCode !== 'L11') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const W = 400;
    const H = 270;
    const ctx = setupCanvasDPR(canvas, W, H);
    if (!ctx) return;

    const G = 7;
    let V = Array.from({ length: G }, () => Array(G).fill(0));
    const traps = [[2, 4], [3, 3], [4, 5]];
    const isTrap = (r: number, c: number) => traps.some(([tr, tc]) => tr === r && tc === c);
    for (let it = 0; it < 35; it++) {
      const nxt = V.map((r) => [...r]);
      for (let r = 0; r < G; r++) {
        for (let c = 0; c < G; c++) {
          if (r === 0 && c === 6) { nxt[r][c] = 10; continue; }
          if (isTrap(r, c)) { nxt[r][c] = -6; continue; }
          let best = -Infinity;
          for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
            const nr = Math.max(0, Math.min(G - 1, r + dr));
            const nc = Math.max(0, Math.min(G - 1, c + dc));
            const rew = nr === 0 && nc === 6 ? 10 : isTrap(nr, nc) ? -6 : -0.15;
            const fut = (nr === 0 && nc === 6) || isTrap(nr, nc) ? 0 : V[nr][nc];
            best = Math.max(best, rew + gamma * fut);
          }
          nxt[r][c] = best;
        }
      }
      V = nxt;
    }

    const cam: Camera3D = { yaw, pitch, dist: 5.0, fov: 340 };
    ctx.clearRect(0, 0, W, H);
    const to3D = (r: number, c: number, val: number): Vec3 => ({
      x: (c / (G - 1) - 0.5) * 2.6,
      y: ((val + 6) / 16) * 1.5 - 0.6,
      z: (r / (G - 1) - 0.5) * 2.6,
    });

    const quads: { pts: Vec3[]; depth: number; norm: number }[] = [];
    for (let r = 0; r < G - 1; r++) {
      for (let c = 0; c < G - 1; c++) {
        const pts = [to3D(r, c, V[r][c]), to3D(r + 1, c, V[r + 1][c]), to3D(r + 1, c + 1, V[r + 1][c + 1]), to3D(r, c + 1, V[r][c + 1])];
        const avg = (V[r][c] + V[r + 1][c] + V[r + 1][c + 1] + V[r][c + 1]) / 4;
        const mid = { x: (pts[0].x + pts[2].x) / 2, y: (pts[0].y + pts[2].y) / 2, z: (pts[0].z + pts[2].z) / 2 };
        quads.push({ pts, depth: project3D(mid, cam, W, H).depth, norm: (avg + 6) / 16 });
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
      ctx.fillStyle = academicRamp(q.norm, 0.82);
      ctx.fill();
      ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.12)' : 'rgba(15,23,42,0.2)';
      ctx.lineWidth = 0.65;
      ctx.stroke();
    }
    drawAxes3D(ctx, cam, W, H, 1.55, ['x', 'V*(s)', 'y'], isDark);
  }, [lectureCode, yaw, pitch, gamma, isDark]);

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

  if (lectureCode === 'L08') {
    // Sinusoidal Positional Encoding Heatmap + Variance Saturation curve
    const peRows = 20;
    const peCols = 24;
    return (
      <figure className="rounded-lg border border-stone-200 bg-white overflow-hidden dark:border-zinc-800 dark:bg-[#11151d]">
        <div className="border-b border-stone-200 bg-stone-50/70 px-5 py-2.5 text-xs font-mono font-semibold text-stone-700 dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-300">
          Fig. 8.1 · Sinusoidal 位置编码频谱矩阵 (pos × d_model) & 点积标准差 √d_k 膨胀效应
        </div>
        <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-6 items-center text-xs">
          <div className="space-y-2">
            <div className="font-mono text-[11px] text-stone-500">
              PE(pos, 2i) = sin(pos / 10000^(2i/d)) · 左高频短周期 → 右低频长周期
            </div>
            <div className="inline-flex flex-col gap-[1px] rounded border border-stone-200 bg-stone-900 p-1.5 dark:border-zinc-800">
              {Array.from({ length: peRows }, (_, pos) => (
                <div key={pos} className="flex gap-[1px]">
                  {Array.from({ length: peCols }, (_, col) => {
                    const ang = pos / Math.pow(10000, (2 * Math.floor(col / 2)) / peCols);
                    const val = col % 2 === 0 ? Math.sin(ang) : Math.cos(ang);
                    return (
                      <div
                        key={col}
                        className="h-2.5 w-3"
                        style={{ backgroundColor: academicRamp((val + 1) / 2, 0.95) }}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <div className="font-mono text-[11px] text-stone-600 dark:text-zinc-400">
              模拟 d_k = {dkVal} 时，未缩放点积 Std(q·k) = √{dkVal} = <strong>{Math.sqrt(dkVal).toFixed(2)}</strong>（除以 √d_k 后恒为 1.00）：
            </div>
            <input type="range" min={4} max={256} step={4} value={dkVal} onChange={(e) => setDkVal(parseInt(e.target.value, 10))} className="w-full" />
            <div className="grid grid-cols-2 gap-3 font-mono text-[11px]">
              <div className="rounded border border-stone-200 bg-stone-50/70 p-3 dark:border-zinc-800 dark:bg-zinc-950/60">
                <div className="text-stone-400">未缩放 logit 范围 (±2σ)</div>
                <div className="mt-1 font-semibold text-red-700 dark:text-red-400">
                  [{( -2 * Math.sqrt(dkVal)).toFixed(1)}, +{(2 * Math.sqrt(dkVal)).toFixed(1)}]
                </div>
                <div className="text-[10px] text-stone-500 mt-1">Softmax 迅速饱和，梯度趋零</div>
              </div>
              <div className="rounded border border-stone-200 bg-stone-50/70 p-3 dark:border-zinc-800 dark:bg-zinc-950/60">
                <div className="text-stone-400">÷ √d_k 缩放后 (±2σ)</div>
                <div className="mt-1 font-semibold text-emerald-700 dark:text-emerald-400">
                  [-2.0, +2.0]
                </div>
                <div className="text-[10px] text-stone-500 mt-1">落在线性梯度健康区</div>
              </div>
            </div>
          </div>
        </div>
      </figure>
    );
  }

  if (lectureCode === 'L09') {
    return (
      <figure className="rounded-lg border border-stone-200 bg-white overflow-hidden dark:border-zinc-800 dark:bg-[#11151d]">
        <div className="border-b border-stone-200 bg-stone-50/70 px-5 py-2.5 flex justify-between text-xs dark:border-zinc-800 dark:bg-zinc-900/60">
          <span className="font-mono font-semibold text-stone-700 dark:text-zinc-300">
            Fig. 9.1 · CLIP 3D 单位超球面 S² 对比对齐几何（实心方框 ■ = 图像 Î，空心圆 ○ = 文本 T̂）
          </span>
          <span className="font-mono text-[11px] text-stone-400">鼠标拖拽旋转 S² 球面</span>
        </div>
        <div className="p-5 grid grid-cols-1 md:grid-cols-12 gap-5 items-center text-xs">
          <div className="md:col-span-7 flex justify-center">
            <canvas ref={canvasRef} {...bindDrag} className="w-full max-w-[400px] aspect-[400/270] rounded border border-stone-200 bg-stone-50 dark:border-zinc-800 dark:bg-zinc-950 cursor-grab active:cursor-grabbing" />
          </div>
          <div className="md:col-span-5 space-y-3">
            <div className="space-y-1 font-mono text-[11px]">
              <div className="flex justify-between">
                <span>对比训练对齐进度</span>
                <span className="font-semibold text-blue-700 dark:text-blue-400">{Math.round(clipAlign * 100)}%</span>
              </div>
              <input type="range" min={0} max={1} step={0.02} value={clipAlign} onChange={(e) => setClipAlign(parseFloat(e.target.value))} className="w-full" />
            </div>
            <p className="leading-relaxed text-stone-600 dark:text-zinc-400">
              L2 归一化把图像和文本向量全部约束在单位超球面 S^(D−1) 上。对称 InfoNCE 损失同时优化两个几何性质：① <strong>Alignment（对齐性）</strong>——拉近匹配图文对夹角；② <strong>Uniformity（均匀性）</strong>——将不相关概念均匀推开铺满超球面。
            </p>
          </div>
        </div>
      </figure>
    );
  }

  if (lectureCode === 'L10') {
    const gradPath = (fn: (d: number) => number) =>
      Array.from({ length: 90 }, (_, i) => {
        const d = 0.05 + (0.9 * i) / 89;
        const g = Math.min(12, fn(d));
        const x = 30 + d * 260;
        const y = 165 - (g / 12) * 140;
        return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
      }).join(' ');

    return (
      <figure className="rounded-lg border border-stone-200 bg-white overflow-hidden dark:border-zinc-800 dark:bg-[#11151d]">
        <div className="border-b border-stone-200 bg-stone-50/70 px-5 py-2.5 flex justify-between text-xs dark:border-zinc-800 dark:bg-zinc-900/60">
          <span className="font-mono font-semibold text-stone-700 dark:text-zinc-300">
            Fig. 10.1 · 3D 瑞士卷流形扩散 (DDPM vs Flow ODE) & GAN 生成器梯度幅值对比
          </span>
          <span className="font-mono text-[11px] text-stone-400">左图可拖拽旋转 3D 流形</span>
        </div>
        <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-6 items-center text-xs">
          <div className="space-y-2.5 flex flex-col items-center">
            <canvas ref={canvasRef} {...bindDrag} className="w-full max-w-[400px] aspect-[400/270] rounded border border-stone-200 bg-stone-50 dark:border-zinc-800 dark:bg-zinc-950 cursor-grab active:cursor-grabbing" />
            <div className="w-full max-w-[400px] space-y-1.5 font-mono text-[11px]">
              <div className="flex items-center justify-between">
                <div className="flex gap-1.5">
                  <button onClick={() => setDiffMode('ddpm')} className={`rounded border px-2 py-0.5 cursor-pointer ${diffMode === 'ddpm' ? 'border-red-700 bg-red-700 text-white' : 'border-stone-300 dark:border-zinc-700'}`}>DDPM (曲线 SDE)</button>
                  <button onClick={() => setDiffMode('flow')} className={`rounded border px-2 py-0.5 cursor-pointer ${diffMode === 'flow' ? 'border-emerald-700 bg-emerald-700 text-white' : 'border-stone-300 dark:border-zinc-700'}`}>Flow (直线 ODE)</button>
                </div>
                <span>t = {diffT.toFixed(2)}</span>
              </div>
              <input type="range" min={0} max={1} step={0.01} value={diffT} onChange={(e) => setDiffT(parseFloat(e.target.value))} className="w-full" />
            </div>
          </div>

          <div className="space-y-2">
            <div className="font-mono text-[11px] text-stone-500">GAN 生成器梯度幅值 |∂L/∂D|（WA4 Q2 核心）</div>
            <svg viewBox="0 0 310 185" className="w-full h-auto rounded border border-stone-200 bg-stone-50 dark:border-zinc-800 dark:bg-zinc-950">
              <line x1={30} x2={290} y1={165} y2={165} className="stroke-stone-300 dark:stroke-zinc-700" />
              <path d={gradPath((d) => 1 / (1 - d))} fill="none" stroke="#64748b" strokeWidth={2} strokeDasharray="4 3" />
              <path d={gradPath((d) => 1 / d)} fill="none" stroke="#b91c1c" strokeWidth={2.4} />
              <text x={44} y={32} className="fill-red-700 dark:fill-red-400 text-[9.5px] font-mono">─ 非饱和 −log D (D→0 梯度强劲)</text>
              <text x={44} y={46} className="fill-stone-500 text-[9.5px] font-mono">-- 原始 log(1−D) (D→0 梯度消失)</text>
              <text x={160} y={180} textAnchor="middle" className="fill-stone-400 text-[9.5px] font-mono">D(G(z)) ∈ (0, 1)</text>
            </svg>
          </div>
        </div>
      </figure>
    );
  }

  // --- L11: 3D Bellman Value Surface + PPO Clipped Curve ---
  const ppoPath = (clipped: boolean) =>
    Array.from({ length: 81 }, (_, i) => {
      const r = 0.2 + (1.6 * i) / 80;
      const u = r * ppoAdv;
      const c = Math.max(1 - ppoEps, Math.min(1 + ppoEps, r)) * ppoAdv;
      const yVal = clipped ? Math.min(u, c) : u;
      const px = 30 + ((r - 0.2) / 1.6) * 260;
      const py = 95 - (yVal / 1.9) * 72;
      return `${i === 0 ? 'M' : 'L'} ${px.toFixed(1)} ${py.toFixed(1)}`;
    }).join(' ');

  return (
    <figure className="rounded-lg border border-stone-200 bg-white overflow-hidden dark:border-zinc-800 dark:bg-[#11151d]">
      <div className="border-b border-stone-200 bg-stone-50/70 px-5 py-2.5 flex justify-between text-xs dark:border-zinc-800 dark:bg-zinc-900/60">
        <span className="font-mono font-semibold text-stone-700 dark:text-zinc-300">
          Fig. 11.1 · 3D Bellman 最优价值地形 V*(s)（折扣 γ 传播）& PPO 裁剪目标函数曲线
        </span>
        <span className="font-mono text-[11px] text-stone-400">左图可拖拽旋转 3D 价值曲面</span>
      </div>
      <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-6 items-center text-xs">
        <div className="space-y-2 flex flex-col items-center">
          <canvas ref={canvasRef} {...bindDrag} className="w-full max-w-[400px] aspect-[400/270] rounded border border-stone-200 bg-stone-50 dark:border-zinc-800 dark:bg-zinc-950 cursor-grab active:cursor-grabbing" />
          <div className="w-full max-w-[400px] space-y-1 font-mono text-[11px]">
            <div className="flex justify-between">
              <span>折扣因子 γ = {gamma.toFixed(2)}</span>
              <span className="text-stone-500">γ 越大，终点高价值向远方传播越广</span>
            </div>
            <input type="range" min={0} max={0.96} step={0.04} value={gamma} onChange={(e) => setGamma(parseFloat(e.target.value))} className="w-full" />
          </div>
        </div>

        <div className="space-y-2.5">
          <svg viewBox="0 0 310 190" className="w-full h-auto rounded border border-stone-200 bg-stone-50 dark:border-zinc-800 dark:bg-zinc-950">
            <rect x={30 + ((1 - ppoEps - 0.2) / 1.6) * 260} y={16} width={((2 * ppoEps) / 1.6) * 260} height={154} fill="rgba(29,78,216,0.08)" />
            <line x1={30} x2={290} y1={95} y2={95} className="stroke-stone-300 dark:stroke-zinc-700" />
            <line x1={30 + (0.8 / 1.6) * 260} x2={30 + (0.8 / 1.6) * 260} y1={16} y2={170} className="stroke-stone-400" strokeDasharray="3 3" />
            <path d={ppoPath(false)} fill="none" stroke="#94a3b8" strokeWidth={1.8} strokeDasharray="4 3" />
            <path d={ppoPath(true)} fill="none" stroke="#047857" strokeWidth={2.5} />
            <text x={160} y={183} textAnchor="middle" className="fill-stone-400 text-[9.5px] font-mono">r_t(θ) = π_θ / π_old (Trust Region 1±ε)</text>
          </svg>
          <div className="flex flex-wrap items-center justify-between gap-2 font-mono text-[11px]">
            <div className="flex gap-1.5">
              <button onClick={() => setPpoAdv(1)} className={`rounded border px-2 py-0.5 cursor-pointer ${ppoAdv > 0 ? 'border-emerald-700 bg-emerald-700 text-white' : 'border-stone-300 dark:border-zinc-700'}`}>Â_t &gt; 0 (好动作)</button>
              <button onClick={() => setPpoAdv(-1)} className={`rounded border px-2 py-0.5 cursor-pointer ${ppoAdv < 0 ? 'border-red-700 bg-red-700 text-white' : 'border-stone-300 dark:border-zinc-700'}`}>Â_t &lt; 0 (坏动作)</button>
            </div>
            <span>ε = {ppoEps.toFixed(2)}</span>
          </div>
          <input type="range" min={0.05} max={0.4} step={0.05} value={ppoEps} onChange={(e) => setPpoEps(parseFloat(e.target.value))} className="w-full" />
        </div>
      </div>
    </figure>
  );
};
