import React from 'react';
import { Link } from 'react-router-dom';

export const REVIEW_NAV = [
  { to: '/review', label: '复习总览' },
  { to: '/review/flashcards', label: '抽认卡' },
  { to: '/review/quiz', label: '练习与错题' },
  { to: '/review/formulas', label: '公式速查' },
  { to: '/review/assignments', label: '作业 ↔ 讲次' },
];

export const PageHeader: React.FC<{ kicker: string; title: string; description: string; children?: React.ReactNode }> = ({
  kicker,
  title,
  description,
  children,
}) => (
  <header className="border-b border-stone-200 pb-6 dark:border-zinc-800 space-y-3">
    <nav className="flex flex-wrap gap-1.5 font-mono text-[12px]">
      {REVIEW_NAV.map((n) => (
        <Link
          key={n.to}
          to={n.to}
          className="rounded border border-stone-200 bg-white px-2 py-0.5 text-stone-600 hover:border-blue-500 hover:text-blue-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:text-blue-400"
        >
          {n.label}
        </Link>
      ))}
    </nav>
    <div className="font-mono text-[13px] font-medium uppercase tracking-widest text-blue-700 dark:text-blue-400">{kicker}</div>
    <h1 className="font-serif-display text-[2.2rem] font-semibold tracking-tight text-stone-950 dark:text-zinc-50">{title}</h1>
    <p className="max-w-2xl text-[15.5px] leading-relaxed text-stone-600 dark:text-zinc-400">{description}</p>
    {children}
  </header>
);
