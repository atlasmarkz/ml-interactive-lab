import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { BookOpen, Github, Menu, Moon, Sun, X } from 'lucide-react';
import { LECTURES, LECTURE_GROUPS } from '../data/lectures';

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
      {/* Editorial Monograph Masthead */}
      <Link
        to="/"
        onClick={() => setDrawerOpen(false)}
        className="flex items-center gap-2.5 border-b border-stone-200 px-5 py-4 dark:border-zinc-800"
      >
        <BookOpen className="h-4 w-4 text-blue-700 dark:text-blue-400 shrink-0" />
        <div>
          <div className="font-serif-display text-base font-semibold tracking-tight text-stone-900 dark:text-zinc-100 leading-tight">
            ML Study Monograph
          </div>
          <div className="font-mono text-[10px] text-stone-500 dark:text-zinc-500">
            Derivations · Verifiers · Code
          </div>
        </div>
      </Link>

      {/* Lecture Tree */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        <div>
          <Link
            to="/"
            onClick={() => setDrawerOpen(false)}
            className={`block rounded-md px-3 py-1.5 text-xs font-medium transition ${
              location.pathname === '/'
                ? 'bg-stone-200/70 text-stone-950 font-semibold dark:bg-zinc-800 dark:text-white'
                : 'text-stone-600 hover:bg-stone-100 dark:text-zinc-400 dark:hover:bg-zinc-900'
            }`}
          >
            课程总览与目录索引 (Index)
          </Link>
        </div>

        {LECTURE_GROUPS.map((group) => {
          const items = LECTURES.filter((l) => l.partGroup === group);
          return (
            <div key={group} className="space-y-1">
              <div className="px-3 text-[10px] font-mono font-semibold uppercase tracking-wider text-stone-400 dark:text-zinc-500">
                {group}
              </div>
              {items.map((lec) => {
                const to = `/lecture/${lec.slug}`;
                const active = location.pathname === to;
                return (
                  <Link
                    key={lec.id}
                    to={to}
                    onClick={() => setDrawerOpen(false)}
                    className={`flex items-baseline gap-2.5 rounded-md px-3 py-1.5 text-xs transition ${
                      active
                        ? 'bg-blue-50 text-blue-800 font-semibold border-l-2 border-blue-700 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-400'
                        : 'text-stone-700 hover:bg-stone-100/90 dark:text-zinc-300 dark:hover:bg-zinc-900'
                    }`}
                  >
                    <span className="font-mono text-[11px] font-semibold text-stone-400 dark:text-zinc-500 w-9 shrink-0">
                      {lec.code}
                    </span>
                    <span className="truncate">{lec.titleZh}</span>
                  </Link>
                );
              })}
            </div>
          );
        })}
      </nav>

      {/* Subtle Footer */}
      <div className="border-t border-stone-200 px-5 py-3 text-[11px] text-stone-500 dark:border-zinc-800 dark:text-zinc-500">
        12 Lectures · 16 Zero-Skip Proofs · 12 Numerical Verifiers
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-[#fcfcfa] text-stone-900 dark:bg-[#0b0e14] dark:text-zinc-100">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-72 shrink-0 border-r border-stone-200 bg-white dark:border-zinc-800 dark:bg-[#0e121a] sticky top-0 h-screen">
        {navContent}
      </aside>

      {/* Mobile Drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div className="w-72 bg-white dark:bg-[#0e121a] h-full shadow-xl border-r border-stone-200 dark:border-zinc-800">
            {navContent}
          </div>
          <div
            className="flex-1 bg-black/40"
            onClick={() => setDrawerOpen(false)}
          />
        </div>
      )}

      {/* Main Column */}
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-stone-200 bg-[#fcfcfa]/90 px-4 sm:px-8 py-2.5 backdrop-blur-md dark:border-zinc-800 dark:bg-[#0b0e14]/90">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setDrawerOpen((o) => !o)}
              className="lg:hidden rounded border border-stone-300 p-1.5 text-stone-600 dark:border-zinc-700 dark:text-zinc-300"
              aria-label="Toggle Menu"
            >
              {drawerOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
            <span className="hidden sm:inline font-mono text-[11px] text-stone-500 dark:text-zinc-400">
              Machine Learning Interactive Study Companion · L01 – L11
            </span>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="https://github.com/atlasmarkz/ml-interactive-lab"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-md border border-stone-200 bg-white px-2.5 py-1 text-xs text-stone-600 hover:bg-stone-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              <Github className="h-3.5 w-3.5" />
              Source
            </a>
            <button
              onClick={onToggleDark}
              className="inline-flex items-center gap-1.5 rounded-md border border-stone-200 bg-white px-2.5 py-1 text-xs text-stone-700 hover:bg-stone-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800 cursor-pointer"
            >
              {isDark ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
              {isDark ? 'Light' : 'Dark'}
            </button>
          </div>
        </header>

        <main className="flex-1 px-4 sm:px-8 lg:px-12 py-8 sm:py-10 max-w-4xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
