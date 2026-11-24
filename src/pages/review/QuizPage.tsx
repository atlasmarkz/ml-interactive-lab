import React, { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ArrowRight, RotateCcw } from 'lucide-react';
import { ALL_QUESTIONS, TaggedQuestion } from '../../data/review';
import { QuizKind } from '../../types/review';
import { useProgress } from '../../utils/progress';
import { QuizCard } from '../../components/review/QuizCard';
import { LectureFilter, shuffle, useLectureSelection } from '../../components/review/LectureFilter';
import { PageHeader } from './PageHeader';

type Mode = 'random' | 'wrong' | 'all';

const KINDS: [QuizKind, string][] = [
  ['calc', '计算'],
  ['mcq', '选择'],
  ['short', '简答'],
];

export const QuizPage: React.FC = () => {
  const progress = useProgress();
  const [params, setParams] = useSearchParams();
  const [selected, setSelected] = useLectureSelection();
  const mode = (params.get('mode') as Mode) || 'random';
  const setMode = (m: Mode) => {
    const p = new URLSearchParams(params);
    p.set('mode', m);
    setParams(p, { replace: true });
    restart();
  };
  const [kinds, setKinds] = useState<QuizKind[]>(['calc', 'mcq', 'short']);
  const [size, setSize] = useState(10);
  const [round, setRound] = useState(0);
  const [pos, setPos] = useState(0);
  const [score, setScore] = useState({ right: 0, answered: 0 });

  const restart = () => {
    setRound((r) => r + 1);
    setPos(0);
    setScore({ right: 0, answered: 0 });
  };

  const wrongIds = useMemo(
    () => new Set(Object.entries(progress.quiz).filter(([, s]) => !s.lastCorrect).map(([id]) => id)),
    [progress.quiz]
  );

  const pool = useMemo(
    () =>
      ALL_QUESTIONS.filter(
        (q) => (selected.length === 0 || selected.includes(q.lectureId)) && kinds.includes(q.kind)
      ),
    [selected, kinds]
  );

  // Fixed at session start so answering (which updates progress) doesn't reshuffle.
  const session: TaggedQuestion[] = useMemo(() => {
    if (mode === 'wrong') return pool.filter((q) => wrongIds.has(q.id));
    if (mode === 'all') return pool;
    return shuffle(pool).slice(0, size);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pool, mode, size, round]);

  const current = session[pos];
  const finished = session.length > 0 && pos >= session.length;

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const q of ALL_QUESTIONS) {
      if (mode === 'wrong' ? wrongIds.has(q.id) : true) c[q.lectureId] = (c[q.lectureId] ?? 0) + 1;
    }
    return c;
  }, [mode, wrongIds]);

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        kicker="Practice & Mistakes"
        title="练习与错题本"
        description="题目按 WA / 期末题型原创：计算题用不同的数字，简答题对应常考概念。选择题自动判分；计算与简答题先写答案、再对照参考答案自评。答错的题自动进入错题本，直到你下次答对。"
      />

      <LectureFilter selected={selected} onChange={(ids) => { setSelected(ids); restart(); }} counts={counts} />

      <div className="flex flex-wrap items-center gap-3 text-[13px]">
        <div className="inline-flex rounded-md border border-stone-200 bg-white p-0.5 dark:border-zinc-800 dark:bg-zinc-900">
          {([
            ['random', '随机抽题'],
            ['wrong', `错题本 (${wrongIds.size})`],
            ['all', '按讲全部'],
          ] as [Mode, string][]).map(([m, label]) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`rounded px-3 py-1 cursor-pointer ${mode === m ? 'bg-stone-900 text-white dark:bg-blue-600' : 'text-stone-600 dark:text-zinc-400'}`}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="inline-flex items-center gap-1.5">
          {KINDS.map(([k, label]) => (
            <label key={k} className="inline-flex items-center gap-1 cursor-pointer text-stone-600 dark:text-zinc-400">
              <input
                type="checkbox"
                checked={kinds.includes(k)}
                onChange={() => {
                  setKinds((ks) => (ks.includes(k) ? (ks.length > 1 ? ks.filter((x) => x !== k) : ks) : [...ks, k]));
                  restart();
                }}
              />
              {label}
            </label>
          ))}
        </div>
        {mode === 'random' && (
          <label className="inline-flex items-center gap-1.5 text-stone-600 dark:text-zinc-400">
            题数
            <select
              value={size}
              onChange={(e) => { setSize(Number(e.target.value)); restart(); }}
              className="rounded border border-stone-200 bg-white px-1.5 py-0.5 dark:border-zinc-800 dark:bg-zinc-900"
            >
              {[5, 10, 20, 40].map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </label>
        )}
        <button onClick={restart} className="inline-flex items-center gap-1 text-blue-700 hover:underline dark:text-blue-400 cursor-pointer">
          <RotateCcw className="h-3.5 w-3.5" /> 重新开始
        </button>
      </div>

      {session.length === 0 ? (
        <div className="rounded-lg border border-stone-200 bg-white p-8 text-center text-sm text-stone-500 dark:border-zinc-800 dark:bg-[#11151d] dark:text-zinc-400">
          {mode === 'wrong' ? '错题本是空的：所选范围内没有答错的题目。' : '所选范围内没有题目。'}
        </div>
      ) : finished ? (
        <div className="rounded-lg border border-stone-200 bg-white p-8 text-center dark:border-zinc-800 dark:bg-[#11151d] space-y-3">
          <div className="font-serif-display text-2xl font-semibold text-stone-900 dark:text-zinc-100">
            {score.right} / {score.answered} 答对
          </div>
          <p className="text-sm text-stone-500 dark:text-zinc-400">
            {score.answered < session.length ? `有 ${session.length - score.answered} 题跳过未作答。` : ''}
            答错的题已加入错题本，可切换到「错题本」重练。
          </p>
          <button onClick={restart} className="rounded-md bg-stone-900 px-4 py-2 text-[13px] font-medium text-white dark:bg-blue-600 cursor-pointer">
            再来一组
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between font-mono text-[12px] text-stone-500 dark:text-zinc-400">
            <span>第 {pos + 1} / {session.length} 题</span>
            <span>本轮 {score.right} / {score.answered} 答对</span>
          </div>
          <QuizCard
            key={`${round}-${current.id}`}
            question={current}
            index={pos}
            showLecture
            onAnswered={(ok) => setScore((s) => ({ right: s.right + (ok ? 1 : 0), answered: s.answered + 1 }))}
          />
          <div className="flex justify-end">
            <button
              onClick={() => setPos((p) => p + 1)}
              className="inline-flex items-center gap-1.5 rounded-md border border-stone-300 bg-white px-3.5 py-1.5 text-[13px] font-medium text-stone-700 hover:bg-stone-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 cursor-pointer"
            >
              {pos + 1 < session.length ? '下一题' : '查看结果'}
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
