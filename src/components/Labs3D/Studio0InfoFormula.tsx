import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Compass, Rotate3D } from 'lucide-react';
import {
  Camera3D,
  projectPoint,
  scientificRamp,
  setupHiDPICanvas,
  Vec3,
} from '../../utils/engine3d';
import { FormulaDrivenBanner } from '../FormulaDrivenBanner';

// 2-simplex vertices in XZ plane (equilateral triangle centered at origin)
const V1 = { x: 0, z: -1.15 };
const V2 = { x: -1.0, z: 0.65 };
const V3 = { x: 1.0, z: 0.65 };

function baryToXZ(p1: number, p2: number, p3: number): { x: number; z: number } {
  return {
    x: p1 * V1.x + p2 * V2.x + p3 * V3.x,
    z: p1 * V1.z + p2 * V2.z + p3 * V3.z,
  };
}

function ent3(p1: number, p2: number, p3: number): number {
  const arr = [p1, p2, p3];
  return -arr.reduce((acc, p) => (p > 1e-6 ? acc + p * Math.log2(p) : acc), 0);
}

export const Studio0InfoFormula: React.FC = () => {
  const [yaw, setYaw] = useState(0.58);
  const [pitch, setPitch] = useState(0.55);
  const [qShift, setQShift] = useState(0.42);
  const [pPeak, setPPeak] = useState(0.68);
  const [showKLHeight, setShowKLHeight] = useState(true);
  const [activeTerm, setActiveTerm] = useState<string | null>('kl');

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dragRef = useRef<{ dragging: boolean; lx: number; ly: number }>({
    dragging: false,
    lx: 0,
    ly: 0,
  });

  // Construct valid P and Q on 3-class simplex
  const P = useMemo(() => {
    const rest = 1 - pPeak;
    return [pPeak, rest * 0.6, rest * 0.4];
  }, [pPeak]);

  const Q = useMemo(() => {
    // Interpolate Q from P toward opposite corner
    const target = [0.08, 0.22, 0.70];
    return P.map((pi, i) => (1 - qShift) * pi + qShift * target[i]);
  }, [P, qShift]);

  const metrics = useMemo(() => {
    const hp = ent3(P[0], P[1], P[2]);
    const kl = P.reduce((a, pi, i) => a + pi * Math.log2(pi / Math.max(1e-6, Q[i])), 0);
    const ce = hp + (showKLHeight ? kl : 0);
    return { hp, kl, ce };
  }, [P, Q, showKLHeight]);

  // Render 3D Entropy Dome + KL Pillar on Probability Simplex
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const W = 540;
    const H = 320;
    const ctx = setupHiDPICanvas(canvas, W, H);
    if (!ctx) return;

    const cam: Camera3D = { yaw, pitch, dist: 4.1, fov: 370 };
    ctx.clearRect(0, 0, W, H);

    // Build triangulated mesh of 3D Entropy Dome over the 2-Simplex
    const steps = 16;
    interface Tri {
      pts: Vec3[];
      depth: number;
      hNorm: number;
    }
    const tris: Tri[] = [];

    const gridPts: (Vec3 | null)[][] = [];
    for (let i = 0; i <= steps; i++) {
      const row: (Vec3 | null)[] = [];
      for (let j = 0; j <= steps - i; j++) {
        const p1 = i / steps;
        const p2 = j / steps;
        const p3 = Math.max(0, 1 - p1 - p2);
        const { x, z } = baryToXZ(p1, p2, p3);
        const hVal = ent3(p1, p2, p3); // max log2(3) ≈ 1.585
        const y = (hVal / 1.585) * 0.95 - 0.35;
        row.push({ x, y, z });
      }
      gridPts.push(row);
    }

    for (let i = 0; i < steps; i++) {
      for (let j = 0; j < steps - i; j++) {
        const a = gridPts[i][j]!;
        const b = gridPts[i + 1][j]!;
        const c = gridPts[i][j + 1]!;
        const centroid = { x: (a.x + b.x + c.x) / 3, y: (a.y + b.y + c.y) / 3, z: (a.z + b.z + c.z) / 3 };
        const pd = projectPoint(centroid, cam, W, H).depth;
        tris.push({ pts: [a, b, c], depth: pd, hNorm: (centroid.y + 0.35) / 0.95 });

        if (j < steps - i - 1) {
          const d = gridPts[i + 1][j + 1]!;
          const c2 = { x: (b.x + d.x + c.x) / 3, y: (b.y + d.y + c.y) / 3, z: (b.z + d.z + c.z) / 3 };
          const pd2 = projectPoint(c2, cam, W, H).depth;
          tris.push({ pts: [b, d, c], depth: pd2, hNorm: (c2.y + 0.35) / 0.95 });
        }
      }
    }

    tris.sort((a, b) => b.depth - a.depth);
    for (const tri of tris) {
      const p2d = tri.pts.map((pt) => projectPoint(pt, cam, W, H));
      ctx.beginPath();
      ctx.moveTo(p2d[0].x, p2d[0].y);
      ctx.lineTo(p2d[1].x, p2d[1].y);
      ctx.lineTo(p2d[2].x, p2d[2].y);
      ctx.closePath();
      ctx.fillStyle = scientificRamp(tri.hNorm * 0.72, 0.58);
      ctx.fill();
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.2)';
      ctx.lineWidth = 0.6;
      ctx.stroke();
    }

    // Simplex Base Triangle Outline
    const baseVerts = [
      { ...V1, label: 'e₁=(1,0,0)' },
      { ...V2, label: 'e₂=(0,1,0)' },
      { ...V3, label: 'e₃=(0,0,1)' },
    ];
    const baseProj = baseVerts.map((v) => projectPoint({ x: v.x, y: -0.35, z: v.z }, cam, W, H));
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.7)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(baseProj[0].x, baseProj[0].y);
    ctx.lineTo(baseProj[1].x, baseProj[1].y);
    ctx.lineTo(baseProj[2].x, baseProj[2].y);
    ctx.closePath();
    ctx.stroke();

    ctx.font = '600 10px "JetBrains Mono", monospace';
    ctx.fillStyle = '#94a3b8';
    baseProj.forEach((bp, idx) => {
      ctx.fillText(baseVerts[idx].label, bp.x - 24, bp.y + 14);
    });

    // Plot True Distribution P and Model Distribution Q + Vertical Entropy & KL Penalty Pillar!
    const xzP = baryToXZ(P[0], P[1], P[2]);
    const xzQ = baryToXZ(Q[0], Q[1], Q[2]);

    const yBase = -0.35;
    const yHP = yBase + (metrics.hp / 1.585) * 0.95;
    const yCE = yBase + Math.min(1.65, (metrics.ce / 1.585) * 0.95);

    const pBase = projectPoint({ x: xzP.x, y: yBase, z: xzP.z }, cam, W, H);
    const pHP = projectPoint({ x: xzP.x, y: yHP, z: xzP.z }, cam, W, H);
    const pCE = projectPoint({ x: xzP.x, y: yCE, z: xzP.z }, cam, W, H);
    const qBase = projectPoint({ x: xzQ.x, y: yBase, z: xzQ.z }, cam, W, H);

    // Line connecting P and Q on the simplex floor
    ctx.strokeStyle = '#fbbf24';
    ctx.setLineDash([4, 3]);
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(pBase.x, pBase.y);
    ctx.lineTo(qBase.x, qBase.y);
    ctx.stroke();
    ctx.setLineDash([]);

    // Vertical pillar: Blue segment = H(P), Rose glowing segment = D_KL(P || Q)
    ctx.lineWidth = 5;
    ctx.strokeStyle = '#3b82f6';
    ctx.beginPath();
    ctx.moveTo(pBase.x, pBase.y);
    ctx.lineTo(pHP.x, pHP.y);
    ctx.stroke();

    if (showKLHeight && metrics.kl > 0.01) {
      ctx.lineWidth = 5;
      ctx.strokeStyle = '#f43f5e';
      ctx.beginPath();
      ctx.moveTo(pHP.x, pHP.y);
      ctx.lineTo(pCE.x, pCE.y);
      ctx.stroke();
    }

    // Glowing Dots
    const drawDot = (pt: { x: number; y: number }, color: string, label: string) => {
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 5.5, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1.8;
      ctx.stroke();
      ctx.fillStyle = '#f8fafc';
      ctx.font = '700 11px "JetBrains Mono", monospace';
      ctx.fillText(label, pt.x + 8, pt.y + 4);
    };

    drawDot(pBase, '#3b82f6', 'P (真实分布)');
    drawDot(qBase, '#10b981', 'Q (模型预测)');
    if (showKLHeight && metrics.kl > 0.02) {
      drawDot(pCE, '#f43f5e', `H(P,Q)=${metrics.ce.toFixed(2)}`);
    } else {
      drawDot(pHP, '#38bdf8', `H(P)=${metrics.hp.toFixed(2)}`);
    }
  }, [yaw, pitch, P, Q, metrics, showKLHeight]);

  return (
    <div className="rounded-2xl border border-slate-200/90 bg-white shadow-md overflow-hidden dark:border-slate-800 dark:bg-slate-900 space-y-0">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 px-5 py-3.5 text-white">
        <div className="flex items-center gap-2">
          <Rotate3D className="h-4 w-4 text-sky-400" />
          <h3 className="text-sm sm:text-base font-bold">
            3D 高维概率单纯形演播室 · 信息熵穹顶与 KL 散度惩罚柱
          </h3>
        </div>
        <span className="text-[11px] text-sky-300 font-mono">
          鼠标拖拽自由旋转 3D 视角
        </span>
      </div>

      <div className="p-5 space-y-4">
        <FormulaDrivenBanner
          latex={String.raw`\htmlClass{formula-token formula-token-loss token-ce}{H(P, Q)} = \htmlClass{formula-token formula-token-data token-hp}{H(P)} + \htmlClass{formula-token formula-token-loss token-kl}{D_{\text{KL}}(P \,\|\, Q)}`}
          activeTermId={activeTerm}
          onSelectTerm={setActiveTerm}
          terms={[
            {
              id: 'ce',
              symbol: 'H(P, Q) 交叉熵总高度',
              role: 'loss',
              liveValue: `${metrics.ce.toFixed(3)} bits`,
              roleDesc: '图中整根立柱的总高度！在分类训练里，优化器拼命压低这根柱子的总高度。',
            },
            {
              id: 'hp',
              symbol: 'H(P) 蓝色熵穹顶',
              role: 'data',
              liveValue: `${metrics.hp.toFixed(3)} bits`,
              roleDesc: '3D 概率单纯形上的凹形穹顶：中心均匀分布 (1/3,1/3,1/3) 熵最高 = 1.585 bits，三个顶点确定性分布熵为 0。它是无法再压低的理论下界！',
            },
            {
              id: 'kl',
              symbol: '+ D_KL(P ‖ Q) 红色惩罚柱',
              role: 'loss',
              liveValue: showKLHeight ? `+${metrics.kl.toFixed(3)} bits` : '已消融 (0)',
              roleDesc: '当你把模型分布 Q 拉离真实分布 P 时，穹顶之上骤然升起的红色高度！训练的本质就是把 Q 推向 P 让这截红柱彻底归零。',
              enabled: showKLHeight,
              onToggle: () => setShowKLHeight((v) => !v),
            },
          ]}
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
          <div className="lg:col-span-7 flex flex-col items-center">
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
                setPitch((v) => Math.max(0.12, Math.min(1.25, v + dy * 0.01)));
              }}
              onMouseUp={() => { dragRef.current.dragging = false; }}
              onMouseLeave={() => { dragRef.current.dragging = false; }}
              className="w-full max-w-[540px] aspect-[540/320] rounded-2xl bg-slate-950 border border-slate-800 cursor-grab active:cursor-grabbing shadow-inner"
            />
          </div>

          <div className="lg:col-span-5 space-y-4 text-xs">
            <div className="rounded-xl border border-slate-200 p-4 space-y-3.5 dark:border-slate-800">
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="font-medium">真实分布 P 的尖锐度 (p₁ 概率)</span>
                  <span className="font-mono font-bold text-blue-600">{(pPeak * 100).toFixed(0)}%</span>
                </div>
                <input type="range" min={0.34} max={0.95} step={0.02} value={pPeak} onChange={(e) => setPPeak(parseFloat(e.target.value))} className="w-full" />
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>34% (居中均匀 · 熵穹顶最高)</span>
                  <span>95% (贴近顶点 · 熵趋近 0)</span>
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="font-medium">预测分布 Q 偏离 P 的距离</span>
                  <span className="font-mono font-bold text-rose-600">{Math.round(qShift * 100)}%</span>
                </div>
                <input type="range" min={0} max={0.96} step={0.02} value={qShift} onChange={(e) => setQShift(parseFloat(e.target.value))} className="w-full" />
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>0% (Q = P · KL 归零)</span>
                  <span>96% (严重误判 · 红色柱冲天)</span>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-2 rounded-xl bg-blue-50/60 border border-blue-200/70 p-3.5 dark:bg-blue-950/25 dark:border-blue-900/50 text-slate-700 dark:text-slate-300 leading-relaxed">
              <Compass className="h-4 w-4 shrink-0 mt-0.5 text-blue-600" />
              <div>
                <strong>高维几何直觉：</strong>三分类概率向量 (p₁, p₂, p₃) 永远落在满足 ∑p_i=1 的二维三角形单纯形上。<strong>蓝色穹顶高度 = 分布固有熵 H(P)</strong>，而当你拖动滑块让绿点 Q 远离蓝点 P，<strong>红色柱子 = KL 散度</strong>会以超线性速度暴涨！
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
