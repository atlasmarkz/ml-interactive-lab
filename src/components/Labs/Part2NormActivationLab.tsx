import React, { useMemo, useState } from 'react';
import { Boxes, Flame, Shuffle } from 'lucide-react';

interface ActDef {
  id: string;
  name: string;
  color: string;
  f: (x: number) => number;
  df: (x: number) => number;
  note: string;
}

const sig = (x: number) => 1 / (1 + Math.exp(-x));

const ACTIVATIONS: ActDef[] = [
  {
    id: 'sigmoid',
    name: 'Sigmoid',
    color: '#ef4444',
    f: sig,
    df: (x) => {
      const s = sig(x);
      return s * (1 - s);
    },
    note: '输出 (0,1)，但导数最大值仅 0.25，深层连乘极易梯度消失且非零中心。',
  },
  {
    id: 'tanh',
    name: 'Tanh',
    color: '#f59e0b',
    f: Math.tanh,
    df: (x) => 1 - Math.tanh(x) ** 2,
    note: '零中心输出 (-1,1)，导数最大 1.0，但 |x|>3 依然饱和。',
  },
  {
    id: 'relu',
    name: 'ReLU',
    color: '#3b82f6',
    f: (x) => Math.max(0, x),
    df: (x) => (x > 0 ? 1 : 0),
    note: '正半轴导数恒为 1 彻底缓解梯度消失，但负半轴存在 Dead ReLU。',
  },
  {
    id: 'lrelu',
    name: 'Leaky ReLU',
    color: '#06b6d4',
    f: (x) => (x > 0 ? x : 0.1 * x),
    df: (x) => (x > 0 ? 1 : 0.1),
    note: '负半轴给 0.1 小斜率，修复 Dead ReLU。',
  },
  {
    id: 'gelu',
    name: 'GELU / SwiGLU',
    color: '#8b5cf6',
    f: (x) => x * sig(1.702 * x),
    df: (x) => {
      const s = sig(1.702 * x);
      return s + 1.702 * x * s * (1 - s);
    },
    note: 'Transformer/LLM 现代标配：处处平滑、负半轴微小非单调门控（SwiGLU = Swish(xW) ⊙ (xV)）。',
  },
  {
    id: 'softplus',
    name: 'Softplus',
    color: '#10b981',
    f: (x) => Math.log(1 + Math.exp(Math.min(20, x))),
    df: sig,
    note: 'ReLU 的光滑可微近似，导数恰好是 Sigmoid！',
  },
];

export const Part2NormActivationLab: React.FC = () => {
  const [tab, setTab] = useState<'act' | 'norm' | 'dropout'>('act');

  // --- Activation Lab ---
  const [selectedActs, setSelectedActs] = useState<string[]>(['sigmoid', 'relu', 'gelu']);
  const [probeX, setProbeX] = useState(0.0);

  const makeActPath = (fn: (x: number) => number, yMin: number, yMax: number) => {
    const pts: string[] = [];
    for (let i = 0; i <= 100; i++) {
      const x = -4 + (8 * i) / 100;
      const y = Math.max(yMin, Math.min(yMax, fn(x)));
      const px = 32 + ((x + 4) / 8) * 396;
      const py = 185 - ((y - yMin) / (yMax - yMin)) * 160;
      pts.push(`${i === 0 ? 'M' : 'L'} ${px.toFixed(1)} ${py.toFixed(1)}`);
    }
    return pts.join(' ');
  };

  // --- BatchNorm vs LayerNorm Lab ---
  const [normMode, setNormMode] = useState<'bn' | 'ln'>('bn');
  const [focusIdx, setFocusIdx] = useState(1); // Which channel (BN) or sample (LN) is highlighted

  // Sample 4x4 matrix: Rows = Batch Samples N=4, Cols = Features/Channels C=4
  const tensorVals = useMemo(
    () => [
      [1.2, 8.5, -0.4, 3.1],
      [2.4, 9.2, 0.2, 2.8],
      [0.8, 7.8, -0.9, 3.5],
      [1.6, 8.9, 0.3, 3.0],
    ],
    []
  );

  const normStats = useMemo(() => {
    const slice =
      normMode === 'bn'
        ? tensorVals.map((row) => row[focusIdx])
        : tensorVals[focusIdx];
    const mean = slice.reduce((a, b) => a + b, 0) / slice.length;
    const variance = slice.reduce((a, b) => a + (b - mean) ** 2, 0) / slice.length;
    const std = Math.sqrt(variance + 1e-5);
    const normed = slice.map((v) => (v - mean) / std);
    return { slice, mean, variance, normed };
  }, [normMode, focusIdx, tensorVals]);

  // --- Inverted Dropout Simulator ---
  const [dropP, setDropP] = useState(0.4);
  const [maskSeed, setMaskSeed] = useState(1);
  const baseActs = [1.2, 0.8, 2.1, 0.5, 1.7, 1.0, 0.9, 1.5];

  const dropResult = useMemo(() => {
    let s = maskSeed * 9301 + 49297;
    const rand = () => {
      s = (s * 9301 + 49297) % 233280;
      return s / 233280;
    };
    const keepProb = Math.max(0.1, 1 - dropP);
    const masks = baseActs.map(() => (rand() < keepProb ? 1 : 0));
    const scaled = baseActs.map((v, i) => (masks[i] ? v / keepProb : 0));
    const origSum = baseActs.reduce((a, b) => a + b, 0);
    const dropSum = scaled.reduce((a, b) => a + b, 0);
    return { masks, scaled, origSum, dropSum, scaleFactor: 1 / keepProb };
  }, [dropP, maskSeed]);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50/80 px-5 py-3.5 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-2">
          <Boxes className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            交互实验室 2C · 激活函数导数全景、BatchNorm vs LayerNorm 与 Dropout
          </h3>
        </div>
        <div className="flex flex-wrap rounded-lg border border-slate-200 bg-white p-0.5 text-xs font-medium dark:border-slate-700 dark:bg-slate-800">
          {[
            { id: 'act', label: '激活函数与导数 f′(x)' },
            { id: 'norm', label: 'BatchNorm vs LayerNorm' },
            { id: 'dropout', label: 'Inverted Dropout 集成' },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id as 'act' | 'norm' | 'dropout')}
              className={`rounded-md px-2.5 py-1 transition cursor-pointer ${
                tab === t.id ? 'bg-indigo-600 text-white' : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {tab === 'act' && (
        <div className="p-5 space-y-4">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="text-slate-500">点击开关叠加曲线：</span>
            {ACTIVATIONS.map((a) => {
              const active = selectedActs.includes(a.id);
              return (
                <button
                  key={a.id}
                  onClick={() =>
                    setSelectedActs((prev) =>
                      prev.includes(a.id)
                        ? prev.length > 1
                          ? prev.filter((id) => id !== a.id)
                          : prev
                        : [...prev, a.id]
                    )
                  }
                  className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-medium cursor-pointer transition ${
                    active
                      ? 'border-slate-800 bg-slate-900 text-white dark:border-white dark:bg-white dark:text-slate-900'
                      : 'border-slate-200 text-slate-500 dark:border-slate-700'
                  }`}
                >
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: a.color }} />
                  {a.name}
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 dark:border-slate-800 dark:bg-slate-950/60">
              <div className="mb-1 text-xs font-semibold text-slate-600 dark:text-slate-300">
                前向激活值 f(x)
              </div>
              <svg viewBox="0 0 460 205" className="w-full h-auto">
                <line x1={32} x2={428} y1={185 - ((0 - -1.5) / 5) * 160} y2={185 - ((0 - -1.5) / 5) * 160} className="stroke-slate-300 dark:stroke-slate-700" />
                <line x1={230} x2={230} y1={20} y2={185} className="stroke-slate-300 dark:stroke-slate-700" />
                <line x1={32 + ((probeX + 4) / 8) * 396} x2={32 + ((probeX + 4) / 8) * 396} y1={20} y2={185} stroke="#f59e0b" strokeDasharray="3 3" />
                {ACTIVATIONS.filter((a) => selectedActs.includes(a.id)).map((a) => (
                  <path key={a.id} d={makeActPath(a.f, -1.5, 3.5)} fill="none" stroke={a.color} strokeWidth={2.4} />
                ))}
              </svg>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 dark:border-slate-800 dark:bg-slate-950/60">
              <div className="mb-1 text-xs font-semibold text-rose-600 dark:text-rose-400">
                反向导数 f′(x)（决定梯度是否消失！）
              </div>
              <svg viewBox="0 0 460 205" className="w-full h-auto">
                <line x1={32} x2={428} y1={185 - ((0 - -0.2) / 1.5) * 160} y2={185 - ((0 - -0.2) / 1.5) * 160} className="stroke-slate-300 dark:stroke-slate-700" />
                <line x1={230} x2={230} y1={20} y2={185} className="stroke-slate-300 dark:stroke-slate-700" />
                <line x1={32 + ((probeX + 4) / 8) * 396} x2={32 + ((probeX + 4) / 8) * 396} y1={20} y2={185} stroke="#f59e0b" strokeDasharray="3 3" />
                {ACTIVATIONS.filter((a) => selectedActs.includes(a.id)).map((a) => (
                  <path key={a.id} d={makeActPath(a.df, -0.2, 1.3)} fill="none" stroke={a.color} strokeWidth={2.4} />
                ))}
              </svg>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs">
            <span className="font-medium">探测点 x = <strong className="font-mono text-amber-600">{probeX.toFixed(2)}</strong></span>
            <input type="range" min={-3.8} max={3.8} step={0.1} value={probeX} onChange={(e) => setProbeX(parseFloat(e.target.value))} className="flex-1 min-w-[160px]" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
            {ACTIVATIONS.filter((a) => selectedActs.includes(a.id)).map((a) => (
              <div key={a.id} className="rounded-xl border border-slate-200 p-3 dark:border-slate-800 space-y-1">
                <div className="flex items-center justify-between font-bold">
                  <span style={{ color: a.color }}>{a.name}</span>
                  <span className="font-mono text-[11px]">f={a.f(probeX).toFixed(2)} | f′={a.df(probeX).toFixed(3)}</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">{a.note}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'norm' && (
        <div className="p-5 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          <div className="lg:col-span-6 space-y-3">
            <div className="flex gap-2 text-xs">
              <button
                onClick={() => setNormMode('bn')}
                className={`flex-1 rounded-lg border py-2 font-semibold cursor-pointer ${
                  normMode === 'bn'
                    ? 'border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                    : 'border-slate-200 dark:border-slate-700'
                }`}
              >
                BatchNorm（沿 Batch 维 N 归一化 · CV 标配）
              </button>
              <button
                onClick={() => setNormMode('ln')}
                className={`flex-1 rounded-lg border py-2 font-semibold cursor-pointer ${
                  normMode === 'ln'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                    : 'border-slate-200 dark:border-slate-700'
                }`}
              >
                LayerNorm（沿 Feature 维 C 归一化 · NLP 标配）
              </button>
            </div>

            <div className="rounded-xl border border-slate-200 p-3.5 dark:border-slate-800">
              <div className="mb-2 text-[11px] text-slate-500">
                点击任意单元格切换高亮切片（行 = Batch 样本 N=4，列 = 特征通道 C=4）：
              </div>
              <table className="w-full border-collapse text-center font-mono text-xs">
                <thead>
                  <tr className="text-[10px] text-slate-400">
                    <th className="p-1">Sample \ Feat</th>
                    {[0, 1, 2, 3].map((c) => (
                      <th key={c} className="p-1">C{c + 1}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tensorVals.map((row, r) => (
                    <tr key={r}>
                      <td className="p-1 text-[10px] text-slate-400">N{r + 1}</td>
                      {row.map((val, c) => {
                        const active = normMode === 'bn' ? c === focusIdx : r === focusIdx;
                        return (
                          <td
                            key={c}
                            onClick={() => setFocusIdx(normMode === 'bn' ? c : r)}
                            className={`p-2 rounded border border-white dark:border-slate-900 cursor-pointer transition ${
                              active
                                ? normMode === 'bn'
                                  ? 'bg-blue-500 text-white font-bold shadow-xs'
                                  : 'bg-emerald-500 text-white font-bold shadow-xs'
                                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                            }`}
                          >
                            {val.toFixed(1)}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="lg:col-span-6 space-y-3.5 text-xs">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/60 space-y-2">
              <div className="font-semibold text-slate-800 dark:text-slate-100">
                当前高亮切片实时统计：{normMode === 'bn' ? `第 C${focusIdx + 1} 列（跨 4 个样本）` : `第 N${focusIdx + 1} 行（单个样本的 4 维特征）`}
              </div>
              <div className="font-mono text-[11px] text-slate-600 dark:text-slate-300">
                均值 μ = <strong>{normStats.mean.toFixed(2)}</strong> · 方差 σ² = <strong>{normStats.variance.toFixed(2)}</strong>
              </div>
              <div className="font-mono text-[11px] text-indigo-600 dark:text-indigo-400">
                归一化输出 x̂ = [{normStats.normed.map((v) => v.toFixed(2)).join(', ')}] → 再乘 γ 加 β
              </div>
            </div>

            <div className="rounded-xl border border-emerald-200/80 bg-emerald-50/40 p-4 space-y-2 text-slate-700 dark:border-emerald-900/50 dark:bg-emerald-950/20 dark:text-slate-300 leading-relaxed">
              <div className="font-bold text-emerald-800 dark:text-emerald-300">
                WA3 / 期末必考对比：为什么 NLP (Transformer) 用 LayerNorm 而 CV (CNN) 用 BatchNorm？
              </div>
              <p>
                • <strong>BatchNorm</strong> 依赖同一 Batch 内样本统计均值方差：适合图像固定分辨率+大 Batch；但 NLP 句子长度参差不齐（Padding 干扰统计）且大模型显存受限 Batch Size 极小，BN 方差估计噪声极大；此外 BN 推理时必须改用训练期积累的 <strong>Running Mean / Variance</strong>。
              </p>
              <p>
                • <strong>LayerNorm</strong> 对每个样本/每个 Token 独立跨特征维归一化，<strong>完全不依赖 Batch Size</strong>，训练与推理公式 100% 一致，完美适配变长序列与 Transformer！
              </p>
            </div>
          </div>
        </div>
      )}

      {tab === 'dropout' && (
        <div className="p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3 flex-1 min-w-[220px] text-xs">
              <span>失活概率 p = <strong className="font-mono text-rose-600">{dropP.toFixed(2)}</strong></span>
              <input type="range" min={0} max={0.75} step={0.05} value={dropP} onChange={(e) => setDropP(parseFloat(e.target.value))} className="flex-1 max-w-xs" />
            </div>
            <button
              onClick={() => setMaskSeed((s) => s + 1)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500 cursor-pointer"
            >
              <Shuffle className="h-3.5 w-3.5" /> 重新采样训练子网络 Mask
            </button>
          </div>

          <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
            {baseActs.map((v, i) => {
              const alive = dropResult.masks[i] === 1;
              return (
                <div
                  key={i}
                  className={`rounded-xl border p-2.5 text-center font-mono transition ${
                    alive
                      ? 'border-emerald-300 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/40'
                      : 'border-dashed border-slate-300 bg-slate-100 opacity-45 dark:border-slate-700 dark:bg-slate-900'
                  }`}
                >
                  <div className="text-[10px] text-slate-400">h_{i + 1}</div>
                  <div className="text-xs line-through opacity-50">{v.toFixed(1)}</div>
                  <div className={`text-sm font-bold ${alive ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-500'}`}>
                    {alive ? dropResult.scaled[i].toFixed(2) : '0.00'}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-start gap-2 rounded-xl border border-indigo-200/80 bg-indigo-50/50 p-3.5 text-xs text-slate-700 dark:border-indigo-900/50 dark:bg-indigo-950/20 dark:text-slate-300 leading-relaxed">
            <Flame className="h-4 w-4 shrink-0 mt-0.5 text-indigo-500" />
            <div>
              <strong>Inverted Dropout 关键细节（L05 p8）：</strong>训练时随机以概率 p 丢弃神经元（相当于指数级子网络的隐式 Bagging 集成），同时把存活神经元乘以缩放因子 <code className="font-mono font-bold">1/(1−p) = {dropResult.scaleFactor.toFixed(2)}×</code>（原激活和 {dropResult.origSum.toFixed(2)} vs 缩放后 {dropResult.dropSum.toFixed(2)}），这样<strong>推理测试阶段关闭 Dropout 时无需任何额外乘除缩放</strong>，期望输出保持一致！
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
