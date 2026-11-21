import React, { useEffect } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, ArrowRight, CheckSquare } from 'lucide-react';
import { LECTURES, getLectureBySlug } from '../data/lectures';
import { VerifierId } from '../types/curriculum';
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

interface ModulePageProps {
  isDark: boolean;
}

const renderFigure = (code: string, isDark: boolean) => {
  if (code === 'L01' || code === 'L02.1' || code === 'L02.2' || code === 'L03') {
    return <LinearFigures lectureCode={code} isDark={isDark} />;
  }
  if (code === 'L04' || code === 'L05' || code === 'L06' || code === 'L07') {
    return <DeepOptFigures lectureCode={code} isDark={isDark} />;
  }
  if (code === 'L08' || code === 'L09' || code === 'L10' || code === 'L11') {
    return <TransformerGenRLFigures lectureCode={code} isDark={isDark} />;
  }
  return null;
};

const renderVerifier = (id: VerifierId) => {
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
      return <GenerativeRLVerifier mode={id} />;
  }
};

export const ModulePage: React.FC<ModulePageProps> = ({ isDark }) => {
  const { slug } = useParams<{ slug: string }>();
  const lec = slug ? getLectureBySlug(slug) : undefined;

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [slug]);

  if (!lec) {
    return <Navigate to="/" replace />;
  }

  const idx = LECTURES.findIndex((l) => l.id === lec.id);
  const prev = idx > 0 ? LECTURES[idx - 1] : null;
  const next = idx < LECTURES.length - 1 ? LECTURES[idx + 1] : null;

  return (
    <article className="space-y-11 pb-16">
      {/* Lecture Masthead */}
      <header className="border-b border-stone-200 pb-7 dark:border-zinc-800 space-y-4">
        <div className="flex flex-wrap items-center gap-2 font-mono text-xs text-stone-500 dark:text-zinc-400">
          <span className="font-bold text-blue-700 dark:text-blue-400">{lec.code}</span>
          <span>/</span>
          <span>{lec.partGroup}</span>
        </div>

        <div>
          <h1 className="font-serif-display text-3xl sm:text-4xl font-semibold tracking-tight text-stone-950 dark:text-zinc-50 leading-tight">
            {lec.titleZh}
          </h1>
          <div className="mt-1 text-sm font-medium text-stone-500 dark:text-zinc-400">
            {lec.titleEn}
          </div>
        </div>

        <p className="text-[14.5px] math-prose text-stone-700 dark:text-zinc-300">
          <RichText text={lec.abstract} />
        </p>

        {/* Lecture Syllabus Checklist */}
        <div className="rounded-lg border border-stone-200 bg-white p-4 dark:border-zinc-800 dark:bg-[#11151d]">
          <div className="mb-2.5 flex items-center gap-1.5 font-mono text-[11px] font-semibold uppercase tracking-wider text-stone-500 dark:text-zinc-400">
            <CheckSquare className="h-3.5 w-3.5" />
            本讲 PPT 核心知识点自查表 (Syllabus Scope)
          </div>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 text-[13px] leading-[1.75] text-stone-700 dark:text-zinc-300">
            {lec.readingChecklist.map((item, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="font-mono text-[10px] text-stone-400 mt-1 shrink-0">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span>
                  <RichText text={item} />
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Clean In-Page TOC Strip */}
        <nav className="flex flex-wrap gap-2 pt-1 font-mono text-[11px]">
          {[
            { href: '#derivations', label: '§1 零跳步推导链' },
            { href: '#figures', label: '§2 几何与高维图解' },
            { href: '#verifier', label: '§3 数值矩阵验算器' },
            { href: '#concepts', label: '§4 核心概念与对照' },
            { href: '#code-sync', label: '§5 公式↔代码实现' },
            { href: '#pitfalls', label: '§6 易错与作业警示' },
            ...(lec.sandbox ? [{ href: '#sandbox', label: '§7 Python 实测' }] : []),
          ].map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="rounded border border-stone-200 bg-white px-2.5 py-1 text-stone-600 hover:border-blue-500 hover:text-blue-700 transition dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:border-blue-500 dark:hover:text-blue-400"
            >
              {link.label}
            </a>
          ))}
        </nav>
      </header>

      {/* §1 Zero-Skip Mathematical Derivations */}
      <section id="derivations" className="scroll-mt-20 space-y-5">
        <h2 className="font-serif-display text-xl font-semibold text-stone-950 dark:text-zinc-100 border-b border-stone-200 pb-2 dark:border-zinc-800">
          §1 零跳步数学推导链 (Rigorous Derivations)
        </h2>
        <div className="space-y-6">
          {lec.derivations.map((d) => (
            <DerivationChain key={d.id} spec={d} />
          ))}
        </div>
      </section>

      {/* §2 Publication-Grade Geometric & High-Dimensional Figures */}
      <section id="figures" className="scroll-mt-20 space-y-4">
        <h2 className="font-serif-display text-xl font-semibold text-stone-950 dark:text-zinc-100 border-b border-stone-200 pb-2 dark:border-zinc-800">
          §2 几何直觉与高维交互图解 (Scientific Figures)
        </h2>
        {renderFigure(lec.code, isDark)}
      </section>

      {/* §3 Editable Numerical Matrix & Gradient Verifier */}
      <section id="verifier" className="scroll-mt-20 space-y-4">
        <h2 className="font-serif-display text-xl font-semibold text-stone-950 dark:text-zinc-100 border-b border-stone-200 pb-2 dark:border-zinc-800">
          §3 可编辑数值与矩阵验算器 (Numerical Verifier)
        </h2>
        {renderVerifier(lec.verifierId)}
      </section>

      {/* §4 Key Concept Notes & Comparison Tables */}
      <section id="concepts" className="scroll-mt-20 space-y-5">
        <h2 className="font-serif-display text-xl font-semibold text-stone-950 dark:text-zinc-100 border-b border-stone-200 pb-2 dark:border-zinc-800">
          §4 核心概念精讲与横向对比 (Concepts & Comparisons)
        </h2>
        <div className="space-y-5">
          {lec.concepts.map((c, idx) => (
            <div
              key={idx}
              className="rounded-lg border border-stone-200 bg-white p-5 dark:border-zinc-800 dark:bg-[#11151d] space-y-3"
            >
              <h3 className="text-[15px] font-semibold text-stone-900 dark:text-zinc-100">
                <RichText text={c.heading} />
              </h3>
              <p className="text-[13.5px] math-prose text-stone-600 dark:text-zinc-300">
                <RichText text={c.body} />
              </p>
              {c.latex && (
                <div className="rounded border border-stone-200/80 bg-stone-50/70 px-3 py-2 text-center dark:border-zinc-800 dark:bg-zinc-950/70">
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

      {/* §5 Formula <-> Implementation Sync */}
      <section id="code-sync" className="scroll-mt-20 space-y-5">
        <h2 className="font-serif-display text-xl font-semibold text-stone-950 dark:text-zinc-100 border-b border-stone-200 pb-2 dark:border-zinc-800">
          §5 公式与代码精确映射 (Formula → Code)
        </h2>
        <div className="space-y-6">
          {lec.formulaSpecs.map((spec) => (
            <FormulaCodeSync key={spec.id} spec={spec} />
          ))}
        </div>
      </section>

      {/* §6 Pitfalls & WA/HA Checkpoints */}
      <section id="pitfalls" className="scroll-mt-20 space-y-4">
        <h2 className="font-serif-display text-xl font-semibold text-stone-950 dark:text-zinc-100 border-b border-stone-200 pb-2 dark:border-zinc-800">
          §6 易错点与作业/考场警示 (Common Pitfalls)
        </h2>
        <div className="space-y-3">
          {lec.pitfalls.map((p, i) => (
            <div
              key={i}
              className="rounded-lg border border-stone-200 border-l-3 border-l-red-700 bg-white p-4 dark:border-zinc-800 dark:border-l-red-500 dark:bg-[#11151d]"
            >
              <div className="flex items-center gap-2 text-[13.5px] font-semibold text-stone-900 dark:text-zinc-100">
                <AlertTriangle className="h-3.5 w-3.5 text-red-700 dark:text-red-400 shrink-0" />
                <span>
                  <RichText text={p.title} />
                </span>
              </div>
              <p className="mt-1.5 text-[13px] math-prose text-stone-600 dark:text-zinc-300">
                <RichText text={p.detail} />
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* §7 Optional Executable Python/NumPy Verification */}
      {lec.sandbox && (
        <section id="sandbox" className="scroll-mt-20 space-y-4">
          <h2 className="font-serif-display text-xl font-semibold text-stone-950 dark:text-zinc-100 border-b border-stone-200 pb-2 dark:border-zinc-800">
            §7 浏览器内 NumPy 实测验证 (Executable Verification)
          </h2>
          <PythonSandbox spec={lec.sandbox} isDark={isDark} />
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
            to="/"
            className="inline-flex items-center gap-2 rounded-md border border-stone-300 bg-white px-4 py-2 text-xs font-medium text-stone-700 hover:bg-stone-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
          >
            返回全部目录索引
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        )}
      </nav>
    </article>
  );
};
