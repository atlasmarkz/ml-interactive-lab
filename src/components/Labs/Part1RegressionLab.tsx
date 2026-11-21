import React, { useMemo, useState } from 'react';
import { MousePointerClick, RefreshCw, Sliders } from 'lucide-react';

interface Point {
  x: number;
  y: number;
}

function trueFn(x: number): number {
  return Math.sin(1.4 * Math.PI * x) * 0.72 + 0.18 * Math.cos(2.4 * Math.PI * x);
}

// Deterministic seeded PRNG (Mulberry32) so resampling feels crisp & reproducible
function mulberry32(seed: number) {
  let a = seed;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function randn(rng: () => number): number {
  const u1 = Math.max(1e-7, rng());
  const u2 = rng();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

function generateDataset(n: number, noise: number, seed: number): Point[] {
  const rng = mulberry32(seed);
  const pts: Point[] = [];
  for (let i = 0; i < n; i++) {
    const x = -0.95 + (1.9 * i) / Math.max(1, n - 1) + (rng() - 0.5) * 0.08;
    const clampedX = Math.max(-1, Math.min(1, x));
    pts.push({ x: clampedX, y: trueFn(clampedX) + randn(rng) * noise });
  }
  return pts;
}

// Solve (A) w = b using Gaussian elimination with partial pivoting
function solveLinearSystem(A: number[][], b: number[]): number[] {
  const n = b.length;
  const M = A.map((row, i) => [...row, b[i]]);
  for (let col = 0; col < n; col++) {
    let pivot = col;
    for (let r = col + 1; r < n; r++) {
      if (Math.abs(M[r][col]) > Math.abs(M[pivot][col])) pivot = r;
    }
    [M[col], M[pivot]] = [M[pivot], M[col]];
    const diag = M[col][col];
    if (Math.abs(diag) < 1e-12) continue;
    for (let c = col; c <= n; c++) M[col][c] /= diag;
    for (let r = 0; r < n; r++) {
      if (r === col) continue;
      const factor = M[r][col];
      for (let c = col; c <= n; c++) M[r][c] -= factor * M[col][c];
    }
  }
  return M.map((row) => row[n]);
}

function fitPolyRidge(pts: Point[], degree: number, lambda: number): number[] {
  const m = degree + 1;
  const XtX: number[][] = Array.from({ length: m }, () => Array(m).fill(0));
  const Xty: number[] = Array(m).fill(0);
  for (const p of pts) {
    const phi: number[] = [1];
    for (let d = 1; d <= degree; d++) phi.push(phi[d - 1] * p.x);
    for (let i = 0; i < m; i++) {
      Xty[i] += phi[i] * p.y;
      for (let j = 0; j < m; j++) XtX[i][j] += phi[i] * phi[j];
    }
  }
  for (let i = 1; i < m; i++) XtX[i][i] += lambda;
  XtX[0][0] += 1e-9; // tiny stability jitter on bias
  return solveLinearSystem(XtX, Xty);
}

function evalPoly(w: number[], x: number): number {
  let acc = 0;
  let xp = 1;
  for (let i = 0; i < w.length; i++) {
    acc += w[i] * xp;
    xp *= x;
  }
  return acc;
}

export const Part1RegressionLab: React.FC = () => {
  const [mode, setMode] = useState<'fit' | 'bv'>('fit');
  const [degree, setDegree] = useState(3);
  const [logLambda, setLogLambda] = useState(-4);
  const [noise, setNoise] = useState(0.22);
  const [seed, setSeed] = useState(42);
  const [customPoints, setCustomPoints] = useState<Point[]>([]);

  const lambda = Math.pow(10, logLambda);

  const basePoints = useMemo(() => generateDataset(14, noise, seed), [noise, seed]);
  const allPoints = useMemo(() => [...basePoints, ...customPoints], [basePoints, customPoints]);

  const weights = useMemo(() => fitPolyRidge(allPoints, degree, lambda), [allPoints, degree, lambda]);

  // Evaluate Train MSE & True-Distribution Test MSE
  const { trainMse, testMse, weightNorm } = useMemo(() => {
    const tr =
      allPoints.reduce((s, p) => s + Math.pow(evalPoly(weights, p.x) - p.y, 2), 0) /
      Math.max(1, allPoints.length);
    let te = 0;
    const gridN = 80;
    for (let i = 0; i < gridN; i++) {
      const x = -1 + (2 * i) / (gridN - 1);
      te += Math.pow(evalPoly(weights, x) - trueFn(x), 2);
    }
    te = te / gridN + noise * noise;
    const wn = Math.sqrt(weights.slice(1).reduce((s, v) => s + v * v, 0));
    return { trainMse: tr, testMse: te, weightNorm: wn };
  }, [allPoints, weights, noise]);

  // Bias-Variance ensemble (22 resampled datasets)
  const bvData = useMemo(() => {
    const numModels = 22;
    const gridN = 65;
    const xs = Array.from({ length: gridN }, (_, i) => -1 + (2 * i) / (gridN - 1));
    const curves: number[][] = [];
    for (let m = 0; m < numModels; m++) {
      const ds = generateDataset(14, noise, seed + 100 + m * 17);
      const w = fitPolyRidge(ds, degree, lambda);
      curves.push(xs.map((x) => Math.max(-2.2, Math.min(2.2, evalPoly(w, x)))));
    }
    const meanCurve = xs.map(
      (_, i) => curves.reduce((s, c) => s + c[i], 0) / numModels
    );
    let biasSq = 0;
    let variance = 0;
    for (let i = 0; i < gridN; i++) {
      const truth = trueFn(xs[i]);
      biasSq += Math.pow(meanCurve[i] - truth, 2);
      const v =
        curves.reduce((s, c) => s + Math.pow(c[i] - meanCurve[i], 2), 0) / numModels;
      variance += v;
    }
    biasSq /= gridN;
    variance /= gridN;
    return { xs, curves, meanCurve, biasSq, variance, irr: noise * noise };
  }, [degree, lambda, noise, seed]);

  // SVG Coordinate Mapping
  const W = 580;
  const H = 300;
  const padL = 40;
  const padR = 16;
  const padT = 18;
  const padB = 28;
  const toSvgX = (x: number) => padL + ((x + 1) / 2) * (W - padL - padR);
  const toSvgY = (y: number) => padT + ((1.6 - Math.max(-1.6, Math.min(1.6, y))) / 3.2) * (H - padT - padB);

  const handleSvgClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (mode !== 'fit') return;
    const rect = e.currentTarget.getBoundingClientRect();
    const sx = ((e.clientX - rect.left) / rect.width) * W;
    const sy = ((e.clientY - rect.top) / rect.height) * H;
    const x = ((sx - padL) / (W - padL - padR)) * 2 - 1;
    const y = 1.6 - ((sy - padT) / (H - padT - padB)) * 3.2;
    if (x >= -1 && x <= 1 && y >= -1.5 && y <= 1.5) {
      setCustomPoints((prev) => [...prev, { x, y }]);
    }
  };

  const makePath = (fn: (x: number) => number) => {
    const pts: string[] = [];
    for (let i = 0; i <= 100; i++) {
      const x = -1 + (2 * i) / 100;
      const y = fn(x);
      pts.push(`${i === 0 ? 'M' : 'L'} ${toSvgX(x).toFixed(1)} ${toSvgY(y).toFixed(1)}`);
    }
    return pts.join(' ');
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50/80 px-5 py-3.5 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-2">
          <Sliders className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            交互实验室 1A · 多项式回归、Ridge 正则化与 Bias-Variance 分解
          </h3>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-slate-200 bg-white p-0.5 text-xs font-medium dark:border-slate-700 dark:bg-slate-800">
            <button
              onClick={() => setMode('fit')}
              className={`rounded-md px-3 py-1 transition cursor-pointer ${
                mode === 'fit'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-300'
              }`}
            >
              拟合与正则化
            </button>
            <button
              onClick={() => setMode('bv')}
              className={`rounded-md px-3 py-1 transition cursor-pointer ${
                mode === 'bv'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-300'
              }`}
            >
              Bias²–Variance 22 次重采样
            </button>
          </div>
          <button
            onClick={() => {
              setSeed((s) => s + 1);
              setCustomPoints([]);
            }}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 cursor-pointer"
          >
            <RefreshCw className="h-3.5 w-3.5" /> 重新采样
          </button>
        </div>
      </div>

      <div className="p-5 grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: SVG Plot */}
        <div className="lg:col-span-8 space-y-2.5">
          <div className="relative rounded-xl border border-slate-200 bg-slate-50/70 p-2 dark:border-slate-800 dark:bg-slate-950/70">
            <svg
              viewBox={`0 0 ${W} ${H}`}
              onClick={handleSvgClick}
              className={`w-full h-auto ${mode === 'fit' ? 'cursor-crosshair' : ''}`}
            >
              {/* Grid lines */}
              {[-1, -0.5, 0, 0.5, 1].map((gx) => (
                <line
                  key={`x-${gx}`}
                  x1={toSvgX(gx)}
                  x2={toSvgX(gx)}
                  y1={padT}
                  y2={H - padB}
                  className="stroke-slate-200 dark:stroke-slate-800"
                  strokeDasharray="3 3"
                />
              ))}
              {[-1, 0, 1].map((gy) => (
                <g key={`y-${gy}`}>
                  <line
                    x1={padL}
                    x2={W - padR}
                    y1={toSvgY(gy)}
                    y2={toSvgY(gy)}
                    className="stroke-slate-200 dark:stroke-slate-800"
                    strokeDasharray="3 3"
                  />
                  <text
                    x={padL - 8}
                    y={toSvgY(gy) + 3}
                    textAnchor="end"
                    className="fill-slate-400 text-[10px] font-mono"
                  >
                    {gy.toFixed(1)}
                  </text>
                </g>
              ))}

              {/* True Latent Function */}
              <path
                d={makePath(trueFn)}
                fill="none"
                stroke="#10b981"
                strokeWidth={2}
                strokeDasharray="6 4"
              />

              {mode === 'fit' ? (
                <>
                  {/* Fitted Polynomial */}
                  <path
                    d={makePath((x) => evalPoly(weights, x))}
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth={3}
                  />
                  {/* Residual Stems */}
                  {allPoints.map((pt, idx) => (
                    <line
                      key={`res-${idx}`}
                      x1={toSvgX(pt.x)}
                      x2={toSvgX(pt.x)}
                      y1={toSvgY(pt.y)}
                      y2={toSvgY(evalPoly(weights, pt.x))}
                      stroke="#f43f5e"
                      strokeOpacity={0.45}
                      strokeWidth={1.5}
                    />
                  ))}
                  {/* Data Points */}
                  {allPoints.map((pt, idx) => (
                    <circle
                      key={`pt-${idx}`}
                      cx={toSvgX(pt.x)}
                      cy={toSvgY(pt.y)}
                      r={idx >= basePoints.length ? 5.5 : 4.5}
                      className={
                        idx >= basePoints.length
                          ? 'fill-amber-500 stroke-white dark:stroke-slate-900'
                          : 'fill-slate-900 stroke-white dark:fill-blue-300 dark:stroke-slate-900'
                      }
                      strokeWidth={1.5}
                    />
                  ))}
                </>
              ) : (
                <>
                  {/* 22 Resampled Fitted Curves */}
                  {bvData.curves.map((curve, idx) => {
                    const d = bvData.xs
                      .map(
                        (x, i) =>
                          `${i === 0 ? 'M' : 'L'} ${toSvgX(x).toFixed(1)} ${toSvgY(curve[i]).toFixed(1)}`
                      )
                      .join(' ');
                    return (
                      <path
                        key={idx}
                        d={d}
                        fill="none"
                        stroke="#3b82f6"
                        strokeOpacity={0.22}
                        strokeWidth={1.4}
                      />
                    );
                  })}
                  {/* Mean Predictor */}
                  <path
                    d={bvData.xs
                      .map(
                        (x, i) =>
                          `${i === 0 ? 'M' : 'L'} ${toSvgX(x).toFixed(1)} ${toSvgY(
                            bvData.meanCurve[i]
                          ).toFixed(1)}`
                      )
                      .join(' ')}
                    fill="none"
                    stroke="#f43f5e"
                    strokeWidth={3}
                  />
                </>
              )}
            </svg>

            <div className="mt-1.5 flex flex-wrap items-center justify-between px-2 text-[11px] text-slate-500">
              <div className="flex flex-wrap gap-3">
                <span className="inline-flex items-center gap-1">
                  <span className="h-0.5 w-4 bg-emerald-500 inline-block" /> 真实函数 f(x)
                </span>
                {mode === 'fit' ? (
                  <>
                    <span className="inline-flex items-center gap-1">
                      <span className="h-0.5 w-4 bg-blue-500 inline-block" /> 拟合曲线 ŷ(x)
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full bg-amber-500 inline-block" /> 点击新增点 ({customPoints.length})
                    </span>
                  </>
                ) : (
                  <>
                    <span className="inline-flex items-center gap-1">
                      <span className="h-0.5 w-4 bg-blue-500/40 inline-block" /> 22 个样本集拟合曲线（分散度 = Variance）
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <span className="h-0.5 w-4 bg-rose-500 inline-block" /> 平均预测 E[f̂(x)]（与绿线差距 = Bias）
                    </span>
                  </>
                )}
              </div>
              {mode === 'fit' && (
                <span className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400">
                  <MousePointerClick className="h-3.5 w-3.5" /> 点击画布任意位置添加异常点试试！
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right: Controls & Metrics */}
        <div className="lg:col-span-4 flex flex-col justify-between gap-4">
          <div className="space-y-4 rounded-xl border border-slate-200 p-4 dark:border-slate-800">
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="font-medium">多项式阶数 Degree (d)</span>
                <span className="font-mono font-bold text-blue-600 dark:text-blue-400">d = {degree}</span>
              </div>
              <input
                type="range"
                min={1}
                max={10}
                step={1}
                value={degree}
                onChange={(e) => setDegree(parseInt(e.target.value, 10))}
                className="w-full"
              />
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>1 (欠拟合 / 高 Bias)</span>
                <span>10 (过拟合 / 高 Variance)</span>
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="font-medium">Ridge 正则强度 λ</span>
                <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                  {lambda < 0.001 ? lambda.toExponential(0) : lambda.toFixed(3)}
                </span>
              </div>
              <input
                type="range"
                min={-6}
                max={1}
                step={0.25}
                value={logLambda}
                onChange={(e) => setLogLambda(parseFloat(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>无惩罚 (1e-6)</span>
                <span>强 L2 约束 (10)</span>
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="font-medium">数据观测噪声 σ</span>
                <span className="font-mono font-bold text-slate-600 dark:text-slate-300">
                  {noise.toFixed(2)}
                </span>
              </div>
              <input
                type="range"
                min={0.05}
                max={0.45}
                step={0.02}
                value={noise}
                onChange={(e) => setNoise(parseFloat(e.target.value))}
                className="w-full"
              />
            </div>
          </div>

          {mode === 'fit' ? (
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950/60">
                <div className="text-[10px] text-slate-500">Train MSE</div>
                <div className="mt-1 font-mono text-base font-bold text-blue-600 dark:text-blue-400">
                  {trainMse.toFixed(3)}
                </div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950/60">
                <div className="text-[10px] text-slate-500">Test MSE</div>
                <div className="mt-1 font-mono text-base font-bold text-rose-600 dark:text-rose-400">
                  {testMse > 99 ? '>99' : testMse.toFixed(3)}
                </div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950/60">
                <div className="text-[10px] text-slate-500">‖w‖₂ 权重范数</div>
                <div className="mt-1 font-mono text-base font-bold text-violet-600 dark:text-violet-400">
                  {weightNorm > 999 ? '>999' : weightNorm.toFixed(1)}
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 space-y-2.5 dark:border-slate-800 dark:bg-slate-950/60">
              <div className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                期望测试误差 = Bias² + Variance + σ²
              </div>
              {[
                { label: 'Bias² (偏差平方)', val: bvData.biasSq, color: 'bg-rose-500' },
                { label: 'Variance (方差)', val: bvData.variance, color: 'bg-blue-500' },
                { label: 'Noise σ² (不可约误差)', val: bvData.irr, color: 'bg-slate-400' },
              ].map((item) => (
                <div key={item.label} className="space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-600 dark:text-slate-300">{item.label}</span>
                    <span className="font-mono font-semibold">{item.val.toFixed(3)}</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full ${item.color} transition-all duration-200`}
                      style={{ width: `${Math.min(100, (item.val / 0.6) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
