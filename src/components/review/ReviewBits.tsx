import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { KeyFormula } from '../../types/review';
import { LectureStatus, setLectureStatus, useProgress } from '../../utils/progress';
import { getLectureById } from '../../data/lectures';
import { MathFormula } from '../MathFormula';
import { RichText } from '../RichText';

export const STATUS_META: Record<LectureStatus, { label: string; dot: string; chip: string }> = {
  new: {
    label: '未开始',
    dot: 'bg-stone-300 dark:bg-zinc-600',
    chip: 'border-stone-300 text-stone-600 dark:border-zinc-700 dark:text-zinc-400',
  },
  learning: {
    label: '复习中',
    dot: 'bg-amber-500',
    chip: 'border-amber-500/60 bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300',
  },
  mastered: {
    label: '已掌握',
    dot: 'bg-emerald-600 dark:bg-emerald-500',
    chip: 'border-emerald-600/60 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300',
  },
};

export const StatusDot: React.FC<{ lectureId: string; className?: string }> = ({ lectureId, className = '' }) => {
  const p = useProgress();
  const status = p.lectures[lectureId]?.status ?? 'new';
  return (
    <span
      title={STATUS_META[status].label}
      className={`inline-block h-1.5 w-1.5 shrink-0 rounded-full ${STATUS_META[status].dot} ${className}`}
    />
  );
};

export const StatusPicker: React.FC<{ lectureId: string; vertical?: boolean }> = ({ lectureId, vertical = false }) => {
  const p = useProgress();
  const status = p.lectures[lectureId]?.status ?? 'new';
  return (
    <div
      role="radiogroup"
      aria-label="本讲掌握程度"
      className={`rounded-lg border border-stone-200 bg-white p-0.5 text-[15px] dark:border-zinc-800 dark:bg-zinc-900 ${vertical ? 'flex flex-col' : 'inline-flex'}`}
    >
      {(Object.keys(STATUS_META) as LectureStatus[]).map((s) => (
        <button
          key={s}
          role="radio"
          aria-checked={status === s}
          onClick={() => setLectureStatus(lectureId, s)}
          className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 transition cursor-pointer ${
            status === s
              ? 'bg-stone-900 text-white dark:bg-blue-600'
              : 'text-stone-600 hover:bg-stone-100 dark:text-zinc-400 dark:hover:bg-zinc-800'
          }`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${STATUS_META[s].dot}`} />
          {STATUS_META[s].label}
        </button>
      ))}
    </div>
  );
};

export const LectureTag: React.FC<{ lectureId: string; link?: boolean }> = ({ lectureId, link = true }) => {
  const lec = getLectureById(lectureId);
  if (!lec) return null;
  const cls =
    'inline-flex items-center rounded border border-stone-200 bg-stone-50 px-1.5 py-0.5 font-mono text-[11.5px] font-semibold text-blue-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-blue-400';
  return link ? (
    <Link to={`/lecture/${lec.slug}`} className={`${cls} hover:border-blue-500`} title={lec.titleZh}>
      {lec.code}
    </Link>
  ) : (
    <span className={cls} title={lec.titleZh}>
      {lec.code}
    </span>
  );
};

/** A key formula that can be hidden for active recall. */
export const FormulaRow: React.FC<{ formula: KeyFormula; hidden: boolean }> = ({ formula, hidden }) => {
  const [peek, setPeek] = useState(false);
  const show = !hidden || peek;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-[10.5rem_1fr] gap-x-4 gap-y-1 py-2.5 border-b border-stone-100 last:border-b-0 dark:border-zinc-800/80">
      <div className="text-[14px] font-semibold text-stone-800 dark:text-zinc-200 pt-1">
        <RichText text={formula.name} />
        {formula.note && (
          <div className="mt-0.5 text-[12.5px] font-normal leading-snug text-stone-500 dark:text-zinc-400">
            <RichText text={formula.note} />
          </div>
        )}
      </div>
      <div className="min-w-0">
        {show ? (
          <div className="overflow-x-auto" onClick={() => hidden && setPeek(false)}>
            <MathFormula latex={formula.latex} className="text-[15px] text-left [&_.katex-display]:my-1 [&_.katex-display>.katex]:text-left" />
          </div>
        ) : (
          <button
            onClick={() => setPeek(true)}
            className="w-full rounded border border-dashed border-stone-300 bg-stone-50 px-3 py-2.5 text-left text-[13px] text-stone-500 hover:border-blue-500 hover:text-blue-700 dark:border-zinc-700 dark:bg-zinc-900/60 dark:text-zinc-400 cursor-pointer"
          >
            先在纸上写出来，再点击核对
          </button>
        )}
      </div>
    </div>
  );
};

export const HideToggle: React.FC<{ hidden: boolean; onToggle: () => void }> = ({ hidden, onToggle }) => (
  <button
    onClick={onToggle}
    className="inline-flex items-center gap-1.5 rounded-md border border-stone-200 bg-white px-2.5 py-1 text-[13px] text-stone-600 hover:border-blue-500 hover:text-blue-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 cursor-pointer"
  >
    {hidden ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
    {hidden ? '显示全部公式' : '遮挡公式（主动回忆）'}
  </button>
);
