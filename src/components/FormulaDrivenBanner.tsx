import React from 'react';
import { Power, Sparkles } from 'lucide-react';
import { MathFormula } from './MathFormula';
import { SemanticRole } from '../types/curriculum';

export interface LiveFormulaTerm {
  id: string;
  symbol: string;
  role: SemanticRole;
  liveValue: string;
  roleDesc: string;
  enabled?: boolean;
  onToggle?: () => void;
}

const ROLE_RING: Record<SemanticRole, string> = {
  data: 'border-blue-500/40 bg-blue-500/10 text-blue-700 dark:text-blue-300',
  param: 'border-violet-500/40 bg-violet-500/10 text-violet-700 dark:text-violet-300',
  output: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
  loss: 'border-rose-500/40 bg-rose-500/10 text-rose-700 dark:text-rose-300',
  hyper: 'border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300',
};

interface FormulaDrivenBannerProps {
  latex: string;
  terms: LiveFormulaTerm[];
  activeTermId: string | null;
  onSelectTerm: (id: string | null) => void;
}

export const FormulaDrivenBanner: React.FC<FormulaDrivenBannerProps> = ({
  latex,
  terms,
  activeTermId,
  onSelectTerm,
}) => {
  const activeTerm = terms.find((t) => t.id === activeTermId) ?? terms[0] ?? null;

  return (
    <div className="rounded-xl border border-slate-200/80 bg-gradient-to-br from-slate-50 via-white to-blue-50/40 p-4 dark:border-slate-700/80 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950/30 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
        <span className="inline-flex items-center gap-1.5 font-semibold text-blue-700 dark:text-blue-300">
          <Sparkles className="h-3.5 w-3.5" />
          核心公式驱动中控台 · 点击彩色项或开关消融按钮，实时观察它在模型中的作用
        </span>
      </div>

      {/* Live Interactive Formula */}
      <div className="rounded-xl border border-slate-200/70 bg-white/90 px-4 py-3 text-center shadow-xs dark:border-slate-800 dark:bg-slate-950/80">
        <MathFormula
          latex={latex}
          activeTokenId={activeTerm?.id ?? null}
          onTokenHover={(id) => id && onSelectTerm(id)}
          onTokenClick={(id) => onSelectTerm(id)}
          className="text-base sm:text-lg"
        />
      </div>

      {/* Term Cards with Live Values & Ablation Toggles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
        {terms.map((t) => {
          const isSelected = activeTerm?.id === t.id;
          const isOff = t.enabled === false;
          return (
            <div
              key={t.id}
              onMouseEnter={() => onSelectTerm(t.id)}
              onClick={() => onSelectTerm(t.id)}
              className={`rounded-xl border p-2.5 transition cursor-pointer ${
                isOff
                  ? 'border-dashed border-slate-300 bg-slate-100/60 opacity-60 dark:border-slate-700 dark:bg-slate-900/50'
                  : ROLE_RING[t.role]
              } ${isSelected ? 'ring-2 ring-blue-500/60 shadow-xs scale-[1.01]' : ''}`}
            >
              <div className="flex items-center justify-between gap-1.5">
                <span className="text-xs font-bold truncate">{t.symbol}</span>
                {t.onToggle && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      t.onToggle?.();
                    }}
                    title={isOff ? '重新启用该公式项' : '关闭该项进行消融实验'}
                    className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-bold transition cursor-pointer ${
                      isOff
                        ? 'bg-rose-600 text-white hover:bg-rose-500'
                        : 'bg-slate-900/80 text-white hover:bg-slate-800 dark:bg-white/15 dark:hover:bg-white/25'
                    }`}
                  >
                    <Power className="h-2.5 w-2.5" />
                    {isOff ? '已消融' : 'ON'}
                  </button>
                )}
              </div>
              <div className="mt-1 font-mono text-xs font-semibold opacity-95">
                {t.liveValue}
              </div>
            </div>
          );
        })}
      </div>

      {/* Active Role Callout */}
      {activeTerm && (
        <div className="rounded-lg bg-slate-900/5 px-3 py-2 text-xs leading-relaxed text-slate-700 dark:bg-white/5 dark:text-slate-300">
          <strong className="text-slate-900 dark:text-white">【{activeTerm.symbol} 的作用】</strong>
          {activeTerm.roleDesc}
        </div>
      )}
    </div>
  );
};
