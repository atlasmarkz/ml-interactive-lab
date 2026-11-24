import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Printer, Search } from 'lucide-react';
import { LECTURES, LECTURE_GROUPS } from '../../data/lectures';
import { getReviewPack } from '../../data/review';
import { FormulaRow, HideToggle } from '../../components/review/ReviewBits';
import { PageHeader } from './PageHeader';

export const FormulasPage: React.FC = () => {
  const [hidden, setHidden] = useState(false);
  const [query, setQuery] = useState('');

  const q = query.trim().toLowerCase();
  const sections = useMemo(
    () =>
      LECTURES.map((lec) => {
        const pack = getReviewPack(lec.id);
        const formulas = (pack?.formulas ?? []).filter(
          (f) =>
            !q ||
            f.name.toLowerCase().includes(q) ||
            f.latex.toLowerCase().includes(q) ||
            lec.titleZh.toLowerCase().includes(q) ||
            lec.titleEn.toLowerCase().includes(q) ||
            lec.code.toLowerCase().includes(q)
        );
        return { lec, formulas };
      }).filter((s) => s.formulas.length > 0),
    [q]
  );
  const total = sections.reduce((n, s) => n + s.formulas.length, 0);

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        kicker="Formula Sheet"
        title="公式速查"
        description="按讲次整理的核心公式。打开「遮挡公式」后先在纸上默写，再点击核对；也可以直接打印成考前速查表。"
      >
        <div className="flex flex-wrap items-center gap-2 pt-1 print:hidden">
          <label className="relative">
            <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-stone-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="搜索：KL、Adam、DDPM、L12…"
              className="w-60 rounded-md border border-stone-200 bg-white py-1 pl-7 pr-2 text-[13px] focus:border-blue-500 focus:outline-none dark:border-zinc-800 dark:bg-zinc-900"
            />
          </label>
          <HideToggle hidden={hidden} onToggle={() => setHidden((h) => !h)} />
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 rounded-md border border-stone-200 bg-white px-2.5 py-1 text-[13px] text-stone-600 hover:border-blue-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 cursor-pointer"
          >
            <Printer className="h-3.5 w-3.5" /> 打印
          </button>
          <span className="font-mono text-[12px] text-stone-500 dark:text-zinc-400">{total} 条公式</span>
        </div>
      </PageHeader>

      {LECTURE_GROUPS.map((group) => {
        const items = sections.filter((s) => s.lec.partGroup === group);
        if (items.length === 0) return null;
        return (
          <section key={group} className="space-y-3">
            <h2 className="font-mono text-[13px] font-semibold uppercase tracking-wider text-stone-500 dark:text-zinc-400 border-b border-stone-200 pb-2 dark:border-zinc-800">
              {group}
            </h2>
            {items.map(({ lec, formulas }) => (
              <div key={lec.id} className="rounded-lg border border-stone-200 bg-white px-4 py-2 dark:border-zinc-800 dark:bg-[#11151d] break-inside-avoid">
                <Link to={`/lecture/${lec.slug}`} className="flex items-baseline gap-2 py-1.5 hover:text-blue-700 dark:hover:text-blue-400">
                  <span className="font-mono text-[13px] font-bold text-blue-700 dark:text-blue-400">{lec.code}</span>
                  <span className="text-[15px] font-semibold text-stone-900 dark:text-zinc-100">{lec.titleZh}</span>
                </Link>
                {formulas.map((f, i) => (
                  <FormulaRow key={`${lec.id}-${i}-${hidden}`} formula={f} hidden={hidden} />
                ))}
              </div>
            ))}
          </section>
        );
      })}
    </div>
  );
};
