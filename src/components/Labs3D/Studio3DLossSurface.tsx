import React, { useEffect, useRef, useState } from 'react';
import { Pause, Play, Rotate3D, RotateCcw } from 'lucide-react';
import {
  Camera3D,
  draw3DAxes,
  projectPoint,
  scientificRamp,
  setupHiDPICanvas,
  Vec3,
} from '../../utils/engine3d';
import { FormulaDrivenBanner, LiveFormulaTerm } from '../FormulaDrivenBanner';

interface Studio3DLossSurfaceProps {
  mode: 'regularization' | 'optimization';
}

interface Ball3D {
  name: string;
  color: string;
  x: number;
  z: number;
  vx: number;
  vz: number;
  sx: number;
  sz: number;
  t: number;
  trail: [number, number][];
}

function initBalls(startX: number, startZ: number): Ball3D[] {
  const mk = (name: string, color: string): Ball3D => ({
    name,
    color,
    x: startX,
    z: startZ,
    vx: 0,
    vz: 0,
    sx: 0,
    sz: 0,
    t: 0,
    trail: [[startX, startZ]],
  });
  return [
    mk('SGD', '#f43f5e'),
    mk('Momentum', '#f59e0b'),
    mk('Adam', '#10b981'),
  ];
}

export const Studio3DLossSurface: React.FC<Studio3DLossSurfaceProps> = ({ mode }) => {
  const [yaw, setYaw] = useState(mode === 'regularization' ? 0.65 : 0.78);
  const [pitch, setPitch] = useState(0.52);
  const [activeTerm, setActiveTerm] = useState<string | null>(
    mode === 'regularization' ? 'reg' : 'mom'
  );

  // Part 1 Regularization controls
  const [regEnabled, setRegEnabled] = useState(true);
  const [lambda, setLambda] = useState(0.55);

  // Part 2 Optimization controls
  const [surfaceKind, setSurfaceKind] = useState<'saddle' | 'ravine'>('saddle');
  const [useMomentum, setUseMomentum] = useState(true);
  const [useAdaptive, setUseAdaptive] = useState(true);
  const [lr, setLr] = useState(0.14);
  const [running, setRunning] = useState(true);
  const [balls, setBalls] = useState<Ball3D[]>(() => initBalls(-0.18, 0.28));

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dragRef = useRef({ dragging: false, lx: 0, ly: 0 });

  const effLambda = mode === 'regularization' && regEnabled ? lambda : 0;

  // Height function L(w1, w2)
  const evalHeight = (w1: number, w2: number): number => {
    if (mode === 'regularization') {
      // Collinear MSE trough along w1 + w2 = 0.8 (flat bottom, infinite solutions without L2!)
      const mse = 0.72 * Math.pow(w1 + w2 - 0.75, 2);
      const l2 = 0.5 * effLambda * (w1 * w1 + w2 * w2);
      return mse + l2;
    }
    if (surfaceKind === 'saddle') {
      // Classic non-convex saddle + double wells
      return 0.48 * (w1 * w1 - w2 * w2) + 0.14 * (w1 ** 4 + w2 ** 4) + 0.16 * w1 + 0.72;
    }
    // Ill-conditioned ravine bowl
    return 0.12 * w1 * w1 + 1.35 * w2 * w2;
  };

  const evalGrad = (w1: number, w2: number): [number, number] => {
    const h = 1e-4;
    const gx = (evalHeight(w1 + h, w2) - evalHeight(w1 - h, w2)) / (2 * h);
    const gz = (evalHeight(w1, w2 + h) - evalHeight(w1, w2 - h)) / (2 * h);
    return [gx, gz];
  };

  // Closed-form optimal w* for regularization mode:
  // min 0.72*(w1+w2-0.75)^2 + 0.5*lam*(w1^2+w2^2) => by symmetry w1*=w2*= 1.08 / (2.88 + lam)
  const regOptW = effLambda > 0.001 ? 1.08 / (2.88 + effLambda) : 0.375;

  // Step 3D optimization balls
  useEffect(() => {
    if (mode !== 'optimization' || !running) return;
    const timer = window.setInterval(() => {
      setBalls((prev) =>
        prev.map((b) => {
          if (b.trail.length > 110) return b;
          const [gx, gz] = evalGrad(b.x, b.z);
          const clamp = (v: number) => Math.max(-1.65, Math.min(1.65, v));
          let nx = b.x;
          let nz = b.z;
          let vx = b.vx;
          let vz = b.vz;
          let sx = b.sx;
          let sz = b.sz;
          const t = b.t + 1;

          if (b.name === 'SGD') {
            nx = b.x - lr * 0.45 * gx;
            nz = b.z - lr * 0.45 * gz;
          } else if (b.name === 'Momentum') {
            const beta = useMomentum ? 0.84 : 0.0;
            vx = beta * b.vx + gx;
            vz = beta * b.vz + gz;
            nx = b.x - lr * 0.32 * vx;
            nz = b.z - lr * 0.32 * vz;
          } else {
            // Adam with live ablation switches for Momentum (beta1) & Adaptive scale (beta2)
            const b1 = useMomentum ? 0.85 : 0.0;
            const b2 = useAdaptive ? 0.95 : 0.0;
            vx = b1 * b.vx + (1 - b1) * gx;
            vz = b1 * b.vz + (1 - b1) * gz;
            sx = b2 * b.sx + (1 - b2) * gx * gx;
            sz = b2 * b.sz + (1 - b2) * gz * gz;
            const mx = b1 > 0 ? vx / (1 - Math.pow(b1, t)) : gx;
            const mz = b1 > 0 ? vz / (1 - Math.pow(b1, t)) : gz;
            const denomX = useAdaptive ? Math.sqrt(sx / (1 - Math.pow(b2, t))) + 1e-4 : 1.0;
            const denomZ = useAdaptive ? Math.sqrt(sz / (1 - Math.pow(b2, t))) + 1e-4 : 1.0;
            nx = b.x - (lr * 0.55 * mx) / denomX;
            nz = b.z - (lr * 0.55 * mz) / denomZ;
          }

          nx = clamp(nx);
          nz = clamp(nz);
          return { ...b, x: nx, z: nz, vx, vz, sx, sz, t, trail: [...b.trail, [nx, nz]] };
        })
      );
    }, 50);
    return () => window.clearInterval(timer);
  }, [mode, running, surfaceKind, lr, useMomentum, useAdaptive]);

  // Draw 3D Loss Surface Mesh
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const W = 560;
    const H = 330;
    const ctx = setupHiDPICanvas(canvas, W, H);
    if (!ctx) return;

    const cam: Camera3D = { yaw, pitch, dist: 4.9, fov: 390 };
    ctx.clearRect(0, 0, W, H);

    const N = 22;
    const minCoord = -1.6;
    const maxCoord = 1.6;
    const maxH = mode === 'regularization' ? 2.6 : 2.3;

    const to3D = (w1: number, w2: number): Vec3 => {
      const h = Math.min(maxH, evalHeight(w1, w2));
      return { x: w1, y: (h / maxH) * 1.45 - 0.65, z: w2 };
    };

    const grid: Vec3[][] = [];
    for (let i = 0; i <= N; i++) {
      const row: Vec3[] = [];
      const w1 = minCoord + ((maxCoord - minCoord) * i) / N;
      for (let j = 0; j <= N; j++) {
        const w2 = minCoord + ((maxCoord - minCoord) * j) / N;
        row.push(to3D(w1, w2));
      }
      grid.push(row);
    }

    interface Quad {
      pts: Vec3[];
      depth: number;
      normH: number;
    }
    const quads: Quad[] = [];
    for (let i = 0; i < N; i++) {
      for (let j = 0; j < N; j++) {
        const p00 = grid[i][j];
        const p10 = grid[i + 1][j];
        const p11 = grid[i + 1][j + 1];
        const p01 = grid[i][j + 1];
        const mid: Vec3 = {
          x: (p00.x + p10.x + p11.x + p01.x) / 4,
          y: (p00.y + p10.y + p11.y + p01.y) / 4,
          z: (p00.z + p10.z + p11.z + p01.z) / 4,
        };
        const depth = projectPoint(mid, cam, W, H).depth;
        quads.push({ pts: [p00, p10, p11, p01], depth, normH: (mid.y + 0.65) / 1.45 });
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
      ctx.fillStyle = scientificRamp(q.normH, 0.78);
      ctx.fill();
      ctx.strokeStyle = 'rgba(15, 23, 42, 0.25)';
      ctx.lineWidth = 0.6;
      ctx.stroke();
    }

    draw3DAxes(ctx, cam, W, H, 1.75, ['w₁', 'Loss L(w)', 'w₂']);

    if (mode === 'regularization') {
      if (!regEnabled) {
        // Highlight degenerate flat valley line w1 + w2 = 0.75 (infinite solutions!)
        const pA = projectPoint(to3D(-0.7, 1.45), cam, W, H);
        const pB = projectPoint(to3D(1.45, -0.7), cam, W, H);
        ctx.strokeStyle = '#fb7185';
        ctx.lineWidth = 3.5;
        ctx.setLineDash([6, 4]);
        ctx.beginPath();
        ctx.moveTo(pA.x, pA.y);
        ctx.lineTo(pB.x, pB.y);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = '#fda4af';
        ctx.font = '700 11px "JetBrains Mono", monospace';
        ctx.fillText('无穷多最优解平谷 (XᵀX 不可逆!)', pA.x - 10, pA.y - 8);
      } else {
        const opt = projectPoint(to3D(regOptW, regOptW), cam, W, H);
        ctx.beginPath();
        ctx.arc(opt.x, opt.y, 7, 0, Math.PI * 2);
        ctx.fillStyle = '#10b981';
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2.2;
        ctx.stroke();
        ctx.fillStyle = '#a7f3d0';
        ctx.font = '700 11px "JetBrains Mono", monospace';
        ctx.fillText(`唯一最优碗底 w*=(${regOptW.toFixed(2)}, ${regOptW.toFixed(2)})`, opt.x + 10, opt.y - 6);
      }
    } else {
      // Draw 3D glowing optimizer trajectories on top of surface
      for (const b of balls) {
        ctx.beginPath();
        b.trail.forEach(([bx, bz], idx) => {
          const p3 = to3D(bx, bz);
          const p2 = projectPoint({ x: p3.x, y: p3.y + 0.04, z: p3.z }, cam, W, H);
          if (idx === 0) ctx.moveTo(p2.x, p2.y);
          else ctx.lineTo(p2.x, p2.y);
        });
        ctx.strokeStyle = b.color;
        ctx.lineWidth = 2.6;
        ctx.stroke();

        const last = b.trail[b.trail.length - 1];
        const p3 = to3D(last[0], last[1]);
        const p2 = projectPoint({ x: p3.x, y: p3.y + 0.06, z: p3.z }, cam, W, H);
        ctx.beginPath();
        ctx.arc(p2.x, p2.y, 6, 0, Math.PI * 2);
        ctx.fillStyle = b.color;
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    }
  }, [yaw, pitch, mode, effLambda, regEnabled, regOptW, surfaceKind, balls]);

  const formulaLatex =
    mode === 'regularization'
      ? String.raw`\htmlClass{formula-token formula-token-loss token-tot}{L(\mathbf{w})} = \htmlClass{formula-token formula-token-data token-mse}{\frac{1}{N}\|\mathbf{X}\mathbf{w}-\mathbf{y}\|_2^2} + \htmlClass{formula-token formula-token-hyper token-reg}{\frac{\lambda}{2}\|\mathbf{w}\|_2^2}`
      : String.raw`\htmlClass{formula-token formula-token-param token-th}{\theta_t} = \theta_{t-1} - \htmlClass{formula-token formula-token-hyper token-lr}{\eta}\frac{\htmlClass{formula-token formula-token-output token-mom}{\hat{m}_t}}{\htmlClass{formula-token formula-token-loss token-adap}{\sqrt{\hat{v}_t}+\epsilon}}`;

  const terms: LiveFormulaTerm[] =
    mode === 'regularization'
      ? [
          {
            id: 'mse',
            symbol: '数据拟合项 MSE',
            role: 'data',
            liveValue: '共线特征 → 狭长平底山谷',
            roleDesc: '当特征高度共线时，MSE 在三维空间形成一条底部全平的 U 形槽，XᵀX 奇异不可逆，存在无穷多个权重极大、剧烈过拟合的解。',
          },
          {
            id: 'reg',
            symbol: '+ (λ/2)‖w‖₂² 正则碗',
            role: 'hyper',
            liveValue: regEnabled ? `λ = ${lambda.toFixed(2)} (严格凸碗)` : '已消融 (λ = 0)',
            roleDesc: '点击 ON/OFF 切换消融！加上一个开口向上的三维抛物面碗后，平底山谷瞬间两端翘起，立刻弯曲成唯一全局最优碗底 w*，且大幅压小权重范数！',
            enabled: regEnabled,
            onToggle: () => setRegEnabled((v) => !v),
          },
          {
            id: 'tot',
            symbol: '最优解范数 ‖w*‖₂',
            role: 'loss',
            liveValue: regEnabled ? `${(Math.SQRT2 * regOptW).toFixed(3)}` : '无界 / 病态',
            roleDesc: '增大 λ 会把最优解 w* 沿 3D 碗壁持续拉向原点 (0,0)，以可控偏差换取极低方差。',
          },
        ]
      : [
          {
            id: 'mom',
            symbol: 'm̂_t 一阶动量 (β₁)',
            role: 'output',
            liveValue: useMomentum ? 'β₁ = 0.85 (惯性冲过鞍点)' : '已消融 (β₁ = 0)',
            roleDesc: '关闭 β₁ 看看！失去历史动量惯性后，优化球在平缓鞍点与峡谷壁之间停滞或剧烈之字震荡。',
            enabled: useMomentum,
            onToggle: () => {
              setUseMomentum((v) => !v);
              setBalls(initBalls(surfaceKind === 'saddle' ? -0.18 : -1.45, surfaceKind === 'saddle' ? 0.28 : 1.05));
            },
          },
          {
            id: 'adap',
            symbol: '÷ √v̂_t 自适应曲率 (β₂)',
            role: 'loss',
            liveValue: useAdaptive ? 'β₂ = 0.95 (自动平衡陡缓轴)' : '已消融 (无曲率缩放)',
            roleDesc: '把每个方向的梯度除以它历史幅值的均方根：陡峭崖壁自动刹车，平坦方向自动加速！',
            enabled: useAdaptive,
            onToggle: () => {
              setUseAdaptive((v) => !v);
              setBalls(initBalls(surfaceKind === 'saddle' ? -0.18 : -1.45, surfaceKind === 'saddle' ? 0.28 : 1.05));
            },
          },
          {
            id: 'lr',
            symbol: '学习率 η',
            role: 'hyper',
            liveValue: `η = ${lr.toFixed(2)}`,
            roleDesc: '控制三维曲面上的步进尺度；过大将在峡谷两侧飞出，过小则龟速爬行。',
          },
          {
            id: 'th',
            symbol: '3D 实时 Loss',
            role: 'param',
            liveValue: `Adam: ${evalHeight(balls[2].x, balls[2].z).toFixed(2)} vs SGD: ${evalHeight(balls[0].x, balls[0].z).toFixed(2)}`,
            roleDesc: '拖动 3D 损失曲面旋转视角，直观观察三种优化球如何在高低起伏的 3D 山谷中分道扬镳。',
          },
        ];

  return (
    <div className="rounded-2xl border border-slate-200/90 bg-white shadow-md overflow-hidden dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-gradient-to-r from-slate-900 via-violet-950 to-slate-900 px-5 py-3.5 text-white">
        <div className="flex items-center gap-2">
          <Rotate3D className="h-4 w-4 text-violet-400" />
          <h3 className="text-sm sm:text-base font-bold">
            {mode === 'regularization'
              ? '3D 高维损失曲面演播室 · 消融 L2 正则项看“平谷变凸碗”'
              : '3D 非凸优化地形演播室 · 消融 Adam 动量/自适应项对比 3D 轨迹'}
          </h3>
        </div>
        <span className="text-[11px] text-violet-300 font-mono">拖拽画面旋转 3D 损失山谷</span>
      </div>

      <div className="p-5 space-y-4">
        <FormulaDrivenBanner
          latex={formulaLatex}
          terms={terms}
          activeTermId={activeTerm}
          onSelectTerm={setActiveTerm}
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
          </div>

          <div className="lg:col-span-4 space-y-4 text-xs">
            {mode === 'regularization' ? (
              <div className="rounded-xl border border-slate-200 p-4 space-y-3 dark:border-slate-800">
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="font-semibold">L2 正则强度 λ</span>
                    <span className="font-mono font-bold text-amber-600">{effLambda.toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min={0.05}
                    max={2.0}
                    step={0.05}
                    disabled={!regEnabled}
                    value={lambda}
                    onChange={(e) => setLambda(parseFloat(e.target.value))}
                    className="w-full"
                  />
                </div>
                <p className="leading-relaxed text-slate-600 dark:text-slate-300">
                  试着点击上方公式条里 <strong>+ (λ/2)‖w‖₂²</strong> 旁的 <strong>ON / 已消融</strong> 开关：关闭时整个曲面立刻塌成一条红色平底峡谷（病态不可逆）；打开并增大 λ，曲面瞬间卷曲成陡峭凸碗！
                </p>
              </div>
            ) : (
              <div className="rounded-xl border border-slate-200 p-4 space-y-3.5 dark:border-slate-800">
                <div className="flex gap-1.5">
                  <button
                    onClick={() => {
                      setSurfaceKind('saddle');
                      setBalls(initBalls(-0.18, 0.28));
                      setRunning(true);
                    }}
                    className={`flex-1 rounded-lg border py-1.5 font-semibold cursor-pointer ${
                      surfaceKind === 'saddle'
                        ? 'border-violet-600 bg-violet-50 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300'
                        : 'border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    3D 鞍点双谷
                  </button>
                  <button
                    onClick={() => {
                      setSurfaceKind('ravine');
                      setBalls(initBalls(-1.45, 1.05));
                      setRunning(true);
                    }}
                    className={`flex-1 rounded-lg border py-1.5 font-semibold cursor-pointer ${
                      surfaceKind === 'ravine'
                        ? 'border-violet-600 bg-violet-50 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300'
                        : 'border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    3D 狭长病态峡谷
                  </button>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span>学习率 η</span>
                    <span className="font-mono font-bold text-blue-600">{lr.toFixed(2)}</span>
                  </div>
                  <input type="range" min={0.04} max={0.32} step={0.02} value={lr} onChange={(e) => setLr(parseFloat(e.target.value))} className="w-full" />
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setRunning((r) => !r)}
                    className="flex-1 inline-flex items-center justify-center gap-1 rounded-lg bg-violet-600 py-1.5 font-semibold text-white hover:bg-violet-500 cursor-pointer"
                  >
                    {running ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                    {running ? '暂停' : '运行'}
                  </button>
                  <button
                    onClick={() => {
                      setBalls(initBalls(surfaceKind === 'saddle' ? -0.18 : -1.45, surfaceKind === 'saddle' ? 0.28 : 1.05));
                      setRunning(true);
                    }}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 cursor-pointer"
                  >
                    <RotateCcw className="h-3.5 w-3.5" /> 重放
                  </button>
                </div>

                <div className="flex flex-wrap gap-2 text-[11px] font-semibold">
                  <span className="text-rose-500">● SGD</span>
                  <span className="text-amber-500">● Momentum</span>
                  <span className="text-emerald-500">● Adam</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
