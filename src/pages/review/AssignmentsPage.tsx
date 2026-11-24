import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { ALL_QUESTIONS, HANDS_ON_ASSIGNMENTS, TUTORIALS, WRITTEN_ASSIGNMENTS, waKey } from '../../data/review';
import { LectureTag } from '../../components/review/ReviewBits';
import { PageHeader } from './PageHeader';

const KIND = {
  calc: { label: '计算', cls: 'bg-blue-50 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300' },
  concept: { label: '概念', cls: 'bg-stone-100 text-stone-700 dark:bg-zinc-800 dark:text-zinc-300' },
  derivation: { label: '推导', cls: 'bg-violet-50 text-violet-800 dark:bg-violet-950/50 dark:text-violet-300' },
  code: { label: '编程', cls: 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300' },
} as const;

const unique = (ids: string[]) => Array.from(new Set(ids));

/** Number of original practice questions mirroring each WA question, keyed like "WA3 Q5". */
const STYLE_COUNT = ALL_QUESTIONS.reduce<Record<string, number>>((acc, q) => {
  const k = waKey(q.style);
  if (k) {
    acc[k] = (acc[k] ?? 0) + 1;
    acc[k.split(' ')[0]] = (acc[k.split(' ')[0]] ?? 0) + 1;
  }
  return acc;
}, {});

export const AssignmentsPage: React.FC = () => (
  <div className="space-y-8 pb-12">
    <PageHeader
      kicker="Assignments ↔ Lectures"
      title="作业与讲次对照"
      description="老师说期末题与书面作业相近，所以 WA 是最重要的复习材料。下表只列出每题考查的知识点（不复述原题与答案），点击讲次标签跳到对应讲义模块，或直接练习同类型的原创题。"
    />

    <section className="space-y-4">
      <h2 className="font-serif-display text-xl font-semibold text-stone-950 dark:text-zinc-100">书面作业 (Written Assignments)</h2>
      {WRITTEN_ASSIGNMENTS.map((wa) => {
        const lectures = unique(wa.items.flatMap((i) => i.lectureIds));
        return (
          <div key={wa.id} className="rounded-lg border border-stone-200 bg-white dark:border-zinc-800 dark:bg-[#11151d] overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-200 bg-stone-50/70 px-4 py-2.5 dark:border-zinc-800 dark:bg-zinc-900/60">
              <div>
                <div className="text-[16px] font-semibold text-stone-900 dark:text-zinc-100">{wa.title}</div>
                <div className="font-mono text-[12px] text-stone-500 dark:text-zinc-400">{wa.scope}</div>
              </div>
              <Link
                to={STYLE_COUNT[wa.id.toUpperCase()] ? `/review/quiz?mode=all&style=${wa.id.toUpperCase()}` : `/review/quiz?mode=all&l=${lectures.join(',')}`}
                className="inline-flex items-center gap-1 rounded-md bg-stone-900 px-2.5 py-1 text-[13px] font-medium text-white hover:bg-stone-800 dark:bg-blue-600 dark:hover:bg-blue-500"
              >
                {STYLE_COUNT[wa.id.toUpperCase()] ? `练 ${wa.id.toUpperCase()} 题型（${STYLE_COUNT[wa.id.toUpperCase()]}）` : '练习同范围题目'} <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <table className="w-full text-[15px]">
              <tbody className="divide-y divide-stone-100 dark:divide-zinc-800/80">
                {wa.items.map((item) => (
                  <tr key={item.label}>
                    <td className="w-12 px-4 py-2 font-mono text-[13px] font-semibold text-stone-500 dark:text-zinc-400">{item.label}</td>
                    <td className="px-2 py-2 text-stone-700 dark:text-zinc-300">{item.topic}</td>
                    <td className="w-14 px-2 py-2">
                      <span className={`rounded px-1.5 py-0.5 text-[11.5px] ${KIND[item.kind].cls}`}>{KIND[item.kind].label}</span>
                    </td>
                    <td className="px-4 py-2 text-right whitespace-nowrap">
                      {(() => {
                        const key = `${wa.id.toUpperCase()} ${item.label}`;
                        const n = STYLE_COUNT[key];
                        return n ? (
                          <Link
                            to={`/review/quiz?mode=all&style=${encodeURIComponent(key)}`}
                            className="mr-2 rounded-md border border-blue-300 px-2 py-0.5 text-[12.5px] text-blue-700 hover:bg-blue-50 dark:border-blue-800 dark:text-blue-400 dark:hover:bg-blue-950/40"
                          >
                            练这类题 {n}
                          </Link>
                        ) : null;
                      })()}
                      <span className="inline-flex gap-1">
                        {item.lectureIds.map((id) => (
                          <LectureTag key={id} lectureId={id} />
                        ))}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      })}
    </section>

    <section className="space-y-3">
      <h2 className="font-serif-display text-xl font-semibold text-stone-950 dark:text-zinc-100">动手作业 (Hands-on Assignments)</h2>
      <p className="text-[15px] text-stone-600 dark:text-zinc-400">
        12 个 HA 分 7 组，同组二选一；HA12 依赖 HA7。这里列出每个 HA 涉及、且可能以概念题形式出现在期末的知识点。
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {HANDS_ON_ASSIGNMENTS.map((ha) => (
          <div key={ha.id} className="rounded-lg border border-stone-200 bg-white p-4 dark:border-zinc-800 dark:bg-[#11151d] space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="text-[15.5px] font-semibold text-stone-900 dark:text-zinc-100">{ha.title}</div>
                <div className="font-mono text-[11.5px] text-stone-500 dark:text-zinc-400">
                  Group {ha.group}
                  {ha.tutorial ? ` · ${ha.tutorial}` : ''}
                </div>
              </div>
              <span className="inline-flex gap-1">
                {ha.lectureIds.map((id) => (
                  <LectureTag key={id} lectureId={id} />
                ))}
              </span>
            </div>
            <ul className="list-disc pl-5 text-[14px] text-stone-600 dark:text-zinc-400 space-y-0.5">
              {ha.focus.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>

    <section className="space-y-3">
      <h2 className="font-serif-display text-xl font-semibold text-stone-950 dark:text-zinc-100">Tutorials</h2>
      <div className="rounded-lg border border-stone-200 bg-white divide-y divide-stone-100 dark:border-zinc-800 dark:bg-[#11151d] dark:divide-zinc-800/80">
        {TUTORIALS.map((t) => (
          <div key={t.title} className="flex items-center justify-between gap-3 px-4 py-2 text-[15px]">
            <span className="text-stone-700 dark:text-zinc-300">{t.title}</span>
            <span className="inline-flex gap-1">
              {t.lectureIds.map((id) => (
                <LectureTag key={id} lectureId={id} />
              ))}
            </span>
          </div>
        ))}
      </div>
    </section>
  </div>
);
