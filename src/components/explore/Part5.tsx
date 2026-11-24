import React, { useMemo, useState } from 'react';
import { FastForward, RotateCcw, StepForward } from 'lucide-react';
import { Button, Controls, ExploreCard, LineChart, Readout, SERIES, Slider, gaussian, linspace, mulberry32 } from './kit';
import { softmax } from './math';

/* ===================== L14 · Gridworld value iteration ===================== */

const N = 4;
const GOAL = '0,3', PIT = '1,3', WALL = '1,1';
const ACTIONS: { d: [number, number]; arrow: string }[] = [
  { d: [-1, 0], arrow: '↑' },
  { d: [0, 1], arrow: '→' },
  { d: [1, 0], arrow: '↓' },
  { d: [0, -1], arrow: '←' },
];
const key = (r: number, c: number) => `${r},${c}`;
const terminal = (k: string) => k === GOAL || k === PIT;

function move(r: number, c: number, a: number): [number, number] {
  const [dr, dc] = ACTIONS[a].d;
  const nr = r + dr, nc = c + dc;
  if (nr < 0 || nr >= N || nc < 0 || nc >= N || key(nr, nc) === WALL) return [r, c]; // bump: stay
  return [nr, nc];
}

function bellman(V: number[][], gamma: number, slip: number, step: number) {
  const Q = (r: number, c: number, a: number) => {
    const outcomes: [number, number][] = [[a, 1 - slip], [(a + 1) % 4, slip / 2], [(a + 3) % 4, slip / 2]];
    return outcomes.reduce((s, [b, p]) => {
      const [nr, nc] = move(r, c, b);
      return s + p * (step + gamma * V[nr][nc]);
    }, 0);
  };
  const next = V.map((row, r) =>
    row.map((_, c) => {
      const k = key(r, c);
      if (k === GOAL) return 1;
      if (k === PIT) return -1;
      if (k === WALL) return 0;
      return Math.max(...[0, 1, 2, 3].map((a) => Q(r, c, a)));
    })
  );
  const policy = V.map((row, r) => row.map((_, c) => {
    const k = key(r, c);
    if (terminal(k) || k === WALL) return -1;
    const qs = [0, 1, 2, 3].map((a) => Q(r, c, a));
    return qs.indexOf(Math.max(...qs));
  }));
  return { next, policy };
}

const ZERO = (): number[][] => Array.from({ length: N }, (_, r) => Array.from({ length: N }, (_, c) => (key(r, c) === GOAL ? 1 : key(r, c) === PIT ? -1 : 0)));

export const GridValueIteration: React.FC = () => {
  const [gamma, setGamma] = useState(0.9);
  const [slip, setSlip] = useState(0.2);
  const [step, setStep] = useState(-0.04);
  const [V, setV] = useState(ZERO);
  const [k, setK] = useState(0);
  const [delta, setDelta] = useState<number | null>(null);
  const { policy } = bellman(V, gamma, slip, step);

  const iterate = (times: number) => {
    let cur = V, d = 0, n = 0;
    for (; n < times; n++) {
      const { next } = bellman(cur, gamma, slip, step);
      d = Math.max(...next.flatMap((row, r) => row.map((v, c) => Math.abs(v - cur[r][c]))));
      cur = next;
      if (times > 1 && d < 1e-4) { n++; break; }
    }
    setV(cur);
    setK((x) => x + n);
    setDelta(d);
  };
  const reset = () => { setV(ZERO()); setK(0); setDelta(null); };
  const color = (v: number) =>
    v >= 0
      ? `color-mix(in oklab, var(--series-1) ${Math.round(Math.min(1, v) * 80)}%, transparent)`
      : `color-mix(in oklab, var(--series-2) ${Math.round(Math.min(1, -v) * 80)}%, transparent)`;

  return (
    <ExploreCard
      title="价值迭代：看价值从奖励处向外「扩散」"
      prompt="右上角 +1 是终点，下面 −1 是陷阱，深灰格是墙。动作有一定概率滑向两侧。逐次点「迭代一次」，观察 $V_k$ 与箭头（贪心策略）；然后改变 $\gamma$、滑动概率或每步奖励，再「迭代到收敛」。"
      insight="每次迭代就是一次 Bellman 最优算子：$V_{k+1}(s) = \max_a\sum_{s'}P(s'|s,a)[r + \gamma V_k(s')]$，价值一层层从终点往外传播。策略往往比价值更早稳定（讲义网格例子 V20 → V30 只变了一个格子）。滑动概率大时，最优路线会刻意远离陷阱；每步奖励很负时，智能体宁可冒险走近路；$\gamma$ 小则远处的格子几乎感受不到终点的奖励。"
    >
      <div className="grid items-start gap-6 md:grid-cols-[auto_1fr]">
        <div className="inline-grid gap-1" style={{ gridTemplateColumns: `repeat(${N}, 64px)` }}>
          {V.map((row, r) =>
            row.map((v, c) => {
              const kk = key(r, c);
              const isWall = kk === WALL;
              return (
                <div key={kk} className={`flex h-16 flex-col items-center justify-center rounded-lg border text-center ${isWall ? 'border-stone-500 bg-stone-500 dark:border-zinc-600 dark:bg-zinc-600' : 'border-stone-200 dark:border-zinc-700'}`} style={isWall ? undefined : { background: color(v) }}>
                  {!isWall && (
                    <>
                      <span className="text-lg leading-none text-stone-800 dark:text-zinc-100">{kk === GOAL ? '★' : kk === PIT ? '✕' : policy[r][c] >= 0 && k > 0 ? ACTIONS[policy[r][c]].arrow : ''}</span>
                      <span className="mt-1 font-mono text-[12px] tabular-nums text-stone-700 dark:text-zinc-200">{v.toFixed(2)}</span>
                    </>
                  )}
                </div>
              );
            })
          )}
        </div>
        <div className="space-y-3">
          <Controls cols={1}>
            <Slider label="折扣 $\gamma$" value={gamma} min={0.1} max={0.99} step={0.01} onChange={(v) => { setGamma(v); reset(); }} format={(v) => v.toFixed(2)} />
            <Slider label="滑动概率（偏到两侧）" value={slip} min={0} max={0.6} step={0.05} onChange={(v) => { setSlip(v); reset(); }} format={(v) => v.toFixed(2)} />
            <Slider label="每步奖励 $r$" value={step} min={-0.5} max={0} step={0.01} onChange={(v) => { setStep(v); reset(); }} format={(v) => v.toFixed(2)} />
          </Controls>
          <div className="flex flex-wrap gap-2">
            <Button primary onClick={() => iterate(1)}><StepForward className="h-4 w-4" />迭代一次</Button>
            <Button onClick={() => iterate(500)}><FastForward className="h-4 w-4" />迭代到收敛</Button>
            <Button onClick={reset}><RotateCcw className="h-4 w-4" />重置</Button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Readout label="迭代次数 $k$" value={String(k)} />
            <Readout label="$\max_s|V_{k} - V_{k-1}|$" value={delta === null ? '—' : delta.toExponential(2)} emphasis />
          </div>
        </div>
      </div>
    </ExploreCard>
  );
};

/* ===================== L15 · Max-operator overestimation ===================== */

export const Overestimation: React.FC = () => {
  const [K, setK] = useState(6);
  const [sigma, setSigma] = useState(1);
  const sim = useMemo(() => {
    const r = mulberry32(17);
    const trials = 1500;
    return Array.from({ length: 20 }, (_, i) => {
      const k = i + 1;
      let single = 0, dbl = 0;
      for (let t = 0; t < trials; t++) {
        const a = Array.from({ length: k }, () => sigma * gaussian(r)); // online-net estimates
        const b = Array.from({ length: k }, () => sigma * gaussian(r)); // target-net estimates
        single += Math.max(...b);
        dbl += b[a.indexOf(Math.max(...a))];
      }
      return { k, single: single / trials, dbl: dbl / trials };
    });
  }, [sigma]);
  const cur = sim[K - 1];
  return (
    <ExploreCard
      title="为什么 max 会高估：DQN vs Double DQN"
      prompt="假设下一状态所有动作的真实价值都是 0，但网络的估计带有标准差 $\sigma$ 的噪声。改变动作数 $K$ 和噪声大小，比较「同一组估计既选又评」与「一组选、另一组评」的期望。"
      insight="真实的 $\max_a Q(s',a) = 0$，但 $\mathbb{E}[\max_a \hat Q] > 0$，并且动作越多、噪声越大，高估越严重——被噪声抬高的动作最容易被 argmax 选中。Double DQN 用在线网络选动作、用目标网络（误差独立）评估，期望回到 0 附近。高估会沿 TD 目标一步步累积，所以影响很大。"
    >
      <LineChart
        ariaLabel="TD 目标中 max 项的期望"
        xDomain={[1, 20]}
        yDomain={[-0.5, Math.max(2, 2 * sigma)]}
        xLabel="动作数 K"
        series={[
          { name: 'DQN: E[max Q̂]', color: SERIES[1], points: sim.map((s) => [s.k, s.single]) },
          { name: 'Double DQN', color: SERIES[0], points: sim.map((s) => [s.k, s.dbl]) },
        ]}
        overlay={(s) => (
          <g>
            <line x1={s.pad.l} x2={s.W - s.pad.r} y1={s.y(0)} y2={s.y(0)} stroke="var(--chart-ink)" strokeDasharray="4 3" />
            <text className="viz-text" x={s.pad.l + 6} y={s.y(0) - 5}>真实值 0</text>
            <line x1={s.x(K)} x2={s.x(K)} y1={s.pad.t} y2={s.H - s.pad.b} className="viz-axis" strokeDasharray="2 3" />
          </g>
        )}
      />
      <div className="mt-3">
        <Controls>
          <Slider label="动作数 $K$" value={K} min={1} max={20} step={1} onChange={setK} />
          <Slider label="估计噪声 $\sigma$" value={sigma} min={0.1} max={2} step={0.1} onChange={setSigma} format={(v) => v.toFixed(1)} />
        </Controls>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <Readout color={SERIES[1]} label="DQN 的 max 项（期望）" value={cur.single.toFixed(3)} emphasis />
        <Readout color={SERIES[0]} label="Double DQN（期望）" value={cur.dbl.toFixed(3)} />
      </div>
    </ExploreCard>
  );
};

/* ===================== L16 · REINFORCE on a bandit ===================== */

const ARM_MEANS = [8, 9, 10];

function train(lr: number, baseline: boolean, steps: number, runs: number) {
  const curve = new Array(steps).fill(0);
  for (let run = 0; run < runs; run++) {
    const r = mulberry32(500 + run);
    const theta = [0, 0, 0];
    let b = 0;
    for (let t = 0; t < steps; t++) {
      const p = softmax(theta);
      curve[t] += p[2] / runs;
      let u = r(), a = 0;
      while (a < 2 && u > p[a]) { u -= p[a]; a++; }
      const reward = ARM_MEANS[a] + gaussian(r);
      const adv = baseline ? reward - b : reward;
      for (let j = 0; j < 3; j++) theta[j] += lr * adv * ((j === a ? 1 : 0) - p[j]); // ∇ log softmax
      b += 0.05 * (reward - b);
    }
  }
  return curve;
}

export const BanditReinforce: React.FC = () => {
  const [lr, setLr] = useState(0.04);
  const steps = 400;
  const noBase = useMemo(() => train(lr, false, steps, 40), [lr]);
  const withBase = useMemo(() => train(lr, true, steps, 40), [lr]);
  const xs = linspace(0, steps - 1, steps);
  return (
    <ExploreCard
      title="REINFORCE：基线如何降低方差"
      prompt="三臂老虎机，平均奖励分别是 8、9、10（全是正数），策略是对 3 个参数做 softmax。曲线是 40 次独立训练中「选到最好那只臂」概率的平均。调大学习率试试。"
      insight="不减基线时，每个被选中的动作都得到正奖励，于是总会被「加强」——只是好动作加强得多一点，信号淹没在噪声里，学得又慢又不稳；学习率一大还会被偶然的选择带偏。减去基线（奖励的滑动平均）后，只有好于平均的动作被加强、差于平均的被削弱：期望梯度不变（无偏），方差大幅降低。这正是优势函数 $A = Q - V$ 与 Actor-Critic 的出发点。"
    >
      <LineChart
        ariaLabel="选择最优臂的概率"
        xDomain={[0, steps]}
        yDomain={[0, 1]}
        xLabel="训练步数"
        yLabel="P(最优臂)"
        series={[
          { name: '无基线', color: SERIES[1], points: xs.map((x, i) => [x, noBase[i]]) },
          { name: '减去基线', color: SERIES[0], points: xs.map((x, i) => [x, withBase[i]]) },
        ]}
      />
      <div className="mt-3">
        <Slider label="学习率 $\alpha$" value={lr} min={0.002} max={0.08} step={0.002} onChange={setLr} format={(v) => v.toFixed(3)} />
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <Readout color={SERIES[1]} label="无基线：最终 P(最优臂)" value={noBase[steps - 1].toFixed(3)} />
        <Readout color={SERIES[0]} label="有基线：最终 P(最优臂)" value={withBase[steps - 1].toFixed(3)} emphasis />
      </div>
    </ExploreCard>
  );
};
