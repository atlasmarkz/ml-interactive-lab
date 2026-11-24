import React, { useId, useMemo, useState } from 'react';
import { Lightbulb, MousePointerClick } from 'lucide-react';
import { RichText } from '../RichText';

/* ------------------------------------------------------------------ */
/* Card shell: a guiding question, the widget, and what to notice.    */
/* (Brilliant / Distill "explorable explanation" pattern)             */
/* ------------------------------------------------------------------ */

export const ExploreCard: React.FC<{
  title: string;
  prompt: string;
  insight: string;
  children: React.ReactNode;
}> = ({ title, prompt, insight, children }) => {
  const [showInsight, setShowInsight] = useState(false);
  return (
    <figure className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)] dark:border-zinc-800 dark:bg-[#11151d]">
      <div className="border-b border-stone-200 px-5 py-4 dark:border-zinc-800">
        <h3 className="font-serif-display text-lg font-semibold text-stone-900 dark:text-zinc-100">
          <RichText text={title} />
        </h3>
        <p className="mt-1.5 flex gap-2 text-[15px] leading-relaxed text-stone-600 dark:text-zinc-400">
          <MousePointerClick className="mt-1 h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" />
          <span>
            <RichText text={prompt} />
          </span>
        </p>
      </div>
      <div className="px-5 py-5">{children}</div>
      <figcaption className="border-t border-stone-200 bg-stone-50/70 px-5 py-3 dark:border-zinc-800 dark:bg-zinc-900/40">
        {showInsight ? (
          <div className="flex gap-2 text-[15px] leading-relaxed text-stone-700 dark:text-zinc-300">
            <Lightbulb className="mt-1 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
            <span>
              <RichText text={insight} />
            </span>
          </div>
        ) : (
          <button
            onClick={() => setShowInsight(true)}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-700 hover:underline dark:text-blue-400 cursor-pointer"
          >
            <Lightbulb className="h-4 w-4" />
            玩过之后，看看你应该注意到什么
          </button>
        )}
      </figcaption>
    </figure>
  );
};

/* ------------------------------- Controls ------------------------------- */

export const Slider: React.FC<{
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  format?: (v: number) => string;
}> = ({ label, value, min, max, step, onChange, format }) => {
  const id = useId();
  return (
    <div className="space-y-1">
      <label htmlFor={id} className="flex items-baseline justify-between gap-3 text-sm text-stone-700 dark:text-zinc-300">
        <span>
          <RichText text={label} />
        </span>
        <span className="font-mono text-[13px] tabular-nums text-stone-900 dark:text-zinc-100">
          {format ? format(value) : value}
        </span>
      </label>
      <input
        id={id}
        type="range"
        className="viz-range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
};

export function Segmented<T extends string>({
  value,
  options,
  onChange,
  label,
}: {
  value: T;
  options: [T, string][];
  onChange: (v: T) => void;
  label?: string;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {label && <span className="text-sm text-stone-600 dark:text-zinc-400"><RichText text={label} /></span>}
      <div role="radiogroup" className="inline-flex rounded-lg border border-stone-200 bg-stone-50 p-0.5 dark:border-zinc-800 dark:bg-zinc-900">
        {options.map(([v, text]) => (
          <button
            key={v}
            role="radio"
            aria-checked={value === v}
            onClick={() => onChange(v)}
            className={`rounded-md px-3 py-1 text-sm transition cursor-pointer ${
              value === v
                ? 'bg-white text-stone-900 shadow-sm dark:bg-zinc-700 dark:text-white'
                : 'text-stone-600 hover:text-stone-900 dark:text-zinc-400 dark:hover:text-zinc-200'
            }`}
          >
            <RichText text={text} />
          </button>
        ))}
      </div>
    </div>
  );
}

export const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { primary?: boolean }> = ({
  primary,
  className = '',
  ...rest
}) => (
  <button
    {...rest}
    className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition disabled:opacity-40 cursor-pointer ${
      primary
        ? 'bg-stone-900 text-white hover:bg-stone-800 dark:bg-blue-600 dark:hover:bg-blue-500'
        : 'border border-stone-300 bg-white text-stone-700 hover:bg-stone-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800'
    } ${className}`}
  />
);

/** Small labelled number, e.g. "KL = 0.42". Text stays in ink colours; a swatch carries identity. */
export const Readout: React.FC<{ label: string; value: string; color?: string; emphasis?: boolean }> = ({
  label,
  value,
  color,
  emphasis,
}) => (
  <div
    className={`rounded-lg border px-3 py-2 ${
      emphasis
        ? 'border-blue-200 bg-blue-50/60 dark:border-blue-900 dark:bg-blue-950/30'
        : 'border-stone-200 bg-stone-50/60 dark:border-zinc-800 dark:bg-zinc-900/50'
    }`}
  >
    <div className="flex items-center gap-1.5 text-xs text-stone-500 dark:text-zinc-400">
      {color && <span className="inline-block h-2 w-2 rounded-full" style={{ background: color }} />}
      <RichText text={label} />
    </div>
    <div className="mt-0.5 font-mono text-[15px] font-semibold tabular-nums text-stone-900 dark:text-zinc-100">{value}</div>
  </div>
);

export const Controls: React.FC<{ children: React.ReactNode; cols?: 1 | 2 | 3 }> = ({ children, cols = 2 }) => (
  <div className={`grid gap-x-6 gap-y-3 ${cols === 1 ? '' : cols === 2 ? 'sm:grid-cols-2' : 'sm:grid-cols-3'}`}>{children}</div>
);

/* --------------------------------- Charts -------------------------------- */

export const SERIES = ['var(--series-1)', 'var(--series-2)', 'var(--series-3)', 'var(--series-4)'];

export interface Series {
  name: string;
  points: [number, number][];
  color: string;
  dashed?: boolean;
}

export interface Scale {
  x: (v: number) => number;
  y: (v: number) => number;
  W: number;
  H: number;
  pad: { l: number; r: number; t: number; b: number };
}

function ticks(lo: number, hi: number, n = 5): number[] {
  const span = hi - lo;
  if (span <= 0) return [lo];
  const raw = span / n;
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => span / s <= n) ?? raw;
  const out: number[] = [];
  for (let v = Math.ceil(lo / step) * step; v <= hi + 1e-9; v += step) out.push(Number(v.toFixed(10)));
  return out;
}

const fmt = (v: number) => (Math.abs(v) >= 1000 ? v.toExponential(1) : Number(v.toFixed(3)).toString());

/**
 * Line chart with recessive grid, a legend (≥2 series), direct end labels and a
 * hover crosshair that reads every series at the nearest x.
 * `overlay` draws extra marks in data coordinates (points, regions, markers).
 */
export const LineChart: React.FC<{
  series: Series[];
  xDomain: [number, number];
  yDomain: [number, number];
  xLabel?: string;
  yLabel?: string;
  height?: number;
  overlay?: (s: Scale) => React.ReactNode;
  directLabels?: boolean;
  ariaLabel: string;
}> = ({ series, xDomain, yDomain, xLabel, yLabel, height = 240, overlay, directLabels = true, ariaLabel }) => {
  const W = 560;
  const H = height;
  const pad = { l: 44, r: directLabels && series.length > 1 ? 92 : 16, t: 12, b: xLabel ? 40 : 26 };
  const [hx, setHx] = useState<number | null>(null);

  const s: Scale = useMemo(() => {
    const x = (v: number) => pad.l + ((v - xDomain[0]) / (xDomain[1] - xDomain[0])) * (W - pad.l - pad.r);
    const y = (v: number) => {
      const c = Math.max(yDomain[0], Math.min(yDomain[1], v));
      return pad.t + (1 - (c - yDomain[0]) / (yDomain[1] - yDomain[0])) * (H - pad.t - pad.b);
    };
    return { x, y, W, H, pad };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [xDomain[0], xDomain[1], yDomain[0], yDomain[1], H, pad.r, pad.b]);

  const path = (pts: [number, number][]) =>
    pts
      .filter((p) => Number.isFinite(p[1]))
      .map((p, i) => `${i ? 'L' : 'M'}${s.x(p[0]).toFixed(1)},${s.y(p[1]).toFixed(1)}`)
      .join('');

  const onMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * W;
    if (px < pad.l || px > W - pad.r) return setHx(null);
    setHx(xDomain[0] + ((px - pad.l) / (W - pad.l - pad.r)) * (xDomain[1] - xDomain[0]));
  };

  const nearest = (pts: [number, number][], x: number) =>
    pts.reduce((best, p) => (Math.abs(p[0] - x) < Math.abs(best[0] - x) ? p : best), pts[0]);

  // spread end labels so they don't collide
  const labels = directLabels && series.length > 1
    ? series
        .map((sr) => ({ sr, y: s.y(sr.points[sr.points.length - 1]?.[1] ?? 0) }))
        .sort((a, b) => a.y - b.y)
        .reduce<{ sr: Series; y: number }[]>((acc, l) => {
          const prev = acc[acc.length - 1];
          acc.push({ ...l, y: prev && l.y - prev.y < 13 ? prev.y + 13 : l.y });
          return acc;
        }, [])
    : [];

  return (
    <div className="space-y-2">
      {series.length > 1 && (
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-stone-600 dark:text-zinc-400" aria-hidden>
          {series.map((sr) => (
            <span key={sr.name} className="inline-flex items-center gap-1.5">
              <svg width="18" height="8">
                <line x1="1" x2="17" y1="4" y2="4" stroke={sr.color} strokeWidth="2.5" strokeDasharray={sr.dashed ? '4 3' : undefined} strokeLinecap="round" />
              </svg>
              <RichText text={sr.name} />
            </span>
          ))}
        </div>
      )}
      <div className="relative">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full h-auto select-none"
          role="img"
          aria-label={ariaLabel}
          onMouseMove={onMove}
          onMouseLeave={() => setHx(null)}
        >
          {ticks(yDomain[0], yDomain[1], 4).map((t) => (
            <g key={`y${t}`}>
              <line className="viz-grid" x1={pad.l} x2={W - pad.r} y1={s.y(t)} y2={s.y(t)} />
              <text className="viz-text" x={pad.l - 6} y={s.y(t) + 3.5} textAnchor="end">
                {fmt(t)}
              </text>
            </g>
          ))}
          {ticks(xDomain[0], xDomain[1], 6).map((t) => (
            <text key={`x${t}`} className="viz-text" x={s.x(t)} y={H - pad.b + 15} textAnchor="middle">
              {fmt(t)}
            </text>
          ))}
          <line className="viz-axis" x1={pad.l} x2={W - pad.r} y1={H - pad.b} y2={H - pad.b} />
          {xLabel && (
            <text className="viz-text" x={(pad.l + W - pad.r) / 2} y={H - 6} textAnchor="middle">
              {xLabel}
            </text>
          )}
          {yLabel && (
            <text className="viz-text" x={pad.l + 4} y={pad.t + 10}>
              {yLabel}
            </text>
          )}
          {overlay?.(s)}
          {series.map((sr) => (
            <path
              key={sr.name}
              d={path(sr.points)}
              fill="none"
              stroke={sr.color}
              strokeWidth={2}
              strokeLinejoin="round"
              strokeLinecap="round"
              strokeDasharray={sr.dashed ? '5 4' : undefined}
            />
          ))}
          {labels.map(({ sr, y }) => (
            <text key={sr.name} className="viz-text" x={W - pad.r + 6} y={y + 3.5}>
              {sr.name.replace(/\$/g, '').slice(0, 14)}
            </text>
          ))}
          {hx !== null && (
            <g pointerEvents="none">
              <line x1={s.x(hx)} x2={s.x(hx)} y1={pad.t} y2={H - pad.b} className="viz-axis" strokeDasharray="3 3" />
              {series.map((sr) => {
                const p = nearest(sr.points, hx);
                return p && Number.isFinite(p[1]) ? (
                  <circle key={sr.name} cx={s.x(p[0])} cy={s.y(p[1])} r={4.5} fill={sr.color} stroke="var(--chart-surface)" strokeWidth={2} />
                ) : null;
              })}
            </g>
          )}
        </svg>
        {hx !== null && (
          <div
            className="pointer-events-none absolute top-1 rounded-md border border-stone-200 bg-white/95 px-2.5 py-1.5 font-mono text-[12px] shadow-sm dark:border-zinc-700 dark:bg-zinc-900/95"
            style={{ left: `${(s.x(hx) / W) * 100 > 60 ? 4 : 62}%` }}
          >
            <div className="text-stone-500 dark:text-zinc-400">
              {xLabel ?? 'x'} = {fmt(hx)}
            </div>
            {series.map((sr) => {
              const p = nearest(sr.points, hx);
              return (
                <div key={sr.name} className="flex items-center gap-1.5 text-stone-800 dark:text-zinc-200">
                  <span className="inline-block h-2 w-2 rounded-full" style={{ background: sr.color }} />
                  {sr.name.replace(/\$/g, '')}: {p ? fmt(p[1]) : '—'}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export const linspace = (a: number, b: number, n: number) => Array.from({ length: n }, (_, i) => a + ((b - a) * i) / (n - 1));

/** Deterministic PRNG so every reader sees the same "random" sample. */
export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function gaussian(rand: () => number) {
  const u = Math.max(1e-12, rand());
  const v = rand();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

export const sigmoid = (z: number) => 1 / (1 + Math.exp(-z));
