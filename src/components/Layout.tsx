import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  BookOpen,
  Github,
  Home,
  Menu,
  Moon,
  Sparkles,
  Sun,
  X,
} from 'lucide-react';
import { CURRICULUM } from '../data/curriculum';

interface LayoutProps {
  isDark: boolean;
  onToggleDark: () => void;
  children: React.ReactNode;
}

const PART_BADGE_GRADIENT: Record<number, string> = {
  0: 'from-blue-500 to-cyan-500',
  1: 'from-emerald-500 to-teal-500',
  2: 'from-violet-500 to-purple-500',
  3: 'from-sky-500 to-indigo-500',
  4: 'from-rose-500 to-pink-500',
  5: 'from-amber-500 to-orange-500',
};

export const Layout: React.FC<LayoutProps> = ({ isDark, onToggleDark, children }) => {
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const navContent = (
    <div className="flex h-full flex-col">
      {/* Brand */}
      <Link
        to="/"
        onClick={() => setDrawerOpen(false)}
        className="flex items-center gap-3 border-b border-slate-200/80 px-5 py-4.5 dark:border-slate-800/80"
      >
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-500/20">
          <Sparkles className="h-5 w-5" />
        </div>
        <div>
          <div className="text-sm font-extrabold tracking-tight text-slate-900 dark:text-white">
            ML Interactive Lab
          </div>
          <div className="text-[10.5px] font-medium text-slate-500 dark:text-slate-400">
            3D 高维可视化 × 公式驱动演播室
          </div>
        </div>
      </Link>

      {/* Links */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        <Link
          to="/"
          onClick={() => setDrawerOpen(false)}
          className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-xs font-semibold transition ${
            location.pathname === '/'
              ? 'bg-gradient-to-r from-blue-600/10 to-violet-600/10 text-blue-700 ring-1 ring-blue-500/25 dark:from-blue-500/20 dark:to-violet-500/20 dark:text-blue-300'
              : 'text-slate-600 hover:bg-slate-100/90 dark:text-slate-300 dark:hover:bg-slate-800/70'
          }`}
        >
          <Home className="h-4 w-4" />
          课程全景路线图
        </Link>

        <div className="px-3 pt-4 pb-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">
          知识演播室 · Part 0 – 5
        </div>

        {CURRICULUM.map((part) => {
          const to = `/part/${part.slug}`;
          const active = location.pathname === to;
          const grad = PART_BADGE_GRADIENT[part.partNumber] ?? PART_BADGE_GRADIENT[0];
          return (
            <Link
              key={part.id}
              to={to}
              onClick={() => setDrawerOpen(false)}
              className={`group flex items-start gap-2.5 rounded-xl px-3 py-2.5 transition-all ${
                active
                  ? 'bg-slate-900 text-white shadow-md shadow-slate-900/15 dark:bg-gradient-to-r dark:from-blue-600/90 dark:to-indigo-600/90 dark:shadow-blue-900/30'
                  : 'text-slate-700 hover:bg-slate-100/80 dark:text-slate-300 dark:hover:bg-slate-800/60'
              }`}
            >
              <span
                className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md font-mono text-[11px] font-bold ${
                  active
                    ? 'bg-white/20 text-white'
                    : `bg-gradient-to-br ${grad} text-white opacity-85 group-hover:opacity-100`
                }`}
              >
                {part.partNumber}
              </span>
              <div className="min-w-0">
                <div className="truncate text-xs font-semibold leading-snug">{part.titleZh}</div>
                <div
                  className={`truncate text-[10px] mt-0.5 ${
                    active ? 'text-slate-300 dark:text-blue-100' : 'text-slate-400'
                  }`}
                >
                  {part.titleEn}
                </div>
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Semantic Legend Footer */}
      <div className="border-t border-slate-200/80 bg-slate-50/70 p-4 text-[11px] dark:border-slate-800/80 dark:bg-slate-950/50 space-y-2">
        <div className="font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
          <BookOpen className="h-3.5 w-3.5" /> 全站公式统一色标
        </div>
        <div className="flex flex-wrap gap-1.5">
          <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-1.5 py-0.5 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-500" /> 数据
          </span>
          <span className="inline-flex items-center gap-1 rounded-md bg-violet-50 px-1.5 py-0.5 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300">
            <span className="h-1.5 w-1.5 rounded-full bg-violet-500" /> 参数
          </span>
          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-1.5 py-0.5 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> 输出
          </span>
          <span className="inline-flex items-center gap-1 rounded-md bg-rose-50 px-1.5 py-0.5 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-500" /> 损失/梯度
          </span>
          <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-1.5 py-0.5 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" /> 超参数
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-slate-50/90 bg-scientific-grid text-slate-900 dark:bg-[#060913] dark:text-slate-100">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-72 shrink-0 border-r border-slate-200/80 bg-white/90 backdrop-blur-xl dark:border-slate-800/80 dark:bg-[#0b101d]/95 sticky top-0 h-screen">
        {navContent}
      </aside>

      {/* Mobile Drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div className="w-72 bg-white dark:bg-[#0b101d] h-full shadow-2xl border-r border-slate-200 dark:border-slate-800">
            {navContent}
          </div>
          <div
            className="flex-1 bg-slate-950/60 backdrop-blur-xs"
            onClick={() => setDrawerOpen(false)}
          />
        </div>
      )}

      {/* Main Column */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top Utility Header */}
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200/80 bg-white/80 px-4 sm:px-8 py-3 backdrop-blur-xl dark:border-slate-800/80 dark:bg-[#060913]/80">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setDrawerOpen((o) => !o)}
              className="lg:hidden rounded-lg border border-slate-200 p-1.5 text-slate-600 dark:border-slate-700 dark:text-slate-300"
              aria-label="Toggle Menu"
            >
              {drawerOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <div className="hidden sm:flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
              <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              v3.0 科研级视觉演播室 · 公式消融联动 × 3D 高维空间 × Pyodide 在线运行
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="https://github.com/atlasmarkz/ml-interactive-lab"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white/90 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition dark:border-slate-800 dark:bg-slate-900/90 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <Github className="h-3.5 w-3.5" />
              GitHub
            </a>
            <button
              onClick={onToggleDark}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white/90 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition dark:border-slate-800 dark:bg-slate-900/90 dark:text-slate-200 dark:hover:bg-slate-800 cursor-pointer"
              aria-label="Toggle Theme"
            >
              {isDark ? <Sun className="h-3.5 w-3.5 text-amber-400" /> : <Moon className="h-3.5 w-3.5 text-indigo-500" />}
              {isDark ? '浅色纸感' : '深邃天文台'}
            </button>
          </div>
        </header>

        {/* Page Body */}
        <main className="flex-1 px-4 sm:px-8 lg:px-10 py-8 max-w-6xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
