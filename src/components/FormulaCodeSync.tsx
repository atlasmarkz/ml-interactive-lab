import React, { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Code2, Layers, RotateCcw, Sparkles } from 'lucide-react';
import { FormulaCodeSpec, SemanticRole } from '../types/curriculum';
import { MathFormula } from './MathFormula';

const ROLE_STYLES: Record<
  SemanticRole,
  {
    badge: string;
    border: string;
    lineBg: string;
    dot: string;
    label: string;
  }
> = {
  data: {
    badge: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800',
    border: 'border-l-blue-500',
    lineBg: 'bg-blue-500/12 dark:bg-blue-500/20',
    dot: 'bg-blue-500',
    label: '输入 / 数据',
  },
  param: {
    badge: 'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/60 dark:text-violet-300 dark:border-violet-800',
    border: 'border-l-violet-500',
    lineBg: 'bg-violet-500/12 dark:bg-violet-500/20',
    dot: 'bg-violet-500',
    label: '参数 / 权重',
  },
  output: {
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800',
    border: 'border-l-emerald-500',
    lineBg: 'bg-emerald-500/12 dark:bg-emerald-500/20',
    dot: 'bg-emerald-500',
    label: '输出 / 特征',
  },
  loss: {
    badge: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800',
    border: 'border-l-rose-500',
    lineBg: 'bg-rose-500/12 dark:bg-rose-500/20',
    dot: 'bg-rose-500',
    label: '损失 / 梯度',
  },
  hyper: {
    badge: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800',
    border: 'border-l-amber-500',
    lineBg: 'bg-amber-500/12 dark:bg-amber-500/20',
    dot: 'bg-amber-500',
    label: '超参数 / 调节项',
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

  // Map 1-indexed line number -> associated term
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
    const prev = stepIndex <= 0 ? spec.terms.length - 1 : stepIndex - 1;
    setSelectedId(spec.terms[prev].id);
  };
  const handleNext = () => {
    if (!spec.terms.length) return;
    const next = stepIndex < 0 || stepIndex >= spec.terms.length - 1 ? 0 : stepIndex + 1;
    setSelectedId(spec.terms[next].id);
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden dark:border-slate-800 dark:bg-slate-900">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 bg-slate-50/70 px-5 py-3.5 dark:border-slate-800 dark:bg-slate-900/80">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              {spec.title}
            </h3>
          </div>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{spec.subtitle}</p>
        </div>

        <div className="flex items-center gap-2">
          {/* Stepper */}
          <div className="flex items-center rounded-lg border border-slate-200 bg-white p-0.5 dark:border-slate-700 dark:bg-slate-800">
            <button
              onClick={handlePrev}
              title="上一步公式项"
              className="rounded-md p-1 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="px-2 text-xs font-medium tabular-nums text-slate-600 dark:text-slate-300">
              {stepIndex >= 0 ? `${stepIndex + 1} / ${spec.terms.length}` : `0 / ${spec.terms.length}`}
            </span>
            <button
              onClick={handleNext}
              title="下一步公式项"
              className="rounded-md p-1 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {spec.pytorchCode && (
            <div className="flex rounded-lg border border-slate-200 bg-white p-0.5 text-xs font-medium dark:border-slate-700 dark:bg-slate-800">
              <button
                onClick={() => setFramework('numpy')}
                className={`rounded-md px-2.5 py-1 transition ${
                  framework === 'numpy'
                    ? 'bg-slate-900 text-white dark:bg-blue-600'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                NumPy
              </button>
              <button
                onClick={() => setFramework('pytorch')}
                className={`rounded-md px-2.5 py-1 transition ${
                  framework === 'pytorch'
                    ? 'bg-slate-900 text-white dark:bg-blue-600'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                PyTorch
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-200/80 dark:divide-slate-800">
        {/* Left: Interactive Math Formula + Term Pills + Inspector */}
        <div className="lg:col-span-6 p-5 flex flex-col justify-between gap-4">
          <div>
            <div className="mb-2 flex items-center justify-between text-[11px] font-medium uppercase tracking-wider text-slate-400">
              <span>数学公式（悬停或点击彩色区块联动代码）</span>
              <button
                onClick={() => setSelectedId(null)}
                className="inline-flex items-center gap-1 normal-case text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <RotateCcw className="h-3 w-3" /> 清除选中
              </button>
            </div>

            <div className="rounded-xl border border-slate-200/70 bg-slate-50/70 px-4 py-5 text-center dark:border-slate-800 dark:bg-slate-950/60">
              <MathFormula
                latex={spec.latex}
                activeTokenId={activeId}
                onTokenHover={setHoveredId}
                onTokenClick={(id) => setSelectedId(id)}
                className="text-base sm:text-lg"
              />
            </div>

            {/* Quick Term Pills */}
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
                    className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition ${
                      style.badge
                    } ${isActive ? 'ring-2 ring-offset-1 ring-blue-500/50 dark:ring-offset-slate-900 scale-[1.02]' : 'opacity-80 hover:opacity-100'}`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
                    {term.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Term Inspector */}
          {activeTerm ? (
            <div
              className={`rounded-xl border border-slate-200 border-l-4 bg-slate-50/90 p-4 transition-all dark:border-slate-800 dark:bg-slate-950/70 ${ROLE_STYLES[activeTerm.role].border}`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {activeTerm.label}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-md bg-slate-200/80 px-2 py-0.5 font-mono text-[11px] font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                  <Layers className="h-3 w-3" />
                  Shape: {activeTerm.shape}
                </span>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                {activeTerm.explanation}
              </p>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-300 p-4 text-center text-xs text-slate-400 dark:border-slate-700">
              点击或悬停上方公式中的彩色符号，或右侧任意高亮代码行，查看张量维度与原理对应关系。
            </div>
          )}
        </div>

        {/* Right: Interactive Code View */}
        <div className="lg:col-span-6 bg-slate-950 text-slate-100 flex flex-col">
          <div className="flex items-center justify-between border-b border-slate-800 px-4 py-2.5 text-xs text-slate-400">
            <span className="inline-flex items-center gap-1.5 font-mono">
              <Code2 className="h-3.5 w-3.5 text-emerald-400" />
              {framework === 'pytorch' ? 'pytorch_impl.py' : 'numpy_impl.py'}
            </span>
            <span className="text-[11px] text-slate-500">悬停代码行反向定位公式</span>
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
                  : 'border-l-2 border-l-transparent hover:bg-slate-800/60';

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
                  <span className="mr-3 w-6 shrink-0 select-none text-right text-slate-600">
                    {lineNum}
                  </span>
                  <pre className="whitespace-pre text-slate-200">{line || ' '}</pre>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
