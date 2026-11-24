import React, { useEffect, useState } from 'react';
import { Link, Navigate, useLocation, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, CheckSquare, FileText, Layers, ListChecks, Square } from 'lucide-react';
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
import { LectureExplorables, hasExplorables } from '../components/explore';
import { Callout, ReadingProgress, SectionHead, useScrollSpy } from '../components/PageChrome';
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

const WEIGHT_LABEL = { core: '期末核心', support: '基础 / 预备', optional: '选读 · 客座讲座' } as const;

interface Sec {
  id: string;
  label: string;
  kicker: string;
}

export const ModulePage: React.FC<ModulePageProps> = ({ isDark }) => {
  const { slug } = useParams<{ slug: string }>();
  const location = useLocation();
  const lec = slug ? getLectureBySlug(slug) : undefined;
  const progress = useProgress();
  const [hideFormulas, setHideFormulas] = useState(false);
  const [deckOpen, setDeckOpen] = useState(false);

  // Build the section list so numbering and the TOC only include what this lecture has.
  const sections: Sec[] = [];
  const pack = lec ? getReviewPack(lec.id) : undefined;
  const cards = lec ? ALL_CARDS.filter((c) => c.lectureId === lec.id) : [];
  const questions = lec ? ALL_QUESTIONS.filter((q) => q.lectureId === lec.id) : [];
  const figKey = lec ? figureKeyOf(lec) : null;
  if (lec) {
    if (pack) sections.push({ id: 'keypoints', label: '考点速记', kicker: 'Key Points' });
    if (hasExplorables(lec.id)) sections.push({ id: 'explore', label: '交互探索', kicker: 'Explore' });
    if (lec.derivations.length) sections.push({ id: 'derivations', label: '推导链', kicker: 'Derivations' });
    if (figKey) sections.push({ id: 'figures', label: '几何图解', kicker: 'Figures' });
    if (lec.verifierId) sections.push({ id: 'verifier', label: '数值验算器', kicker: 'Verifier' });
    if (lec.concepts.length) sections.push({ id: 'concepts', label: '概念与对比', kicker: 'Concepts' });
    if (lec.formulaSpecs.length) sections.push({ id: 'code-sync', label: '公式 ↔ 代码', kicker: 'Formula → Code' });
    if (lec.pitfalls.length) sections.push({ id: 'pitfalls', label: '易错点', kicker: 'Pitfalls' });
    if (lec.sandbox) sections.push({ id: 'sandbox', label: 'Python 实测', kicker: 'Run It' });
    if (cards.length || questions.length) sections.push({ id: 'review', label: '本讲自测', kicker: 'Self-Test' });
  }
  const active = useScrollSpy(sections.map((s) => s.id));

  useEffect(() => {
    setDeckOpen(false);
    if (location.hash) {
      const id = location.hash.slice(1);
      requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }));
    } else {
      window.scrollTo({ top: 0 });
    }
  }, [slug, location.hash]);

  if (!lec) {
    return <Navigate to="/" replace />;
  }

  const idx = LECTURES.findIndex((l) => l.id === lec.id);
  const prev = idx > 0 ? LECTURES[idx - 1] : null;
  const next = idx < LECTURES.length - 1 ? LECTURES[idx + 1] : null;
  const checked = progress.lectures[lec.id]?.checked ?? [];
  const num = (id: string) => sections.findIndex((s) => s.id === id) + 1;
  const sec = (id: string) => sections.find((s) => s.id === id)!;
  const jump = (id: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };
  const doneQs = questions.filter((q) => progress.quiz[q.id]).length;

  return (
    <div className="xl:grid xl:grid-cols-[minmax(0,46rem)_14rem] xl:justify-center xl:gap-14">
      <ReadingProgress />
      <article className="mx-auto max-w-[46rem] space-y-16 pb-16">
        {/* ---------------- Masthead ---------------- */}
        <header className="space-y-5">
          <nav className="flex flex-wrap items-center gap-1.5 text-[13px] text-stone-500 dark:text-zinc-400" aria-label="面包屑">
            <Link to="/" className="hover:text-blue-700 dark:hover:text-blue-400">课程</Link>
            <span>/</span>
            <span>{lec.partGroup}</span>
            <span>/</span>
            <span className="font-mono font-semibold text-blue-700 dark:text-blue-400">{lec.code}</span>
          </nav>

          <div className="space-y-2">
            <h1 className="font-serif-display text-[2.1rem] sm:text-[2.6rem] font-semibold leading-[1.18] tracking-tight text-stone-950 dark:text-zinc-50">
              {lec.titleZh}
            </h1>
            <div className="text-[15px] text-stone-500 dark:text-zinc-400">{lec.titleEn}</div>
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[13px] text-stone-500 dark:text-zinc-400">
            <span className={`rounded-full border px-2.5 py-0.5 ${lec.examWeight === 'core' ? 'border-red-300 text-red-700 dark:border-red-900 dark:text-red-400' : 'border-stone-300 dark:border-zinc-700'}`}>
              {WEIGHT_LABEL[lec.examWeight]}
            </span>
            <span className="inline-flex flex-wrap items-center gap-1.5">
              <FileText className="h-3.5 w-3.5" />
              {lec.slides.map((f) => (
                <span key={f} className="font-mono">{f}</span>
              ))}
            </span>
          </div>

          <p className="prose-zh text-[17px] leading-[1.9] text-stone-700 dark:text-zinc-300">
            <RichText text={lec.abstract} />
          </p>

          <div className="xl:hidden">
            <StatusPicker lectureId={lec.id} />
          </div>

          {/* Persisted checklist */}
          <div className="rounded-xl border border-stone-200 bg-white p-5 dark:border-zinc-800 dark:bg-[#11151d]">
            <div className="mb-3 flex items-center justify-between gap-2">
              <span className="flex items-center gap-2 text-[15px] font-semibold text-stone-900 dark:text-zinc-100">
                <CheckSquare className="h-4 w-4 text-blue-700 dark:text-blue-400" />
                知识点自查表
                <span className="text-[13px] font-normal text-stone-500 dark:text-zinc-400">能讲清楚就勾上</span>
              </span>
              <span className="font-mono text-[13px] text-stone-500 dark:text-zinc-400">
                {checked.length}/{lec.readingChecklist.length}
              </span>
            </div>
            <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-stone-100 dark:bg-zinc-800">
              <div className="h-full rounded-full bg-emerald-600 transition-all" style={{ width: `${(checked.length / lec.readingChecklist.length) * 100}%` }} />
            </div>
            <ul className="space-y-1">
              {lec.readingChecklist.map((item, i) => {
                const on = checked.includes(i);
                return (
                  <li key={i}>
                    <button
                      onClick={() => toggleChecklist(lec.id, i)}
                      aria-pressed={on}
                      className="flex w-full items-start gap-2.5 rounded-lg px-2 py-1.5 text-left text-[15px] leading-[1.75] hover:bg-stone-50 dark:hover:bg-zinc-900 cursor-pointer"
                    >
                      {on ? (
                        <CheckSquare className="mt-1.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                      ) : (
                        <Square className="mt-1.5 h-4 w-4 shrink-0 text-stone-400" />
                      )}
                      <span className={on ? 'text-stone-400 line-through decoration-stone-300 dark:text-zinc-500' : 'text-stone-700 dark:text-zinc-300'}>
                        <RichText text={item} />
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Compact TOC for narrow screens */}
          <nav className="flex flex-wrap gap-2 xl:hidden" aria-label="本页目录">
            {sections.map((s, i) => (
              <a key={s.id} href={`#${s.id}`} onClick={jump(s.id)} className="rounded-full border border-stone-200 bg-white px-3 py-1 text-[13px] text-stone-600 hover:border-blue-500 hover:text-blue-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:text-blue-400">
                {i + 1}. {s.label}
              </a>
            ))}
          </nav>
        </header>

        {/* ---------------- Key points ---------------- */}
        {pack && (
          <section id="keypoints" className="space-y-5">
            <SectionHead n={num('keypoints')} kicker={sec('keypoints').kicker} title="考点速记与必记公式" lead="考前最后一遍只看这里也够用：结论 + 公式。" />
            <Callout kind="key" title="本讲要点">
              <ol className="mt-1 space-y-2.5">
                {pack.keyPoints.map((k, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="mt-[3px] flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-600 font-mono text-[11px] font-semibold text-white dark:bg-blue-500">{i + 1}</span>
                    <span>
                      <RichText text={k} />
                    </span>
                  </li>
                ))}
              </ol>
            </Callout>
            {pack.formulas.length > 0 && (
              <div className="rounded-xl border border-stone-200 bg-white px-5 py-3 dark:border-zinc-800 dark:bg-[#11151d]">
                <div className="flex flex-wrap items-center justify-between gap-2 py-1.5">
                  <span className="text-[15px] font-semibold text-stone-900 dark:text-zinc-100">必记公式</span>
                  <HideToggle hidden={hideFormulas} onToggle={() => setHideFormulas((h) => !h)} />
                </div>
                {pack.formulas.map((f, i) => (
                  <FormulaRow key={`${i}-${hideFormulas}`} formula={f} hidden={hideFormulas} />
                ))}
              </div>
            )}
          </section>
        )}

        {/* ---------------- Explorables ---------------- */}
        {hasExplorables(lec.id) && (
          <section id="explore">
            <SectionHead n={num('explore')} kicker={sec('explore').kicker} title="交互探索" lead="先动手玩，再看推导：每个组件都有一个引导问题，玩完后展开「你应该注意到什么」。" />
            <LectureExplorables lectureId={lec.id} />
          </section>
        )}

        {lec.derivations.length > 0 && (
          <section id="derivations">
            <SectionHead n={num('derivations')} kicker={sec('derivations').kicker} title="零跳步推导链" lead="每一步都标注所用的法则；可以切换为逐行自测模式。" />
            <div className="space-y-6">
              {lec.derivations.map((d) => (
                <DerivationChain key={d.id} spec={d} />
              ))}
            </div>
          </section>
        )}

        {figKey && (
          <section id="figures">
            <SectionHead n={num('figures')} kicker={sec('figures').kicker} title="几何直觉与高维图解" />
            {renderFigure(figKey, isDark)}
          </section>
        )}

        {lec.verifierId && (
          <section id="verifier">
            <SectionHead n={num('verifier')} kicker={sec('verifier').kicker} title="可编辑数值验算器" lead="输入你自己的数字，核对手算作业的每一个中间量。" />
            {renderVerifier(lec, lec.verifierId)}
          </section>
        )}

        {lec.concepts.length > 0 && (
          <section id="concepts">
            <SectionHead n={num('concepts')} kicker={sec('concepts').kicker} title="核心概念与横向对比" />
            <div className="space-y-6">
              {lec.concepts.map((c, cIdx) => (
                <div key={cIdx} className="space-y-3">
                  <h3 className="font-serif-display text-[1.3rem] font-semibold leading-snug text-stone-900 dark:text-zinc-100">
                    <RichText text={c.heading} />
                  </h3>
                  <p className="prose-zh">
                    <RichText text={c.body} />
                  </p>
                  {c.latex && (
                    <div className="overflow-x-auto rounded-xl border border-stone-200 bg-white px-4 py-3 text-center dark:border-zinc-800 dark:bg-[#11151d]">
                      <MathFormula latex={c.latex} />
                    </div>
                  )}
                  {c.points && (
                    <ul className="prose-zh list-disc space-y-2 pl-5 marker:text-stone-400">
                      {c.points.map((pt, pi) => (
                        <li key={pi}>
                          <RichText text={pt} />
                        </li>
                      ))}
                    </ul>
                  )}
                  {c.table && (
                    <div className="overflow-x-auto rounded-xl border border-stone-200 dark:border-zinc-800">
                      <table className="w-full border-collapse text-[14.5px]">
                        <thead>
                          <tr className="bg-stone-50 dark:bg-zinc-900/70">
                            {c.table.headers.map((h, hi) => (
                              <th key={hi} className="border-b border-stone-200 px-4 py-3 text-left font-semibold text-stone-700 dark:border-zinc-800 dark:text-zinc-200">
                                <RichText text={h} />
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-100 bg-white dark:divide-zinc-800/80 dark:bg-[#11151d]">
                          {c.table.rows.map((row, ri) => (
                            <tr key={ri} className="align-top">
                              {row.map((cell, ci) => (
                                <td
                                  key={ci}
                                  className={`px-4 py-3 leading-[1.75] ${ci === 0 ? 'font-semibold text-stone-900 dark:text-zinc-100 whitespace-nowrap' : 'text-stone-600 dark:text-zinc-300'}`}
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
          <section id="code-sync">
            <SectionHead n={num('code-sync')} kicker={sec('code-sync').kicker} title="公式与代码精确映射" lead="点击公式中的彩色符号，高亮对应的 NumPy / PyTorch 代码行与张量形状。" />
            <div className="space-y-6">
              {lec.formulaSpecs.map((spec) => (
                <FormulaCodeSync key={spec.id} spec={spec} />
              ))}
            </div>
          </section>
        )}

        {lec.pitfalls.length > 0 && (
          <section id="pitfalls">
            <SectionHead n={num('pitfalls')} kicker={sec('pitfalls').kicker} title="易错点与考场警示" />
            <div className="space-y-3">
              {lec.pitfalls.map((pf, i) => (
                <Callout key={i} kind="warn" title={<RichText text={pf.title} />}>
                  <RichText text={pf.detail} />
                </Callout>
              ))}
            </div>
          </section>
        )}

        {lec.sandbox && (
          <section id="sandbox">
            <SectionHead n={num('sandbox')} kicker={sec('sandbox').kicker} title="浏览器内 NumPy 实测" lead="代码在你的浏览器里运行（Pyodide），可以随意修改。" />
            <PythonSandbox spec={lec.sandbox} isDark={isDark} />
          </section>
        )}

        {(cards.length > 0 || questions.length > 0) && (
          <section id="review" className="space-y-6">
            <SectionHead n={num('review')} kicker={sec('review').kicker} title="本讲自测" lead={`${cards.length} 张抽认卡 · ${questions.length} 道原创练习题（题型对应 WA / 期末）`} />
            {cards.length > 0 && (
              <div className="space-y-3 rounded-xl border border-stone-200 bg-white p-5 dark:border-zinc-800 dark:bg-[#11151d]">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-[16px] font-semibold text-stone-900 dark:text-zinc-100">
                    <Layers className="h-4 w-4 text-blue-700 dark:text-blue-400" />
                    抽认卡 · {cards.length} 张
                  </div>
                  <div className="flex gap-2 text-sm">
                    <button
                      onClick={() => setDeckOpen((o) => !o)}
                      className="rounded-lg bg-stone-900 px-3.5 py-1.5 font-medium text-white hover:bg-stone-800 dark:bg-blue-600 dark:hover:bg-blue-500 cursor-pointer"
                    >
                      {deckOpen ? '收起' : '开始本讲卡片'}
                    </button>
                    <Link
                      to={`/review/flashcards?l=${lec.id}`}
                      className="rounded-lg border border-stone-300 px-3.5 py-1.5 text-stone-700 hover:bg-stone-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                    >
                      在复习中心打开
                    </Link>
                  </div>
                </div>
                {deckOpen && <FlashcardDeck cards={cards} />}
              </div>
            )}
            {questions.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-[16px] font-semibold text-stone-900 dark:text-zinc-100">
                  <ListChecks className="h-4 w-4 text-blue-700 dark:text-blue-400" />
                  练习题 · 已做 {doneQs}/{questions.length}
                </div>
                {questions.map((q, i) => (
                  <QuizCard key={q.id} question={q} index={i} />
                ))}
              </div>
            )}
          </section>
        )}

        {/* ---------------- Prev / next ---------------- */}
        <nav className="grid gap-3 border-t border-stone-200 pt-8 sm:grid-cols-2 dark:border-zinc-800">
          {prev ? (
            <Link to={`/lecture/${prev.slug}`} className="group rounded-xl border border-stone-200 bg-white p-4 transition hover:border-blue-500 dark:border-zinc-800 dark:bg-[#11151d]">
              <div className="flex items-center gap-1 text-[13px] text-stone-500 dark:text-zinc-400">
                <ArrowLeft className="h-3.5 w-3.5" /> 上一讲 · {prev.code}
              </div>
              <div className="mt-1 text-[15px] font-semibold text-stone-900 group-hover:text-blue-700 dark:text-zinc-100 dark:group-hover:text-blue-400">{prev.titleZh}</div>
            </Link>
          ) : (
            <div />
          )}
          {next ? (
            <Link to={`/lecture/${next.slug}`} className="group rounded-xl border border-stone-200 bg-white p-4 text-right transition hover:border-blue-500 dark:border-zinc-800 dark:bg-[#11151d]">
              <div className="flex items-center justify-end gap-1 text-[13px] text-stone-500 dark:text-zinc-400">
                下一讲 · {next.code} <ArrowRight className="h-3.5 w-3.5" />
              </div>
              <div className="mt-1 text-[15px] font-semibold text-stone-900 group-hover:text-blue-700 dark:text-zinc-100 dark:group-hover:text-blue-400">{next.titleZh}</div>
            </Link>
          ) : (
            <Link to="/review" className="group rounded-xl border border-stone-200 bg-white p-4 text-right transition hover:border-blue-500 dark:border-zinc-800 dark:bg-[#11151d]">
              <div className="text-[13px] text-stone-500 dark:text-zinc-400">全部讲次已读完</div>
              <div className="mt-1 text-[15px] font-semibold text-stone-900 group-hover:text-blue-700 dark:text-zinc-100">前往复习中心 →</div>
            </Link>
          )}
        </nav>
      </article>

      {/* ---------------- Right rail (xl+) ---------------- */}
      <aside className="no-print hidden xl:block">
        <div className="sticky top-20 space-y-6">
          <div>
            <div className="section-kicker mb-2 text-stone-400 dark:text-zinc-500">本页目录</div>
            <nav className="space-y-0.5 border-l border-stone-200 dark:border-zinc-800">
              {sections.map((s, i) => (
                <a
                  key={s.id}
                  href={`#${s.id}`}
                  onClick={jump(s.id)}
                  className={`-ml-px block border-l-2 py-1 pl-3 text-[13.5px] transition ${
                    active === s.id
                      ? 'border-blue-600 font-medium text-blue-700 dark:border-blue-400 dark:text-blue-400'
                      : 'border-transparent text-stone-500 hover:text-stone-900 dark:text-zinc-400 dark:hover:text-zinc-100'
                  }`}
                >
                  {i + 1}. {s.label}
                </a>
              ))}
            </nav>
          </div>
          <div className="space-y-2">
            <div className="section-kicker text-stone-400 dark:text-zinc-500">掌握程度</div>
            <StatusPicker lectureId={lec.id} vertical />
          </div>
          <div className="space-y-1.5 text-[13px] text-stone-600 dark:text-zinc-400">
            <div className="section-kicker text-stone-400 dark:text-zinc-500">本讲进度</div>
            <div>自查表 {checked.length}/{lec.readingChecklist.length}</div>
            <div>练习题 {doneQs}/{questions.length}</div>
            <a href="#review" onClick={jump('review')} className="inline-block pt-1 text-blue-700 hover:underline dark:text-blue-400">去做本讲自测 →</a>
          </div>
        </div>
      </aside>
    </div>
  );
};
