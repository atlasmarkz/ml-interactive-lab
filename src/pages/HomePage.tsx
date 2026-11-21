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

        {/* Three Disciplined Pillars */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3 text-xs">
          <div className="rounded-lg border border-stone-200 bg-white p-4 dark:border-zinc-800 dark:bg-[#11151d]">
            <div className="font-mono text-[11px] font-semibold text-blue-700 dark:text-blue-400">
              01 · ZERO-SKIP PROOFS
            </div>
            <div className="mt-1 font-semibold text-stone-900 dark:text-zinc-100">
              零跳步交互数学推导链
            </div>
            <p className="mt-1 leading-relaxed text-stone-600 dark:text-zinc-400">
              每条等式变形均标注微积分/线性代数/概率论依据，支持切换「逐行自测」核对推导。
            </p>
          </div>

          <div className="rounded-lg border border-stone-200 bg-white p-4 dark:border-zinc-800 dark:bg-[#11151d]">
            <div className="font-mono text-[11px] font-semibold text-blue-700 dark:text-blue-400">
              02 · NUMERICAL VERIFIERS
            </div>
            <div className="mt-1 font-semibold text-stone-900 dark:text-zinc-100">
              可编辑矩阵与梯度验算器
            </div>
            <p className="mt-1 leading-relaxed text-stone-600 dark:text-zinc-400">
              直接输入自己的练习题矩阵（OLS、Logistic GD、MLP Backprop、Conv、Attention、CLIP、PPO），精确展开全部中间结果。
            </p>
          </div>

          <div className="rounded-lg border border-stone-200 bg-white p-4 dark:border-zinc-800 dark:bg-[#11151d]">
            <div className="font-mono text-[11px] font-semibold text-blue-700 dark:text-blue-400">
              03 · CODE & PITFALLS
            </div>
            <div className="mt-1 font-semibold text-stone-900 dark:text-zinc-100">
              公式-代码联动与工程排坑
            </div>
            <p className="mt-1 leading-relaxed text-stone-600 dark:text-zinc-400">
              对照公式与 NumPy/PyTorch 张量 Shape，直击数值稳定、掩码顺序、梯度检查与 eval 模式等作业高频坑点。
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
