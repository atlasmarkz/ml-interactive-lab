import React, { useMemo, useState } from 'react';
import { Sparkles, Swords } from 'lucide-react';

function gauss(x: number, mu: number, sigma: number): number {
  const z = (x - mu) / sigma;
  return Math.exp(-0.5 * z * z) / (sigma * Math.sqrt(2 * Math.PI));
}

export const Part4VAEGANLab: React.FC = () => {
  const [tab, setTab] = useState<'vae' | 'gan'>('vae');

  // --- VAE Latent Space Explorer ---
  const [z1, setZ1] = useState(0.4);
  const [z2, setZ2] = useState(-0.3);
  const [beta, setBeta] = useState(1.0);

  // Compute analytic KL & synthetic reconstruction trade-off for beta-VAE illustration
  const vaeMetrics = useMemo(() => {
    // Higher beta pushes posterior variance -> 1 and mean -> 0 (lower KL, higher recon error)
    const effectiveShift = 1 / (1 + 0.55 * beta);
    const mu1 = z1 * effectiveShift;
    const mu2 = z2 * effectiveShift;
    const sigma = 0.25 + 0.75 * (1 - effectiveShift);
    const kl =
      0.5 *
      (mu1 * mu1 + mu2 * mu2 + 2 * (sigma * sigma - 1 - Math.log(sigma * sigma)));
    const recon = 0.14 + 0.42 * (1 - effectiveShift) * (1 - effectiveShift) + 0.03 * (z1 * z1 + z2 * z2);
    return { kl, recon, elbo: -(recon + beta * kl), sigma };
  }, [z1, z2, beta]);

  // Procedural decoded shape controlled smoothly by (z1, z2)
  const decodedPath = useMemo(() => {
    const cx = 80;
    const cy = 80;
    const baseR = 38 + z1 * 7;
    const petals = 3 + Math.round((z2 + 2.5) * 1.1);
    const amp = 8 + Math.abs(z2) * 5;
    const pts: string[] = [];
    for (let i = 0; i <= 96; i++) {
      const a = (i / 96) * Math.PI * 2;
      const r = baseR + amp * Math.cos(petals * a + z1 * 0.8);
      const px = cx + r * Math.cos(a);
      const py = cy + r * Math.sin(a);
      pts.push(`${i === 0 ? 'M' : 'L'} ${px.toFixed(1)} ${py.toFixed(1)}`);
    }
    return pts.join(' ') + ' Z';
  }, [z1, z2]);

  const decodedHue = Math.round(190 + z1 * 45 + z2 * 30);

  // --- GAN 1D Min-Max Game ---
  const [ganProgress, setGanProgress] = useState(0.55); // 0 = initial, 1 = Nash equilibrium
  const [modeCollapse, setModeCollapse] = useState(false);

  const ganCurves = useMemo(() => {
    const xs: number[] = [];
    const pData: number[] = [];
    const pGen: number[] = [];
    const dOpt: number[] = [];
    for (let i = 0; i <= 120; i++) {
      const x = -4 + (8 * i) / 120;
      xs.push(x);
      const real = 0.55 * gauss(x, -1.4, 0.55) + 0.45 * gauss(x, 1.5, 0.6);
      let gen: number;
      if (modeCollapse) {
        // Generator collapses solely onto the left mode, ignoring right mode!
        gen = gauss(x, -1.4 + (1 - ganProgress) * 1.1, 0.35 + (1 - ganProgress) * 0.35);
      } else {
        // Smoothly learns both modes as progress -> 1
        const m1 = -0.3 + ganProgress * (-1.4 - -0.3);
        const m2 = 0.2 + ganProgress * (1.5 - 0.2);
        const s1 = 1.0 - ganProgress * 0.45;
        const s2 = 1.1 - ganProgress * 0.5;
        gen = 0.55 * gauss(x, m1, s1) + 0.45 * gauss(x, m2, s2);
      }
      const d = real / Math.max(1e-6, real + gen);
      pData.push(real);
      pGen.push(gen);
      dOpt.push(d);
    }
    // Approximate JSD
    let jsd = 0;
    for (let i = 0; i < xs.length; i++) {
      const m = 0.5 * (pData[i] + pGen[i]) + 1e-7;
      jsd +=
        0.5 * (pData[i] * Math.log((pData[i] + 1e-7) / m) + pGen[i] * Math.log((pGen[i] + 1e-7) / m)) * (8 / 120);
    }
    return { xs, pData, pGen, dOpt, jsd: Math.max(0, jsd) };
  }, [ganProgress, modeCollapse]);

  const toGanPath = (vals: number[], yMax: number) =>
    vals
      .map((v, i) => {
        const px = 34 + (i / (vals.length - 1)) * 472;
        const py = 205 - (Math.min(yMax, v) / yMax) * 175;
        return `${i === 0 ? 'M' : 'L'} ${px.toFixed(1)} ${py.toFixed(1)}`;
      })
      .join(' ');

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50/80 px-5 py-3.5 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-violet-600 dark:text-violet-400" />
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            交互实验室 4A · VAE 潜空间连续漫游与 GAN 极小极大博弈
          </h3>
        </div>
        <div className="flex rounded-lg border border-slate-200 bg-white p-0.5 text-xs font-medium dark:border-slate-700 dark:bg-slate-800">
          <button
            onClick={() => setTab('vae')}
            className={`rounded-md px-3 py-1 transition cursor-pointer ${
              tab === 'vae' ? 'bg-violet-600 text-white' : 'text-slate-600 dark:text-slate-300'
            }`}
          >
            VAE 潜空间与 β-ELBO
          </button>
          <button
            onClick={() => setTab('gan')}
            className={`rounded-md px-3 py-1 transition cursor-pointer ${
              tab === 'gan' ? 'bg-violet-600 text-white' : 'text-slate-600 dark:text-slate-300'
            }`}
          >
            GAN 判别器博弈 & Mode Collapse
          </button>
        </div>
      </div>

      {tab === 'vae' ? (
        <div className="p-5 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* 2D Latent Picker */}
          <div className="lg:col-span-5 flex flex-col items-center gap-2">
            <div className="text-xs font-semibold text-slate-700 dark:text-slate-200">
              点击或拖动 2D 隐变量 z = (z₁, z₂) ~ N(0, I)
            </div>
            <svg
              viewBox="0 0 240 240"
              onClick={(e) => {
                const r = e.currentTarget.getBoundingClientRect();
                const nx = ((e.clientX - r.left) / r.width) * 5 - 2.5;
                const ny = 2.5 - ((e.clientY - r.top) / r.height) * 5;
                setZ1(Number(nx.toFixed(2)));
                setZ2(Number(ny.toFixed(2)));
              }}
              className="w-60 h-60 rounded-xl border border-slate-200 bg-slate-50 cursor-crosshair dark:border-slate-700 dark:bg-slate-950"
            >
              {/* Prior N(0, I) contour rings */}
              {[1, 2, 2.8].map((rad) => (
                <circle
                  key={rad}
                  cx={120}
                  cy={120}
                  r={(rad / 2.5) * 110}
                  fill="none"
                  className="stroke-violet-400/40"
                  strokeDasharray="4 4"
                />
              ))}
              <line x1={120} x2={120} y1={10} y2={230} className="stroke-slate-300 dark:stroke-slate-800" />
              <line x1={10} x2={230} y1={120} y2={120} className="stroke-slate-300 dark:stroke-slate-800" />
              {/* Posterior blob around z */}
              <circle
                cx={120 + (z1 / 2.5) * 110}
                cy={120 - (z2 / 2.5) * 110}
                r={vaeMetrics.sigma * 24}
                fill="rgba(139, 92, 246, 0.22)"
                stroke="#8b5cf6"
                strokeWidth={1.5}
              />
              <circle
                cx={120 + (z1 / 2.5) * 110}
                cy={120 - (z2 / 2.5) * 110}
                r={5.5}
                fill="#8b5cf6"
                stroke="#fff"
                strokeWidth={2}
              />
            </svg>
            <div className="font-mono text-xs text-violet-600 dark:text-violet-400">
              z = ({z1.toFixed(2)}, {z2.toFixed(2)}) · σ_φ = {vaeMetrics.sigma.toFixed(2)}
            </div>
          </div>

          {/* Decoded Output */}
          <div className="lg:col-span-3 flex flex-col items-center gap-2">
            <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              Decoder 解码生成 x̂ = p_θ(x|z)
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-950 p-3 shadow-inner dark:border-slate-700">
              <svg viewBox="0 0 160 160" className="w-40 h-40">
                <path
                  d={decodedPath}
                  fill={`hsla(${decodedHue}, 82%, 58%, 0.35)`}
                  stroke={`hsl(${decodedHue}, 88%, 62%)`}
                  strokeWidth={2.5}
                />
                <circle cx={80} cy={80} r={4} fill="#fff" />
              </svg>
            </div>
            <span className="text-[11px] text-center text-slate-500">
              z₁ 控制半径与色相，z₂ 控制瓣数与形变——KL 正则保证了潜空间的平滑插值性！
            </span>
          </div>

          {/* Beta Control & ELBO Breakdown */}
          <div className="lg:col-span-4 space-y-3.5">
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="font-medium">β-VAE KL 权重 β</span>
                <span className="font-mono font-bold text-amber-600">β = {beta.toFixed(1)}</span>
              </div>
              <input
                type="range"
                min={0}
                max={4}
                step={0.1}
                value={beta}
                onChange={(e) => setBeta(parseFloat(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>0 (普通 AE · 潜空间有空洞)</span>
                <span>4 (强正则 · Posterior Collapse)</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5 text-center">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950/60">
                <div className="text-[10px] text-slate-500">重建误差 Recon</div>
                <div className="font-mono text-lg font-bold text-blue-600">
                  {vaeMetrics.recon.toFixed(3)}
                </div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950/60">
                <div className="text-[10px] text-slate-500">KL 散度 D_KL(q‖p)</div>
                <div className="font-mono text-lg font-bold text-rose-600">
                  {vaeMetrics.kl.toFixed(3)}
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-violet-200/70 bg-violet-50/40 p-3 text-xs text-slate-700 dark:border-violet-900/50 dark:bg-violet-950/20 dark:text-slate-300 leading-relaxed">
              <strong>Reparameterization Trick：</strong>直接采样 z ~ N(μ, σ²) 无法对 μ, σ 求导；改写为
              <code className="mx-1 font-mono text-violet-700 dark:text-violet-300">z = μ + σ ⊙ ε, ε ~ N(0, I)</code>
              把随机性剥离到外部节点 ε，梯度就能顺畅回传！
            </div>
          </div>
        </div>
      ) : (
        <div className="p-5 grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
          <div className="lg:col-span-8 rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 dark:border-slate-800 dark:bg-slate-950/70">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="font-semibold flex items-center gap-1.5">
                <Swords className="h-3.5 w-3.5 text-rose-500" />
                1D 分布对抗：p_data(x) vs p_g(x) 与最优判别器 D*(x)
              </span>
              <div className="flex gap-3 text-[11px]">
                <span className="text-blue-600 font-semibold">● 真实 p_data</span>
                <span className="text-emerald-600 font-semibold">● 生成 p_g</span>
                <span className="text-rose-500 font-semibold">--- 最优判别器 D*(x)</span>
              </div>
            </div>
            <svg viewBox="0 0 540 225" className="w-full h-auto">
              {/* D = 0.5 Nash line */}
              <line
                x1={34}
                x2={506}
                y1={205 - 0.5 * 175}
                y2={205 - 0.5 * 175}
                className="stroke-amber-400/70"
                strokeDasharray="4 4"
              />
              <text x={508} y={205 - 0.5 * 175 + 3} className="fill-amber-500 text-[9px] font-mono">
                D=0.5
              </text>
              <line x1={34} x2={506} y1={205} y2={205} className="stroke-slate-300 dark:stroke-slate-700" />

              {/* Curves */}
              <path d={toGanPath(ganCurves.pData, 1.0)} fill="none" stroke="#3b82f6" strokeWidth={2.6} />
              <path d={toGanPath(ganCurves.pGen, 1.0)} fill="none" stroke="#10b981" strokeWidth={2.6} />
              <path
                d={toGanPath(ganCurves.dOpt, 1.0)}
                fill="none"
                stroke="#f43f5e"
                strokeWidth={2}
                strokeDasharray="6 4"
              />
            </svg>
          </div>

          <div className="lg:col-span-4 space-y-4">
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span>训练进度 (Generator 逼近程度)</span>
                <span className="font-mono font-bold text-emerald-600">
                  {Math.round(ganProgress * 100)}%
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={1}
                step={0.02}
                value={ganProgress}
                onChange={(e) => setGanProgress(parseFloat(e.target.value))}
                className="w-full"
              />
            </div>

            <label className="flex items-center justify-between rounded-xl border border-rose-200/80 bg-rose-50/50 p-3 text-xs cursor-pointer dark:border-rose-900/50 dark:bg-rose-950/20">
              <span className="font-semibold text-rose-700 dark:text-rose-300">
                演示模式崩塌 (Mode Collapse)
              </span>
              <input
                type="checkbox"
                checked={modeCollapse}
                onChange={(e) => setModeCollapse(e.target.checked)}
                className="h-4 w-4 accent-rose-600"
              />
            </label>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950/60">
              <div className="text-[11px] text-slate-500">估算 JS 散度 JSD(p_data ‖ p_g)</div>
              <div className="font-mono text-xl font-bold text-violet-600 dark:text-violet-400">
                {ganCurves.jsd.toFixed(4)}
              </div>
            </div>

            <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">
              {modeCollapse
                ? '发生 Mode Collapse 时，生成器只学会了左侧单峰以骗过判别器，完全遗漏右侧真实峰，导致右侧 D*(x) 维持在 1.0！'
                : '把进度拉到 100%：当 p_g = p_data 时，最优判别器 D*(x) = p_data/(p_data+p_g) 处处恒等于 0.5（彻底分不清真假），达到纳什均衡！'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
