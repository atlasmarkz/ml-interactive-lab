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

export const Layout: React.FC<LayoutProps> = ({ isDark, onToggleDark, children }) => {
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const navContent = (
    <div className="flex h-full flex-col">
      {/* Brand */}
      <Link
        to="/"
        onClick={() => setDrawerOpen(false)}
        className="flex items-center gap-2.5 border-b border-slate-200/80 px-5 py-4 dark:border-slate-800"
      >
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-violet-600 text-white shadow-sm">
          <Sparkles className="h-5 w-5" />
        </div>
        <div>
          <div className="text-sm font-bold tracking-tight text-slate-900 dark:text-white">
            ML Interactive Lab
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400">
            交互式机器学习原理实验室
          </div>
        </div>
      </Link>

      {/* Links */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        <Link
          to="/"
          onClick={() => setDrawerOpen(false)}
          className={`flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition ${
            location.pathname === '/'
              ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
              : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800/70'
          }`}
        >
          <Home className="h-4 w-4" />
          课程全景路线图
        </Link>

        <div className="px-3 pt-4 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
          核心模块 · Part 0 – Part 5
        </div>

        {CURRICULUM.map((part) => {
          const to = `/part/${part.slug}`;
          const active = location.pathname === to;
          return (
            <Link
              key={part.id}
              to={to}
              onClick={() => setDrawerOpen(false)}
              className={`group flex items-start gap-2.5 rounded-xl px-3 py-2.5 transition ${
                active
                  ? 'bg-slate-900 text-white shadow-sm dark:bg-blue-600'
                  : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800/70'
              }`}
            >
              <span
                className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md font-mono text-[11px] font-bold ${
                  active
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-200/80 text-slate-600 group-hover:bg-slate-300/70 dark:bg-slate-800 dark:text-slate-300'
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
      <div className="border-t border-slate-200/80 p-4 text-[11px] dark:border-slate-800 space-y-2">
        <div className="font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
          <BookOpen className="h-3.5 w-3.5" /> 全站统一语义色标
        </div>
        <div className="flex flex-wrap gap-1.5">
          <span className="inline-flex items-center gap-1 rounded bg-blue-50 px-1.5 py-0.5 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-500" /> 数据/输入
          </span>
          <span className="inline-flex items-center gap-1 rounded bg-violet-50 px-1.5 py-0.5 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300">
            <span className="h-1.5 w-1.5 rounded-full bg-violet-500" /> 参数/权重
          </span>
          <span className="inline-flex items-center gap-1 rounded bg-emerald-50 px-1.5 py-0.5 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> 输出/预测
          </span>
          <span className="inline-flex items-center gap-1 rounded bg-rose-50 px-1.5 py-0.5 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-500" /> 损失/梯度
          </span>
          <span className="inline-flex items-center gap-1 rounded bg-amber-50 px-1.5 py-0.5 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" /> 超参数
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-72 shrink-0 border-r border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900 sticky top-0 h-screen">
        {navContent}
      </aside>

      {/* Mobile Drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div className="w-72 bg-white dark:bg-slate-900 h-full shadow-2xl border-r border-slate-200 dark:border-slate-800">
            {navContent}
          </div>
          <div
            className="flex-1 bg-slate-950/50 backdrop-blur-xs"
            onClick={() => setDrawerOpen(false)}
          />
        </div>
      )}

      {/* Main Column */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top Utility Header */}
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200/80 bg-white/85 px-4 sm:px-8 py-3 backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/80">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setDrawerOpen((o) => !o)}
              className="lg:hidden rounded-lg border border-slate-200 p-1.5 text-slate-600 dark:border-slate-700 dark:text-slate-300"
              aria-label="Toggle Menu"
            >
              {drawerOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400 hidden sm:block">
              Interactive Visual Textbook · 动态图表 × 公式代码联动 × 浏览器 Python 沙盒
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="https://github.com/atlasmarkz/ml-interactive-lab"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <Github className="h-3.5 w-3.5" />
              GitHub
            </a>
            <button
              onClick={onToggleDark}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 cursor-pointer"
              aria-label="Toggle Theme"
            >
              {isDark ? <Sun className="h-3.5 w-3.5 text-amber-400" /> : <Moon className="h-3.5 w-3.5" />}
              {isDark ? '浅色' : '深色'}
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
