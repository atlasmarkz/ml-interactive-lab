import React, { useState } from 'react';
import { Shuffle } from 'lucide-react';
import { ALL_QUESTIONS } from '../../data/review';
import { today } from '../../utils/progress';
import { QuizCard } from './QuizCard';

/** Same question for everyone on a given day (a cheap integer hash of the date). */
const dailyIndex = () => {
  let h = today() * 2654435761;
  h = (h ^ (h >>> 16)) >>> 0;
  return h % ALL_QUESTIONS.length;
};

export const QuestionOfTheDay: React.FC = () => {
  const [idx, setIdx] = useState(dailyIndex);
  const isDaily = idx === dailyIndex();
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-[13px] text-stone-500 dark:text-zinc-400">{isDaily ? '每天自动换一道，从 196 道题里抽' : '随机抽到的一道'}</span>
        <div className="flex gap-2 text-[13px]">
          {!isDaily && (
            <button onClick={() => setIdx(dailyIndex())} className="text-blue-700 hover:underline dark:text-blue-400 cursor-pointer">
              回到今日一题
            </button>
          )}
          <button
            onClick={() => setIdx((i) => (i + 1 + Math.floor(Math.random() * (ALL_QUESTIONS.length - 1))) % ALL_QUESTIONS.length)}
            className="inline-flex items-center gap-1 text-blue-700 hover:underline dark:text-blue-400 cursor-pointer"
          >
            <Shuffle className="h-3.5 w-3.5" /> 换一题
          </button>
        </div>
      </div>
      <QuizCard key={ALL_QUESTIONS[idx].id} question={ALL_QUESTIONS[idx]} showLecture />
    </div>
  );
};
