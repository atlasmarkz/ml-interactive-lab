import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Code2,
  Cpu,
  Play,
  Rotate3D,
  Sparkles,
} from 'lucide-react';
import { CURRICULUM } from '../data/curriculum';
import { Hero3DManifold } from '../components/Labs3D/Hero3DManifold';
import { MathFormula } from '../components/MathFormula';

const ACCENT_RING: Record<string, string> = {
  blue: 'from-blue-500 to-cyan-500',
  emerald: 'from-emerald-500 to-teal-500',
  violet: 'from-violet-500 to-purple-500',
  indigo: 'from-sky-500 to-indigo-500',
  rose: 'from-rose-500 to-pink-500',
  amber: 'from-amber-500 to-orange-500',
};

const SIGNATURE_FORMULAS: Record<number, { latex: string; studioLabel: string }> = {
  0: {
    latex: String.raw`H(P,Q) = H(P) + D_{\text{KL}}(P\|Q)`,
    studioLabel: '3D 概率单纯形熵穹顶',
  },
  1: {
    latex: String.raw`L(\mathbf{w}) = \|\mathbf{X}\mathbf{w}-\mathbf{y}\|^2 + \lambda\|\mathbf{w}\|^2`,
    studioLabel: '3D 正则曲面平谷变凸碗',
  },
  2: {
    latex: String.raw`\theta_t = \theta_{t-1} - \eta \frac{\hat{m}_t}{\sqrt{\hat{v}_t}+\epsilon}`,
    studioLabel: '3D 鞍点与病态峡谷轨迹',
  },
  3: {
    latex: String.raw`\text{softmax}\!\left(\frac{QK^\top}{\sqrt{d_k}}\right)V`,
    studioLabel: '3D Attention 空间 & CLIP 球面',
  },
  4: {
    latex: String.raw`\mathbf{x}_t = \sqrt{\bar\alpha_t}\mathbf{x}_0 + \sqrt{1-\bar\alpha_t}\boldsymbol{\epsilon}`,
    studioLabel: '3D 瑞士卷扩散 & VAE 潜球',
  },
  5: {
    latex: String.raw`V^*(s) = \max_a\big[R + \gamma V^*(s')\big]`,
    studioLabel: '3D Bellman 价值山峰',
  },
};

export const HomePage: React.FC = () => {
  return (
    <div className="space-y-12 pb-10">
      {/* Hero Banner with Live 3D Neural Manifold */}
      <section className="relative overflow-hidden rounded-3xl border border-slate-200/90 bg-white/95 p-7 sm:p-10 shadow-lg shadow-slate-200/40 dark:border-slate-800 dark:bg-[#0b101d]/95 dark:shadow-none">
        <div className="pointer-events-none absolute -top-28 -right-24 h-80 w-80 rounded-full bg-gradient-to-br from-blue-500/20 via-violet-500/20 to-emerald-500/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-28 -left-24 h-72 w-72 rounded-full bg-gradient-to-tr from-rose-500/15 via-amber-500/10 to-sky-500/15 blur-3xl" />

        <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7 space-y-5">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-200/80 bg-blue-50/90 px-3.5 py-1 text-xs font-semibold text-blue-700 dark:border-blue-800/80 dark:bg-blue-950/60 dark:text-blue-300">
              <Sparkles className="h-3.5 w-3.5" />
              公式驱动 · 3D 高维可视化 · 浏览器内真实运行
            </div>

            <h1 className="font-serif-display text-3xl sm:text-5xl font-semibold tracking-tight text-slate-900 dark:text-white leading-[1.14]">
              把关键公式变成
              <span className="bg-gradient-to-r from-blue-600 via-indigo-500 to-emerald-500 bg-clip-text text-transparent">
                可旋转、可消融、可运行
              </span>
              的高维直觉
            </h1>

            <p className="text-sm sm:text-base leading-relaxed text-slate-600 dark:text-slate-300">
              每一章都以<strong>「公式驱动 3D 演播室」</strong>为核心：直接点击公式中的正则项、缩放项、KL 散度或折扣因子开关进行<strong>实时消融实验</strong>，在可 360° 旋转的三维流形与超球面上亲眼看见每一个数学符号如何主宰模型行为。
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <Link
                to={`/part/${CURRICULUM[3].slug}`}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-md shadow-blue-600/25 hover:from-blue-500 hover:to-indigo-500 transition"
              >
                <Rotate3D className="h-4 w-4" />
                体验 3D Transformer & CLIP 球面
              </Link>
              <Link
                to={`/part/${CURRICULUM[0].slug}`}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                <Play className="h-4 w-4 fill-current" />
                从 Part 0 系统学习
              </Link>
            </div>
          </div>

          <div className="lg:col-span-5 flex justify-center">
            <Hero3DManifold />
          </div>
        </div>

        {/* Feature Pillar Strip */}
        <div className="relative mt-9 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 border-t border-slate-200/80 pt-7 dark:border-slate-800/80">
          {[
            {
              icon: Rotate3D,
              color: 'bg-sky-50 text-sky-600 dark:bg-sky-950/60 dark:text-sky-400',
              title: '6 座 3D 公式消融演播室',
              desc: '自由旋转 3D 损失山谷、CLIP 超球面、瑞士卷扩散流形与价值山峰。',
            },
            {
              icon: Sparkles,
              color: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400',
              title: '讲义级全覆盖 + 分步手算',
              desc: '对齐全课程 PPT 深度细节 + 6 组对标作业与期末的渐进推导演练。',
            },
            {
              icon: Code2,
              color: 'bg-violet-50 text-violet-600 dark:bg-violet-950/60 dark:text-violet-400',
              title: '13 组公式 ↔ 代码双向联动',
              desc: '悬停公式子项同步高亮 NumPy / PyTorch 实现并展示张量 Shape。',
            },
            {
              icon: Cpu,
              color: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400',
              title: 'Pyodide 浏览器 Python 沙盒',
              desc: '纯前端零后端运行真实 NumPy 算法并实时绘制收敛曲线。',
            },
          ].map((feat) => {
            const Icon = feat.icon;
            return (
              <div key={feat.title} className="flex items-start gap-3">
                <div className={`rounded-xl p-2.5 shrink-0 ${feat.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-900 dark:text-slate-100">{feat.title}</div>
                  <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    {feat.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Curriculum Knowledge Graph / Part Cards */}
      <section className="space-y-5">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              六大核心演播室 · Part 0 → Part 5
            </h2>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              每张卡片均标出本节核心控制方程与专属 3D 高维演播室，点击即刻进入交互探索
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {CURRICULUM.map((part) => {
            const sig = SIGNATURE_FORMULAS[part.partNumber];
            const grad = ACCENT_RING[part.accentColor] ?? ACCENT_RING.blue;
            return (
              <Link
                key={part.id}
                to={`/part/${part.slug}`}
                className="group relative flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white/95 overflow-hidden shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-500/10 hover:border-blue-400/70 dark:border-slate-800 dark:bg-[#0b101d]/95 dark:hover:border-blue-500/60"
              >
                {/* Top gradient hairline */}
                <div className={`h-1.5 w-full bg-gradient-to-r ${grad}`} />

                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`inline-flex items-center rounded-lg bg-gradient-to-r px-2.5 py-0.5 font-mono text-[11px] font-bold text-white shadow-xs ${grad}`}
                      >
                        PART {part.partNumber}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-sky-300">
                        <Rotate3D className="h-3 w-3" />
                        {sig.studioLabel}
                      </span>
                    </div>

                    <h3 className="mt-3.5 text-lg font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {part.titleZh}
                    </h3>
                    <div className="text-[11px] font-medium text-slate-400">{part.titleEn}</div>

                    {/* Signature Formula Box */}
                    <div className="mt-3 rounded-xl border border-slate-200/70 bg-slate-50/80 px-2.5 py-2 text-center dark:border-slate-800 dark:bg-slate-950/80">
                      <MathFormula latex={sig.latex} displayMode={false} className="text-xs text-slate-800 dark:text-slate-200" />
                    </div>

                    <p className="mt-3 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                      {part.tagline}
                    </p>
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-100 pt-3.5 text-xs font-semibold text-blue-600 dark:border-slate-800 dark:text-blue-400">
                    <span>进入交互演播室</span>
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
};
