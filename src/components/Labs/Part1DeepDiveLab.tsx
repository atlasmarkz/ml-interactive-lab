import React, { useMemo, useState } from 'react';
import { Compass, Scale, Target } from 'lucide-react';

export const Part1DeepDiveLab: React.FC = () => {
  const [tab, setTab] = useState<'lasso' | 'surrogate' | 'metrics'>('lasso');

  // --- Tab 1: LASSO (L1) vs Ridge (L2) Geometry ---
  const [olsX, setOlsX] = useState(1.65);
  const [olsY, setOlsY] = useState(0.55);
  const [budget, setBudget] = useState(1.0);
  const [penalizeBias, setPenalizeBias] = useState(false);

  // Compute exact constrained optimum on L1 diamond (|w1|+|w2| <= t) and L2 ball (w1^2+w2^2 <= t^2)
  // Using tilted elliptical MSE contours: E(w) = 2*(w1 - olsX)^2 + 0.7*(w2 - olsY)^2 + 0.6*(w1-olsX)*(w2-olsY)
  const { l1Opt, l2Opt } = useMemo(() => {
    const mse = (w1: number, w2: number) => {
      const dx = w1 - olsX;
      const dy = w2 - olsY;
      return 1.8 * dx * dx + 0.9 * dy * dy + 0.65 * dx * dy;
    };
    let bestL1: [number, number] = [0, 0];
    let bestL1Val = Infinity;
    let bestL2: [number, number] = [0, 0];
    let bestL2Val = Infinity;

    // Fine polar/perimeter + interior check
    for (let i = 0; i <= 360; i++) {
      const a = (i / 360) * Math.PI * 2;
      // L2 circle boundary
      const c1 = budget * Math.cos(a);
      const c2 = budget * Math.sin(a);
      const v2 = mse(c1, c2);
      if (v2 < bestL2Val) {
        bestL2Val = v2;
        bestL2 = [c1, c2];
      }
      // L1 diamond boundary
      const s = Math.abs(Math.cos(a)) + Math.abs(Math.sin(a));
      const d1 = (budget * Math.cos(a)) / s;
      const d2 = (budget * Math.sin(a)) / s;
      const v1 = mse(d1, d2);
      if (v1 < bestL1Val) {
        bestL1Val = v1;
        bestL1 = [d1, d2];
      }
    }
    if (Math.abs(olsX) + Math.abs(olsY) <= budget) bestL1 = [olsX, olsY];
    if (olsX * olsX + olsY * olsY <= budget * budget) bestL2 = [olsX, olsY];
    return { l1Opt: bestL1, l2Opt: bestL2 };
  }, [olsX, olsY, budget]);

  // --- Tab 2: Surrogate Losses & XOR Lift ---
  const [marginZ, setMarginZ] = useState(-0.6);
  const [useXorFeature, setUseXorFeature] = useState(false);

  const surrPath = (fn: (m: number) => number) => {
    const pts: string[] = [];
    for (let i = 0; i <= 100; i++) {
      const m = -2.5 + (5.0 * i) / 100;
      const y = Math.min(4.2, fn(m));
      const px = 38 + ((m + 2.5) / 5.0) * 444;
      const py = 205 - (y / 4.2) * 175;
      pts.push(`${i === 0 ? 'M' : 'L'} ${px.toFixed(1)} ${py.toFixed(1)}`);
    }
    return pts.join(' ');
  };

  // --- Tab 3: Imbalanced Classification Metrics (950 Neg, 50 Pos) ---
  const [threshold, setThreshold] = useState(0.5);

  const cm = useMemo(() => {
    // Realistic synthetic score distributions: Neg ~ N(0.25, 0.16), Pos ~ N(0.68, 0.18)
    // Approximate CDF via logistic approximation of normal CDF
    const normCdf = (z: number) => 1 / (1 + Math.exp(-1.702 * z));
    const totalPos = 50;
    const totalNeg = 950;
    const tpr = 1 - normCdf((threshold - 0.68) / 0.18);
    const fpr = 1 - normCdf((threshold - 0.25) / 0.16);
    const tp = Math.round(totalPos * tpr);
    const fn = totalPos - tp;
    const fp = Math.round(totalNeg * fpr);
    const tn = totalNeg - fp;
    const acc = (tp + tn) / (totalPos + totalNeg);
    const prec = tp + fp > 0 ? tp / (tp + fp) : 1;
    const rec = tp / totalPos;
    const f1 = prec + rec > 0 ? (2 * prec * rec) / (prec + rec) : 0;
    return { tp, fn, fp, tn, acc, prec, rec, f1 };
  }, [threshold]);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50/80 px-5 py-3.5 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-2">
          <Scale className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            交互实验室 1C · LASSO vs Ridge 几何稀疏、凸代理损失与不平衡评估指标
          </h3>
        </div>
        <div className="flex flex-wrap rounded-lg border border-slate-200 bg-white p-0.5 text-xs font-medium dark:border-slate-700 dark:bg-slate-800">
          {[
            { id: 'lasso', label: 'L1 LASSO vs L2 Ridge' },
            { id: 'surrogate', label: '0/1 损失 · 凸代理 · XOR' },
            { id: 'metrics', label: 'Precision · Recall · F1' },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id as 'lasso' | 'surrogate' | 'metrics')}
              className={`rounded-md px-2.5 py-1 transition cursor-pointer ${
                tab === t.id ? 'bg-amber-600 text-white' : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {tab === 'lasso' && (
        <div className="p-5 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Geometric SVG */}
          <div className="lg:col-span-6 flex flex-col items-center gap-2">
            <svg
              viewBox="0 0 320 320"
              className="w-full max-w-[320px] aspect-square rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-950"
            >
              {/* Axes */}
              <line x1={160} x2={160} y1={12} y2={308} className="stroke-slate-300 dark:stroke-slate-700" />
              <line x1={12} x2={308} y1={160} y2={160} className="stroke-slate-300 dark:stroke-slate-700" />
              <text x={294} y={152} className="fill-slate-400 text-[10px] font-mono">w₁</text>
              <text x={166} y={24} className="fill-slate-400 text-[10px] font-mono">w₂</text>

              {/* MSE Elliptical Contours around OLS */}
              {[0.35, 0.7, 1.1, 1.55].map((scale) => (
                <ellipse
                  key={scale}
                  cx={160 + olsX * 56}
                  cy={160 - olsY * 56}
                  rx={scale * 42}
                  ry={scale * 62}
                  transform={`rotate(-18 ${160 + olsX * 56} ${160 - olsY * 56})`}
                  fill="none"
                  className="stroke-slate-400/45"
                  strokeDasharray="3 3"
                />
              ))}

              {/* L2 Circle */}
              <circle
                cx={160}
                cy={160}
                r={budget * 56}
                fill="rgba(59, 130, 246, 0.14)"
                stroke="#3b82f6"
                strokeWidth={2}
              />

              {/* L1 Diamond */}
              <polygon
                points={`${160},${160 - budget * 56} ${160 + budget * 56},${160} ${160},${160 + budget * 56} ${160 - budget * 56},${160}`}
                fill="rgba(244, 63, 94, 0.15)"
                stroke="#f43f5e"
                strokeWidth={2.2}
              />

              {/* OLS Star */}
              <circle cx={160 + olsX * 56} cy={160 - olsY * 56} r={5} fill="#0f172a" className="dark:fill-white" />
              <text x={160 + olsX * 56 + 7} y={160 - olsY * 56 - 4} className="fill-slate-700 dark:fill-slate-200 text-[10px] font-mono font-bold">
                w_OLS
              </text>

              {/* L2 Optimum */}
              <circle cx={160 + l2Opt[0] * 56} cy={160 - l2Opt[1] * 56} r={6} fill="#3b82f6" stroke="#fff" strokeWidth={2} />
              {/* L1 Optimum */}
              <circle cx={160 + l1Opt[0] * 56} cy={160 - l1Opt[1] * 56} r={6} fill="#f43f5e" stroke="#fff" strokeWidth={2} />
            </svg>
            <div className="flex flex-wrap justify-center gap-3 text-[11px]">
              <span className="text-rose-600 font-semibold">◆ LASSO (L1): ({l1Opt[0].toFixed(2)}, {l1Opt[1].toFixed(2)})</span>
              <span className="text-blue-600 font-semibold">● Ridge (L2): ({l2Opt[0].toFixed(2)}, {l2Opt[1].toFixed(2)})</span>
            </div>
          </div>

          {/* Controls & Bias Penalization Note */}
          <div className="lg:col-span-6 space-y-4">
            <div className="rounded-xl border border-slate-200 p-4 space-y-3 dark:border-slate-800">
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span>正则化约束半径 t（越小 = λ 越强）</span>
                  <span className="font-mono font-bold text-rose-600">t = {budget.toFixed(2)}</span>
                </div>
                <input type="range" min={0.4} max={1.8} step={0.05} value={budget} onChange={(e) => setBudget(parseFloat(e.target.value))} className="w-full" />
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span>无约束 OLS 解位置 w₁*</span>
                  <span className="font-mono font-bold text-slate-600 dark:text-slate-300">{olsX.toFixed(2)}</span>
                </div>
                <input type="range" min={0.4} max={2.1} step={0.05} value={olsX} onChange={(e) => setOlsX(parseFloat(e.target.value))} className="w-full" />
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span>无约束 OLS 解位置 w₂*</span>
                  <span className="font-mono font-bold text-slate-600 dark:text-slate-300">{olsY.toFixed(2)}</span>
                </div>
                <input type="range" min={0.1} max={1.6} step={0.05} value={olsY} onChange={(e) => setOlsY(parseFloat(e.target.value))} className="w-full" />
              </div>
            </div>

            <div className="rounded-xl border border-rose-200/80 bg-rose-50/50 p-3.5 text-xs leading-relaxed text-slate-700 dark:border-rose-900/50 dark:bg-rose-950/20 dark:text-slate-300">
              <strong>为什么 LASSO 产生稀疏解（特征选择）？</strong> L1 约束域是带尖角的菱形，误差等高线椭圆极易最先撞到坐标轴顶点上（例如此时 w₂ = <strong>{Math.abs(l1Opt[1]) < 0.04 ? '0.00 (精确归零!)' : l1Opt[1].toFixed(2)}</strong>）；而 L2 圆周光滑无棱角，只会等比例缩小权重，几乎不会精确为 0。
            </div>

            <div className="rounded-xl border border-amber-200/80 bg-amber-50/50 p-3.5 text-xs space-y-2 dark:border-amber-900/50 dark:bg-amber-950/20">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-amber-800 dark:text-amber-300">
                  高频考点：正则化该不该惩罚偏置项 w₀？
                </span>
                <button
                  onClick={() => setPenalizeBias((v) => !v)}
                  className="rounded-md bg-amber-600 px-2 py-0.5 text-[11px] font-semibold text-white cursor-pointer"
                >
                  {penalizeBias ? '当前：惩罚了 w₀ ❌' : '当前：不惩罚 w₀ ✅'}
                </button>
              </div>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                {penalizeBias
                  ? '❌ 若惩罚 λ(w₀² + w₁²)：当 λ 很大时，不仅斜率 w₁→0，连截距 w₀ 也被强行拉向 0（整条拟合线贴近 y=0 轴，即使数据整体均值在 y=100！），造成严重系统性欠拟合偏差。'
                  : '✅ 正确做法只惩罚斜率 λw₁²：当 λ→∞ 时斜率 w₁→0，截距 w₀ 自动保持在样本均值 ȳ，模型退化为合理的常数预测器而非硬拽向原点！'}
              </p>
            </div>
          </div>
        </div>
      )}

      {tab === 'surrogate' && (
        <div className="p-5 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Surrogate Loss Curves */}
          <div className="lg:col-span-7 space-y-3">
            <div className="text-xs font-semibold text-slate-700 dark:text-slate-200">
              1. 为什么不用 0/1 误差直接做梯度下降？—— 凸代理损失对比 (横轴为间隔 m = y·f(x))
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 dark:border-slate-800 dark:bg-slate-950/60">
              <svg viewBox="0 0 520 225" className="w-full h-auto">
                <line x1={38} x2={482} y1={205} y2={205} className="stroke-slate-300 dark:stroke-slate-700" />
                <line x1={260} x2={260} y1={20} y2={205} className="stroke-slate-300 dark:stroke-slate-700" strokeDasharray="3 3" />
                <text x={260} y={220} textAnchor="middle" className="fill-slate-400 text-[10px] font-mono">m = y·f(x) = 0 (分类边界)</text>

                {/* 0/1 Step Loss */}
                <path d="M 38 163.3 L 260 163.3 L 260 205 L 482 205" fill="none" stroke="#0f172a" className="dark:stroke-slate-200" strokeWidth={2.5} />
                {/* Logistic Loss: log2(1 + exp(-m)) */}
                <path d={surrPath((m) => Math.log2(1 + Math.exp(-m)))} fill="none" stroke="#3b82f6" strokeWidth={2.4} />
                {/* Hinge Loss: max(0, 1-m) */}
                <path d={surrPath((m) => Math.max(0, 1 - m))} fill="none" stroke="#10b981" strokeWidth={2.4} />
                {/* Exponential Loss: exp(-m) */}
                <path d={surrPath((m) => Math.exp(-m))} fill="none" stroke="#f43f5e" strokeWidth={2} strokeDasharray="5 3" />

                {/* Interactive Probe */}
                <line
                  x1={38 + ((marginZ + 2.5) / 5.0) * 444}
                  x2={38 + ((marginZ + 2.5) / 5.0) * 444}
                  y1={22}
                  y2={205}
                  stroke="#f59e0b"
                  strokeWidth={1.6}
                />
              </svg>

              <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                <div className="flex flex-wrap gap-3">
                  <span className="font-semibold">■ 0/1 损失 (梯度处处=0)</span>
                  <span className="text-blue-600 font-semibold">● Logistic (平滑凸上界)</span>
                  <span className="text-emerald-600 font-semibold">● Hinge (SVM)</span>
                  <span className="text-rose-500 font-semibold">--- Exp (AdaBoost)</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs">
              <span className="shrink-0">拖动样本间隔 m = {marginZ.toFixed(2)}：</span>
              <input type="range" min={-2.2} max={2.2} step={0.1} value={marginZ} onChange={(e) => setMarginZ(parseFloat(e.target.value))} className="flex-1" />
              <span className="font-mono text-[11px] text-blue-600">
                Logistic={Math.log2(1 + Math.exp(-marginZ)).toFixed(2)} · Hinge={Math.max(0, 1 - marginZ).toFixed(2)}
              </span>
            </div>
          </div>

          {/* XOR Feature Lift */}
          <div className="lg:col-span-5 rounded-xl border border-slate-200 p-4 space-y-3 dark:border-slate-800">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold flex items-center gap-1.5">
                <Compass className="h-3.5 w-3.5 text-violet-500" />
                2. 线性分类器解 XOR（特征升维）
              </span>
              <button
                onClick={() => setUseXorFeature((v) => !v)}
                className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold cursor-pointer transition ${
                  useXorFeature ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                }`}
              >
                {useXorFeature ? '已加特征 x₁x₂ ✅' : '添加交互项 x₁x₂'}
              </button>
            </div>

            <svg viewBox="0 0 220 180" className="w-full h-44 rounded-lg bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-800">
              {useXorFeature ? (
                <>
                  {/* Non-linear curved region in (x1, x2) via x1*x2 */}
                  <rect x={25} y={15} width={170} height={150} fill="rgba(244,63,94,0.08)" />
                  <path d="M 25 110 Q 95 100 110 15 L 25 15 Z" fill="rgba(16,185,129,0.22)" />
                  <path d="M 195 70 Q 125 80 110 165 L 195 165 Z" fill="rgba(16,185,129,0.22)" />
                  <text x={110} y={92} textAnchor="middle" className="fill-emerald-700 dark:fill-emerald-400 text-[10px] font-bold">
                    w₀+w₁x₁+w₂x₂+w₃x₁x₂ → 误差 0%!
                  </text>
                </>
              ) : (
                <>
                  <line x1={30} y1={145} x2={190} y2={35} stroke="#f59e0b" strokeWidth={2.5} strokeDasharray="5 4" />
                  <text x={110} y={168} textAnchor="middle" className="fill-rose-600 text-[10px] font-bold">
                    单条直线最多分对 3/4 点 (最低误差 25%)!
                  </text>
                </>
              )}
              {/* 4 XOR Points: (0,0)=1, (1,1)=1 (green); (0,1)=0, (1,0)=0 (red) */}
              {[
                { x: 55, y: 135, label: '(0,0) y=1', pos: true },
                { x: 165, y: 45, label: '(1,1) y=1', pos: true },
                { x: 55, y: 45, label: '(0,1) y=0', pos: false },
                { x: 165, y: 135, label: '(1,0) y=0', pos: false },
              ].map((pt) => (
                <g key={pt.label}>
                  <circle cx={pt.x} cy={pt.y} r={8} fill={pt.pos ? '#10b981' : '#f43f5e'} stroke="#fff" strokeWidth={2} />
                  <text x={pt.x} y={pt.y - 12} textAnchor="middle" className="fill-slate-600 dark:fill-slate-300 text-[9px] font-mono">
                    {pt.label}
                  </text>
                </g>
              ))}
            </svg>

            <p className="text-[11px] leading-relaxed text-slate-600 dark:text-slate-300">
              Logistic 回归在原空间只能画一条直线，对 XOR 问题最低训练误差为 <strong>25%（错 1 个）</strong>；只需引入非线性交叉特征 <code className="font-mono">x₃ = x₁x₂</code>（例如令 w = [1, −2, −2, 4]），即可在三维空间线性可分、训练误差降为 0%！
            </p>
          </div>
        </div>
      )}

      {tab === 'metrics' && (
        <div className="p-5 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          <div className="lg:col-span-6 space-y-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-200">
              <Target className="h-4 w-4 text-rose-500" />
              极端不平衡场景模拟：1,000 名体检样本中仅 50 名真实患病（5% 正例）
            </div>

            <div className="space-y-1 rounded-xl border border-slate-200 p-4 dark:border-slate-800">
              <div className="flex justify-between text-xs">
                <span>分类判定阈值 τ（P(y=1|x) ≥ τ 判为阳性）</span>
                <span className="font-mono font-bold text-blue-600">τ = {threshold.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min={0.1}
                max={0.92}
                step={0.02}
                value={threshold}
                onChange={(e) => setThreshold(parseFloat(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>宽松 (高 Recall · 误报多)</span>
                <span>严苛 (高 Precision · 漏诊多)</span>
              </div>
            </div>

            {/* 2x2 Confusion Matrix */}
            <div className="grid grid-cols-3 gap-1.5 text-center text-xs">
              <div />
              <div className="font-semibold text-slate-500 py-1">预测阳性 (ŷ=1)</div>
              <div className="font-semibold text-slate-500 py-1">预测阴性 (ŷ=0)</div>

              <div className="font-semibold text-slate-500 flex items-center justify-end pr-2">真实阳性 (50)</div>
              <div className="rounded-xl bg-emerald-100 p-3 dark:bg-emerald-950/60">
                <div className="text-[10px] text-emerald-700 dark:text-emerald-300">TP (抓对)</div>
                <div className="font-mono text-lg font-bold text-emerald-800 dark:text-emerald-200">{cm.tp}</div>
              </div>
              <div className="rounded-xl bg-rose-100 p-3 dark:bg-rose-950/60">
                <div className="text-[10px] text-rose-700 dark:text-rose-300">FN (漏诊)</div>
                <div className="font-mono text-lg font-bold text-rose-800 dark:text-rose-200">{cm.fn}</div>
              </div>

              <div className="font-semibold text-slate-500 flex items-center justify-end pr-2">真实阴性 (950)</div>
              <div className="rounded-xl bg-amber-100 p-3 dark:bg-amber-950/60">
                <div className="text-[10px] text-amber-700 dark:text-amber-300">FP (误报)</div>
                <div className="font-mono text-lg font-bold text-amber-800 dark:text-amber-200">{cm.fp}</div>
              </div>
              <div className="rounded-xl bg-blue-100 p-3 dark:bg-blue-950/60">
                <div className="text-[10px] text-blue-700 dark:text-blue-300">TN (排除)</div>
                <div className="font-mono text-lg font-bold text-blue-800 dark:text-blue-200">{cm.tn}</div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-6 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              {[
                { name: 'Accuracy 准确率', val: cm.acc, desc: '(TP+TN)/N · 不平衡时会骗人！', color: 'text-slate-700 dark:text-slate-200' },
                { name: 'Precision 精确率', val: cm.prec, desc: 'TP/(TP+FP) · 报阳中有多少真阳', color: 'text-blue-600 dark:text-blue-400' },
                { name: 'Recall 召回率', val: cm.rec, desc: 'TP/(TP+FN) · 真阳抓出了多少', color: 'text-emerald-600 dark:text-emerald-400' },
                { name: 'F1 Score 调和均值', val: cm.f1, desc: '2PR/(P+R) · 平衡误报与漏诊', color: 'text-violet-600 dark:text-violet-400' },
              ].map((m) => (
                <div key={m.name} className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 dark:border-slate-800 dark:bg-slate-950/60">
                  <div className="text-[11px] font-semibold text-slate-500">{m.name}</div>
                  <div className={`mt-1 font-mono text-2xl font-bold ${m.color}`}>{(m.val * 100).toFixed(1)}%</div>
                  <div className="mt-0.5 text-[10px] text-slate-400">{m.desc}</div>
                </div>
              ))}
            </div>
            <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">
              把阈值 τ 拉到 0.90 试试：即使模型漏掉绝大多数病人（Recall 骤降），<strong>Accuracy 依然高达 95%+</strong>！这就是 L02.1 强调在医疗/欺诈检测等不平衡数据集上绝不能只看 Accuracy、必须看 Precision/Recall/F1 的原因。
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
