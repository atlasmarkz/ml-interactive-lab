import React, { useEffect, useMemo, useState } from 'react';
import { Pause, Play, StepForward, RotateCcw } from 'lucide-react';
import { Button, Controls, ExploreCard, LineChart, Readout, SERIES, Segmented, Slider, gaussian, linspace, mulberry32, sigmoid } from './kit';
import { mse, polyFit } from './math';

const f3 = (v: number) => v.toFixed(3);

/* ============================ L00 · Entropy & KL ============================ */

export const EntropyKL: React.FC = () => {
  const [p, setP] = useState([0.6, 0.3, 0.1]);
  const [q, setQ] = useState([1 / 3, 1 / 3, 1 / 3]);
  const norm = (v: number[]) => {
    const s = v.reduce((a, b) => a + b, 0);
    return v.map((x) => x / s);
  };
  const P = norm(p);
  const Q = norm(q);
  const H = -P.reduce((s, x) => s + (x > 0 ? x * Math.log(x) : 0), 0);
  const CE = -P.reduce((s, x, i) => s + x * Math.log(Q[i]), 0);
  const KLpq = CE - H;
  const KLqp = Q.reduce((s, x, i) => s + x * Math.log(x / P[i]), 0);
  const labels = ['A', 'B', 'C'];
  const W = 560, Hh = 180, base = 150, bw = 46;

  return (
    <ExploreCard
      title="熵、交叉熵与 KL：拖动两个分布"
      prompt="调整真实分布 $p$（蓝）与模型分布 $q$（橙）在三个结果上的权重。让 $q$ 逐渐接近 $p$，再把 $p$ 调成接近 one-hot，观察四个数如何变化。"
      insight="交叉熵永远不小于熵：$H(p,q) = H(p) + D_{\mathrm{KL}}(p\|q)$，两者只在 $q = p$ 时相等。两个方向的 KL 一般不相等——$p$ 有质量而 $q$ 很小的位置会让 $D_{\mathrm{KL}}(p\|q)$ 急剧变大。$p$ 越接近 one-hot，$H(p)$ 越接近 0，交叉熵损失就几乎等于 KL。"
    >
      <svg viewBox={`0 0 ${W} ${Hh}`} className="w-full h-auto" role="img" aria-label="p 与 q 的分组柱状图">
        <line className="viz-axis" x1={30} x2={W - 10} y1={base} y2={base} />
        {labels.map((lab, i) => {
          const cx = 100 + i * 170;
          return (
            <g key={lab}>
              {[P[i], Q[i]].map((v, k) => (
                <g key={k}>
                  <rect x={cx - bw - 1 + k * (bw + 2)} y={base - v * 130} width={bw} height={Math.max(0, v * 130)} rx={4} fill={SERIES[k]} />
                  <text className="viz-text" x={cx - bw / 2 - 1 + k * (bw + 2)} y={base - v * 130 - 5} textAnchor="middle">
                    {v.toFixed(2)}
                  </text>
                </g>
              ))}
              <text className="viz-text" x={cx} y={base + 16} textAnchor="middle">
                结果 {lab}
              </text>
            </g>
          );
        })}
      </svg>
      <div className="mt-3 grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-sm font-medium text-stone-800 dark:text-zinc-200">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: SERIES[0] }} /> 真实分布 p（未归一化权重）
          </div>
          {labels.map((lab, i) => (
            <Slider key={lab} label={`p 的权重 ${lab}`} value={p[i]} min={0.01} max={1} step={0.01} onChange={(v) => setP(p.map((x, j) => (j === i ? v : x)))} format={(v) => v.toFixed(2)} />
          ))}
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-sm font-medium text-stone-800 dark:text-zinc-200">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: SERIES[1] }} /> 模型分布 q（未归一化权重）
          </div>
          {labels.map((lab, i) => (
            <Slider key={lab} label={`q 的权重 ${lab}`} value={q[i]} min={0.01} max={1} step={0.01} onChange={(v) => setQ(q.map((x, j) => (j === i ? v : x)))} format={(v) => v.toFixed(2)} />
          ))}
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Readout label="熵 $H(p)$" value={f3(H)} />
        <Readout label="交叉熵 $H(p,q)$" value={f3(CE)} emphasis />
        <Readout label="$D_{\mathrm{KL}}(p\|q)$" value={f3(KLpq)} />
        <Readout label="$D_{\mathrm{KL}}(q\|p)$" value={f3(KLqp)} />
      </div>
    </ExploreCard>
  );
};

/* ===================== L01 · Polynomial degree & ridge λ ===================== */

const truth = (x: number) => Math.sin(2 * Math.PI * x);
function makeData(n: number, seed: number) {
  const r = mulberry32(seed);
  const xs = Array.from({ length: n }, (_, i) => (i + 0.5) / n + (r() - 0.5) * 0.05);
  const ys = xs.map((x) => truth(x) + 0.25 * gaussian(r));
  return { xs, ys };
}
const TRAIN = makeData(10, 7);
const TEST = makeData(60, 99);

export const PolyFitExplorer: React.FC = () => {
  const [deg, setDeg] = useState(3);
  const [logLam, setLogLam] = useState(-8);
  const lam = Math.pow(10, logLam);
  const f = useMemo(() => polyFit(TRAIN.xs, TRAIN.ys, deg, lam), [deg, lam]);
  const grid = linspace(0, 1, 160);
  const curve = useMemo(
    () => [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => {
      const g = polyFit(TRAIN.xs, TRAIN.ys, d, lam);
      return [d, mse(g, TRAIN.xs, TRAIN.ys), mse(g, TEST.xs, TEST.ys)] as const;
    }),
    [lam]
  );
  const trainErr = mse(f, TRAIN.xs, TRAIN.ys);
  const testErr = mse(f, TEST.xs, TEST.ys);

  return (
    <ExploreCard
      title="多项式阶数与 Ridge 正则化：亲手制造过拟合"
      prompt="10 个训练点（实心）来自 $\sin(2\pi x)$ 加噪声，空心小点是测试数据。先把阶数拉到 9（$\lambda$ 保持最小），再逐渐增大 $\lambda$。"
      insight="阶数越高训练误差越小，9 阶时几乎穿过每个训练点，但测试误差暴涨——这就是过拟合。增大 $\lambda$ 会把高阶系数压小，曲线重新变平滑，测试误差先降后升：$\lambda$ 太大又会欠拟合。右侧曲线是讲义里「训练误差单调降、测试误差 U 形」的实测版本。"
    >
      <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <LineChart
          ariaLabel="多项式拟合曲线"
          xDomain={[0, 1]}
          yDomain={[-1.8, 1.8]}
          xLabel="x"
          series={[
            { name: `${deg} 阶拟合`, color: SERIES[0], points: grid.map((x) => [x, f(x)]) },
            { name: '真实函数', color: 'var(--chart-axis)', dashed: true, points: grid.map((x) => [x, truth(x)]) },
          ]}
          overlay={(s) => (
            <g>
              {TEST.xs.map((x, i) => (
                <circle key={`t${i}`} cx={s.x(x)} cy={s.y(TEST.ys[i])} r={2.5} fill="none" stroke="var(--chart-axis)" />
              ))}
              {TRAIN.xs.map((x, i) => (
                <circle key={i} cx={s.x(x)} cy={s.y(TRAIN.ys[i])} r={4.5} fill={SERIES[0]} stroke="var(--chart-surface)" strokeWidth={2} />
              ))}
            </g>
          )}
        />
        <LineChart
          ariaLabel="训练误差与测试误差随阶数变化"
          xDomain={[0, 9]}
          yDomain={[0, 0.8]}
          xLabel="阶数 d"
          height={260}
          series={[
            { name: '训练 MSE', color: SERIES[0], points: curve.map(([d, tr]) => [d, tr]) },
            { name: '测试 MSE', color: SERIES[1], points: curve.map(([d, , te]) => [d, te]) },
          ]}
          overlay={(s) => <line x1={s.x(deg)} x2={s.x(deg)} y1={s.pad.t} y2={s.H - s.pad.b} className="viz-axis" strokeDasharray="2 3" />}
        />
      </div>
      <div className="mt-4">
        <Controls>
          <Slider label="多项式阶数 $d$" value={deg} min={0} max={9} step={1} onChange={setDeg} />
          <Slider label="正则化强度 $\log_{10}\lambda$" value={logLam} min={-8} max={1} step={0.25} onChange={setLogLam} format={(v) => `λ = ${Math.pow(10, v).toExponential(1)}`} />
        </Controls>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <Readout label="训练 MSE" value={f3(trainErr)} color={SERIES[0]} />
        <Readout label="测试 MSE" value={f3(testErr)} color={SERIES[1]} emphasis />
      </div>
    </ExploreCard>
  );
};

/* ===================== L02.1 · Logistic decision boundary ===================== */

const PTS: [number, number, 0 | 1][] = (() => {
  const r = mulberry32(3);
  const out: [number, number, 0 | 1][] = [];
  for (let i = 0; i < 10; i++) out.push([1 + 0.7 * gaussian(r), 1 + 0.7 * gaussian(r), 1]);
  for (let i = 0; i < 10; i++) out.push([-1 + 0.7 * gaussian(r), -0.6 + 0.7 * gaussian(r), 0]);
  return out;
})();

export const LogisticBoundary: React.FC = () => {
  const [w, setW] = useState<[number, number, number]>([0, -1, 0.5]); // b, w1, w2
  const [running, setRunning] = useState(false);
  const [lr, setLr] = useState(0.3);

  const stats = (ww: [number, number, number]) => {
    let loss = 0, err = 0;
    const g = [0, 0, 0];
    for (const [x1, x2, y] of PTS) {
      const p = sigmoid(ww[0] + ww[1] * x1 + ww[2] * x2);
      loss -= y * Math.log(p + 1e-12) + (1 - y) * Math.log(1 - p + 1e-12);
      if ((p > 0.5 ? 1 : 0) !== y) err++;
      g[0] += (p - y);
      g[1] += (p - y) * x1;
      g[2] += (p - y) * x2;
    }
    const n = PTS.length;
    return { loss: loss / n, err: err / n, g: g.map((v) => v / n) };
  };
  const st = stats(w);
  const step = () => setW((ww) => {
    const { g } = stats(ww);
    return [ww[0] - lr * g[0], ww[1] - lr * g[1], ww[2] - lr * g[2]];
  });

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(step, 120);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, lr]);

  const S = 300, R = 3.2;
  const sx = (v: number) => ((v + R) / (2 * R)) * S;
  const sy = (v: number) => S - ((v + R) / (2 * R)) * S;
  // probability shading on a coarse grid
  const cells = 24;
  const shade: React.ReactNode[] = [];
  for (let i = 0; i < cells; i++)
    for (let j = 0; j < cells; j++) {
      const x1 = -R + ((i + 0.5) * 2 * R) / cells;
      const x2 = -R + ((j + 0.5) * 2 * R) / cells;
      const p = sigmoid(w[0] + w[1] * x1 + w[2] * x2);
      shade.push(
        <rect key={`${i}-${j}`} x={(i * S) / cells} y={S - ((j + 1) * S) / cells} width={S / cells + 0.5} height={S / cells + 0.5}
          fill={p > 0.5 ? SERIES[0] : SERIES[1]} opacity={Math.abs(p - 0.5) * 0.45} />
      );
    }
  // boundary: b + w1 x1 + w2 x2 = 0
  const line = (() => {
    if (Math.abs(w[2]) > 1e-6) return [[-R, -(w[0] + w[1] * -R) / w[2]], [R, -(w[0] + w[1] * R) / w[2]]];
    if (Math.abs(w[1]) > 1e-6) return [[-w[0] / w[1], -R], [-w[0] / w[1], R]];
    return null;
  })();

  return (
    <ExploreCard
      title="Logistic 回归：决策边界与梯度下降"
      prompt="圆点是类别 1，方块是类别 0。手动拖动权重让分界线分开两类；或者点「梯度下降一步 / 自动训练」，看交叉熵损失如何驱动边界移动。"
      insight="决策边界永远是一条直线 $w_0 + w_1x_1 + w_2x_2 = 0$（线性分类器）。底色越深表示 $\sigma(z)$ 越接近 0 或 1。两类已经分开后继续训练，错误率不再变化，但损失仍在下降、权重范数不断变大——这正是线性可分时不加正则化权重会发散的原因（WA1 Q5）。"
    >
      <div className="grid gap-5 md:grid-cols-[300px_1fr] items-start">
        <svg viewBox={`0 0 ${S} ${S}`} className="w-full max-w-[300px] h-auto rounded-lg border border-stone-200 dark:border-zinc-800" role="img" aria-label="二维数据与决策边界">
          {shade}
          <line className="viz-grid" x1={sx(0)} x2={sx(0)} y1={0} y2={S} />
          <line className="viz-grid" x1={0} x2={S} y1={sy(0)} y2={sy(0)} />
          {line && <line x1={sx(line[0][0])} y1={sy(line[0][1])} x2={sx(line[1][0])} y2={sy(line[1][1])} stroke="var(--chart-ink)" strokeWidth={2} />}
          {PTS.map(([x1, x2, y], i) =>
            y === 1 ? (
              <circle key={i} cx={sx(x1)} cy={sy(x2)} r={5} fill={SERIES[0]} stroke="var(--chart-surface)" strokeWidth={2} />
            ) : (
              <rect key={i} x={sx(x1) - 4.5} y={sy(x2) - 4.5} width={9} height={9} rx={1.5} fill={SERIES[1]} stroke="var(--chart-surface)" strokeWidth={2} />
            )
          )}
        </svg>
        <div className="space-y-3">
          <Slider label="偏置 $w_0$" value={w[0]} min={-4} max={4} step={0.05} onChange={(v) => setW([v, w[1], w[2]])} format={(v) => v.toFixed(2)} />
          <Slider label="$w_1$" value={w[1]} min={-6} max={6} step={0.05} onChange={(v) => setW([w[0], v, w[2]])} format={(v) => v.toFixed(2)} />
          <Slider label="$w_2$" value={w[2]} min={-6} max={6} step={0.05} onChange={(v) => setW([w[0], w[1], v])} format={(v) => v.toFixed(2)} />
          <Slider label="学习率 $\eta$" value={lr} min={0.05} max={2} step={0.05} onChange={setLr} format={(v) => v.toFixed(2)} />
          <div className="flex flex-wrap gap-2">
            <Button onClick={step}><StepForward className="h-4 w-4" />梯度下降一步</Button>
            <Button primary onClick={() => setRunning((r) => !r)}>{running ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}{running ? '暂停' : '自动训练'}</Button>
            <Button onClick={() => { setRunning(false); setW([0, -1, 0.5]); }}><RotateCcw className="h-4 w-4" />重置</Button>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <Readout label="平均交叉熵" value={f3(st.loss)} emphasis />
            <Readout label="训练错误率" value={`${Math.round(st.err * 100)}%`} />
            <Readout label="$\|\mathbf{w}\|$" value={Math.hypot(w[1], w[2]).toFixed(2)} />
          </div>
        </div>
      </div>
    </ExploreCard>
  );
};

/* ======================= L02.2 · Surrogate losses vs yz ======================= */

export const SurrogateLosses: React.FC = () => {
  const [m, setM] = useState(-0.5);
  const xs = linspace(-2, 3, 201);
  const L = {
    zeroOne: (z: number) => (z <= 0 ? 1 : 0),
    hinge: (z: number) => Math.max(0, 1 - z),
    logistic: (z: number) => Math.log(1 + Math.exp(-z)) / Math.log(2),
    exp: (z: number) => Math.exp(-z),
  };
  const D = {
    hinge: (z: number) => (z < 1 ? -1 : 0),
    logistic: (z: number) => -1 / ((1 + Math.exp(z)) * Math.log(2)),
    exp: (z: number) => -Math.exp(-z),
  };
  return (
    <ExploreCard
      title="代理损失：为什么不能直接优化 0/1 损失"
      prompt="横轴是间隔 $yz$（$>0$ 表示分对，越大越自信）。拖动滑块，比较各损失在该点的取值和斜率。"
      insight="0/1 损失在几乎所有地方斜率都是 0，梯度下降拿不到任何方向信息。代理损失都是 0/1 损失的上界（logistic 已除以 $\ln 2$）且是凸的：错分时斜率最大，把 $yz$ 往右推；分对后 hinge 在 $yz \ge 1$ 处完全停止，logistic 和 exponential 则继续推动，鼓励更高的分类置信度——exponential 对离群的错分点惩罚最重。"
    >
      <LineChart
        ariaLabel="代理损失曲线"
        xDomain={[-2, 3]}
        yDomain={[0, 4]}
        xLabel="间隔 yz"
        series={[
          { name: 'hinge', color: SERIES[0], points: xs.map((x) => [x, L.hinge(x)]) },
          { name: 'logistic/ln2', color: SERIES[1], points: xs.map((x) => [x, L.logistic(x)]) },
          { name: 'exponential', color: SERIES[2], points: xs.map((x) => [x, L.exp(x)]) },
          { name: '0/1', color: 'var(--chart-axis)', dashed: true, points: xs.map((x) => [x, L.zeroOne(x)]) },
        ]}
        overlay={(s) => <line x1={s.x(m)} x2={s.x(m)} y1={s.pad.t} y2={s.H - s.pad.b} stroke="var(--chart-ink)" strokeDasharray="4 3" />}
      />
      <div className="mt-3">
        <Slider label="间隔 $yz$" value={m} min={-2} max={3} step={0.05} onChange={setM} format={(v) => v.toFixed(2)} />
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Readout label="0/1" value={`${L.zeroOne(m)}  (斜率 0)`} />
        <Readout label="hinge" color={SERIES[0]} value={`${L.hinge(m).toFixed(2)}  (${D.hinge(m).toFixed(2)})`} />
        <Readout label="logistic" color={SERIES[1]} value={`${L.logistic(m).toFixed(2)}  (${D.logistic(m).toFixed(2)})`} />
        <Readout label="exponential" color={SERIES[2]} value={`${L.exp(m).toFixed(2)}  (${D.exp(m).toFixed(2)})`} />
      </div>
      <p className="mt-2 text-xs text-stone-500 dark:text-zinc-400">括号内为对 yz 的导数。</p>
    </ExploreCard>
  );
};

/* ======================= L03 · Bias–variance by simulation ======================= */

const SETS = Array.from({ length: 25 }, (_, k) => makeData(8, 1000 + k));
export const BiasVarianceSim: React.FC = () => {
  const [deg, setDeg] = useState(3);
  const [show, setShow] = useState<'fits' | 'curve'>('fits');
  const grid = linspace(0.03, 0.97, 80);
  const analyse = (d: number) => {
    const fits = SETS.map(({ xs, ys }) => polyFit(xs, ys, d, 1e-6));
    const preds = grid.map((x) => fits.map((f) => f(x)));
    const mean = preds.map((ps) => ps.reduce((a, b) => a + b, 0) / ps.length);
    const bias2 = grid.reduce((s, x, i) => s + (mean[i] - truth(x)) ** 2, 0) / grid.length;
    const variance = preds.reduce((s, ps, i) => s + ps.reduce((a, p) => a + (p - mean[i]) ** 2, 0) / ps.length, 0) / grid.length;
    return { fits, mean, bias2, variance };
  };
  const cur = useMemo(() => analyse(deg), [deg]); // eslint-disable-line react-hooks/exhaustive-deps
  const sweep = useMemo(() => [0, 1, 2, 3, 4, 5, 6, 7].map((d) => ({ d, ...analyse(d) })), []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <ExploreCard
      title="偏差-方差：25 个训练集、25 个模型"
      prompt="每个细线模型都来自一个不同的 8 点训练集（同一个真实函数 + 不同噪声）。改变阶数，观察细线的「散开程度」（方差）和粗线平均模型与真实函数的差距（偏差）。"
      insight="低阶时所有模型都差不多（方差小），但平均模型离真实函数很远（偏差大）；高阶时平均模型几乎贴合真实函数（偏差小），每个模型却随噪声剧烈摆动（方差大）。两者之和（期望泛化误差，不含噪声项）在中间阶数最小——这正是 L03 的分解：$\epsilon = \text{bias}^2 + \text{variance}$。"
    >
      <Segmented value={show} onChange={setShow} options={[['fits', '看模型'], ['curve', '看分解曲线']]} />
      <div className="mt-3">
        {show === 'fits' ? (
          <LineChart
            ariaLabel="多个训练集上的拟合"
            xDomain={[0, 1]}
            yDomain={[-2, 2]}
            xLabel="x"
            series={[
              { name: '平均模型', color: SERIES[1], points: grid.map((x, i) => [x, cur.mean[i]]) },
              { name: '真实函数', color: 'var(--chart-ink)', dashed: true, points: grid.map((x) => [x, truth(x)]) },
            ]}
            overlay={(s) => (
              <g opacity={0.35}>
                {cur.fits.map((f, k) => (
                  <path key={k} fill="none" stroke={SERIES[0]} strokeWidth={1}
                    d={grid.map((x, i) => `${i ? 'L' : 'M'}${s.x(x).toFixed(1)},${s.y(f(x)).toFixed(1)}`).join('')} />
                ))}
              </g>
            )}
          />
        ) : (
          <LineChart
            ariaLabel="偏差平方与方差随阶数变化"
            xDomain={[0, 7]}
            yDomain={[0, 0.8]}
            xLabel="阶数 d"
            series={[
              { name: 'bias²', color: SERIES[0], points: sweep.map((r) => [r.d, r.bias2]) },
              { name: 'variance', color: SERIES[1], points: sweep.map((r) => [r.d, r.variance]) },
              { name: 'bias²+var', color: SERIES[2], points: sweep.map((r) => [r.d, r.bias2 + r.variance]) },
            ]}
            overlay={(s) => <line x1={s.x(deg)} x2={s.x(deg)} y1={s.pad.t} y2={s.H - s.pad.b} className="viz-axis" strokeDasharray="2 3" />}
          />
        )}
      </div>
      <div className="mt-3">
        <Slider label="多项式阶数" value={deg} min={0} max={7} step={1} onChange={setDeg} />
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2">
        <Readout label="bias²" value={f3(cur.bias2)} color={SERIES[0]} />
        <Readout label="variance" value={f3(cur.variance)} color={SERIES[1]} />
        <Readout label="bias² + variance" value={f3(cur.bias2 + cur.variance)} emphasis />
      </div>
    </ExploreCard>
  );
};
