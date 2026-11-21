import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { DerivationSpec } from '../types/curriculum';
import { MathFormula } from './MathFormula';
import { RichText } from './RichText';

interface DerivationChainProps {
  spec: DerivationSpec;
}

export const DerivationChain: React.FC<DerivationChainProps> = ({ spec }) => {
  const [expandedSteps, setExpandedSteps] = useState<Set<number>>(
    () => new Set(spec.steps.map((_, i) => i))
  );
  const [revealedLimit, setRevealedLimit] = useState<number>(spec.steps.length);

  const toggleStep = (idx: number) => {
    setExpandedSteps((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const isSelfTestMode = revealedLimit < spec.steps.length;

  return (
    <article className="rounded-lg border border-stone-200 bg-white dark:border-zinc-800 dark:bg-[#11151d]">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-stone-200 px-5 py-4 dark:border-zinc-800">
        <div className="space-y-1">
          <div className="font-mono text-[11px] font-medium uppercase tracking-wider text-blue-700 dark:text-blue-400">
            Derivation · 零跳步数学推导链
          </div>
          <h3 className="font-serif-display text-lg font-semibold text-stone-900 dark:text-zinc-100 leading-snug">
            <RichText text={spec.title} />
          </h3>
          <p className="text-[13.5px] math-prose text-stone-600 dark:text-zinc-300">
            <RichText text={spec.goal} />
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs shrink-0">
          {isSelfTestMode ? (
            <>
              <button
                onClick={() => {
                  const next = Math.min(spec.steps.length, revealedLimit + 1);
                  setRevealedLimit(next);
                  setExpandedSteps((prev) => new Set([...prev, next - 1]));
                }}
                className="rounded-md bg-stone-900 px-3 py-1.5 font-medium text-white hover:bg-stone-800 dark:bg-blue-600 dark:hover:bg-blue-500 cursor-pointer"
              >
                显示下一步 ({revealedLimit}/{spec.steps.length})
              </button>
              <button
                onClick={() => {
                  setRevealedLimit(spec.steps.length);
                  setExpandedSteps(new Set(spec.steps.map((_, i) => i)));
                }}
                className="rounded-md border border-stone-300 px-2.5 py-1.5 text-stone-700 hover:bg-stone-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800 cursor-pointer"
              >
                全部展开
              </button>
            </>
          ) : (
            <button
              onClick={() => {
                setRevealedLimit(1);
                setExpandedSteps(new Set([0]));
              }}
              className="rounded-md border border-stone-300 px-2.5 py-1.5 text-stone-700 hover:bg-stone-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800 cursor-pointer"
            >
              切换为逐行自测
            </button>
          )}
        </div>
      </div>

      {/* Steps */}
      <div className="divide-y divide-stone-100 dark:divide-zinc-800/80">
        {spec.steps.slice(0, revealedLimit).map((step, idx) => {
          const isOpen = expandedSteps.has(idx);
          return (
            <div key={idx} className="px-5 py-3.5 transition-colors hover:bg-stone-50/70 dark:hover:bg-zinc-900/40">
              <div className="flex items-start gap-3">
                <button
                  onClick={() => toggleStep(idx)}
                  className="mt-1 flex items-center gap-1 rounded border border-stone-200 bg-stone-50 px-2 py-0.5 font-mono text-[11px] font-semibold text-stone-700 hover:border-blue-400 hover:text-blue-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-blue-500 shrink-0 cursor-pointer"
                  title="点击展开或折叠该步推导依据"
                >
                  {isOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                  Step {idx + 1}
                </button>

                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-[11px] font-medium text-blue-700 dark:text-blue-400">
                      [<RichText text={step.rule} />]
                    </span>
                  </div>

                  <div className="overflow-x-auto py-1">
                    <MathFormula latex={step.latex} className="text-sm sm:text-base" />
                  </div>

                  {isOpen && (
                    <p className="border-l-2 border-stone-300 pl-3.5 text-[13px] math-prose text-stone-600 dark:border-zinc-700 dark:text-zinc-300">
                      <RichText text={step.justification} />
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Proof Conclusion */}
      {!isSelfTestMode && (
        <div className="border-t border-stone-200 bg-stone-50/80 px-5 py-3.5 text-[13px] math-prose text-stone-700 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-300">
          <span className="font-mono font-semibold text-stone-900 dark:text-zinc-100 mr-1.5">
            Q.E.D. / 物理含义:
          </span>
          <RichText text={spec.conclusion} />
        </div>
      )}
    </article>
  );
};
