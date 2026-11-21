import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Mountain, Rotate3D } from 'lucide-react';
import {
  Camera3D,
  projectPoint,
  scientificRamp,
  setupHiDPICanvas,
  Vec3,
} from '../../utils/engine3d';
import { FormulaDrivenBanner } from '../FormulaDrivenBanner';

const GRID_N = 7;
const GOAL = { r: 0, c: 6 };
const TRAPS = [
  { r: 2, c: 4 },
  { r: 3, c: 3 },
  { r: 4, c: 5 },
];

function isTrap(r: number, c: number) {
  return TRAPS.some((t) => t.r === r && t.c === c);
}

function solveValueSurface(gamma: number, iterations = 35): number[][] {
  let V = Array.from({ length: GRID_N }, () => Array(GRID_N).fill(0));
  const dirs = [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
  ];
  for (let it = 0; it < iterations; it++) {
    const nextV = V.map((row) => [...row]);
    for (let r = 0; r < GRID_N; r++) {
      for (let c = 0; c < GRID_N; c++) {
        if (r === GOAL.r && c === GOAL.c) {
          nextV[r][c] = 10;
          continue;
        }
        if (isTrap(r, c)) {
          nextV[r][c] = -7;
          continue;
        }
        let best = -Infinity;
        for (const [dr, dc] of dirs) {
          const nr = Math.max(0, Math.min(GRID_N - 1, r + dr));
          const nc = Math.max(0, Math.min(GRID_N - 1, c + dc));
          const rew = nr === GOAL.r && nc === GOAL.c ? 10 : isTrap(nr, nc) ? -7 : -0.15;
          const future = (nr === GOAL.r && nc === GOAL.c) || isTrap(nr, nc) ? 0 : V[nr][nc];
          best = Math.max(best, rew + gamma * future);
        }
        nextV[r][c] = best;
      }
    }
    V = nextV;
  }
  return V;
}

export const Studio3DRLValueMountain: React.FC = () => {
  const [yaw, setYaw] = useState(0.68);
  const [pitch, setPitch] = useState(0.56);
  const [gamma, setGamma] = useState(0.88);
  const [useFuture, setUseFuture] = useState(true);
  const [activeTerm, setActiveTerm] = useState<string | null>('gamma');

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dragRef = useRef({ dragging: false, lx: 0, ly: 0 });

  const effGamma = useFuture ? gamma : 0;
  const V = useMemo(() => solveValueSurface(effGamma, 40), [effGamma]);

  // Trace greedy policy path from bottom-left (6,0) up the 3D value mountain
  const greedyPath = useMemo(() => {
    const path: [number, number][] = [[6, 0]];
    let r = 6;
    let c = 0;
    const dirs = [
      [-1, 0],
      [0, 1],
      [1, 0],
      [0, -1],
    ];
    for (let step = 0; step < 20; step++) {
      if (r === GOAL.r && c === GOAL.c) break;
      let bestVal = -Infinity;
      let bestNext: [number, number] = [r, c];
      for (const [dr, dc] of dirs) {
        const nr = Math.max(0, Math.min(GRID_N - 1, r + dr));
        const nc = Math.max(0, Math.min(GRID_N - 1, c + dc));
        if (V[nr][nc] > bestVal) {
          bestVal = V[nr][nc];
          bestNext = [nr, nc];
        }
      }
      if (bestNext[0] === r && bestNext[1] === c) break;
      r = bestNext[0];
      c = bestNext[1];
      path.push([r, c]);
    }
    return path;
  }, [V]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const W = 560;
    const H = 330;
    const ctx = setupHiDPICanvas(canvas, W, H);
    if (!ctx) return;

    const cam: Camera3D = { yaw, pitch, dist: 5.1, fov: 390 };
    ctx.clearRect(0, 0, W, H);

    const to3D = (r: number, c: number, val: number): Vec3 => {
      const x = ((c / (GRID_N - 1)) - 0.5) * 2.8;
      const z = ((r / (GRID_N - 1)) - 0.5) * 2.8;
      // Map [-7, 10] -> [-0.55, 1.15]
      const y = ((val + 7) / 17) * 1.7 - 0.6;
      return { x, y, z };
    };

    interface Quad {
      pts: Vec3[];
      depth: number;
      normVal: number;
    }
    const quads: Quad[] = [];
    for (let r = 0; r < GRID_N - 1; r++) {
      for (let c = 0; c < GRID_N - 1; c++) {
        const p00 = to3D(r, c, V[r][c]);
        const p10 = to3D(r + 1, c, V[r + 1][c]);
        const p11 = to3D(r + 1, c + 1, V[r + 1][c + 1]);
        const p01 = to3D(r, c + 1, V[r][c + 1]);
        const avgVal = (V[r][c] + V[r + 1][c] + V[r + 1][c + 1] + V[r][c + 1]) / 4;
        const mid: Vec3 = {
          x: (p00.x + p10.x + p11.x + p01.x) / 4,
          y: (p00.y + p10.y + p11.y + p01.y) / 4,
          z: (p00.z + p10.z + p11.z + p01.z) / 4,
        };
        quads.push({
          pts: [p00, p10, p11, p01],
          depth: projectPoint(mid, cam, W, H).depth,
          normVal: (avgVal + 7) / 17,
        });
      }
    }

    quads.sort((a, b) => b.depth - a.depth);
    for (const q of quads) {
      const proj = q.pts.map((pt) => projectPoint(pt, cam, W, H));
      ctx.beginPath();
      ctx.moveTo(proj[0].x, proj[0].y);
      ctx.lineTo(proj[1].x, proj[1].y);
      ctx.lineTo(proj[2].x, proj[2].y);
      ctx.lineTo(proj[3].x, proj[3].y);
      ctx.closePath();
      ctx.fillStyle = scientificRamp(q.normVal, 0.82);
      ctx.fill();
      ctx.strokeStyle = 'rgba(15, 23, 42, 0.35)';
      ctx.lineWidth = 0.8;
      ctx.stroke();
    }

    // Draw climbing optimal policy trajectory on the 3D surface!
    ctx.beginPath();
    greedyPath.forEach(([r, c], idx) => {
      const p3 = to3D(r, c, V[r][c]);
      const p2 = projectPoint({ x: p3.x, y: p3.y + 0.08, z: p3.z }, cam, W, H);
      if (idx === 0) ctx.moveTo(p2.x, p2.y);
      else ctx.lineTo(p2.x, p2.y);
    });
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Mark Start, Goal Summit, and Trap Chasms
    const pGoal = projectPoint(to3D(GOAL.r, GOAL.c, V[GOAL.r][GOAL.c]), cam, W, H);
    ctx.beginPath();
    ctx.arc(pGoal.x, pGoal.y, 7, 0, Math.PI * 2);
    ctx.fillStyle = '#10b981';
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#a7f3d0';
    ctx.font = '700 11px "JetBrains Mono", monospace';
    ctx.fillText('🏆 Goal Summit (+10)', pGoal.x - 56, pGoal.y - 12);

    const pStart = projectPoint(to3D(6, 0, V[6][0]), cam, W, H);
    ctx.beginPath();
    ctx.arc(pStart.x, pStart.y, 6, 0, Math.PI * 2);
    ctx.fillStyle = '#38bdf8';
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#bae6fd';
    ctx.fillText(`Start V=${V[6][0].toFixed(1)}`, pStart.x + 8, pStart.y + 4);
  }, [yaw, pitch, V, greedyPath]);

  return (
    <div className="rounded-2xl border border-slate-200/90 bg-white shadow-md overflow-hidden dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 px-5 py-3.5 text-white">
        <div className="flex items-center gap-2">
          <Mountain className="h-4 w-4 text-emerald-400" />
          <h3 className="text-sm sm:text-base font-bold">
            3D Bellman 价值山峰演播室 · 拖动折扣因子 γ 看“远见如何抬起整座价值地形”
          </h3>
        </div>
        <span className="text-[11px] text-emerald-300 font-mono">拖拽旋转 3D 价值曲面 V*(s)</span>
      </div>

      <div className="p-5 space-y-4">
        <FormulaDrivenBanner
          latex={String.raw`\htmlClass{formula-token formula-token-output token-vs}{V^*(s)} = \max_a \Big[\htmlClass{formula-token formula-token-data token-rew}{R(s, a)} + \htmlClass{formula-token formula-token-hyper token-gamma}{\gamma \, V^*(s')}\Big]`}
          activeTermId={activeTerm}
          onSelectTerm={setActiveTerm}
          terms={[
            {
              id: 'vs',
              symbol: 'V*(s) 3D 山峰海拔',
              role: 'output',
              liveValue: `起点海拔 V(S) = ${V[6][0].toFixed(2)}`,
              roleDesc: '每个格子的高度就是最优价值 V*(s)：最优策略 π*(s) 其实就是沿着这座三维价值山峰“永远往高处爬”的白色轨迹！',
            },
            {
              id: 'rew',
              symbol: 'R(s, a) 即时奖励',
              role: 'data',
              liveValue: '终点 +10 · 陷阱 −7',
              roleDesc: '奖励函数在地形上钉出了翠绿山顶 (+10) 与深红陷阱裂谷 (−7)。',
            },
            {
              id: 'gamma',
              symbol: '+ γ·V*(s′) 未来传播项',
              role: 'hyper',
              liveValue: useFuture ? `γ = ${gamma.toFixed(2)} (价值向远方传播)` : '已消融 (γ = 0 · 彻底短视!)',
              roleDesc: '点击消融关闭未来项看看：整座 3D 山峰瞬间塌成死平的荒漠！起点海拔跌到 −0.15，智能体彻底失去走向终点的梯度指引！',
              enabled: useFuture,
              onToggle: () => setUseFuture((v) => !v),
            },
          ]}
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
          <div className="lg:col-span-8 flex flex-col items-center">
            <canvas
              ref={canvasRef}
              onMouseDown={(e) => {
                dragRef.current = { dragging: true, lx: e.clientX, ly: e.clientY };
              }}
              onMouseMove={(e) => {
                if (!dragRef.current.dragging) return;
                const dx = e.clientX - dragRef.current.lx;
                const dy = e.clientY - dragRef.current.ly;
                dragRef.current.lx = e.clientX;
                dragRef.current.ly = e.clientY;
                setYaw((v) => v + dx * 0.01);
                setPitch((v) => Math.max(0.12, Math.min(1.3, v + dy * 0.01)));
              }}
              onMouseUp={() => { dragRef.current.dragging = false; }}
              onMouseLeave={() => { dragRef.current.dragging = false; }}
              className="w-full max-w-[560px] aspect-[560/330] rounded-2xl bg-slate-950 border border-slate-800 cursor-grab active:cursor-grabbing shadow-inner"
            />
            <span className="mt-1.5 text-[11px] text-slate-400 inline-flex items-center gap-1">
              <Rotate3D className="h-3.5 w-3.5" /> 白色折线 = 沿 3D 价值山坡爬向峰顶的最优策略轨迹
            </span>
          </div>

          <div className="lg:col-span-4 space-y-4 text-xs">
            <div className="rounded-xl border border-slate-200 p-4 space-y-3 dark:border-slate-800">
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="font-semibold">折扣因子 γ (远见传播半径)</span>
                  <span className="font-mono font-bold text-emerald-600">{effGamma.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min={0.1}
                  max={0.97}
                  step={0.03}
                  disabled={!useFuture}
                  value={gamma}
                  onChange={(e) => setGamma(parseFloat(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>0.1 (极短视 · 山坡骤降)</span>
                  <span>0.97 (高瞻远瞩 · 平缓爬坡)</span>
                </div>
              </div>
              <p className="leading-relaxed text-slate-600 dark:text-slate-300">
                这是 Bellman 方程最震撼的几何直觉：<strong>γ 越大，终点奖励的“势能山坡”就传播得越远</strong>，绕开三个深蓝/深红陷阱凹坑并平滑抬高起点，让贪婪策略一眼就能顺坡登顶！
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
