import React, { useEffect, useState } from 'react';
import { AlertTriangle, Info, Lightbulb } from 'lucide-react';

/** Thin reading-progress bar pinned to the top of the viewport. */
export const ReadingProgress: React.FC = () => {
  const [p, setP] = useState(0);
  useEffect(() => {
    const on = () => {
      const h = document.documentElement.scrollHeight - window.innerHeight;
      setP(h > 0 ? Math.min(1, window.scrollY / h) : 0);
    };
    on();
    window.addEventListener('scroll', on, { passive: true });
    window.addEventListener('resize', on);
    return () => {
      window.removeEventListener('scroll', on);
      window.removeEventListener('resize', on);
    };
  }, []);
  return (
    <div className="no-print fixed inset-x-0 top-0 z-50 h-[3px] bg-transparent" aria-hidden>
      <div className="h-full bg-blue-600 transition-[width] duration-150 dark:bg-blue-500" style={{ width: `${p * 100}%` }} />
    </div>
  );
};

/** Returns the id of the section currently in view (scroll-spy). */
export function useScrollSpy(ids: string[]): string | null {
  const [active, setActive] = useState<string | null>(ids[0] ?? null);
  const key = ids.join('|');
  useEffect(() => {
    const els = ids.map((id) => document.getElementById(id)).filter((e): e is HTMLElement => !!e);
    if (!els.length) return;
    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: '-80px 0px -65% 0px', threshold: 0 }
    );
    els.forEach((e) => obs.observe(e));
    return () => obs.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return active;
}

export const SectionHead: React.FC<{ n: number; kicker: string; title: string; lead?: React.ReactNode }> = ({ n, kicker, title, lead }) => (
  <header className="mb-6 space-y-1.5">
    <div className="section-kicker text-blue-700 dark:text-blue-400">
      §{n} · {kicker}
    </div>
    <h2 className="font-serif-display text-[1.7rem] font-semibold leading-tight tracking-tight text-stone-950 dark:text-zinc-50">{title}</h2>
    {lead && <p className="text-[15px] leading-relaxed text-stone-500 dark:text-zinc-400">{lead}</p>}
  </header>
);

const CALLOUT = {
  key: { icon: Lightbulb, cls: 'border-blue-200 bg-blue-50/60 dark:border-blue-900/70 dark:bg-blue-950/25', icon_cls: 'text-blue-700 dark:text-blue-400' },
  warn: { icon: AlertTriangle, cls: 'border-amber-200 bg-amber-50/60 dark:border-amber-900/70 dark:bg-amber-950/20', icon_cls: 'text-amber-700 dark:text-amber-400' },
  note: { icon: Info, cls: 'border-stone-200 bg-stone-50 dark:border-zinc-800 dark:bg-zinc-900/50', icon_cls: 'text-stone-500 dark:text-zinc-400' },
} as const;

export const Callout: React.FC<{ kind: keyof typeof CALLOUT; title: React.ReactNode; children?: React.ReactNode }> = ({ kind, title, children }) => {
  const C = CALLOUT[kind];
  const Icon = C.icon;
  return (
    <div className={`rounded-xl border px-5 py-4 ${C.cls}`}>
      <div className="flex items-start gap-2.5">
        <Icon className={`mt-1 h-4 w-4 shrink-0 ${C.icon_cls}`} />
        <div className="min-w-0 flex-1">
          <div className="text-[16px] font-semibold leading-snug text-stone-900 dark:text-zinc-100">{title}</div>
          {children && <div className="mt-1.5 prose-zh text-[15.5px] text-stone-700 dark:text-zinc-300">{children}</div>}
        </div>
      </div>
    </div>
  );
};
