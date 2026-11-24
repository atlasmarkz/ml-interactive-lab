import React, { useMemo, useState } from 'react';
import { Controls, ExploreCard, LineChart, Readout, SERIES, Segmented, Slider, gaussian, linspace, mulberry32 } from './kit';
import { normalPdf } from './math';

/* ===================== L10 · VAE reparameterisation & KL ===================== */

const EPS = (() => {
  const r = mulberry32(21);
  return Array.from({ length: 14 }, () => gaussian(r));
})();

export const VaeReparam: React.FC = () => {
  const [mu, setMu] = useState(1.2);
  const [logVar, setLogVar] = useState(-1);
  const sd = Math.exp(0.5 * logVar);
  const kl = 0.5 * (mu * mu + Math.exp(logVar) - 1 - logVar);
  const xs = linspace(-4, 4, 201);
  return (
    <ExploreCard
      title="重参数化：$\mathbf{z} = \mu + \sigma\epsilon$ 与 KL 正则项"
      prompt="编码器为某个输入 $\mathbf{x}$ 输出 $\mu$ 和 $\log\sigma^2$（这里是一维隐变量）。下方灰点是固定的噪声 $\epsilon\sim\mathcal{N}(0,1)$，蓝点是变换后的 $z$。拖动两个参数，观察 KL 项如何变化。"
      insight="随机性全部来自 $\epsilon$，$z$ 对 $\mu$、$\sigma$ 是确定性函数（$\partial z/\partial\mu = 1$，$\partial z/\partial\sigma = \epsilon$），所以梯度可以穿过采样步骤。KL 项在 $\mu = 0, \sigma = 1$ 时为 0：后验越偏离先验、越「尖」，惩罚越大。重建项则希望不同输入的 $q(z|x)$ 分得开、足够尖——两项的拉锯决定了隐空间的形状。"
    >
      <LineChart
        ariaLabel="先验与近似后验"
        xDomain={[-4, 4]}
        yDomain={[0, 1.4]}
        xLabel="z"
        series={[
          { name: 'q(z|x)', color: SERIES[0], points: xs.map((x) => [x, normalPdf(x, mu, sd)]) },
          { name: '先验 N(0,1)', color: 'var(--chart-axis)', dashed: true, points: xs.map((x) => [x, normalPdf(x, 0, 1)]) },
        ]}
        overlay={(s) => (
          <g>
            {EPS.map((e, i) => {
              const z = mu + sd * e;
              return (
                <g key={i}>
                  <line x1={s.x(e)} y1={s.y(0.08)} x2={s.x(z)} y2={s.y(0.22)} stroke="var(--chart-axis)" strokeWidth={0.8} />
                  <circle cx={s.x(e)} cy={s.y(0.08)} r={3} fill="var(--chart-axis)" />
                  <circle cx={s.x(z)} cy={s.y(0.22)} r={3.5} fill={SERIES[0]} />
                </g>
              );
            })}
          </g>
        )}
      />
      <div className="mt-3">
        <Controls>
          <Slider label="$\mu$" value={mu} min={-2.5} max={2.5} step={0.05} onChange={setMu} format={(v) => v.toFixed(2)} />
          <Slider label="$\log\sigma^2$" value={logVar} min={-4} max={1.5} step={0.05} onChange={setLogVar} format={(v) => `${v.toFixed(2)}  (σ = ${Math.exp(0.5 * v).toFixed(2)})`} />
        </Controls>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2">
        <Readout label="$D_{\mathrm{KL}}(q\|p)$" value={kl.toFixed(3)} emphasis />
        <Readout label="$-\mathcal{L}_2$ 中 $\mu^2$ 部分" value={(0.5 * mu * mu).toFixed(3)} />
        <Readout label="方差部分 $\tfrac12(\sigma^2 - 1 - \log\sigma^2)$" value={(0.5 * (Math.exp(logVar) - 1 - logVar)).toFixed(3)} />
      </div>
    </ExploreCard>
  );
};

/* ===================== L11 · 1D GAN: optimal D and JSD ===================== */

const pr = (x: number) => 0.5 * normalPdf(x, -2, 0.5) + 0.5 * normalPdf(x, 2, 0.5);

export const GanOneD: React.FC = () => {
  const [mg, setMg] = useState(0);
  const [sg, setSg] = useState(1.5);
  const xs = linspace(-5, 5, 401);
  const dx = xs[1] - xs[0];
  const pg = (x: number) => normalPdf(x, mg, sg);
  const jsd = useMemo(() => {
    let s = 0;
    for (const x of xs) {
      const a = pr(x), b = pg(x), m = 0.5 * (a + b);
      if (a > 1e-12) s += 0.5 * a * Math.log(a / m) * dx;
      if (b > 1e-12) s += 0.5 * b * Math.log(b / m) * dx;
    }
    return s;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mg, sg]);
  return (
    <ExploreCard
      title="一维 GAN：最优判别器与 JS 散度"
      prompt="真实分布（蓝）有两个峰。生成器分布（橙）是一个高斯，由你来扮演生成器调整它。水绿色虚线是此刻的最优判别器 $D^*(x)$。试着只盖住一个峰，再试着用很宽的高斯同时覆盖两个峰。"
      insight="$D^*(x) = p_r/(p_r + p_g)$：真实数据多的地方接近 1，生成样本多的地方接近 0，两者相等处为 0.5。代回目标得 $V = -\log 4 + 2\,\mathrm{JS}$，JS 的上界是 $\ln 2 \approx 0.693$（两分布不重叠时）。只盖住一个峰也能把 JS 降到不错的值——这就是 mode collapse 的诱因：判别器并不强制生成器覆盖所有模式。"
    >
      <LineChart
        ariaLabel="真实分布、生成分布与最优判别器"
        xDomain={[-5, 5]}
        yDomain={[0, 1]}
        xLabel="x"
        series={[
          { name: 'p_r', color: SERIES[0], points: xs.map((x) => [x, pr(x)]) },
          { name: 'p_g', color: SERIES[1], points: xs.map((x) => [x, pg(x)]) },
          { name: 'D*(x)', color: SERIES[2], dashed: true, points: xs.map((x) => [x, pr(x) / (pr(x) + pg(x) + 1e-12)]) },
        ]}
      />
      <div className="mt-3">
        <Controls>
          <Slider label="生成器均值 $\mu_g$" value={mg} min={-4} max={4} step={0.05} onChange={setMg} format={(v) => v.toFixed(2)} />
          <Slider label="生成器标准差 $\sigma_g$" value={sg} min={0.2} max={3} step={0.05} onChange={setSg} format={(v) => v.toFixed(2)} />
        </Controls>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2">
        <Readout label="JS$(p_r\|p_g)$" value={jsd.toFixed(3)} emphasis />
        <Readout label="$V(G, D^*) = -\log4 + 2\,$JS" value={(-Math.log(4) + 2 * jsd).toFixed(3)} />
        <Readout label="上界 $\ln 2$" value={Math.log(2).toFixed(3)} />
      </div>
    </ExploreCard>
  );
};

/* ===================== L12 · Forward diffusion ===================== */

const T = 1000;
const betasLinear = linspace(1e-4, 0.02, T);
const abarLinear = betasLinear.reduce<number[]>((acc, b) => [...acc, (acc[acc.length - 1] ?? 1) * (1 - b)], []);
const abarCosine = Array.from({ length: T }, (_, i) => {
  const f = (t: number) => Math.cos(((t / T + 0.008) / 1.008) * (Math.PI / 2)) ** 2;
  return f(i + 1) / f(0);
});
const DIFF = (() => {
  const r = mulberry32(8);
  return Array.from({ length: 1500 }, () => ({ x0: (r() < 0.5 ? -2 : 2) + 0.25 * gaussian(r), eps: gaussian(r) }));
})();

export const ForwardDiffusion: React.FC = () => {
  const [t, setT] = useState(150);
  const [sched, setSched] = useState<'linear' | 'cosine'>('linear');
  const abar = (sched === 'linear' ? abarLinear : abarCosine)[t - 1];
  const bins = 40, lo = -4, hi = 4;
  const hist = useMemo(() => {
    const h = new Array(bins).fill(0);
    for (const { x0, eps } of DIFF) {
      const x = Math.sqrt(abar) * x0 + Math.sqrt(1 - abar) * eps;
      const k = Math.floor(((x - lo) / (hi - lo)) * bins);
      if (k >= 0 && k < bins) h[k]++;
    }
    return h.map((c) => c / (DIFF.length * ((hi - lo) / bins)));
  }, [abar]);
  const ts = linspace(1, T, 200).map(Math.round);
  return (
    <ExploreCard
      title="前向加噪：两个峰如何变成一个标准高斯"
      prompt="数据分布有两个峰（$\pm 2$）。拖动时间步 $t$，直方图是一步闭式加噪 $\mathbf{x}_t = \sqrt{\bar\alpha_t}\mathbf{x}_0 + \sqrt{1-\bar\alpha_t}\boldsymbol{\epsilon}$ 后的样本分布。比较线性与余弦两种噪声调度。"
      insight="$\sqrt{\bar\alpha_t}$ 把原信号缩小，$\sqrt{1-\bar\alpha_t}$ 加入噪声，且两系数平方和为 1，方差保持不变。$t$ 接近 $T$ 时 $\bar\alpha_T \approx 0$，分布与数据无关、几乎就是 $\mathcal{N}(0, 1)$——所以采样可以从纯噪声开始。线性调度在前段破坏信息很快，余弦调度更均匀，后段的时间步不至于全被「浪费」在纯噪声上。"
    >
      <div className="grid gap-5 lg:grid-cols-[1.3fr_1fr]">
        <LineChart
          ariaLabel="x_t 的直方图"
          xDomain={[lo, hi]}
          yDomain={[0, 0.9]}
          xLabel="x_t"
          series={[{ name: 'N(0,1)', color: 'var(--chart-axis)', dashed: true, points: linspace(lo, hi, 161).map((x) => [x, normalPdf(x, 0, 1)]) }]}
          overlay={(s) => (
            <g>
              {hist.map((d, k) => {
                const x0 = lo + (k * (hi - lo)) / bins;
                const w = s.x(x0 + (hi - lo) / bins) - s.x(x0);
                return <rect key={k} x={s.x(x0) + 1} y={s.y(d)} width={Math.max(0, w - 2)} height={Math.max(0, s.y(0) - s.y(d))} rx={2} fill={SERIES[0]} opacity={0.85} />;
              })}
            </g>
          )}
        />
        <LineChart
          ariaLabel="信号系数随时间变化"
          xDomain={[1, T]}
          yDomain={[0, 1]}
          xLabel="t"
          series={[
            { name: '√ᾱ 线性', color: SERIES[0], points: ts.map((i) => [i, Math.sqrt(abarLinear[i - 1])]) },
            { name: '√ᾱ 余弦', color: SERIES[1], points: ts.map((i) => [i, Math.sqrt(abarCosine[i - 1])]) },
          ]}
          overlay={(s) => <line x1={s.x(t)} x2={s.x(t)} y1={s.pad.t} y2={s.H - s.pad.b} stroke="var(--chart-ink)" strokeDasharray="3 3" />}
        />
      </div>
      <div className="mt-3 flex flex-wrap items-end gap-4">
        <div className="min-w-[240px] flex-1">
          <Slider label="时间步 $t$" value={t} min={1} max={T} step={1} onChange={setT} />
        </div>
        <Segmented value={sched} onChange={setSched} options={[['linear', '线性 β'], ['cosine', '余弦']]} />
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2">
        <Readout label="$\bar\alpha_t$" value={abar.toFixed(4)} />
        <Readout label="信号系数 $\sqrt{\bar\alpha_t}$" value={Math.sqrt(abar).toFixed(4)} />
        <Readout label="噪声系数 $\sqrt{1-\bar\alpha_t}$" value={Math.sqrt(1 - abar).toFixed(4)} emphasis />
      </div>
    </ExploreCard>
  );
};

/* ===================== L13 · Flow matching particles ===================== */

const TARGETS = Array.from({ length: 8 }, (_, i) => [2 * Math.cos((i * Math.PI) / 4), 2 * Math.sin((i * Math.PI) / 4)] as [number, number]);
const PARTICLES = (() => {
  const r = mulberry32(31);
  return Array.from({ length: 160 }, () => ({ eps: [gaussian(r), gaussian(r)] as [number, number], z: TARGETS[Math.floor(r() * 8)] }));
})();

/** Exact marginal CondOT velocity for an equal-weight mixture of point masses. */
function marginalVelocity(x: [number, number], t: number): [number, number] {
  const tt = Math.min(t, 0.995);
  const s2 = (1 - tt) ** 2;
  const logw = TARGETS.map((z) => -(((x[0] - tt * z[0]) ** 2 + (x[1] - tt * z[1]) ** 2) / (2 * s2)));
  const m = Math.max(...logw);
  const w = logw.map((l) => Math.exp(l - m));
  const W = w.reduce((a, b) => a + b, 0);
  let vx = 0, vy = 0;
  TARGETS.forEach((z, i) => {
    vx += (w[i] / W) * (z[0] - x[0]) / (1 - tt);
    vy += (w[i] / W) * (z[1] - x[1]) / (1 - tt);
  });
  return [vx, vy];
}

export const FlowParticles: React.FC = () => {
  const [mode, setMode] = useState<'cond' | 'marg'>('marg');
  const [t, setT] = useState(1);
  const [steps, setSteps] = useState(10);
  const pos = useMemo(() => {
    if (mode === 'cond') return PARTICLES.map(({ eps, z }) => [(1 - t) * eps[0] + t * z[0], (1 - t) * eps[1] + t * z[1]] as [number, number]);
    const h = 1 / steps;
    return PARTICLES.map(({ eps }) => {
      let x: [number, number] = [eps[0], eps[1]];
      for (let k = 0; k < steps && (k + 1) * h <= t + 1e-9; k++) {
        const v = marginalVelocity(x, k * h);
        x = [x[0] + h * v[0], x[1] + h * v[1]];
      }
      return x;
    });
  }, [mode, t, steps]);
  const err = pos.reduce((s, p) => s + Math.min(...TARGETS.map((z) => Math.hypot(p[0] - z[0], p[1] - z[1]))), 0) / pos.length;
  const S = 300, R = 3.4;
  const sx = (v: number) => ((v + R) / (2 * R)) * S;
  const sy = (v: number) => S - ((v + R) / (2 * R)) * S;
  return (
    <ExploreCard
      title="Flow Matching：粒子从高斯流向数据"
      prompt="数据分布是圆上的 8 个点。「训练时」显示条件路径：每个噪声样本与随机配对的数据点之间走直线。「推理时」用（精确的）边际速度场做 Euler 积分。拖动 $t$，并把 Euler 步数减到 1–2 步试试。"
      insight="训练时每条条件轨迹都是直线，目标速度就是 $\mathbf{z} - \boldsymbol{\epsilon}$（CondOT）。但同一个位置 $\mathbf{x}_t$ 可能来自很多对 $(\boldsymbol{\epsilon}, \mathbf{z})$，网络学到的是它们的平均——边际速度场。边际轨迹早期朝圆心方向「犹豫」，后期才分流到各个点，所以不是完全的直线。试试只用 1 步：所有粒子都落到数据的平均位置（圆心）——这是步数太少的典型失败；增加到 3–5 步样本就基本分流到各个数据点。这里用的是精确的边际速度场，所以步数足够时会精确落在数据点上；真实网络只是近似，误差会随步数减少而增大。"
    >
      <div className="grid items-start gap-6 md:grid-cols-[300px_1fr]">
        <svg viewBox={`0 0 ${S} ${S}`} className="w-full max-w-[300px] rounded-lg border border-stone-200 dark:border-zinc-800" role="img" aria-label="粒子位置">
          <circle cx={sx(0)} cy={sy(0)} r={(2 / (2 * R)) * S} fill="none" className="viz-grid" />
          {mode === 'cond' && PARTICLES.slice(0, 40).map(({ eps, z }, i) => (
            <line key={`l${i}`} x1={sx(eps[0])} y1={sy(eps[1])} x2={sx(z[0])} y2={sy(z[1])} stroke="var(--chart-axis)" strokeWidth={0.6} />
          ))}
          {pos.map((p, i) => (
            <circle key={i} cx={sx(p[0])} cy={sy(p[1])} r={3} fill={SERIES[0]} opacity={0.75} />
          ))}
          {TARGETS.map((z, i) => (
            <circle key={`t${i}`} cx={sx(z[0])} cy={sy(z[1])} r={6} fill="none" stroke={SERIES[1]} strokeWidth={2} />
          ))}
        </svg>
        <div className="space-y-3">
          <Segmented value={mode} onChange={setMode} options={[['cond', '训练时：条件直线路径'], ['marg', '推理时：边际速度 Euler']]} />
          <Slider label="时间 $t$（0 = 噪声，1 = 数据）" value={t} min={0} max={1} step={0.01} onChange={setT} format={(v) => v.toFixed(2)} />
          {mode === 'marg' && <Slider label="Euler 步数 $n$（$h = 1/n$）" value={steps} min={1} max={60} step={1} onChange={setSteps} />}
          <div className="grid grid-cols-2 gap-2">
            <Readout label="到最近数据点的平均距离" value={err.toFixed(3)} emphasis />
            <Readout label="当前已走步数" value={mode === 'marg' ? `${Math.min(steps, Math.floor(t * steps + 1e-9))} / ${steps}` : '—'} />
          </div>
        </div>
      </div>
    </ExploreCard>
  );
};
