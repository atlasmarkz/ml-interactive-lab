import React, { useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Dice5, Shuffle } from 'lucide-react';
import { Button, Controls, ExploreCard, LineChart, Readout, SERIES, Segmented, Slider, linspace, mulberry32, sigmoid } from './kit';
import { softmax } from './math';
import { RichText } from '../RichText';

/* ============================ shared heatmap ============================ */

const Heat: React.FC<{ m: number[][]; rows: string[]; cols: string[]; activeRow?: number; onRow?: (i: number) => void; diag?: boolean }> = ({ m, rows, cols, activeRow, onRow, diag }) => (
  <table className="border-separate border-spacing-[3px] font-mono text-[12px]">
    <thead>
      <tr>
        <th />
        {cols.map((c) => (
          <th key={c} className="px-1 pb-1 font-normal text-stone-500 dark:text-zinc-400">{c}</th>
        ))}
      </tr>
    </thead>
    <tbody>
      {m.map((row, i) => (
        <tr key={i} onMouseEnter={() => onRow?.(i)} className={onRow ? 'cursor-pointer' : ''}>
          <th className={`pr-2 text-right font-normal ${activeRow === i ? 'text-blue-700 dark:text-blue-400' : 'text-stone-500 dark:text-zinc-400'}`}>{rows[i]}</th>
          {row.map((v, j) => (
            <td
              key={j}
              title={v.toFixed(3)}
              className={`h-9 w-12 rounded text-center tabular-nums ${activeRow === i ? 'ring-2 ring-blue-500' : ''} ${diag && i === j ? 'outline outline-1 outline-stone-400' : ''}`}
              style={{ background: `color-mix(in oklab, var(--series-1) ${Math.round(v * 100)}%, transparent)`, color: v > 0.55 ? 'white' : undefined }}
            >
              {v.toFixed(2)}
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  </table>
);

/* ===================== L08.1 · Self-attention playground ===================== */

type WQ = 'I' | 'swap' | 'rot' | 'x3';
const WQS: Record<WQ, { m: number[][]; label: string }> = {
  I: { m: [[1, 0], [0, 1]], label: '$\\mathbf{I}$' },
  swap: { m: [[0, 1], [1, 0]], label: '交换坐标' },
  rot: { m: [[0, -1], [1, 0]], label: '旋转 90°' },
  x3: { m: [[3, 0], [0, 3]], label: '$3\\mathbf{I}$' },
};
const START: [number, number][] = [[1, 0.2], [0.1, 1], [0.8, 0.8], [-0.7, 0.4]];

export const AttentionPlayground: React.FC = () => {
  const [X, setX] = useState<[number, number][]>(START);
  const [names, setNames] = useState(['x1', 'x2', 'x3', 'x4']);
  const [wq, setWq] = useState<WQ>('I');
  const [scaled, setScaled] = useState(false);
  const [causal, setCausal] = useState(false);
  const [row, setRow] = useState(0);
  const drag = useRef<number | null>(null);
  const svg = useRef<SVGSVGElement>(null);

  const M = WQS[wq].m;
  const Q = X.map(([a, b]) => [a * M[0][0] + b * M[1][0], a * M[0][1] + b * M[1][1]]); // row-vector x Wq
  const A = Q.map((q, i) =>
    softmax(X.map((k, j) => (causal && j > i ? -1e9 : (q[0] * k[0] + q[1] * k[1]) / (scaled ? Math.SQRT2 : 1))))
  );
  const Z = A.map((w) => [w.reduce((s, a, j) => s + a * X[j][0], 0), w.reduce((s, a, j) => s + a * X[j][1], 0)]);

  const S = 300, R = 1.6;
  const sx = (v: number) => ((v + R) / (2 * R)) * S;
  const sy = (v: number) => S - ((v + R) / (2 * R)) * S;
  const toData = (e: React.PointerEvent) => {
    const r = svg.current!.getBoundingClientRect();
    const px = ((e.clientX - r.left) / r.width) * S;
    const py = ((e.clientY - r.top) / r.height) * S;
    return [Math.max(-R, Math.min(R, (px / S) * 2 * R - R)), Math.max(-R, Math.min(R, R - (py / S) * 2 * R))] as [number, number];
  };
  const shuffle = () => {
    const perm = [2, 0, 3, 1];
    setX(perm.map((p) => X[p]));
    setNames(perm.map((p) => names[p]));
  };

  return (
    <ExploreCard
      title="自注意力游乐场：拖动 token，看注意力如何重新分配"
      prompt="平面上 4 个点是二维 token 向量（$\mathbf{W}^K = \mathbf{W}^V = \mathbf{I}$）。拖动它们；切换 $\mathbf{W}^Q$；把鼠标移到热力图某一行，左图用连线粗细表示该 token 关注谁、空心圈是输出 $\mathbf{z}_i$。最后点「打乱顺序」。"
      insight="输出 $\mathbf{z}_i$ 是 value 的凸组合，永远落在各 token 围成的凸包里。换 $\mathbf{W}^Q$ 会改变「谁关注谁」（WA3 Q5 a vs b）；$3\mathbf{I}$ 放大点积，softmax 变尖锐——这就是 $\sqrt{d_k}$ 缩放要防止的饱和。打乱输入顺序后，注意力矩阵的行和列一起重排、输出也同样重排：自注意力对顺序置换等变，所以需要位置编码。打开因果掩码，每行只能看见自己和之前的 token。"
    >
      <div className="flex flex-wrap items-center gap-3">
        <Segmented value={wq} onChange={setWq} options={Object.entries(WQS).map(([k, v]) => [k as WQ, v.label])} label="$\mathbf{W}^Q$" />
        <Segmented value={scaled ? 'y' : 'n'} onChange={(v) => setScaled(v === 'y')} options={[['n', '不缩放'], ['y', '÷ √dₖ']]} />
        <Segmented value={causal ? 'y' : 'n'} onChange={(v) => setCausal(v === 'y')} options={[['n', '双向'], ['y', '因果掩码']]} />
        <Button onClick={shuffle}><Shuffle className="h-4 w-4" />打乱顺序</Button>
      </div>
      <div className="mt-4 grid items-start gap-6 md:grid-cols-[300px_1fr]">
        <svg
          ref={svg}
          viewBox={`0 0 ${S} ${S}`}
          className="w-full max-w-[300px] touch-none rounded-lg border border-stone-200 dark:border-zinc-800"
          onPointerMove={(e) => {
            if (drag.current === null) return;
            const p = toData(e);
            setX((xs) => xs.map((x, i) => (i === drag.current ? p : x)));
          }}
          onPointerUp={() => (drag.current = null)}
          onPointerLeave={() => (drag.current = null)}
          role="img"
          aria-label="二维 token 平面"
        >
          <line className="viz-grid" x1={sx(0)} x2={sx(0)} y1={0} y2={S} />
          <line className="viz-grid" x1={0} x2={S} y1={sy(0)} y2={sy(0)} />
          {X.map((x, j) => (
            <line key={`a${j}`} x1={sx(X[row][0])} y1={sy(X[row][1])} x2={sx(x[0])} y2={sy(x[1])} stroke={SERIES[0]} strokeWidth={1 + 9 * A[row][j]} strokeOpacity={0.35} strokeLinecap="round" />
          ))}
          {Z.map((z, i) => (
            <circle key={`z${i}`} cx={sx(z[0])} cy={sy(z[1])} r={i === row ? 7 : 4.5} fill="none" stroke={SERIES[1]} strokeWidth={2} />
          ))}
          {X.map((x, i) => (
            <g key={i} onPointerDown={(e) => { drag.current = i; setRow(i); (e.target as Element).setPointerCapture?.(e.pointerId); }} className="cursor-grab">
              <circle cx={sx(x[0])} cy={sy(x[1])} r={11} fill={i === row ? SERIES[0] : 'var(--chart-surface)'} stroke={SERIES[0]} strokeWidth={2} />
              <text x={sx(x[0])} y={sy(x[1]) + 4} textAnchor="middle" className="viz-text" style={{ fill: i === row ? 'white' : undefined }}>{names[i].slice(1)}</text>
            </g>
          ))}
        </svg>
        <div className="space-y-3 overflow-x-auto">
          <div className="text-xs text-stone-500 dark:text-zinc-400"><RichText text="注意力权重 $\alpha_{ij}$（行 = query，列 = key，每行和为 1）" /></div>
          <Heat m={A} rows={names.map((n) => `q·${n}`)} cols={names} activeRow={row} onRow={setRow} />
          <div className="font-mono text-[13px] text-stone-700 dark:text-zinc-300">
            z<sub>{names[row].slice(1)}</sub> = ({Z[row][0].toFixed(3)}, {Z[row][1].toFixed(3)})
          </div>
          <Button onClick={() => { setX(START); setNames(['x1', 'x2', 'x3', 'x4']); }}>恢复初始位置</Button>
        </div>
      </div>
    </ExploreCard>
  );
};

/* ===================== L08.2 · Temperature & top-k sampling ===================== */

const VOCAB = ['sunny', 'rainy', 'cloudy', 'warm', 'windy', 'nice', 'cold', 'purple'];
const LOGITS = [3.2, 2.5, 2.1, 1.4, 1.0, 0.6, 0.1, -1.5];

export const SamplingPlayground: React.FC = () => {
  const [tau, setTau] = useState(1);
  const [topK, setTopK] = useState(8);
  const [samples, setSamples] = useState<string[]>([]);
  const probs = useMemo(() => {
    const z = LOGITS.map((l, i) => (i < topK ? l / Math.max(tau, 1e-3) : -1e9));
    return softmax(z);
  }, [tau, topK]);
  const H = -probs.reduce((s, p) => s + (p > 1e-12 ? p * Math.log(p) : 0), 0);
  const draw = () => {
    const r = mulberry32(Math.floor(Math.random() * 1e9));
    setSamples(Array.from({ length: 12 }, () => {
      let u = r(), i = 0;
      while (i < probs.length - 1 && u > probs[i]) { u -= probs[i]; i++; }
      return VOCAB[i];
    }));
  };
  return (
    <ExploreCard
      title="自回归生成：温度与 Top-k 如何改变下一个词"
      prompt="提示词是 “The weather today is”。调节温度 $\tau$ 与 Top-$k$，然后点「采样 12 次」看看模型会怎么续写。"
      insight="logits 除以 $\tau$ 后再 softmax：$\tau \to 0$ 时分布变成 one-hot（贪心解码，总是 sunny），$\tau$ 越大越平坦，连 “purple” 这种不合理的词也有机会被采到。Top-$k$ 直接截掉长尾，只在最可能的 $k$ 个词里重新归一化——这是在多样性和可靠性之间折中。熵是衡量分布「有多随机」的一个数字。"
    >
      <div className="space-y-1.5">
        {VOCAB.map((w, i) => (
          <div key={w} className="grid grid-cols-[4.5rem_1fr_3.5rem] items-center gap-2 text-sm">
            <span className={`font-mono ${i < topK ? 'text-stone-800 dark:text-zinc-200' : 'text-stone-400 line-through dark:text-zinc-600'}`}>{w}</span>
            <div className="h-5 rounded bg-stone-100 dark:bg-zinc-800">
              <div className="h-5 rounded transition-all" style={{ width: `${probs[i] * 100}%`, background: SERIES[0] }} />
            </div>
            <span className="text-right font-mono tabular-nums text-stone-700 dark:text-zinc-300">{(probs[i] * 100).toFixed(1)}%</span>
          </div>
        ))}
      </div>
      <div className="mt-4">
        <Controls>
          <Slider label="温度 $\tau$" value={tau} min={0.05} max={3} step={0.05} onChange={setTau} format={(v) => v.toFixed(2)} />
          <Slider label="Top-$k$" value={topK} min={1} max={8} step={1} onChange={setTopK} />
        </Controls>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <Button primary onClick={draw}><Dice5 className="h-4 w-4" />采样 12 次</Button>
        <Readout label="分布的熵 (nats)" value={H.toFixed(3)} />
      </div>
      {samples.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {samples.map((s, i) => (
            <span key={i} className="rounded-md bg-stone-100 px-2 py-0.5 font-mono text-[13px] text-stone-700 dark:bg-zinc-800 dark:text-zinc-300">{s}</span>
          ))}
        </div>
      )}
    </ExploreCard>
  );
};

/* ===================== L08.2 · Bradley–Terry reward model ===================== */

export const BradleyTerry: React.FC = () => {
  const [rw, setRw] = useState(1.5);
  const [rl, setRl] = useState(0.5);
  const xs = linspace(-5, 5, 201);
  const d = rw - rl;
  return (
    <ExploreCard
      title="奖励模型：偏好概率只取决于奖励差"
      prompt="设置奖励模型给「被偏好回答」和「被拒绝回答」的分数。把两个分数同时加 2，概率会变吗？"
      insight="$P(y_w \succ y_l) = \sigma(r_w - r_l)$ 只依赖差值，所以奖励只确定到一个常数平移。损失 $-\log\sigma(r_w - r_l)$ 在排序错误（差值为负）时近似线性增长、梯度大；排序正确且差距足够大时趋于 0，几乎不再推动——和 logistic 损失完全一样，本质是以「哪个更好」为标签的二分类。"
    >
      <LineChart
        ariaLabel="偏好概率与损失"
        xDomain={[-5, 5]}
        yDomain={[0, 3]}
        xLabel="奖励差 r_w − r_l"
        series={[
          { name: 'P(y_w ≻ y_l)', color: SERIES[0], points: xs.map((x) => [x, sigmoid(x)]) },
          { name: '损失 −log σ', color: SERIES[1], points: xs.map((x) => [x, Math.log(1 + Math.exp(-x))]) },
        ]}
        overlay={(s) => (
          <g>
            <line x1={s.x(d)} x2={s.x(d)} y1={s.pad.t} y2={s.H - s.pad.b} stroke="var(--chart-ink)" strokeDasharray="4 3" />
            <circle cx={s.x(d)} cy={s.y(sigmoid(d))} r={5} fill={SERIES[0]} stroke="var(--chart-surface)" strokeWidth={2} />
            <circle cx={s.x(d)} cy={s.y(Math.log(1 + Math.exp(-d)))} r={5} fill={SERIES[1]} stroke="var(--chart-surface)" strokeWidth={2} />
          </g>
        )}
      />
      <div className="mt-3">
        <Controls>
          <Slider label="$r(x, y_w)$" value={rw} min={-3} max={3} step={0.1} onChange={setRw} format={(v) => v.toFixed(1)} />
          <Slider label="$r(x, y_l)$" value={rl} min={-3} max={3} step={0.1} onChange={setRl} format={(v) => v.toFixed(1)} />
        </Controls>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <Readout color={SERIES[0]} label="偏好概率" value={sigmoid(d).toFixed(4)} />
        <Readout color={SERIES[1]} label="该样本损失" value={Math.log(1 + Math.exp(-d)).toFixed(4)} />
      </div>
    </ExploreCard>
  );
};

/* ===================== L08.3 · Agent loop stepper ===================== */

const TRACE: { kind: 'goal' | 'think' | 'act' | 'obs' | 'answer'; text: string }[] = [
  { kind: 'goal', text: '用户目标：找出 CLIP 论文的发表会议与年份，并算出距今多少年。' },
  { kind: 'think', text: '我不确定准确年份，应该先检索，而不是凭记忆回答（避免幻觉）。' },
  { kind: 'act', text: 'search("Learning Transferable Visual Models From Natural Language Supervision")' },
  { kind: 'obs', text: '检索结果：Radford et al., ICML 2021。' },
  { kind: 'think', text: '已拿到年份 2021。差值需要计算，用计算工具更可靠。' },
  { kind: 'act', text: 'python("2026 - 2021")' },
  { kind: 'obs', text: '输出：5' },
  { kind: 'think', text: '信息齐全，可以回答，并注明来源。' },
  { kind: 'answer', text: 'CLIP 发表于 ICML 2021，距今约 5 年（来源：检索结果）。' },
];
const KIND_META = {
  goal: { label: '目标', cls: 'border-stone-300 bg-stone-50 dark:border-zinc-700 dark:bg-zinc-900' },
  think: { label: '思考 (LLM)', cls: 'border-blue-200 bg-blue-50/70 dark:border-blue-900 dark:bg-blue-950/30' },
  act: { label: '行动 (调用工具)', cls: 'border-amber-200 bg-amber-50/70 dark:border-amber-900 dark:bg-amber-950/30' },
  obs: { label: '观察 (工具返回)', cls: 'border-emerald-200 bg-emerald-50/70 dark:border-emerald-900 dark:bg-emerald-950/30' },
  answer: { label: '最终回答', cls: 'border-stone-400 bg-white dark:border-zinc-500 dark:bg-zinc-900' },
};

export const AgentLoop: React.FC = () => {
  const [k, setK] = useState(1);
  return (
    <ExploreCard
      title="智能体循环：思考 → 行动 → 观察"
      prompt="一步步推进下面的执行轨迹。注意每一步之后，「上下文」里多了什么。"
      insight="单纯的 LLM 只能根据已有上下文生成一次回答；Agent 把 LLM 放进循环：由它决定调用什么工具，工具的返回结果再被追加进上下文，供下一步推理使用。上下文随步骤不断变长，这正是讲座强调 context engineering（管理放进上下文的内容）与 harness engineering（工具、校验、恢复）的原因。"
    >
      <ol className="space-y-2">
        {TRACE.slice(0, k).map((t, i) => (
          <li key={i} className={`rounded-lg border px-3.5 py-2.5 text-[15px] ${KIND_META[t.kind].cls}`}>
            <div className="text-xs font-medium text-stone-500 dark:text-zinc-400">{i + 1}. {KIND_META[t.kind].label}</div>
            <div className={`mt-0.5 text-stone-800 dark:text-zinc-200 ${t.kind === 'act' ? 'font-mono text-[13px]' : ''}`}>{t.text}</div>
          </li>
        ))}
      </ol>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Button onClick={() => setK((v) => Math.max(1, v - 1))} disabled={k <= 1}><ChevronLeft className="h-4 w-4" />上一步</Button>
        <Button primary onClick={() => setK((v) => Math.min(TRACE.length, v + 1))} disabled={k >= TRACE.length}>下一步<ChevronRight className="h-4 w-4" /></Button>
        <span className="font-mono text-xs text-stone-500 dark:text-zinc-400">上下文中已有 {k} 条记录 · 工具调用 {TRACE.slice(0, k).filter((t) => t.kind === 'act').length} 次</span>
      </div>
    </ExploreCard>
  );
};

/* ===================== L09 · ViT patchify ===================== */

export const PatchifyExplorer: React.FC = () => {
  const [img, setImg] = useState(224);
  const [patch, setPatch] = useState(16);
  const [hover, setHover] = useState<[number, number] | null>(null);
  const n = Math.floor(img / patch);
  const valid = img % patch === 0;
  const N = n * n;
  const S = 260;
  const cell = S / n;
  return (
    <ExploreCard
      title="ViT 如何把图像变成序列"
      prompt="改变图像边长与 patch 大小。把鼠标移到某个 patch 上，看看它在序列中的位置。"
      insight="patch 数 $N = HW/P^2$，每个 patch 展平成 $P^2C$ 维再线性投影到 $D$ 维，再加一个 [CLS]。注意力矩阵有 $(N+1)^2$ 个元素：patch 边长减半，序列长度变 4 倍、注意力计算量约变 16 倍——这就是 ViT 通常用 16×16 而不是更小 patch 的原因。位置嵌入让模型知道每个 token 原来在第几行第几列。"
    >
      <div className="grid items-start gap-6 md:grid-cols-[260px_1fr]">
        <svg viewBox={`0 0 ${S} ${S}`} className="w-full max-w-[260px] rounded-lg" role="img" aria-label="图像切分为 patch" onMouseLeave={() => setHover(null)}>
          <defs>
            <linearGradient id="vit-sky" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#bcd7f5" />
              <stop offset="1" stopColor="#f4e6c8" />
            </linearGradient>
          </defs>
          <rect width={S} height={S} fill="url(#vit-sky)" />
          <circle cx={190} cy={70} r={32} fill="#f2b84b" />
          <path d={`M0 ${S} L70 150 L130 210 L190 130 L${S} 200 L${S} ${S} Z`} fill="#6f8f5a" />
          <rect x={40} y={190} width={50} height={40} fill="#9b5b3c" />
          {valid && Array.from({ length: n }, (_, i) =>
            Array.from({ length: n }, (_, j) => (
              <rect key={`${i}-${j}`} x={j * cell} y={i * cell} width={cell} height={cell} fill={hover && hover[0] === i && hover[1] === j ? 'rgba(37,99,235,0.35)' : 'transparent'}
                stroke="rgba(255,255,255,0.85)" strokeWidth={n > 28 ? 0.3 : 1} onMouseEnter={() => setHover([i, j])} />
            ))
          )}
        </svg>
        <div className="space-y-3">
          <Controls cols={1}>
            <Slider label="图像边长 $H = W$" value={img} min={32} max={448} step={16} onChange={setImg} format={(v) => `${v}px`} />
            <Segmented value={String(patch) as '8' | '14' | '16' | '32'} onChange={(v) => setPatch(Number(v))} options={[['8', 'P = 8'], ['14', 'P = 14'], ['16', 'P = 16'], ['32', 'P = 32']]} label="patch 大小" />
          </Controls>
          {!valid ? (
            <div className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
              {img} 不能被 {patch} 整除，图像无法整齐切分（实际实现会先缩放或裁剪）。
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <Readout label="patch 数 $N$" value={`${n}×${n} = ${N}`} emphasis />
              <Readout label="展平维度 $P^2C$" value={`${patch * patch * 3}`} />
              <Readout label="序列长度（含 [CLS]）" value={`${N + 1}`} />
              <Readout label="注意力矩阵元素" value={(N + 1) ** 2 > 1e6 ? `${((N + 1) ** 2 / 1e6).toFixed(2)} M` : `${(N + 1) ** 2}`} />
            </div>
          )}
          {valid && hover && (
            <div className="font-mono text-[13px] text-stone-600 dark:text-zinc-400">
              patch (行 {hover[0]}, 列 {hover[1]}) → 序列第 {hover[0] * n + hover[1] + 1} 个 token（[CLS] 是第 0 个）
            </div>
          )}
        </div>
      </div>
    </ExploreCard>
  );
};

/* ===================== L09 · CLIP contrastive matrix ===================== */

const CLIP_SIM = [
  [0.31, 0.12, 0.08, 0.15],
  [0.10, 0.28, 0.21, 0.05],
  [0.07, 0.19, 0.26, 0.09],
  [0.14, 0.04, 0.11, 0.33],
];

export const ClipMatrix: React.FC = () => {
  const [invTau, setInvTau] = useState(10);
  const rows = CLIP_SIM.map((r) => softmax(r.map((v) => v * invTau)));
  const cols = CLIP_SIM[0].map((_, j) => softmax(CLIP_SIM.map((r) => r[j] * invTau)));
  const lossI = -rows.reduce((s, r, i) => s + Math.log(r[i]), 0) / 4;
  const lossT = -cols.reduce((s, c, j) => s + Math.log(c[j]), 0) / 4;
  return (
    <ExploreCard
      title="CLIP：一个 batch 里的对比学习"
      prompt="4 张图片与 4 段文字的余弦相似度已经给定（对角线是真实配对）。调节 $1/\tau$，观察「以图找文」每一行的 softmax 和对称损失。"
      insight="CLIP 把每一行（图→文）和每一列（文→图）都当作一个 $B$ 类分类问题，正确类别就是对角线。余弦相似度本身只在 $[-1, 1]$，差距很小，所以必须乘以较大的 $1/\tau$（CLIP 学到约 100）才能让 softmax 拉开、损失下降。图 2 与文 3 的相似度很接近，是「难负样本」。"
    >
      <div className="grid items-start gap-6 md:grid-cols-[auto_1fr]">
        <div className="overflow-x-auto">
          <div className="mb-1 text-xs text-stone-500 dark:text-zinc-400"><RichText text="行 softmax：$P(\text{文}_j \mid \text{图}_i)$" /></div>
          <Heat m={rows} rows={['图1', '图2', '图3', '图4']} cols={['文1', '文2', '文3', '文4']} diag />
        </div>
        <div className="space-y-3">
          <Slider label="$1/\tau$（logit scale）" value={invTau} min={1} max={100} step={1} onChange={setInvTau} />
          <div className="grid grid-cols-2 gap-2">
            <Readout label="图→文 损失" value={lossI.toFixed(3)} />
            <Readout label="文→图 损失" value={lossT.toFixed(3)} />
            <Readout label="对称损失（平均）" value={((lossI + lossT) / 2).toFixed(3)} emphasis />
            <Readout label="随机猜的损失 $\ln 4$" value={Math.log(4).toFixed(3)} />
          </div>
        </div>
      </div>
    </ExploreCard>
  );
};
