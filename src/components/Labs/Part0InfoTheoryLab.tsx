import React, { useMemo, useState } from 'react';
import { ArrowLeftRight, BarChart2, Sparkles } from 'lucide-react';
import { MathFormula } from '../MathFormula';

const CLASSES = ['类别 A', '类别 B', '类别 C', '类别 D'];
const EPS = 1e-6;

function normalize(arr: number[]): number[] {
  const s = arr.reduce((a, b) => a + b, 0);
  if (s <= 0) return arr.map(() => 1 / arr.length);
  return arr.map((v) => v / s);
}

function entropy(p: number[]): number {
  return -p.reduce((acc, pi) => (pi > EPS ? acc + pi * Math.log2(pi) : acc), 0);
}

function crossEntropy(p: number[], q: number[]): number {
  return -p.reduce((acc, pi, i) => (pi > EPS ? acc + pi * Math.log2(Math.max(q[i], EPS)) : acc), 0);
}

function klDiv(p: number[], q: number[]): number {
  return p.reduce(
    (acc, pi, i) => (pi > EPS ? acc + pi * Math.log2(pi / Math.max(q[i], EPS)) : acc),
    0
  );
}

// Beta PDF normalized to peak = 1 for clean visual comparison
function betaCurve(a: number, b: number, n = 120): { x: number; y: number }[] {
  const pts: { x: number; y: number }[] = [];
  let maxVal = 0;
  for (let i = 1; i < n; i++) {
    const x = i / n;
    const logVal = (a - 1) * Math.log(x) + (b - 1) * Math.log(1 - x);
    const y = Math.exp(logVal);
    if (Number.isFinite(y)) {
      maxVal = Math.max(maxVal, y);
      pts.push({ x, y });
    }
  }
  return pts.map((pt) => ({ x: pt.x, y: maxVal > 0 ? pt.y / maxVal : 0 }));
}

export const Part0InfoTheoryLab: React.FC = () => {
  const [tab, setTab] = useState<'info' | 'bayes'>('info');

  // Info theory state (raw weights normalized to P and Q)
  const [rawP, setRawP] = useState<number[]>([0.65, 0.2, 0.1, 0.05]);
  const [rawQ, setRawQ] = useState<number[]>([0.25, 0.25, 0.25, 0.25]);

  const p = useMemo(() => normalize(rawP), [rawP]);
  const q = useMemo(() => normalize(rawQ), [rawQ]);

  const hP = useMemo(() => entropy(p), [p]);
  const hPQ = useMemo(() => crossEntropy(p, q), [p, q]);
  const klPQ = useMemo(() => klDiv(p, q), [p, q]);
  const klQP = useMemo(() => klDiv(q, p), [p, q]);

  // MLE vs MAP state
  const [heads, setHeads] = useState(7);
  const [tails, setTails] = useState(3);
  const [alpha, setAlpha] = useState(4);
  const [beta, setBeta] = useState(4);

  const priorPts = useMemo(() => betaCurve(alpha, beta), [alpha, beta]);
  const likPts = useMemo(() => betaCurve(heads + 1, tails + 1), [heads, tails]);
  const postPts = useMemo(() => betaCurve(alpha + heads, beta + tails), [alpha, beta, heads, tails]);

  const mle = heads + tails > 0 ? heads / (heads + tails) : 0.5;
  const mapDenom = alpha + beta + heads + tails - 2;
  const mapEst = mapDenom > 0 ? Math.min(1, Math.max(0, (heads + alpha - 1) / mapDenom)) : 0.5;

  const toPath = (pts: { x: number; y: number }[], w: number, h: number, padX: number, padY: number) =>
    pts
      .map(
        (pt, i) =>
          `${i === 0 ? 'M' : 'L'} ${(padX + pt.x * (w - 2 * padX)).toFixed(1)} ${(
            h -
            padY -
            pt.y * (h - 2 * padY)
          ).toFixed(1)}`
      )
      .join(' ');

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden dark:border-slate-800 dark:bg-slate-900">
      {/* Header & Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50/80 px-5 py-3.5 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-2">
          <BarChart2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            交互实验室 · 信息论与贝叶斯估计
          </h3>
        </div>

        <div className="flex rounded-lg border border-slate-200 bg-white p-0.5 text-xs font-medium dark:border-slate-700 dark:bg-slate-800">
          <button
            onClick={() => setTab('info')}
            className={`rounded-md px-3 py-1 transition cursor-pointer ${
              tab === 'info'
                ? 'bg-blue-600 text-white'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-300'
            }`}
          >
            熵 · 交叉熵 · KL 散度
          </button>
          <button
            onClick={() => setTab('bayes')}
            className={`rounded-md px-3 py-1 transition cursor-pointer ${
              tab === 'bayes'
                ? 'bg-blue-600 text-white'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-300'
            }`}
          >
            MLE vs MAP 后验演化
          </button>
        </div>
      </div>

      {tab === 'info' ? (
        <div className="p-5 space-y-5">
          {/* Presets */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="font-medium text-slate-500 dark:text-slate-400">快速预设：</span>
            <button
              onClick={() => {
                setRawP([0.7, 0.15, 0.1, 0.05]);
                setRawQ([0.7, 0.15, 0.1, 0.05]);
              }}
              className="rounded-lg border border-slate-200 px-2.5 py-1 hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800 cursor-pointer"
            >
              完全匹配 (P = Q)
            </button>
            <button
              onClick={() => {
                setRawP([0.85, 0.1, 0.04, 0.01]);
                setRawQ([0.25, 0.25, 0.25, 0.25]);
              }}
              className="rounded-lg border border-slate-200 px-2.5 py-1 hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800 cursor-pointer"
            >
              尖锐真实 vs 均匀预测
            </button>
            <button
              onClick={() => {
                setRawP([0.48, 0.48, 0.02, 0.02]);
                setRawQ([0.92, 0.02, 0.03, 0.03]);
              }}
              className="rounded-lg border border-slate-200 px-2.5 py-1 hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800 cursor-pointer"
            >
              双峰漏检 (Mode-Seeking 陷阱)
            </button>
            <button
              onClick={() => {
                const oldP = [...rawP];
                setRawP([...rawQ]);
                setRawQ(oldP);
              }}
              className="inline-flex items-center gap-1 rounded-lg bg-violet-50 px-2.5 py-1 font-medium text-violet-700 hover:bg-violet-100 dark:bg-violet-950/60 dark:text-violet-300 cursor-pointer"
            >
              <ArrowLeftRight className="h-3.5 w-3.5" /> 交换 P ↔ Q
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Left: Distribution Sliders & Visual Bars */}
            <div className="lg:col-span-7 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* P Controls */}
                <div className="rounded-xl border border-blue-200/70 bg-blue-50/40 p-4 dark:border-blue-900/50 dark:bg-blue-950/20">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-xs font-semibold text-blue-700 dark:text-blue-300">
                      真实分布 P(x)
                    </span>
                    <span className="font-mono text-[11px] text-blue-600/80 dark:text-blue-400">
                      Σp = 1.00
                    </span>
                  </div>
                  <div className="space-y-2.5">
                    {CLASSES.map((cls, i) => (
                      <div key={cls} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-600 dark:text-slate-300">{cls}</span>
                          <span className="font-mono font-medium text-blue-700 dark:text-blue-300">
                            {(p[i] * 100).toFixed(1)}%
                          </span>
                        </div>
                        <input
                          type="range"
                          min={0.01}
                          max={1}
                          step={0.01}
                          value={rawP[i]}
                          onChange={(e) => {
                            const next = [...rawP];
                            next[i] = parseFloat(e.target.value);
                            setRawP(next);
                          }}
                          className="w-full h-1.5"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Q Controls */}
                <div className="rounded-xl border border-emerald-200/70 bg-emerald-50/40 p-4 dark:border-emerald-900/50 dark:bg-emerald-950/20">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                      模型预测分布 Q(x)
                    </span>
                    <span className="font-mono text-[11px] text-emerald-600/80 dark:text-emerald-400">
                      Σq = 1.00
                    </span>
                  </div>
                  <div className="space-y-2.5">
                    {CLASSES.map((cls, i) => (
                      <div key={cls} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-600 dark:text-slate-300">{cls}</span>
                          <span className="font-mono font-medium text-emerald-700 dark:text-emerald-300">
                            {(q[i] * 100).toFixed(1)}%
                          </span>
                        </div>
                        <input
                          type="range"
                          min={0.01}
                          max={1}
                          step={0.01}
                          value={rawQ[i]}
                          onChange={(e) => {
                            const next = [...rawQ];
                            next[i] = parseFloat(e.target.value);
                            setRawQ(next);
                          }}
                          className="w-full h-1.5"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Comparative Bar Chart */}
              <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
                <div className="mb-2 flex items-center justify-between text-xs text-slate-500">
                  <span>分布形态直方图对比</span>
                  <div className="flex gap-3">
                    <span className="inline-flex items-center gap-1">
                      <span className="h-2.5 w-2.5 rounded-sm bg-blue-500" /> P (真实)
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <span className="h-2.5 w-2.5 rounded-sm bg-emerald-500" /> Q (预测)
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-3 pt-2 h-36 items-end">
                  {CLASSES.map((cls, i) => (
                    <div key={cls} className="flex flex-col items-center h-full justify-end gap-1.5">
                      <div className="flex items-end gap-1.5 w-full justify-center h-28">
                        <div
                          className="w-6 rounded-t-md bg-blue-500/90 transition-all duration-150"
                          style={{ height: `${Math.max(4, p[i] * 100)}%` }}
                          title={`P=${p[i].toFixed(3)}`}
                        />
                        <div
                          className="w-6 rounded-t-md bg-emerald-500/90 transition-all duration-150"
                          style={{ height: `${Math.max(4, q[i] * 100)}%` }}
                          title={`Q=${q[i].toFixed(3)}`}
                        />
                      </div>
                      <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                        {cls}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: Live Metrics & Decomposition */}
            <div className="lg:col-span-5 flex flex-col justify-between gap-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 dark:border-slate-800 dark:bg-slate-950/60">
                  <div className="text-[11px] font-medium text-slate-500">信息熵 H(P)</div>
                  <div className="mt-1 font-mono text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {hP.toFixed(3)}
                  </div>
                  <div className="text-[10px] text-slate-400">bits · 理论最短平均码长</div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 dark:border-slate-800 dark:bg-slate-950/60">
                  <div className="text-[11px] font-medium text-slate-500">交叉熵 H(P, Q)</div>
                  <div className="mt-1 font-mono text-2xl font-bold text-violet-600 dark:text-violet-400">
                    {hPQ.toFixed(3)}
                  </div>
                  <div className="text-[10px] text-slate-400">bits · 分类训练损失本质</div>
                </div>

                <div className="rounded-xl border border-rose-200/80 bg-rose-50/60 p-3.5 dark:border-rose-900/60 dark:bg-rose-950/30">
                  <div className="text-[11px] font-medium text-rose-700 dark:text-rose-300">
                    Forward KL: D_KL(P ‖ Q)
                  </div>
                  <div className="mt-1 font-mono text-2xl font-bold text-rose-600 dark:text-rose-400">
                    {klPQ.toFixed(3)}
                  </div>
                  <div className="text-[10px] text-rose-500/80">bits · 用 Q 编码 P 的额外代价</div>
                </div>

                <div className="rounded-xl border border-amber-200/80 bg-amber-50/60 p-3.5 dark:border-amber-900/60 dark:bg-amber-950/30">
                  <div className="text-[11px] font-medium text-amber-700 dark:text-amber-300">
                    Reverse KL: D_KL(Q ‖ P)
                  </div>
                  <div className="mt-1 font-mono text-2xl font-bold text-amber-600 dark:text-amber-400">
                    {klQP.toFixed(3)}
                  </div>
                  <div className="text-[10px] text-amber-600/80">bits · 证明 KL 散度非对称！</div>
                </div>
              </div>

              {/* Stacked Decomposition Bar */}
              <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-200">
                  <span>黄金恒等式分解</span>
                  <span className="font-mono text-[11px] text-slate-500">
                    {hPQ.toFixed(3)} = {hP.toFixed(3)} + {klPQ.toFixed(3)}
                  </span>
                </div>
                <div className="h-5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800 flex">
                  <div
                    className="bg-blue-500 transition-all duration-150 flex items-center justify-center text-[10px] font-bold text-white"
                    style={{ width: `${Math.min(100, (hP / Math.max(hPQ, 0.01)) * 100)}%` }}
                  >
                    H(P)
                  </div>
                  <div
                    className="bg-rose-500 transition-all duration-150 flex items-center justify-center text-[10px] font-bold text-white"
                    style={{ width: `${Math.min(100, (klPQ / Math.max(hPQ, 0.01)) * 100)}%` }}
                  >
                    {klPQ > 0.08 ? 'KL' : ''}
                  </div>
                </div>
                <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                  因为真实数据分布 P 固定，所以 <strong>H(P) 是常数</strong>。因此在神经网络训练中，
                  <strong>最小化交叉熵 H(P, Q) 数学上完全等价于最小化 D_KL(P ‖ Q)</strong>！当你在「双峰漏检」预设下观察，会发现
                  P(B)=48% 但 Q(B)=2% 时 Forward KL 急剧飙升——这就是为什么 MLE 会逼迫模型覆盖所有真实模式（Mean-Seeking）。
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-5 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Controls */}
          <div className="lg:col-span-5 space-y-4">
            <div className="rounded-xl border border-slate-200 p-4 space-y-3 dark:border-slate-800">
              <div className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                观测数据（抛硬币试验）
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span>正面次数 H (Heads)</span>
                  <span className="font-mono font-bold text-blue-600">{heads}</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={40}
                  value={heads}
                  onChange={(e) => setHeads(parseInt(e.target.value, 10))}
                  className="w-full"
                />
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span>反面次数 T (Tails)</span>
                  <span className="font-mono font-bold text-blue-600">{tails}</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={40}
                  value={tails}
                  onChange={(e) => setTails(parseInt(e.target.value, 10))}
                  className="w-full"
                />
              </div>
            </div>

            <div className="rounded-xl border border-violet-200/80 bg-violet-50/40 p-4 space-y-3 dark:border-violet-900/50 dark:bg-violet-950/20">
              <div className="text-xs font-semibold text-violet-800 dark:text-violet-300">
                Beta(α, β) 先验信念（等价于“伪计数”正则化）
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span>先验 α（倾向正面）</span>
                  <span className="font-mono font-bold text-violet-600">{alpha}</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={20}
                  value={alpha}
                  onChange={(e) => setAlpha(parseInt(e.target.value, 10))}
                  className="w-full"
                />
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span>先验 β（倾向反面）</span>
                  <span className="font-mono font-bold text-violet-600">{beta}</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={20}
                  value={beta}
                  onChange={(e) => setBeta(parseInt(e.target.value, 10))}
                  className="w-full"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-3 dark:border-blue-900 dark:bg-blue-950/30">
                <div className="text-[11px] text-blue-700 dark:text-blue-300">MLE 估计值</div>
                <div className="font-mono text-xl font-bold text-blue-600 dark:text-blue-400">
                  {mle.toFixed(3)}
                </div>
              </div>
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-3 dark:border-emerald-900 dark:bg-emerald-950/30">
                <div className="text-[11px] text-emerald-700 dark:text-emerald-300">MAP 估计值</div>
                <div className="font-mono text-xl font-bold text-emerald-600 dark:text-emerald-400">
                  {mapEst.toFixed(3)}
                </div>
              </div>
            </div>
          </div>

          {/* Right: Beta Posterior SVG */}
          <div className="lg:col-span-7 space-y-3">
            <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 dark:border-slate-800 dark:bg-slate-950/60">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="font-semibold text-slate-700 dark:text-slate-200">
                  后验分布 ∝ 先验 × 似然（峰值归一化对比）
                </span>
                <div className="flex gap-3 text-[11px]">
                  <span className="inline-flex items-center gap-1 text-violet-600 dark:text-violet-400">
                    <span className="h-2 w-2 rounded-full bg-violet-500" /> Prior
                  </span>
                  <span className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400">
                    <span className="h-2 w-2 rounded-full bg-blue-500" /> Likelihood (MLE)
                  </span>
                  <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" /> Posterior (MAP)
                  </span>
                </div>
              </div>

              <svg viewBox="0 0 540 240" className="w-full h-auto">
                {/* Grid */}
                {[0, 0.25, 0.5, 0.75, 1].map((tick) => {
                  const x = 36 + tick * (540 - 72);
                  return (
                    <g key={tick}>
                      <line
                        x1={x}
                        x2={x}
                        y1={20}
                        y2={210}
                        className="stroke-slate-200 dark:stroke-slate-800"
                        strokeDasharray="3 3"
                      />
                      <text x={x} y={228} textAnchor="middle" className="fill-slate-400 text-[10px] font-mono">
                        {tick.toFixed(2)}
                      </text>
                    </g>
                  );
                })}
                <line x1={36} x2={504} y1={210} y2={210} className="stroke-slate-300 dark:stroke-slate-700" />

                {/* Prior */}
                <path
                  d={toPath(priorPts, 540, 240, 36, 30)}
                  fill="none"
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  strokeDasharray="6 4"
                />
                {/* Likelihood */}
                <path
                  d={toPath(likPts, 540, 240, 36, 30)}
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth={2}
                />
                {/* Posterior */}
                <path
                  d={toPath(postPts, 540, 240, 36, 30)}
                  fill="none"
                  stroke="#10b981"
                  strokeWidth={3}
                />

                {/* Vertical markers */}
                <line
                  x1={36 + mle * (540 - 72)}
                  x2={36 + mle * (540 - 72)}
                  y1={22}
                  y2={210}
                  stroke="#3b82f6"
                  strokeWidth={1.5}
                  strokeDasharray="3 3"
                />
                <line
                  x1={36 + mapEst * (540 - 72)}
                  x2={36 + mapEst * (540 - 72)}
                  y1={22}
                  y2={210}
                  stroke="#10b981"
                  strokeWidth={1.8}
                />
              </svg>
            </div>

            <div className="flex items-start gap-2 rounded-xl bg-amber-50/70 p-3 text-xs text-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
              <Sparkles className="h-4 w-4 shrink-0 mt-0.5 text-amber-500" />
              <div>
                试着把观测次数拉大（如 H=30, T=10）：你会看到 <strong>Posterior 逐渐压过 Prior 并收敛向 MLE</strong>。
                而在小样本时，先验把极端的 MLE 拉向合理中心——这正是 Part 1 中{' '}
                <strong>高斯先验 MAP 等价于 L2 Ridge 正则化</strong> 的概率论直觉！
              </div>
            </div>
            <div className="text-center">
              <MathFormula
                latex={String.raw`\hat{\theta}_{\text{MAP}} = \arg\max_\theta \Big[\underbrace{\log P(\mathcal{D}\mid\theta)}_{\text{MLE 似然}} + \underbrace{\log P(\theta)}_{\text{正则化先验}}\Big]`}
                className="text-sm"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
