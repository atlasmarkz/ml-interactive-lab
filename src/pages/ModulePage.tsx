import React, { useEffect, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  BookMarked,
  Calculator,
  CheckCircle2,
  ChevronDown,
  Code2,
  HelpCircle,
  Lightbulb,
  Rotate3D,
  Sliders,
  Terminal,
} from 'lucide-react';
import { CURRICULUM, getPartBySlug } from '../data/curriculum';
import { LECTURE_NOTES } from '../data/lectureNotes';
import { WORKED_EXAMPLES } from '../data/workedExamples';
import { FormulaCodeSync } from '../components/FormulaCodeSync';
import { PythonSandbox } from '../components/PythonSandbox';
import { LectureDeepDive } from '../components/LectureDeepDive';
import { WorkedExamples } from '../components/WorkedExamples';
import { Studio0InfoFormula } from '../components/Labs3D/Studio0InfoFormula';
import { Studio3DLossSurface } from '../components/Labs3D/Studio3DLossSurface';
import { Studio3DTransformerCLIP } from '../components/Labs3D/Studio3DTransformerCLIP';
import { Studio3DGenerativeManifold } from '../components/Labs3D/Studio3DGenerativeManifold';
import { Studio3DRLValueMountain } from '../components/Labs3D/Studio3DRLValueMountain';
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

const render3DStudioForPart = (partNumber: number) => {
  switch (partNumber) {
    case 0:
      return <Studio0InfoFormula />;
    case 1:
      return <Studio3DLossSurface mode="regularization" />;
    case 2:
      return <Studio3DLossSurface mode="optimization" />;
    case 3:
      return <Studio3DTransformerCLIP />;
    case 4:
      return <Studio3DGenerativeManifold />;
    case 5:
      return <Studio3DRLValueMountain />;
    default:
      return null;
  }
};

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

const JUMP_ITEMS = [
  { id: 'sec-3d', label: '3D 公式演播室', icon: Rotate3D },
  { id: 'sec-labs', label: '交互实验台', icon: Sliders },
  { id: 'sec-notes', label: '讲义精讲', icon: BookMarked },
  { id: 'sec-sync', label: '公式↔代码', icon: Code2 },
  { id: 'sec-worked', label: '手算演练', icon: Calculator },
  { id: 'sec-sandbox', label: 'Python 沙盒', icon: Terminal },
];

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
    <div className="space-y-10 pb-14">
      {/* Module Hero Header */}
      <section className="rounded-3xl border border-slate-200/90 bg-white/95 p-6 sm:p-8 shadow-sm dark:border-slate-800 dark:bg-[#0b101d]/95 space-y-5">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-2.5 py-1 font-mono font-bold text-white shadow-xs">
            PART {part.partNumber}
          </span>
          <span className="font-medium text-slate-500 dark:text-slate-400">{part.titleEn}</span>
        </div>

        <div>
          <h1 className="font-serif-display text-3xl sm:text-4xl font-semibold tracking-tight text-slate-900 dark:text-white">
            {part.titleZh}
          </h1>
          <p className="mt-2 text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-3xl leading-relaxed">
            {part.tagline}
          </p>
        </div>

        {/* Key Takeaways */}
        <div className="rounded-2xl border border-blue-200/70 bg-blue-50/45 p-4.5 dark:border-blue-900/50 dark:bg-blue-950/20">
          <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-700 dark:text-blue-300">
            <Lightbulb className="h-4 w-4" />
            本节核心直觉 (Key Takeaways)
          </div>
          <ul className="space-y-1.5 text-xs sm:text-sm text-slate-700 dark:text-slate-200">
            {part.keyTakeaways.map((tip, i) => (
              <li key={i} className="flex items-start gap-2 leading-relaxed">
                <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Sticky Glassmorphic Section Jump Bar */}
      <div className="sticky top-[57px] z-20 -mx-1 px-1 py-2">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar rounded-2xl border border-slate-200/90 bg-white/85 p-1.5 shadow-sm backdrop-blur-xl dark:border-slate-800 dark:bg-[#0b101d]/85">
          {JUMP_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <a
                key={item.id}
                href={`#${item.id}`}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-900 hover:text-white transition dark:text-slate-300 dark:hover:bg-blue-600 dark:hover:text-white"
              >
                <Icon className="h-3.5 w-3.5" />
                {item.label}
              </a>
            );
          })}
        </div>
      </div>

      {/* Section 0: Flagship 3D Formula-Driven Studio */}
      <section id="sec-3d" className="scroll-mt-32 space-y-4">
        <div className="flex items-center gap-2.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 text-white shadow-xs">
            <Rotate3D className="h-4 w-4" />
          </span>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              公式驱动 · 3D 高维可视化演播室
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              点击公式中的彩色符号或消融开关，在可 360° 旋转的高维几何空间里亲眼见证每个数学项的核心作用
            </p>
          </div>
        </div>
        {render3DStudioForPart(part.partNumber)}
      </section>

      {/* Section 1: 2D Interactive Visual Labs */}
      <section id="sec-labs" className="scroll-mt-32 space-y-4">
        <div className="flex items-center gap-2.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-blue-600 font-mono text-xs font-bold text-white">
            1
          </span>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            专题交互实验台 · 精细解剖算法细节
          </h2>
        </div>
        {renderLabsForPart(part.partNumber)}
      </section>

      {/* Section 2: Lecture-Depth Structured Deep Dive */}
      {lectureSections.length > 0 && (
        <section id="sec-notes" className="scroll-mt-32 space-y-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-indigo-600 font-mono text-xs font-bold text-white">
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
      <section id="sec-sync" className="scroll-mt-32 space-y-5">
        <div className="flex items-center gap-2.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-violet-600 font-mono text-xs font-bold text-white">
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
        <section id="sec-worked" className="scroll-mt-32 space-y-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-rose-600 font-mono text-xs font-bold text-white">
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
      <section id="sec-sandbox" className="scroll-mt-32 space-y-4">
        <div className="flex items-center gap-2.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-emerald-600 font-mono text-xs font-bold text-white">
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
        <div className="flex items-center gap-2.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-amber-500 font-mono text-xs font-bold text-white">
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
                className="rounded-2xl border border-slate-200 bg-white overflow-hidden dark:border-slate-800 dark:bg-[#0b101d]"
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
                  <div className="border-t border-slate-100 bg-slate-50/70 px-5 py-4 text-xs sm:text-sm leading-relaxed text-slate-600 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-300">
                    {q.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Prev / Next Footer Navigation */}
      <nav className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-200/80 pt-6 dark:border-slate-800">
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
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:from-blue-500 hover:to-indigo-500"
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
