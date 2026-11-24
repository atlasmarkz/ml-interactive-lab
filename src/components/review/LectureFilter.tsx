import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { LECTURES, LECTURE_GROUPS } from '../../data/lectures';

/** Selected lecture ids, stored in the `?l=` query param (empty = all). */
export function useLectureSelection(): [string[], (ids: string[]) => void] {
  const [params, setParams] = useSearchParams();
  const raw = params.get('l');
  const ids = raw ? raw.split(',').filter((id) => LECTURES.some((l) => l.id === id)) : [];
  const set = (next: string[]) => {
    const p = new URLSearchParams(params);
    if (next.length === 0 || next.length === LECTURES.length) p.delete('l');
    else p.set('l', next.join(','));
    setParams(p, { replace: true });
  };
  return [ids, set];
}

const SHORT_GROUP = (g: string) => g.split(' · ')[0];

export const LectureFilter: React.FC<{ selected: string[]; onChange: (ids: string[]) => void; counts?: Record<string, number> }> = ({
  selected,
  onChange,
  counts,
}) => {
  const all = selected.length === 0;
  const isOn = (id: string) => all || selected.includes(id);
  const toggle = (id: string) => {
    const base = all ? [] : selected;
    onChange(base.includes(id) ? base.filter((x) => x !== id) : [...base, id]);
  };
  const toggleGroup = (group: string) => {
    const ids = LECTURES.filter((l) => l.partGroup === group).map((l) => l.id);
    const base = all ? [] : selected;
    const allOn = ids.every((id) => base.includes(id));
    onChange(allOn ? base.filter((id) => !ids.includes(id)) : Array.from(new Set([...base, ...ids])));
  };

  return (
    <div className="rounded-lg border border-stone-200 bg-white p-3.5 dark:border-zinc-800 dark:bg-[#11151d] space-y-2.5">
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-[12px] font-semibold uppercase tracking-wider text-stone-500 dark:text-zinc-400">
          复习范围 {all ? '· 全部讲次' : `· 已选 ${selected.length} 讲`}
        </span>
        {!all && (
          <button onClick={() => onChange([])} className="text-[13px] text-blue-700 hover:underline dark:text-blue-400 cursor-pointer">
            重置为全部
          </button>
        )}
      </div>
      <div className="space-y-1.5">
        {LECTURE_GROUPS.map((group) => (
          <div key={group} className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => toggleGroup(group)}
              className="w-14 shrink-0 text-left font-mono text-[11.5px] font-semibold text-stone-400 hover:text-blue-700 dark:text-zinc-500 dark:hover:text-blue-400 cursor-pointer"
              title="选择 / 取消整个 Part"
            >
              {SHORT_GROUP(group)}
            </button>
            {LECTURES.filter((l) => l.partGroup === group).map((l) => (
              <button
                key={l.id}
                onClick={() => toggle(l.id)}
                title={l.titleZh}
                aria-pressed={!all && selected.includes(l.id)}
                className={`rounded border px-2 py-0.5 font-mono text-[12px] transition cursor-pointer ${
                  !all && selected.includes(l.id)
                    ? 'border-blue-600 bg-blue-600 text-white dark:border-blue-500 dark:bg-blue-600'
                    : isOn(l.id)
                      ? 'border-stone-300 text-stone-700 hover:border-blue-500 dark:border-zinc-700 dark:text-zinc-300'
                      : 'border-stone-200 text-stone-400 dark:border-zinc-800 dark:text-zinc-600'
                }`}
              >
                {l.code}
                {counts && counts[l.id] !== undefined && <span className="ml-1 opacity-70">{counts[l.id]}</span>}
              </button>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
