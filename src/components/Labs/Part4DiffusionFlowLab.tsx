import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, Wind } from 'lucide-react';

type TargetDist = 'moons' | 'ring' | 'spiral';

interface ParticlePair {
  x0: number;
  y0: number;
  epsX: number;
  epsY: number;
  bendX: number;
  bendY: number;
  color: string;
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

function generateParticles(dist: TargetDist, count = 200): ParticlePair[] {
  const rng = mulberry(dist === 'moons' ? 7 : dist === 'ring' ? 19 : 31);
  const randn = () => Math.sqrt(-2 * Math.log(Math.max(1e-7, rng()))) * Math.cos(2 * Math.PI * rng());
  const out: ParticlePair[] = [];

  for (let i = 0; i < count; i++) {
    let x0 = 0;
    let y0 = 0;
    let color = '#3b82f6';
    if (dist === 'moons') {
      const upper = i < count / 2;
      const angle = rng() * Math.PI;
      if (upper) {
        x0 = Math.cos(angle) * 0.9 - 0.35 + randn() * 0.06;
        y0 = Math.sin(angle) * 0.9 - 0.15 + randn() * 0.06;
        color = '#3b82f6';
      } else {
        x0 = 1 - Math.cos(angle) * 0.9 - 0.65 + randn() * 0.06;
        y0 = 0.25 - Math.sin(angle) * 0.9 + randn() * 0.06;
        color = '#10b981';
      }
    } else if (dist === 'ring') {
      const mode = i % 4;
      const a = (mode * Math.PI) / 2 + Math.PI / 4;
      x0 = Math.cos(a) * 1.15 + randn() * 0.14;
      y0 = Math.sin(a) * 1.15 + randn() * 0.14;
      color = ['#3b82f6', '#10b981', '#f43f5e', '#8b5cf6'][mode];
    } else {
      const u = (i / count) * 2.6 * Math.PI;
      const r = 0.18 + (i / count) * 1.15;
      x0 = r * Math.cos(u) + randn() * 0.05;
      y0 = r * Math.sin(u) + randn() * 0.05;
      color = i % 2 === 0 ? '#8b5cf6' : '#0ea5e9';
    }
    const epsX = randn() * 0.95;
    const epsY = randn() * 0.95;
    out.push({
      x0,
      y0,
      epsX,
      epsY,
      bendX: (rng() - 0.5) * 0.9,
      bendY: (rng() - 0.5) * 0.9,
      color,
    });
  }
  return out;
}

export const Part4DiffusionFlowLab: React.FC = () => {
  const [dist, setDist] = useState<TargetDist>('moons');
  const [t, setT] = useState(0.35); // 0 = clean data x_0, 1 = pure Gaussian noise x_T
  const [playing, setPlaying] = useState<'none' | 'forward' | 'reverse'>('none');

  const particles = useMemo(() => generateParticles(dist, 210), [dist]);
  const ddpmCanvasRef = useRef<HTMLCanvasElement>(null);
  const flowCanvasRef = useRef<HTMLCanvasElement>(null);

  // Cosine alpha_bar schedule for DDPM
  const alphaBar = Math.pow(Math.cos(((t + 0.008) / 1.008) * (Math.PI / 2)), 2);
  const sqrtAlphaBar = Math.sqrt(Math.max(0, alphaBar));
  const sqrtOneMinusAlphaBar = Math.sqrt(Math.max(0, 1 - alphaBar));

  useEffect(() => {
    if (playing === 'none') return;
    const timer = window.setInterval(() => {
      setT((prev) => {
        const next = playing === 'forward' ? prev + 0.015 : prev - 0.015;
        if (next >= 1) {
          setPlaying('none');
          return 1;
        }
        if (next <= 0) {
          setPlaying('none');
          return 0;
        }
        return next;
      });
    }, 32);
    return () => window.clearInterval(timer);
  }, [playing]);

  // Draw both DDPM & Flow Matching canvases
  useEffect(() => {
    const draw = (canvas: HTMLCanvasElement | null, mode: 'ddpm' | 'flow') => {
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const size = 280;
      ctx.clearRect(0, 0, size, size);

      // Background subtle axes
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.2)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(size / 2, 0);
      ctx.lineTo(size / 2, size);
      ctx.moveTo(0, size / 2);
      ctx.lineTo(size, size / 2);
      ctx.stroke();

      const toPx = (v: number) => size / 2 + (v / 3.1) * (size / 2);
      const toPy = (v: number) => size / 2 - (v / 3.1) * (size / 2);

      // Draw trajectory traces for first 8 highlighted particles
      for (let i = 0; i < 8; i++) {
        const p = particles[i];
        ctx.beginPath();
        for (let s = 0; s <= 24; s++) {
          const ts = s / 24;
          let px: number;
          let py: number;
          if (mode === 'ddpm') {
            const ab = Math.pow(Math.cos(((ts + 0.008) / 1.008) * (Math.PI / 2)), 2);
            const sa = Math.sqrt(ab);
            const s1a = Math.sqrt(1 - ab);
            // Curved stochastic drift illustration
            const curve = Math.sin(ts * Math.PI) * 0.35;
            px = sa * p.x0 + s1a * p.epsX + curve * p.bendX;
            py = sa * p.y0 + s1a * p.epsY + curve * p.bendY;
          } else {
            // Rectified Flow: straight-line ODE trajectory x_t = (1-t)x_0 + t*eps
            px = (1 - ts) * p.x0 + ts * p.epsX;
            py = (1 - ts) * p.y0 + ts * p.epsY;
          }
          if (s === 0) ctx.moveTo(toPx(px), toPy(py));
          else ctx.lineTo(toPx(px), toPy(py));
        }
        ctx.strokeStyle = mode === 'ddpm' ? 'rgba(244, 63, 94, 0.32)' : 'rgba(16, 185, 129, 0.38)';
        ctx.lineWidth = 1.4;
        ctx.stroke();
      }

      // Draw all particles at current t
      for (const p of particles) {
        let px: number;
        let py: number;
        if (mode === 'ddpm') {
          const curve = Math.sin(t * Math.PI) * 0.35;
          px = sqrtAlphaBar * p.x0 + sqrtOneMinusAlphaBar * p.epsX + curve * p.bendX;
          py = sqrtAlphaBar * p.y0 + sqrtOneMinusAlphaBar * p.epsY + curve * p.bendY;
        } else {
          px = (1 - t) * p.x0 + t * p.epsX;
          py = (1 - t) * p.y0 + t * p.epsY;
        }
        ctx.beginPath();
        ctx.arc(toPx(px), toPy(py), 3.1, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();
      }
    };

    draw(ddpmCanvasRef.current, 'ddpm');
    draw(flowCanvasRef.current, 'flow');
  }, [particles, t, sqrtAlphaBar, sqrtOneMinusAlphaBar]);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50/80 px-5 py-3.5 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-2">
          <Wind className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            交互实验室 4B · Diffusion (DDPM) vs Flow Matching 2D 粒子轨迹对比
          </h3>
        </div>
        <div className="flex gap-1.5 text-xs">
          {[
            { id: 'moons', label: '双月 Two Moons' },
            { id: 'ring', label: '四峰高斯' },
            { id: 'spiral', label: '螺旋 Spiral' },
          ].map((d) => (
            <button
              key={d.id}
              onClick={() => setDist(d.id as TargetDist)}
              className={`rounded-lg border px-2.5 py-1 cursor-pointer ${
                dist === d.id
                  ? 'border-blue-600 bg-blue-50 text-blue-700 font-semibold dark:bg-blue-950/60 dark:text-blue-300'
                  : 'border-slate-200 dark:border-slate-700'
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-5 space-y-5">
        {/* Timeline Controls */}
        <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-3 dark:border-slate-800 dark:bg-slate-950/60">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  if (playing === 'forward') setPlaying('none');
                  else {
                    if (t >= 0.99) setT(0);
                    setPlaying('forward');
                  }
                }}
                className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-500 cursor-pointer"
              >
                {playing === 'forward' ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                前向加噪 (0 → 1)
              </button>
              <button
                onClick={() => {
                  if (playing === 'reverse') setPlaying('none');
                  else {
                    if (t <= 0.01) setT(1);
                    setPlaying('reverse');
                  }
                }}
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500 cursor-pointer"
              >
                {playing === 'reverse' ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                反向去噪生成 (1 → 0)
              </button>
            </div>

            <div className="font-mono text-xs text-slate-600 dark:text-slate-300">
              t = <strong>{t.toFixed(2)}</strong> · √ᾱ_t ={' '}
              <span className="text-blue-600 font-bold">{sqrtAlphaBar.toFixed(2)}</span> · √(1-ᾱ_t) ={' '}
              <span className="text-rose-600 font-bold">{sqrtOneMinusAlphaBar.toFixed(2)}</span>
            </div>
          </div>

          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={t}
            onChange={(e) => {
              setPlaying('none');
              setT(parseFloat(e.target.value));
            }}
            className="w-full"
          />
          <div className="flex justify-between text-[11px] text-slate-500">
            <span>t = 0.00 (清晰真实数据 x₀)</span>
            <span>t = 0.50 (信噪混合态)</span>
            <span>t = 1.00 (纯高斯噪声 ε ~ N(0, I))</span>
          </div>
        </div>

        {/* Dual Canvases */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="flex flex-col items-center gap-2 rounded-xl border border-slate-200 p-4 dark:border-slate-800">
            <div className="text-xs font-semibold text-rose-600 dark:text-rose-400">
              DDPM 扩散模型：曲线随机路径 (VP-SDE)
            </div>
            <canvas
              ref={ddpmCanvasRef}
              width={280}
              height={280}
              className="w-full max-w-[280px] aspect-square rounded-xl bg-slate-950 border border-slate-800"
            />
            <p className="text-[11px] text-center text-slate-500">
              轨迹呈弯曲/随机抖动形态，反向采样通常需要较多步数（如 50–1000 步）才能精确贴合流形。
            </p>
          </div>

          <div className="flex flex-col items-center gap-2 rounded-xl border border-slate-200 p-4 dark:border-slate-800">
            <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              Flow Matching / Rectified Flow：直线流场 (ODE)
            </div>
            <canvas
              ref={flowCanvasRef}
              width={280}
              height={280}
              className="w-full max-w-[280px] aspect-square rounded-xl bg-slate-950 border border-slate-800"
            />
            <p className="text-[11px] text-center text-slate-500">
              直接学习恒定速度场 v_θ(x_t, t) ≈ ε − x₀，粒子沿直线输运，因此少量 Euler 步即可高质量生成（SD3 / Flux 核心原理）。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
