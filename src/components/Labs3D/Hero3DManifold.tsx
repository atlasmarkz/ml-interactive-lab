import React, { useEffect, useRef } from 'react';
import { Camera3D, projectPoint, setupHiDPICanvas, Vec3 } from '../../utils/engine3d';

interface HeroNode {
  pos: Vec3;
  color: string;
  size: number;
  group: number;
}

/**
 * Ambient interactive 3D manifold visualization for the HomePage Hero:
 * renders a gently rotating 3D intertwined neural manifold with attention bridges.
 */
export const Hero3DManifold: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseOffset = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const nodes: HeroNode[] = [];
    const edges: [number, number][] = [];

    // 3D double helix / attention manifold with 72 nodes
    const N = 64;
    for (let i = 0; i < N; i++) {
      const t = (i / N) * Math.PI * 3.4 - Math.PI * 1.7;
      const strand = i % 2;
      const r = 1.05 + 0.22 * Math.sin(t * 2.1);
      const x = r * Math.cos(t + strand * Math.PI);
      const y = (i / N - 0.5) * 2.3;
      const z = r * Math.sin(t + strand * Math.PI);
      const palette = ['#38bdf8', '#818cf8', '#34d399', '#fb7185'];
      nodes.push({
        pos: { x, y, z },
        color: palette[(i + strand * 2) % palette.length],
        size: i % 5 === 0 ? 4.2 : 2.5,
        group: strand,
      });
      if (i >= 2) edges.push([i, i - 2]);
      if (i % 4 === 0 && i + 1 < N) edges.push([i, i + 1]);
    }

    let rafId = 0;
    let angle = 0.4;

    const render = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const W = 340;
      const H = 290;
      const ctx = setupHiDPICanvas(canvas, W, H);
      if (!ctx) return;

      angle += 0.0055;
      const cam: Camera3D = {
        yaw: angle + mouseOffset.current.x * 0.6,
        pitch: 0.28 + mouseOffset.current.y * 0.45,
        dist: 4.5,
        fov: 320,
      };

      ctx.clearRect(0, 0, W, H);

      const proj = nodes.map((n) => ({ ...n, p: projectPoint(n.pos, cam, W, H) }));

      // Draw translucent attention bridges
      ctx.lineWidth = 1.1;
      for (const [a, b] of edges) {
        const pa = proj[a].p;
        const pb = proj[b].p;
        const depthFade = Math.max(0.1, Math.min(0.6, 1.3 - (pa.depth + pb.depth) * 0.12));
        ctx.strokeStyle =
          nodes[a].group === nodes[b].group
            ? `rgba(99, 102, 241, ${depthFade * 0.65})`
            : `rgba(56, 189, 248, ${depthFade * 0.9})`;
        ctx.beginPath();
        ctx.moveTo(pa.x, pa.y);
        ctx.lineTo(pb.x, pb.y);
        ctx.stroke();
      }

      // Depth-sorted glowing particles
      const sorted = [...proj].sort((a, b) => b.p.depth - a.p.depth);
      for (const item of sorted) {
        const radius = item.size * (item.p.scale / 72);
        const alpha = Math.max(0.25, Math.min(1, 1.65 - item.p.depth * 0.22));
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.arc(item.p.x, item.p.y, radius * 2.1, 0, Math.PI * 2);
        ctx.fillStyle = item.color;
        ctx.globalAlpha = alpha * 0.2;
        ctx.fill();

        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.arc(item.p.x, item.p.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = item.color;
        ctx.fill();
        ctx.restore();
      }

      rafId = requestAnimationFrame(render);
    };

    rafId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(rafId);
  }, []);

  return (
    <div
      onMouseMove={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        mouseOffset.current = {
          x: ((e.clientX - rect.left) / rect.width - 0.5) * 2,
          y: ((e.clientY - rect.top) / rect.height - 0.5) * 2,
        };
      }}
      className="relative flex flex-col items-center justify-center rounded-2xl border border-slate-200/80 bg-slate-950 p-3 shadow-xl dark:border-slate-700/80 overflow-hidden"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(59,130,246,0.18),transparent_65%)]" />
      <canvas ref={canvasRef} className="w-[340px] max-w-full h-[290px] relative z-10" />
      <div className="relative z-10 flex items-center justify-between w-full px-2 pt-1 text-[10px] font-mono text-slate-400">
        <span>3D Latent & Attention Manifold</span>
        <span className="text-emerald-400">● Live 60fps Engine</span>
      </div>
    </div>
  );
};
