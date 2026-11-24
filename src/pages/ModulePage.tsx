import React, { useEffect, useState } from 'react';
import { Link, Navigate, useLocation, useParams } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, ArrowRight, CheckSquare, FileText, Layers, ListChecks, Square } from 'lucide-react';
import { LECTURES, getLectureBySlug } from '../data/lectures';
import { ALL_CARDS, ALL_QUESTIONS, getReviewPack } from '../data/review';
import { FigureKey, LectureModule, VerifierId } from '../types/curriculum';
import { DerivationChain } from '../components/DerivationChain';
import { FormulaCodeSync } from '../components/FormulaCodeSync';
import { PythonSandbox } from '../components/PythonSandbox';
import { MathFormula } from '../components/MathFormula';
import { RichText } from '../components/RichText';
import { LinearFigures } from '../components/Figures/LinearFigures';
import { DeepOptFigures } from '../components/Figures/DeepOptFigures';
import { TransformerGenRLFigures } from '../components/Figures/TransformerGenRLFigures';
import { LinearLogisticVerifier } from '../components/Verifiers/LinearLogisticVerifier';
import { SurrogateNBVerifier } from '../components/Verifiers/SurrogateNBVerifier';
import { BackpropNormVerifier } from '../components/Verifiers/BackpropNormVerifier';
import { ConvRNNVerifier } from '../components/Verifiers/ConvRNNVerifier';
import { TransformerCLIPVerifier } from '../components/Verifiers/TransformerCLIPVerifier';
import { GenerativeRLVerifier } from '../components/Verifiers/GenerativeRLVerifier';
import { FlashcardDeck } from '../components/review/FlashcardDeck';
import { QuizCard } from '../components/review/QuizCard';
import { FormulaRow, HideToggle, StatusPicker } from '../components/review/ReviewBits';
import { toggleChecklist, useProgress } from '../utils/progress';

interface ModulePageProps {
  isDark: boolean;
}

// L01–L07 keep their original codes, so their figure panels are found by code.
// From L08 on, the slide numbering differs from the figure panels: lectures opt in via `figureKey`.
const CODE_FIGURES: FigureKey[] = ['L01', 'L02.1', 'L02.2', 'L03', 'L04', 'L05', 'L06', 'L07'];

function figureKeyOf(lec: LectureModule): FigureKey | null {
  if (lec.figureKey) return lec.figureKey;
  return (CODE_FIGURES as string[]).includes(lec.code) ? (lec.code as FigureKey) : null;
}

const renderFigure = (key: FigureKey, isDark: boolean) => {
  if (key === 'L01' || key === 'L02.1' || key === 'L02.2' || key === 'L03') {
    return <LinearFigures lectureCode={key} isDark={isDark} />;
  }
  if (key === 'L04' || key === 'L05' || key === 'L06' || key === 'L07') {
    return <DeepOptFigures lectureCode={key} isDark={isDark} />;
  }
  return <TransformerGenRLFigures lectureCode={key} isDark={isDark} />;
};

const renderVerifier = (lec: LectureModule, id: VerifierId) => {
  switch (id) {
    case 'l01-ols-ridge':
    case 'l02-1-logistic-gd':
      return <LinearLogisticVerifier mode={id} />;
    case 'l02-2-nb-surrogate':
    case 'l03-bias-variance':
      return <SurrogateNBVerifier mode={id} />;
    case 'l04-mlp-backprop':
    case 'l05-norm-opt':
      return <BackpropNormVerifier mode={id} />;
    case 'l06-conv-flops':
    case 'l07-lstm-rnn':
      return <ConvRNNVerifier mode={id} />;
    case 'l08-self-attention':
    case 'l09-vit-clip':
      return <TransformerCLIPVerifier mode={id} />;
    case 'l10-gen-models':
    case 'l11-rl-bellman-ppo':
      return <GenerativeRLVerifier key={lec.id} mode={id} initialTab={lec.verifierTab} />;
  }
};

const H2: React.FC<{ n: number; children: React.ReactNode }> = ({ n, children }) => (
  <h2 className="font-serif-display text-xl font-semibold text-stone-950 dark:text-zinc-100 border-b border-stone-200 pb-2 dark:border-zinc-800">
    §{n} {children}
  </h2>
);

const WEIGHT_LABEL = { core: '期末核心', support: '基础 / 预备', optional: '选读（客座讲座）' } as const;

export const ModulePage: React.FC<ModulePageProps> = ({ isDark }) => {
  const { slug } = useParams<{ slug: string }>();
  const location = useLocation();
  const lec = slug ? getLectureBySlug(slug) : undefined;
  const progress = useProgress();
  const [hideFormulas, setHideFormulas] = useState(false);
  const [deckOpen, setDeckOpen] = useState(false);

  useEffect(() => {
    setDeckOpen(false);
    if (location.hash) {
      const id = location.hash.slice(1);
      // wait one frame so the new lecture's sections exist
      requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }));
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [slug, location.hash]);

  if (!lec) {
    return <Navigate to="/" replace />;
  }

  const idx = LECTURES.findIndex((l) => l.id === lec.id);
  const prev = idx > 0 ? LECTURES[idx - 1] : null;
  const next = idx < LECTURES.length - 1 ? LECTURES[idx + 1] : null;
  const pack = getReviewPack(lec.id);
  const cards = ALL_CARDS.filter((c) => c.lectureId === lec.id);
  const questions = ALL_QUESTIONS.filter((q) => q.lectureId === lec.id);
  const checked = progress.lectures[lec.id]?.checked ?? [];
  const figKey = figureKeyOf(lec);

  // Build the section list so numbering and the TOC only include what this lecture has.
  const sections: { id: string; label: string }[] = [];
  if (pack) sections.push({ id: 'keypoints', label: '考点速记' });
  if (lec.derivations.length) sections.push({ id: 'derivations', label: '推导链' });
  if (figKey) sections.push({ id: 'figures', label: '图解' });
  if (lec.verifierId) sections.push({ id: 'verifier', label: '数值验算器' });
  if (lec.concepts.length) sections.push({ id: 'concepts', label: '概念与对比' });
  if (lec.formulaSpecs.length) sections.push({ id: 'code-sync', label: '公式↔代码' });
  if (lec.pitfalls.length) sections.push({ id: 'pitfalls', label: '易错点' });
  if (lec.sandbox) sections.push({ id: 'sandbox', label: 'Python 实测' });
  if (cards.length || questions.length) sections.push({ id: 'review', label: '自测' });
  const num = (id: string) => sections.findIndex((s) => s.id === id) + 1;

  return (
    <article className="space-y-11 pb-16">
      {/* Lecture Masthead */}
      <header className="border-b border-stone-200 pb-7 dark:border-zinc-800 space-y-4">
        <div className="flex flex-wrap items-center gap-2 font-mono text-xs text-stone-500 dark:text-zinc-400">
          <span className="font-bold text-blue-700 dark:text-blue-400">{lec.code}</span>
          <span>/</span>
          <span>{lec.partGroup}</span>
          <span>/</span>
          <span className={lec.examWeight === 'core' ? 'text-red-700 dark:text-red-400' : ''}>{WEIGHT_LABEL[lec.examWeight]}</span>
        </div>

        <div>
          <h1 className="font-serif-display text-3xl sm:text-4xl font-semibold tracking-tight text-stone-950 dark:text-zinc-50 leading-tight">
            {lec.titleZh}
          </h1>
          <div className="mt-1 text-sm font-medium text-stone-500 dark:text-zinc-400">{lec.titleEn}</div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5 font-mono text-[11px] text-stone-500 dark:text-zinc-400">
            <FileText className="h-3.5 w-3.5" />
            对应讲义：
            {lec.slides.map((f) => (
              <span key={f} className="rounded bg-stone-100 px-1.5 py-0.5 dark:bg-zinc-800">
                {f}
              </span>
            ))}
          </div>
          <StatusPicker lectureId={lec.id} />
        </div>

        <p className="text-[14.5px] math-prose text-stone-700 dark:text-zinc-300">
          <RichText text={lec.abstract} />
        </p>

        {/* Lecture Syllabus Checklist (persisted ticks) */}
        <div className="rounded-lg border border-stone-200 bg-white p-4 dark:border-zinc-800 dark:bg-[#11151d]">
          <div className="mb-2.5 flex items-center justify-between gap-2 font-mono text-[11px] font-semibold uppercase tracking-wider text-stone-500 dark:text-zinc-400">
            <span className="flex items-center gap-1.5">
              <CheckSquare className="h-3.5 w-3.5" />
              本讲知识点自查表（能讲清楚就勾上）
            </span>
            <span>
              {checked.length}/{lec.readingChecklist.length}
            </span>
          </div>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1.5 text-[13px] leading-[1.75] text-stone-700 dark:text-zinc-300">
            {lec.readingChecklist.map((item, i) => {
              const on = checked.includes(i);
              return (
                <li key={i}>
                  <button
                    onClick={() => toggleChecklist(lec.id, i)}
                    aria-pressed={on}
                    className="flex w-full items-start gap-2 rounded px-1 py-0.5 text-left hover:bg-stone-50 dark:hover:bg-zinc-900 cursor-pointer"
                  >
                    {on ? (
                      <CheckSquare className="mt-1 h-3.5 w-3.5 shrink-0 text-emerald-700 dark:text-emerald-400" />
                    ) : (
                      <Square className="mt-1 h-3.5 w-3.5 shrink-0 text-stone-400" />
                    )}
                    <span className={on ? 'text-stone-500 dark:text-zinc-500' : ''}>
                      <RichText text={item} />
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        {/* In-Page TOC Strip */}
        <nav className="flex flex-wrap gap-2 pt-1 font-mono text-[11px]">
          {sections.map((s, i) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              onClick={(e) => {
                e.preventDefault();
                document.getElementById(s.id)?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="rounded border border-stone-200 bg-white px-2.5 py-1 text-stone-600 hover:border-blue-500 hover:text-blue-700 transition dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:border-blue-500 dark:hover:text-blue-400"
            >
              §{i + 1} {s.label}
            </a>
          ))}
        </nav>
      </header>

      {/* Key points & formula sheet */}
      {pack && (
        <section id="keypoints" className="scroll-mt-20 space-y-4">
          <H2 n={num('keypoints')}>考点速记与核心公式 (Key Points)</H2>
          <ul className="space-y-2 rounded-lg border border-stone-200 border-l-3 border-l-blue-700 bg-white p-4 text-[13.5px] leading-[1.8] text-stone-700 dark:border-zinc-800 dark:border-l-blue-500 dark:bg-[#11151d] dark:text-zinc-300">
            {pack.keyPoints.map((k, i) => (
              <li key={i} className="flex gap-2.5">
                <span className="mt-0.5 font-mono text-[10.5px] font-semibold text-blue-700 dark:text-blue-400">{String(i + 1).padStart(2, '0')}</span>
                <span className="math-prose">
                  <RichText text={k} />
                </span>
              </li>
            ))}
          </ul>
          {pack.formulas.length > 0 && (
            <div className="rounded-lg border border-stone-200 bg-white px-4 py-2 dark:border-zinc-800 dark:bg-[#11151d]">
              <div className="flex items-center justify-between gap-2 py-1.5">
                <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-stone-500 dark:text-zinc-400">必记公式</span>
                <HideToggle hidden={hideFormulas} onToggle={() => setHideFormulas((h) => !h)} />
              </div>
              {pack.formulas.map((f, i) => (
                <FormulaRow key={`${i}-${hideFormulas}`} formula={f} hidden={hideFormulas} />
              ))}
            </div>
          )}
        </section>
      )}

      {lec.derivations.length > 0 && (
        <section id="derivations" className="scroll-mt-20 space-y-5">
          <H2 n={num('derivations')}>零跳步数学推导链 (Rigorous Derivations)</H2>
          <div className="space-y-6">
            {lec.derivations.map((d) => (
              <DerivationChain key={d.id} spec={d} />
            ))}
          </div>
        </section>
      )}

      {figKey && (
        <section id="figures" className="scroll-mt-20 space-y-4">
          <H2 n={num('figures')}>几何直觉与交互图解 (Figures)</H2>
          {renderFigure(figKey, isDark)}
        </section>
      )}

      {lec.verifierId && (
        <section id="verifier" className="scroll-mt-20 space-y-4">
          <H2 n={num('verifier')}>可编辑数值验算器 (Numerical Verifier)</H2>
          {renderVerifier(lec, lec.verifierId)}
        </section>
      )}

      {lec.concepts.length > 0 && (
        <section id="concepts" className="scroll-mt-20 space-y-5">
          <H2 n={num('concepts')}>核心概念精讲与横向对比 (Concepts &amp; Comparisons)</H2>
          <div className="space-y-5">
            {lec.concepts.map((c, cIdx) => (
              <div key={cIdx} className="rounded-lg border border-stone-200 bg-white p-5 dark:border-zinc-800 dark:bg-[#11151d] space-y-3">
                <h3 className="text-[15px] font-semibold text-stone-900 dark:text-zinc-100">
                  <RichText text={c.heading} />
                </h3>
                <p className="text-[13.5px] math-prose text-stone-600 dark:text-zinc-300">
                  <RichText text={c.body} />
                </p>
                {c.latex && (
                  <div className="rounded border border-stone-200/80 bg-stone-50/70 px-3 py-2 text-center dark:border-zinc-800 dark:bg-zinc-950/70 overflow-x-auto">
                    <MathFormula latex={c.latex} className="text-sm" />
                  </div>
                )}
                {c.points && (
                  <ul className="space-y-2 text-[13px] math-prose text-stone-700 dark:text-zinc-300 list-disc pl-5">
                    {c.points.map((pt, pi) => (
                      <li key={pi}>
                        <RichText text={pt} />
                      </li>
                    ))}
                  </ul>
                )}
                {c.table && (
                  <div className="overflow-x-auto pt-1">
                    <table className="w-full border-collapse text-[13px]">
                      <thead>
                        <tr className="border-b border-stone-200 bg-stone-50 dark:border-zinc-800 dark:bg-zinc-900/70">
                          {c.table.headers.map((h, hi) => (
                            <th key={hi} className="px-3 py-2.5 text-left font-semibold text-stone-700 dark:text-zinc-200">
                              <RichText text={h} />
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100 dark:divide-zinc-800/80">
                        {c.table.rows.map((row, ri) => (
                          <tr key={ri}>
                            {row.map((cell, ci) => (
                              <td
                                key={ci}
                                className={`px-3 py-2.5 leading-[1.7] ${
                                  ci === 0
                                    ? 'font-semibold text-stone-900 dark:text-zinc-100 whitespace-nowrap'
                                    : 'text-stone-600 dark:text-zinc-300'
                                }`}
                              >
                                <RichText text={cell} />
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {lec.formulaSpecs.length > 0 && (
        <section id="code-sync" className="scroll-mt-20 space-y-5">
          <H2 n={num('code-sync')}>公式与代码精确映射 (Formula → Code)</H2>
          <div className="space-y-6">
            {lec.formulaSpecs.map((spec) => (
              <FormulaCodeSync key={spec.id} spec={spec} />
            ))}
          </div>
        </section>
      )}

      {lec.pitfalls.length > 0 && (
        <section id="pitfalls" className="scroll-mt-20 space-y-4">
          <H2 n={num('pitfalls')}>易错点与作业 / 考场警示 (Common Pitfalls)</H2>
          <div className="space-y-3">
            {lec.pitfalls.map((pf, i) => (
              <div
                key={i}
                className="rounded-lg border border-stone-200 border-l-3 border-l-red-700 bg-white p-4 dark:border-zinc-800 dark:border-l-red-500 dark:bg-[#11151d]"
              >
                <div className="flex items-center gap-2 text-[13.5px] font-semibold text-stone-900 dark:text-zinc-100">
                  <AlertTriangle className="h-3.5 w-3.5 text-red-700 dark:text-red-400 shrink-0" />
                  <span>
                    <RichText text={pf.title} />
                  </span>
                </div>
                <p className="mt-1.5 text-[13px] math-prose text-stone-600 dark:text-zinc-300">
                  <RichText text={pf.detail} />
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {lec.sandbox && (
        <section id="sandbox" className="scroll-mt-20 space-y-4">
          <H2 n={num('sandbox')}>浏览器内 NumPy 实测验证 (Executable Verification)</H2>
          <PythonSandbox spec={lec.sandbox} isDark={isDark} />
        </section>
      )}

      {(cards.length > 0 || questions.length > 0) && (
        <section id="review" className="scroll-mt-20 space-y-5">
          <H2 n={num('review')}>本讲自测：抽认卡与练习题 (Self-Test)</H2>
          {cards.length > 0 && (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 text-[14px] font-semibold text-stone-900 dark:text-zinc-100">
                  <Layers className="h-4 w-4 text-blue-700 dark:text-blue-400" />
                  抽认卡 · {cards.length} 张
                </div>
                <div className="flex gap-2 text-xs">
                  <button
                    onClick={() => setDeckOpen((o) => !o)}
                    className="rounded-md bg-stone-900 px-3 py-1.5 font-medium text-white hover:bg-stone-800 dark:bg-blue-600 dark:hover:bg-blue-500 cursor-pointer"
                  >
                    {deckOpen ? '收起' : '开始本讲卡片'}
                  </button>
                  <Link
                    to={`/review/flashcards?l=${lec.id}`}
                    className="rounded-md border border-stone-300 px-3 py-1.5 text-stone-700 hover:bg-stone-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                  >
                    在复习中心打开
                  </Link>
                </div>
              </div>
              {deckOpen && <FlashcardDeck cards={cards} />}
            </div>
          )}
          {questions.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-1.5 text-[14px] font-semibold text-stone-900 dark:text-zinc-100">
                <ListChecks className="h-4 w-4 text-blue-700 dark:text-blue-400" />
                练习题 · {questions.length} 道（原创，题型对应 WA / 期末）
              </div>
              {questions.map((q, i) => (
                <QuizCard key={q.id} question={q} index={i} />
              ))}
            </div>
          )}
        </section>
      )}

      {/* Lecture Prev / Next Navigation */}
      <nav className="flex flex-wrap items-center justify-between gap-4 border-t border-stone-200 pt-6 dark:border-zinc-800">
        {prev ? (
          <Link
            to={`/lecture/${prev.slug}`}
            className="inline-flex items-center gap-2 rounded-md border border-stone-300 bg-white px-4 py-2 text-xs font-medium text-stone-700 hover:bg-stone-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            {prev.code} · {prev.titleZh}
          </Link>
        ) : (
          <div />
        )}

        {next ? (
          <Link
            to={`/lecture/${next.slug}`}
            className="inline-flex items-center gap-2 rounded-md bg-stone-900 px-4 py-2 text-xs font-medium text-white hover:bg-stone-800 dark:bg-blue-600 dark:hover:bg-blue-500"
          >
            下一讲 · {next.code} {next.titleZh}
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        ) : (
          <Link
            to="/review"
            className="inline-flex items-center gap-2 rounded-md border border-stone-300 bg-white px-4 py-2 text-xs font-medium text-stone-700 hover:bg-stone-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
          >
            前往复习中心
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        )}
      </nav>
    </article>
  );
};
