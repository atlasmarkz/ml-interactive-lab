import React, { useEffect, useRef, useState } from 'react';
import { PartyPopper, X } from 'lucide-react';
import { getProgress, subscribe, todayCount } from '../../utils/progress';
import { ACHIEVEMENTS, unlockedIds } from '../../utils/achievements';
import { AchievementIcon } from './Gamify';

interface Toast {
  id: number;
  title: string;
  body: string;
  achievementId?: string;
}

const COLORS = ['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4', '#6250d6'];

/** Lightweight confetti burst on a full-screen canvas (no dependencies). */
function burst(canvas: HTMLCanvasElement) {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const dpr = window.devicePixelRatio || 1;
  canvas.width = window.innerWidth * dpr;
  canvas.height = window.innerHeight * dpr;
  ctx.scale(dpr, dpr);
  const parts = Array.from({ length: 140 }, () => ({
    x: window.innerWidth / 2 + (Math.random() - 0.5) * 200,
    y: window.innerHeight * 0.35,
    vx: (Math.random() - 0.5) * 12,
    vy: -Math.random() * 11 - 4,
    w: 5 + Math.random() * 5,
    h: 8 + Math.random() * 6,
    r: Math.random() * Math.PI,
    vr: (Math.random() - 0.5) * 0.3,
    c: COLORS[Math.floor(Math.random() * COLORS.length)],
  }));
  const t0 = performance.now();
  const frame = (now: number) => {
    const t = now - t0;
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    for (const p of parts) {
      p.vy += 0.32;
      p.vx *= 0.99;
      p.x += p.vx;
      p.y += p.vy;
      p.r += p.vr;
      ctx.save();
      ctx.globalAlpha = Math.max(0, 1 - t / 2600);
      ctx.translate(p.x, p.y);
      ctx.rotate(p.r);
      ctx.fillStyle = p.c;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
    }
    if (t < 2600) requestAnimationFrame(frame);
    else ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
  };
  requestAnimationFrame(frame);
}

export const Celebrations: React.FC = () => {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const prev = useRef({ count: todayCount(getProgress()), goal: getProgress().goal, unlocked: unlockedIds(getProgress()) });

  useEffect(
    () =>
      subscribe(() => {
        const p = getProgress();
        const count = todayCount(p);
        const unlocked = unlockedIds(p);
        const news: Toast[] = [];
        if (prev.current.count < p.goal && count >= p.goal && p.goal === prev.current.goal) {
          news.push({ id: Date.now(), title: '今日目标达成！', body: `今天已经复习 ${count} 次，热力图上又多了一个深绿色格子。` });
        }
        for (const a of ACHIEVEMENTS) {
          if (unlocked.has(a.id) && !prev.current.unlocked.has(a.id)) {
            news.push({ id: Date.now() + Math.random(), title: `解锁成就 · ${a.title}`, body: a.desc, achievementId: a.id });
          }
        }
        prev.current = { count, goal: p.goal, unlocked };
        if (news.length) {
          if (canvas.current) burst(canvas.current);
          setToasts((ts) => [...ts, ...news].slice(-3));
          news.forEach((n) => window.setTimeout(() => setToasts((ts) => ts.filter((x) => x.id !== n.id)), 5000));
        }
      }),
    []
  );

  return (
    <>
      <canvas ref={canvas} className="pointer-events-none fixed inset-0 z-[60] h-full w-full" aria-hidden />
      <div className="fixed bottom-5 right-5 z-[61] space-y-2" role="status" aria-live="polite">
        {toasts.map((t) => {
          const a = ACHIEVEMENTS.find((x) => x.id === t.achievementId);
          return (
            <div key={t.id} className="flex w-80 items-start gap-3 rounded-xl border border-amber-300 bg-white p-3.5 shadow-lg dark:border-amber-800 dark:bg-zinc-900">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-400 text-white">
                {a ? <AchievementIcon a={a} className="h-4 w-4" /> : <PartyPopper className="h-4 w-4" />}
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-[14px] font-semibold text-stone-900 dark:text-zinc-100">{t.title}</div>
                <div className="mt-0.5 text-[12.5px] text-stone-600 dark:text-zinc-400">{t.body}</div>
              </div>
              <button onClick={() => setToasts((ts) => ts.filter((x) => x.id !== t.id))} aria-label="关闭" className="text-stone-400 hover:text-stone-700 cursor-pointer">
                <X className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
    </>
  );
};
