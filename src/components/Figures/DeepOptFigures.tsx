import React, { useEffect, useRef, useState } from 'react';
import {
  academicRamp,
  Camera3D,
  drawAxes3D,
  project3D,
  setupCanvasDPR,
  Vec3,
} from '../../utils/projection3d';

interface DeepOptFiguresProps {
  lectureCode: 'L04' | 'L05' | 'L06' | 'L07';
  isDark: boolean;
}

const sig = (x: number) => 1 / (1 + Math.exp(-x));

export const DeepOptFigures: React.FC<DeepOptFiguresProps> = ({ lectureCode, isDark }) => {
  // L04 probe
  const [probeX, setProbeX] = useState(0.5);

  // L05 3D Optimization Surface
  const [yaw, setYaw] = useState(0.74);
  const [pitch, setPitch] = useState(0.52);
  const [surface, setSurface] = useState<'saddle' | 'ravine'>('saddle');
  const dragRef = useRef({ active: false, x: 0, y: 0 });
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // L06 ResNet depth & receptive field
  const [cnnLayers, setCnnLayers] = useState(3);
  const [wScale, setWScale] = useState(0.75);

  // L07 RNN spectral radius
  const [rhoW, setRhoW] = useState(0.75);

  // --- L05 3D Optimization Landscape with Real Precomputed Trajectories ---
  useEffect(() => {
    if (lectureCode !== 'L05') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const W = 420;
    const H = 270;
    const ctx = setupCanvasDPR(canvas, W, H);
    if (!ctx) return;

    const cam: Camera3D = { yaw, pitch, dist: 5.0, fov: 350 };
    ctx.clearRect(0, 0, W, H);

    const evalL = (x: number, z: number) =>
      surface === 'saddle'
        ? 0.45 * (x * x - z * z) + 0.14 * (x ** 4 + z ** 4) + 0.15 * x + 0.7
        : 0.12 * x * x + 1.3 * z * z;
    const evalG = (x: number, z: number): [number, number] => {
      const e = 1e-4;
      return [(evalL(x + e, z) - evalL(x - e, z)) / (2 * e), (evalL(x, z + e) - evalL(x, z - e)) / (2 * e)];
    };

    const maxH = 2.3;
    const to3D = (x: number, z: number): Vec3 => ({
      x,
      y: (Math.min(maxH, evalL(x, z)) / maxH) * 1.4 - 0.65,
      z,
    });

    const N = 20;
    const grid: Vec3[][] = Array.from({ length: N + 1 }, (_, i) => {
      const x = -1.6 + (3.2 * i) / N;
      return Array.from({ length: N + 1 }, (_, j) => to3D(x, -1.6 + (3.2 * j) / N));
    });

    const quads: { pts: Vec3[]; depth: number; norm: number }[] = [];
    for (let i = 0; i < N; i++) {
      for (let j = 0; j < N; j++) {
        const pts = [grid[i][j], grid[i + 1][j], grid[i + 1][j + 1], grid[i][j + 1]];
        const mid = { x: (pts[0].x + pts[2].x) / 2, y: (pts[0].y + pts[2].y) / 2, z: (pts[0].z + pts[2].z) / 2 };
        quads.push({ pts, depth: project3D(mid, cam, W, H).depth, norm: (mid.y + 0.65) / 1.4 });
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
      ctx.fillStyle = academicRamp(q.norm, 0.78);
      ctx.fill();
      ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.16)';
      ctx.lineWidth = 0.5;
      ctx.stroke();
    }
    drawAxes3D(ctx, cam, W, H, 1.7, ['θ₁', 'L(θ)', 'θ₂'], isDark);

    // Compute exact 70-step trajectories for SGD, Momentum, Adam
    const start: [number, number] = surface === 'saddle' ? [-0.15, 0.22] : [-1.45, 1.05];
    const runOpt = (kind: 'sgd' | 'mom' | 'adam'): [number, number][] => {
      let [x, z] = start;
      let vx = 0, vz = 0, sx = 0, sz = 0;
      const path: [number, number][] = [[x, z]];
      for (let t = 1; t <= 75; t++) {
        const [gx, gz] = evalG(x, z);
        if (kind === 'sgd') {
          x -= 0.08 * gx;
          z -= 0.08 * gz;
        } else if (kind === 'mom') {
          vx = 0.85 * vx + gx;
          vz = 0.85 * vz + gz;
          x -= 0.055 * vx;
          z -= 0.055 * vz;
        } else {
          vx = 0.85 * vx + 0.15 * gx;
          vz = 0.85 * vz + 0.15 * gz;
          sx = 0.95 * sx + 0.05 * gx * gx;
          sz = 0.95 * sz + 0.05 * gz * gz;
          const mhx = vx / (1 - 0.85 ** t);
          const mhz = vz / (1 - 0.85 ** t);
          const vhx = sx / (1 - 0.95 ** t);
          const vhz = sz / (1 - 0.95 ** t);
          x -= (0.09 * mhx) / (Math.sqrt(vhx) + 1e-5);
          z -= (0.09 * mhz) / (Math.sqrt(vhz) + 1e-5);
        }
        x = Math.max(-1.6, Math.min(1.6, x));
        z = Math.max(-1.6, Math.min(1.6, z));
        path.push([x, z]);
      }
      return path;
    };

    const specs: { kind: 'sgd' | 'mom' | 'adam'; color: string }[] = [
      { kind: 'sgd', color: '#dc2626' },
      { kind: 'mom', color: '#d97706' },
      { kind: 'adam', color: '#059669' },
    ];
    for (const sp of specs) {
      const path = runOpt(sp.kind);
      ctx.beginPath();
      path.forEach(([px, pz], idx) => {
        const p3 = to3D(px, pz);
        const p2 = project3D({ x: p3.x, y: p3.y + 0.04, z: p3.z }, cam, W, H);
        if (idx === 0) ctx.moveTo(p2.x, p2.y);
        else ctx.lineTo(p2.x, p2.y);
      });
      ctx.strokeStyle = sp.color;
      ctx.lineWidth = 2.3;
      ctx.stroke();

      const last = path[path.length - 1];
      const lp = project3D({ ...to3D(last[0], last[1]), y: to3D(last[0], last[1]).y + 0.05 }, cam, W, H);
      ctx.beginPath();
      ctx.arc(lp.x, lp.y, 4.5, 0, Math.PI * 2);
      ctx.fillStyle = sp.color;
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
  }, [lectureCode, yaw, pitch, surface, isDark]);

  if (lectureCode === 'L04') {
    const acts = [
      { name: 'Sigmoid', color: '#b91c1c', f: sig, df: (x: number) => sig(x) * (1 - sig(x)) },
      { name: 'Tanh', color: '#b45309', f: Math.tanh, df: (x: number) => 1 - Math.tanh(x) ** 2 },
      { name: 'ReLU', color: '#1d4ed8', f: (x: number) => Math.max(0, x), df: (x: number) => (x > 0 ? 1 : 0) },
      { name: 'GELU/Swish', color: '#047857', f: (x: number) => x * sig(1.702 * x), df: (x: number) => sig(1.702 * x) + 1.702 * x * sig(1.702 * x) * (1 - sig(1.702 * x)) },
    ];
    const mkPath = (fn: (x: number) => number, yMin: number, yMax: number) =>
      Array.from({ length: 81 }, (_, i) => {
        const x = -4 + (8 * i) / 80;
        const y = Math.max(yMin, Math.min(yMax, fn(x)));
        const px = 26 + ((x + 4) / 8) * 268;
        const py = 162 - ((y - yMin) / (yMax - yMin)) * 138;
        return `${i === 0 ? 'M' : 'L'} ${px.toFixed(1)} ${py.toFixed(1)}`;
      }).join(' ');

    return (
      <figure className="rounded-lg border border-stone-200 bg-white overflow-hidden dark:border-zinc-800 dark:bg-[#11151d]">
        <div className="border-b border-stone-200 bg-stone-50/70 px-5 py-2.5 text-xs font-mono font-semibold text-stone-700 dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-300">
          Fig. 4.1 · 激活函数形态 f(x) 与一阶导数 f′(x) 饱和特性对照
        </div>
        <div className="p-5 space-y-3 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { title: '前向激活值 f(x)', yMin: -1.4, yMax: 3.4, useDeriv: false },
              { title: '反向导数 f′(x)（注意 Sigmoid 峰值 ≤ 0.25）', yMin: -0.15, yMax: 1.25, useDeriv: true },
            ].map((panel) => (
              <div key={panel.title} className="space-y-1">
                <div className="font-mono text-[11px] text-stone-500">{panel.title}</div>
                <svg viewBox="0 0 310 180" className="w-full h-auto rounded border border-stone-200 bg-stone-50 dark:border-zinc-800 dark:bg-zinc-950">
                  <line x1={26} x2={294} y1={162 - ((0 - panel.yMin) / (panel.yMax - panel.yMin)) * 138} y2={162 - ((0 - panel.yMin) / (panel.yMax - panel.yMin)) * 138} className="stroke-stone-300 dark:stroke-zinc-700" />
                  <line x1={160} x2={160} y1={18} y2={162} className="stroke-stone-300 dark:stroke-zinc-700" />
                  <line x1={26 + ((probeX + 4) / 8) * 268} x2={26 + ((probeX + 4) / 8) * 268} y1={18} y2={162} stroke="#64748b" strokeDasharray="3 2" />
                  {acts.map((a) => (
                    <path key={a.name} d={mkPath(panel.useDeriv ? a.df : a.f, panel.yMin, panel.yMax)} fill="none" stroke={a.color} strokeWidth={2} />
                  ))}
                </svg>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-3 font-mono text-[11px]">
            <span>探测点 x = {probeX.toFixed(1)}</span>
            <input type="range" min={-3.5} max={3.5} step={0.1} value={probeX} onChange={(e) => setProbeX(parseFloat(e.target.value))} className="w-40" />
            {acts.map((a) => (
              <span key={a.name} style={{ color: a.color }}>
                {a.name}: f′={a.df(probeX).toFixed(3)}
              </span>
            ))}
          </div>
        </div>
      </figure>
    );
  }

  if (lectureCode === 'L05') {
    return (
      <figure className="rounded-lg border border-stone-200 bg-white overflow-hidden dark:border-zinc-800 dark:bg-[#11151d]">
        <div className="border-b border-stone-200 bg-stone-50/70 px-5 py-2.5 flex flex-wrap justify-between gap-2 text-xs dark:border-zinc-800 dark:bg-zinc-900/60">
          <span className="font-mono font-semibold text-stone-700 dark:text-zinc-300">
            Fig. 5.1 · 3D 非凸损失曲面优化轨迹（SGD vs Momentum vs Adam）与 BN/LN 张量切片示意
          </span>
          <span className="font-mono text-[11px] text-stone-400">左图可鼠标拖拽旋转 3D 地形</span>
        </div>
        <div className="p-5 grid grid-cols-1 lg:grid-cols-12 gap-5 items-center text-xs">
          <div className="lg:col-span-7 flex flex-col items-center gap-2">
            <canvas
              ref={canvasRef}
              onMouseDown={(e) => { dragRef.current = { active: true, x: e.clientX, y: e.clientY }; }}
              onMouseMove={(e) => {
                if (!dragRef.current.active) return;
                const dx = e.clientX - dragRef.current.x;
                const dy = e.clientY - dragRef.current.y;
                dragRef.current.x = e.clientX;
                dragRef.current.y = e.clientY;
                setYaw((v) => v + dx * 0.01);
                setPitch((v) => Math.max(0.12, Math.min(1.28, v + dy * 0.01)));
              }}
              onMouseUp={() => { dragRef.current.active = false; }}
              onMouseLeave={() => { dragRef.current.active = false; }}
              className="w-full max-w-[420px] aspect-[420/270] rounded border border-stone-200 bg-stone-50 dark:border-zinc-800 dark:bg-zinc-950 cursor-grab active:cursor-grabbing"
            />
            <div className="flex flex-wrap items-center justify-between w-full max-w-[420px] gap-2 font-mono text-[11px]">
              <div className="flex gap-1.5">
                <button onClick={() => setSurface('saddle')} className={`rounded border px-2 py-0.5 cursor-pointer ${surface === 'saddle' ? 'border-blue-600 bg-blue-600 text-white' : 'border-stone-300 dark:border-zinc-700'}`}>3D 鞍点双谷</button>
                <button onClick={() => setSurface('ravine')} className={`rounded border px-2 py-0.5 cursor-pointer ${surface === 'ravine' ? 'border-blue-600 bg-blue-600 text-white' : 'border-stone-300 dark:border-zinc-700'}`}>3D 病态峡谷</button>
              </div>
              <div className="flex gap-2.5">
                <span className="text-red-600 font-semibold">─ SGD</span>
                <span className="text-amber-600 font-semibold">─ Momentum</span>
                <span className="text-emerald-600 font-semibold">─ Adam</span>
              </div>
            </div>
          </div>

          {/* Crisp 3D Tensor Cube Slice Schematic for BN vs LN */}
          <div className="lg:col-span-5 space-y-3">
            <div className="font-mono text-[11px] font-semibold text-stone-600 dark:text-zinc-400">
              3D 激活张量 (N, L, C) 归一化切片几何对比
            </div>
            <svg viewBox="0 0 280 155" className="w-full h-auto rounded border border-stone-200 bg-stone-50 dark:border-zinc-800 dark:bg-zinc-950">
              {/* Left Cube: BatchNorm slice along N,L for fixed C */}
              <g transform="translate(20, 22)">
                <rect x={0} y={24} width={72} height={72} fill="none" className="stroke-stone-400" strokeWidth={1.2} />
                <path d="M 0 24 L 22 4 L 94 4 L 72 24 M 94 4 L 94 76 L 72 96" fill="none" className="stroke-stone-400" strokeWidth={1.2} />
                {/* Highlighted vertical slice along C */}
                <polygon points="24,24 46,4 62,4 40,24" fill="rgba(29,78,216,0.35)" stroke="#1d4ed8" />
                <rect x={24} y={24} width={16} height={72} fill="rgba(29,78,216,0.28)" stroke="#1d4ed8" />
                <text x={46} y={118} textAnchor="middle" className="fill-blue-700 dark:fill-blue-400 text-[10px] font-mono font-bold">BatchNorm (固定 C 跨 N)</text>
              </g>

              {/* Right Cube: LayerNorm slice along C,L for fixed N */}
              <g transform="translate(155, 22)">
                <rect x={0} y={24} width={72} height={72} fill="none" className="stroke-stone-400" strokeWidth={1.2} />
                <path d="M 0 24 L 22 4 L 94 4 L 72 24 M 94 4 L 94 76 L 72 96" fill="none" className="stroke-stone-400" strokeWidth={1.2} />
                {/* Highlighted horizontal slice for single sample N */}
                <polygon points="0,48 22,28 94,28 72,48" fill="rgba(4,120,87,0.35)" stroke="#047857" />
                <rect x={0} y={48} width={72} height={16} fill="rgba(4,120,87,0.28)" stroke="#047857" />
                <text x={46} y={118} textAnchor="middle" className="fill-emerald-700 dark:fill-emerald-400 text-[10px] font-mono font-bold">LayerNorm (固定 N 跨 C)</text>
              </g>
            </svg>
            <p className="text-[11px] leading-relaxed text-stone-500 dark:text-zinc-400">
              蓝色切片跨越 Batch 维 N（小 Batch 或变长句会崩溃）；绿色切片在单个样本内部跨通道 C 归一化，彻底独立于 Batch 大小。
            </p>
          </div>
        </div>
      </figure>
    );
  }

  if (lectureCode === 'L06') {
    const rf = 1 + 2 * cnnLayers;
    const depths = Array.from({ length: 25 }, (_, i) => i);
    const toLogPath = (fn: (l: number) => number) =>
      depths
        .map((l, i) => {
          const x = 34 + (i / 24) * 260;
          const lv = Math.max(-4, Math.min(1, Math.log10(Math.max(1e-5, fn(l)))));
          const y = 160 - ((lv + 4) / 5) * 136;
          return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
        })
        .join(' ');

    return (
      <figure className="rounded-lg border border-stone-200 bg-white overflow-hidden dark:border-zinc-800 dark:bg-[#11151d]">
        <div className="border-b border-stone-200 bg-stone-50/70 px-5 py-2.5 text-xs font-mono font-semibold text-stone-700 dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-300">
          Fig. 6.1 · 3×3 卷积堆叠感受野扩张 & ResNet 残差跳连梯度幅值曲线（对数坐标）
        </div>
        <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-6 items-center text-xs">
          <div className="space-y-3 flex flex-col items-center">
            <div className="grid grid-cols-9 gap-1">
              {Array.from({ length: 81 }, (_, idx) => {
                const r = Math.floor(idx / 9);
                const c = idx % 9;
                const dist = Math.max(Math.abs(r - 4), Math.abs(c - 4));
                const inRF = dist <= cnnLayers;
                return (
                  <div
                    key={idx}
                    className={`h-5 w-5 rounded-[2px] border transition ${
                      dist === 0
                        ? 'bg-blue-700 border-blue-700'
                        : inRF
                        ? 'bg-blue-500/30 border-blue-500/60'
                        : 'bg-stone-100 border-stone-200 dark:bg-zinc-900 dark:border-zinc-800'
                    }`}
                  />
                );
              })}
            </div>
            <div className="flex items-center gap-2 font-mono text-[11px]">
              <span>堆叠 3×3 层数:</span>
              {[1, 2, 3, 4].map((l) => (
                <button key={l} onClick={() => setCnnLayers(l)} className={`rounded border px-2 py-0.5 cursor-pointer ${cnnLayers === l ? 'border-blue-600 bg-blue-600 text-white' : 'border-stone-300 dark:border-zinc-700'}`}>
                  L={l} ({1 + 2 * l}×{1 + 2 * l})
                </button>
              ))}
            </div>
            <div className="text-[11px] text-stone-500">当前中心输出神经元有效感受野 = <strong>{rf} × {rf}</strong></div>
          </div>

          <div className="space-y-2">
            <svg viewBox="0 0 310 180" className="w-full h-auto rounded border border-stone-200 bg-stone-50 dark:border-zinc-800 dark:bg-zinc-950">
              {[-4, -2, 0].map((lv) => {
                const y = 160 - ((lv + 4) / 5) * 136;
                return (
                  <g key={lv}>
                    <line x1={34} x2={294} y1={y} y2={y} className="stroke-stone-200 dark:stroke-zinc-800" strokeDasharray="3 3" />
                    <text x={28} y={y + 3} textAnchor="end" className="fill-stone-400 text-[9px] font-mono">10^{lv}</text>
                  </g>
                );
              })}
              <path d={toLogPath((l) => Math.pow(wScale, l))} fill="none" stroke="#b91c1c" strokeWidth={2.2} />
              <path d={toLogPath((l) => Math.pow(1 + 0.1 * (wScale - 0.7), l))} fill="none" stroke="#047857" strokeWidth={2.4} />
              <text x={42} y={24} className="fill-emerald-700 dark:fill-emerald-400 text-[9.5px] font-mono">─ ResNet (I + ∂F/∂x)</text>
              <text x={180} y={24} className="fill-red-700 dark:fill-red-400 text-[9.5px] font-mono">─ Plain Net (w^L)</text>
            </svg>
            <div className="flex items-center gap-2 font-mono text-[11px]">
              <span>单层雅可比尺度 |w| = {wScale.toFixed(2)}</span>
              <input type="range" min={0.5} max={1.15} step={0.05} value={wScale} onChange={(e) => setWScale(parseFloat(e.target.value))} className="flex-1" />
            </div>
          </div>
        </div>
      </figure>
    );
  }

  // --- L07: BPTT Spectral Radius Decay Curve ---
  const steps = Array.from({ length: 41 }, (_, i) => i);
  const toRnnPath = (base: number) =>
    steps
      .map((t, i) => {
        const x = 42 + (i / 40) * 456;
        const lv = Math.max(-5, Math.min(2, Math.log10(Math.max(1e-6, Math.pow(base, t)))));
        const y = 175 - ((lv + 5) / 7) * 145;
        return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(' ');

  return (
    <figure className="rounded-lg border border-stone-200 bg-white overflow-hidden dark:border-zinc-800 dark:bg-[#11151d]">
      <div className="border-b border-stone-200 bg-stone-50/70 px-5 py-2.5 text-xs font-mono font-semibold text-stone-700 dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-300">
        Fig. 7.1 · BPTT 随序列步长 T 的梯度幅值对数演化（谱半径 ρ(W_hh) vs LSTM 记忆通道）
      </div>
      <div className="p-5 space-y-3 text-xs">
        <svg viewBox="0 0 530 195" className="w-full h-auto rounded border border-stone-200 bg-stone-50 dark:border-zinc-800 dark:bg-zinc-950">
          {[-4, -2, 0, 2].map((lv) => {
            const y = 175 - ((lv + 5) / 7) * 145;
            return (
              <g key={lv}>
                <line x1={42} x2={498} y1={y} y2={y} className="stroke-stone-200 dark:stroke-zinc-800" strokeDasharray={lv === 0 ? undefined : '3 3'} />
                <text x={35} y={y + 3} textAnchor="end" className="fill-stone-400 text-[9.5px] font-mono">10^{lv}</text>
              </g>
            );
          })}
          <path d={toRnnPath(rhoW)} fill="none" stroke="#b91c1c" strokeWidth={2.4} />
          <path d={toRnnPath(0.97)} fill="none" stroke="#047857" strokeWidth={2.4} />
          <text x={54} y={24} className="fill-emerald-700 dark:fill-emerald-400 text-[10px] font-mono">─ LSTM Cell Highway (f_t ≈ 0.97)</text>
          <text x={280} y={24} className="fill-red-700 dark:fill-red-400 text-[10px] font-mono">─ Vanilla RNN (ρ^T, ρ={rhoW.toFixed(2)})</text>
        </svg>
        <div className="flex items-center gap-3 font-mono text-[11px]">
          <span>调整 Vanilla RNN 有效谱半径 ρ = {rhoW.toFixed(2)}:</span>
          <input type="range" min={0.55} max={1.15} step={0.03} value={rhoW} onChange={(e) => setRhoW(parseFloat(e.target.value))} className="flex-1 max-w-xs" />
          <span className="text-stone-500">{rhoW < 0.98 ? '指数级梯度消失' : rhoW > 1.02 ? '指数级梯度爆炸 (需 Clip)' : '临界稳定'}</span>
        </div>
      </div>
    </figure>
  );
};
