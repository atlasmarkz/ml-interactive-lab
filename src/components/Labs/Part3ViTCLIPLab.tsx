import React, { useMemo, useState } from 'react';
import { Image as ImageIcon, Shuffle } from 'lucide-react';

const CLIP_ITEMS = [
  { icon: '🐕', img: '柴犬照片', txt: '"a photo of a shiba dog"' },
  { icon: '🏔️', img: '雪山风景', txt: '"snowy mountain peak"' },
  { icon: '🚀', img: '火箭发射', txt: '"rocket launching to space"' },
  { icon: '☕', img: '拿铁咖啡', txt: '"a cup of latte art"' },
];

// Cosine similarity matrix between normalized image embeddings & text embeddings
const BASE_SIM: number[][] = [
  [0.88, 0.14, 0.08, 0.21],
  [0.12, 0.91, 0.25, 0.06],
  [0.09, 0.22, 0.89, 0.05],
  [0.19, 0.07, 0.04, 0.86],
];

export const Part3ViTCLIPLab: React.FC = () => {
  const [tau, setTau] = useState(0.15);
  const [swapped, setSwapped] = useState(false);
  const [activePatch, setActivePatch] = useState<number>(5);

  const simMatrix = useMemo(() => {
    if (!swapped) return BASE_SIM;
    // Swap text column 0 and 1 to simulate misaligned embeddings
    return BASE_SIM.map((row) => [row[1], row[0], row[2], row[3]]);
  }, [swapped]);

  const { probs, loss } = useMemo(() => {
    const rowProbs = simMatrix.map((row) => {
      const scaled = row.map((v) => v / tau);
      const m = Math.max(...scaled);
      const exps = scaled.map((v) => Math.exp(v - m));
      const s = exps.reduce((a, b) => a + b, 0);
      return exps.map((e) => e / s);
    });
    const colProbs = [0, 1, 2, 3].map((col) => {
      const vals = simMatrix.map((r) => r[col] / tau);
      const m = Math.max(...vals);
      const exps = vals.map((v) => Math.exp(v - m));
      const s = exps.reduce((a, b) => a + b, 0);
      return exps.map((e) => e / s);
    });
    let lImg = 0;
    let lTxt = 0;
    for (let i = 0; i < 4; i++) {
      lImg += -Math.log(Math.max(1e-7, rowProbs[i][i]));
      lTxt += -Math.log(Math.max(1e-7, colProbs[i][i]));
    }
    return { probs: rowProbs, loss: 0.5 * (lImg / 4 + lTxt / 4) };
  }, [simMatrix, tau]);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50/80 px-5 py-3.5 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-2">
          <ImageIcon className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            交互实验室 3B · ViT 图像 Patch 序列化 & CLIP 图文对比学习矩阵
          </h3>
        </div>
        <button
          onClick={() => setSwapped((s) => !s)}
          className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1 text-xs font-medium cursor-pointer transition ${
            swapped
              ? 'border-rose-500 bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
              : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
          }`}
        >
          <Shuffle className="h-3.5 w-3.5" />
          {swapped ? '已错配文本 1↔2（点击恢复）' : '错配图文对测试 Loss 飙升'}
        </button>
      </div>

      <div className="p-5 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: ViT Patchify Visual */}
        <div className="lg:col-span-5 space-y-3">
          <div className="text-xs font-semibold text-slate-700 dark:text-slate-200">
            1. Vision Transformer (ViT)：把 2D 图像切分为 16 个 Patch Token
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-950/60 space-y-3">
            <div className="flex items-center gap-4">
              <div className="grid grid-cols-4 gap-1 shrink-0 p-1.5 rounded-xl bg-gradient-to-br from-sky-200 via-emerald-100 to-amber-200 dark:from-sky-900/60 dark:via-emerald-900/40 dark:to-amber-900/50">
                {Array.from({ length: 16 }, (_, idx) => (
                  <button
                    key={idx}
                    onMouseEnter={() => setActivePatch(idx)}
                    onClick={() => setActivePatch(idx)}
                    className={`h-9 w-9 rounded-md font-mono text-[10px] font-bold transition cursor-pointer ${
                      activePatch === idx
                        ? 'bg-blue-600 text-white ring-2 ring-amber-400 scale-105'
                        : 'bg-white/75 text-slate-700 hover:bg-white dark:bg-slate-900/70 dark:text-slate-200'
                    }`}
                  >
                    P{idx + 1}
                  </button>
                ))}
              </div>
              <div className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                <div>
                  当前选中：<strong>Patch #{activePatch + 1}</strong>
                </div>
                <div className="mt-1 font-mono text-[11px] text-slate-500">
                  坐标: ({Math.floor(activePatch / 4)}, {activePatch % 4}) → Linear(P²·3 → D) + E_pos[{activePatch + 1}]
                </div>
                <p className="mt-1.5 text-[11px] text-slate-500">
                  每个 Patch 经线性投影变成向量后，与可学习 <code className="text-violet-600">[CLS]</code> 拼接，直接送入标准 Transformer Encoder！
                </p>
              </div>
            </div>

            {/* 1D Flattened Token Strip */}
            <div className="flex flex-wrap gap-1 pt-1">
              <span className="rounded bg-violet-600 px-1.5 py-0.5 font-mono text-[10px] font-bold text-white">
                [CLS]
              </span>
              {Array.from({ length: 16 }, (_, idx) => (
                <span
                  key={idx}
                  onMouseEnter={() => setActivePatch(idx)}
                  className={`rounded px-1.5 py-0.5 font-mono text-[10px] cursor-pointer transition ${
                    activePatch === idx
                      ? 'bg-blue-600 text-white font-bold'
                      : 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                  }`}
                >
                  {idx + 1}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Right: CLIP Similarity Matrix */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
              2. CLIP 对称对比学习：Softmax(I · Tᵀ / τ) 概率矩阵
            </span>
            <span className="rounded-lg bg-rose-50 px-2.5 py-1 font-mono text-xs font-bold text-rose-600 dark:bg-rose-950/60 dark:text-rose-300">
              Contrastive Loss = {loss.toFixed(3)}
            </span>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span>可学习温度参数 τ（越小分布越尖锐，越大越平滑）</span>
              <span className="font-mono font-bold text-amber-600">τ = {tau.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min={0.05}
              max={0.8}
              step={0.02}
              value={tau}
              onChange={(e) => setTau(parseFloat(e.target.value))}
              className="w-full"
            />
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200 p-3 dark:border-slate-800">
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr>
                  <th className="p-1.5 text-left text-slate-400 font-normal">Image \ Text</th>
                  {CLIP_ITEMS.map((it, j) => (
                    <th key={j} className="p-1.5 text-center font-medium text-slate-600 dark:text-slate-300">
                      <div className="font-mono text-[10px] truncate max-w-[110px]">{it.txt}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {CLIP_ITEMS.map((it, i) => (
                  <tr key={i}>
                    <td className="p-1.5 font-medium whitespace-nowrap">
                      <span className="mr-1.5 text-base">{it.icon}</span>
                      {it.img}
                    </td>
                    {probs[i].map((p, j) => {
                      const isDiag = i === j;
                      return (
                        <td
                          key={j}
                          style={{
                            backgroundColor: isDiag
                              ? `rgba(16, 185, 129, ${0.12 + p * 0.78})`
                              : `rgba(244, 63, 94, ${p * 0.55})`,
                          }}
                          className={`p-2 text-center font-mono rounded border border-white dark:border-slate-900 ${
                            isDiag ? 'font-bold ring-1 ring-emerald-500/60' : ''
                          }`}
                        >
                          {(p * 100).toFixed(1)}%
                          <div className="text-[9px] opacity-70">cos={simMatrix[i][j].toFixed(2)}</div>
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
  );
};
