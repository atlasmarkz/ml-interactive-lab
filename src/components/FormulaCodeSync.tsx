import React, { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Code2, Layers, RotateCcw } from 'lucide-react';
import { FormulaCodeSpec, SemanticRole } from '../types/curriculum';
import { MathFormula } from './MathFormula';

const ROLE_STYLES: Record<
  SemanticRole,
  { badge: string; border: string; lineBg: string; dot: string }
> = {
  data: {
    badge: 'bg-blue-50/80 text-blue-800 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-900',
    border: 'border-l-blue-600',
    lineBg: 'bg-blue-500/15',
    dot: 'bg-blue-600',
  },
  param: {
    badge: 'bg-violet-50/80 text-violet-800 border-violet-200 dark:bg-violet-950/50 dark:text-violet-300 dark:border-violet-900',
    border: 'border-l-violet-600',
    lineBg: 'bg-violet-500/15',
    dot: 'bg-violet-600',
  },
  output: {
    badge: 'bg-emerald-50/80 text-emerald-800 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-900',
    border: 'border-l-emerald-600',
    lineBg: 'bg-emerald-500/15',
    dot: 'bg-emerald-600',
  },
  loss: {
    badge: 'bg-red-50/80 text-red-800 border-red-200 dark:bg-red-950/50 dark:text-red-300 dark:border-red-900',
    border: 'border-l-red-600',
    lineBg: 'bg-red-500/15',
    dot: 'bg-red-600',
  },
  hyper: {
    badge: 'bg-amber-50/80 text-amber-800 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-900',
    border: 'border-l-amber-600',
    lineBg: 'bg-amber-500/15',
    dot: 'bg-amber-600',
  },
};

interface FormulaCodeSyncProps {
  spec: FormulaCodeSpec;
}

export const FormulaCodeSync: React.FC<FormulaCodeSyncProps> = ({ spec }) => {
  const [selectedId, setSelectedId] = useState<string | null>(spec.terms[0]?.id ?? null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [framework, setFramework] = useState<'numpy' | 'pytorch'>('numpy');

  const activeId = hoveredId ?? selectedId;
  const activeTerm = useMemo(
    () => spec.terms.find((t) => t.id === activeId) ?? null,
    [spec.terms, activeId]
  );

  const code = framework === 'pytorch' && spec.pytorchCode ? spec.pytorchCode : spec.numpyCode;
  const codeLines = useMemo(() => code.split('\n'), [code]);

  const lineToTerm = useMemo(() => {
    const map = new Map<number, typeof spec.terms[number]>();
    for (const term of spec.terms) {
      const lines = framework === 'pytorch' && term.pytorchLines ? term.pytorchLines : term.numpyLines;
      for (const ln of lines) {
        if (!map.has(ln)) map.set(ln, term);
      }
    }
    return map;
  }, [spec.terms, framework]);

  const activeLines = useMemo(() => {
    if (!activeTerm) return new Set<number>();
    const lines =
      framework === 'pytorch' && activeTerm.pytorchLines
        ? activeTerm.pytorchLines
        : activeTerm.numpyLines;
    return new Set(lines);
  }, [activeTerm, framework]);

  const stepIndex = spec.terms.findIndex((t) => t.id === selectedId);
  const handlePrev = () => {
    if (!spec.terms.length) return;
    setSelectedId(spec.terms[stepIndex <= 0 ? spec.terms.length - 1 : stepIndex - 1].id);
  };
  const handleNext = () => {
    if (!spec.terms.length) return;
    setSelectedId(spec.terms[stepIndex < 0 || stepIndex >= spec.terms.length - 1 ? 0 : stepIndex + 1].id);
  };

  return (
    <div className="rounded-lg border border-stone-200 bg-white overflow-hidden dark:border-zinc-800 dark:bg-[#11151d]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-200 bg-stone-50/70 px-5 py-3 dark:border-zinc-800 dark:bg-zinc-900/60">
        <div>
          <h3 className="text-sm font-semibold text-stone-900 dark:text-zinc-100">{spec.title}</h3>
          <p className="mt-0.5 text-xs text-stone-500 dark:text-zinc-400">{spec.subtitle}</p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-md border border-stone-200 bg-white p-0.5 dark:border-zinc-700 dark:bg-zinc-900">
            <button onClick={handlePrev} className="rounded p-1 text-stone-600 hover:bg-stone-100 dark:text-zinc-300 dark:hover:bg-zinc-800 cursor-pointer">
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            <span className="px-2 font-mono text-[11px] text-stone-600 dark:text-zinc-300">
              {stepIndex >= 0 ? `${stepIndex + 1}/${spec.terms.length}` : `0/${spec.terms.length}`}
            </span>
            <button onClick={handleNext} className="rounded p-1 text-stone-600 hover:bg-stone-100 dark:text-zinc-300 dark:hover:bg-zinc-800 cursor-pointer">
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>

          {spec.pytorchCode && (
            <div className="flex rounded-md border border-stone-200 bg-white p-0.5 text-xs font-medium dark:border-zinc-700 dark:bg-zinc-900">
              <button
                onClick={() => setFramework('numpy')}
                className={`rounded px-2.5 py-0.5 transition cursor-pointer ${
                  framework === 'numpy'
                    ? 'bg-stone-900 text-white dark:bg-blue-600'
                    : 'text-stone-600 dark:text-zinc-400'
                }`}
              >
                NumPy
              </button>
              <button
                onClick={() => setFramework('pytorch')}
                className={`rounded px-2.5 py-0.5 transition cursor-pointer ${
                  framework === 'pytorch'
                    ? 'bg-stone-900 text-white dark:bg-blue-600'
                    : 'text-stone-600 dark:text-zinc-400'
                }`}
              >
                PyTorch
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-stone-200 dark:divide-zinc-800">
        <div className="lg:col-span-6 p-5 flex flex-col justify-between gap-4">
          <div>
            <div className="mb-2 flex items-center justify-between text-[11px] text-stone-400">
              <span className="font-mono uppercase tracking-wider">Formula → Code Sync</span>
              <button
                onClick={() => setSelectedId(null)}
                className="inline-flex items-center gap-1 hover:text-stone-700 dark:hover:text-zinc-200 cursor-pointer"
              >
                <RotateCcw className="h-3 w-3" /> 清除选中
              </button>
            </div>

            <div className="rounded-md border border-stone-200/80 bg-stone-50/70 px-3 py-4 text-center dark:border-zinc-800 dark:bg-zinc-950/70">
              <MathFormula
                latex={spec.latex}
                activeTokenId={activeId}
                onTokenHover={setHoveredId}
                onTokenClick={(id) => setSelectedId(id)}
                className="text-sm sm:text-base"
              />
            </div>

            <div className="mt-3 flex flex-wrap gap-1.5">
              {spec.terms.map((term) => {
                const isActive = activeId === term.id;
                const style = ROLE_STYLES[term.role];
                return (
                  <button
                    key={term.id}
                    onMouseEnter={() => setHoveredId(term.id)}
                    onMouseLeave={() => setHoveredId(null)}
                    onClick={() => setSelectedId(term.id)}
                    className={`inline-flex items-center gap-1.5 rounded border px-2 py-0.5 text-[11px] font-medium transition cursor-pointer ${
                      style.badge
                    } ${isActive ? 'ring-1 ring-blue-600' : 'opacity-85 hover:opacity-100'}`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
                    {term.label}
                  </button>
                );
              })}
            </div>
          </div>

          {activeTerm && (
            <div
              className={`rounded-md border border-stone-200 border-l-3 bg-stone-50/80 p-3.5 dark:border-zinc-800 dark:bg-zinc-950/60 ${ROLE_STYLES[activeTerm.role].border}`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-semibold text-stone-900 dark:text-zinc-100">
                  {activeTerm.label}
                </span>
                <span className="inline-flex items-center gap-1 rounded bg-stone-200/70 px-1.5 py-0.5 font-mono text-[10.5px] text-stone-700 dark:bg-zinc-800 dark:text-zinc-300">
                  <Layers className="h-3 w-3" /> {activeTerm.shape}
                </span>
              </div>
              <p className="mt-1.5 text-xs leading-relaxed text-stone-600 dark:text-zinc-300">
                {activeTerm.explanation}
              </p>
            </div>
          )}
        </div>

        <div className="lg:col-span-6 bg-[#0d1117] text-zinc-100 flex flex-col">
          <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-2 text-[11px] text-zinc-400">
            <span className="inline-flex items-center gap-1.5 font-mono">
              <Code2 className="h-3.5 w-3.5 text-emerald-400" />
              {framework === 'pytorch' ? 'pytorch_reference.py' : 'numpy_reference.py'}
            </span>
            <span>悬停代码行高亮对应符号</span>
          </div>
          <div className="overflow-x-auto py-3 font-mono text-xs leading-6 flex-1">
            {codeLines.map((line, idx) => {
              const lineNum = idx + 1;
              const isHighlighted = activeLines.has(lineNum);
              const mappedTerm = lineToTerm.get(lineNum);
              const activeRole = activeTerm?.role;
              const highlightClass =
                isHighlighted && activeRole
                  ? `${ROLE_STYLES[activeRole].lineBg} border-l-2 ${ROLE_STYLES[activeRole].border}`
                  : 'border-l-2 border-l-transparent hover:bg-zinc-800/60';
              return (
                <div
                  key={lineNum}
                  onMouseEnter={() => mappedTerm && setHoveredId(mappedTerm.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  onClick={() => mappedTerm && setSelectedId(mappedTerm.id)}
                  className={`flex items-start px-3 transition-colors ${
                    mappedTerm ? 'cursor-pointer' : ''
                  } ${highlightClass}`}
                >
                  <span className="mr-3 w-5 shrink-0 select-none text-right text-zinc-600">
                    {lineNum}
                  </span>
                  <pre className="whitespace-pre text-zinc-200">{line || ' '}</pre>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
