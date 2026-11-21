import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { LECTURES, LECTURE_GROUPS } from '../data/lectures';

export const HomePage: React.FC = () => {
  return (
    <div className="space-y-12 pb-12">
      {/* Editorial Title Block */}
      <header className="border-b border-stone-200 pb-8 dark:border-zinc-800 space-y-4">
        <div className="font-mono text-xs font-medium uppercase tracking-widest text-blue-700 dark:text-blue-400">
          Interactive Machine Learning Monograph
        </div>
        <h1 className="font-serif-display text-3xl sm:text-5xl font-semibold tracking-tight text-stone-950 dark:text-zinc-50 leading-tight">
          机器学习原理深度研学手册
        </h1>
        <p className="text-sm sm:text-base leading-relaxed text-stone-600 dark:text-zinc-400 max-w-2xl">
          专为攻克晦涩课程讲义、书面数学推导（WA）与工程代码实现（HA）而构建。按 Lecture 逐讲组织，消除讲义跳步，提供可自定义输入矩阵的精确数值验算器、零跳步交互推导链与 NumPy / PyTorch 逐行对照。
        </p>

        {/* Four Disciplined Pillars */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 pt-3 text-xs">
          <div className="rounded-lg border border-stone-200 bg-white p-3.5 dark:border-zinc-800 dark:bg-[#11151d]">
            <div className="font-mono text-[10.5px] font-semibold text-blue-700 dark:text-blue-400">
              01 · ZERO-SKIP PROOFS
            </div>
            <div className="mt-1 font-semibold text-stone-900 dark:text-zinc-100">
              零跳步数学推导链
            </div>
            <p className="mt-1 leading-relaxed text-stone-600 dark:text-zinc-400">
              每步变形标注定理依据，支持逐行自测核对晦涩 PPT 证明。
            </p>
          </div>

          <div className="rounded-lg border border-stone-200 bg-white p-3.5 dark:border-zinc-800 dark:bg-[#11151d]">
            <div className="font-mono text-[10.5px] font-semibold text-blue-700 dark:text-blue-400">
              02 · 3D & SCIENTIFIC FIGS
            </div>
            <div className="mt-1 font-semibold text-stone-900 dark:text-zinc-100">
              高维几何与学术图解
            </div>
            <p className="mt-1 leading-relaxed text-stone-600 dark:text-zinc-400">
              可旋转 3D 凸曲面、XOR 升维超平面、CLIP 超球面、瑞士卷扩散与 Bellman 山峰。
            </p>
          </div>

          <div className="rounded-lg border border-stone-200 bg-white p-3.5 dark:border-zinc-800 dark:bg-[#11151d]">
            <div className="font-mono text-[10.5px] font-semibold text-blue-700 dark:text-blue-400">
              03 · MATRIX VERIFIERS
            </div>
            <div className="mt-1 font-semibold text-stone-900 dark:text-zinc-100">
              可编辑矩阵验算器
            </div>
            <p className="mt-1 leading-relaxed text-stone-600 dark:text-zinc-400">
              输入自己的 WA 矩阵与参数，展开精确中间矩阵与梯度校验。
            </p>
          </div>

          <div className="rounded-lg border border-stone-200 bg-white p-3.5 dark:border-zinc-800 dark:bg-[#11151d]">
            <div className="font-mono text-[10.5px] font-semibold text-blue-700 dark:text-blue-400">
              04 · CODE & PYODIDE
            </div>
            <div className="mt-1 font-semibold text-stone-900 dark:text-zinc-100">
              公式代码联动与排坑
            </div>
            <p className="mt-1 leading-relaxed text-stone-600 dark:text-zinc-400">
              NumPy / PyTorch 逐行映射、Shape 追踪与浏览器内真实运行验证。
            </p>
          </div>
        </div>
      </header>

      {/* Lecture-by-Lecture Academic Table of Contents */}
      <section className="space-y-9">
        {LECTURE_GROUPS.map((group) => {
          const items = LECTURES.filter((l) => l.partGroup === group);
          return (
            <div key={group} className="space-y-3">
              <h2 className="font-mono text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-zinc-400 border-b border-stone-200 pb-2 dark:border-zinc-800">
                {group}
              </h2>

              <div className="divide-y divide-stone-200 rounded-lg border border-stone-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-[#11151d]">
                {items.map((lec) => (
                  <Link
                    key={lec.id}
                    to={`/lecture/${lec.slug}`}
                    className="group flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 transition hover:bg-stone-50 dark:hover:bg-zinc-900/60"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-baseline gap-3">
                        <span className="font-mono text-xs font-bold text-blue-700 dark:text-blue-400 w-11 shrink-0">
                          {lec.code}
                        </span>
                        <h3 className="font-serif-display text-base sm:text-lg font-semibold text-stone-900 group-hover:text-blue-700 dark:text-zinc-100 dark:group-hover:text-blue-400 transition-colors">
                          {lec.titleZh}
                        </h3>
                      </div>
                      <div className="pl-14 text-xs text-stone-500 dark:text-zinc-400">
                        {lec.titleEn}
                      </div>
                      <div className="pl-14 pt-1 flex flex-wrap gap-x-4 gap-y-1 font-mono text-[10.5px] text-stone-400 dark:text-zinc-500">
                        <span>{lec.derivations.length} 组零跳步推导</span>
                        <span>·</span>
                        <span>可编辑数值验算器</span>
                        <span>·</span>
                        <span>{lec.formulaSpecs.length} 组公式↔代码对照</span>
                      </div>
                    </div>

                    <ArrowRight className="h-4 w-4 shrink-0 text-stone-400 transition-transform group-hover:translate-x-1 group-hover:text-blue-700 dark:group-hover:text-blue-400 self-end sm:self-center" />
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
      </section>
    </div>
  );
};
