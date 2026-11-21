import React, { useEffect, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  HelpCircle,
  Lightbulb,
} from 'lucide-react';
import { CURRICULUM, getPartBySlug } from '../data/curriculum';
import { LECTURE_NOTES } from '../data/lectureNotes';
import { WORKED_EXAMPLES } from '../data/workedExamples';
import { FormulaCodeSync } from '../components/FormulaCodeSync';
import { PythonSandbox } from '../components/PythonSandbox';
import { LectureDeepDive } from '../components/LectureDeepDive';
import { WorkedExamples } from '../components/WorkedExamples';
import { Part0InfoTheoryLab } from '../components/Labs/Part0InfoTheoryLab';
import { Part1RegressionLab } from '../components/Labs/Part1RegressionLab';
import { Part1SoftmaxGDALab } from '../components/Labs/Part1SoftmaxGDALab';
import { Part1DeepDiveLab } from '../components/Labs/Part1DeepDiveLab';
import { Part2BackpropOptLab } from '../components/Labs/Part2BackpropOptLab';
import { Part2ConvRNNLab } from '../components/Labs/Part2ConvRNNLab';
import { Part2NormActivationLab } from '../components/Labs/Part2NormActivationLab';
import { Part2CNNCalcLSTMLab } from '../components/Labs/Part2CNNCalcLSTMLab';
import { Part3TransformerLab } from '../components/Labs/Part3TransformerLab';
import { Part3ViTCLIPLab } from '../components/Labs/Part3ViTCLIPLab';
import { Part3LLMDeepLab } from '../components/Labs/Part3LLMDeepLab';
import { Part4VAEGANLab } from '../components/Labs/Part4VAEGANLab';
import { Part4DiffusionFlowLab } from '../components/Labs/Part4DiffusionFlowLab';
import { Part4GenLossLab } from '../components/Labs/Part4GenLossLab';
import { Part5RLGridLab } from '../components/Labs/Part5RLGridLab';
import { Part5CliffRLDeepLab } from '../components/Labs/Part5CliffRLDeepLab';

interface ModulePageProps {
  isDark: boolean;
}

const renderLabsForPart = (partNumber: number) => {
  switch (partNumber) {
    case 0:
      return <Part0InfoTheoryLab />;
    case 1:
      return (
        <div className="space-y-6">
          <Part1RegressionLab />
          <Part1SoftmaxGDALab />
          <Part1DeepDiveLab />
        </div>
      );
    case 2:
      return (
        <div className="space-y-6">
          <Part2BackpropOptLab />
          <Part2NormActivationLab />
          <Part2ConvRNNLab />
          <Part2CNNCalcLSTMLab />
        </div>
      );
    case 3:
      return (
        <div className="space-y-6">
          <Part3TransformerLab />
          <Part3LLMDeepLab />
          <Part3ViTCLIPLab />
        </div>
      );
    case 4:
      return (
        <div className="space-y-6">
          <Part4VAEGANLab />
          <Part4DiffusionFlowLab />
          <Part4GenLossLab />
        </div>
      );
    case 5:
      return (
        <div className="space-y-6">
          <Part5RLGridLab />
          <Part5CliffRLDeepLab />
        </div>
      );
    default:
      return null;
  }
};

export const ModulePage: React.FC<ModulePageProps> = ({ isDark }) => {
  const { slug } = useParams<{ slug: string }>();
  const part = slug ? getPartBySlug(slug) : undefined;
  const [openQ, setOpenQ] = useState<number | null>(0);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setOpenQ(0);
  }, [slug]);

  if (!part) {
    return <Navigate to="/" replace />;
  }

  const idx = CURRICULUM.findIndex((p) => p.id === part.id);
  const prevPart = idx > 0 ? CURRICULUM[idx - 1] : null;
  const nextPart = idx < CURRICULUM.length - 1 ? CURRICULUM[idx + 1] : null;
  const lectureSections = LECTURE_NOTES[part.partNumber] ?? [];
  const workedExamples = WORKED_EXAMPLES[part.partNumber] ?? [];

  return (
    <div className="space-y-10 pb-12">
      {/* Module Hero Header */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="rounded-lg bg-slate-900 px-2.5 py-1 font-mono font-bold text-white dark:bg-blue-600">
            PART {part.partNumber}
          </span>
          <span className="font-medium text-slate-500 dark:text-slate-400">{part.titleEn}</span>
        </div>

        <h1 className="font-serif-display text-3xl sm:text-4xl font-semibold tracking-tight text-slate-900 dark:text-white">
          {part.titleZh}
        </h1>
        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-3xl leading-relaxed">
          {part.tagline}
        </p>

        {/* Key Takeaways Card */}
        <div className="rounded-2xl border border-blue-200/80 bg-blue-50/40 p-5 dark:border-blue-900/50 dark:bg-blue-950/20">
          <div className="mb-2.5 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-700 dark:text-blue-300">
            <Lightbulb className="h-4 w-4" />
            本节核心直觉 (Key Takeaways)
          </div>
          <ul className="space-y-2 text-xs sm:text-sm text-slate-700 dark:text-slate-200">
            {part.keyTakeaways.map((tip, i) => (
              <li key={i} className="flex items-start gap-2 leading-relaxed">
                <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Section 1: Interactive Visual Labs */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 font-mono text-xs font-bold text-white">
            1
          </span>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            动态可视化实验室 · 拖动参数建立几何直觉
          </h2>
        </div>
        {renderLabsForPart(part.partNumber)}
      </section>

      {/* Section 2: Lecture-Depth Structured Deep Dive */}
      {lectureSections.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 font-mono text-xs font-bold text-white">
              2
            </span>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              讲义级知识点全解 · 对齐每讲 PPT 细节与横向对比
            </h2>
          </div>
          <LectureDeepDive sections={lectureSections} />
        </section>
      )}

      {/* Section 3: Bidirectional Formula <-> Code Sync */}
      <section className="space-y-5">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-violet-600 font-mono text-xs font-bold text-white">
            3
          </span>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            公式 ↔ 代码双向联动 · 张量维度与实现对照
          </h2>
        </div>
        <div className="space-y-6">
          {part.formulaSpecs.map((spec) => (
            <FormulaCodeSync key={spec.id} spec={spec} />
          ))}
        </div>
      </section>

      {/* Section 4: Interactive Worked Examples */}
      {workedExamples.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-rose-600 font-mono text-xs font-bold text-white">
              4
            </span>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              分步手算演练 · 对标书面作业与期末高频推导题型
            </h2>
          </div>
          <WorkedExamples examples={workedExamples} />
        </section>
      )}

      {/* Section 5: In-Browser Python/NumPy Sandbox */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 font-mono text-xs font-bold text-white">
            5
          </span>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            浏览器内在线运行 · 改写超参数实测原理
          </h2>
        </div>
        <PythonSandbox spec={part.sandbox} isDark={isDark} />
      </section>

      {/* Section 6: Thought Questions Accordion */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500 font-mono text-xs font-bold text-white">
            6
          </span>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            思考题自测 · 检验真正理解
          </h2>
        </div>
        <div className="space-y-3">
          {part.thoughtQuestions.map((q, i) => {
            const isOpen = openQ === i;
            return (
              <div
                key={i}
                className="rounded-2xl border border-slate-200 bg-white overflow-hidden dark:border-slate-800 dark:bg-slate-900"
              >
                <button
                  onClick={() => setOpenQ(isOpen ? null : i)}
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-sm font-semibold text-slate-900 hover:bg-slate-50 dark:text-slate-100 dark:hover:bg-slate-800/60 cursor-pointer"
                >
                  <span className="flex items-center gap-2.5">
                    <HelpCircle className="h-4 w-4 shrink-0 text-amber-500" />
                    {q.question}
                  </span>
                  <ChevronDown
                    className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="border-t border-slate-100 bg-slate-50/70 px-5 py-4 text-xs sm:text-sm leading-relaxed text-slate-600 dark:border-slate-800 dark:bg-slate-950/50 dark:text-slate-300">
                    {q.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Prev / Next Footer Navigation */}
      <nav className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-200 pt-6 dark:border-slate-800">
        {prevPart ? (
          <Link
            to={`/part/${prevPart.slug}`}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <ArrowLeft className="h-4 w-4" />
            Part {prevPart.partNumber}: {prevPart.titleZh}
          </Link>
        ) : (
          <div />
        )}

        {nextPart ? (
          <Link
            to={`/part/${nextPart.slug}`}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-500"
          >
            下一章 · Part {nextPart.partNumber}: {nextPart.titleZh}
            <ArrowRight className="h-4 w-4" />
          </Link>
        ) : (
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-emerald-500"
          >
            已完成全 6 Parts · 返回全景路线图
            <ArrowRight className="h-4 w-4" />
          </Link>
        )}
      </nav>
    </div>
  );
};
