import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Flame, Layers, ListChecks, RotateCcw } from 'lucide-react';
import { LECTURES, LECTURE_GROUPS } from '../../data/lectures';
import { ALL_CARDS, ALL_QUESTIONS } from '../../data/review';
import { LectureStatus, isDue, streak, useProgress } from '../../utils/progress';
import { STATUS_META } from './ReviewBits';

const STATUS_ORDER: LectureStatus[] = ['mastered', 'learning', 'new'];
const STATUS_FILL: Record<LectureStatus, string> = {
  mastered: 'bg-emerald-600 dark:bg-emerald-500',
  learning: 'bg-amber-500',
  new: 'bg-stone-200 dark:bg-zinc-700',
};

/**
 * Course-wide review snapshot shown beside a lecture: lecture mastery by Part,
 * due cards, practice accuracy, mistakes, streak and a suggested next lecture.
 */
export const OverallProgress: React.FC<{ currentId?: string; compact?: boolean }> = ({ currentId, compact = false }) => {
  const p = useProgress();

  const s = useMemo(() => {
    const status = (id: string): LectureStatus => p.lectures[id]?.status ?? 'new';
    const counts = { mastered: 0, learning: 0, new: 0 } as Record<LectureStatus, number>;
    LECTURES.forEach((l) => counts[status(l.id)]++);
    const due = ALL_CARDS.filter((c) => isDue(c.id, p)).length;
    const seenCards = ALL_CARDS.filter((c) => p.cards[c.id]).length;
    const answered = ALL_QUESTIONS.filter((q) => p.quiz[q.id]).length;
    const attempts = Object.values(p.quiz).reduce((n, q) => n + q.attempts, 0);
    const correct = Object.values(p.quiz).reduce((n, q) => n + q.correct, 0);
    const wrong = Object.values(p.quiz).filter((q) => !q.lastCorrect).length;
    // Suggest: the first core lecture (in course order) that is not mastered, preferring ones with mistakes.
    const candidates = LECTURES.filter((l) => l.examWeight !== 'optional' && status(l.id) !== 'mastered' && l.id !== currentId);
    const withMistakes = candidates.find((l) => ALL_QUESTIONS.some((q) => q.lectureId === l.id && p.quiz[q.id] && !p.quiz[q.id].lastCorrect));
    const next = withMistakes ?? candidates.find((l) => status(l.id) === 'learning') ?? candidates[0];
    return { status, counts, due, seenCards, answered, attempts, correct, wrong, next, nextReason: withMistakes ? '有错题' : next && status(next.id) === 'learning' ? '复习中' : '尚未开始' };
  }, [p, currentId]);

  const total = LECTURES.length;
  const pct = Math.round(((s.counts.mastered + 0.5 * s.counts.learning) / total) * 100);

  if (compact) {
    return (
      <div className="space-y-2">
        <div className="section-kicker text-stone-400 dark:text-zinc-500">复习总进度</div>
        <div className="flex h-2 overflow-hidden rounded-full bg-stone-100 dark:bg-zinc-800" title={`已掌握 ${s.counts.mastered} · 复习中 ${s.counts.learning} · 未开始 ${s.counts.new}`}>
          {STATUS_ORDER.slice(0, 2).map((k) => (
            <div key={k} className={STATUS_FILL[k]} style={{ width: `${(s.counts[k] / total) * 100}%` }} />
          ))}
        </div>
        <div className="text-[13px] text-stone-600 dark:text-zinc-400">
          已掌握 {s.counts.mastered}/{total} 讲 · 到期卡片 {s.due}
        </div>
        <Link to="/review" className="inline-block text-[13px] text-blue-700 hover:underline dark:text-blue-400">
          打开复习中心 →
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-5 rounded-xl border border-stone-200 bg-white p-4 dark:border-zinc-800 dark:bg-[#11151d]">
      {/* headline */}
      <div>
        <div className="section-kicker text-stone-400 dark:text-zinc-500">复习总进度</div>
        <div className="mt-1.5 flex items-end gap-2">
          <span className="font-serif-display text-[2.1rem] font-semibold leading-none tabular-nums text-stone-950 dark:text-zinc-50">{pct}%</span>
          <span className="pb-1 text-[12.5px] text-stone-500 dark:text-zinc-400">掌握 = 1，复习中 = ½</span>
        </div>
        <div className="mt-3 flex h-2.5 gap-[2px] overflow-hidden rounded-full bg-stone-100 dark:bg-zinc-800">
          {STATUS_ORDER.slice(0, 2).map((k) =>
            s.counts[k] ? <div key={k} className={`${STATUS_FILL[k]} rounded-full`} style={{ width: `${(s.counts[k] / total) * 100}%` }} /> : null
          )}
        </div>
        <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[12.5px] text-stone-600 dark:text-zinc-400">
          {STATUS_ORDER.map((k) => (
            <span key={k} className="inline-flex items-center gap-1.5">
              <span className={`h-2 w-2 rounded-full ${STATUS_META[k].dot}`} />
              {STATUS_META[k].label} {s.counts[k]}
            </span>
          ))}
        </div>
      </div>

      {/* per Part: one dot per lecture, coloured by status */}
      <div className="space-y-2">
        <div className="section-kicker text-stone-400 dark:text-zinc-500">各 Part</div>
        {LECTURE_GROUPS.map((g) => {
          const items = LECTURES.filter((l) => l.partGroup === g);
          const done = items.filter((l) => s.status(l.id) === 'mastered').length;
          return (
            <div key={g} className="flex items-center gap-2">
              <span className="w-12 shrink-0 font-mono text-[11.5px] text-stone-500 dark:text-zinc-400">{g.split(' · ')[0]}</span>
              <div className="flex flex-1 flex-wrap gap-1">
                {items.map((l) => (
                  <Link
                    key={l.id}
                    to={`/lecture/${l.slug}`}
                    title={`${l.code} ${l.titleZh} · ${STATUS_META[s.status(l.id)].label}`}
                    aria-label={`${l.code} ${STATUS_META[s.status(l.id)].label}`}
                    className={`h-4 min-w-[1.6rem] rounded px-1 text-center font-mono text-[9.5px] leading-4 transition hover:ring-2 hover:ring-blue-400 ${STATUS_FILL[s.status(l.id)]} ${
                      s.status(l.id) === 'new' ? 'text-stone-500 dark:text-zinc-400' : 'text-white'
                    } ${l.id === currentId ? 'ring-2 ring-blue-600 dark:ring-blue-400' : ''}`}
                  >
                    {l.code.replace('L', '')}
                  </Link>
                ))}
              </div>
              <span className="w-8 shrink-0 text-right font-mono text-[11.5px] tabular-nums text-stone-500 dark:text-zinc-400">
                {done}/{items.length}
              </span>
            </div>
          );
        })}
      </div>

      {/* numbers */}
      <div className="grid grid-cols-2 gap-2">
        <Link to="/review/flashcards" className="rounded-lg border border-stone-200 px-2.5 py-2 transition hover:border-blue-500 dark:border-zinc-800">
          <div className="flex items-center gap-1 text-[11.5px] text-stone-500 dark:text-zinc-400">
            <Layers className="h-3 w-3" /> 今日到期卡片
          </div>
          <div className="font-mono text-[17px] font-semibold tabular-nums text-stone-900 dark:text-zinc-100">{s.due}</div>
          <div className="text-[11px] text-stone-400 dark:text-zinc-500">已学 {s.seenCards}/{ALL_CARDS.length}</div>
        </Link>
        <Link to="/review/quiz" className="rounded-lg border border-stone-200 px-2.5 py-2 transition hover:border-blue-500 dark:border-zinc-800">
          <div className="flex items-center gap-1 text-[11.5px] text-stone-500 dark:text-zinc-400">
            <ListChecks className="h-3 w-3" /> 练习正确率
          </div>
          <div className="font-mono text-[17px] font-semibold tabular-nums text-stone-900 dark:text-zinc-100">
            {s.attempts ? `${Math.round((s.correct / s.attempts) * 100)}%` : '—'}
          </div>
          <div className="text-[11px] text-stone-400 dark:text-zinc-500">已做 {s.answered}/{ALL_QUESTIONS.length}</div>
        </Link>
        <Link to="/review/quiz?mode=wrong" className="rounded-lg border border-stone-200 px-2.5 py-2 transition hover:border-blue-500 dark:border-zinc-800">
          <div className="flex items-center gap-1 text-[11.5px] text-stone-500 dark:text-zinc-400">
            <RotateCcw className="h-3 w-3" /> 错题本
          </div>
          <div className="font-mono text-[17px] font-semibold tabular-nums text-stone-900 dark:text-zinc-100">{s.wrong}</div>
          <div className="text-[11px] text-stone-400 dark:text-zinc-500">{s.wrong ? '点此重练' : '暂无错题'}</div>
        </Link>
        <div className="rounded-lg border border-stone-200 px-2.5 py-2 dark:border-zinc-800">
          <div className="flex items-center gap-1 text-[11.5px] text-stone-500 dark:text-zinc-400">
            <Flame className="h-3 w-3" /> 连续复习
          </div>
          <div className="font-mono text-[17px] font-semibold tabular-nums text-stone-900 dark:text-zinc-100">{streak(p)} 天</div>
          <div className="text-[11px] text-stone-400 dark:text-zinc-500">做卡片或练习即计入</div>
        </div>
      </div>

      {/* suggestion */}
      {s.next && (
        <Link
          to={`/lecture/${s.next.slug}`}
          className="group block rounded-lg border border-blue-200 bg-blue-50/60 px-3 py-2.5 transition hover:border-blue-500 dark:border-blue-900 dark:bg-blue-950/25"
        >
          <div className="text-[11.5px] text-blue-700 dark:text-blue-400">建议下一讲 · {s.nextReason}</div>
          <div className="mt-0.5 flex items-center gap-1 text-[13.5px] font-medium text-stone-900 dark:text-zinc-100">
            <span className="font-mono text-blue-700 dark:text-blue-400">{s.next.code}</span>
            <span className="truncate">{s.next.titleZh}</span>
            <ArrowRight className="ml-auto h-3.5 w-3.5 shrink-0 transition group-hover:translate-x-0.5" />
          </div>
        </Link>
      )}

      <Link to="/review" className="inline-flex items-center gap-1 text-[13px] text-blue-700 hover:underline dark:text-blue-400">
        打开复习中心 <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
};
