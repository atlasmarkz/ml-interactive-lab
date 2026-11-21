import React, { useMemo, useState } from 'react';
import { Grid3X3, TrendingDown } from 'lucide-react';

const PRESET_GRIDS: Record<string, number[][]> = {
  '竖边 Edge': [
    [0, 0, 0, 1, 1, 1, 1],
    [0, 0, 0, 1, 1, 1, 1],
    [0, 0, 0, 1, 1, 1, 1],
    [0, 0, 0, 1, 1, 1, 1],
    [0, 0, 0, 1, 1, 1, 1],
    [0, 0, 0, 1, 1, 1, 1],
    [0, 0, 0, 1, 1, 1, 1],
  ],
  '十字 Cross': [
    [0, 0, 0, 1, 0, 0, 0],
    [0, 0, 0, 1, 0, 0, 0],
    [0, 0, 0, 1, 0, 0, 0],
    [1, 1, 1, 1, 1, 1, 1],
    [0, 0, 0, 1, 0, 0, 0],
    [0, 0, 0, 1, 0, 0, 0],
    [0, 0, 0, 1, 0, 0, 0],
  ],
  '方块 Box': [
    [0, 0, 0, 0, 0, 0, 0],
    [0, 1, 1, 1, 1, 1, 0],
    [0, 1, 0, 0, 0, 1, 0],
    [0, 1, 0, 0, 0, 1, 0],
    [0, 1, 0, 0, 0, 1, 0],
    [0, 1, 1, 1, 1, 1, 0],
    [0, 0, 0, 0, 0, 0, 0],
  ],
};

const KERNELS: Record<string, { desc: string; k: number[][] }> = {
  'Sobel 竖边': {
    desc: '检测左右亮度突变（垂直边缘）',
    k: [
      [-1, 0, 1],
      [-2, 0, 2],
      [-1, 0, 1],
    ],
  },
  'Sobel 横边': {
    desc: '检测上下亮度突变（水平边缘）',
    k: [
      [-1, -2, -1],
      [0, 0, 0],
      [1, 2, 1],
    ],
  },
  '拉普拉斯锐化': {
    desc: '突出中心像素与邻域的差异',
    k: [
      [0, -1, 0],
      [-1, 5, -1],
      [0, -1, 0],
    ],
  },
  '均值模糊': {
    desc: '3×3 局部平均降噪（权重均分）',
    k: [
      [0.11, 0.11, 0.11],
      [0.11, 0.12, 0.11],
      [0.11, 0.11, 0.11],
    ],
  },
};

export const Part2ConvRNNLab: React.FC = () => {
  const [tab, setTab] = useState<'cnn' | 'flow'>('cnn');

  // --- CNN Scanner State ---
  const [grid, setGrid] = useState<number[][]>(PRESET_GRIDS['十字 Cross']);
  const [kernelName, setKernelName] = useState<string>('Sobel 竖边');
  const [stride, setStride] = useState<1 | 2>(1);
  const [padding, setPadding] = useState<0 | 1>(0);
  const [hoverOut, setHoverOut] = useState<[number, number]>([1, 1]);

  const kernel = KERNELS[kernelName].k;

  const paddedGrid = useMemo(() => {
    if (padding === 0) return grid;
    const n = grid.length;
    const out = Array.from({ length: n + 2 }, () => Array(n + 2).fill(0));
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) out[r + 1][c + 1] = grid[r][c];
    }
    return out;
  }, [grid, padding]);

  const featureMap = useMemo(() => {
    const H = paddedGrid.length;
    const outSize = Math.floor((H - 3) / stride) + 1;
    const out: number[][] = [];
    for (let or = 0; or < outSize; or++) {
      const row: number[] = [];
      for (let oc = 0; oc < outSize; oc++) {
        let sum = 0;
        for (let kr = 0; kr < 3; kr++) {
          for (let kc = 0; kc < 3; kc++) {
            sum += paddedGrid[or * stride + kr][oc * stride + kc] * kernel[kr][kc];
          }
        }
        row.push(Number(sum.toFixed(2)));
      }
      out.push(row);
    }
    return out;
  }, [paddedGrid, kernel, stride]);

  const safeOutR = Math.min(hoverOut[0], featureMap.length - 1);
  const safeOutC = Math.min(hoverOut[1], featureMap[0].length - 1);
  const rfTop = safeOutR * stride;
  const rfLeft = safeOutC * stride;

  // --- Tab 2: Deep Gradient Flow (Plain / RNN vs ResNet / LSTM) ---
  const [depth, setDepth] = useState(20);
  const [wScale, setWScale] = useState(0.75);

  const gradCurves = useMemo(() => {
    const plain: number[] = [];
    const resnet: number[] = [];
    const lstm: number[] = [];
    for (let l = 0; l <= depth; l++) {
      // Plain / Vanilla RNN: |w|^l
      plain.push(Math.min(50, Math.pow(wScale, l)));
      // ResNet: y = x + F(x) => dy/dx = 1 + F'(x), residual branch weighted ~0.18
      resnet.push(Math.min(50, Math.pow(1 + 0.12 * (wScale - 0.7), l)));
      // LSTM cell state highway with forget gate ~0.95
      lstm.push(Math.pow(0.95, l));
    }
    return { plain, resnet, lstm };
  }, [depth, wScale]);

  const toFlowPath = (vals: number[]) => {
    const W = 520;
    const H = 200;
    const padL = 45;
    const padR = 16;
    const padT = 18;
    const padB = 28;
    // Log10 scale from 1e-4 to 1e1
    const minLog = -4;
    const maxLog = 1.5;
    return vals
      .map((v, i) => {
        const x = padL + (i / Math.max(1, vals.length - 1)) * (W - padL - padR);
        const lv = Math.max(minLog, Math.min(maxLog, Math.log10(Math.max(1e-5, v))));
        const y = padT + (1 - (lv - minLog) / (maxLog - minLog)) * (H - padT - padB);
        return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(' ');
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50/80 px-5 py-3.5 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-2">
          <Grid3X3 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            交互实验室 2B · CNN 卷积扫描器与 ResNet / RNN 梯度高速公路
          </h3>
        </div>
        <div className="flex rounded-lg border border-slate-200 bg-white p-0.5 text-xs font-medium dark:border-slate-700 dark:bg-slate-800">
          <button
            onClick={() => setTab('cnn')}
            className={`rounded-md px-3 py-1 transition cursor-pointer ${
              tab === 'cnn' ? 'bg-blue-600 text-white' : 'text-slate-600 dark:text-slate-300'
            }`}
          >
            CNN 感受野与卷积核
          </button>
          <button
            onClick={() => setTab('flow')}
            className={`rounded-md px-3 py-1 transition cursor-pointer ${
              tab === 'flow' ? 'bg-blue-600 text-white' : 'text-slate-600 dark:text-slate-300'
            }`}
          >
            ResNet / LSTM 缓解梯度消失
          </button>
        </div>
      </div>

      {tab === 'cnn' ? (
        <div className="p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-slate-500">输入图像：</span>
              {Object.keys(PRESET_GRIDS).map((name) => (
                <button
                  key={name}
                  onClick={() => setGrid(PRESET_GRIDS[name].map((r) => [...r]))}
                  className="rounded-lg border border-slate-200 px-2.5 py-1 hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800 cursor-pointer"
                >
                  {name}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <label className="inline-flex items-center gap-1.5">
                <span className="text-slate-500">Stride:</span>
                <select
                  value={stride}
                  onChange={(e) => setStride(Number(e.target.value) as 1 | 2)}
                  className="rounded-md border border-slate-300 bg-white px-2 py-0.5 dark:border-slate-700 dark:bg-slate-800"
                >
                  <option value={1}>1</option>
                  <option value={2}>2</option>
                </select>
              </label>
              <label className="inline-flex items-center gap-1.5">
                <span className="text-slate-500">Padding:</span>
                <select
                  value={padding}
                  onChange={(e) => setPadding(Number(e.target.value) as 0 | 1)}
                  className="rounded-md border border-slate-300 bg-white px-2 py-0.5 dark:border-slate-700 dark:bg-slate-800"
                >
                  <option value={0}>0 (Valid)</option>
                  <option value={1}>1 (Same)</option>
                </select>
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
            {/* Input Matrix */}
            <div className="md:col-span-5 flex flex-col items-center gap-2">
              <div className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                输入图像 ({paddedGrid.length}×{paddedGrid.length}{padding ? ', 含 0-Padding' : ''}) · 点击绘制像素
              </div>
              <div
                className="grid gap-1"
                style={{ gridTemplateColumns: `repeat(${paddedGrid.length}, minmax(0, 1fr))` }}
              >
                {paddedGrid.map((row, r) =>
                  row.map((val, c) => {
                    const inRF = r >= rfTop && r < rfTop + 3 && c >= rfLeft && c < rfLeft + 3;
                    const isPad =
                      padding === 1 &&
                      (r === 0 || c === 0 || r === paddedGrid.length - 1 || c === paddedGrid.length - 1);
                    return (
                      <button
                        key={`${r}-${c}`}
                        onClick={() => {
                          if (isPad) return;
                          const gr = r - padding;
                          const gc = c - padding;
                          setGrid((prev) =>
                            prev.map((pr, ri) =>
                              pr.map((pv, ci) => (ri === gr && ci === gc ? (pv ? 0 : 1) : pv))
                            )
                          );
                        }}
                        className={`h-7 w-7 rounded text-[11px] font-mono font-bold transition cursor-pointer ${
                          isPad
                            ? 'bg-slate-100 text-slate-400 border border-dashed border-slate-300 dark:bg-slate-900 dark:border-slate-700'
                            : val
                            ? 'bg-slate-800 text-white dark:bg-blue-500'
                            : 'bg-slate-200/80 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                        } ${inRF ? 'ring-2 ring-amber-500 scale-105 z-10' : ''}`}
                      >
                        {val}
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* Kernel Selector */}
            <div className="md:col-span-3 flex flex-col items-center gap-2.5">
              <div className="text-xs font-semibold text-violet-600 dark:text-violet-400">
                3×3 卷积核 (Kernel)
              </div>
              <div className="grid grid-cols-3 gap-1">
                {kernel.flat().map((w, idx) => (
                  <div
                    key={idx}
                    className={`h-9 w-9 rounded-lg flex items-center justify-center font-mono text-xs font-bold border ${
                      w > 0
                        ? 'bg-violet-50 border-violet-300 text-violet-800 dark:bg-violet-950/60 dark:border-violet-700 dark:text-violet-200'
                        : w < 0
                        ? 'bg-rose-50 border-rose-300 text-rose-800 dark:bg-rose-950/60 dark:border-rose-700 dark:text-rose-200'
                        : 'bg-slate-50 border-slate-200 text-slate-400 dark:bg-slate-800 dark:border-slate-700'
                    }`}
                  >
                    {w}
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap justify-center gap-1">
                {Object.keys(KERNELS).map((kName) => (
                  <button
                    key={kName}
                    onClick={() => setKernelName(kName)}
                    className={`rounded-md px-2 py-0.5 text-[11px] cursor-pointer transition ${
                      kernelName === kName
                        ? 'bg-violet-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
                    }`}
                  >
                    {kName}
                  </button>
                ))}
              </div>
              <div className="text-[11px] text-center text-slate-500">{KERNELS[kernelName].desc}</div>
            </div>

            {/* Output Feature Map */}
            <div className="md:col-span-4 flex flex-col items-center gap-2">
              <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                输出特征图 ({featureMap.length}×{featureMap[0].length}) · 悬停定位感受野
              </div>
              <div
                className="grid gap-1"
                style={{ gridTemplateColumns: `repeat(${featureMap[0].length}, minmax(0, 1fr))` }}
              >
                {featureMap.map((row, r) =>
                  row.map((val, c) => {
                    const active = r === safeOutR && c === safeOutC;
                    const intensity = Math.min(1, Math.abs(val) / 4);
                    const bg =
                      val > 0
                        ? `rgba(16, 185, 129, ${0.15 + intensity * 0.75})`
                        : val < 0
                        ? `rgba(244, 63, 94, ${0.15 + intensity * 0.75})`
                        : 'rgba(148, 163, 184, 0.15)';
                    return (
                      <div
                        key={`${r}-${c}`}
                        onMouseEnter={() => setHoverOut([r, c])}
                        onClick={() => setHoverOut([r, c])}
                        style={{ backgroundColor: bg }}
                        className={`h-8 w-8 rounded flex items-center justify-center font-mono text-[11px] font-bold cursor-pointer transition ${
                          active ? 'ring-2 ring-amber-500 scale-110 z-10' : ''
                        }`}
                      >
                        {val}
                      </div>
                    );
                  })
                )}
              </div>
              <div className="font-mono text-[11px] text-slate-500">
                公式输出尺寸: ⌊(7 + 2×{padding} - 3) / {stride}⌋ + 1 = {featureMap.length}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-5 grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
          <div className="lg:col-span-7 rounded-xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-950/70">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="font-semibold flex items-center gap-1.5">
                <TrendingDown className="h-3.5 w-3.5 text-rose-500" />
                梯度幅值随层数 / 时间步衰减对比（对数坐标 log₁₀）
              </span>
              <div className="flex gap-3 text-[11px]">
                <span className="text-rose-600 font-semibold">● Plain / RNN (w^L)</span>
                <span className="text-emerald-600 font-semibold">● ResNet (1 + F&apos;)</span>
                <span className="text-blue-600 font-semibold">● LSTM (遗忘门 0.95)</span>
              </div>
            </div>
            <svg viewBox="0 0 520 200" className="w-full h-auto">
              {[-4, -2, 0, 1].map((lv) => {
                const y = 18 + (1 - (lv - -4) / 5.5) * (200 - 46);
                return (
                  <g key={lv}>
                    <line
                      x1={45}
                      x2={504}
                      y1={y}
                      y2={y}
                      className="stroke-slate-200 dark:stroke-slate-800"
                      strokeDasharray={lv === 0 ? undefined : '3 3'}
                    />
                    <text x={38} y={y + 3} textAnchor="end" className="fill-slate-400 text-[10px] font-mono">
                      10^{lv}
                    </text>
                  </g>
                );
              })}
              <path d={toFlowPath(gradCurves.plain)} fill="none" stroke="#f43f5e" strokeWidth={2.5} />
              <path d={toFlowPath(gradCurves.resnet)} fill="none" stroke="#10b981" strokeWidth={2.5} />
              <path d={toFlowPath(gradCurves.lstm)} fill="none" stroke="#3b82f6" strokeWidth={2.2} strokeDasharray="5 3" />
            </svg>
          </div>

          <div className="lg:col-span-5 space-y-4">
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span>网络深度 / 序列长度 L</span>
                <span className="font-mono font-bold text-blue-600">{depth} 层</span>
              </div>
              <input
                type="range"
                min={5}
                max={30}
                value={depth}
                onChange={(e) => setDepth(parseInt(e.target.value, 10))}
                className="w-full"
              />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span>单层雅可比特征值 |w|</span>
                <span className="font-mono font-bold text-rose-600">{wScale.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min={0.45}
                max={1.25}
                step={0.05}
                value={wScale}
                onChange={(e) => setWScale(parseFloat(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>&lt; 1 梯度消失</span>
                <span>= 1 临界稳定</span>
                <span>&gt; 1 梯度爆炸</span>
              </div>
            </div>

            <div className="rounded-xl border border-emerald-200/80 bg-emerald-50/50 p-3.5 text-xs leading-relaxed text-slate-700 dark:border-emerald-900/50 dark:bg-emerald-950/20 dark:text-slate-300">
              <strong>核心直觉：</strong>普通深层网络与基础 RNN 在反向传播时不断连乘权重矩阵（w^L），只要 |w| 偏离 1 就会指数级消失或爆炸。
              <strong>ResNet</strong> 引入恒等跳连 y = x + F(x)，使梯度变为 1 + ∂F/∂x，永远保留一条“+1 梯度高速公路”；<strong>LSTM</strong> 则通过 Cell State 加法更新实现了时间维度上的类似机制。
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
