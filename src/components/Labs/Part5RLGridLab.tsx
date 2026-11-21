import React, { useMemo, useState } from 'react';
import { Compass, FastForward, Play, RotateCcw, Shield } from 'lucide-react';

type CellType = 'empty' | 'wall' | 'goal' | 'trap';

const ACTIONS = [
  { dr: -1, dc: 0, arrow: '↑', name: '上' },
  { dr: 0, dc: 1, arrow: '→', name: '右' },
  { dr: 1, dc: 0, arrow: '↓', name: '下' },
  { dr: 0, dc: -1, arrow: '←', name: '左' },
];

const DEFAULT_GRID: CellType[][] = [
  ['empty', 'empty', 'empty', 'empty', 'goal'],
  ['empty', 'wall', 'empty', 'wall', 'trap'],
  ['empty', 'empty', 'empty', 'empty', 'empty'],
  ['empty', 'wall', 'trap', 'wall', 'empty'],
  ['empty', 'empty', 'empty', 'empty', 'empty'],
];

function emptyQ(): number[][][] {
  return Array.from({ length: 5 }, () =>
    Array.from({ length: 5 }, () => [0, 0, 0, 0])
  );
}

export const Part5RLGridLab: React.FC = () => {
  const [tab, setTab] = useState<'grid' | 'ppo'>('grid');

  // --- GridWorld State ---
  const [grid, setGrid] = useState<CellType[][]>(() => DEFAULT_GRID.map((r) => [...r]));
  const [brush, setBrush] = useState<CellType>('wall');
  const [algo, setAlgo] = useState<'vi' | 'qlearn'>('vi');
  const [gamma, setGamma] = useState(0.9);
  const [alpha, setAlpha] = useState(0.3);
  const [epsilon, setEpsilon] = useState(0.2);
  const [qTable, setQTable] = useState<number[][][]>(() => emptyQ());
  const [iters, setIters] = useState(0);
  const [hoverCell, setHoverCell] = useState<[number, number] | null>(null);

  const stepReward = (r: number, c: number, g: CellType[][]) => {
    if (g[r][c] === 'goal') return 10;
    if (g[r][c] === 'trap') return -10;
    return -0.2;
  };

  const nextPos = (r: number, c: number, a: number, g: CellType[][]): [number, number] => {
    const nr = r + ACTIONS[a].dr;
    const nc = c + ACTIONS[a].dc;
    if (nr < 0 || nr >= 5 || nc < 0 || nc >= 5 || g[nr][nc] === 'wall') return [r, c];
    return [nr, nc];
  };

  const runSteps = (count: number) => {
    setQTable((prev) => {
      let Q = prev.map((row) => row.map((acts) => [...acts]));
      for (let step = 0; step < count; step++) {
        if (algo === 'vi') {
          // Synchronous Bellman Optimality backup on Q(s, a)
          const nextQ = Q.map((row) => row.map((acts) => [...acts]));
          for (let r = 0; r < 5; r++) {
            for (let c = 0; c < 5; c++) {
              if (grid[r][c] !== 'empty') continue;
              for (let a = 0; a < 4; a++) {
                const [nr, nc] = nextPos(r, c, a, grid);
                const rew = stepReward(nr, nc, grid);
                const future =
                  grid[nr][nc] === 'goal' || grid[nr][nc] === 'trap'
                    ? 0
                    : Math.max(...Q[nr][nc]);
                nextQ[r][c][a] = rew + gamma * future;
              }
            }
          }
          Q = nextQ;
        } else {
          // Run one full Q-Learning episode starting from bottom-left (4,0) or random empty cell
          let r = 4;
          let c = 0;
          if (grid[r][c] !== 'empty') {
            r = 2;
            c = 0;
          }
          for (let t = 0; t < 40; t++) {
            let a: number;
            if (Math.random() < epsilon) {
              a = Math.floor(Math.random() * 4);
            } else {
              const vals = Q[r][c];
              const maxV = Math.max(...vals);
              const bests = vals
                .map((v, i) => (Math.abs(v - maxV) < 1e-6 ? i : -1))
                .filter((i) => i >= 0);
              a = bests[Math.floor(Math.random() * bests.length)];
            }
            const [nr, nc] = nextPos(r, c, a, grid);
            const rew = stepReward(nr, nc, grid);
            const terminal = grid[nr][nc] === 'goal' || grid[nr][nc] === 'trap';
            const tdTarget = rew + (terminal ? 0 : gamma * Math.max(...Q[nr][nc]));
            Q[r][c][a] += alpha * (tdTarget - Q[r][c][a]);
            r = nr;
            c = nc;
            if (terminal) break;
          }
        }
      }
      return Q;
    });
    setIters((n) => n + count);
  };

  // --- PPO Clipped Surrogate Visualizer ---
  const [ppoAdv, setPpoAdv] = useState<number>(1.0); // +1 or -1
  const [ppoEps, setPpoEps] = useState<number>(0.2);
  const [ppoRatio, setPpoRatio] = useState<number>(1.32);

  const ppoCurves = useMemo(() => {
    const xs: number[] = [];
    const unclipped: number[] = [];
    const clipped: number[] = [];
    const finalObj: number[] = [];
    for (let i = 0; i <= 100; i++) {
      const r = 0.2 + (1.6 * i) / 100;
      xs.push(r);
      const u = r * ppoAdv;
      const rc = Math.max(1 - ppoEps, Math.min(1 + ppoEps, r));
      const c = rc * ppoAdv;
      unclipped.push(u);
      clipped.push(c);
      finalObj.push(Math.min(u, c));
    }
    return { xs, unclipped, clipped, finalObj };
  }, [ppoAdv, ppoEps]);

  const toPpoPath = (vals: number[]) =>
    vals
      .map((v, i) => {
        const px = 42 + (i / (vals.length - 1)) * 456;
        const py = 120 - (v / 2.0) * 95;
        return `${i === 0 ? 'M' : 'L'} ${px.toFixed(1)} ${py.toFixed(1)}`;
      })
      .join(' ');

  const isClippedActive =
    (ppoAdv > 0 && ppoRatio > 1 + ppoEps) || (ppoAdv < 0 && ppoRatio < 1 - ppoEps);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50/80 px-5 py-3.5 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-2">
          <Compass className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            交互实验室 5 · GridWorld 强化学习迷宫 & PPO 裁剪目标函数
          </h3>
        </div>
        <div className="flex rounded-lg border border-slate-200 bg-white p-0.5 text-xs font-medium dark:border-slate-700 dark:bg-slate-800">
          <button
            onClick={() => setTab('grid')}
            className={`rounded-md px-3 py-1 transition cursor-pointer ${
              tab === 'grid' ? 'bg-emerald-600 text-white' : 'text-slate-600 dark:text-slate-300'
            }`}
          >
            GridWorld · Value Iteration / Q-Learning
          </button>
          <button
            onClick={() => setTab('ppo')}
            className={`rounded-md px-3 py-1 transition cursor-pointer ${
              tab === 'ppo' ? 'bg-emerald-600 text-white' : 'text-slate-600 dark:text-slate-300'
            }`}
          >
            PPO Clipped Surrogate 原理
          </button>
        </div>
      </div>

      {tab === 'grid' ? (
        <div className="p-5 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left: 5x5 Interactive Grid */}
          <div className="lg:col-span-6 flex flex-col items-center gap-3">
            <div className="flex flex-wrap items-center justify-center gap-1.5 text-xs">
              <span className="text-slate-500">点击格子编辑地图：</span>
              {[
                { id: 'wall', label: '⬛ 墙壁' },
                { id: 'goal', label: '🏆 终点 (+10)' },
                { id: 'trap', label: '🔥 陷阱 (-10)' },
                { id: 'empty', label: '⬜ 空地' },
              ].map((b) => (
                <button
                  key={b.id}
                  onClick={() => setBrush(b.id as CellType)}
                  className={`rounded-md border px-2 py-0.5 cursor-pointer ${
                    brush === b.id
                      ? 'border-blue-600 bg-blue-50 text-blue-700 font-semibold dark:bg-blue-950/60 dark:text-blue-300'
                      : 'border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {b.label}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-5 gap-1.5 p-2 rounded-2xl border border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-950">
              {grid.map((row, r) =>
                row.map((cell, c) => {
                  const qVals = qTable[r][c];
                  const maxQ = Math.max(...qVals);
                  const bestAct = qVals.indexOf(maxQ);
                  const norm = Math.min(1, Math.abs(maxQ) / 10);
                  const bgStyle =
                    cell === 'empty'
                      ? {
                          backgroundColor:
                            maxQ > 0.05
                              ? `rgba(16, 185, 129, ${0.1 + norm * 0.65})`
                              : maxQ < -0.05
                              ? `rgba(244, 63, 94, ${0.1 + norm * 0.6})`
                              : undefined,
                        }
                      : undefined;

                  return (
                    <button
                      key={`${r}-${c}`}
                      onMouseEnter={() => setHoverCell([r, c])}
                      onClick={() => {
                        setGrid((prev) =>
                          prev.map((pr, ri) =>
                            pr.map((pc, ci) => (ri === r && ci === c ? brush : pc))
                          )
                        );
                        setQTable(emptyQ());
                        setIters(0);
                      }}
                      style={bgStyle}
                      className={`h-14 w-14 sm:h-16 sm:w-16 rounded-xl border flex flex-col items-center justify-center transition cursor-pointer relative ${
                        cell === 'wall'
                          ? 'bg-slate-800 border-slate-700 text-slate-400'
                          : cell === 'goal'
                          ? 'bg-emerald-500 border-emerald-400 text-white font-bold shadow-sm'
                          : cell === 'trap'
                          ? 'bg-rose-500 border-rose-400 text-white font-bold shadow-sm'
                          : 'bg-white border-slate-200 text-slate-800 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-100'
                      }`}
                    >
                      {cell === 'wall' && <span className="text-sm">WALL</span>}
                      {cell === 'goal' && (
                        <>
                          <span className="text-base">🏆</span>
                          <span className="text-[10px] font-mono">+10</span>
                        </>
                      )}
                      {cell === 'trap' && (
                        <>
                          <span className="text-base">🔥</span>
                          <span className="text-[10px] font-mono">-10</span>
                        </>
                      )}
                      {cell === 'empty' && (
                        <>
                          <span className="text-base font-bold leading-none">
                            {iters > 0 ? ACTIONS[bestAct].arrow : '·'}
                          </span>
                          <span className="mt-1 font-mono text-[10px] opacity-80">
                            {maxQ.toFixed(1)}
                          </span>
                        </>
                      )}
                      {r === 4 && c === 0 && cell === 'empty' && (
                        <span className="absolute top-0.5 left-1 text-[8px] font-bold text-blue-600 dark:text-blue-400">
                          S
                        </span>
                      )}
                    </button>
                  );
                })
              )}
            </div>

            {hoverCell && grid[hoverCell[0]][hoverCell[1]] === 'empty' && (
              <div className="flex flex-wrap justify-center gap-2 rounded-lg bg-slate-100 px-3 py-1.5 font-mono text-[11px] dark:bg-slate-800">
                <span>格子 ({hoverCell[0]},{hoverCell[1]}) Q 值：</span>
                {ACTIONS.map((a, idx) => (
                  <span key={a.name}>
                    {a.arrow} {qTable[hoverCell[0]][hoverCell[1]][idx].toFixed(2)}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Right: Algorithm Controls */}
          <div className="lg:col-span-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex rounded-lg border border-slate-200 p-0.5 text-xs dark:border-slate-700">
                <button
                  onClick={() => {
                    setAlgo('vi');
                    setQTable(emptyQ());
                    setIters(0);
                  }}
                  className={`rounded-md px-3 py-1 cursor-pointer ${
                    algo === 'vi' ? 'bg-blue-600 text-white font-medium' : 'text-slate-600 dark:text-slate-300'
                  }`}
                >
                  Value Iteration (DP)
                </button>
                <button
                  onClick={() => {
                    setAlgo('qlearn');
                    setQTable(emptyQ());
                    setIters(0);
                  }}
                  className={`rounded-md px-3 py-1 cursor-pointer ${
                    algo === 'qlearn' ? 'bg-blue-600 text-white font-medium' : 'text-slate-600 dark:text-slate-300'
                  }`}
                >
                  Q-Learning (Model-Free TD)
                </button>
              </div>

              <span className="font-mono text-xs text-slate-500">
                {algo === 'vi' ? `迭代轮数: ${iters}` : `探索回合: ${iters} Episodes`}
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => runSteps(1)}
                className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-emerald-500 cursor-pointer"
              >
                <Play className="h-3.5 w-3.5" /> 单步更新 (+1)
              </button>
              <button
                onClick={() => runSteps(algo === 'vi' ? 15 : 80)}
                className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-blue-500 cursor-pointer"
              >
                <FastForward className="h-3.5 w-3.5" />
                {algo === 'vi' ? '迭代 15 轮收敛' : '跑 80 Episodes'}
              </button>
              <button
                onClick={() => {
                  setQTable(emptyQ());
                  setIters(0);
                }}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 cursor-pointer"
              >
                <RotateCcw className="h-3.5 w-3.5" /> 清空 Q 表
              </button>
            </div>

            <div className="rounded-xl border border-slate-200 p-4 space-y-3 dark:border-slate-800">
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span>折扣因子 γ（越接近 1 越看重长远未来奖励）</span>
                  <span className="font-mono font-bold text-blue-600">{gamma.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min={0.3}
                  max={0.99}
                  step={0.03}
                  value={gamma}
                  onChange={(e) => setGamma(parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>

              {algo === 'qlearn' && (
                <>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span>学习率 α（TD 误差更新步长）</span>
                      <span className="font-mono font-bold text-violet-600">{alpha.toFixed(2)}</span>
                    </div>
                    <input
                      type="range"
                      min={0.05}
                      max={0.8}
                      step={0.05}
                      value={alpha}
                      onChange={(e) => setAlpha(parseFloat(e.target.value))}
                      className="w-full"
                    />
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span>探索率 ε (ε-greedy)</span>
                      <span className="font-mono font-bold text-amber-600">{epsilon.toFixed(2)}</span>
                    </div>
                    <input
                      type="range"
                      min={0.05}
                      max={0.6}
                      step={0.05}
                      value={epsilon}
                      onChange={(e) => setEpsilon(parseFloat(e.target.value))}
                      className="w-full"
                    />
                  </div>
                </>
              )}
            </div>

            <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">
              {algo === 'vi'
                ? 'Value Iteration 假设已知环境转移模型，每轮对全部状态同步做 Bellman 最优回溯，你能看到价值热力图从终点 🏆 一圈圈向外扩散！'
                : 'Q-Learning 完全不知道地图结构，智能体从左下角起点 S 出发不断试错，利用 TD 误差 r + γ max Q(s′,a′) − Q(s,a) 逐步摸索出绕开陷阱的最优策略！'}
            </p>
          </div>
        </div>
      ) : (
        <div className="p-5 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          <div className="lg:col-span-7 rounded-xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-950/70">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="font-semibold flex items-center gap-1.5">
                <Shield className="h-3.5 w-3.5 text-blue-500" />
                PPO 目标函数 L^CLIP(θ) 随概率比 r_t = π_θ / π_old 的变化
              </span>
              <div className="flex gap-3 text-[11px]">
                <span className="text-slate-400">--- 未裁剪 r·Â</span>
                <span className="text-emerald-600 font-bold">● PPO min(r·Â, clip·Â)</span>
              </div>
            </div>
            <svg viewBox="0 0 540 240" className="w-full h-auto">
              {/* Trust Region Band [1-eps, 1+eps] */}
              <rect
                x={42 + ((1 - ppoEps - 0.2) / 1.6) * 456}
                y={18}
                width={((2 * ppoEps) / 1.6) * 456}
                height={202}
                fill="rgba(59, 130, 246, 0.1)"
              />
              {/* Axes */}
              <line x1={42} x2={498} y1={120} y2={120} className="stroke-slate-300 dark:stroke-slate-700" />
              <line
                x1={42 + ((1 - 0.2) / 1.6) * 456}
                x2={42 + ((1 - 0.2) / 1.6) * 456}
                y1={18}
                y2={220}
                className="stroke-slate-400"
                strokeDasharray="3 3"
              />
              <text
                x={42 + ((1 - 0.2) / 1.6) * 456}
                y={234}
                textAnchor="middle"
                className="fill-slate-500 text-[10px] font-mono"
              >
                r = 1.0 (策略不变)
              </text>

              <path
                d={toPpoPath(ppoCurves.unclipped)}
                fill="none"
                stroke="#94a3b8"
                strokeWidth={2}
                strokeDasharray="5 4"
              />
              <path d={toPpoPath(ppoCurves.finalObj)} fill="none" stroke="#10b981" strokeWidth={3.2} />

              {/* Current Ratio Marker */}
              {(() => {
                const cx = 42 + ((ppoRatio - 0.2) / 1.6) * 456;
                const u = ppoRatio * ppoAdv;
                const c = Math.max(1 - ppoEps, Math.min(1 + ppoEps, ppoRatio)) * ppoAdv;
                const cy = 120 - (Math.min(u, c) / 2.0) * 95;
                return (
                  <g>
                    <circle
                      cx={cx}
                      cy={cy}
                      r={6.5}
                      fill={isClippedActive ? '#f43f5e' : '#3b82f6'}
                      stroke="#fff"
                      strokeWidth={2}
                    />
                  </g>
                );
              })()}
            </svg>
          </div>

          <div className="lg:col-span-5 space-y-4">
            <div className="flex gap-2 text-xs">
              <button
                onClick={() => setPpoAdv(1.0)}
                className={`flex-1 rounded-lg border py-2 font-semibold cursor-pointer ${
                  ppoAdv > 0
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                    : 'border-slate-200 dark:border-slate-700'
                }`}
              >
                好动作：Â_t = +1.0
              </button>
              <button
                onClick={() => setPpoAdv(-1.0)}
                className={`flex-1 rounded-lg border py-2 font-semibold cursor-pointer ${
                  ppoAdv < 0
                    ? 'border-rose-600 bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                    : 'border-slate-200 dark:border-slate-700'
                }`}
              >
                坏动作：Â_t = −1.0
              </button>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span>裁剪半径 ε (Trust Region)</span>
                <span className="font-mono font-bold text-blue-600">
                  [{`${(1 - ppoEps).toFixed(2)}, ${(1 + ppoEps).toFixed(2)}`}]
                </span>
              </div>
              <input
                type="range"
                min={0.05}
                max={0.4}
                step={0.05}
                value={ppoEps}
                onChange={(e) => setPpoEps(parseFloat(e.target.value))}
                className="w-full"
              />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span>当前策略概率比 r_t(θ)</span>
                <span className="font-mono font-bold text-violet-600">{ppoRatio.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min={0.25}
                max={1.75}
                step={0.02}
                value={ppoRatio}
                onChange={(e) => setPpoRatio(parseFloat(e.target.value))}
                className="w-full"
              />
            </div>

            <div
              className={`rounded-xl border p-3.5 text-xs leading-relaxed ${
                isClippedActive
                  ? 'border-rose-300 bg-rose-50/70 text-rose-900 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-200'
                  : 'border-blue-200 bg-blue-50/60 text-blue-900 dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-200'
              }`}
            >
              {isClippedActive ? (
                <>
                  <strong>已触发安全裁剪（梯度 = 0）：</strong>曲线进入水平平台！即使继续朝有利方向推大策略步长，目标函数也不再增加，防止单次更新把策略拉崩（这也是 PPO 成为 RLHF 默认算法的核心秘诀）。
                </>
              ) : (
                <>
                  <strong>正常策略梯度更新区：</strong>目标函数仍有斜率，允许策略在安全信赖域 [1−ε, 1+ε] 内稳健改进（或把过度偏离的坏步拉回）。
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
