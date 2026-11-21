import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Pause, Play, Rotate3D, Sparkles } from 'lucide-react';
import {
  Camera3D,
  projectPoint,
  setupHiDPICanvas,
  Vec3,
} from '../../utils/engine3d';
import { FormulaDrivenBanner, LiveFormulaTerm } from '../FormulaDrivenBanner';

interface Particle3D {
  x0: Vec3;
  eps: Vec3;
  bend: Vec3;
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

function build3DManifold(shape: 'swiss' | 'torus', count = 340): Particle3D[] {
  const rng = mulberry(shape === 'swiss' ? 101 : 202);
  const randn = () => Math.sqrt(-2 * Math.log(Math.max(1e-7, rng()))) * Math.cos(2 * Math.PI * rng());
  const out: Particle3D[] = [];
  const palette = ['#38bdf8', '#818cf8', '#34d399', '#fb7185', '#fbbf24'];

  for (let i = 0; i < count; i++) {
    const u = i / count;
    let x0: Vec3;
    if (shape === 'swiss') {
      // Classic 3D Swiss-Roll manifold!
      const theta = 1.5 * Math.PI + u * 2.8 * Math.PI;
      const r = 0.14 * theta;
      const height = (rng() - 0.5) * 1.55;
      x0 = {
        x: r * Math.cos(theta) * 0.85,
        y: height * 0.72,
        z: r * Math.sin(theta) * 0.85,
      };
    } else {
      // 3D Torus Knot manifold
      const a = u * Math.PI * 2;
      const b = rng() * Math.PI * 2;
      const R = 1.05;
      const tube = 0.34;
      x0 = {
        x: (R + tube * Math.cos(b)) * Math.cos(a),
        y: tube * Math.sin(b) + 0.25 * Math.sin(3 * a),
        z: (R + tube * Math.cos(b)) * Math.sin(a),
      };
    }
    const colorIdx = Math.min(palette.length - 1, Math.floor(u * palette.length));
    out.push({
      x0,
      eps: { x: randn() * 0.78, y: randn() * 0.78, z: randn() * 0.78 },
      bend: { x: (rng() - 0.5) * 0.7, y: (rng() - 0.5) * 0.7, z: (rng() - 0.5) * 0.7 },
      color: palette[colorIdx],
    });
  }
  return out;
}

export const Studio3DGenerativeManifold: React.FC = () => {
  const [view, setView] = useState<'diff3d' | 'vae3d'>('diff3d');
  const [yaw, setYaw] = useState(0.6);
  const [pitch, setPitch] = useState(0.35);
  const [activeTerm, setActiveTerm] = useState<string | null>('s1a');

  // --- Diffusion / Flow 3D Manifold ---
  const [shape, setShape] = useState<'swiss' | 'torus'>('swiss');
  const [algo, setAlgo] = useState<'ddpm' | 'flow'>('ddpm');
  const [t, setT] = useState(0.28);
  const [playing, setPlaying] = useState<'none' | 'fwd' | 'rev'>('none');
  const [keepNoise, setKeepNoise] = useState(true);

  // --- VAE 3D Latent Space & KL Ablation ---
  const [klEnabled, setKlEnabled] = useState(true);
  const [beta, setBeta] = useState(1.0);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dragRef = useRef({ dragging: false, lx: 0, ly: 0 });

  const particles = useMemo(() => build3DManifold(shape, 340), [shape]);

  const vaeClusters = useMemo(() => {
    const rng = mulberry(77);
    const randn = () => Math.sqrt(-2 * Math.log(Math.max(1e-7, rng()))) * Math.cos(2 * Math.PI * rng());
    const centers: { pos: Vec3; color: string; label: string }[] = [
      { pos: { x: 1.5, y: 0.9, z: 0.8 }, color: '#38bdf8', label: 'Class 0' },
      { pos: { x: -1.4, y: 1.0, z: -0.9 }, color: '#34d399', label: 'Class 1' },
      { pos: { x: -1.3, y: -1.1, z: 0.9 }, color: '#fb7185', label: 'Class 2' },
      { pos: { x: 1.4, y: -0.9, z: -1.0 }, color: '#a78bfa', label: 'Class 3' },
    ];
    const pts: { baseOffset: Vec3; center: Vec3; color: string }[] = [];
    for (const c of centers) {
      for (let i = 0; i < 65; i++) {
        pts.push({
          center: c.pos,
          baseOffset: { x: randn() * 0.24, y: randn() * 0.24, z: randn() * 0.24 },
          color: c.color,
        });
      }
    }
    return pts;
  }, []);

  // Gentle animation loop for playback
  useEffect(() => {
    if (playing === 'none' || view !== 'diff3d') return;
    const timer = window.setInterval(() => {
      setT((prev) => {
        const next = playing === 'fwd' ? prev + 0.014 : prev - 0.014;
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
  }, [playing, view]);

  const alphaBar = Math.pow(Math.cos(((t + 0.008) / 1.008) * (Math.PI / 2)), 2);
  const sigCoeff = algo === 'ddpm' ? Math.sqrt(Math.max(0, alphaBar)) : 1 - t;
  const noiseCoeff = keepNoise ? (algo === 'ddpm' ? Math.sqrt(Math.max(0, 1 - alphaBar)) : t) : 0;

  // Render 3D Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const W = 560;
    const H = 330;
    const ctx = setupHiDPICanvas(canvas, W, H);
    if (!ctx) return;

    const cam: Camera3D = { yaw, pitch, dist: 4.3, fov: 350 };
    ctx.clearRect(0, 0, W, H);

    if (view === 'diff3d') {
      // Draw 3D trajectories for 10 representative particles
      for (let i = 0; i < 10; i++) {
        const p = particles[i * 30];
        ctx.beginPath();
        for (let s = 0; s <= 20; s++) {
          const ts = s / 20;
          const ab = Math.pow(Math.cos(((ts + 0.008) / 1.008) * (Math.PI / 2)), 2);
          const sc = algo === 'ddpm' ? Math.sqrt(ab) : 1 - ts;
          const nc = keepNoise ? (algo === 'ddpm' ? Math.sqrt(1 - ab) : ts) : 0;
          const bendAmp = algo === 'ddpm' ? Math.sin(ts * Math.PI) * 0.35 : 0;
          const pt: Vec3 = {
            x: sc * p.x0.x + nc * p.eps.x + bendAmp * p.bend.x,
            y: sc * p.x0.y + nc * p.eps.y + bendAmp * p.bend.y,
            z: sc * p.x0.z + nc * p.eps.z + bendAmp * p.bend.z,
          };
          const pr = projectPoint(pt, cam, W, H);
          if (s === 0) ctx.moveTo(pr.x, pr.y);
          else ctx.lineTo(pr.x, pr.y);
        }
        ctx.strokeStyle = algo === 'ddpm' ? 'rgba(251, 113, 133, 0.35)' : 'rgba(52, 211, 153, 0.42)';
        ctx.lineWidth = 1.4;
        ctx.stroke();
      }

      // Project & depth-sort all 340 particles
      const bendNow = algo === 'ddpm' ? Math.sin(t * Math.PI) * 0.35 : 0;
      const projected = particles.map((p) => {
        const cur: Vec3 = {
          x: sigCoeff * p.x0.x + noiseCoeff * p.eps.x + bendNow * p.bend.x,
          y: sigCoeff * p.x0.y + noiseCoeff * p.eps.y + bendNow * p.bend.y,
          z: sigCoeff * p.x0.z + noiseCoeff * p.eps.z + bendNow * p.bend.z,
        };
        return { color: p.color, p: projectPoint(cur, cam, W, H) };
      });
      projected.sort((a, b) => b.p.depth - a.p.depth);

      for (const item of projected) {
        const r = Math.max(1.8, 3.2 * (item.p.scale / 82));
        const alpha = Math.max(0.25, Math.min(1, 1.55 - item.p.depth * 0.2));
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.arc(item.p.x, item.p.y, r, 0, Math.PI * 2);
        ctx.fillStyle = item.color;
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    } else {
      // --- 3D VAE Latent Space with KL Ablation ---
      // Draw translucent N(0, I_3) Prior Wireframe Sphere (radius 1.0)
      ctx.strokeStyle = 'rgba(167, 139, 250, 0.24)';
      ctx.lineWidth = 1;
      for (const lat of [-0.55, 0, 0.55]) {
        const r = Math.cos(lat);
        const y = Math.sin(lat);
        ctx.beginPath();
        for (let s = 0; s <= 40; s++) {
          const a = (s / 40) * Math.PI * 2;
          const p = projectPoint({ x: r * Math.cos(a), y, z: r * Math.sin(a) }, cam, W, H);
          if (s === 0) ctx.moveTo(p.x, p.y);
          else ctx.lineTo(p.x, p.y);
        }
        ctx.stroke();
      }

      const effBeta = klEnabled ? beta : 0;
      const pull = 1 / (1 + effBeta * 1.4); // β=0 -> scattered far apart (1.0), β=1 -> tightly packed in N(0,I)
      const spread = 0.65 + (1 - pull) * 1.35; // KL expands individual posteriors to fill gaps!

      const projected = vaeClusters.map((pt) => {
        const cur: Vec3 = {
          x: pt.center.x * pull + pt.baseOffset.x * spread,
          y: pt.center.y * pull + pt.baseOffset.y * spread,
          z: pt.center.z * pull + pt.baseOffset.z * spread,
        };
        return { color: pt.color, p: projectPoint(cur, cam, W, H) };
      });
      projected.sort((a, b) => b.p.depth - a.p.depth);

      for (const item of projected) {
        const r = Math.max(2, 3.4 * (item.p.scale / 82));
        ctx.globalAlpha = Math.max(0.28, Math.min(0.95, 1.5 - item.p.depth * 0.2));
        ctx.beginPath();
        ctx.arc(item.p.x, item.p.y, r, 0, Math.PI * 2);
        ctx.fillStyle = item.color;
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      // Label center "Prior Sample z ~ N(0, I)"
      const center = projectPoint({ x: 0, y: 0, z: 0 }, cam, W, H);
      ctx.beginPath();
      ctx.arc(center.x, center.y, 5.5, 0, Math.PI * 2);
      ctx.fillStyle = klEnabled ? '#10b981' : '#f43f5e';
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1.8;
      ctx.stroke();
      ctx.fillStyle = klEnabled ? '#a7f3d0' : '#fda4af';
      ctx.font = '700 10.5px "JetBrains Mono", monospace';
      ctx.fillText(
        klEnabled ? 'z~N(0,I) 落在平滑流形内 ✅' : 'z~N(0,I) 踩空死区! 生成乱码 ❌',
        center.x + 8,
        center.y + 4
      );
    }
  }, [view, yaw, pitch, particles, algo, t, sigCoeff, noiseCoeff, keepNoise, vaeClusters, klEnabled, beta]);

  const formulaLatex =
    view === 'diff3d'
      ? algo === 'ddpm'
        ? String.raw`\mathbf{x}_t = \htmlClass{formula-token formula-token-data token-sa}{\sqrt{\bar{\alpha}_t}\,\mathbf{x}_0} + \htmlClass{formula-token formula-token-loss token-s1a}{\sqrt{1-\bar{\alpha}_t}\,\boldsymbol{\epsilon}}`
        : String.raw`\mathbf{x}_t = \htmlClass{formula-token formula-token-data token-sa}{(1-t)\,\mathbf{x}_0} + \htmlClass{formula-token formula-token-loss token-s1a}{t\,\mathbf{x}_1}, \quad \mathbf{v}_\theta \approx \mathbf{x}_1 - \mathbf{x}_0`
      : String.raw`\mathcal{L}_{\text{VAE}} = \htmlClass{formula-token formula-token-data token-rec}{\|\mathbf{x}-\hat{\mathbf{x}}\|^2} + \htmlClass{formula-token formula-token-loss token-kl}{\beta \, D_{\text{KL}}\big(q_\phi(\mathbf{z}|\mathbf{x})\,\|\,\mathcal{N}(\mathbf{0},\mathbf{I}_3)\big)}`;

  const terms: LiveFormulaTerm[] =
    view === 'diff3d'
      ? [
          {
            id: 'sa',
            symbol: algo === 'ddpm' ? '√ᾱ_t · x₀ 信号保留项' : '(1−t)·x₀ 流形信号项',
            role: 'data',
            liveValue: `权重 ${(sigCoeff * 100).toFixed(0)}%`,
            roleDesc: '控制三维 Swiss-Roll / Torus 真实数据流形结构保留的比例：t=0 时为 100%，随 t→1 逐渐收缩消失。',
          },
          {
            id: 's1a',
            symbol: algo === 'ddpm' ? '+ √(1−ᾱ_t)·ε 扩散噪声项' : '+ t·x₁ 直线先验噪声项',
            role: 'loss',
            liveValue: keepNoise ? `权重 ${(noiseCoeff * 100).toFixed(0)}%` : '已消融 (仅剩缩小的原流形!)',
            roleDesc: '点击消融关闭噪声项看看：没有噪声注入，粒子只是向原点坍缩而无法变成可采样的三维标准高斯云！',
            enabled: keepNoise,
            onToggle: () => setKeepNoise((v) => !v),
          },
        ]
      : [
          {
            id: 'rec',
            symbol: '‖x − x̂‖² 重建项',
            role: 'data',
            liveValue: '倾向把 4 类推远以防混淆',
            roleDesc: '为了完美重建每一张图，编码器天然希望把不同类别的潜向量塞到 3D 空间极远处的孤岛上。',
          },
          {
            id: 'kl',
            symbol: '+ β·D_KL(q ‖ N(0,I)) 正则引力',
            role: 'loss',
            liveValue: klEnabled ? `ON · β = ${beta.toFixed(1)}` : '已消融 (退化为普通 AE!)',
            roleDesc: '点击 ON/OFF 切换消融！关掉 KL 项瞬间，4 个类别簇散成互不相连的孤岛，中心采样点 z~N(0,I) 踩空无法生成新图；打开 KL 项后 4 个簇丝滑拼满紫色标准高斯球！',
            enabled: klEnabled,
            onToggle: () => setKlEnabled((v) => !v),
          },
        ];

  return (
    <div className="rounded-2xl border border-slate-200/90 bg-white shadow-md overflow-hidden dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-gradient-to-r from-slate-900 via-rose-950 to-slate-900 px-5 py-3.5 text-white">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-rose-400" />
          <h3 className="text-sm sm:text-base font-bold">
            3D 高维生成流形演播室 · Diffusion/Flow 三维粒子演化 & VAE 3D 潜空间消融
          </h3>
        </div>
        <div className="flex rounded-lg bg-white/10 p-0.5 text-xs font-medium">
          <button
            onClick={() => setView('diff3d')}
            className={`rounded-md px-2.5 py-1 cursor-pointer transition ${
              view === 'diff3d' ? 'bg-rose-500 text-white' : 'text-slate-300 hover:text-white'
            }`}
          >
            3D Diffusion vs Flow 流形
          </button>
          <button
            onClick={() => setView('vae3d')}
            className={`rounded-md px-2.5 py-1 cursor-pointer transition ${
              view === 'vae3d' ? 'bg-violet-500 text-white' : 'text-slate-300 hover:text-white'
            }`}
          >
            3D VAE 潜空间 KL 消融
          </button>
        </div>
      </div>

      <div className="p-5 space-y-4">
        <FormulaDrivenBanner
          latex={formulaLatex}
          terms={terms}
          activeTermId={activeTerm}
          onSelectTerm={setActiveTerm}
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
          <div className="lg:col-span-8 flex flex-col items-center">
            <canvas
              ref={canvasRef}
              onMouseDown={(e) => {
                dragRef.current = { dragging: true, lx: e.clientX, ly: e.clientY };
              }}
              onMouseMove={(e) => {
                if (!dragRef.current.dragging) return;
                const dx = e.clientX - dragRef.current.lx;
                const dy = e.clientY - dragRef.current.ly;
                dragRef.current.lx = e.clientX;
                dragRef.current.ly = e.clientY;
                setYaw((v) => v + dx * 0.01);
                setPitch((v) => Math.max(-1.1, Math.min(1.1, v + dy * 0.01)));
              }}
              onMouseUp={() => { dragRef.current.dragging = false; }}
              onMouseLeave={() => { dragRef.current.dragging = false; }}
              className="w-full max-w-[560px] aspect-[560/330] rounded-2xl bg-slate-950 border border-slate-800 cursor-grab active:cursor-grabbing shadow-inner"
            />
            <span className="mt-1.5 text-[11px] text-slate-400 inline-flex items-center gap-1">
              <Rotate3D className="h-3.5 w-3.5" /> 拖拽画面 360° 旋转观察三维瑞士卷 / 潜空间球体
            </span>
          </div>

          <div className="lg:col-span-4 space-y-4 text-xs">
            {view === 'diff3d' ? (
              <div className="rounded-xl border border-slate-200 p-4 space-y-3.5 dark:border-slate-800">
                <div className="flex gap-1.5">
                  <button
                    onClick={() => setAlgo('ddpm')}
                    className={`flex-1 rounded-lg border py-1.5 font-semibold cursor-pointer ${
                      algo === 'ddpm' ? 'border-rose-500 bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300' : 'border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    DDPM (弯曲 SDE)
                  </button>
                  <button
                    onClick={() => setAlgo('flow')}
                    className={`flex-1 rounded-lg border py-1.5 font-semibold cursor-pointer ${
                      algo === 'flow' ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300' : 'border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    Flow (直线 ODE)
                  </button>
                </div>

                <div className="flex gap-1.5">
                  <button
                    onClick={() => setShape('swiss')}
                    className={`flex-1 rounded-lg border py-1 cursor-pointer ${
                      shape === 'swiss' ? 'border-blue-500 bg-blue-50 text-blue-700 font-semibold dark:bg-blue-950/60 dark:text-blue-300' : 'border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    3D 瑞士卷 Swiss-Roll
                  </button>
                  <button
                    onClick={() => setShape('torus')}
                    className={`flex-1 rounded-lg border py-1 cursor-pointer ${
                      shape === 'torus' ? 'border-blue-500 bg-blue-50 text-blue-700 font-semibold dark:bg-blue-950/60 dark:text-blue-300' : 'border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    3D 扭结圆环 Torus
                  </button>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span>时间步 t</span>
                    <span className="font-mono font-bold text-rose-600">{t.toFixed(2)}</span>
                  </div>
                  <input type="range" min={0} max={1} step={0.01} value={t} onChange={(e) => { setPlaying('none'); setT(parseFloat(e.target.value)); }} className="w-full" />
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      if (playing === 'fwd') setPlaying('none');
                      else {
                        if (t >= 0.99) setT(0);
                        setPlaying('fwd');
                      }
                    }}
                    className="flex-1 inline-flex items-center justify-center gap-1 rounded-lg bg-rose-600 py-1.5 font-semibold text-white hover:bg-rose-500 cursor-pointer"
                  >
                    {playing === 'fwd' ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                    加噪溶解
                  </button>
                  <button
                    onClick={() => {
                      if (playing === 'rev') setPlaying('none');
                      else {
                        if (t <= 0.01) setT(1);
                        setPlaying('rev');
                      }
                    }}
                    className="flex-1 inline-flex items-center justify-center gap-1 rounded-lg bg-emerald-600 py-1.5 font-semibold text-white hover:bg-emerald-500 cursor-pointer"
                  >
                    {playing === 'rev' ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                    去噪重构
                  </button>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-slate-200 p-4 space-y-3.5 dark:border-slate-800">
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="font-semibold">KL 正则权重 β</span>
                    <span className="font-mono font-bold text-violet-600">{klEnabled ? beta.toFixed(1) : '0.0 (已消融)'}</span>
                  </div>
                  <input type="range" min={0.1} max={3.0} step={0.1} disabled={!klEnabled} value={beta} onChange={(e) => setBeta(parseFloat(e.target.value))} className="w-full" />
                </div>
                <p className="leading-relaxed text-slate-600 dark:text-slate-300">
                  点击上方公式条中 <strong>β·D_KL</strong> 的 <strong>ON / 已消融</strong> 开关：这就是为什么普通 Autoencoder 只能压缩不能生成，而 VAE 加了 KL 散度后就能从 N(0,I) 任意采样生成全新图像！
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
