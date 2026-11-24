import React, { useMemo, useState } from 'react';
import { Controls, ExploreCard, LineChart, Readout, SERIES, Segmented, Slider, gaussian, linspace, mulberry32, sigmoid } from './kit';

/* ===================== L04 · Activations & vanishing gradients ===================== */

type Act = 'sigmoid' | 'tanh' | 'relu' | 'gelu';
const ACT: Record<Act, { f: (z: number) => number; d: (z: number) => number; label: string }> = {
  sigmoid: { f: sigmoid, d: (z) => sigmoid(z) * (1 - sigmoid(z)), label: 'sigmoid' },
  tanh: { f: Math.tanh, d: (z) => 1 - Math.tanh(z) ** 2, label: 'tanh' },
  relu: { f: (z) => Math.max(0, z), d: (z) => (z > 0 ? 1 : 0), label: 'ReLU' },
  gelu: {
    f: (z) => 0.5 * z * (1 + Math.tanh(0.79788456 * (z + 0.044715 * z ** 3))),
    d: (z) => {
      const h = 1e-4;
      return (ACT.gelu.f(z + h) - ACT.gelu.f(z - h)) / (2 * h);
    },
    label: 'GELU',
  },
};
const Z_SAMPLES = (() => {
  const r = mulberry32(11);
  return Array.from({ length: 400 }, () => gaussian(r));
})();

export const ActivationGradient: React.FC = () => {
  const [act, setAct] = useState<Act>('sigmoid');
  const [scale, setScale] = useState(1.5);
  const xs = linspace(-5, 5, 201);
  const A = ACT[act];
  // average log10 |g'(z)| per layer, z ~ N(0, scale²); for ReLU count only active units (inactive ones block the path entirely)
  const perLayer = (a: Act) => {
    const ds = Z_SAMPLES.map((z) => ACT[a].d(z * scale)).filter((d) => d > 0);
    return ds.reduce((s, d) => s + Math.log10(d), 0) / ds.length;
  };
  const layers = linspace(0, 20, 21);
  const kinds: Act[] = ['sigmoid', 'tanh', 'relu', 'gelu'];

  return (
    <ExploreCard
      title="激活函数与梯度消失"
      prompt="左图是所选激活函数（实线）与它的导数（虚线）。右图模拟反向传播时梯度经过 $L$ 层激活后剩下的量级（只算激活导数的连乘，权重增益记为 1）。试着增大预激活的尺度。"
      insight="sigmoid 的导数最大只有 0.25，并且 $|z|$ 一大就趋于 0：20 层后梯度缩小十几个数量级——这就是隐藏层不用 sigmoid 的原因（WA2 Q4）。tanh 稍好（最大导数 1），ReLU 在激活的单元上导数恒为 1，路径上不会衰减（但关闭的单元会完全阻断梯度）。"
    >
      <Segmented value={act} onChange={setAct} options={kinds.map((k) => [k, ACT[k].label])} label="激活函数" />
      <div className="mt-3 grid gap-5 lg:grid-cols-2">
        <LineChart
          ariaLabel="激活函数及导数"
          xDomain={[-5, 5]}
          yDomain={[-1.2, 3]}
          xLabel="z"
          series={[
            { name: `${A.label}`, color: SERIES[0], points: xs.map((x) => [x, A.f(x)]) },
            { name: `导数`, color: SERIES[1], dashed: true, points: xs.map((x) => [x, A.d(x)]) },
          ]}
        />
        <LineChart
          ariaLabel="梯度量级随层数变化"
          xDomain={[0, 20]}
          yDomain={[-14, 1]}
          xLabel="回传经过的层数 L"
          yLabel="log10 |梯度|"
          series={kinds.map((k, i) => ({ name: ACT[k].label, color: SERIES[i], points: layers.map((l) => [l, l * perLayer(k)] as [number, number]) }))}
        />
      </div>
      <div className="mt-3">
        <Slider label="预激活尺度 $\sigma_z$（$z\sim\mathcal{N}(0,\sigma_z^2)$）" value={scale} min={0.2} max={4} step={0.1} onChange={setScale} format={(v) => v.toFixed(1)} />
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {kinds.map((k, i) => (
          <Readout key={k} color={SERIES[i]} label={`${ACT[k].label} · 每层平均 log10`} value={perLayer(k).toFixed(2)} />
        ))}
      </div>
    </ExploreCard>
  );
};

/* ===================== L05 · Optimizer race on a ravine ===================== */

const A_X = 0.5, A_Y = 10; // f = 0.5 (A_X x² + A_Y y²)
const fval = (x: number, y: number) => 0.5 * (A_X * x * x + A_Y * y * y);
type Opt = 'sgd' | 'momentum' | 'rmsprop' | 'adam';
const OPTS: Opt[] = ['sgd', 'momentum', 'rmsprop', 'adam'];
const OPT_LABEL: Record<Opt, string> = { sgd: 'SGD', momentum: 'Momentum', rmsprop: 'RMSProp', adam: 'Adam' };

function runOpt(kind: Opt, lr: number, steps: number, noise: number): [number, number][] {
  const r = mulberry32(5);
  let x = -4.5, y = 1.2;
  let vx = 0, vy = 0, sx = 0, sy = 0, mx = 0, my = 0;
  const path: [number, number][] = [[x, y]];
  for (let t = 1; t <= steps; t++) {
    const gx = A_X * x + noise * gaussian(r);
    const gy = A_Y * y + noise * gaussian(r);
    if (kind === 'sgd') { x -= lr * gx; y -= lr * gy; }
    if (kind === 'momentum') { vx = 0.9 * vx - lr * gx; vy = 0.9 * vy - lr * gy; x += vx; y += vy; }
    if (kind === 'rmsprop') {
      sx = 0.9 * sx + 0.1 * gx * gx; sy = 0.9 * sy + 0.1 * gy * gy;
      x -= (lr * gx) / (Math.sqrt(sx) + 1e-8); y -= (lr * gy) / (Math.sqrt(sy) + 1e-8);
    }
    if (kind === 'adam') {
      mx = 0.9 * mx + 0.1 * gx; my = 0.9 * my + 0.1 * gy;
      sx = 0.999 * sx + 0.001 * gx * gx; sy = 0.999 * sy + 0.001 * gy * gy;
      const bx = mx / (1 - 0.9 ** t), by = my / (1 - 0.9 ** t);
      const cx = sx / (1 - 0.999 ** t), cy = sy / (1 - 0.999 ** t);
      x -= (lr * bx) / (Math.sqrt(cx) + 1e-8); y -= (lr * by) / (Math.sqrt(cy) + 1e-8);
    }
    if (!Number.isFinite(x) || Math.abs(x) > 50 || Math.abs(y) > 50) { path.push([Math.sign(x) * 50 || 50, Math.sign(y) * 50 || 50]); break; }
    path.push([x, y]);
  }
  return path;
}

export const OptimizerRace: React.FC = () => {
  const [lrSgd, setLrSgd] = useState(0.09);
  const [lrAdapt, setLrAdapt] = useState(0.15);
  const [steps, setSteps] = useState(40);
  const [noise, setNoise] = useState(0);
  const paths = useMemo(
    () => Object.fromEntries(OPTS.map((o) => [o, runOpt(o, o === 'sgd' || o === 'momentum' ? (o === 'momentum' ? lrSgd / 5 : lrSgd) : lrAdapt, steps, noise)])) as Record<Opt, [number, number][]>,
    [lrSgd, lrAdapt, steps, noise]
  );
  const W = 560, H = 260, X = [-5, 2] as const, Y = [-1.6, 1.6] as const;
  const sx = (v: number) => ((v - X[0]) / (X[1] - X[0])) * W;
  const sy = (v: number) => H - ((v - Y[0]) / (Y[1] - Y[0])) * H;
  const levels = [0.05, 0.3, 1, 2.5, 5, 9];

  return (
    <ExploreCard
      title="优化器赛跑：狭长山谷里的 SGD、Momentum、RMSProp 与 Adam"
      prompt="损失 $f = \tfrac12(0.5x^2 + 10y^2)$ 在 $y$ 方向陡、$x$ 方向缓。四个优化器从同一点出发。把 SGD 的学习率调到 0.2 以上看看会发生什么，再打开梯度噪声。"
      insight="SGD 的学习率受最陡方向限制：大于 $2/10 = 0.2$ 就在 $y$ 方向发散，太小又在 $x$ 方向爬得很慢。Momentum 累积一致方向的速度、抵消来回震荡；RMSProp / Adam 为每个参数除以梯度均方根，陡的方向步长自动变小、缓的方向变大，所以几乎直奔最优点。Adam 第一步的位移约等于学习率 × 梯度符号。"
    >
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto rounded-lg border border-stone-200 dark:border-zinc-800" role="img" aria-label="优化轨迹">
        {levels.map((c) => (
          <ellipse key={c} cx={sx(0)} cy={sy(0)} rx={(Math.sqrt((2 * c) / A_X) / (X[1] - X[0])) * W} ry={(Math.sqrt((2 * c) / A_Y) / (Y[1] - Y[0])) * H} fill="none" className="viz-grid" />
        ))}
        <circle cx={sx(0)} cy={sy(0)} r={4} fill="var(--chart-ink)" />
        {OPTS.map((o, i) => (
          <g key={o}>
            <path d={paths[o].map((p, k) => `${k ? 'L' : 'M'}${sx(p[0]).toFixed(1)},${sy(p[1]).toFixed(1)}`).join('')} fill="none" stroke={SERIES[i]} strokeWidth={2} strokeLinejoin="round" />
            {(() => {
              const last = paths[o][paths[o].length - 1];
              return <circle cx={sx(last[0])} cy={sy(last[1])} r={5} fill={SERIES[i]} stroke="var(--chart-surface)" strokeWidth={2} />;
            })()}
          </g>
        ))}
      </svg>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-stone-600 dark:text-zinc-400">
        {OPTS.map((o, i) => (
          <span key={o} className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: SERIES[i] }} />
            {OPT_LABEL[o]}
          </span>
        ))}
      </div>
      <div className="mt-4">
        <Controls>
          <Slider label="SGD 学习率（Momentum 用其 1/5）" value={lrSgd} min={0.01} max={0.25} step={0.005} onChange={setLrSgd} format={(v) => v.toFixed(3)} />
          <Slider label="RMSProp / Adam 学习率" value={lrAdapt} min={0.01} max={0.5} step={0.01} onChange={setLrAdapt} format={(v) => v.toFixed(2)} />
          <Slider label="迭代步数" value={steps} min={1} max={120} step={1} onChange={setSteps} />
          <Slider label="梯度噪声（模拟 mini-batch）" value={noise} min={0} max={3} step={0.1} onChange={setNoise} format={(v) => v.toFixed(1)} />
        </Controls>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {OPTS.map((o, i) => {
          const last = paths[o][paths[o].length - 1];
          const v = fval(last[0], last[1]);
          return <Readout key={o} color={SERIES[i]} label={`${OPT_LABEL[o]} 最终损失`} value={v > 100 ? '发散' : v.toExponential(2)} />;
        })}
      </div>
    </ExploreCard>
  );
};

/* ===================== L06 · Convolution stepper ===================== */

const IMG = [
  [0, 1, 2, 3, 3, 2],
  [1, 2, 3, 3, 2, 1],
  [0, 1, 3, 2, 1, 0],
  [0, 0, 2, 3, 1, 0],
  [1, 0, 1, 3, 2, 1],
  [2, 1, 0, 2, 3, 2],
];
const KERNELS: Record<string, { k: number[][]; label: string }> = {
  edge: { k: [[1, 0, -1], [1, 0, -1], [1, 0, -1]], label: '竖直边缘' },
  blur: { k: [[1, 1, 1], [1, 1, 1], [1, 1, 1]], label: '求和/模糊' },
  sharp: { k: [[0, -1, 0], [-1, 5, -1], [0, -1, 0]], label: '锐化' },
};

const cell = 34;

const Grid: React.FC<{ data: number[][]; highlight?: (i: number, j: number) => boolean; onPick?: (i: number, j: number) => void; padRing?: number; selected?: [number, number] }> = ({ data, highlight, onPick, padRing = 0, selected }) => (
  <div className="inline-grid gap-[2px]" style={{ gridTemplateColumns: `repeat(${data.length}, ${cell}px)` }}>
    {data.map((row, i) =>
      row.map((v, j) => {
        const isPad = padRing > 0 && (i < padRing || j < padRing || i >= data.length - padRing || j >= data.length - padRing);
        const hl = highlight?.(i, j);
        const isSel = selected && selected[0] === i && selected[1] === j;
        return (
          <button
            key={`${i}-${j}`}
            onClick={() => onPick?.(i, j)}
            onMouseEnter={() => onPick?.(i, j)}
            className={`flex h-[34px] items-center justify-center rounded font-mono text-[13px] tabular-nums transition ${onPick ? 'cursor-pointer' : 'cursor-default'} ${
              isSel ? 'bg-blue-600 text-white' : hl ? 'bg-blue-100 text-blue-900 ring-2 ring-blue-500 dark:bg-blue-950 dark:text-blue-100' : isPad ? 'bg-stone-50 text-stone-300 dark:bg-zinc-900 dark:text-zinc-600' : 'bg-stone-100 text-stone-800 dark:bg-zinc-800 dark:text-zinc-200'
            }`}
          >
            {Number.isInteger(v) ? v : v.toFixed(1)}
          </button>
        );
      })
    )}
  </div>
);


export const ConvStepper: React.FC = () => {
  const [kern, setKern] = useState<keyof typeof KERNELS>('edge');
  const [stride, setStride] = useState(1);
  const [pad, setPad] = useState(0);
  const [bias, setBias] = useState(0);
  const [relu, setRelu] = useState(true);
  const [sel, setSel] = useState<[number, number]>([0, 0]);
  const K = KERNELS[kern].k;
  const F = 3, Win = 6;
  const P = Win + 2 * pad;
  const padded = Array.from({ length: P }, (_, i) => Array.from({ length: P }, (_, j) => IMG[i - pad]?.[j - pad] ?? 0));
  const valid = (Win - F + 2 * pad) % stride === 0;
  const Wout = Math.floor((Win - F + 2 * pad) / stride) + 1;
  const out = Array.from({ length: Wout }, (_, r) =>
    Array.from({ length: Wout }, (_, c) => {
      let s = bias;
      for (let m = 0; m < F; m++) for (let n = 0; n < F; n++) s += padded[r * stride + m][c * stride + n] * K[m][n];
      return relu ? Math.max(0, s) : s;
    })
  );
  const [sr, sc] = sel[0] < Wout && sel[1] < Wout ? sel : [0, 0];
  const terms: string[] = [];
  let raw = bias;
  for (let m = 0; m < F; m++) for (let n = 0; n < F; n++) {
    const v = padded[sr * stride + m][sc * stride + n];
    raw += v * K[m][n];
    if (K[m][n] !== 0) terms.push(`${v}·${K[m][n] < 0 ? `(${K[m][n]})` : K[m][n]}`);
  }
  return (
    <ExploreCard
      title="卷积逐格计算器"
      prompt="把鼠标移到右侧输出的任一格上，左侧会高亮它的感受野，下方给出逐项乘加。改变步长、填充、偏置，看看输出尺寸如何变化，以及哪些组合不合法。"
      insight="输出边长 $= (W - F + 2P)/S + 1$：6×6 输入、3×3 核、$P=0, S=1$ 时为 4×4；$P=1$ 时保持 6×6（same padding）；$P=0, S=2$ 时 $(6-3)/2 = 1.5$ 不是整数，讲义规定这种设置不合法。注意深度学习库中的「卷积」并不翻转核（互相关）——WA3 的手算题也按这个算。"
    >
      <div className="flex flex-wrap items-center gap-3">
        <Segmented value={kern} onChange={(v) => setKern(v as keyof typeof KERNELS)} options={Object.entries(KERNELS).map(([k, v]) => [k, v.label])} label="滤波器" />
        <Segmented value={String(stride) as '1' | '2'} onChange={(v) => setStride(Number(v))} options={[['1', 'S = 1'], ['2', 'S = 2']]} />
        <Segmented value={String(pad) as '0' | '1'} onChange={(v) => setPad(Number(v))} options={[['0', 'P = 0'], ['1', 'P = 1']]} />
        <Segmented value={relu ? 'on' : 'off'} onChange={(v) => setRelu(v === 'on')} options={[['on', 'ReLU 开'], ['off', 'ReLU 关']]} />
      </div>
      <div className="mt-4 flex flex-wrap items-start gap-6 overflow-x-auto">
        <div>
          <div className="mb-1.5 text-xs text-stone-500 dark:text-zinc-400">输入 {Win}×{Win}{pad ? '（灰色为零填充）' : ''}</div>
          <Grid data={padded} padRing={pad} highlight={(i, j) => i >= sr * stride && i < sr * stride + F && j >= sc * stride && j < sc * stride + F} />
        </div>
        <div>
          <div className="mb-1.5 text-xs text-stone-500 dark:text-zinc-400">滤波器 3×3</div>
          <Grid data={K} />
        </div>
        <div>
          <div className="mb-1.5 text-xs text-stone-500 dark:text-zinc-400">输出 {valid ? `${Wout}×${Wout}` : '（不合法）'}</div>
          {valid ? <Grid data={out} onPick={(i, j) => setSel([i, j])} selected={[sr, sc]} /> : (
            <div className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
              (6 − 3 + 2·{pad}) / {stride} 不是整数，滤波器无法整齐覆盖输入。
            </div>
          )}
        </div>
      </div>
      {valid && (
        <div className="mt-4 rounded-lg bg-stone-50 px-4 py-3 font-mono text-[13px] leading-relaxed text-stone-700 dark:bg-zinc-900 dark:text-zinc-300">
          输出[{sr},{sc}] = {terms.join(' + ') || '0'} {bias ? `+ ${bias}` : ''} = {raw}
          {relu && raw < 0 ? ' → ReLU → 0' : ''}
        </div>
      )}
      <div className="mt-3">
        <Slider label="偏置 $b$" value={bias} min={-5} max={5} step={1} onChange={setBias} />
      </div>
    </ExploreCard>
  );
};

/* ===================== L07 · Gradient flow through time ===================== */

export const RnnGradientFlow: React.FC = () => {
  const [rho, setRho] = useState(0.9);
  const [fg, setFg] = useState(0.97);
  const [clip, setClip] = useState(false);
  const ks = linspace(0, 60, 61);
  const rnn = ks.map((k) => {
    const v = k * Math.log10(rho);
    return [k, clip ? Math.min(v, 1) : v] as [number, number];
  });
  const lstm = ks.map((k) => [k, k * Math.log10(fg)] as [number, number]);
  return (
    <ExploreCard
      title="梯度沿时间回传：vanilla RNN vs LSTM 记忆通路"
      prompt="BPTT 中，误差每往回传一步，vanilla RNN 要乘一次雅可比（量级约为 $\rho$），而 LSTM 的记忆通路只乘遗忘门 $f$。调整两者，观察 60 步之前的梯度还剩多少。"
      insight="$\rho < 1$ 时 RNN 的梯度指数衰减（长距离依赖学不到），$\rho > 1$ 时指数爆炸——权重共享让这个问题比前馈网络更严重。梯度裁剪只能截住爆炸、救不了消失。LSTM 的 $\mathbf{c}_t = \mathbf{f}_t\odot\mathbf{c}_{t-1} + \dots$ 是加法通路：只要遗忘门接近 1，梯度就能几乎无损地传很远。"
    >
      <LineChart
        ariaLabel="梯度量级随回传步数变化"
        xDomain={[0, 60]}
        yDomain={[-10, 6]}
        xLabel="回传步数 k"
        yLabel="log10 |∂L/∂h_{t−k}|"
        series={[
          { name: 'vanilla RNN', color: SERIES[0], points: rnn },
          { name: 'LSTM 记忆通路', color: SERIES[2], points: lstm },
        ]}
        overlay={(s) => <line x1={s.pad.l} x2={s.W - s.pad.r} y1={s.y(0)} y2={s.y(0)} className="viz-axis" strokeDasharray="3 3" />}
      />
      <div className="mt-3">
        <Controls cols={3}>
          <Slider label="RNN 每步因子 $\rho$" value={rho} min={0.5} max={1.3} step={0.01} onChange={setRho} format={(v) => v.toFixed(2)} />
          <Slider label="LSTM 遗忘门 $f$" value={fg} min={0.5} max={1} step={0.005} onChange={setFg} format={(v) => v.toFixed(3)} />
          <Segmented value={clip ? 'on' : 'off'} onChange={(v) => setClip(v === 'on')} options={[['off', '不裁剪'], ['on', '梯度裁剪']]} />
        </Controls>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <Readout color={SERIES[0]} label="RNN：60 步后剩余" value={`10^${rnn[60][1].toFixed(1)}`} />
        <Readout color={SERIES[2]} label="LSTM：60 步后剩余" value={`10^${lstm[60][1].toFixed(1)}`} />
      </div>
    </ExploreCard>
  );
};
