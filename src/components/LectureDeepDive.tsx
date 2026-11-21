import React, { useEffect, useState } from 'react';
import { BookMarked, Check } from 'lucide-react';
import { LectureSection } from '../types/curriculum';
import { MathFormula } from './MathFormula';

interface LectureDeepDiveProps {
  sections: LectureSection[];
}

export const LectureDeepDive: React.FC<LectureDeepDiveProps> = ({ sections }) => {
  const [activeIdx, setActiveIdx] = useState(0);

  useEffect(() => {
    setActiveIdx(0);
  }, [sections]);

  if (!sections.length) return null;
  const active = sections[Math.min(activeIdx, sections.length - 1)];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden dark:border-slate-800 dark:bg-slate-900">
      {/* Header + Sub-lecture Tabs */}
      <div className="border-b border-slate-200 bg-slate-50/80 px-5 py-3.5 dark:border-slate-800 dark:bg-slate-900 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <BookMarked className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              讲义级深度知识点全覆盖（按 Lecture 细分）
            </h3>
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">
            共 {sections.length} 个子专题 · 覆盖 PPT 全部核心概念与辨析
          </span>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {sections.map((sec, idx) => (
            <button
              key={sec.id}
              onClick={() => setActiveIdx(idx)}
              className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition cursor-pointer ${
                idx === activeIdx
                  ? 'border-indigo-600 bg-indigo-600 text-white shadow-xs'
                  : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
              }`}
            >
              {sec.lectureTag}
            </button>
          ))}
        </div>
      </div>

      {/* Active Section Content */}
      <div className="p-5 space-y-5">
        <div className="text-sm font-bold text-slate-900 dark:text-white border-l-4 border-indigo-500 pl-3">
          {active.title}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {active.concepts.map((c, idx) => (
            <div
              key={idx}
              className={`rounded-xl border border-slate-200/90 bg-slate-50/60 p-4 dark:border-slate-800 dark:bg-slate-950/50 space-y-2.5 ${
                c.table ? 'md:col-span-2' : ''
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  {c.heading}
                </h4>
                {c.badge && (
                  <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-semibold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                    {c.badge}
                  </span>
                )}
              </div>

              <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                {c.summary}
              </p>

              {c.latex && (
                <div className="rounded-lg border border-slate-200/70 bg-white px-3 py-2 text-center dark:border-slate-800 dark:bg-slate-900">
                  <MathFormula latex={c.latex} className="text-sm" />
                </div>
              )}

              <ul className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
                {c.bullets.map((b, bi) => (
                  <li key={bi} className="flex items-start gap-2 leading-relaxed">
                    <Check className="h-3.5 w-3.5 shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>

              {c.table && (
                <div className="overflow-x-auto pt-1">
                  <table className="w-full border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-100/80 dark:border-slate-800 dark:bg-slate-900">
                        {c.table.headers.map((h, hi) => (
                          <th
                            key={hi}
                            className="px-3 py-2 text-left font-semibold text-slate-700 dark:text-slate-200"
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200/70 dark:divide-slate-800">
                      {c.table.rows.map((row, ri) => (
                        <tr key={ri} className="bg-white/80 dark:bg-slate-950/40">
                          {row.map((cell, ci) => (
                            <td
                              key={ci}
                              className={`px-3 py-2 leading-relaxed ${
                                ci === 0
                                  ? 'font-semibold text-slate-900 dark:text-slate-100 whitespace-nowrap'
                                  : 'text-slate-600 dark:text-slate-300'
                              }`}
                            >
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
