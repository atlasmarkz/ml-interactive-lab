import React, { useEffect, useState } from 'react';
import { Check, X } from 'lucide-react';
import { TaggedQuestion } from '../../data/review';
import { recordAnswer, useProgress } from '../../utils/progress';
import { RichText } from '../RichText';
import { LectureTag } from './ReviewBits';

const KIND_LABEL = { mcq: '选择', short: '简答', calc: '计算' } as const;

interface QuizCardProps {
  question: TaggedQuestion;
  index?: number;
  showLecture?: boolean;
  onAnswered?: (correct: boolean) => void;
}

/**
 * One practice question. Multiple choice is graded automatically; short and
 * calculation questions are self-graded after revealing the reference answer.
 */
export const QuizCard: React.FC<QuizCardProps> = ({ question: q, index, showLecture = false, onAnswered }) => {
  const progress = useProgress();
  const history = progress.quiz[q.id];
  const [picked, setPicked] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [graded, setGraded] = useState<boolean | null>(null);
  const [draft, setDraft] = useState('');

  useEffect(() => {
    setPicked(null);
    setRevealed(false);
    setGraded(null);
    setDraft('');
  }, [q.id]);

  const grade = (correct: boolean) => {
    if (graded !== null) return;
    setGraded(correct);
    recordAnswer(q.id, correct);
    onAnswered?.(correct);
  };

  const pick = (i: number) => {
    if (revealed) return;
    setPicked(i);
    setRevealed(true);
    grade(i === q.answer);
  };

  return (
    <div className="rounded-lg border border-stone-200 bg-white p-5 dark:border-zinc-800 dark:bg-[#11151d] space-y-3">
      <div className="flex flex-wrap items-center gap-2 font-mono text-[11.5px] text-stone-500 dark:text-zinc-400">
        {index !== undefined && <span className="font-semibold text-stone-700 dark:text-zinc-200">Q{index + 1}</span>}
        <span className="rounded bg-stone-100 px-1.5 py-0.5 dark:bg-zinc-800">{KIND_LABEL[q.kind]}</span>
        {showLecture && <LectureTag lectureId={q.lectureId} />}
        {q.style && <span className="text-stone-400">{q.style}</span>}
        {history && (
          <span className={`ml-auto ${history.lastCorrect ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-700 dark:text-red-400'}`}>
            历史 {history.correct}/{history.attempts} · 上次{history.lastCorrect ? '答对' : '答错'}
          </span>
        )}
      </div>

      <div className="text-[16px] leading-relaxed text-stone-900 dark:text-zinc-100 math-prose">
        <RichText text={q.prompt} />
      </div>

      {q.kind === 'mcq' && q.options && (
        <div className="grid gap-2">
          {q.options.map((opt, i) => {
            const isAnswer = i === q.answer;
            const isPicked = i === picked;
            let cls = 'border-stone-200 hover:border-blue-500 dark:border-zinc-800 dark:hover:border-blue-500';
            if (revealed && isAnswer) cls = 'border-emerald-600 bg-emerald-50 dark:border-emerald-500 dark:bg-emerald-950/40';
            else if (revealed && isPicked) cls = 'border-red-600 bg-red-50 dark:border-red-500 dark:bg-red-950/40';
            else if (revealed) cls = 'border-stone-200 opacity-70 dark:border-zinc-800';
            return (
              <button
                key={i}
                onClick={() => pick(i)}
                disabled={revealed}
                className={`flex items-start gap-2.5 rounded-md border px-3 py-2 text-left text-[15.5px] text-stone-800 transition dark:text-zinc-200 ${cls} ${revealed ? '' : 'cursor-pointer'}`}
              >
                <span className="font-mono text-[12px] text-stone-400 mt-0.5">{String.fromCharCode(65 + i)}</span>
                <span className="flex-1">
                  <RichText text={opt} />
                </span>
                {revealed && isAnswer && <Check className="h-4 w-4 text-emerald-700 dark:text-emerald-400 shrink-0" />}
                {revealed && isPicked && !isAnswer && <X className="h-4 w-4 text-red-700 dark:text-red-400 shrink-0" />}
              </button>
            );
          })}
        </div>
      )}

      {q.kind !== 'mcq' && !revealed && (
        <div className="space-y-2">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={q.kind === 'calc' ? 2 : 3}
            placeholder="写下你的答案或关键步骤（只保存在本页，不会提交）"
            className="w-full rounded-md border border-stone-200 bg-stone-50 px-3 py-2 text-[15px] text-stone-800 placeholder:text-stone-400 focus:border-blue-500 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200"
          />
          <button
            onClick={() => setRevealed(true)}
            className="rounded-md bg-stone-900 px-3 py-1.5 text-[13px] font-medium text-white hover:bg-stone-800 dark:bg-blue-600 dark:hover:bg-blue-500 cursor-pointer"
          >
            查看参考答案
          </button>
        </div>
      )}

      {revealed && (
        <div className="space-y-2 rounded-md border border-stone-200 bg-stone-50/80 p-3.5 text-[15px] leading-[1.8] dark:border-zinc-800 dark:bg-zinc-950/60">
          {q.kind !== 'mcq' && (
            <div className="text-stone-900 dark:text-zinc-100">
              <span className="mr-1.5 font-semibold">参考答案：</span>
              <RichText text={String(q.answer)} />
            </div>
          )}
          <div className="text-stone-600 dark:text-zinc-400">
            <span className="mr-1.5 font-semibold text-stone-700 dark:text-zinc-300">解析：</span>
            <RichText text={q.explanation} />
          </div>
          {q.kind !== 'mcq' && graded === null && (
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-[13px] text-stone-500 dark:text-zinc-400">对照后自评：</span>
              <button
                onClick={() => grade(true)}
                className="inline-flex items-center gap-1 rounded border border-emerald-600/50 px-2.5 py-1 text-[13px] text-emerald-800 hover:bg-emerald-50 dark:text-emerald-300 dark:hover:bg-emerald-950/40 cursor-pointer"
              >
                <Check className="h-3.5 w-3.5" /> 答对了
              </button>
              <button
                onClick={() => grade(false)}
                className="inline-flex items-center gap-1 rounded border border-red-600/50 px-2.5 py-1 text-[13px] text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40 cursor-pointer"
              >
                <X className="h-3.5 w-3.5" /> 没答对（加入错题本）
              </button>
            </div>
          )}
          {graded !== null && (
            <div className={`text-[13px] font-medium ${graded ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-700 dark:text-red-400'}`}>
              {graded ? '已记录：答对' : '已记录：答错，已加入错题本'}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
