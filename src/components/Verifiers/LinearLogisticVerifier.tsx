import React, { useMemo, useState } from 'react';
import { RotateCcw } from 'lucide-react';

// Exact Gaussian elimination with partial pivoting returning both solution and matrix inverse
function solveAndInvert(A: number[][], b: number[]): { sol: number[]; inv: number[][] | null } {
  const n = A.length;
  const M = A.map((row, i) => [
    ...row,
    ...Array.from({ length: n }, (_, j) => (i === j ? 1 : 0)),
    b[i],
  ]);

  for (let col = 0; col < n; col++) {
    let pivot = col;
    for (let r = col + 1; r < n; r++) {
      if (Math.abs(M[r][col]) > Math.abs(M[pivot][col])) pivot = r;
    }
    if (Math.abs(M[pivot][col]) < 1e-10) {
      return { sol: Array(n).fill(NaN), inv: null };
    }
    [M[col], M[pivot]] = [M[pivot], M[col]];
    const diag = M[col][col];
    for (let c = col; c < 2 * n + 1; c++) M[col][c] /= diag;
    for (let r = 0; r < n; r++) {
      if (r === col) continue;
      const f = M[r][col];
      for (let c = col; c < 2 * n + 1; c++) M[r][c] -= f * M[col][c];
    }
  }
  return {
    sol: M.map((row) => row[2 * n]),
    inv: M.map((row) => row.slice(n, 2 * n)),
  };
}

const MatrixTable: React.FC<{ title: string; mat: number[][]; headers?: string[] }> = ({
  title,
  mat,
  headers,
}) => (
  <div className="rounded-md border border-stone-200 bg-stone-50/60 p-3 dark:border-zinc-800 dark:bg-zinc-950/60">
    <div className="mb-1.5 font-mono text-[11px] font-semibold text-stone-600 dark:text-zinc-400">
      {title}
    </div>
    <div className="overflow-x-auto">
      <table className="w-full border-collapse font-mono text-xs">
        {headers && (
          <thead>
            <tr className="border-b border-stone-200 text-[10px] text-stone-400 dark:border-zinc-800">
              {headers.map((h) => (
                <th key={h} className="px-2 py-1 text-right font-medium">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
        )}
        <tbody>
          {mat.map((row, ri) => (
            <tr key={ri} className="border-b border-stone-100 last:border-0 dark:border-zinc-900">
              {row.map((v, ci) => (
                <td key={ci} className="px-2 py-1 text-right text-stone-800 dark:text-zinc-200">
                  {Number.isFinite(v) ? v.toFixed(4) : 'Singular'}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

interface LinearLogisticVerifierProps {
  mode: 'l01-ols-ridge' | 'l02-1-logistic-gd';
}

export const LinearLogisticVerifier: React.FC<LinearLogisticVerifierProps> = ({ mode }) => {
  // --- L01: Editable Design Matrix X = [1, x1, x2] and target y (4 samples) ---
  const defaultOls = [
    [1, 0, 1, 1],
    [1, 1, 1, 3],
    [1, 1, 0, 2],
    [1, 2, 0, 4],
  ];
  const [olsRows, setOlsRows] = useState<number[][]>(defaultOls);
  const [lambda, setLambda] = useState(0.0);
  const [penalizeBias, setPenalizeBias] = useState(false);

  const olsResult = useMemo(() => {
    const N = olsRows.length;
    const X = olsRows.map((r) => [r[0], r[1], r[2]]);
    const y = olsRows.map((r) => r[3]);
    const XtX: number[][] = Array.from({ length: 3 }, () => [0, 0, 0]);
    const Xty: number[] = [0, 0, 0];
    for (let i = 0; i < N; i++) {
      for (let a = 0; a < 3; a++) {
        Xty[a] += X[i][a] * y[i];
        for (let b = 0; b < 3; b++) XtX[a][b] += X[i][a] * X[i][b];
      }
    }
    const A = XtX.map((row, i) =>
      row.map((v, j) => (i === j ? v + (i === 0 && !penalizeBias ? 0 : lambda) : v))
    );
    const { sol: w, inv } = solveAndInvert(A, Xty);
    const preds = X.map((row) => row[0] * w[0] + row[1] * w[1] + row[2] * w[2]);
    const res = preds.map((p, i) => y[i] - p);
    const mse = res.reduce((a, e) => a + e * e, 0) / N;
    const yMean = y.reduce((a, b) => a + b, 0) / N;
    const sst = y.reduce((a, yi) => a + (yi - yMean) ** 2, 0);
    const r2 = sst > 1e-10 ? 1 - (mse * N) / sst : 1;
    return { XtX, A, inv, Xty, w, preds, res, mse, r2 };
  }, [olsRows, lambda, penalizeBias]);

  // --- L02.1: Editable Logistic Regression 1-Step Batch GD Verifier ---
  const defaultLogRows = [
    [0, 0, 0],
    [0, 1, 0],
    [1, 0, 0],
    [1, 1, 1],
  ];
  const [logRows, setLogRows] = useState<number[][]>(defaultLogRows);
  const [wInit, setWInit] = useState<[number, number, number]>([-1.5, 1.0, 1.0]);
  const [alpha, setAlpha] = useState(0.5);
  const [l2Reg, setL2Reg] = useState(0.0);

  const logResult = useMemo(() => {
    const N = logRows.length;
    const sig = (z: number) => 1 / (1 + Math.exp(-z));
    const perSample = logRows.map(([x1, x2, y]) => {
      const z = wInit[0] + wInit[1] * x1 + wInit[2] * x2;
      const p = sig(z);
      const err = p - y;
      const loss = -(y * Math.log(Math.max(1e-12, p)) + (1 - y) * Math.log(Math.max(1e-12, 1 - p)));
      return { x1, x2, y, z, p, err, loss };
    });
    const avgLoss =
      perSample.reduce((a, s) => a + s.loss, 0) / N +
      0.5 * l2Reg * (wInit[1] ** 2 + wInit[2] ** 2);
    const g0 = perSample.reduce((a, s) => a + s.err, 0) / N;
    const g1 = perSample.reduce((a, s) => a + s.err * s.x1, 0) / N + l2Reg * wInit[1];
    const g2 = perSample.reduce((a, s) => a + s.err * s.x2, 0) / N + l2Reg * wInit[2];
    const wNext: [number, number, number] = [
      wInit[0] - alpha * g0,
      wInit[1] - alpha * g1,
      wInit[2] - alpha * g2,
    ];
    let correctNext = 0;
    for (const [x1, x2, y] of logRows) {
      const pNext = sig(wNext[0] + wNext[1] * x1 + wNext[2] * x2);
      if ((pNext >= 0.5 ? 1 : 0) === y) correctNext++;
    }
    return { perSample, avgLoss, grad: [g0, g1, g2], wNext, errRateNext: 1 - correctNext / N };
  }, [logRows, wInit, alpha, l2Reg]);

  if (mode === 'l01-ols-ridge') {
    return (
      <div className="rounded-lg border border-stone-200 bg-white overflow-hidden dark:border-zinc-800 dark:bg-[#11151d]">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-200 bg-stone-50/70 px-5 py-3 dark:border-zinc-800 dark:bg-zinc-900/60">
          <div>
            <div className="font-mono text-[11px] font-medium uppercase tracking-wider text-blue-700 dark:text-blue-400">
              Numerical Matrix Verifier · L01
            </div>
            <h3 className="text-sm font-semibold text-stone-900 dark:text-zinc-100">
              OLS / Ridge 正规方程逐步矩阵验算器（支持自定义输入与 w₀ 惩罚对照）
            </h3>
          </div>
          <button
            onClick={() => {
              setOlsRows(defaultOls);
              setLambda(0);
              setPenalizeBias(false);
            }}
            className="inline-flex items-center gap-1 rounded border border-stone-300 bg-white px-2.5 py-1 text-xs text-stone-700 hover:bg-stone-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 cursor-pointer"
          >
            <RotateCcw className="h-3 w-3" /> 重置默认矩阵
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Editable Inputs */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            <div className="lg:col-span-6 space-y-2">
              <div className="text-xs font-medium text-stone-600 dark:text-zinc-400">
                可编辑数据矩阵 [1, x₁, x₂] 与目标值 y（修改任意单元格实时重算全部中间矩阵）：
              </div>
              <table className="w-full border-collapse font-mono text-xs">
                <thead>
                  <tr className="border-b border-stone-200 text-[11px] text-stone-400 dark:border-zinc-800">
                    <th className="py-1 text-left">Sample</th>
                    <th className="py-1 text-center">x₀ (Bias)</th>
                    <th className="py-1 text-center">x₁</th>
                    <th className="py-1 text-center">x₂</th>
                    <th className="py-1 text-center text-blue-700 dark:text-blue-400">y</th>
                  </tr>
                </thead>
                <tbody>
                  {olsRows.map((row, ri) => (
                    <tr key={ri} className="border-b border-stone-100 dark:border-zinc-900">
                      <td className="py-1.5 text-stone-400">i={ri + 1}</td>
                      {row.map((val, ci) => (
                        <td key={ci} className="p-1">
                          <input
                            type="number"
                            step="0.5"
                            disabled={ci === 0}
                            value={val}
                            onChange={(e) => {
                              const num = parseFloat(e.target.value);
                              if (Number.isNaN(num)) return;
                              setOlsRows((prev) =>
                                prev.map((r, rIdx) =>
                                  rIdx === ri ? r.map((v, cIdx) => (cIdx === ci ? num : v)) : r
                                )
                              );
                            }}
                            className={`w-full rounded border px-2 py-1 text-center font-mono text-xs ${
                              ci === 0
                                ? 'border-stone-200 bg-stone-100 text-stone-400 dark:border-zinc-800 dark:bg-zinc-900'
                                : 'border-stone-300 bg-white text-stone-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100'
                            }`}
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="lg:col-span-6 space-y-3 rounded-md border border-stone-200 bg-stone-50/60 p-4 dark:border-zinc-800 dark:bg-zinc-950/60 text-xs">
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="font-medium text-stone-700 dark:text-zinc-300">
                    L2 正则化系数 λ（λ=0 即无正则 OLS）
                  </span>
                  <span className="font-mono font-semibold text-blue-700 dark:text-blue-400">
                    λ = {lambda.toFixed(2)}
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={10}
                  step={0.5}
                  value={lambda}
                  onChange={(e) => setLambda(parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>

              <label className="flex items-center justify-between border-t border-stone-200 pt-3 dark:border-zinc-800 cursor-pointer">
                <span className="text-stone-700 dark:text-zinc-300">
                  同时惩罚偏置项 w₀（对照 WA1 考点：观察 w₀ 如何被压向 0）
                </span>
                <input
                  type="checkbox"
                  checked={penalizeBias}
                  onChange={(e) => setPenalizeBias(e.target.checked)}
                />
              </label>

              <div className="grid grid-cols-3 gap-2 border-t border-stone-200 pt-3 dark:border-zinc-800 font-mono">
                <div>
                  <div className="text-[10px] text-stone-400">解出权重 w*</div>
                  <div className="font-semibold text-stone-900 dark:text-zinc-100">
                    [{olsResult.w.map((v) => (Number.isFinite(v) ? v.toFixed(3) : 'NaN')).join(', ')}]
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-stone-400">Train MSE</div>
                  <div className="font-semibold text-red-700 dark:text-red-400">
                    {Number.isFinite(olsResult.mse) ? olsResult.mse.toFixed(4) : '—'}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-stone-400">R² Score</div>
                  <div className="font-semibold text-emerald-700 dark:text-emerald-400">
                    {Number.isFinite(olsResult.r2) ? olsResult.r2.toFixed(4) : '—'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Intermediate Matrices */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <MatrixTable title="Step 1 · XᵀX + λD (3×3)" mat={olsResult.A} headers={['w₀', 'w₁', 'w₂']} />
            <MatrixTable
              title="Step 2 · (XᵀX + λD)⁻¹ (3×3)"
              mat={olsResult.inv ?? [[NaN, NaN, NaN], [NaN, NaN, NaN], [NaN, NaN, NaN]]}
              headers={['c0', 'c1', 'c2']}
            />
            <MatrixTable
              title="Step 3 · Xᵀy 与最终解 w*"
              mat={[
                [olsResult.Xty[0], olsResult.w[0]],
                [olsResult.Xty[1], olsResult.w[1]],
                [olsResult.Xty[2], olsResult.w[2]],
              ]}
              headers={['Xᵀy', 'w*']}
            />
          </div>
        </div>
      </div>
    );
  }

  // --- Mode: L02.1 Logistic Regression 1-Step Batch GD ---
  return (
    <div className="rounded-lg border border-stone-200 bg-white overflow-hidden dark:border-zinc-800 dark:bg-[#11151d]">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-200 bg-stone-50/70 px-5 py-3 dark:border-zinc-800 dark:bg-zinc-900/60">
        <div>
          <div className="font-mono text-[11px] font-medium uppercase tracking-wider text-blue-700 dark:text-blue-400">
            Numerical Gradient Verifier · L02.1
          </div>
          <h3 className="text-sm font-semibold text-stone-900 dark:text-zinc-100">
            Logistic Regression 单步批量梯度下降 (Batch GD) 逐样本手算验算器
          </h3>
        </div>
        <button
          onClick={() => {
            setLogRows(defaultLogRows);
            setWInit([-1.5, 1.0, 1.0]);
            setAlpha(0.5);
            setL2Reg(0.0);
          }}
          className="inline-flex items-center gap-1 rounded border border-stone-300 bg-white px-2.5 py-1 text-xs text-stone-700 hover:bg-stone-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 cursor-pointer"
        >
          <RotateCcw className="h-3 w-3" /> 重置默认
        </button>
      </div>

      <div className="p-5 space-y-5 text-xs">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Editable Initial Params & Dataset */}
          <div className="lg:col-span-5 space-y-3">
            <div className="font-medium text-stone-600 dark:text-zinc-400">
              初始参数 w⁽⁰⁾ = (w₀, w₁, w₂)、学习率 α 与 L2 正则 λ：
            </div>
            <div className="grid grid-cols-5 gap-2 font-mono">
              {[
                { label: 'w₀', val: wInit[0], set: (v: number) => setWInit([v, wInit[1], wInit[2]]) },
                { label: 'w₁', val: wInit[1], set: (v: number) => setWInit([wInit[0], v, wInit[2]]) },
                { label: 'w₂', val: wInit[2], set: (v: number) => setWInit([wInit[0], wInit[1], v]) },
                { label: 'α (lr)', val: alpha, set: setAlpha },
                { label: 'λ (L2)', val: l2Reg, set: setL2Reg },
              ].map((f) => (
                <label key={f.label} className="space-y-1">
                  <span className="block text-[10px] text-stone-500">{f.label}</span>
                  <input
                    type="number"
                    step="0.1"
                    value={f.val}
                    onChange={(e) => {
                      const n = parseFloat(e.target.value);
                      if (!Number.isNaN(n)) f.set(n);
                    }}
                    className="w-full rounded border border-stone-300 bg-white px-2 py-1 text-center dark:border-zinc-700 dark:bg-zinc-950"
                  />
                </label>
              ))}
            </div>

            <div className="pt-1 font-medium text-stone-600 dark:text-zinc-400">
              训练样本 (x₁, x₂, y ∈ &#123;0,1&#125;)：
            </div>
            <table className="w-full border-collapse font-mono text-xs">
              <thead>
                <tr className="border-b border-stone-200 text-[10px] text-stone-400 dark:border-zinc-800">
                  <th className="py-1 text-left">i</th>
                  <th className="py-1 text-center">x₁</th>
                  <th className="py-1 text-center">x₂</th>
                  <th className="py-1 text-center">y</th>
                </tr>
              </thead>
              <tbody>
                {logRows.map((row, ri) => (
                  <tr key={ri} className="border-b border-stone-100 dark:border-zinc-900">
                    <td className="py-1 text-stone-400">{ri + 1}</td>
                    {row.map((val, ci) => (
                      <td key={ci} className="p-1">
                        <input
                          type="number"
                          step={ci === 2 ? '1' : '0.5'}
                          min={ci === 2 ? 0 : undefined}
                          max={ci === 2 ? 1 : undefined}
                          value={val}
                          onChange={(e) => {
                            const n = parseFloat(e.target.value);
                            if (Number.isNaN(n)) return;
                            setLogRows((prev) =>
                              prev.map((r, rIdx) =>
                                rIdx === ri ? r.map((v, cIdx) => (cIdx === ci ? n : v)) : r
                              )
                            );
                          }}
                          className="w-full rounded border border-stone-300 bg-white px-2 py-0.5 text-center dark:border-zinc-700 dark:bg-zinc-950"
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Exact Per-Sample Computation Table */}
          <div className="lg:col-span-7 space-y-3">
            <div className="rounded-md border border-stone-200 bg-stone-50/60 p-3.5 dark:border-zinc-800 dark:bg-zinc-950/60">
              <div className="mb-2 font-mono text-[11px] font-semibold text-stone-600 dark:text-zinc-400">
                逐样本前向概率与误差项 (ŷ_i − y_i) 明细表
              </div>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse font-mono text-xs">
                  <thead>
                    <tr className="border-b border-stone-200 text-[10px] text-stone-400 dark:border-zinc-800">
                      <th className="py-1 text-left">i</th>
                      <th className="py-1 text-right">z = wᵀx</th>
                      <th className="py-1 text-right">ŷ = σ(z)</th>
                      <th className="py-1 text-right">ŷ − y</th>
                      <th className="py-1 text-right">CE Loss_i</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logResult.perSample.map((s, idx) => (
                      <tr key={idx} className="border-b border-stone-100 last:border-0 dark:border-zinc-900">
                        <td className="py-1 text-stone-400">{idx + 1}</td>
                        <td className="py-1 text-right">{s.z.toFixed(4)}</td>
                        <td className="py-1 text-right text-emerald-700 dark:text-emerald-400">{s.p.toFixed(4)}</td>
                        <td className="py-1 text-right text-red-700 dark:text-red-400">{s.err.toFixed(4)}</td>
                        <td className="py-1 text-right">{s.loss.toFixed(4)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono">
              <div className="rounded-md border border-stone-200 p-3 dark:border-zinc-800">
                <div className="text-[10px] text-stone-400">当前平均损失 L(w⁽⁰⁾)</div>
                <div className="mt-1 text-sm font-semibold">{logResult.avgLoss.toFixed(4)}</div>
              </div>
              <div className="rounded-md border border-stone-200 p-3 dark:border-zinc-800">
                <div className="text-[10px] text-stone-400">梯度向量 ∇L(w⁽⁰⁾)</div>
                <div className="mt-1 text-xs font-semibold text-red-700 dark:text-red-400">
                  [{logResult.grad.map((g) => g.toFixed(4)).join(', ')}]
                </div>
              </div>
              <div className="rounded-md border border-stone-200 p-3 dark:border-zinc-800">
                <div className="text-[10px] text-stone-400">更新后权重 w⁽¹⁾</div>
                <div className="mt-1 text-xs font-semibold text-blue-700 dark:text-blue-400">
                  [{logResult.wNext.map((w) => w.toFixed(4)).join(', ')}]
                </div>
                <div className="mt-0.5 text-[10px] text-stone-500">
                  更新后误分率: {(logResult.errRateNext * 100).toFixed(1)}%
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
