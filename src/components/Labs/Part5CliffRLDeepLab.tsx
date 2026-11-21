import React, { useState } from 'react';
import { AlertTriangle, FastForward, RotateCcw } from 'lucide-react';

// Classic Sutton & Barto 4x8 Cliff Walking environment
// Row 3: [Start (3,0), Cliff (3,1..6), Goal (3,7)]
const ROWS = 4;
const COLS = 8;
const DIRS = [
  { dr: -1, dc: 0, arrow: '↑' },
  { dr: 0, dc: 1, arrow: '→' },
  { dr: 1, dc: 0, arrow: '↓' },
  { dr: 0, dc: -1, arrow: '←' },
];

function initTable(): number[][][] {
  return Array.from({ length: ROWS }, () => Array.from({ length: COLS }, () => [0, 0, 0, 0]));
}

function stepCliff(r: number, c: number, a: number): { nr: number; nc: number; rew: number; done: boolean } {
  const nr = Math.max(0, Math.min(ROWS - 1, r + DIRS[a].dr));
  const nc = Math.max(0, Math.min(COLS - 1, c + DIRS[a].dc));
  if (nr === 3 && nc >= 1 && nc <= 6) {
    // Fell off cliff -> -100 reward & teleport back to start (3, 0)
    return { nr: 3, nc: 0, rew: -100, done: false };
  }
  if (nr === 3 && nc === 7) {
    return { nr, nc, rew: 0, done: true };
  }
  return { nr, nc, rew: -1, done: false };
}

function pickEpsGreedy(qRow: number[], eps: number): number {
  if (Math.random() < eps) return Math.floor(Math.random() * 4);
  const maxV = Math.max(...qRow);
  const bests = qRow.map((v, i) => (Math.abs(v - maxV) < 1e-6 ? i : -1)).filter((i) => i >= 0);
  return bests[Math.floor(Math.random() * bests.length)];
}

function traceGreedyPath(Q: number[][][]): Set<string> {
  const visited = new Set<string>();
  let r = 3;
  let c = 0;
  for (let step = 0; step < 30; step++) {
    const key = `${r},${c}`;
    if (visited.has(key)) break;
    visited.add(key);
    if (r === 3 && c === 7) break;
    const bestA = Q[r][c].indexOf(Math.max(...Q[r][c]));
    const res = stepCliff(r, c, bestA);
    r = res.nr;
    c = res.nc;
  }
  return visited;
}

export const Part5CliffRLDeepLab: React.FC = () => {
  const [eps, setEps] = useState(0.15);
  const [episodes, setEpisodes] = useState(0);
  const [qSarsa, setQSarsa] = useState<number[][][]>(() => initTable());
  const [qLearn, setQLearn] = useState<number[][][]>(() => initTable());
  const [avgRetSarsa, setAvgRetSarsa] = useState<number | null>(null);
  const [avgRetQ, setAvgRetQ] = useState<number | null>(null);

  const trainBoth = (numEps: number) => {
    const alpha = 0.2;
    const gamma = 0.99;
    const nextS = qSarsa.map((row) => row.map((a) => [...a]));
    const nextQ = qLearn.map((row) => row.map((a) => [...a]));

    let sumS = 0;
    let sumQ = 0;

    for (let ep = 0; ep < numEps; ep++) {
      // --- SARSA (On-Policy): updates using ACTUAL next action a' from eps-greedy ---
      let rs = 3;
      let cs = 0;
      let aS = pickEpsGreedy(nextS[rs][cs], eps);
      let retS = 0;
      for (let t = 0; t < 120; t++) {
        const { nr, nc, rew, done } = stepCliff(rs, cs, aS);
        retS += rew;
        const nextA = pickEpsGreedy(nextS[nr][nc], eps);
        const target = rew + (done ? 0 : gamma * nextS[nr][nc][nextA]);
        nextS[rs][cs][aS] += alpha * (target - nextS[rs][cs][aS]);
        rs = nr;
        cs = nc;
        aS = nextA;
        if (done) break;
      }
      sumS += retS;

      // --- Q-Learning (Off-Policy): updates using GREEDY max_a' Q(s', a') ---
      let rq = 3;
      let cq = 0;
      let retQ = 0;
      for (let t = 0; t < 120; t++) {
        const aQ = pickEpsGreedy(nextQ[rq][cq], eps);
        const { nr, nc, rew, done } = stepCliff(rq, cq, aQ);
        retQ += rew;
        const target = rew + (done ? 0 : gamma * Math.max(...nextQ[nr][nc]));
        nextQ[rq][cq][aQ] += alpha * (target - nextQ[rq][cq][aQ]);
        rq = nr;
        cq = nc;
        if (done) break;
      }
      sumQ += retQ;
    }

    setQSarsa(nextS);
    setQLearn(nextQ);
    setEpisodes((e) => e + numEps);
    setAvgRetSarsa(sumS / numEps);
    setAvgRetQ(sumQ / numEps);
  };

  const reset = () => {
    setQSarsa(initTable());
    setQLearn(initTable());
    setEpisodes(0);
    setAvgRetSarsa(null);
    setAvgRetQ(null);
  };

  const pathSarsa = episodes > 0 ? traceGreedyPath(qSarsa) : new Set<string>();
  const pathQ = episodes > 0 ? traceGreedyPath(qLearn) : new Set<string>();

  const renderGrid = (title: string, Q: number[][][], path: Set<string>, accent: string, avgRet: number | null) => (
    <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-800 space-y-2.5">
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <span className={`font-bold ${accent}`}>{title}</span>
        {avgRet !== null && (
          <span className="font-mono text-[11px] text-slate-500">
            训练期平均回报: <strong>{avgRet.toFixed(1)}</strong>
          </span>
        )}
      </div>

      <div className="grid grid-cols-8 gap-1">
        {Array.from({ length: ROWS }).map((_, r) =>
          Array.from({ length: COLS }).map((__, c) => {
            const isStart = r === 3 && c === 0;
            const isGoal = r === 3 && c === 7;
            const isCliff = r === 3 && c >= 1 && c <= 6;
            const onPath = path.has(`${r},${c}`);
            const bestA = Q[r][c].indexOf(Math.max(...Q[r][c]));

            return (
              <div
                key={`${r}-${c}`}
                className={`h-9 rounded-md border flex items-center justify-center font-mono text-xs font-bold ${
                  isCliff
                    ? 'bg-rose-600/90 border-rose-500 text-white text-[9px]'
                    : isStart
                    ? 'bg-blue-600 border-blue-500 text-white'
                    : isGoal
                    ? 'bg-emerald-600 border-emerald-500 text-white'
                    : onPath
                    ? 'bg-amber-100 border-amber-400 text-amber-900 dark:bg-amber-950/70 dark:text-amber-200'
                    : 'bg-slate-50 border-slate-200 text-slate-400 dark:bg-slate-900 dark:border-slate-800'
                }`}
              >
                {isCliff ? '-100' : isStart ? 'S' : isGoal ? 'G' : episodes > 0 ? DIRS[bestA].arrow : '·'}
              </div>
            );
          })
        )}
      </div>
    </div>
  );

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50/80 px-5 py-3.5 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-500" />
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            交互实验室 5B · 悬崖行走 (Cliff Walking)：On-Policy SARSA vs Off-Policy Q-Learning
          </h3>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <button
            onClick={() => trainBoth(250)}
            className="inline-flex items-center gap-1 rounded-lg bg-amber-600 px-3 py-1.5 font-semibold text-white hover:bg-amber-500 cursor-pointer"
          >
            <FastForward className="h-3.5 w-3.5" /> 同步训练 250 Episodes ({episodes})
          </button>
          <button
            onClick={reset}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5" /> 重置
          </button>
        </div>
      </div>

      <div className="p-5 space-y-4">
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <span>探索率 ε = <strong className="font-mono text-amber-600">{eps.toFixed(2)}</strong>（越大越容易在悬崖边手滑掉落 −100！）</span>
          <input
            type="range"
            min={0.05}
            max={0.35}
            step={0.05}
            value={eps}
            onChange={(e) => setEps(parseFloat(e.target.value))}
            className="w-44"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {renderGrid('SARSA (On-Policy · 走上方安全绕行路径)', qSarsa, pathSarsa, 'text-emerald-600 dark:text-emerald-400', avgRetSarsa)}
          {renderGrid('Q-Learning (Off-Policy · 贴悬崖最短最优路径)', qLearn, pathQ, 'text-blue-600 dark:text-blue-400', avgRetQ)}
        </div>

        <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">
          <strong>点击训练 250 Episodes 观察经典差异：</strong>Q-Learning 用 <code className="font-mono">max Q(s′,a′)</code> 更新，学出理论步数最短的<strong>贴悬崖边缘路线</strong>，但训练期间因 ε-greedy 探索频频手滑掉崖（训练平均回报更低）；而 SARSA 用实际执行的动作 <code className="font-mono">Q(s′,a′)</code> 更新，把“自己会随机手滑”也算进风险里，因此主动绕到最上方走<strong>安全保守路径</strong>！
        </p>
      </div>
    </div>
  );
};
