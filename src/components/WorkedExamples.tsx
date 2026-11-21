import React, { useState } from 'react';
import { Calculator, ChevronRight, Eye, EyeOff, Sparkles } from 'lucide-react';
import { WorkedExample } from '../types/curriculum';
import { MathFormula } from './MathFormula';

interface WorkedExamplesProps {
  examples: WorkedExample[];
}

const WorkedExampleCard: React.FC<{ ex: WorkedExample }> = ({ ex }) => {
  const [revealedCount, setRevealedCount] = useState(1);
  const allRevealed = revealedCount >= ex.steps.length;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-slate-50/80 px-5 py-3.5 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap items-center gap-2">
          <Calculator className="h-4 w-4 text-rose-600 dark:text-rose-400" />
          <span className="rounded-md bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-700 dark:bg-rose-950 dark:text-rose-300">
            {ex.tag}
          </span>
          <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">{ex.title}</h4>
        </div>

        <div className="flex items-center gap-2 text-xs">
          {!allRevealed ? (
            <>
              <button
                onClick={() => setRevealedCount((c) => Math.min(ex.steps.length, c + 1))}
                className="inline-flex items-center gap-1 rounded-lg bg-slate-900 px-3 py-1 font-semibold text-white hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-500 cursor-pointer"
              >
                下一步推导 ({revealedCount}/{ex.steps.length})
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setRevealedCount(ex.steps.length)}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 cursor-pointer"
              >
                <Eye className="h-3.5 w-3.5" /> 全部展开
              </button>
            </>
          ) : (
            <button
              onClick={() => setRevealedCount(0)}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 cursor-pointer"
            >
              <EyeOff className="h-3.5 w-3.5" /> 收起自测
            </button>
          )}
        </div>
      </div>

      <div className="p-5 space-y-4">
        {/* Problem Statement */}
        <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-950/60 space-y-2">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            题目设定（全新原创数值 · 对标作业与期末手算题型）
          </div>
          <p className="text-xs sm:text-sm leading-relaxed text-slate-800 dark:text-slate-200">
            {ex.problem}
          </p>
          {ex.problemLatex && (
            <div className="pt-1">
              <MathFormula latex={ex.problemLatex} className="text-sm" />
            </div>
          )}
        </div>

        {/* Progressive Steps */}
        {revealedCount > 0 ? (
          <div className="space-y-3">
            {ex.steps.slice(0, revealedCount).map((st, idx) => (
              <div
                key={idx}
                className="rounded-xl border border-slate-200/80 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/80 space-y-2"
              >
                <div className="flex items-center gap-2 text-xs font-bold text-blue-700 dark:text-blue-400">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 font-mono text-[10px] dark:bg-blue-950">
                    {idx + 1}
                  </span>
                  {st.title}
                </div>
                <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                  {st.explanation}
                </p>
                {st.latex && (
                  <div className="rounded-lg bg-slate-50 px-3 py-1.5 dark:bg-slate-950/70">
                    <MathFormula latex={st.latex} className="text-sm" />
                  </div>
                )}
              </div>
            ))}

            {allRevealed && (
              <div className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50/60 p-3.5 text-xs text-emerald-900 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-200">
                <Sparkles className="h-4 w-4 shrink-0 mt-0.5 text-emerald-600" />
                <div>
                  <strong>考场秒杀结论：</strong>
                  {ex.keyTakeaway}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-slate-300 p-4 text-center text-xs text-slate-400 dark:border-slate-700">
            先自己动笔推一步，再点击右上角「下一步推导」逐行核对答案！
          </div>
        )}
      </div>
    </div>
  );
};

export const WorkedExamples: React.FC<WorkedExamplesProps> = ({ examples }) => {
  if (!examples.length) return null;
  return (
    <div className="space-y-4">
      {examples.map((ex) => (
        <WorkedExampleCard key={ex.id} ex={ex} />
      ))}
    </div>
  );
};
