import React, { useMemo, useState } from 'react';
import { Eye, ShieldAlert } from 'lucide-react';

interface SentencePreset {
  label: string;
  tokens: string[];
  // Pre-crafted Q/K vectors (dim=4) for Head 0 (Semantic/Coreference) and Head 1 (Local Syntax)
  q0: number[][];
  k0: number[][];
  q1: number[][];
  k1: number[][];
}

const PRESETS: SentencePreset[] = [
  {
    label: '经典代词指代 (Winograd)',
    tokens: ['The', 'animal', 'did', 'not', 'cross', 'because', 'it', 'was', 'tired'],
    q0: [
      [0.2, 0.1, 0.1, 0.1],
      [1.8, 0.2, 0.1, 0.1],
      [0.1, 1.4, 0.2, 0.1],
      [0.1, 1.3, 0.2, 0.1],
      [0.4, 1.6, 0.3, 0.2],
      [0.2, 0.3, 1.1, 0.2],
      [2.1, 0.1, 0.2, 1.5], // "it" queries animal + tired!
      [0.2, 1.1, 0.2, 0.9],
      [1.7, 0.2, 0.1, 1.9], // "tired" queries animal + it
    ],
    k0: [
      [0.3, 0.1, 0.1, 0.1],
      [2.1, 0.2, 0.1, 1.2], // "animal" strong key for coreference
      [0.1, 1.2, 0.2, 0.1],
      [0.1, 1.1, 0.3, 0.1],
      [0.5, 1.4, 0.2, 0.2],
      [0.1, 0.2, 1.2, 0.1],
      [1.4, 0.1, 0.2, 1.1],
      [0.1, 0.9, 0.2, 0.5],
      [1.2, 0.2, 0.1, 1.8],
    ],
    q1: [
      [1.6, 0.0, 0.0, 0.0],
      [1.2, 1.2, 0.0, 0.0],
      [0.0, 1.6, 0.4, 0.0],
      [0.0, 1.3, 1.0, 0.0],
      [0.0, 0.4, 1.6, 0.2],
      [0.0, 0.0, 1.4, 0.8],
      [0.0, 0.0, 0.8, 1.5],
      [0.0, 0.0, 0.3, 1.7],
      [0.0, 0.0, 0.1, 1.9],
    ],
    k1: [
      [1.6, 0.3, 0.0, 0.0],
      [1.4, 1.1, 0.0, 0.0],
      [0.2, 1.6, 0.4, 0.0],
      [0.0, 1.3, 1.0, 0.0],
      [0.0, 0.4, 1.6, 0.3],
      [0.0, 0.0, 1.4, 0.9],
      [0.0, 0.0, 0.8, 1.5],
      [0.0, 0.0, 0.3, 1.7],
      [0.0, 0.0, 0.1, 1.9],
    ],
  },
  {
    label: '中文语义对齐',
    tokens: ['深度', '学习', '利用', '注意力', '捕捉', '长距离', '依赖'],
    q0: [
      [1.6, 0.2, 0.1, 0.1],
      [1.7, 0.3, 0.1, 0.2],
      [0.2, 1.4, 0.4, 0.1],
      [0.3, 0.4, 2.0, 1.3],
      [0.2, 0.9, 1.5, 1.1],
      [0.2, 0.2, 1.8, 1.7],
      [0.4, 0.2, 1.9, 1.8],
    ],
    k0: [
      [1.7, 0.2, 0.1, 0.1],
      [1.8, 0.3, 0.1, 0.1],
      [0.2, 1.2, 0.4, 0.2],
      [0.3, 0.3, 2.1, 1.4],
      [0.2, 0.9, 1.3, 0.9],
      [0.2, 0.1, 1.6, 1.7],
      [0.3, 0.2, 1.8, 1.8],
    ],
    q1: [
      [1.7, 0.2, 0, 0],
      [1.3, 1.3, 0, 0],
      [0.2, 1.6, 0.5, 0],
      [0, 1.0, 1.5, 0.2],
      [0, 0.2, 1.6, 0.8],
      [0, 0, 1.1, 1.6],
      [0, 0, 0.4, 1.9],
    ],
    k1: [
      [1.7, 0.3, 0, 0],
      [1.3, 1.3, 0, 0],
      [0.2, 1.6, 0.5, 0],
      [0, 1.0, 1.5, 0.2],
      [0, 0.2, 1.6, 0.8],
      [0, 0, 1.1, 1.6],
      [0, 0, 0.4, 1.9],
    ],
  },
];

export const Part3TransformerLab: React.FC = () => {
  const [presetIdx, setPresetIdx] = useState(0);
  const [mode, setMode] = useState<'bert' | 'gpt'>('bert');
  const [head, setHead] = useState<0 | 1>(0);
  const [useScale, setUseScale] = useState(true);
  const [dkSim, setDkSim] = useState(16);
  const [selectedQuery, setSelectedQuery] = useState(6);

  const preset = PRESETS[presetIdx];
  const tokens = preset.tokens;
  const safeQuery = Math.min(selectedQuery, tokens.length - 1);

  const attnMatrix = useMemo(() => {
    const Q = head === 0 ? preset.q0 : preset.q1;
    const K = head === 0 ? preset.k0 : preset.k1;
    // Simulate dot-product magnitude growing with sqrt(dkSim / 4)
    const dimAmp = Math.sqrt(dkSim / 4);
    const scale = useScale ? 1 / Math.sqrt(dkSim) : 1 / 2;

    return Q.map((qVec, i) => {
      const logits = K.map((kVec, j) => {
        if (mode === 'gpt' && j > i) return -Infinity;
        let dot = 0;
        for (let d = 0; d < qVec.length; d++) dot += qVec[d] * kVec[d];
        return dot * dimAmp * (useScale ? 1 / Math.sqrt(4) : dimAmp * 0.5) * (scale * 2);
      });
      const finiteMax = Math.max(...logits.filter((v) => Number.isFinite(v)));
      const exps = logits.map((v) => (Number.isFinite(v) ? Math.exp(v - finiteMax) : 0));
      const sum = exps.reduce((a, b) => a + b, 0) || 1;
      return exps.map((e) => e / sum);
    });
  }, [preset, head, mode, useScale, dkSim]);

  const activeRow = attnMatrix[safeQuery];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50/80 px-5 py-3.5 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-2">
          <Eye className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            交互实验室 3A · Self-Attention 热力图、BERT vs GPT 掩码与 √d_k 缩放实验
          </h3>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="flex rounded-lg border border-slate-200 bg-white p-0.5 font-medium dark:border-slate-700 dark:bg-slate-800">
            <button
              onClick={() => setMode('bert')}
              className={`rounded-md px-2.5 py-1 cursor-pointer transition ${
                mode === 'bert' ? 'bg-blue-600 text-white' : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              BERT (双向全可见)
            </button>
            <button
              onClick={() => setMode('gpt')}
              className={`rounded-md px-2.5 py-1 cursor-pointer transition ${
                mode === 'gpt' ? 'bg-emerald-600 text-white' : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              GPT (Causal 因果掩码)
            </button>
          </div>
        </div>
      </div>

      <div className="p-5 space-y-5">
        {/* Controls */}
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 text-xs dark:border-slate-800 dark:bg-slate-950/50">
          <div className="flex flex-wrap items-center gap-2">
            {PRESETS.map((p, idx) => (
              <button
                key={p.label}
                onClick={() => {
                  setPresetIdx(idx);
                  setSelectedQuery(idx === 0 ? 6 : 3);
                }}
                className={`rounded-lg border px-2.5 py-1 cursor-pointer ${
                  presetIdx === idx
                    ? 'border-blue-600 bg-blue-50 text-blue-700 font-semibold dark:bg-blue-950/60 dark:text-blue-300'
                    : 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800'
                }`}
              >
                {p.label}
              </button>
            ))}

            <span className="mx-1 text-slate-300 dark:text-slate-700">|</span>

            <button
              onClick={() => setHead(0)}
              className={`rounded-lg border px-2.5 py-1 cursor-pointer ${
                head === 0
                  ? 'border-violet-600 bg-violet-50 text-violet-700 font-semibold dark:bg-violet-950/60 dark:text-violet-300'
                  : 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800'
              }`}
            >
              Head 1 · 语义指代
            </button>
            <button
              onClick={() => setHead(1)}
              className={`rounded-lg border px-2.5 py-1 cursor-pointer ${
                head === 1
                  ? 'border-violet-600 bg-violet-50 text-violet-700 font-semibold dark:bg-violet-950/60 dark:text-violet-300'
                  : 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800'
              }`}
            >
              Head 2 · 局部相邻语法
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={useScale}
                onChange={(e) => setUseScale(e.target.checked)}
                className="rounded"
              />
              <span className="font-medium">启用 ÷ √d_k 缩放</span>
            </label>
            <div className="flex items-center gap-2">
              <span className="text-slate-500">模拟 d_k = {dkSim}</span>
              <input
                type="range"
                min={4}
                max={64}
                step={4}
                value={dkSim}
                onChange={(e) => setDkSim(parseInt(e.target.value, 10))}
                className="w-24"
              />
            </div>
          </div>
        </div>

        {!useScale && dkSim >= 24 && (
          <div className="flex items-center gap-2 rounded-xl border border-amber-300 bg-amber-50/80 px-3.5 py-2 text-xs text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
            <ShieldAlert className="h-4 w-4 shrink-0 text-amber-600" />
            <span>
              <strong>观察 Softmax 饱和效应：</strong>关闭 ÷ √d_k 且 d_k={dkSim} 较大时，点积方差放大，Softmax 权重迅速塌缩成近似 one-hot（梯度趋近于 0）！
            </span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Left: Interactive Token Attention Arcs */}
          <div className="lg:col-span-5 space-y-3">
            <div className="text-xs font-semibold text-slate-600 dark:text-slate-300">
              点击任意 Query Token，查看它向所有 Key Token 分配的注意力权重：
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 dark:border-slate-800 dark:bg-slate-950/60">
              <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 mb-2">
                <span>Query (当前词)</span>
                <span>Attention Weight → Key (被关注词)</span>
              </div>

              <div className="space-y-1.5">
                {tokens.map((tok, idx) => {
                  const weight = activeRow[idx];
                  const masked = mode === 'gpt' && idx > safeQuery;
                  const isQuery = idx === safeQuery;
                  return (
                    <div
                      key={`${tok}-${idx}`}
                      onClick={() => setSelectedQuery(idx)}
                      className={`flex items-center gap-3 rounded-lg px-2.5 py-1.5 transition cursor-pointer ${
                        isQuery
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'hover:bg-slate-200/70 dark:hover:bg-slate-800/80'
                      }`}
                    >
                      <span className="w-16 shrink-0 font-mono text-xs font-semibold truncate">
                        {tok}
                      </span>
                      <div className="flex-1 h-2.5 rounded-full bg-slate-200/80 dark:bg-slate-800 overflow-hidden">
                        {!masked && (
                          <div
                            className={`h-full rounded-full transition-all duration-200 ${
                              isQuery ? 'bg-amber-300' : 'bg-blue-500'
                            }`}
                            style={{ width: `${Math.max(2, weight * 100)}%` }}
                          />
                        )}
                      </div>
                      <span
                        className={`w-12 text-right font-mono text-[11px] ${
                          isQuery
                            ? 'text-white'
                            : masked
                            ? 'text-slate-400 italic'
                            : 'text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        {masked ? 'MASK' : `${(weight * 100).toFixed(0)}%`}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right: Full Attention Matrix Heatmap */}
          <div className="lg:col-span-7 overflow-x-auto">
            <div className="mb-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
              完整 Attention Weight 矩阵（行 = Query，列 = Key，行和 = 1.00）
            </div>
            <div className="inline-block rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-950/70">
              <table className="border-collapse text-[11px] font-mono">
                <thead>
                  <tr>
                    <th className="p-1 text-slate-400">Q \ K</th>
                    {tokens.map((t, j) => (
                      <th key={j} className="p-1 font-medium text-slate-500 dark:text-slate-400">
                        {t}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tokens.map((rowTok, i) => (
                    <tr
                      key={i}
                      onMouseEnter={() => setSelectedQuery(i)}
                      onClick={() => setSelectedQuery(i)}
                      className={`cursor-pointer ${
                        i === safeQuery ? 'ring-2 ring-blue-500 rounded' : ''
                      }`}
                    >
                      <td
                        className={`pr-2 py-1 text-right font-semibold ${
                          i === safeQuery
                            ? 'text-blue-600 dark:text-blue-400'
                            : 'text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        {rowTok}
                      </td>
                      {attnMatrix[i].map((w, j) => {
                        const masked = mode === 'gpt' && j > i;
                        return (
                          <td
                            key={j}
                            style={{
                              backgroundColor: masked
                                ? undefined
                                : `rgba(59, 130, 246, ${0.06 + w * 0.88})`,
                            }}
                            className={`h-8 w-10 text-center border border-slate-100 dark:border-slate-800/80 transition ${
                              masked
                                ? 'bg-slate-100 text-slate-300 dark:bg-slate-900 dark:text-slate-700'
                                : w > 0.45
                                ? 'text-white font-bold'
                                : 'text-slate-700 dark:text-slate-200'
                            }`}
                          >
                            {masked ? '×' : w.toFixed(2)}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
