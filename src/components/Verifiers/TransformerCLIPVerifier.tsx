import React, { useMemo, useState } from 'react';

function matMul(A: number[][], B: number[][]): number[][] {
  const m = A.length;
  const k = A[0].length;
  const n = B[0].length;
  return Array.from({ length: m }, (_, i) =>
    Array.from({ length: n }, (_, j) => {
      let s = 0;
      for (let t = 0; t < k; t++) s += A[i][t] * B[t][j];
      return s;
    })
  );
}

function transpose(A: number[][]): number[][] {
  return A[0].map((_, j) => A.map((row) => row[j]));
}

function softmaxRows(M: number[][], causal: boolean): number[][] {
  return M.map((row, i) => {
    const masked = row.map((v, j) => (causal && j > i ? -Infinity : v));
    const mx = Math.max(...masked.filter(Number.isFinite));
    const exps = masked.map((v) => (Number.isFinite(v) ? Math.exp(v - mx) : 0));
    const sum = exps.reduce((a, b) => a + b, 0) || 1;
    return exps.map((e) => e / sum);
  });
}

const SmallMatrixBox: React.FC<{ title: string; mat: number[][]; decimals?: number }> = ({
  title,
  mat,
  decimals = 3,
}) => (
  <div className="rounded-md border border-stone-200 bg-stone-50/60 p-3 dark:border-zinc-800 dark:bg-zinc-950/60">
    <div className="mb-1.5 font-mono text-[11px] font-semibold text-stone-600 dark:text-zinc-400">
      {title}
    </div>
    <div className="overflow-x-auto">
      <table className="w-full border-collapse font-mono text-[11px]">
        <tbody>
          {mat.map((row, r) => (
            <tr key={r} className="border-b border-stone-100 last:border-0 dark:border-zinc-900">
              {row.map((v, c) => (
                <td key={c} className="px-1.5 py-0.5 text-right text-stone-800 dark:text-zinc-200">
                  {v.toFixed(decimals)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

interface TransformerCLIPVerifierProps {
  mode: 'l08-self-attention' | 'l09-vit-clip';
}

export const TransformerCLIPVerifier: React.FC<TransformerCLIPVerifierProps> = ({ mode }) => {
  // --- L08: Editable Self-Attention Matrix Verifier (4 tokens x dim 2) ---
  const [X, setX] = useState<number[][]>([
    [1.0, 0.0],
    [0.0, 1.0],
    [0.8, 0.2],
    [0.5, 0.5],
  ]);
  const [Wq, setWq] = useState<number[][]>([
    [1, 0],
    [0, 1],
  ]);
  const [Wk, setWk] = useState<number[][]>([
    [1, 0],
    [0, 1],
  ]);
  const [Wv] = useState<number[][]>([
    [1, 0],
    [0, 1],
  ]);
  const [useScale, setUseScale] = useState(true);
  const [causal, setCausal] = useState(false);

  const attnRes = useMemo(() => {
    const Q = matMul(X, Wq);
    const K = matMul(X, Wk);
    const V = matMul(X, Wv);
    const dk = Q[0].length;
    const rawScores = matMul(Q, transpose(K));
    const scaledScores = rawScores.map((r) => r.map((v) => (useScale ? v / Math.sqrt(dk) : v)));
    const A = softmaxRows(scaledScores, causal);
    const Z = matMul(A, V);
    return { Q, K, V, scaledScores, A, Z };
  }, [X, Wq, Wk, Wv, useScale, causal]);

  // --- L09: Editable CLIP Embeddings & Contrastive Loss + ViT Token Calculator ---
  const [Iemb, setIemb] = useState<number[][]>([
    [0.9, 0.2],
    [0.1, 0.95],
    [-0.8, 0.3],
  ]);
  const [Temb, setTemb] = useState<number[][]>([
    [0.85, 0.3],
    [0.2, 0.9],
    [-0.75, 0.4],
  ]);
  const [tau, setTau] = useState(0.2);
  const [imgSize, setImgSize] = useState(224);
  const [patchSize, setPatchSize] = useState(16);

  const clipRes = useMemo(() => {
    const normRows = (M: number[][]) =>
      M.map((r) => {
        const n = Math.hypot(...r) || 1;
        return r.map((v) => v / n);
      });
    const In = normRows(Iemb);
    const Tn = normRows(Temb);
    const cosMat = matMul(In, transpose(Tn));
    const logits = cosMat.map((r) => r.map((v) => v / tau));
    const pImg = softmaxRows(logits, false);
    const pTxt = softmaxRows(transpose(logits), false);
    const B = Iemb.length;
    let lImg = 0;
    let lTxt = 0;
    for (let i = 0; i < B; i++) {
      lImg += -Math.log(Math.max(1e-12, pImg[i][i]));
      lTxt += -Math.log(Math.max(1e-12, pTxt[i][i]));
    }
    lImg /= B;
    lTxt /= B;
    const numPatches = Math.floor(imgSize / patchSize) ** 2;
    const seqLen = numPatches + 1; // + [CLS]
    return { cosMat, pImg, lImg, lTxt, totalLoss: 0.5 * (lImg + lTxt), numPatches, seqLen };
  }, [Iemb, Temb, tau, imgSize, patchSize]);

  if (mode === 'l08-self-attention') {
    return (
      <div className="rounded-lg border border-stone-200 bg-white overflow-hidden dark:border-zinc-800 dark:bg-[#11151d]">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-200 bg-stone-50/70 px-5 py-3 dark:border-zinc-800 dark:bg-zinc-900/60">
          <div>
            <div className="font-mono text-[11px] font-medium uppercase tracking-wider text-blue-700 dark:text-blue-400">
              Exact Matrix Verifier · L08
            </div>
            <h3 className="text-sm font-semibold text-stone-900 dark:text-zinc-100">
              Self-Attention 全步骤精确矩阵演算器（对照 WA3 Q5：对比 W_Q=I vs 置换阵）
            </h3>
          </div>
          <div className="flex flex-wrap gap-1.5 text-xs font-mono">
            <button
              onClick={() => setWq([[1, 0], [0, 1]])}
              className="rounded border border-stone-300 bg-white px-2 py-0.5 hover:bg-stone-100 dark:border-zinc-700 dark:bg-zinc-900 cursor-pointer"
            >
              W_Q = I
            </button>
            <button
              onClick={() => setWq([[0, 1], [1, 0]])}
              className="rounded border border-stone-300 bg-white px-2 py-0.5 hover:bg-stone-100 dark:border-zinc-700 dark:bg-zinc-900 cursor-pointer"
            >
              W_Q = Swap [[0,1],[1,0]]
            </button>
          </div>
        </div>

        <div className="p-5 space-y-5 text-xs">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            <div className="lg:col-span-5 space-y-2">
              <div className="font-semibold text-stone-700 dark:text-zinc-300">
                可编辑 Token 嵌入矩阵 X (T=4 × d=2)
              </div>
              <div className="grid grid-cols-2 gap-1.5 font-mono">
                {X.map((row, r) =>
                  row.map((val, c) => (
                    <input
                      key={`${r}-${c}`}
                      type="number"
                      step="0.1"
                      value={val}
                      onChange={(e) => {
                        const n = parseFloat(e.target.value);
                        if (Number.isNaN(n)) return;
                        setX((prev) => prev.map((pr, ri) => pr.map((pv, ci) => (ri === r && ci === c ? n : pv))));
                      }}
                      className="rounded border border-stone-300 bg-white px-2 py-1 text-center dark:border-zinc-700 dark:bg-zinc-950"
                    />
                  ))
                )}
              </div>
            </div>

            <div className="lg:col-span-4 space-y-2">
              <div className="font-semibold text-stone-700 dark:text-zinc-300">
                查询投影矩阵 W_Q (2×2) 与 W_K (2×2)
              </div>
              <div className="grid grid-cols-2 gap-3 font-mono">
                <div>
                  <div className="text-[10px] text-stone-400 mb-1">W_Q</div>
                  <div className="grid grid-cols-2 gap-1">
                    {Wq.map((row, r) =>
                      row.map((val, c) => (
                        <input
                          key={`q-${r}-${c}`}
                          type="number"
                          step="0.5"
                          value={val}
                          onChange={(e) => {
                            const n = parseFloat(e.target.value);
                            if (Number.isNaN(n)) return;
                            setWq((prev) => prev.map((pr, ri) => pr.map((pv, ci) => (ri === r && ci === c ? n : pv))));
                          }}
                          className="rounded border border-stone-300 bg-white px-1.5 py-1 text-center dark:border-zinc-700 dark:bg-zinc-950"
                        />
                      ))
                    )}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-stone-400 mb-1">W_K</div>
                  <div className="grid grid-cols-2 gap-1">
                    {Wk.map((row, r) =>
                      row.map((val, c) => (
                        <input
                          key={`k-${r}-${c}`}
                          type="number"
                          step="0.5"
                          value={val}
                          onChange={(e) => {
                            const n = parseFloat(e.target.value);
                            if (Number.isNaN(n)) return;
                            setWk((prev) => prev.map((pr, ri) => pr.map((pv, ci) => (ri === r && ci === c ? n : pv))));
                          }}
                          className="rounded border border-stone-300 bg-white px-1.5 py-1 text-center dark:border-zinc-700 dark:bg-zinc-950"
                        />
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-3 space-y-2.5 rounded-md border border-stone-200 bg-stone-50/60 p-3 dark:border-zinc-800 dark:bg-zinc-950/60">
              <div className="font-semibold text-stone-700 dark:text-zinc-300">计算选项</div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={useScale} onChange={(e) => setUseScale(e.target.checked)} />
                <span>除以 √d_k (√2 ≈ 1.414)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={causal} onChange={(e) => setCausal(e.target.checked)} />
                <span>启用 GPT Causal Mask</span>
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <SmallMatrixBox title={`Step 1 · ${useScale ? 'QKᵀ / √d_k' : 'QKᵀ'} (4×4)`} mat={attnRes.scaledScores} />
            <SmallMatrixBox title="Step 2 · Softmax 注意力权重 A (4×4)" mat={attnRes.A} />
            <SmallMatrixBox title="Step 3 · 上下文输出 Z = A·V (4×2)" mat={attnRes.Z} />
          </div>
        </div>
      </div>
    );
  }

  // --- Mode: L09 ViT & CLIP Verifier ---
  return (
    <div className="rounded-lg border border-stone-200 bg-white overflow-hidden dark:border-zinc-800 dark:bg-[#11151d]">
      <div className="border-b border-stone-200 bg-stone-50/70 px-5 py-3 dark:border-zinc-800 dark:bg-zinc-900/60">
        <div className="font-mono text-[11px] font-medium uppercase tracking-wider text-blue-700 dark:text-blue-400">
          Multimodal Matrix Verifier · L09
        </div>
        <h3 className="text-sm font-semibold text-stone-900 dark:text-zinc-100">
          CLIP 对称 InfoNCE 对比损失精确验算器 & ViT 序列二次复杂度计算
        </h3>
      </div>

      <div className="p-5 space-y-5 text-xs">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-5 space-y-3">
            <div className="grid grid-cols-2 gap-3 font-mono">
              <div>
                <div className="mb-1 text-[10px] font-semibold text-stone-500">图像特征 I (3×2)</div>
                <div className="grid grid-cols-2 gap-1">
                  {Iemb.map((row, r) =>
                    row.map((v, c) => (
                      <input
                        key={`i-${r}-${c}`}
                        type="number"
                        step="0.1"
                        value={v}
                        onChange={(e) => {
                          const n = parseFloat(e.target.value);
                          if (Number.isNaN(n)) return;
                          setIemb((p) => p.map((pr, ri) => pr.map((pv, ci) => (ri === r && ci === c ? n : pv))));
                        }}
                        className="rounded border border-stone-300 px-1.5 py-1 text-center dark:border-zinc-700 dark:bg-zinc-950"
                      />
                    ))
                  )}
                </div>
              </div>
              <div>
                <div className="mb-1 text-[10px] font-semibold text-stone-500">文本特征 T (3×2)</div>
                <div className="grid grid-cols-2 gap-1">
                  {Temb.map((row, r) =>
                    row.map((v, c) => (
                      <input
                        key={`t-${r}-${c}`}
                        type="number"
                        step="0.1"
                        value={v}
                        onChange={(e) => {
                          const n = parseFloat(e.target.value);
                          if (Number.isNaN(n)) return;
                          setTemb((p) => p.map((pr, ri) => pr.map((pv, ci) => (ri === r && ci === c ? n : pv))));
                        }}
                        className="rounded border border-stone-300 px-1.5 py-1 text-center dark:border-zinc-700 dark:bg-zinc-950"
                      />
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between font-mono">
                <span>温度 τ (Logit Scale = {(1 / tau).toFixed(1)}×)</span>
                <span className="font-semibold text-blue-700 dark:text-blue-400">τ = {tau.toFixed(2)}</span>
              </div>
              <input type="range" min={0.05} max={1.0} step={0.05} value={tau} onChange={(e) => setTau(parseFloat(e.target.value))} className="w-full" />
            </div>
          </div>

          <div className="lg:col-span-7 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <SmallMatrixBox title="余弦相似度 Î·T̂ᵀ (3×3)" mat={clipRes.cosMat} />
              <SmallMatrixBox title="Image→Text 概率 Softmax(S)" mat={clipRes.pImg} />
            </div>
            <div className="grid grid-cols-3 gap-2 font-mono text-[11px]">
              <div className="rounded border border-stone-200 p-2.5 dark:border-zinc-800">
                <div className="text-stone-400">L_img (按行 CE)</div>
                <div className="font-semibold">{clipRes.lImg.toFixed(4)}</div>
              </div>
              <div className="rounded border border-stone-200 p-2.5 dark:border-zinc-800">
                <div className="text-stone-400">L_txt (按列 CE)</div>
                <div className="font-semibold">{clipRes.lTxt.toFixed(4)}</div>
              </div>
              <div className="rounded border border-stone-200 bg-blue-50/50 p-2.5 dark:border-zinc-800 dark:bg-blue-950/25">
                <div className="text-stone-400">L_CLIP = ½(L_i+L_t)</div>
                <div className="font-semibold text-blue-700 dark:text-blue-400">{clipRes.totalLoss.toFixed(4)}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-stone-200 pt-4 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-4 font-mono text-[11px]">
          <div className="flex items-center gap-3">
            <span className="font-sans font-semibold text-stone-700 dark:text-zinc-300">ViT Token 序列长度计算：</span>
            <label>
              Img H=W:
              <select value={imgSize} onChange={(e) => setImgSize(Number(e.target.value))} className="ml-1 rounded border border-stone-300 px-1.5 py-0.5 dark:border-zinc-700 dark:bg-zinc-950">
                <option value={224}>224</option>
                <option value={384}>384</option>
                <option value={512}>512</option>
              </select>
            </label>
            <label>
              Patch P:
              <select value={patchSize} onChange={(e) => setPatchSize(Number(e.target.value))} className="ml-1 rounded border border-stone-300 px-1.5 py-0.5 dark:border-zinc-700 dark:bg-zinc-950">
                <option value={14}>14</option>
                <option value={16}>16</option>
                <option value={32}>32</option>
              </select>
            </label>
          </div>
          <div>
            Patch 数 = <strong>{clipRes.numPatches}</strong> · 含 [CLS] 长度 N = <strong>{clipRes.seqLen}</strong> · Attention 矩阵大小 N² = <strong>{(clipRes.seqLen ** 2).toLocaleString()}</strong>
          </div>
        </div>
      </div>
    </div>
  );
};
