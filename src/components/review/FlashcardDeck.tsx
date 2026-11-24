import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { TaggedCard } from '../../data/review';
import { Rating, rateCard, schedule, useProgress } from '../../utils/progress';
import { RichText } from '../RichText';
import { LectureTag } from './ReviewBits';

interface FlashcardDeckProps {
  cards: TaggedCard[];
  /** Shown when the queue is empty. */
  emptyHint?: string;
  onFinished?: () => void;
}

const RATINGS: { rating: Rating; label: string; key: string; cls: string }[] = [
  { rating: 'again', label: '忘了', key: '1', cls: 'border-red-300 text-red-700 hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950/40' },
  { rating: 'hard', label: '模糊', key: '2', cls: 'border-amber-300 text-amber-800 hover:bg-amber-50 dark:border-amber-900 dark:text-amber-300 dark:hover:bg-amber-950/40' },
  { rating: 'good', label: '记得', key: '3', cls: 'border-emerald-300 text-emerald-800 hover:bg-emerald-50 dark:border-emerald-900 dark:text-emerald-300 dark:hover:bg-emerald-950/40' },
  { rating: 'easy', label: '很熟', key: '4', cls: 'border-blue-300 text-blue-800 hover:bg-blue-50 dark:border-blue-900 dark:text-blue-300 dark:hover:bg-blue-950/40' },
];

const fmtInterval = (d: number) => (d === 0 ? '本轮再现' : d === 1 ? '1 天后' : `${d} 天后`);

/**
 * Runs a spaced-repetition session over the given cards. "忘了" puts the
 * card back at the end of the current session; other ratings schedule it.
 */
export const FlashcardDeck: React.FC<FlashcardDeckProps> = ({ cards, emptyHint, onFinished }) => {
  const progress = useProgress();
  const [queue, setQueue] = useState<TaggedCard[]>(cards);
  const [flipped, setFlipped] = useState(false);
  const [done, setDone] = useState(0);
  const [total] = useState(cards.length);

  // restart when the deck definition changes (e.g. different lecture filter)
  const deckKey = useMemo(() => cards.map((c) => c.id).join('|'), [cards]);
  useEffect(() => {
    setQueue(cards);
    setFlipped(false);
    setDone(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deckKey]);

  const current = queue[0];

  const rate = useCallback(
    (rating: Rating) => {
      if (!current) return;
      rateCard(current.id, rating);
      setFlipped(false);
      setQueue((q) => {
        const [head, ...rest] = q;
        if (rating === 'again') return [...rest, head];
        return rest;
      });
      if (rating !== 'again') setDone((d) => d + 1);
    },
    [current]
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) return;
      if (!current) return;
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        setFlipped((f) => !f);
      } else if (flipped && ['1', '2', '3', '4'].includes(e.key)) {
        rate(RATINGS[Number(e.key) - 1].rating);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [current, flipped, rate]);

  useEffect(() => {
    if (!current && total > 0) onFinished?.();
  }, [current, total, onFinished]);

  if (!current) {
    return (
      <div className="rounded-lg border border-stone-200 bg-white p-8 text-center dark:border-zinc-800 dark:bg-[#11151d]">
        <div className="font-serif-display text-lg font-semibold text-stone-900 dark:text-zinc-100">
          {total > 0 ? `本轮完成：${done} 张卡片` : '现在没有需要复习的卡片'}
        </div>
        <p className="mt-2 text-sm text-stone-500 dark:text-zinc-400">
          {emptyHint ?? '到期的卡片会在之后自动出现。可以切换到「全部浏览」继续练习。'}
        </p>
        {total > 0 && (
          <button
            onClick={() => {
              setQueue(cards);
              setDone(0);
            }}
            className="mt-4 inline-flex items-center gap-1.5 rounded-md border border-stone-300 px-3 py-1.5 text-[13px] text-stone-700 hover:bg-stone-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800 cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            再过一遍
          </button>
        )}
      </div>
    );
  }

  const prev = progress.cards[current.id];
  const pct = total ? Math.round((done / total) * 100) : 0;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3 font-mono text-[12px] text-stone-500 dark:text-zinc-400">
        <span>
          已完成 {done} / {total} · 队列剩余 {queue.length}
        </span>
        <span className="hidden sm:inline">空格翻面 · 1–4 评分</span>
      </div>
      <div className="h-1 w-full overflow-hidden rounded bg-stone-200 dark:bg-zinc-800">
        <div className="h-full bg-blue-600 transition-all" style={{ width: `${pct}%` }} />
      </div>

      <button
        onClick={() => setFlipped((f) => !f)}
        aria-label={flipped ? '显示问题' : '显示答案'}
        className="block w-full min-h-[14rem] rounded-lg border border-stone-200 bg-white p-6 text-left shadow-sm transition hover:border-stone-300 dark:border-zinc-800 dark:bg-[#11151d] dark:hover:border-zinc-700 cursor-pointer"
      >
        <div className="flex items-center justify-between gap-2">
          <LectureTag lectureId={current.lectureId} link={false} />
          <span className="font-mono text-[11.5px] uppercase tracking-wider text-stone-400">
            {flipped ? 'Answer' : 'Question'}
            {prev ? ` · 已复习 ${prev.reps} 次` : ' · 新卡片'}
          </span>
        </div>
        <div className="mt-4 text-[17px] font-medium leading-relaxed text-stone-900 dark:text-zinc-100 math-prose">
          <RichText text={current.front} />
        </div>
        {flipped ? (
          <div className="mt-4 border-t border-stone-200 pt-4 text-[16px] leading-[1.85] text-stone-700 dark:border-zinc-800 dark:text-zinc-300 math-prose">
            <RichText text={current.back} />
          </div>
        ) : (
          <div className="mt-6 text-[13px] text-stone-400 dark:text-zinc-500">先自己回答，再点击或按空格查看答案</div>
        )}
      </button>

      {flipped && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {RATINGS.map((r) => (
            <button
              key={r.rating}
              onClick={() => rate(r.rating)}
              className={`rounded-md border bg-white px-3 py-2 text-left text-sm transition dark:bg-zinc-900 cursor-pointer ${r.cls}`}
            >
              <div className="flex items-center justify-between font-medium">
                <span>{r.label}</span>
                <kbd className="font-mono text-[11px] opacity-60">{r.key}</kbd>
              </div>
              <div className="mt-0.5 font-mono text-[11.5px] opacity-70">{fmtInterval(schedule(prev, r.rating).interval)}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
