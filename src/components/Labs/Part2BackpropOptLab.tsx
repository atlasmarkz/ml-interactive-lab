import React, { useEffect, useRef, useState } from 'react';
import { Activity, Play, Pause, RotateCcw, Zap } from 'lucide-react';

type LandscapeId = 'ravine' | 'saddle';

function lossFn(kind: LandscapeId, x: number, y: number): number {
  if (kind === 'ravine') {
    // Ill-conditioned elongated valley: steep along y, shallow along x
    return 0.12 * x * x + 2.2 * y * y;
  }
  // Saddle + tilted basin
  return 0.35 * (x * x - y * y) + 0.08 * (x * x * x * x + y * y * y * y) + 0.15 * x;
}

function gradFn(kind: LandscapeId, x: number, y: number): [number, number] {
  if (kind === 'ravine') {
    return [0.24 * x, 4.4 * y];
  }
  return [0.7 * x + 0.32 * x * x * x + 0.15, -0.7 * y + 0.32 * y * y * y];
}

interface OptState {
  name: string;
  color: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  sx: number;
  sy: number;
  t: number;
  path: [number, number][];
}

function initOptimizers(startX: number, startY: number): OptState[] {
  const base = { x: startX, y: startY, vx: 0, vy: 0, sx: 0, sy: 0, t: 0, path: [[startX, startY] as [number, number]] };
  return [
    { ...base, name: 'SGD', color: '#ef4444', path: [[startX, startY]] },
    { ...base, name: 'Momentum', color: '#f59e0b', path: [[startX, startY]] },
    { ...base, name: 'RMSProp', color: '#8b5cf6', path: [[startX, startY]] },
    { ...base, name: 'Adam', color: '#10b981', path: [[startX, startY]] },
  ];
}

export const Part2BackpropOptLab: React.FC = () => {
  const [tab, setTab] = useState<'backprop' | 'opt'>('backprop');

  // --- Tab 1: Backprop Computational Graph ---
  const [xVal, setXVal] = useState(1.5);
  const [w1, setW1] = useState(0.8);
  const [b1, setB1] = useState(-0.3);
  const [w2, setW2] = useState(1.2);
  const [yTarget, setYTarget] = useState(2.0);
  const [passView, setPassView] = useState<'both' | 'fwd' | 'bwd'>('both');

  // Exact forward pass
  const z1 = w1 * xVal + b1;
  const h = Math.max(0, z1);
  const yHat = w2 * h;
  const diff = yHat - yTarget;
  const loss = 0.5 * diff * diff;

  // Exact backward pass (chain rule)
  const dLoss_dyHat = diff;
  const dLoss_dw2 = dLoss_dyHat * h;
  const dLoss_dh = dLoss_dyHat * w2;
  const reluMask = z1 > 0 ? 1 : 0;
  const dLoss_dz1 = dLoss_dh * reluMask;
  const dLoss_dw1 = dLoss_dz1 * xVal;
  const dLoss_db1 = dLoss_dz1;
  const deadRelu = z1 <= 0;

  // --- Tab 2: Optimizer Arena ---
  const [landscape, setLandscape] = useState<LandscapeId>('ravine');
  const [lr, setLr] = useState(0.22);
  const [running, setRunning] = useState(false);
  const [startPt, setStartPt] = useState<[number, number]>([-2.6, 1.3]);
  const [opts, setOpts] = useState<OptState[]>(() => initOptimizers(-2.6, 1.3));
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const resetArena = (sx = startPt[0], sy = startPt[1]) => {
    setRunning(false);
    setOpts(initOptimizers(sx, sy));
  };

  useEffect(() => {
    if (!running || tab !== 'opt') return;
    const timer = window.setInterval(() => {
      setOpts((prev) =>
        prev.map((o) => {
          if (o.path.length > 140) return o;
          const [gx, gy] = gradFn(landscape, o.x, o.y);
          const clamp = (v: number) => Math.max(-3.2, Math.min(3.2, v));
          let nx = o.x;
          let ny = o.y;
          let vx = o.vx;
          let vy = o.vy;
          let sx = o.sx;
          let sy = o.sy;
          const t = o.t + 1;

          if (o.name === 'SGD') {
            nx = o.x - lr * gx;
            ny = o.y - lr * gy;
          } else if (o.name === 'Momentum') {
            vx = 0.82 * o.vx + gx;
            vy = 0.82 * o.vy + gy;
            nx = o.x - lr * 0.45 * vx;
            ny = o.y - lr * 0.45 * vy;
          } else if (o.name === 'RMSProp') {
            sx = 0.9 * o.sx + 0.1 * gx * gx;
            sy = 0.9 * o.sy + 0.1 * gy * gy;
            nx = o.x - (lr * 0.45 * gx) / (Math.sqrt(sx) + 1e-6);
            ny = o.y - (lr * 0.45 * gy) / (Math.sqrt(sy) + 1e-6);
          } else if (o.name === 'Adam') {
            const b1c = 0.85;
            const b2c = 0.95;
            vx = b1c * o.vx + (1 - b1c) * gx;
            vy = b1c * o.vy + (1 - b1c) * gy;
            sx = b2c * o.sx + (1 - b2c) * gx * gx;
            sy = b2c * o.sy + (1 - b2c) * gy * gy;
            const mhx = vx / (1 - Math.pow(b1c, t));
            const mhy = vy / (1 - Math.pow(b1c, t));
            const vhx = sx / (1 - Math.pow(b2c, t));
            const vhy = sy / (1 - Math.pow(b2c, t));
            nx = o.x - (lr * 0.65 * mhx) / (Math.sqrt(vhx) + 1e-6);
            ny = o.y - (lr * 0.65 * mhy) / (Math.sqrt(vhy) + 1e-6);
          }

          nx = clamp(nx);
          ny = clamp(ny);
          return {
            ...o,
            x: nx,
            y: ny,
            vx,
            vy,
            sx,
            sy,
            t,
            path: [...o.path, [nx, ny]],
          };
        })
      );
    }, 55);
    return () => window.clearInterval(timer);
  }, [running, tab, landscape, lr]);

  // Render Optimizer Landscape Canvas
  useEffect(() => {
    if (tab !== 'opt') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = 460;
    const H = 300;
    const gxN = 92;
    const gyN = 60;
    const cw = W / gxN;
    const ch = H / gyN;

    for (let j = 0; j < gyN; j++) {
      const y = 2.2 - ((j + 0.5) / gyN) * 4.4;
      for (let i = 0; i < gxN; i++) {
        const x = -3.2 + ((i + 0.5) / gxN) * 6.4;
        const val = lossFn(landscape, x, y);
        const norm = Math.tanh((val + 0.5) * 0.35);
        // Deep slate-blue low valleys -> warm amber peaks
        const r = Math.round(18 + norm * 165);
        const g = Math.round(32 + (1 - Math.abs(norm - 0.5) * 2) * 95 + norm * 40);
        const b = Math.round(92 + (1 - norm) * 120);
        // Subtle contour banding
        const band = Math.abs((val * 3.5) % 1) < 0.08 ? 16 : 0;
        ctx.fillStyle = `rgb(${Math.min(255, r + band)},${Math.min(255, g + band)},${Math.min(255, b + band)})`;
        ctx.fillRect(i * cw, j * ch, cw + 0.6, ch + 0.6);
      }
    }

    const toPxX = (x: number) => ((x + 3.2) / 6.4) * W;
    const toPxY = (y: number) => ((2.2 - y) / 4.4) * H;

    // Draw trajectories
    for (const o of opts) {
      ctx.beginPath();
      o.path.forEach(([px, py], idx) => {
        const sx = toPxX(px);
        const sy = toPxY(py);
        if (idx === 0) ctx.moveTo(sx, sy);
        else ctx.lineTo(sx, sy);
      });
      ctx.strokeStyle = o.color;
      ctx.lineWidth = 2.5;
      ctx.stroke();

      const [lx, ly] = o.path[o.path.length - 1];
      ctx.beginPath();
      ctx.arc(toPxX(lx), toPxY(ly), 5.5, 0, Math.PI * 2);
      ctx.fillStyle = o.color;
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#fff';
      ctx.stroke();
    }
  }, [tab, landscape, opts]);

  const handleLandscapeClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 6.4 - 3.2;
    const y = 2.2 - ((e.clientY - rect.top) / rect.height) * 4.4;
    setStartPt([x, y]);
    resetArena(x, y);
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50/80 px-5 py-3.5 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-violet-600 dark:text-violet-400" />
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            交互实验室 2A · 反向传播计算图与优化器轨迹竞技场
          </h3>
        </div>
        <div className="flex rounded-lg border border-slate-200 bg-white p-0.5 text-xs font-medium dark:border-slate-700 dark:bg-slate-800">
          <button
            onClick={() => setTab('backprop')}
            className={`rounded-md px-3 py-1 transition cursor-pointer ${
              tab === 'backprop' ? 'bg-violet-600 text-white' : 'text-slate-600 dark:text-slate-300'
            }`}
          >
            计算图前向 / 反向传播
          </button>
          <button
            onClick={() => setTab('opt')}
            className={`rounded-md px-3 py-1 transition cursor-pointer ${
              tab === 'opt' ? 'bg-violet-600 text-white' : 'text-slate-600 dark:text-slate-300'
            }`}
          >
            SGD · Momentum · RMSProp · Adam 竞速
          </button>
        </div>
      </div>

      {tab === 'backprop' ? (
        <div className="p-5 space-y-5">
          {/* Controls Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 dark:border-slate-800 dark:bg-slate-950/50">
            {[
              { label: '输入 x', val: xVal, set: setXVal, min: -2, max: 2, color: 'text-blue-600' },
              { label: '权重 w₁', val: w1, set: setW1, min: -2, max: 2, color: 'text-violet-600' },
              { label: '偏置 b₁', val: b1, set: setB1, min: -2, max: 2, color: 'text-violet-600' },
              { label: '权重 w₂', val: w2, set: setW2, min: -2, max: 2, color: 'text-violet-600' },
              { label: '目标 y', val: yTarget, set: setYTarget, min: -2, max: 3, color: 'text-emerald-600' },
            ].map((ctl) => (
              <div key={ctl.label} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-medium text-slate-600 dark:text-slate-300">{ctl.label}</span>
                  <span className={`font-mono font-bold ${ctl.color}`}>{ctl.val.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min={ctl.min}
                  max={ctl.max}
                  step={0.1}
                  value={ctl.val}
                  onChange={(e) => ctl.set(parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex gap-2">
              {[
                { id: 'both', label: '前向 + 反向同时显示' },
                { id: 'fwd', label: '仅前向传播 (Forward →)' },
                { id: 'bwd', label: '仅反向梯度 (← Backward)' },
              ].map((m) => (
                <button
                  key={m.id}
                  onClick={() => setPassView(m.id as 'both' | 'fwd' | 'bwd')}
                  className={`rounded-lg border px-2.5 py-1 cursor-pointer transition ${
                    passView === m.id
                      ? 'border-violet-600 bg-violet-50 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300'
                      : 'border-slate-200 text-slate-600 dark:border-slate-700 dark:text-slate-400'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
            {deadRelu && (
              <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-3 py-1 font-semibold text-rose-700 dark:bg-rose-950 dark:text-rose-300">
                <Zap className="h-3.5 w-3.5" /> 触发 Dead ReLU！z₁ ≤ 0 导致 ∂L/∂w₁ 与 ∂L/∂b₁ 梯度归零
              </span>
            )}
          </div>

          {/* Computation Graph SVG */}
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-slate-50/70 p-3 dark:border-slate-800 dark:bg-slate-950/70">
            <svg viewBox="0 0 760 210" className="w-full min-w-[640px] h-auto">
              {/* Edges */}
              {[
                [105, 105, 210, 105],
                [290, 105, 375, 105],
                [455, 105, 535, 105],
                [615, 105, 675, 105],
              ].map(([x1, y1, x2, y2], idx) => (
                <g key={idx}>
                  <line
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    className="stroke-slate-300 dark:stroke-slate-700"
                    strokeWidth={2.5}
                  />
                  {passView !== 'bwd' && (
                    <path d={`M ${x2 - 8} ${y2 - 5} L ${x2} ${y2} L ${x2 - 8} ${y2 + 5}`} fill="none" stroke="#10b981" strokeWidth={2} />
                  )}
                  {passView !== 'fwd' && (
                    <path d={`M ${x1 + 8} ${y1 + 14} L ${x1} ${y1 + 19} L ${x1 + 8} ${y1 + 24}`} fill="none" stroke="#f43f5e" strokeWidth={1.8} />
                  )}
                </g>
              ))}

              {/* Nodes */}
              {[
                {
                  cx: 65,
                  title: '输入 x',
                  fwd: `x = ${xVal.toFixed(2)}`,
                  bwd: `∂L/∂w₁ = ${dLoss_dw1.toFixed(2)}`,
                  sub: `∂L/∂b₁ = ${dLoss_db1.toFixed(2)}`,
                  border: '#3b82f6',
                },
                {
                  cx: 250,
                  title: '线性 z₁ = w₁x+b₁',
                  fwd: `z₁ = ${z1.toFixed(2)}`,
                  bwd: `∂L/∂z₁ = ${dLoss_dz1.toFixed(2)}`,
                  sub: `w₁=${w1.toFixed(1)}, b₁=${b1.toFixed(1)}`,
                  border: '#8b5cf6',
                },
                {
                  cx: 415,
                  title: 'ReLU(z₁)',
                  fwd: `h = ${h.toFixed(2)}`,
                  bwd: `∂L/∂h = ${dLoss_dh.toFixed(2)}`,
                  sub: `local: ${reluMask}`,
                  border: deadRelu ? '#ef4444' : '#10b981',
                },
                {
                  cx: 575,
                  title: '输出 ŷ = w₂h',
                  fwd: `ŷ = ${yHat.toFixed(2)}`,
                  bwd: `∂L/∂ŷ = ${dLoss_dyHat.toFixed(2)}`,
                  sub: `∂L/∂w₂ = ${dLoss_dw2.toFixed(2)}`,
                  border: '#8b5cf6',
                },
                {
                  cx: 715,
                  title: 'MSE Loss',
                  fwd: `L = ${loss.toFixed(2)}`,
                  bwd: `∂L/∂L = 1.00`,
                  sub: `y = ${yTarget.toFixed(1)}`,
                  border: '#f43f5e',
                },
              ].map((n) => (
                <g key={n.title}>
                  <rect
                    x={n.cx - 56}
                    y={52}
                    width={112}
                    height={106}
                    rx={14}
                    className="fill-white dark:fill-slate-900"
                    stroke={n.border}
                    strokeWidth={2}
                  />
                  <text
                    x={n.cx}
                    y={72}
                    textAnchor="middle"
                    className="fill-slate-500 dark:fill-slate-400 text-[10px] font-semibold"
                  >
                    {n.title}
                  </text>
                  {passView !== 'bwd' && (
                    <text
                      x={n.cx}
                      y={97}
                      textAnchor="middle"
                      className="fill-emerald-600 dark:fill-emerald-400 text-[12px] font-mono font-bold"
                    >
                      {n.fwd}
                    </text>
                  )}
                  {passView !== 'fwd' && (
                    <text
                      x={n.cx}
                      y={122}
                      textAnchor="middle"
                      className="fill-rose-600 dark:fill-rose-400 text-[11px] font-mono font-semibold"
                    >
                      {n.bwd}
                    </text>
                  )}
                  <text
                    x={n.cx}
                    y={144}
                    textAnchor="middle"
                    className="fill-slate-400 text-[9.5px] font-mono"
                  >
                    {n.sub}
                  </text>
                </g>
              ))}
            </svg>
          </div>
        </div>
      ) : (
        <div className="p-5 grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
          <div className="lg:col-span-7 flex flex-col items-center gap-2">
            <canvas
              ref={canvasRef}
              width={460}
              height={300}
              onClick={handleLandscapeClick}
              className="w-full rounded-xl border border-slate-300 cursor-crosshair dark:border-slate-700"
            />
            <span className="text-[11px] text-slate-500">
              点击损失地形任意位置重设起点，观察 4 种优化器如何穿越峡谷与鞍点
            </span>
          </div>

          <div className="lg:col-span-5 space-y-4">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => {
                  setLandscape('ravine');
                  resetArena(-2.6, 1.3);
                }}
                className={`rounded-lg border px-3 py-1.5 text-xs font-medium cursor-pointer ${
                  landscape === 'ravine'
                    ? 'border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                    : 'border-slate-200 dark:border-slate-700'
                }`}
              >
                狭长峡谷 (病态曲率)
              </button>
              <button
                onClick={() => {
                  setLandscape('saddle');
                  resetArena(-0.2, 0.25);
                }}
                className={`rounded-lg border px-3 py-1.5 text-xs font-medium cursor-pointer ${
                  landscape === 'saddle'
                    ? 'border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                    : 'border-slate-200 dark:border-slate-700'
                }`}
              >
                鞍点地形 (Saddle Point)
              </button>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span>基础学习率 η</span>
                <span className="font-mono font-bold text-blue-600">{lr.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min={0.05}
                max={0.42}
                step={0.01}
                value={lr}
                onChange={(e) => setLr(parseFloat(e.target.value))}
                className="w-full"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setRunning((r) => !r)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-violet-600 px-4 py-2 text-xs font-semibold text-white hover:bg-violet-500 cursor-pointer"
              >
                {running ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                {running ? '暂停' : '开始竞速'}
              </button>
              <button
                onClick={() => resetArena()}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 cursor-pointer"
              >
                <RotateCcw className="h-3.5 w-3.5" /> 重置轨迹
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {opts.map((o) => (
                <div
                  key={o.name}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-800 dark:bg-slate-950/60"
                >
                  <div className="flex items-center gap-1.5 text-xs font-semibold">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: o.color }} />
                    {o.name}
                  </div>
                  <div className="mt-0.5 font-mono text-[11px] text-slate-500">
                    Loss = {lossFn(landscape, o.x, o.y).toFixed(3)} · Step {o.t}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
