import React, { useMemo, useState } from 'react';
import { ALL_CARDS } from '../../data/review';
import { isDue, useProgress } from '../../utils/progress';
import { FlashcardDeck } from '../../components/review/FlashcardDeck';
import { LectureFilter, shuffle, useLectureSelection } from '../../components/review/LectureFilter';
import { PageHeader } from './PageHeader';

type Mode = 'due' | 'all';

export const FlashcardsPage: React.FC = () => {
  const progress = useProgress();
  const [selected, setSelected] = useLectureSelection();
  const [mode, setMode] = useState<Mode>('due');
  const [round, setRound] = useState(0);

  const inScope = useMemo(
    () => ALL_CARDS.filter((c) => selected.length === 0 || selected.includes(c.lectureId)),
    [selected]
  );

  const dueCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const c of ALL_CARDS) if (isDue(c.id, progress)) counts[c.lectureId] = (counts[c.lectureId] ?? 0) + 1;
    return counts;
    // recompute only when the session changes, so the counts don't jump mid-session
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round, selected, mode]);

  // Freeze the deck at session start: rating a card must not reshuffle the queue.
  const deck = useMemo(() => {
    const pool = mode === 'due' ? inScope.filter((c) => isDue(c.id, progress)) : inScope;
    // due mode: cards seen before first (most overdue), then new ones; browse mode: random
    if (mode === 'all') return shuffle(pool);
    const seen = pool.filter((c) => progress.cards[c.id]).sort((a, b) => progress.cards[a.id].due - progress.cards[b.id].due);
    const fresh = pool.filter((c) => !progress.cards[c.id]);
    return [...seen, ...fresh];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inScope, mode, round]);

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        kicker="Spaced Repetition"
        title="抽认卡"
        description="先回答、再翻面、按记忆程度评分。「忘了」的卡片本轮会再出现，其余按间隔重复算法安排下次复习时间。进度保存在本浏览器中。"
      />

      <LectureFilter selected={selected} onChange={(ids) => { setSelected(ids); setRound((r) => r + 1); }} counts={mode === 'due' ? dueCounts : undefined} />

      <div className="flex flex-wrap items-center gap-2">
        <div className="inline-flex rounded-md border border-stone-200 bg-white p-0.5 text-xs dark:border-zinc-800 dark:bg-zinc-900">
          {([
            ['due', '到期复习'],
            ['all', '全部浏览（随机）'],
          ] as [Mode, string][]).map(([m, label]) => (
            <button
              key={m}
              onClick={() => { setMode(m); setRound((r) => r + 1); }}
              className={`rounded px-3 py-1 cursor-pointer ${mode === m ? 'bg-stone-900 text-white dark:bg-blue-600' : 'text-stone-600 dark:text-zinc-400'}`}
            >
              {label}
            </button>
          ))}
        </div>
        <span className="font-mono text-[11px] text-stone-500 dark:text-zinc-400">
          本轮 {deck.length} 张 · 范围内共 {inScope.length} 张
        </span>
      </div>

      <FlashcardDeck
        key={`${mode}-${round}`}
        cards={deck}
        emptyHint={mode === 'due' ? '所选范围内没有到期的卡片。可以切换到「全部浏览」，或扩大复习范围。' : undefined}
      />
    </div>
  );
};
