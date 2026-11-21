import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Globe, Rotate3D, Sparkles } from 'lucide-react';
import {
  Camera3D,
  draw3DArrow,
  draw3DAxes,
  projectPoint,
  setupHiDPICanvas,
  Vec3,
} from '../../utils/engine3d';
import { FormulaDrivenBanner, LiveFormulaTerm } from '../FormulaDrivenBanner';

interface Token3D {
  word: string;
  pos: Vec3;
  color: string;
  cluster: 'poly' | 'nature' | 'finance';
}

const STATIC_TOKENS: Token3D[] = [
  { word: 'bank (多义词)', pos: { x: 0.0, y: 0.05, z: 0.0 }, color: '#f59e0b', cluster: 'poly' },
  { word: 'river', pos: { x: -1.1, y: 0.65, z: 0.55 }, color: '#38bdf8', cluster: 'nature' },
  { word: 'water', pos: { x: -0.95, y: 0.25, z: 0.95 }, color: '#38bdf8', cluster: 'nature' },
  { word: 'boat', pos: { x: -1.15, y: -0.25, z: 0.35 }, color: '#38bdf8', cluster: 'nature' },
  { word: 'loan', pos: { x: 1.05, y: 0.55, z: -0.55 }, color: '#34d399', cluster: 'finance' },
  { word: 'money', pos: { x: 0.95, y: -0.2, z: -0.85 }, color: '#34d399', cluster: 'finance' },
];

const CLIP_CONCEPTS = [
  { name: '🐕 Dog', color: '#38bdf8', target: { x: 0.82, y: 0.45, z: 0.35 }, initImg: { x: -0.55, y: 0.72, z: -0.42 }, initTxt: { x: 0.25, y: -0.85, z: 0.46 } },
  { name: '🏔️ Peak', color: '#34d399', target: { x: -0.78, y: 0.52, z: 0.34 }, initImg: { x: 0.68, y: -0.35, z: 0.64 }, initTxt: { x: -0.35, y: 0.88, z: -0.32 } },
  { name: '🚀 Rocket', color: '#a78bfa', target: { x: 0.12, y: -0.82, z: 0.56 }, initImg: { x: -0.82, y: -0.25, z: -0.51 }, initTxt: { x: 0.72, y: 0.65, z: -0.24 } },
  { name: '☕ Latte', color: '#fb7185', target: { x: -0.15, y: 0.18, z: -0.97 }, initImg: { x: 0.32, y: 0.42, z: 0.85 }, initTxt: { x: -0.68, y: -0.68, z: -0.27 } },
];

function normalize3(v: Vec3): Vec3 {
  const len = Math.hypot(v.x, v.y, v.z) || 1;
  return { x: v.x / len, y: v.y / len, z: v.z / len };
}

export const Studio3DTransformerCLIP: React.FC = () => {
  const [view, setView] = useState<'attn3d' | 'clip3d'>('attn3d');
  const [yaw, setYaw] = useState(0.55);
  const [pitch, setPitch] = useState(0.32);
  const [activeTerm, setActiveTerm] = useState<string | null>('attn');

  // --- Mode A: 3D Token Contextualization ---
  const [contextMode, setContextMode] = useState<'river' | 'finance'>('river');
  const [useScale, setUseScale] = useState(true);
  const [useResidual, setUseResidual] = useState(true);
  const [layerAlpha, setLayerAlpha] = useState(0.85); // 0 = static input, 1 = contextualized

  // --- Mode B: 3D CLIP Unit Hypersphere ---
  const [alignProgress, setAlignProgress] = useState(0.75);
  const [useL2Norm, setUseL2Norm] = useState(true);
  const [tau, setTau] = useState(0.12);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dragRef = useRef({ dragging: false, lx: 0, ly: 0 });

  // Compute attention weights from "bank" (idx 0) to all tokens
  const bankAttn = useMemo(() => {
    // Context-dependent logits
    const rawLogits =
      contextMode === 'river'
        ? [0.6, 2.8, 2.3, 1.8, -0.4, -0.6]
        : [0.6, -0.5, -0.6, -0.4, 2.9, 2.5];
    // Turning off /sqrt(dk) amplifies logits by 3x causing near-one-hot collapse
    const amp = useScale ? 1.0 : 3.2;
    const scaled = rawLogits.map((v) => v * amp);
    const m = Math.max(...scaled);
    const exps = scaled.map((v) => Math.exp(v - m));
    const s = exps.reduce((a, b) => a + b, 0);
    const weights = exps.map((e) => e / s);

    // Weighted Value aggregation
    const agg: Vec3 = { x: 0, y: 0, z: 0 };
    STATIC_TOKENS.forEach((tk, i) => {
      agg.x += weights[i] * tk.pos.x;
      agg.y += weights[i] * tk.pos.y;
      agg.z += weights[i] * tk.pos.z;
    });

    // Residual blend: z = (useResidual ? 0.35 * x_bank : 0) + agg
    const base = STATIC_TOKENS[0].pos;
    const targetPos: Vec3 = useResidual
      ? { x: base.x * 0.25 + agg.x * 0.85, y: base.y * 0.25 + agg.y * 0.85, z: base.z * 0.25 + agg.z * 0.85 }
      : agg;
    const currPos: Vec3 = {
      x: base.x + layerAlpha * (targetPos.x - base.x),
      y: base.y + layerAlpha * (targetPos.y - base.y),
      z: base.z + layerAlpha * (targetPos.z - base.z),
    };
    const maxW = Math.max(...weights);
    return { weights, currPos, maxW };
  }, [contextMode, useScale, useResidual, layerAlpha]);

  // Compute CLIP 3D vectors & average aligned cosine similarity
  const clipState = useMemo(() => {
    const items = CLIP_CONCEPTS.map((c, idx) => {
      const lerp = (a: Vec3, b: Vec3, t: number): Vec3 => ({
        x: a.x + t * (b.x - a.x),
        y: a.y + t * (b.y - a.y),
        z: a.z + t * (b.z - a.z),
      });
      const rawI = lerp(c.initImg, c.target, alignProgress);
      const rawT = lerp(c.initTxt, c.target, alignProgress);
      // If L2 norm disabled, radii vary arbitrarily (1.45x vs 0.65x) distorting dot products!
      const img = useL2Norm
        ? normalize3(rawI)
        : { x: rawI.x * (0.7 + idx * 0.28), y: rawI.y * (0.7 + idx * 0.28), z: rawI.z * (0.7 + idx * 0.28) };
      const txt = useL2Norm
        ? normalize3(rawT)
        : { x: rawT.x * (1.3 - idx * 0.2), y: rawT.y * (1.3 - idx * 0.2), z: rawT.z * (1.3 - idx * 0.2) };
      const cos = img.x * txt.x + img.y * txt.y + img.z * txt.z;
      return { ...c, img, txt, cos };
    });
    const avgCos = items.reduce((a, b) => a + b.cos, 0) / items.length;
    return { items, avgCos };
  }, [alignProgress, useL2Norm]);

  // Render 3D Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const W = 560;
    const H = 330;
    const ctx = setupHiDPICanvas(canvas, W, H);
    if (!ctx) return;

    const cam: Camera3D = { yaw, pitch, dist: 4.1, fov: 360 };
    ctx.clearRect(0, 0, W, H);

    if (view === 'attn3d') {
      draw3DAxes(ctx, cam, W, H, 1.45, ['语义维 1', '语义维 2', '语义维 3']);

      const originProj = projectPoint(STATIC_TOKENS[0].pos, cam, W, H);
      const bankCurrProj = projectPoint(bankAttn.currPos, cam, W, H);

      // Draw glowing 3D Attention Beams from "bank" to every context token
      STATIC_TOKENS.forEach((tk, idx) => {
        if (idx === 0) return;
        const w = bankAttn.weights[idx];
        const p2 = projectPoint(tk.pos, cam, W, H);
        ctx.save();
        ctx.strokeStyle =
          tk.cluster === 'nature'
            ? `rgba(56, 189, 248, ${0.08 + w * 0.9})`
            : `rgba(52, 211, 153, ${0.08 + w * 0.9})`;
        ctx.lineWidth = 0.8 + w * 5.5;
        ctx.beginPath();
        ctx.moveTo(bankCurrProj.x, bankCurrProj.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
        ctx.restore();
      });

      // Draw movement vector of "bank" from static embedding -> contextualized embedding
      draw3DArrow(ctx, originProj, bankCurrProj, '#f59e0b', 2.8, 8);

      // Depth-sorted Token Nodes
      const drawList = STATIC_TOKENS.map((tk, idx) => ({
        word: idx === 0 ? 'bank (原始静态)' : tk.word,
        pos: tk.pos,
        color: idx === 0 ? 'rgba(245,158,11,0.45)' : tk.color,
        r: idx === 0 ? 5 : 6.5,
        weight: bankAttn.weights[idx],
      }));
      drawList.push({
        word: `bank (上下文新向量 z)`,
        pos: bankAttn.currPos,
        color: '#f59e0b',
        r: 8.5,
        weight: 1,
      });

      const projected = drawList.map((d) => ({ ...d, p: projectPoint(d.pos, cam, W, H) }));
      projected.sort((a, b) => b.p.depth - a.p.depth);

      for (const item of projected) {
        ctx.beginPath();
        ctx.arc(item.p.x, item.p.y, item.r * 1.9, 0, Math.PI * 2);
        ctx.fillStyle = item.color;
        ctx.globalAlpha = 0.18;
        ctx.fill();
        ctx.globalAlpha = 1;

        ctx.beginPath();
        ctx.arc(item.p.x, item.p.y, item.r, 0, Math.PI * 2);
        ctx.fillStyle = item.color;
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.8;
        ctx.stroke();

        ctx.fillStyle = '#f8fafc';
        ctx.font = '600 11px "JetBrains Mono", monospace';
        const suffix = item.word.startsWith('bank') ? '' : ` (${(item.weight * 100).toFixed(0)}%)`;
        ctx.fillText(item.word + suffix, item.p.x + 10, item.p.y + 4);
      }
    } else {
      // --- CLIP 3D Unit Hypersphere S^2 ---
      // Draw translucent latitude & longitude rings
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.16)';
      ctx.lineWidth = 1;
      for (const lat of [-0.6, 0, 0.6]) {
        const r = Math.cos(lat);
        const y = Math.sin(lat);
        ctx.beginPath();
        for (let s = 0; s <= 48; s++) {
          const a = (s / 48) * Math.PI * 2;
          const p = projectPoint({ x: r * Math.cos(a), y, z: r * Math.sin(a) }, cam, W, H);
          if (s === 0) ctx.moveTo(p.x, p.y);
          else ctx.lineTo(p.x, p.y);
        }
        ctx.stroke();
      }
      for (let lonIdx = 0; lonIdx < 4; lonIdx++) {
        const lon = (lonIdx * Math.PI) / 4;
        ctx.beginPath();
        for (let s = 0; s <= 48; s++) {
          const a = (s / 48) * Math.PI * 2;
          const p = projectPoint(
            { x: Math.cos(a) * Math.cos(lon), y: Math.sin(a), z: Math.cos(a) * Math.sin(lon) },
            cam,
            W,
            H
          );
          if (s === 0) ctx.moveTo(p.x, p.y);
          else ctx.lineTo(p.x, p.y);
        }
        ctx.stroke();
      }

      const origin = projectPoint({ x: 0, y: 0, z: 0 }, cam, W, H);

      // Draw Image & Text vectors + pair attraction arcs
      for (const it of clipState.items) {
        const pImg = projectPoint(it.img, cam, W, H);
        const pTxt = projectPoint(it.txt, cam, W, H);

        // Dashed geodesic tether between matched image & text
        ctx.save();
        ctx.strokeStyle = it.color;
        ctx.globalAlpha = 0.55;
        ctx.setLineDash([4, 3]);
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(pImg.x, pImg.y);
        ctx.lineTo(pTxt.x, pTxt.y);
        ctx.stroke();
        ctx.restore();

        // Arrows from origin
        draw3DArrow(ctx, origin, pImg, it.color, 2.2, 6);
        draw3DArrow(ctx, origin, pTxt, it.color, 1.5, 5);

        // Image = Square badge, Text = Circle badge
        ctx.fillStyle = it.color;
        ctx.fillRect(pImg.x - 5, pImg.y - 5, 10, 10);
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(pImg.x - 5, pImg.y - 5, 10, 10);

        ctx.beginPath();
        ctx.arc(pTxt.x, pTxt.y, 5.5, 0, Math.PI * 2);
        ctx.fillStyle = '#0f172a';
        ctx.fill();
        ctx.strokeStyle = it.color;
        ctx.lineWidth = 2.4;
        ctx.stroke();

        ctx.fillStyle = '#f8fafc';
        ctx.font = '600 10px "JetBrains Mono", monospace';
        ctx.fillText(`Img ${it.name}`, pImg.x + 8, pImg.y - 4);
        ctx.fillText(`Txt ${it.name}`, pTxt.x + 8, pTxt.y + 10);
      }
    }
  }, [view, yaw, pitch, bankAttn, clipState]);

  const formulaLatex =
    view === 'attn3d'
      ? String.raw`\htmlClass{formula-token formula-token-output token-z}{\mathbf{z}_i} = \htmlClass{formula-token formula-token-data token-res}{\mathbf{x}_i} + \sum_j \text{softmax}\!\left(\frac{\htmlClass{formula-token formula-token-output token-attn}{\mathbf{q}_i\mathbf{k}_j^\top}}{\htmlClass{formula-token formula-token-hyper token-scale}{\sqrt{d_k}}}\right)\mathbf{v}_j`
      : String.raw`\htmlClass{formula-token formula-token-output token-sim}{S_{ij}} = \frac{\htmlClass{formula-token formula-token-data token-norm}{\hat{\mathbf{I}}_i \cdot \hat{\mathbf{T}}_j}}{\htmlClass{formula-token formula-token-hyper token-tau}{\tau}}, \qquad \hat{\mathbf{u}} = \frac{\mathbf{u}}{\|\mathbf{u}\|_2}`;

  const terms: LiveFormulaTerm[] =
    view === 'attn3d'
      ? [
          {
            id: 'attn',
            symbol: 'q_i · k_j 注意力光束',
            role: 'output',
            liveValue: contextMode === 'river' ? '指向 river/water 簇' : '指向 loan/money 簇',
            roleDesc: 'Self-Attention 沿着高维光束把上下文语义搬运过来，让同一个多义词 "bank" 在不同句子里飞向截然不同的 3D 语义区域！',
          },
          {
            id: 'scale',
            symbol: '÷ √d_k 缩放稳定项',
            role: 'hyper',
            liveValue: useScale ? `ON · 最大权重 ${(bankAttn.maxW * 100).toFixed(0)}%` : `已消融 · 塌缩 ${(bankAttn.maxW * 100).toFixed(0)}%`,
            roleDesc: '点击消融关闭 ÷√d_k：Softmax 瞬间把注意力死锁到单一最亮词上，丢失多词融合信息并造成梯度消失！',
            enabled: useScale,
            onToggle: () => setUseScale((v) => !v),
          },
          {
            id: 'res',
            symbol: '+ x_i 残差锚点',
            role: 'data',
            liveValue: useResidual ? 'ON (保留原词身份)' : '已消融 (完全被邻居覆盖)',
            roleDesc: '关闭残差项后，Token 自身身份信息会被加权平均彻底冲刷掉；残差连接保证词向量是在原位置上做“增量上下文修正”！',
            enabled: useResidual,
            onToggle: () => setUseResidual((v) => !v),
          },
          {
            id: 'z',
            symbol: '上下文新向量 z_i',
            role: 'output',
            liveValue: `(${bankAttn.currPos.x.toFixed(2)}, ${bankAttn.currPos.y.toFixed(2)}, ${bankAttn.currPos.z.toFixed(2)})`,
            roleDesc: '3D 空间中的橙色箭头终点：即经过这一层 Transformer 之后的动态语境表征。',
          },
        ]
      : [
          {
            id: 'norm',
            symbol: 'L2 单位球面归一化',
            role: 'data',
            liveValue: useL2Norm ? 'ON · 所有向量落在 S² 球面' : '已消融 · 模长失控漂浮',
            roleDesc: '点击消融关闭 L2 归一化：向量模长参差不齐，内积不再反映夹角余弦相似度，大模长向量会霸占 Softmax！',
            enabled: useL2Norm,
            onToggle: () => setUseL2Norm((v) => !v),
          },
          {
            id: 'sim',
            symbol: '平均匹配余弦相似度',
            role: 'output',
            liveValue: `cos(Î, T̂) = ${clipState.avgCos.toFixed(2)}`,
            roleDesc: '拖动对齐进度：对比损失像引力一样把同色方框（图像）与空心圆（文本）在 3D 球面上拉到重合，同时把异色负样本排斥到球面远端！',
          },
          {
            id: 'tau',
            symbol: '÷ τ 温度锐化系数',
            role: 'hyper',
            liveValue: `τ = ${tau.toFixed(2)} (缩放 ${(1 / tau).toFixed(1)}×)`,
            roleDesc: '单位球面内积最大仅为 1，除以极小温度 τ=0.07 可把微小夹角差异放大 14 倍，驱动精细对齐。',
          },
        ];

  return (
    <div className="rounded-2xl border border-slate-200/90 bg-white shadow-md overflow-hidden dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-gradient-to-r from-slate-900 via-sky-950 to-slate-900 px-5 py-3.5 text-white">
        <div className="flex items-center gap-2">
          <Globe className="h-4 w-4 text-sky-400" />
          <h3 className="text-sm sm:text-base font-bold">
            3D 高维表征演播室 · Attention 动态语境漂移 & CLIP 单位超球面 S²
          </h3>
        </div>
        <div className="flex rounded-lg bg-white/10 p-0.5 text-xs font-medium">
          <button
            onClick={() => setView('attn3d')}
            className={`rounded-md px-2.5 py-1 cursor-pointer transition ${
              view === 'attn3d' ? 'bg-sky-500 text-white' : 'text-slate-300 hover:text-white'
            }`}
          >
            3D Self-Attention 语义空间
          </button>
          <button
            onClick={() => setView('clip3d')}
            className={`rounded-md px-2.5 py-1 cursor-pointer transition ${
              view === 'clip3d' ? 'bg-emerald-500 text-white' : 'text-slate-300 hover:text-white'
            }`}
          >
            3D CLIP 单位超球面 S²
          </button>
        </div>
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
                setPitch((v) => Math.max(-1.1, Math.min(1.1, v + dy * 0.01)));
              }}
              onMouseUp={() => { dragRef.current.dragging = false; }}
              onMouseLeave={() => { dragRef.current.dragging = false; }}
              className="w-full max-w-[560px] aspect-[560/330] rounded-2xl bg-slate-950 border border-slate-800 cursor-grab active:cursor-grabbing shadow-inner"
            />
            <span className="mt-1.5 text-[11px] text-slate-400 inline-flex items-center gap-1">
              <Rotate3D className="h-3.5 w-3.5" /> 鼠标拖拽可 360° 旋转高维语义空间
            </span>
          </div>

          <div className="lg:col-span-4 space-y-4 text-xs">
            {view === 'attn3d' ? (
              <div className="rounded-xl border border-slate-200 p-4 space-y-3.5 dark:border-slate-800">
                <div className="font-semibold text-slate-700 dark:text-slate-200">
                  切换上下文句子，看多义词 &quot;bank&quot; 在 3D 空间中的实时漂移：
                </div>
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => setContextMode('river')}
                    className={`rounded-xl border px-3 py-2 text-left transition cursor-pointer ${
                      contextMode === 'river'
                        ? 'border-sky-500 bg-sky-50 text-sky-900 font-semibold dark:bg-sky-950/60 dark:text-sky-200'
                        : 'border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    🌊 &quot;walk along the river <u>bank</u>&quot;（河岸）
                  </button>
                  <button
                    onClick={() => setContextMode('finance')}
                    className={`rounded-xl border px-3 py-2 text-left transition cursor-pointer ${
                      contextMode === 'finance'
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-900 font-semibold dark:bg-emerald-950/60 dark:text-emerald-200'
                        : 'border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    🏦 &quot;apply for a <u>bank</u> loan&quot;（银行）
                  </button>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span>Transformer 层演化进度 (Input → Attn Output)</span>
                    <span className="font-mono font-bold text-amber-600">{Math.round(layerAlpha * 100)}%</span>
                  </div>
                  <input type="range" min={0} max={1} step={0.05} value={layerAlpha} onChange={(e) => setLayerAlpha(parseFloat(e.target.value))} className="w-full" />
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-slate-200 p-4 space-y-3.5 dark:border-slate-800">
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="font-semibold">对比学习训练对齐进度</span>
                    <span className="font-mono font-bold text-emerald-600">{Math.round(alignProgress * 100)}%</span>
                  </div>
                  <input type="range" min={0} max={1} step={0.02} value={alignProgress} onChange={(e) => setAlignProgress(parseFloat(e.target.value))} className="w-full" />
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>0% 随机乱分布</span>
                    <span>100% 图文成对重合</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span>温度参数 τ</span>
                    <span className="font-mono font-bold text-amber-600">{tau.toFixed(2)}</span>
                  </div>
                  <input type="range" min={0.05} max={0.5} step={0.01} value={tau} onChange={(e) => setTau(parseFloat(e.target.value))} className="w-full" />
                </div>

                <div className="flex items-start gap-1.5 rounded-lg bg-emerald-50/60 p-2.5 text-[11px] text-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200 leading-relaxed">
                  <Sparkles className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                  <span>
                    方框 ■ = 图像向量 Î，空心圆 ○ = 文本向量 T̂。对称 InfoNCE 损失把匹配对拉拢到超球面同一方向，同时把不同概念推开保证均匀性！
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
