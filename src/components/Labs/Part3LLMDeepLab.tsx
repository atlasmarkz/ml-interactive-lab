import React, { useMemo, useState } from 'react';
import { Cpu, Network, RefreshCw, Waves } from 'lucide-react';

const SAMPLE_SENTENCE = [
  'The', 'quick', 'brown', 'fox', 'jumps', 'over', 'the', 'lazy', 'dog', 'in', 'the', 'quiet', 'forest',
];
const RANDOM_VOCAB = ['apple', 'matrix', 'rocket', 'ocean', 'guitar', 'cloud'];

const MOE_TOKENS = [
  { text: 'def', type: 'Code', scores: [0.05, 0.52, 0.04, 0.31, 0.02, 0.02, 0.02, 0.02] },
  { text: '∫f(x)dx', type: 'Math', scores: [0.48, 0.06, 0.04, 0.03, 0.33, 0.02, 0.02, 0.02] },
  { text: '诗歌', type: 'Chinese', scores: [0.03, 0.03, 0.49, 0.04, 0.03, 0.32, 0.03, 0.03] },
  { text: 'quantum', type: 'Science', scores: [0.28, 0.04, 0.03, 0.04, 0.05, 0.04, 0.47, 0.05] },
];
const EXPERT_NAMES = ['E0 数学', 'E1 代码', 'E2 中文', 'E3 逻辑', 'E4 推导', 'E5 文学', 'E6 物理', 'E7 通用'];

export const Part3LLMDeepLab: React.FC = () => {
  const [tab, setTab] = useState<'pe' | 'mlm' | 'moe'>('pe');

  // --- Tab 1: Sinusoidal Positional Encoding ---
  const [posA, setPosA] = useState(4);
  const [posB, setPosB] = useState(10);
  const dModel = 24;
  const maxPos = 32;

  const peMatrix = useMemo(() => {
    const mat: number[][] = [];
    for (let pos = 0; pos < maxPos; pos++) {
      const row: number[] = [];
      for (let i = 0; i < dModel; i++) {
        const angle = pos / Math.pow(10000, (2 * Math.floor(i / 2)) / dModel);
        row.push(i % 2 === 0 ? Math.sin(angle) : Math.cos(angle));
      }
      mat.push(row);
    }
    return mat;
  }, []);

  const peDot = useMemo(() => {
    let dot = 0;
    for (let i = 0; i < dModel; i++) dot += peMatrix[posA][i] * peMatrix[posB][i];
    return dot / (dModel / 2);
  }, [peMatrix, posA, posB]);

  // --- Tab 2: BERT MLM 80/10/10 ---
  const [mlmSeed, setMlmSeed] = useState(1);
  const mlmTokens = useMemo(() => {
    let s = mlmSeed * 48271 + 17;
    const rand = () => {
      s = (s * 48271) % 2147483647;
      return s / 2147483647;
    };
    // Pick 3 positions (~23% for clear visual demonstration of 80/10/10)
    const chosen = new Set<number>();
    while (chosen.size < 3) chosen.add(Math.floor(rand() * SAMPLE_SENTENCE.length));
    const chosenArr = Array.from(chosen);
    return SAMPLE_SENTENCE.map((word, idx) => {
      if (!chosen.has(idx)) return { orig: word, shown: word, action: 'normal' as const };
      // Guarantee all 3 cases appear cleanly across clicks or probabilistically
      const r = rand();
      if (idx === chosenArr[0] || r < 0.72) {
        return { orig: word, shown: '[MASK]', action: 'mask80' as const };
      } else if (r < 0.88) {
        const rw = RANDOM_VOCAB[Math.floor(rand() * RANDOM_VOCAB.length)];
        return { orig: word, shown: rw, action: 'rand10' as const };
      }
      return { orig: word, shown: word, action: 'keep10' as const };
    });
  }, [mlmSeed]);

  // --- Tab 3: MoE Sparse Routing ---
  const [topK, setTopK] = useState<1 | 2>(2);
  const [activeTokIdx, setActiveTokIdx] = useState(0);
  const activeTok = MOE_TOKENS[activeTokIdx];
  const routedExperts = useMemo(() => {
    const indexed = activeTok.scores.map((score, idx) => ({ idx, score }));
    indexed.sort((a, b) => b.score - a.score);
    const chosen = indexed.slice(0, topK);
    const sum = chosen.reduce((a, b) => a + b.score, 0);
    return chosen.map((c) => ({ ...c, normWeight: c.score / sum }));
  }, [activeTok, topK]);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50/80 px-5 py-3.5 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-2">
          <Waves className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            交互实验室 3C · 位置编码频谱、BERT 80/10/10 掩码与 MoE 稀疏路由
          </h3>
        </div>
        <div className="flex flex-wrap rounded-lg border border-slate-200 bg-white p-0.5 text-xs font-medium dark:border-slate-700 dark:bg-slate-800">
          {[
            { id: 'pe', label: 'Sinusoidal 位置编码' },
            { id: 'mlm', label: 'BERT MLM 80/10/10' },
            { id: 'moe', label: 'MoE 稀疏专家路由' },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id as 'pe' | 'mlm' | 'moe')}
              className={`rounded-md px-2.5 py-1 transition cursor-pointer ${
                tab === t.id ? 'bg-indigo-600 text-white' : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {tab === 'pe' && (
        <div className="p-5 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          <div className="lg:col-span-7 overflow-x-auto">
            <div className="mb-2 text-xs text-slate-500">
              行 = 词位置 pos (0..31)，列 = 编码维度 i (0..23，左高频短周期 → 右低频长周期)：
            </div>
            <div className="inline-flex flex-col gap-0.5 rounded-xl border border-slate-200 bg-slate-950 p-2 dark:border-slate-800">
              {peMatrix.map((row, pos) => {
                const isSelected = pos === posA || pos === posB;
                return (
                  <div
                    key={pos}
                    onClick={() => setPosB(pos)}
                    className={`flex gap-0.5 cursor-pointer ${isSelected ? 'ring-1 ring-amber-400' : ''}`}
                  >
                    {row.map((val, col) => {
                      const r = val > 0 ? Math.round(59 + val * 185) : 30;
                      const g = val > 0 ? Math.round(130 - val * 40) : Math.round(110 + Math.abs(val) * 110);
                      const b = val < 0 ? Math.round(130 + Math.abs(val) * 120) : 70;
                      return (
                        <div
                          key={col}
                          style={{ backgroundColor: `rgb(${r},${g},${b})` }}
                          className="h-2.5 w-3.5 rounded-[1px]"
                        />
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="lg:col-span-5 space-y-4 text-xs">
            <div className="rounded-xl border border-slate-200 p-4 space-y-3 dark:border-slate-800">
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span>位置 pos_A</span>
                  <span className="font-mono font-bold text-blue-600">{posA}</span>
                </div>
                <input type="range" min={0} max={maxPos - 1} value={posA} onChange={(e) => setPosA(parseInt(e.target.value, 10))} className="w-full" />
              </div>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span>位置 pos_B</span>
                  <span className="font-mono font-bold text-amber-600">{posB}</span>
                </div>
                <input type="range" min={0} max={maxPos - 1} value={posB} onChange={(e) => setPosB(parseInt(e.target.value, 10))} className="w-full" />
              </div>
            </div>

            <div className="rounded-xl border border-indigo-200 bg-indigo-50/50 p-4 dark:border-indigo-900/50 dark:bg-indigo-950/20 space-y-1.5">
              <div className="flex justify-between font-mono">
                <span>相对距离 |pos_A − pos_B|</span>
                <strong>{Math.abs(posA - posB)}</strong>
              </div>
              <div className="flex justify-between font-mono">
                <span>位置向量余弦相似度</span>
                <strong className="text-indigo-600 dark:text-indigo-400">{peDot.toFixed(3)}</strong>
              </div>
            </div>

            <p className="leading-relaxed text-slate-600 dark:text-slate-300">
              <strong>为什么用正余弦波而不是直接加整数 0,1,2…？</strong> 整数无界且破坏数值尺度；而正余弦位置编码不仅有界 ∈ [-1, 1]，而且任意偏移 k 的位置 PE(pos+k) 都可以写成 PE(pos) 的<strong>线性旋转变换</strong>，使 Self-Attention 天然学会捕捉相对距离！
            </p>
          </div>
        </div>
      )}

      {tab === 'mlm' && (
        <div className="p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="font-semibold text-slate-700 dark:text-slate-200">
              BERT 预训练 Masked Language Model（选中约 15% Token，内部再按 80% / 10% / 10% 替换）：
            </span>
            <button
              onClick={() => setMlmSeed((s) => s + 1)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 font-semibold text-white hover:bg-blue-500 cursor-pointer"
            >
              <RefreshCw className="h-3.5 w-3.5" /> 重新采样 Mask
            </button>
          </div>

          <div className="flex flex-wrap gap-2 rounded-xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-950/60">
            <span className="rounded-lg bg-violet-600 px-2.5 py-1.5 font-mono text-xs font-bold text-white">[CLS]</span>
            {mlmTokens.map((t, i) => (
              <div key={i} className="flex flex-col items-center gap-1">
                <span
                  className={`rounded-lg px-2.5 py-1.5 font-mono text-xs font-semibold border ${
                    t.action === 'mask80'
                      ? 'bg-rose-100 border-rose-400 text-rose-800 dark:bg-rose-950 dark:text-rose-200'
                      : t.action === 'rand10'
                      ? 'bg-amber-100 border-amber-400 text-amber-800 dark:bg-amber-950 dark:text-amber-200'
                      : t.action === 'keep10'
                      ? 'bg-emerald-100 border-emerald-400 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200'
                      : 'bg-white border-slate-200 text-slate-700 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-200'
                  }`}
                >
                  {t.shown}
                </span>
                {t.action !== 'normal' && (
                  <span className="text-[10px] font-mono text-slate-500">
                    真词: {t.orig}
                  </span>
                )}
              </div>
            ))}
            <span className="rounded-lg bg-violet-600 px-2.5 py-1.5 font-mono text-xs font-bold text-white">[SEP]</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div className="rounded-xl border border-rose-200 bg-rose-50/40 p-3 dark:border-rose-900/50 dark:bg-rose-950/20">
              <div className="font-bold text-rose-700 dark:text-rose-300">80% → 替换为 [MASK]</div>
              <p className="mt-1 text-slate-600 dark:text-slate-300">逼迫模型仅凭双向上下文填空预测原词。</p>
            </div>
            <div className="rounded-xl border border-amber-200 bg-amber-50/40 p-3 dark:border-amber-900/50 dark:bg-amber-950/20">
              <div className="font-bold text-amber-700 dark:text-amber-300">10% → 替换为随机错词</div>
              <p className="mt-1 text-slate-600 dark:text-slate-300">防止模型偷懒“直接抄输入词”，迫使其持续结合上下文纠错。</p>
            </div>
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-3 dark:border-emerald-900/50 dark:bg-emerald-950/20">
              <div className="font-bold text-emerald-700 dark:text-emerald-300">10% → 保持原词不变</div>
              <p className="mt-1 text-slate-600 dark:text-slate-300">缓解下游微调时根本没有 [MASK] 标记造成的 Pretrain–Finetune 分布差异！</p>
            </div>
          </div>
        </div>
      )}

      {tab === 'moe' && (
        <div className="p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-slate-500">选择输入 Token：</span>
              {MOE_TOKENS.map((tk, i) => (
                <button
                  key={tk.text}
                  onClick={() => setActiveTokIdx(i)}
                  className={`rounded-lg border px-2.5 py-1 font-mono cursor-pointer ${
                    activeTokIdx === i
                      ? 'border-blue-600 bg-blue-600 text-white font-bold'
                      : 'border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {tk.text} ({tk.type})
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-slate-500">稀疏路由 Top-K：</span>
              {([1, 2] as const).map((k) => (
                <button
                  key={k}
                  onClick={() => setTopK(k)}
                  className={`rounded-md border px-2.5 py-1 font-mono font-bold cursor-pointer ${
                    topK === k ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-slate-200 dark:border-slate-700'
                  }`}
                >
                  Top-{k}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {EXPERT_NAMES.map((ename, idx) => {
              const hit = routedExperts.find((r) => r.idx === idx);
              return (
                <div
                  key={ename}
                  className={`rounded-xl border p-3 transition ${
                    hit
                      ? 'border-emerald-500 bg-emerald-50/70 shadow-sm dark:border-emerald-600 dark:bg-emerald-950/40'
                      : 'border-slate-200 bg-slate-50/50 opacity-50 dark:border-slate-800 dark:bg-slate-950/40'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="inline-flex items-center gap-1">
                      <Cpu className="h-3.5 w-3.5" /> {ename}
                    </span>
                    {hit && (
                      <span className="rounded bg-emerald-600 px-1.5 py-0.5 font-mono text-[10px] text-white">
                        激活 {(hit.normWeight * 100).toFixed(0)}%
                      </span>
                    )}
                  </div>
                  <div className="mt-1.5 h-1.5 w-full rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full ${hit ? 'bg-emerald-500' : 'bg-slate-400'}`}
                      style={{ width: `${Math.round(activeTok.scores[idx] * 100)}%` }}
                    />
                  </div>
                  <div className="mt-1 font-mono text-[10px] text-slate-500">
                    Router Score: {(activeTok.scores[idx] * 100).toFixed(0)}%
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-start gap-2 rounded-xl border border-blue-200/80 bg-blue-50/50 p-3.5 text-xs text-slate-700 dark:border-blue-900/50 dark:bg-blue-950/20 dark:text-slate-300 leading-relaxed">
            <Network className="h-4 w-4 shrink-0 mt-0.5 text-blue-600" />
            <div>
              <strong>Mixture of Experts (L08.2 核心)：</strong>用 8 个专家 FFN 替代单个稠密 FFN，但每个 Token 经 Gating Router 只激活 Top-{topK} 个专家！总知识容量扩大 8 倍，而每次前向计算量仅相当于 <strong>{((topK / 8) * 100).toFixed(0)}% 参数（稀疏激活）</strong>。工程难点在于必须加 <strong>Load Balancing Loss</strong> 防止所有 Token 都涌向少数“热门专家”导致负载坍塌。
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
