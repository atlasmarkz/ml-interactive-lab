import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, Layers } from 'lucide-react';

interface Sample2D {
  x1: number; // in [-2, 2]
  x2: number; // in [-2, 2]
  y: 0 | 1 | 2;
}

// Curated 2D projection inspired by Iris (standardized Petal Length & Petal Width)
const INITIAL_SAMPLES: Sample2D[] = [
  // Class 0 (Setosa - lower left)
  { x1: -1.35, x2: -1.25, y: 0 }, { x1: -1.15, x2: -1.35, y: 0 }, { x1: -1.42, x2: -1.05, y: 0 },
  { x1: -1.05, x2: -1.12, y: 0 }, { x1: -1.28, x2: -0.92, y: 0 }, { x1: -0.95, x2: -1.28, y: 0 },
  { x1: -1.5, x2: -1.18, y: 0 }, { x1: -1.18, x2: -0.82, y: 0 }, { x1: -0.88, x2: -1.02, y: 0 },
  { x1: -1.32, x2: -1.42, y: 0 },
  // Class 1 (Versicolor - center)
  { x1: -0.15, x2: -0.05, y: 1 }, { x1: 0.12, x2: 0.18, y: 1 }, { x1: -0.25, x2: 0.22, y: 1 },
  { x1: 0.28, x2: -0.15, y: 1 }, { x1: 0.05, x2: 0.35, y: 1 }, { x1: -0.32, x2: -0.18, y: 1 },
  { x1: 0.38, x2: 0.08, y: 1 }, { x1: -0.08, x2: 0.42, y: 1 }, { x1: 0.18, x2: -0.28, y: 1 },
  { x1: 0.45, x2: 0.25, y: 1 },
  // Class 2 (Virginica - upper right)
  { x1: 0.95, x2: 1.05, y: 2 }, { x1: 1.25, x2: 1.18, y: 2 }, { x1: 1.12, x2: 0.85, y: 2 },
  { x1: 0.82, x2: 1.28, y: 2 }, { x1: 1.42, x2: 0.95, y: 2 }, { x1: 1.08, x2: 1.38, y: 2 },
  { x1: 0.68, x2: 0.92, y: 2 }, { x1: 1.35, x2: 1.32, y: 2 }, { x1: 0.92, x2: 0.68, y: 2 },
  { x1: 1.48, x2: 1.12, y: 2 },
];

const CLASS_RGB: [number, number, number][] = [
  [59, 130, 246], // Blue
  [16, 185, 129], // Emerald
  [244, 63, 94],  // Rose
];
const CLASS_HEX = ['#2563eb', '#059669', '#e11d48'];
const CLASS_NAMES = ['Setosa (类 0)', 'Versicolor (类 1)', 'Virginica (类 2)'];

function softmax3(z0: number, z1: number, z2: number, temp: number): [number, number, number] {
  const s0 = z0 / temp;
  const s1 = z1 / temp;
  const s2 = z2 / temp;
  const m = Math.max(s0, s1, s2);
  const e0 = Math.exp(s0 - m);
  const e1 = Math.exp(s1 - m);
  const e2 = Math.exp(s2 - m);
  const sum = e0 + e1 + e2;
  return [e0 / sum, e1 / sum, e2 / sum];
}

interface Gaussian2D {
  prior: number;
  mx: number;
  my: number;
  sxx: number;
  sxy: number;
  syy: number;
}

function fitGDA(samples: Sample2D[], sharedCov: boolean): Gaussian2D[] {
  const N = samples.length;
  const classes: (0 | 1 | 2)[] = [0, 1, 2];
  const stats = classes.map((c) => {
    const pts = samples.filter((s) => s.y === c);
    const n = Math.max(1, pts.length);
    const mx = pts.reduce((a, p) => a + p.x1, 0) / n;
    const my = pts.reduce((a, p) => a + p.x2, 0) / n;
    let sxx = 0.08;
    let sxy = 0;
    let syy = 0.08;
    for (const p of pts) {
      sxx += (p.x1 - mx) * (p.x1 - mx);
      sxy += (p.x1 - mx) * (p.x2 - my);
      syy += (p.x2 - my) * (p.x2 - my);
    }
    return { prior: n / N, mx, my, sxx: sxx / n, sxy: sxy / n, syy: syy / n };
  });

  if (sharedCov) {
    const avgXX = stats.reduce((a, s) => a + s.prior * s.sxx, 0);
    const avgXY = stats.reduce((a, s) => a + s.prior * s.sxy, 0);
    const avgYY = stats.reduce((a, s) => a + s.prior * s.syy, 0);
    return stats.map((s) => ({ ...s, sxx: avgXX, sxy: avgXY, syy: avgYY }));
  }
  return stats;
}

function gdaLogProb(g: Gaussian2D, x: number, y: number): number {
  const det = Math.max(1e-5, g.sxx * g.syy - g.sxy * g.sxy);
  const dx = x - g.mx;
  const dy = y - g.my;
  const invXX = g.syy / det;
  const invXY = -g.sxy / det;
  const invYY = g.sxx / det;
  const quad = dx * dx * invXX + 2 * dx * dy * invXY + dy * dy * invYY;
  return Math.log(g.prior + 1e-6) - 0.5 * Math.log(det) - 0.5 * quad;
}

export const Part1SoftmaxGDALab: React.FC = () => {
  const [modelType, setModelType] = useState<'softmax' | 'lda' | 'qda'>('softmax');
  const [samples, setSamples] = useState<Sample2D[]>(INITIAL_SAMPLES);
  const [activeClass, setActiveClass] = useState<0 | 1 | 2>(0);
  const [temperature, setTemperature] = useState(1.0);
  const [reg, setReg] = useState(0.05);
  const [isTraining, setIsTraining] = useState(false);

  // Softmax parameters: W is 3 classes x 3 (w1, w2, b)
  const [W, setW] = useState<number[][]>([
    [-1.2, -1.1, -0.3],
    [0.1, 0.2, 0.8],
    [1.3, 1.2, -0.4],
  ]);
  const [epoch, setEpoch] = useState(0);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  const gdaModels = useMemo(
    () => fitGDA(samples, modelType === 'lda'),
    [samples, modelType]
  );

  // Compute current softmax loss & accuracy
  const metrics = useMemo(() => {
    let loss = 0;
    let correct = 0;
    for (const s of samples) {
      let probs: [number, number, number];
      if (modelType === 'softmax') {
        const z0 = W[0][0] * s.x1 + W[0][1] * s.x2 + W[0][2];
        const z1 = W[1][0] * s.x1 + W[1][1] * s.x2 + W[1][2];
        const z2 = W[2][0] * s.x1 + W[2][1] * s.x2 + W[2][2];
        probs = softmax3(z0, z1, z2, temperature);
      } else {
        const l0 = gdaLogProb(gdaModels[0], s.x1, s.x2);
        const l1 = gdaLogProb(gdaModels[1], s.x1, s.x2);
        const l2 = gdaLogProb(gdaModels[2], s.x1, s.x2);
        probs = softmax3(l0, l1, l2, 1.0);
      }
      loss += -Math.log(Math.max(1e-7, probs[s.y]));
      const pred = probs[0] >= probs[1] && probs[0] >= probs[2] ? 0 : probs[1] >= probs[2] ? 1 : 2;
      if (pred === s.y) correct++;
    }
    const regTerm =
      modelType === 'softmax'
        ? 0.5 * reg * W.reduce((acc, row) => acc + row[0] * row[0] + row[1] * row[1], 0)
        : 0;
    return {
      loss: loss / samples.length + regTerm,
      acc: (correct / samples.length) * 100,
    };
  }, [samples, W, modelType, temperature, reg, gdaModels]);

  // Softmax gradient descent loop
  useEffect(() => {
    if (!isTraining || modelType !== 'softmax') return;
    const timer = window.setInterval(() => {
      setW((prev) => {
        const grad = [
          [0, 0, 0],
          [0, 0, 0],
          [0, 0, 0],
        ];
        for (const s of samples) {
          const z0 = prev[0][0] * s.x1 + prev[0][1] * s.x2 + prev[0][2];
          const z1 = prev[1][0] * s.x1 + prev[1][1] * s.x2 + prev[1][2];
          const z2 = prev[2][0] * s.x1 + prev[2][1] * s.x2 + prev[2][2];
          const p = softmax3(z0, z1, z2, temperature);
          for (let c = 0; c < 3; c++) {
            const diff = (p[c] - (s.y === c ? 1 : 0)) / (samples.length * temperature);
            grad[c][0] += diff * s.x1;
            grad[c][1] += diff * s.x2;
            grad[c][2] += diff;
          }
        }
        const lr = 0.25;
        return prev.map((row, c) => [
          row[0] - lr * (grad[c][0] + reg * row[0]),
          row[1] - lr * (grad[c][1] + reg * row[1]),
          row[2] - lr * grad[c][2],
        ]);
      });
      setEpoch((e) => e + 1);
    }, 45);
    return () => window.clearInterval(timer);
  }, [isTraining, modelType, samples, temperature, reg]);

  // Draw 2D decision boundary + points + Gaussian ellipses
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = 340;
    const grid = 85; // fast smooth heatmap
    const cell = size / grid;

    ctx.clearRect(0, 0, size, size);

    for (let gy = 0; gy < grid; gy++) {
      const x2 = 2 - ((gy + 0.5) / grid) * 4;
      for (let gx = 0; gx < grid; gx++) {
        const x1 = -2 + ((gx + 0.5) / grid) * 4;
        let probs: [number, number, number];
        if (modelType === 'softmax') {
          probs = softmax3(
            W[0][0] * x1 + W[0][1] * x2 + W[0][2],
            W[1][0] * x1 + W[1][1] * x2 + W[1][2],
            W[2][0] * x1 + W[2][1] * x2 + W[2][2],
            temperature
          );
        } else {
          probs = softmax3(
            gdaLogProb(gdaModels[0], x1, x2),
            gdaLogProb(gdaModels[1], x1, x2),
            gdaLogProb(gdaModels[2], x1, x2),
            1.0
          );
        }
        const r = Math.round(
          255 * 0.62 + 0.38 * (probs[0] * CLASS_RGB[0][0] + probs[1] * CLASS_RGB[1][0] + probs[2] * CLASS_RGB[2][0])
        );
        const g = Math.round(
          255 * 0.62 + 0.38 * (probs[0] * CLASS_RGB[0][1] + probs[1] * CLASS_RGB[1][1] + probs[2] * CLASS_RGB[2][1])
        );
        const b = Math.round(
          255 * 0.62 + 0.38 * (probs[0] * CLASS_RGB[0][2] + probs[1] * CLASS_RGB[1][2] + probs[2] * CLASS_RGB[2][2])
        );
        ctx.fillStyle = `rgb(${r},${g},${b})`;
        ctx.fillRect(gx * cell, gy * cell, cell + 0.6, cell + 0.6);
      }
    }

    const toPxX = (x1: number) => ((x1 + 2) / 4) * size;
    const toPxY = (x2: number) => ((2 - x2) / 4) * size;

    // Draw GDA 1.5-sigma covariance ellipses
    if (modelType !== 'softmax') {
      gdaModels.forEach((g, idx) => {
        const trace = g.sxx + g.syy;
        const det = g.sxx * g.syy - g.sxy * g.sxy;
        const disc = Math.sqrt(Math.max(0, trace * trace / 4 - det));
        const l1 = Math.max(0.02, trace / 2 + disc);
        const l2 = Math.max(0.02, trace / 2 - disc);
        const angle = 0.5 * Math.atan2(2 * g.sxy, g.sxx - g.syy);

        ctx.save();
        ctx.translate(toPxX(g.mx), toPxY(g.my));
        ctx.rotate(-angle);
        ctx.strokeStyle = CLASS_HEX[idx];
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 3]);
        ctx.beginPath();
        ctx.ellipse(0, 0, Math.sqrt(l1) * 1.5 * (size / 4), Math.sqrt(l2) * 1.5 * (size / 4), 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      });
    }

    // Draw sample dots
    for (const s of samples) {
      ctx.beginPath();
      ctx.arc(toPxX(s.x1), toPxY(s.x2), 5.5, 0, Math.PI * 2);
      ctx.fillStyle = CLASS_HEX[s.y];
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#ffffff';
      ctx.stroke();
    }
  }, [samples, W, modelType, temperature, gdaModels]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x1 = ((e.clientX - rect.left) / rect.width) * 4 - 2;
    const x2 = 2 - ((e.clientY - rect.top) / rect.height) * 4;
    setSamples((prev) => [...prev, { x1, x2, y: activeClass }]);
  };

  const resetWeights = () => {
    setIsTraining(false);
    setEpoch(0);
    setW([
      [0.1, -0.1, 0],
      [-0.1, 0.1, 0],
      [0.05, 0.05, 0],
    ]);
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50/80 px-5 py-3.5 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            交互实验室 1B · 判别式 Softmax 回归 vs 生成式分类 (LDA / QDA)
          </h3>
        </div>

        <div className="flex rounded-lg border border-slate-200 bg-white p-0.5 text-xs font-medium dark:border-slate-700 dark:bg-slate-800">
          {[
            { id: 'softmax', label: 'Softmax (判别式)' },
            { id: 'lda', label: 'LDA (共享 Σ · 线性)' },
            { id: 'qda', label: 'QDA (独立 Σ_k · 二次)' },
          ].map((m) => (
            <button
              key={m.id}
              onClick={() => {
                setIsTraining(false);
                setModelType(m.id as 'softmax' | 'lda' | 'qda');
              }}
              className={`rounded-md px-2.5 py-1 transition cursor-pointer ${
                modelType === m.id
                  ? 'bg-emerald-600 text-white'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-300'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-5 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Canvas */}
        <div className="lg:col-span-6 flex flex-col items-center gap-2.5">
          <canvas
            ref={canvasRef}
            width={340}
            height={340}
            onClick={handleCanvasClick}
            className="w-full max-w-[340px] aspect-square rounded-xl border border-slate-300 shadow-inner cursor-crosshair dark:border-slate-700"
          />
          <div className="flex flex-wrap items-center justify-center gap-2 text-xs">
            <span className="text-slate-500">点击画布添加类别点：</span>
            {([0, 1, 2] as const).map((c) => (
              <button
                key={c}
                onClick={() => setActiveClass(c)}
                className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium cursor-pointer transition ${
                  activeClass === c
                    ? 'border-slate-900 bg-slate-900 text-white dark:border-white dark:bg-white dark:text-slate-900'
                    : 'border-slate-200 bg-white text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
                }`}
              >
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: CLASS_HEX[c] }} />
                {CLASS_NAMES[c]}
              </button>
            ))}
          </div>
        </div>

        {/* Right Controls */}
        <div className="lg:col-span-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 dark:border-slate-800 dark:bg-slate-950/60">
              <div className="text-[11px] text-slate-500">交叉熵损失 (NLL + L2)</div>
              <div className="mt-1 font-mono text-2xl font-bold text-rose-600 dark:text-rose-400">
                {metrics.loss.toFixed(3)}
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 dark:border-slate-800 dark:bg-slate-950/60">
              <div className="text-[11px] text-slate-500">分类准确率 (Accuracy)</div>
              <div className="mt-1 font-mono text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                {metrics.acc.toFixed(1)}%
              </div>
            </div>
          </div>

          {modelType === 'softmax' ? (
            <div className="rounded-xl border border-slate-200 p-4 space-y-3.5 dark:border-slate-800">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-semibold">梯度下降训练 (Epoch: {epoch})</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setIsTraining((v) => !v)}
                    className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-500 cursor-pointer"
                  >
                    {isTraining ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                    {isTraining ? '暂停' : '训练 Softmax'}
                  </button>
                  <button
                    onClick={resetWeights}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    <RotateCcw className="h-3.5 w-3.5" /> 归零权重
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span>Softmax 温度系数 T（越高越平滑，越低越锐利）</span>
                  <span className="font-mono font-bold text-amber-600">{temperature.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min={0.2}
                  max={3.0}
                  step={0.1}
                  value={temperature}
                  onChange={(e) => setTemperature(parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span>L2 正则化系数 λ</span>
                  <span className="font-mono font-bold text-violet-600">{reg.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={0.5}
                  step={0.01}
                  value={reg}
                  onChange={(e) => setReg(parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-emerald-200/80 bg-emerald-50/40 p-4 text-xs leading-relaxed text-slate-700 dark:border-emerald-900/50 dark:bg-emerald-950/20 dark:text-slate-300 space-y-2">
              <div className="font-semibold text-emerald-800 dark:text-emerald-300">
                {modelType === 'lda'
                  ? 'LDA（Linear Discriminant Analysis）：所有类别共享协方差矩阵 Σ'
                  : 'QDA（Quadratic Discriminant Analysis）：每个类别拥有独立协方差 Σ_k'}
              </div>
              <p>
                生成式模型先对每个类别拟合类条件高斯分布 p(x | y=k) = N(μ_k, Σ_k)（虚线椭圆为 1.5σ 等高线），再通过贝叶斯定理推导后验概率 P(y=k | x)。
              </p>
              <p>
                {modelType === 'lda'
                  ? '当所有类别共享同一个 Σ 时，对数后验里的二次项 xᵀΣ⁻¹x 相减消掉，因此决策边界严格是线性的！'
                  : '当各类别 Σ_k 不同时，二次项保留，决策边界变为弯曲的二次曲线！试着把某类点拖拉成长条状切换 LDA/QDA 对比。'}
              </p>
            </div>
          )}

          <div className="flex justify-end">
            <button
              onClick={() => {
                setSamples(INITIAL_SAMPLES);
                resetWeights();
              }}
              className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 underline cursor-pointer"
            >
              恢复默认 Iris 2D 数据集
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
