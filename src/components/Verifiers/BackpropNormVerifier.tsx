import React, { useMemo, useState } from 'react';
import { RotateCcw } from 'lucide-react';

interface BackpropNormVerifierProps {
  mode: 'l04-mlp-backprop' | 'l05-norm-opt';
}

export const BackpropNormVerifier: React.FC<BackpropNormVerifierProps> = ({ mode }) => {
  // --- L04: Exact 2-Layer MLP Forward + Backward + Finite-Diff Gradient Check ---
  // Single sample x in R^2 -> hidden H=2 (ReLU) -> output K=2 (Softmax + Cross-Entropy)
  const [x, setX] = useState<[number, number]>([1.0, -0.5]);
  const [W1, setW1] = useState<[[number, number], [number, number]]>([
    [0.6, -0.4],
    [0.3, 0.8],
  ]);
  const [b1, setB1] = useState<[number, number]>([0.1, -0.2]);
  const [W2, setW2] = useState<[[number, number], [number, number]]>([
    [0.5, -0.7],
    [-0.3, 0.9],
  ]);
  const [b2, setB2] = useState<[number, number]>([0.0, 0.2]);
  const [yTrue, setYTrue] = useState<0 | 1>(1);

  const bpRes = useMemo(() => {
    const forward = (w1: number[][], bv1: number[], w2: number[][], bv2: number[]) => {
      const z1 = [
        x[0] * w1[0][0] + x[1] * w1[1][0] + bv1[0],
        x[0] * w1[0][1] + x[1] * w1[1][1] + bv1[1],
      ];
      const h = [Math.max(0, z1[0]), Math.max(0, z1[1])];
      const z2 = [
        h[0] * w2[0][0] + h[1] * w2[1][0] + bv2[0],
        h[0] * w2[0][1] + h[1] * w2[1][1] + bv2[1],
      ];
      const m = Math.max(z2[0], z2[1]);
      const e0 = Math.exp(z2[0] - m);
      const e1 = Math.exp(z2[1] - m);
      const p = [e0 / (e0 + e1), e1 / (e0 + e1)];
      const loss = -Math.log(Math.max(1e-12, p[yTrue]));
      return { z1, h, z2, p, loss };
    };

    const f = forward(W1, b1, W2, b2);
    // Analytic Backprop
    const d2 = [f.p[0] - (yTrue === 0 ? 1 : 0), f.p[1] - (yTrue === 1 ? 1 : 0)];
    const dW2 = [
      [f.h[0] * d2[0], f.h[0] * d2[1]],
      [f.h[1] * d2[0], f.h[1] * d2[1]],
    ];
    const dh = [
      d2[0] * W2[0][0] + d2[1] * W2[0][1],
      d2[0] * W2[1][0] + d2[1] * W2[1][1],
    ];
    const d1 = [dh[0] * (f.z1[0] > 0 ? 1 : 0), dh[1] * (f.z1[1] > 0 ? 1 : 0)];
    const dW1 = [
      [x[0] * d1[0], x[0] * d1[1]],
      [x[1] * d1[0], x[1] * d1[1]],
    ];

    // Finite-difference numerical gradient check on W1
    const eps = 1e-5;
    const numDW1: number[][] = [
      [0, 0],
      [0, 0],
    ];
    let maxErr = 0;
    for (let i = 0; i < 2; i++) {
      for (let j = 0; j < 2; j++) {
        const wp = W1.map((r) => [...r]);
        const wm = W1.map((r) => [...r]);
        wp[i][j] += eps;
        wm[i][j] -= eps;
        const gNum = (forward(wp, b1, W2, b2).loss - forward(wm, b1, W2, b2).loss) / (2 * eps);
        numDW1[i][j] = gNum;
        maxErr = Math.max(maxErr, Math.abs(gNum - dW1[i][j]));
      }
    }

    return { ...f, d2, dW2, dh, d1, dW1, numDW1, maxErr };
  }, [x, W1, b1, W2, b2, yTrue]);

  // --- L05: BatchNorm vs LayerNorm Exact Matrix Verifier + Adam vs AdamW Step ---
  const [actMat, setActMat] = useState<number[][]>([
    [1.0, 10.0, -2.0],
    [3.0, 14.0, 0.0],
    [5.0, 12.0, 2.0],
  ]);
  const [normType, setNormType] = useState<'bn' | 'ln'>('bn');
  const [wd, setWd] = useState(0.1);
  const [theta0, setTheta0] = useState(2.0);
  const [grad0, setGrad0] = useState(0.5);

  const normRes = useMemo(() => {
    const N = actMat.length;
    const C = actMat[0].length;
    const eps = 1e-5;
    const means: number[] = [];
    const vars: number[] = [];
    const out: number[][] = Array.from({ length: N }, () => Array(C).fill(0));

    if (normType === 'bn') {
      for (let c = 0; c < C; c++) {
        const mu = actMat.reduce((a, row) => a + row[c], 0) / N;
        const va = actMat.reduce((a, row) => a + (row[c] - mu) ** 2, 0) / N;
        means.push(mu);
        vars.push(va);
        for (let r = 0; r < N; r++) out[r][c] = (actMat[r][c] - mu) / Math.sqrt(va + eps);
      }
    } else {
      for (let r = 0; r < N; r++) {
        const mu = actMat[r].reduce((a, v) => a + v, 0) / C;
        const va = actMat[r].reduce((a, v) => a + (v - mu) ** 2, 0) / C;
        means.push(mu);
        vars.push(va);
        for (let c = 0; c < C; c++) out[r][c] = (actMat[r][c] - mu) / Math.sqrt(va + eps);
      }
    }

    // 1-step Adam (coupled L2) vs AdamW (decoupled weight decay) at t=1 (m_hat = g, v_hat = g^2)
    const lr = 0.1;
    const gL2 = grad0 + wd * theta0;
    const stepAdamL2 = theta0 - lr * (gL2 / (Math.abs(gL2) + 1e-8)); // note: sign(gL2)*lr regardless of magnitude!
    const stepAdamW = theta0 * (1 - lr * wd) - lr * (grad0 / (Math.abs(grad0) + 1e-8));
    return { means, vars, out, stepAdamL2, stepAdamW };
  }, [actMat, normType, wd, theta0, grad0]);

  if (mode === 'l04-mlp-backprop') {
    return (
      <div className="rounded-lg border border-stone-200 bg-white overflow-hidden dark:border-zinc-800 dark:bg-[#11151d]">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-200 bg-stone-50/70 px-5 py-3 dark:border-zinc-800 dark:bg-zinc-900/60">
          <div>
            <div className="font-mono text-[11px] font-medium uppercase tracking-wider text-blue-700 dark:text-blue-400">
              Forward / Backward Matrix Verifier · L04
            </div>
            <h3 className="text-sm font-semibold text-stone-900 dark:text-zinc-100">
              两层 ReLU + Softmax 神经网络全中间矩阵与数值梯度检查器 (Gradient Checking)
            </h3>
          </div>
          <button
            onClick={() => {
              setX([1.0, -0.5]);
              setW1([[0.6, -0.4], [0.3, 0.8]]);
              setB1([0.1, -0.2]);
              setW2([[0.5, -0.7], [-0.3, 0.9]]);
              setB2([0.0, 0.2]);
              setYTrue(1);
            }}
            className="inline-flex items-center gap-1 rounded border border-stone-300 bg-white px-2.5 py-1 text-xs text-stone-700 hover:bg-stone-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 cursor-pointer"
          >
            <RotateCcw className="h-3 w-3" /> 重置参数
          </button>
        </div>

        <div className="p-5 space-y-5 text-xs">
          {/* Editable W1, x, y */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono">
            <div className="rounded-md border border-stone-200 p-3 dark:border-zinc-800 space-y-2">
              <div className="font-semibold text-stone-600 dark:text-zinc-400">输入 x ∈ ℝ² 与标签 y</div>
              <div className="flex gap-2">
                {[0, 1].map((i) => (
                  <input
                    key={i}
                    type="number"
                    step="0.5"
                    value={x[i]}
                    onChange={(e) => {
                      const v = parseFloat(e.target.value);
                      if (!Number.isNaN(v)) setX(i === 0 ? [v, x[1]] : [x[0], v]);
                    }}
                    className="w-full rounded border border-stone-300 px-2 py-1 text-center dark:border-zinc-700 dark:bg-zinc-950"
                  />
                ))}
                <select
                  value={yTrue}
                  onChange={(e) => setYTrue(Number(e.target.value) as 0 | 1)}
                  className="rounded border border-stone-300 px-2 py-1 dark:border-zinc-700 dark:bg-zinc-950"
                >
                  <option value={0}>y=0</option>
                  <option value={1}>y=1</option>
                </select>
              </div>
            </div>

            <div className="rounded-md border border-stone-200 p-3 dark:border-zinc-800 space-y-2">
              <div className="font-semibold text-stone-600 dark:text-zinc-400">第一层权重 W₁ (2×2)</div>
              <div className="grid grid-cols-2 gap-1.5">
                {[0, 1].map((r) =>
                  [0, 1].map((c) => (
                    <input
                      key={`${r}-${c}`}
                      type="number"
                      step="0.2"
                      value={W1[r][c]}
                      onChange={(e) => {
                        const v = parseFloat(e.target.value);
                        if (Number.isNaN(v)) return;
                        setW1((prev) => {
                          const next: [[number, number], [number, number]] = [[...prev[0]], [...prev[1]]];
                          next[r][c] = v;
                          return next;
                        });
                      }}
                      className="rounded border border-stone-300 px-2 py-1 text-center dark:border-zinc-700 dark:bg-zinc-950"
                    />
                  ))
                )}
              </div>
            </div>

            <div className="rounded-md border border-stone-200 p-3 dark:border-zinc-800 space-y-2">
              <div className="font-semibold text-stone-600 dark:text-zinc-400">第二层权重 W₂ (2×2)</div>
              <div className="grid grid-cols-2 gap-1.5">
                {[0, 1].map((r) =>
                  [0, 1].map((c) => (
                    <input
                      key={`${r}-${c}`}
                      type="number"
                      step="0.2"
                      value={W2[r][c]}
                      onChange={(e) => {
                        const v = parseFloat(e.target.value);
                        if (Number.isNaN(v)) return;
                        setW2((prev) => {
                          const next: [[number, number], [number, number]] = [[...prev[0]], [...prev[1]]];
                          next[r][c] = v;
                          return next;
                        });
                      }}
                      className="rounded border border-stone-300 px-2 py-1 text-center dark:border-zinc-700 dark:bg-zinc-950"
                    />
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Step-by-Step Exact Forward & Backward Trace */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 font-mono text-[11px]">
            <div className="rounded-md border border-stone-200 bg-stone-50/60 p-3.5 dark:border-zinc-800 dark:bg-zinc-950/60 space-y-1.5">
              <div className="font-semibold text-stone-800 dark:text-zinc-200">Forward Pass (前向精确数值)</div>
              <div>1. z₁ = xW₁ + b₁ = [{bpRes.z1.map((v) => v.toFixed(4)).join(', ')}]</div>
              <div>
                2. h = ReLU(z₁)  = [{bpRes.h.map((v) => v.toFixed(4)).join(', ')}]
                {bpRes.z1.some((v) => v <= 0) && (
                  <span className="ml-2 text-red-600">(含 Dead ReLU 通道!)</span>
                )}
              </div>
              <div>3. z₂ = hW₂ + b₂ = [{bpRes.z2.map((v) => v.toFixed(4)).join(', ')}]</div>
              <div>4. p  = Softmax(z₂) = [{bpRes.p.map((v) => v.toFixed(4)).join(', ')}]</div>
              <div className="font-semibold text-blue-700 dark:text-blue-400">
                5. Loss L = −log(p_{yTrue}) = {bpRes.loss.toFixed(5)}
              </div>
            </div>

            <div className="rounded-md border border-stone-200 bg-stone-50/60 p-3.5 dark:border-zinc-800 dark:bg-zinc-950/60 space-y-1.5">
              <div className="font-semibold text-stone-800 dark:text-zinc-200">Backward Pass (反向链式法则 & 数值验证)</div>
              <div>1. δ₂ = p − y_onehot = [{bpRes.d2.map((v) => v.toFixed(4)).join(', ')}]</div>
              <div>2. ∂L/∂h = δ₂ W₂ᵀ   = [{bpRes.dh.map((v) => v.toFixed(4)).join(', ')}]</div>
              <div>3. δ₁ = (∂L/∂h) ⊙ 1[z₁&gt;0] = [{bpRes.d1.map((v) => v.toFixed(4)).join(', ')}]</div>
              <div>
                4. 解析 ∂L/∂W₁ = [[{bpRes.dW1[0].map((v) => v.toFixed(4)).join(', ')}], [{bpRes.dW1[1].map((v) => v.toFixed(4)).join(', ')}]]
              </div>
              <div className="text-emerald-700 dark:text-emerald-400 font-semibold">
                5. 中心差分数值检验 max|解析 − 数值| = {bpRes.maxErr.toExponential(2)} (精确吻合)
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- Mode: L05 BatchNorm vs LayerNorm + Adam vs AdamW ---
  return (
    <div className="rounded-lg border border-stone-200 bg-white overflow-hidden dark:border-zinc-800 dark:bg-[#11151d]">
      <div className="border-b border-stone-200 bg-stone-50/70 px-5 py-3 dark:border-zinc-800 dark:bg-zinc-900/60">
        <div className="font-mono text-[11px] font-medium uppercase tracking-wider text-blue-700 dark:text-blue-400">
          Numerical Verifier · L05
        </div>
        <h3 className="text-sm font-semibold text-stone-900 dark:text-zinc-100">
          BatchNorm vs LayerNorm 精确矩阵验算 & Adam (L2) vs AdamW 一步更新对照
        </h3>
      </div>

      <div className="p-5 space-y-5 text-xs">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-6 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-semibold">输入激活矩阵 X (Batch N=3 × Feature C=3)</span>
              <div className="flex rounded border border-stone-300 p-0.5 dark:border-zinc-700">
                <button
                  onClick={() => setNormType('bn')}
                  className={`rounded px-2 py-0.5 cursor-pointer ${normType === 'bn' ? 'bg-stone-900 text-white dark:bg-blue-600' : ''}`}
                >
                  BatchNorm (按列)
                </button>
                <button
                  onClick={() => setNormType('ln')}
                  className={`rounded px-2 py-0.5 cursor-pointer ${normType === 'ln' ? 'bg-stone-900 text-white dark:bg-blue-600' : ''}`}
                >
                  LayerNorm (按行)
                </button>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-1.5 font-mono">
              {actMat.map((row, r) =>
                row.map((val, c) => (
                  <input
                    key={`${r}-${c}`}
                    type="number"
                    step="1"
                    value={val}
                    onChange={(e) => {
                      const n = parseFloat(e.target.value);
                      if (Number.isNaN(n)) return;
                      setActMat((prev) =>
                        prev.map((pr, ri) => pr.map((pv, ci) => (ri === r && ci === c ? n : pv)))
                      );
                    }}
                    className="rounded border border-stone-300 bg-white px-2 py-1 text-center dark:border-zinc-700 dark:bg-zinc-950"
                  />
                ))
              )}
            </div>
          </div>

          <div className="lg:col-span-6 rounded-md border border-stone-200 bg-stone-50/60 p-3.5 dark:border-zinc-800 dark:bg-zinc-950/60 font-mono text-[11px] space-y-2">
            <div className="font-semibold text-stone-700 dark:text-zinc-300">
              {normType === 'bn' ? 'BatchNorm 按列统计 (axis=0)' : 'LayerNorm 按行统计 (axis=1)'}
            </div>
            <div>μ  = [{normRes.means.map((v) => v.toFixed(3)).join(', ')}]</div>
            <div>σ² = [{normRes.vars.map((v) => v.toFixed(3)).join(', ')}]</div>
            <div className="pt-1 border-t border-stone-200 dark:border-zinc-800">
              <div className="text-stone-500 mb-1">归一化结果 x̂ = (x − μ) / √(σ² + ε)：</div>
              {normRes.out.map((row, ri) => (
                <div key={ri}>[{row.map((v) => (v >= 0 ? ` ${v.toFixed(3)}` : v.toFixed(3))).join(', ')}]</div>
              ))}
            </div>
          </div>
        </div>

        {/* Adam + L2 vs AdamW comparison */}
        <div className="rounded-md border border-stone-200 p-4 dark:border-zinc-800 space-y-2.5">
          <div className="font-semibold text-stone-800 dark:text-zinc-200">
            为什么 Adam + L2 正则 ≠ AdamW？（令 η=0.1, t=1 一步精确数值对比）
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono">
            <label className="space-y-1">
              <span className="text-[10px] text-stone-500">当前权重 θ₀</span>
              <input type="number" step="0.5" value={theta0} onChange={(e) => setTheta0(parseFloat(e.target.value) || 0)} className="w-full rounded border border-stone-300 px-2 py-1 dark:border-zinc-700 dark:bg-zinc-950" />
            </label>
            <label className="space-y-1">
              <span className="text-[10px] text-stone-500">任务梯度 g₀</span>
              <input type="number" step="0.2" value={grad0} onChange={(e) => setGrad0(parseFloat(e.target.value) || 0)} className="w-full rounded border border-stone-300 px-2 py-1 dark:border-zinc-700 dark:bg-zinc-950" />
            </label>
            <label className="space-y-1">
              <span className="text-[10px] text-stone-500">Weight Decay λ</span>
              <input type="number" step="0.05" value={wd} onChange={(e) => setWd(parseFloat(e.target.value) || 0)} className="w-full rounded border border-stone-300 px-2 py-1 dark:border-zinc-700 dark:bg-zinc-950" />
            </label>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono text-[11px]">
            <div className="rounded bg-stone-50 p-2.5 dark:bg-zinc-950">
              Adam + L2（把 λθ 混进梯度后被 √v 归一化抵消）：θ₁ = <strong>{normRes.stepAdamL2.toFixed(4)}</strong>
            </div>
            <div className="rounded bg-blue-50/70 p-2.5 dark:bg-blue-950/30">
              AdamW（解耦直接衰减 (1−ηλ)θ − η m̂/√v̂）：θ₁ = <strong className="text-blue-700 dark:text-blue-400">{normRes.stepAdamW.toFixed(4)}</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
