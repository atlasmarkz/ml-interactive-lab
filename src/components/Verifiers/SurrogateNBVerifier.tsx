import React, { useMemo, useState } from 'react';

function mulberry(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function solveLinear(A: number[][], b: number[]): number[] {
  const n = b.length;
  const M = A.map((r, i) => [...r, b[i]]);
  for (let col = 0; col < n; col++) {
    let piv = col;
    for (let r = col + 1; r < n; r++) if (Math.abs(M[r][col]) > Math.abs(M[piv][col])) piv = r;
    [M[col], M[piv]] = [M[piv], M[col]];
    const d = M[col][col];
    if (Math.abs(d) < 1e-12) continue;
    for (let c = col; c <= n; c++) M[col][c] /= d;
    for (let r = 0; r < n; r++) {
      if (r === col) continue;
      const f = M[r][col];
      for (let c = col; c <= n; c++) M[r][c] -= f * M[col][c];
    }
  }
  return M.map((r) => r[n]);
}

function fitPoly(xs: number[], ys: number[], deg: number, lam: number): number[] {
  const m = deg + 1;
  const XtX = Array.from({ length: m }, () => Array(m).fill(0));
  const Xty = Array(m).fill(0);
  for (let k = 0; k < xs.length; k++) {
    const phi = [1];
    for (let d = 1; d <= deg; d++) phi.push(phi[d - 1] * xs[k]);
    for (let i = 0; i < m; i++) {
      Xty[i] += phi[i] * ys[k];
      for (let j = 0; j < m; j++) XtX[i][j] += phi[i] * phi[j];
    }
  }
  for (let i = 1; i < m; i++) XtX[i][i] += lam;
  XtX[0][0] += 1e-9;
  return solveLinear(XtX, Xty);
}

function evalPoly(w: number[], x: number): number {
  let s = 0;
  let xp = 1;
  for (let i = 0; i < w.length; i++) {
    s += w[i] * xp;
    xp *= x;
  }
  return s;
}

interface SurrogateNBVerifierProps {
  mode: 'l02-2-nb-surrogate' | 'l03-bias-variance';
}

export const SurrogateNBVerifier: React.FC<SurrogateNBVerifierProps> = ({ mode }) => {
  // --- L02.2: Naive Bayes Discrete Count Table + Laplace Smoothing + Surrogate Margin ---
  const [nSpam, setNSpam] = useState(40);
  const [nHam, setNHam] = useState(60);
  const [cFreeSpam, setCFreeSpam] = useState(28);
  const [cFreeHam, setCFreeHam] = useState(6);
  const [cMeetSpam, setCMeetSpam] = useState(0); // Zero-count test!
  const [cMeetHam, setCMeetHam] = useState(24);
  const [laplace, setLaplace] = useState(0.0);
  const [margin, setMargin] = useState(-0.5);

  const nbRes = useMemo(() => {
    const total = nSpam + nHam;
    const pSpam = nSpam / total;
    const pHam = nHam / total;
    const V = 2; // binary word presence {0, 1}
    const pFreeS = (cFreeSpam + laplace) / (nSpam + laplace * V);
    const pMeetS = (cMeetSpam + laplace) / (nSpam + laplace * V);
    const pFreeH = (cFreeHam + laplace) / (nHam + laplace * V);
    const pMeetH = (cMeetHam + laplace) / (nHam + laplace * V);

    const jointSpam = pSpam * pFreeS * pMeetS;
    const jointHam = pHam * pFreeH * pMeetH;
    const denom = jointSpam + jointHam;
    const postSpam = denom > 0 ? jointSpam / denom : 0;
    const postHam = denom > 0 ? jointHam / denom : 0;
    return { pSpam, pHam, pFreeS, pMeetS, pFreeH, pMeetH, jointSpam, jointHam, postSpam, postHam };
  }, [nSpam, nHam, cFreeSpam, cFreeHam, cMeetSpam, cMeetHam, laplace]);

  // --- L03: Exact Empirical Bias-Variance Verification across Degrees 1..9 ---
  const [noiseStd, setNoiseStd] = useState(0.25);
  const [lambdaBV, setLambdaBV] = useState(1e-4);
  const [nTrain, setNTrain] = useState(16);

  const bvRows = useMemo(() => {
    const trueFn = (x: number) => Math.sin(1.4 * Math.PI * x);
    const M = 60; // 60 independent training sets
    const evalXs = Array.from({ length: 25 }, (_, i) => -0.9 + (1.8 * i) / 24);
    const degrees = [1, 2, 3, 5, 7, 9];

    return degrees.map((deg) => {
      const rng = mulberry(1000 + deg * 37);
      const randn = () => Math.sqrt(-2 * Math.log(Math.max(1e-7, rng()))) * Math.cos(2 * Math.PI * rng());
      const predsBySet: number[][] = [];
      for (let m = 0; m < M; m++) {
        const xs = Array.from({ length: nTrain }, (_, i) => -0.95 + (1.9 * i) / (nTrain - 1));
        const ys = xs.map((x) => trueFn(x) + randn() * noiseStd);
        const w = fitPoly(xs, ys, deg, lambdaBV);
        predsBySet.push(evalXs.map((x) => evalPoly(w, x)));
      }
      let biasSq = 0;
      let variance = 0;
      for (let j = 0; j < evalXs.length; j++) {
        const meanPred = predsBySet.reduce((a, row) => a + row[j], 0) / M;
        const truth = trueFn(evalXs[j]);
        biasSq += (meanPred - truth) ** 2;
        variance += predsBySet.reduce((a, row) => a + (row[j] - meanPred) ** 2, 0) / M;
      }
      biasSq /= evalXs.length;
      variance /= evalXs.length;
      const irr = noiseStd * noiseStd;
      return { deg, biasSq, variance, irr, total: biasSq + variance + irr };
    });
  }, [noiseStd, lambdaBV, nTrain]);

  if (mode === 'l02-2-nb-surrogate') {
    const surrRows = [
      {
        name: '0/1 Error 1[m ≤ 0]',
        loss: margin <= 0 ? 1 : 0,
        grad: margin === 0 ? 'Undefined' : '0.0000',
        convex: 'No',
      },
      {
        name: 'Logistic log(1 + e⁻ᵐ)',
        loss: Math.log(1 + Math.exp(-margin)),
        grad: (-1 / (1 + Math.exp(margin))).toFixed(4),
        convex: 'Yes (Smooth)',
      },
      {
        name: 'Hinge max(0, 1 − m)',
        loss: Math.max(0, 1 - margin),
        grad: margin < 1 ? '-1.0000' : '0.0000',
        convex: 'Yes (Piecewise)',
      },
      {
        name: 'Exponential e⁻ᵐ',
        loss: Math.exp(-margin),
        grad: (-Math.exp(-margin)).toFixed(4),
        convex: 'Yes (Smooth)',
      },
    ];

    return (
      <div className="rounded-lg border border-stone-200 bg-white overflow-hidden dark:border-zinc-800 dark:bg-[#11151d]">
        <div className="border-b border-stone-200 bg-stone-50/70 px-5 py-3 dark:border-zinc-800 dark:bg-zinc-900/60">
          <div className="font-mono text-[11px] font-medium uppercase tracking-wider text-blue-700 dark:text-blue-400">
            Numerical Verifier · L02.2
          </div>
          <h3 className="text-sm font-semibold text-stone-900 dark:text-zinc-100">
            Naive Bayes 零概率陷阱 + Laplace 平滑验算 & 凸代理损失梯度对照表
          </h3>
        </div>

        <div className="p-5 grid grid-cols-1 lg:grid-cols-12 gap-6 text-xs">
          {/* Left: Naive Bayes Verifier */}
          <div className="lg:col-span-7 space-y-3">
            <div className="font-semibold text-stone-800 dark:text-zinc-200">
              1. Naive Bayes 后验验算（测试文档包含词：x₁=&quot;Free&quot;, x₂=&quot;Meeting&quot;）
            </div>

            <div className="grid grid-cols-3 gap-2 font-mono">
              {[
                { label: 'N(Spam)', val: nSpam, set: setNSpam },
                { label: 'Count("Free"|Spam)', val: cFreeSpam, set: setCFreeSpam },
                { label: 'Count("Meet"|Spam)', val: cMeetSpam, set: setCMeetSpam },
                { label: 'N(Ham)', val: nHam, set: setNHam },
                { label: 'Count("Free"|Ham)', val: cFreeHam, set: setCFreeHam },
                { label: 'Count("Meet"|Ham)', val: cMeetHam, set: setCMeetHam },
              ].map((f) => (
                <label key={f.label} className="space-y-1">
                  <span className="block text-[10px] text-stone-500">{f.label}</span>
                  <input
                    type="number"
                    min={0}
                    value={f.val}
                    onChange={(e) => {
                      const n = parseInt(e.target.value, 10);
                      if (!Number.isNaN(n) && n >= 0) f.set(n);
                    }}
                    className="w-full rounded border border-stone-300 bg-white px-2 py-1 text-center dark:border-zinc-700 dark:bg-zinc-950"
                  />
                </label>
              ))}
            </div>

            <div className="flex items-center justify-between gap-3 rounded-md border border-stone-200 bg-stone-50/70 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-950/60">
              <span>Laplace 平滑系数 α（设为 0 观察零概率坍塌，改为 1 修复）：</span>
              <div className="flex gap-1.5 font-mono">
                {[0, 0.5, 1, 2].map((a) => (
                  <button
                    key={a}
                    onClick={() => setLaplace(a)}
                    className={`rounded border px-2 py-0.5 cursor-pointer ${
                      laplace === a
                        ? 'border-blue-600 bg-blue-600 text-white'
                        : 'border-stone-300 bg-white dark:border-zinc-700 dark:bg-zinc-900'
                    }`}
                  >
                    α={a}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-md border border-stone-200 p-3 font-mono text-[11px] leading-relaxed dark:border-zinc-800 space-y-1">
              <div>
                P(Spam, Free, Meet) = {nbRes.pSpam.toFixed(3)} × {nbRes.pFreeS.toFixed(3)} ×{' '}
                <strong className={nbRes.pMeetS === 0 ? 'text-red-600' : ''}>{nbRes.pMeetS.toFixed(3)}</strong> ={' '}
                <strong>{nbRes.jointSpam.toFixed(5)}</strong>
              </div>
              <div>
                P(Ham,  Free, Meet) = {nbRes.pHam.toFixed(3)} × {nbRes.pFreeH.toFixed(3)} × {nbRes.pMeetH.toFixed(3)} ={' '}
                <strong>{nbRes.jointHam.toFixed(5)}</strong>
              </div>
              <div className="border-t border-stone-200 pt-1.5 dark:border-zinc-800 flex justify-between">
                <span>后验 P(Spam | x) = <strong>{(nbRes.postSpam * 100).toFixed(2)}%</strong></span>
                <span>后验 P(Ham | x) = <strong>{(nbRes.postHam * 100).toFixed(2)}%</strong></span>
              </div>
            </div>
          </div>

          {/* Right: Convex Surrogate Margin Table */}
          <div className="lg:col-span-5 space-y-3">
            <div className="font-semibold text-stone-800 dark:text-zinc-200">
              2. 分类间隔 m = y·f(x) 处的代理损失值与梯度
            </div>
            <div className="space-y-1">
              <div className="flex justify-between font-mono">
                <span>样本间隔 m = y·f(x)</span>
                <span className="font-semibold text-blue-700 dark:text-blue-400">m = {margin.toFixed(2)}</span>
              </div>
              <input type="range" min={-2.5} max={2.5} step={0.1} value={margin} onChange={(e) => setMargin(parseFloat(e.target.value))} className="w-full" />
            </div>

            <table className="w-full border-collapse font-mono text-[11px] rounded border border-stone-200 dark:border-zinc-800">
              <thead>
                <tr className="border-b border-stone-200 bg-stone-50 text-stone-500 dark:border-zinc-800 dark:bg-zinc-900">
                  <th className="px-2 py-1.5 text-left">Loss</th>
                  <th className="px-2 py-1.5 text-right">L(m)</th>
                  <th className="px-2 py-1.5 text-right">dL/dm</th>
                  <th className="px-2 py-1.5 text-right">Convex</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-zinc-900">
                {surrRows.map((r) => (
                  <tr key={r.name}>
                    <td className="px-2 py-1.5 font-sans font-medium">{r.name}</td>
                    <td className="px-2 py-1.5 text-right">{r.loss.toFixed(4)}</td>
                    <td className="px-2 py-1.5 text-right text-red-700 dark:text-red-400">{r.grad}</td>
                    <td className="px-2 py-1.5 text-right text-stone-500">{r.convex}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // --- Mode: L03 Empirical Bias-Variance Decomposition Table ---
  const bestDeg = bvRows.reduce((best, cur) => (cur.total < best.total ? cur : best), bvRows[0]).deg;

  return (
    <div className="rounded-lg border border-stone-200 bg-white overflow-hidden dark:border-zinc-800 dark:bg-[#11151d]">
      <div className="border-b border-stone-200 bg-stone-50/70 px-5 py-3 dark:border-zinc-800 dark:bg-zinc-900/60">
        <div className="font-mono text-[11px] font-medium uppercase tracking-wider text-blue-700 dark:text-blue-400">
          Monte Carlo Statistical Verifier · L03
        </div>
        <h3 className="text-sm font-semibold text-stone-900 dark:text-zinc-100">
          60 组独立采样集实测 Bias² + Variance + σ² = Expected Test MSE 精确分解表
        </h3>
      </div>

      <div className="p-5 space-y-4 text-xs">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 rounded-md border border-stone-200 bg-stone-50/60 p-3.5 dark:border-zinc-800 dark:bg-zinc-950/60">
          <div className="space-y-1">
            <div className="flex justify-between">
              <span>训练集大小 N</span>
              <span className="font-mono font-semibold">{nTrain}</span>
            </div>
            <input type="range" min={10} max={40} step={2} value={nTrain} onChange={(e) => setNTrain(parseInt(e.target.value, 10))} className="w-full" />
          </div>
          <div className="space-y-1">
            <div className="flex justify-between">
              <span>观测噪声标准差 σ</span>
              <span className="font-mono font-semibold">{noiseStd.toFixed(2)} (σ²={(noiseStd ** 2).toFixed(3)})</span>
            </div>
            <input type="range" min={0.05} max={0.5} step={0.05} value={noiseStd} onChange={(e) => setNoiseStd(parseFloat(e.target.value))} className="w-full" />
          </div>
          <div className="space-y-1">
            <div className="flex justify-between">
              <span>Ridge 正则 λ</span>
              <span className="font-mono font-semibold">{lambdaBV < 0.001 ? lambdaBV.toExponential(0) : lambdaBV.toFixed(3)}</span>
            </div>
            <input
              type="range"
              min={-5}
              max={0}
              step={0.5}
              value={Math.log10(lambdaBV)}
              onChange={(e) => setLambdaBV(Math.pow(10, parseFloat(e.target.value)))}
              className="w-full"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse font-mono text-xs">
            <thead>
              <tr className="border-b border-stone-200 bg-stone-50 text-stone-500 dark:border-zinc-800 dark:bg-zinc-900">
                <th className="px-3 py-2 text-left">Degree d</th>
                <th className="px-3 py-2 text-right">Bias²</th>
                <th className="px-3 py-2 text-right">Variance</th>
                <th className="px-3 py-2 text-right">Irreducible σ²</th>
                <th className="px-3 py-2 text-right">Total Expected MSE</th>
                <th className="px-3 py-2 text-left font-sans">诊断</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-zinc-900">
              {bvRows.map((r) => (
                <tr
                  key={r.deg}
                  className={r.deg === bestDeg ? 'bg-emerald-50/70 dark:bg-emerald-950/25 font-semibold' : ''}
                >
                  <td className="px-3 py-2">d = {r.deg}</td>
                  <td className="px-3 py-2 text-right text-red-700 dark:text-red-400">{r.biasSq.toFixed(4)}</td>
                  <td className="px-3 py-2 text-right text-blue-700 dark:text-blue-400">{r.variance.toFixed(4)}</td>
                  <td className="px-3 py-2 text-right text-stone-500">{r.irr.toFixed(4)}</td>
                  <td className="px-3 py-2 text-right">{r.total.toFixed(4)}</td>
                  <td className="px-3 py-2 font-sans text-[11px] text-stone-600 dark:text-zinc-400">
                    {r.deg === bestDeg
                      ? '最优泛化平衡点'
                      : r.biasSq > r.variance
                      ? '高偏差主导 (Underfitting)'
                      : '高方差主导 (Overfitting)'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
