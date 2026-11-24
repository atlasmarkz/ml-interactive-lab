import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Calendar, Crown, Eraser, Flame, GraduationCap, Layers, Lock, Moon, ScrollText, Sprout, Sunrise, Target, Zap } from 'lucide-react';
import { GOAL_OPTIONS, Progress, dayToDate, longestStreak, setGoal, streak, today, todayCount, totalReviews, useProgress } from '../../utils/progress';
import { ACHIEVEMENTS, Achievement, isUnlocked } from '../../utils/achievements';

/* ============================ GitHub-style heatmap ============================ */

// One hue, light → dark (sequential), stepped separately for light and dark surfaces.
const LEVELS_LIGHT = ['#ebedf0', '#9be9a8', '#40c463', '#30a14e', '#216e39'];
const LEVELS_DARK = ['#1f242c', '#0e4429', '#006d32', '#26a641', '#39d353'];
const WEEKDAY = ['一', '', '三', '', '五', '', '日'];

function level(n: number, goal: number) {
  if (n <= 0) return 0;
  if (n < goal * 0.5) return 1;
  if (n < goal) return 2;
  if (n < goal * 2) return 3;
  return 4;
}

/** `weeks` omitted = fill the available width (up to a year). */
export const ActivityHeatmap: React.FC<{ weeks?: number; cell?: number; gap?: number; showLegend?: boolean }> = ({
  weeks: fixedWeeks,
  cell = 13,
  gap = 3,
  showLegend = true,
}) => {
  const p = useProgress();
  const [hover, setHover] = useState<{ d: number; x: number; y: number } | null>(null);
  const wrap = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    if (fixedWeeks || !wrap.current) return;
    const ro = new ResizeObserver(([e]) => setWidth(e.contentRect.width));
    ro.observe(wrap.current);
    return () => ro.disconnect();
  }, [fixedWeeks]);
  const step = cell + gap;
  const left = 18;
  const weeks = fixedWeeks ?? Math.max(8, Math.min(53, Math.floor((width - left) / step) || 20));
  const t = today();
  const dow = (dayToDate(t).getDay() + 6) % 7; // Monday = 0
  const start = t - dow - (weeks - 1) * 7; // Monday of the first column
  const cols = Array.from({ length: weeks }, (_, w) => Array.from({ length: 7 }, (_, r) => start + w * 7 + r));
  const top = 16;
  const W = left + weeks * step;
  const H = top + 7 * step;
  const dark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');
  const palette = dark ? LEVELS_DARK : LEVELS_LIGHT;

  const months = cols
    .map((c, w) => ({ w, m: dayToDate(c[0]).getMonth(), first: w === 0 || dayToDate(c[0]).getMonth() !== dayToDate(cols[w - 1][0]).getMonth() }))
    .filter((x) => x.first && x.w < weeks - 1);

  const fmt = (d: number) => {
    const dt = dayToDate(d);
    return `${dt.getMonth() + 1} 月 ${dt.getDate()} 日`;
  };

  return (
    <div ref={wrap} className="space-y-2">
      <div className="relative w-fit max-w-full overflow-x-auto">
        <svg width={W} height={H} role="img" aria-label={`最近 ${weeks} 周的复习记录`} onMouseLeave={() => setHover(null)}>
          {months.map(({ w, m }) => (
            <text key={w} x={left + w * step} y={10} className="viz-text" style={{ fontSize: 10 }}>
              {m + 1}月
            </text>
          ))}
          {WEEKDAY.map((d, r) =>
            d ? (
              <text key={r} x={0} y={top + r * step + cell - 2} className="viz-text" style={{ fontSize: 9.5 }}>
                {d}
              </text>
            ) : null
          )}
          {cols.map((c, w) =>
            c.map((d, r) => {
              if (d > t) return null;
              const n = p.activity[d] ?? 0;
              return (
                <rect
                  key={d}
                  x={left + w * step}
                  y={top + r * step}
                  width={cell}
                  height={cell}
                  rx={2.5}
                  fill={palette[level(n, p.goal)]}
                  stroke={d === t ? 'var(--chart-ink)' : undefined}
                  strokeWidth={d === t ? 1.2 : 0}
                  onMouseEnter={() => setHover({ d, x: left + w * step, y: top + r * step })}
                />
              );
            })
          )}
        </svg>
        {hover && (
          <div
            className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-md bg-stone-900 px-2 py-1 text-[12px] text-white shadow dark:bg-zinc-700"
            style={{ left: hover.x + cell / 2, top: hover.y - 4 }}
          >
            {fmt(hover.d)} · {p.activity[hover.d] ?? 0} 次复习
          </div>
        )}
      </div>
      {showLegend && (
        <div className="flex items-center justify-end gap-1 text-[11.5px] text-stone-500 dark:text-zinc-400">
          少
          {palette.map((c, i) => (
            <span key={i} className="inline-block rounded-[2px]" style={{ width: 10, height: 10, background: c }} />
          ))}
          多
          <span className="ml-1">（每日目标 {p.goal} 次 = 第三档）</span>
        </div>
      )}
    </div>
  );
};

/* ============================ Daily goal ring ============================ */

export const DailyGoal: React.FC<{ size?: number; editable?: boolean }> = ({ size = 96, editable = true }) => {
  const p = useProgress();
  const n = todayCount(p);
  const frac = Math.min(1, n / p.goal);
  const r = size / 2 - 7;
  const C = 2 * Math.PI * r;
  const done = n >= p.goal;
  return (
    <div className="flex items-center gap-4">
      <svg width={size} height={size} role="img" aria-label={`今日 ${n} / ${p.goal}`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--chart-grid)" strokeWidth={8} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={done ? '#30a14e' : 'var(--series-1)'}
          strokeWidth={8}
          strokeLinecap="round"
          strokeDasharray={`${C * frac} ${C}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: 'stroke-dasharray 400ms ease' }}
        />
        <text x="50%" y="47%" textAnchor="middle" className="fill-stone-900 dark:fill-zinc-100" style={{ font: '600 20px var(--font-mono)' }}>
          {n}
        </text>
        <text x="50%" y="66%" textAnchor="middle" className="viz-text">
          / {p.goal}
        </text>
      </svg>
      <div className="space-y-1.5">
        <div className="text-[15px] font-semibold text-stone-900 dark:text-zinc-100">{done ? '今日目标已达成' : `今天还差 ${p.goal - n} 次`}</div>
        <div className="text-[12.5px] text-stone-500 dark:text-zinc-400">翻一张卡片或做一道题都算一次复习</div>
        {editable && (
          <div className="flex items-center gap-1 text-[12px] text-stone-500 dark:text-zinc-400">
            每日目标
            {GOAL_OPTIONS.map((g) => (
              <button
                key={g}
                onClick={() => setGoal(g)}
                className={`rounded px-1.5 py-0.5 font-mono cursor-pointer ${p.goal === g ? 'bg-stone-900 text-white dark:bg-blue-600' : 'hover:bg-stone-100 dark:hover:bg-zinc-800'}`}
              >
                {g}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

/* ============================ Streak numbers ============================ */

export function useStreakStats() {
  const p = useProgress();
  return useMemo(
    () => ({
      current: streak(p),
      longest: longestStreak(p),
      total: totalReviews(p),
      days: Object.values(p.activity).filter((n) => n > 0).length,
    }),
    [p]
  );
}

/* ============================ Achievements ============================ */

const ICONS: Record<Achievement['icon'], React.ComponentType<{ className?: string }>> = {
  sprout: Sprout, flame: Flame, calendar: Calendar, layers: Layers, target: Target, eraser: Eraser,
  scroll: ScrollText, crown: Crown, grad: GraduationCap, moon: Moon, sunrise: Sunrise, zap: Zap,
};

export const AchievementIcon: React.FC<{ a: Achievement; className?: string }> = ({ a, className }) => {
  const Icon = ICONS[a.icon];
  return <Icon className={className} />;
};

export const AchievementGrid: React.FC<{ p?: Progress }> = () => {
  const p = useProgress();
  const items = ACHIEVEMENTS.map((a) => ({ a, ok: isUnlocked(a, p), v: a.value(p) }));
  const got = items.filter((x) => x.ok).length;
  return (
    <div className="space-y-3">
      <div className="text-[13px] text-stone-500 dark:text-zinc-400">
        已解锁 <span className="font-mono font-semibold text-stone-900 dark:text-zinc-100">{got}</span> / {items.length}
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
        {items.map(({ a, ok, v }) => (
          <div
            key={a.id}
            title={a.desc}
            className={`flex items-center gap-2.5 rounded-lg border px-3 py-2.5 transition ${
              ok ? 'border-amber-300 bg-amber-50/70 dark:border-amber-800 dark:bg-amber-950/25' : 'border-stone-200 dark:border-zinc-800'
            }`}
          >
            <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${ok ? 'bg-amber-400 text-white dark:bg-amber-500' : 'bg-stone-100 text-stone-400 dark:bg-zinc-800 dark:text-zinc-500'}`}>
              {ok ? <AchievementIcon a={a} className="h-4 w-4" /> : <Lock className="h-3.5 w-3.5" />}
            </span>
            <span className="min-w-0">
              <span className={`block truncate text-[13.5px] font-medium ${ok ? 'text-stone-900 dark:text-zinc-100' : 'text-stone-500 dark:text-zinc-400'}`}>{a.title}</span>
              <span className="block truncate text-[11.5px] text-stone-500 dark:text-zinc-400">{ok ? a.desc : `${a.desc} · ${v[0]}/${v[1]}`}</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
