import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { LECTURES, LECTURE_GROUPS } from '../data/lectures';
import { ALL_CARDS, ALL_QUESTIONS, getReviewPack } from '../data/review';
import { isDue, useProgress } from '../utils/progress';
import { StatusDot } from '../components/review/ReviewBits';

const PILLARS = [
  { tag: '01 · KEY POINTS', title: '考点速记与公式默写', body: '每讲 4–7 条必记结论和核心公式，可遮挡公式做主动回忆。' },
  { tag: '02 · FLASHCARDS', title: '间隔重复抽认卡', body: '按「忘了 / 模糊 / 记得 / 很熟」评分，自动安排下次复习。' },
  { tag: '03 · PRACTICE', title: 'WA 题型原创练习与错题本', body: '计算题换数字重做，简答题对照要点自评，答错自动收录。' },
  { tag: '04 · EXPLORE', title: '交互探索与深度推导', body: '22 个可拖动的交互组件，配合零跳步推导、数值验算器与浏览器内 Python。' },
];

const WEIGHT = { core: '核心', support: '基础', optional: '选读' } as const;

export const HomePage: React.FC = () => {
  const progress = useProgress();
  const due = ALL_CARDS.filter((c) => isDue(c.id, progress)).length;
  const mastered = LECTURES.filter((l) => progress.lectures[l.id]?.status === 'mastered').length;

  return (
    <div className="space-y-12 pb-12">
      <header className="border-b border-stone-200 pb-8 dark:border-zinc-800 space-y-4">
        <div className="font-mono text-[13px] font-medium uppercase tracking-widest text-blue-700 dark:text-blue-400">
          Machine Learning · Interactive Review Companion
        </div>
        <h1 className="font-serif-display text-3xl sm:text-5xl font-semibold tracking-tight text-stone-950 dark:text-zinc-50 leading-tight">
          机器学习复习手册
        </h1>
        <p className="text-sm sm:text-base leading-relaxed text-stone-600 dark:text-zinc-400 max-w-2xl">
          按讲义 L00–L16 逐讲组织（与课程 Slides 文件编号一致），覆盖机器学习基础、深度学习、Transformer 与 LLM、图像生成模型和强化学习。每讲先给考点速记，再给推导、图解、验算器和代码，最后用抽认卡与练习题自测。
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <Link
            to="/review"
            className="inline-flex items-center gap-2 rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white hover:bg-stone-800 dark:bg-blue-600 dark:hover:bg-blue-500"
          >
            进入复习中心
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            to="/review/flashcards"
            className="inline-flex items-center gap-2 rounded-md border border-stone-300 bg-white px-4 py-2 text-sm text-stone-700 hover:bg-stone-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            今日卡片（{due}）
          </Link>
          <span className="font-mono text-[12px] text-stone-500 dark:text-zinc-400">
            已掌握 {mastered}/{LECTURES.length} 讲 · {ALL_CARDS.length} 张卡片 · {ALL_QUESTIONS.length} 道练习
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 pt-3 text-[13px]">
          {PILLARS.map((p) => (
            <div key={p.tag} className="rounded-lg border border-stone-200 bg-white p-3.5 dark:border-zinc-800 dark:bg-[#11151d]">
              <div className="font-mono text-[11.5px] font-semibold text-blue-700 dark:text-blue-400">{p.tag}</div>
              <div className="mt-1 font-semibold text-stone-900 dark:text-zinc-100">{p.title}</div>
              <p className="mt-1 leading-relaxed text-stone-600 dark:text-zinc-400">{p.body}</p>
            </div>
          ))}
        </div>
      </header>

      <section className="space-y-9">
        {LECTURE_GROUPS.map((group) => {
          const items = LECTURES.filter((l) => l.partGroup === group);
          return (
            <div key={group} className="space-y-3">
              <h2 className="font-mono text-[13px] font-semibold uppercase tracking-wider text-stone-500 dark:text-zinc-400 border-b border-stone-200 pb-2 dark:border-zinc-800">
                {group}
              </h2>
              <div className="divide-y divide-stone-200 rounded-lg border border-stone-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-[#11151d]">
                {items.map((lec) => {
                  const pack = getReviewPack(lec.id);
                  return (
                    <Link
                      key={lec.id}
                      to={`/lecture/${lec.slug}`}
                      className="group flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 transition hover:bg-stone-50 dark:hover:bg-zinc-900/60"
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-baseline gap-3">
                          <span className="flex w-14 shrink-0 items-center gap-1.5 font-mono text-[13px] font-bold text-blue-700 dark:text-blue-400">
                            <StatusDot lectureId={lec.id} />
                            {lec.code}
                          </span>
                          <h3 className="font-serif-display text-base sm:text-lg font-semibold text-stone-900 group-hover:text-blue-700 dark:text-zinc-100 dark:group-hover:text-blue-400 transition-colors">
                            {lec.titleZh}
                          </h3>
                        </div>
                        <div className="pl-[4.25rem] text-[13px] text-stone-500 dark:text-zinc-400">{lec.titleEn}</div>
                        <div className="pl-[4.25rem] pt-1 flex flex-wrap gap-x-3 gap-y-1 font-mono text-[11.5px] text-stone-400 dark:text-zinc-500">
                          <span className={lec.examWeight === 'core' ? 'text-red-700/80 dark:text-red-400/80' : ''}>{WEIGHT[lec.examWeight]}</span>
                          {lec.derivations.length > 0 && <span>{lec.derivations.length} 组推导</span>}
                          {pack && <span>{pack.flashcards.length} 卡片</span>}
                          {pack && <span>{pack.quiz.length} 练习</span>}
                          {lec.verifierId && <span>验算器</span>}
                          {lec.sandbox && <span>Python</span>}
                        </div>
                      </div>
                      <ArrowRight className="h-4 w-4 shrink-0 text-stone-400 transition-transform group-hover:translate-x-1 group-hover:text-blue-700 dark:group-hover:text-blue-400 self-end sm:self-center" />
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </section>
    </div>
  );
};
