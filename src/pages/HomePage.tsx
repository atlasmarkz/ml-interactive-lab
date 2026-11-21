import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Code2,
  Cpu,
  LineChart,
  Play,
  Sparkles,
} from 'lucide-react';
import { CURRICULUM } from '../data/curriculum';

const ACCENT_RING: Record<string, string> = {
  blue: 'from-blue-500 to-cyan-500',
  emerald: 'from-emerald-500 to-teal-500',
  violet: 'from-violet-500 to-purple-500',
  indigo: 'from-indigo-500 to-blue-500',
  rose: 'from-rose-500 to-pink-500',
  amber: 'from-amber-500 to-orange-500',
};

export const HomePage: React.FC = () => {
  return (
    <div className="space-y-12">
      {/* Hero Banner */}
      <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-8 sm:p-12 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-gradient-to-br from-blue-500/15 via-violet-500/15 to-emerald-500/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-gradient-to-tr from-rose-500/10 via-amber-500/10 to-blue-500/10 blur-3xl" />

        <div className="relative max-w-3xl space-y-5">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50/80 px-3.5 py-1 text-xs font-semibold text-blue-700 dark:border-blue-900 dark:bg-blue-950/60 dark:text-blue-300">
            <Sparkles className="h-3.5 w-3.5" />
            从概率信息论到 Transformer、Diffusion 与强化学习 · 全流程可交互
          </div>

          <h1 className="font-serif-display text-3xl sm:text-5xl font-semibold tracking-tight text-slate-900 dark:text-white leading-[1.15]">
            把机器学习公式变成
            <span className="bg-gradient-to-r from-blue-600 via-violet-600 to-emerald-600 bg-clip-text text-transparent">
              可拖动、可解剖、可运行
            </span>
            的直觉
          </h1>

          <p className="text-sm sm:text-base leading-relaxed text-slate-600 dark:text-slate-300">
            不再死记硬背静态 PPT。在这里你可以直接点击画布观察多项式过拟合与 Bias-Variance 分解、亲手解剖反向传播计算图与 Self-Attention 掩码、对比 Diffusion 与 Flow Matching 粒子轨迹，并在浏览器内零配置运行真实的 Python / NumPy 算法代码。
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link
              to={`/part/${CURRICULUM[0].slug}`}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 transition dark:bg-blue-600 dark:hover:bg-blue-500"
            >
              <Play className="h-4 w-4 fill-current" />
              从 Part 0 开始探索
            </Link>
            <Link
              to={`/part/${CURRICULUM[3].slug}`}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              直达 Transformer / CLIP 实验室
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        {/* Feature Pillar Strip */}
        <div className="relative mt-10 grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-slate-200/80 pt-7 dark:border-slate-800">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-blue-50 p-2.5 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
              <LineChart className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-semibold">10 个 60fps 交互实验室</div>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                原生 Canvas/SVG 实时演算，拖动超参数与画布加点零延迟反馈。
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-violet-50 p-2.5 text-violet-600 dark:bg-violet-950/60 dark:text-violet-400">
              <Code2 className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-semibold">公式 ↔ 代码双向联动</div>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                悬停公式子项自动高亮 NumPy / PyTorch 代码行并显示张量 Shape。
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-emerald-50 p-2.5 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
              <Cpu className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-semibold">浏览器内真实运行 Python</div>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                基于 Pyodide WebAssembly，在本地浏览器直接运行 NumPy 并实时画图。
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Curriculum Knowledge Graph / Part Cards */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              完整知识路线图 · Part 0 → Part 5
            </h2>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              按逻辑递进串联现代机器学习核心脉络，点击任意章节进入交互实验室
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {CURRICULUM.map((part) => (
            <Link
              key={part.id}
              to={`/part/${part.slug}`}
              className="group relative flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md hover:border-blue-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-blue-700"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span
                    className={`inline-flex items-center rounded-lg bg-gradient-to-r px-2.5 py-1 font-mono text-xs font-bold text-white shadow-xs ${
                      ACCENT_RING[part.accentColor] ?? ACCENT_RING.blue
                    }`}
                  >
                    PART {part.partNumber}
                  </span>
                  <ArrowRight className="h-4 w-4 text-slate-400 transition-transform group-hover:translate-x-1 group-hover:text-blue-600" />
                </div>

                <h3 className="mt-4 text-lg font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {part.titleZh}
                </h3>
                <div className="text-xs font-medium text-slate-400">{part.titleEn}</div>

                <p className="mt-3 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                  {part.tagline}
                </p>
              </div>

              <div className="mt-5 flex flex-wrap gap-1.5 border-t border-slate-100 pt-4 dark:border-slate-800">
                {part.topics.map((t) => (
                  <span
                    key={t}
                    className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
};
