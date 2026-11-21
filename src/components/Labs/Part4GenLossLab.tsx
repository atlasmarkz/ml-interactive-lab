import React, { useState } from 'react';
import { Flame, SlidersHorizontal } from 'lucide-react';
import { MathFormula } from '../MathFormula';

export const Part4GenLossLab: React.FC = () => {
  const [tab, setTab] = useState<'ganloss' | 'cfg'>('ganloss');

  // --- Tab 1: GAN Saturating vs Non-Saturating Loss ---
  const [dVal, setDVal] = useState(0.08); // D(G(z)) near 0 = early training!

  const satLoss = (d: number) => Math.log(Math.max(1e-4, 1 - d));
  const nonSatLoss = (d: number) => -Math.log(Math.max(1e-4, d));
  // Magnitude of derivative w.r.t D(G(z))
  const satGradMag = (d: number) => 1 / Math.max(0.04, 1 - d);
  const nonSatGradMag = (d: number) => 1 / Math.max(0.04, d);

  const gradPath = (fn: (d: number) => number) => {
    const pts: string[] = [];
    for (let i = 1; i <= 98; i++) {
      const d = i / 100;
      const g = Math.min(12, fn(d));
      const px = 42 + d * 436;
      const py = 195 - (g / 12) * 165;
      pts.push(`${i === 1 ? 'M' : 'L'} ${px.toFixed(1)} ${py.toFixed(1)}`);
    }
    return pts.join(' ');
  };

  // --- Tab 2: Classifier-Free Guidance (CFG) Vector Extrapolation ---
  const [cfgW, setCfgW] = useState(7.0);
  // 2D score vector illustration: uncond points mildly right, cond points upper-right
  const ux = 0.6;
  const uy = 0.25;
  const cx = 0.95;
  const cy = 0.85;
  const gx = ux + (cfgW / 5) * (cx - ux);
  const gy = uy + (cfgW / 5) * (cy - uy);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50/80 px-5 py-3.5 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-2">
          <Flame className="h-4 w-4 text-rose-600 dark:text-rose-400" />
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            交互实验室 4C · GAN 饱和 vs 非饱和梯度危机 & Diffusion CFG 引导外推
          </h3>
        </div>
        <div className="flex rounded-lg border border-slate-200 bg-white p-0.5 text-xs font-medium dark:border-slate-700 dark:bg-slate-800">
          <button
            onClick={() => setTab('ganloss')}
            className={`rounded-md px-3 py-1 transition cursor-pointer ${
              tab === 'ganloss' ? 'bg-rose-600 text-white' : 'text-slate-600 dark:text-slate-300'
            }`}
          >
            GAN 两种 G-Loss 梯度对比
          </button>
          <button
            onClick={() => setTab('cfg')}
            className={`rounded-md px-3 py-1 transition cursor-pointer ${
              tab === 'cfg' ? 'bg-rose-600 text-white' : 'text-slate-600 dark:text-slate-300'
            }`}
          >
            DDPM 反向公式 & CFG 引导
          </button>
        </div>
      </div>

      {tab === 'ganloss' ? (
        <div className="p-5 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          <div className="lg:col-span-7 rounded-xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-950/60">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="font-semibold">生成器梯度强度 |∂L / ∂D(G(z))| 随 D(G(z)) 变化曲线</span>
              <div className="flex gap-3 text-[11px]">
                <span className="text-rose-600 font-bold">● 非饱和 −log D (初期梯度极强!)</span>
                <span className="text-slate-500 font-bold">--- 原始 log(1−D) (初期平缓停滞)</span>
              </div>
            </div>

            <svg viewBox="0 0 510 218" className="w-full h-auto">
              <line x1={42} x2={478} y1={195} y2={195} className="stroke-slate-300 dark:stroke-slate-700" />
              <line x1={42} x2={42} y1={24} y2={195} className="stroke-slate-300 dark:stroke-slate-700" />
              <text x={52} y={211} className="fill-slate-400 text-[10px] font-mono">D=0 (初期假图一眼识破)</text>
              <text x={476} y={211} textAnchor="end" className="fill-slate-400 text-[10px] font-mono">D=1 (完全骗过判别器)</text>

              <path d={gradPath(satGradMag)} fill="none" stroke="#64748b" strokeWidth={2.3} strokeDasharray="6 4" />
              <path d={gradPath(nonSatGradMag)} fill="none" stroke="#f43f5e" strokeWidth={3} />

              <line x1={42 + dVal * 436} x2={42 + dVal * 436} y1={24} y2={195} stroke="#f59e0b" strokeWidth={1.8} />
              <circle cx={42 + dVal * 436} cy={195 - (Math.min(12, nonSatGradMag(dVal)) / 12) * 165} r={5.5} fill="#f43f5e" stroke="#fff" strokeWidth={2} />
              <circle cx={42 + dVal * 436} cy={195 - (Math.min(12, satGradMag(dVal)) / 12) * 165} r={5.5} fill="#64748b" stroke="#fff" strokeWidth={2} />
            </svg>
          </div>

          <div className="lg:col-span-5 space-y-4 text-xs">
            <div className="space-y-1">
              <div className="flex justify-between">
                <span>判别器给假样本打分 D(G(z))</span>
                <span className="font-mono font-bold text-amber-600">{dVal.toFixed(2)}</span>
              </div>
              <input type="range" min={0.04} max={0.95} step={0.02} value={dVal} onChange={(e) => setDVal(parseFloat(e.target.value))} className="w-full" />
            </div>

            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950/60">
                <div className="text-[10px] text-slate-500">原始 log(1−D) 梯度</div>
                <div className="font-mono text-xl font-bold text-slate-600 dark:text-slate-300">
                  {satGradMag(dVal).toFixed(2)}
                </div>
                <div className="text-[10px] text-slate-400">Loss = {satLoss(dVal).toFixed(2)}</div>
              </div>
              <div className="rounded-xl border border-rose-200 bg-rose-50/50 p-3 dark:border-rose-900 dark:bg-rose-950/30">
                <div className="text-[10px] text-rose-700 dark:text-rose-300">非饱和 −log D 梯度</div>
                <div className="font-mono text-xl font-bold text-rose-600 dark:text-rose-400">
                  {nonSatGradMag(dVal).toFixed(2)}
                </div>
                <div className="text-[10px] text-rose-500">Loss = {nonSatLoss(dVal).toFixed(2)}</div>
              </div>
            </div>

            <div className="rounded-xl border border-rose-200/80 bg-rose-50/40 p-3.5 leading-relaxed text-slate-700 dark:border-rose-900/50 dark:bg-rose-950/20 dark:text-slate-300">
              <strong>WA4 高频考点总结：</strong>
              两个目标的共同目的都是推高 D(G(z))→1。理论上只有原始的 min log(1−D) 严格对应 <strong>Jensen-Shannon 散度 (JSD)</strong>；但训练初期假图极差、D(G(z))≈0，此时 log(1−D) 曲线几乎水平（梯度仅 ≈1，乘以 Sigmoid 饱和导数后彻底消失！）。改用非饱和损失 <strong>−log D(G(z))</strong> 在 D≈0 时提供巨大梯度，让生成器早期迅速学会生成逼真样本！
            </div>
          </div>
        </div>
      ) : (
        <div className="p-5 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          <div className="lg:col-span-6 space-y-3">
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-950/60">
              <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200">
                <SlidersHorizontal className="h-3.5 w-3.5 text-blue-500" />
                Classifier-Free Guidance (CFG) 噪声方向外推几何示意
              </div>
              <svg viewBox="0 0 320 220" className="w-full h-48">
                <defs>
                  <marker id="arr-b" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 0 L 10 5 L 0 10 z" fill="#64748b" />
                  </marker>
                  <marker id="arr-g" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 0 L 10 5 L 0 10 z" fill="#10b981" />
                  </marker>
                  <marker id="arr-r" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 0 L 10 5 L 0 10 z" fill="#f43f5e" />
                  </marker>
                </defs>
                {/* Origin at (40, 185) */}
                <circle cx={40} cy={185} r={4} fill="#334155" />
                {/* Unconditional vector */}
                <line x1={40} y1={185} x2={40 + ux * 120} y2={185 - uy * 120} stroke="#64748b" strokeWidth={2.4} markerEnd="url(#arr-b)" />
                <text x={40 + ux * 120 + 6} y={185 - uy * 120 + 4} className="fill-slate-500 text-[10px] font-mono">ε(x_t, ∅)</text>
                {/* Conditional vector */}
                <line x1={40} y1={185} x2={40 + cx * 120} y2={185 - cy * 120} stroke="#10b981" strokeWidth={2.4} markerEnd="url(#arr-g)" />
                <text x={40 + cx * 120 + 6} y={185 - cy * 120} className="fill-emerald-600 text-[10px] font-mono">ε(x_t, c)</text>
                {/* CFG Extrapolated vector */}
                <line
                  x1={40}
                  y1={185}
                  x2={Math.min(305, 40 + gx * 120)}
                  y2={Math.max(15, 185 - gy * 120)}
                  stroke="#f43f5e"
                  strokeWidth={3}
                  markerEnd="url(#arr-r)"
                />
                <text
                  x={Math.min(255, 40 + gx * 120 - 18)}
                  y={Math.max(22, 185 - gy * 120 - 6)}
                  className="fill-rose-600 text-[10px] font-mono font-bold"
                >
                  ε̃_CFG (w={cfgW.toFixed(1)})
                </text>
              </svg>
            </div>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span>CFG 文本引导强度 w（Stable Diffusion 常用 7.5）</span>
                <span className="font-mono font-bold text-rose-600">w = {cfgW.toFixed(1)}</span>
              </div>
              <input type="range" min={1} max={10} step={0.5} value={cfgW} onChange={(e) => setCfgW(parseFloat(e.target.value))} className="w-full" />
            </div>
          </div>

          <div className="lg:col-span-6 space-y-3 text-xs">
            <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-800 space-y-2">
              <div className="font-bold text-slate-800 dark:text-slate-100">
                DDPM 完整单步反向采样公式（WA4 Q3 考点逐项拆解）
              </div>
              <MathFormula
                latex={String.raw`\mathbf{x}_{t-1} = \frac{1}{\sqrt{\alpha_t}}\!\left(\mathbf{x}_t - \frac{1-\alpha_t}{\sqrt{1-\bar\alpha_t}}\,\boldsymbol{\epsilon}_\theta(\mathbf{x}_t, t)\right) + \sigma_t \mathbf{z}`}
                className="text-sm"
              />
              <ul className="space-y-1.5 text-slate-600 dark:text-slate-300 leading-relaxed">
                <li>• <strong>减去预测噪声项</strong>：按当前步噪声权重比例扣除网络估计的噪声 ε_θ，把样本拉回更干净的数据流形。</li>
                <li>• <strong>乘以 1/√α_t</strong>：补偿前向扩散时的信号衰减缩放，恢复正确幅度。</li>
                <li>• <strong>+ σ_t z（t &gt; 1 时加随机噪声）</strong>：保持生成多样性（Langevin 探索），避免坍塌到模糊均值；若令 σ_t = 0 即演变为确定性加速采样 <strong>DDIM</strong>！</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
