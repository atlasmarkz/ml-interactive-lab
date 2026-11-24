import React, { useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Download, Layers, ListChecks, RotateCcw, Sigma, Upload } from 'lucide-react';
import { LECTURES, LECTURE_GROUPS } from '../../data/lectures';
import { ALL_CARDS, ALL_QUESTIONS, getReviewPack } from '../../data/review';
import {
  LectureStatus,
  exportProgress,
  importProgress,
  isDue,
  resetProgress,
  setLectureStatus,
  streak,
  useProgress,
} from '../../utils/progress';
import { STATUS_META } from '../../components/review/ReviewBits';
import { PageHeader } from './PageHeader';

const WEIGHT = {
  core: { label: '核心', cls: 'text-red-700 dark:text-red-400' },
  support: { label: '基础', cls: 'text-stone-500 dark:text-zinc-400' },
  optional: { label: '选读', cls: 'text-stone-400 dark:text-zinc-500' },
} as const;

const Stat: React.FC<{ label: string; value: React.ReactNode; hint?: string }> = ({ label, value, hint }) => (
  <div className="rounded-lg border border-stone-200 bg-white p-3.5 dark:border-zinc-800 dark:bg-[#11151d]">
    <div className="font-mono text-[11.5px] uppercase tracking-wider text-stone-500 dark:text-zinc-400">{label}</div>
    <div className="mt-1 font-serif-display text-2xl font-semibold text-stone-950 dark:text-zinc-50">{value}</div>
    {hint && <div className="mt-0.5 text-[12px] text-stone-500 dark:text-zinc-400">{hint}</div>}
  </div>
);

export const ReviewHubPage: React.FC = () => {
  const p = useProgress();
  const fileRef = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const stats = useMemo(() => {
    const due = ALL_CARDS.filter((c) => isDue(c.id, p));
    const fresh = due.filter((c) => !p.cards[c.id]).length;
    const attempts = Object.values(p.quiz).reduce((n, q) => n + q.attempts, 0);
    const correct = Object.values(p.quiz).reduce((n, q) => n + q.correct, 0);
    const wrong = Object.values(p.quiz).filter((q) => !q.lastCorrect).length;
    const mastered = LECTURES.filter((l) => p.lectures[l.id]?.status === 'mastered').length;
    return { due: due.length, fresh, attempts, correct, wrong, mastered };
  }, [p]);

  const perLecture = useMemo(
    () =>
      LECTURES.map((lec) => {
        const pack = getReviewPack(lec.id);
        const cards = pack?.flashcards ?? [];
        const qs = pack?.quiz ?? [];
        const learned = cards.filter((c) => p.cards[c.id] && !isDue(c.id, p)).length;
        const due = cards.filter((c) => isDue(c.id, p)).length;
        const answered = qs.filter((q) => p.quiz[q.id]).length;
        const wrong = qs.filter((q) => p.quiz[q.id] && !p.quiz[q.id].lastCorrect).length;
        return { lec, cards: cards.length, learned, due, qs: qs.length, answered, wrong };
      }),
    [p]
  );

  // weakest lectures first: wrong answers, then unstudied core lectures, then most due cards
  const focus = useMemo(
    () =>
      perLecture
        .filter((r) => r.lec.examWeight !== 'optional' && p.lectures[r.lec.id]?.status !== 'mastered')
        .map((r) => ({ ...r, score: r.wrong * 10 + (r.answered === 0 ? 5 : 0) + r.due }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 4),
    [perLecture, p]
  );

  const download = () => {
    const blob = new Blob([exportProgress()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ml-review-progress-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const upload = async (file: File) => {
    try {
      importProgress(await file.text());
      setMsg('已导入进度。');
    } catch (e) {
      setMsg(`导入失败：${(e as Error).message}`);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      <PageHeader
        kicker="Review Hub"
        title="学习中心"
        description="把 L00–L16 的讲义内容变成可以反复练的东西：抽认卡做间隔重复，原创练习题查漏，公式速查表做主动回忆，作业对照表帮你按 WA 题型定位讲次。所有进度只保存在这个浏览器里。"
      />

      <section className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <Stat label="今日到期卡片" value={stats.due} hint={`其中新卡 ${stats.fresh} 张 / 共 ${ALL_CARDS.length}`} />
        <Stat label="已掌握讲次" value={`${stats.mastered}/${LECTURES.length}`} />
        <Stat
          label="练习正确率"
          value={stats.attempts ? `${Math.round((stats.correct / stats.attempts) * 100)}%` : '—'}
          hint={`${stats.attempts} 次作答 / ${ALL_QUESTIONS.length} 题`}
        />
        <Stat label="错题本" value={stats.wrong} hint="上次答错的题" />
        <Stat label="连续复习" value={`${streak(p)} 天`} />
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { to: '/review/flashcards', icon: Layers, title: '开始卡片复习', body: `${stats.due} 张到期，空格翻面、1–4 评分` },
          { to: '/review/quiz?mode=random', icon: ListChecks, title: '随机练习 10 题', body: '计算 / 选择 / 简答混合，可限定讲次' },
          { to: '/review/quiz?mode=wrong', icon: RotateCcw, title: '错题重练', body: stats.wrong ? `${stats.wrong} 道待复习` : '暂时没有错题' },
          { to: '/review/formulas', icon: Sigma, title: '公式速查与默写', body: '遮挡模式主动回忆，可打印' },
        ].map(({ to, icon: Icon, title, body }) => (
          <Link
            key={to}
            to={to}
            className="group rounded-lg border border-stone-200 bg-white p-4 transition hover:border-blue-500 dark:border-zinc-800 dark:bg-[#11151d] dark:hover:border-blue-500"
          >
            <Icon className="h-4 w-4 text-blue-700 dark:text-blue-400" />
            <div className="mt-2 flex items-center gap-1 text-[16px] font-semibold text-stone-900 dark:text-zinc-100">
              {title}
              <ArrowRight className="h-3.5 w-3.5 opacity-0 transition group-hover:opacity-100" />
            </div>
            <div className="mt-0.5 text-[13px] text-stone-500 dark:text-zinc-400">{body}</div>
          </Link>
        ))}
      </section>

      {focus.length > 0 && (
        <section className="space-y-2">
          <h2 className="font-serif-display text-lg font-semibold text-stone-950 dark:text-zinc-100">建议优先复习</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {focus.map((r) => (
              <Link
                key={r.lec.id}
                to={`/lecture/${r.lec.slug}#review`}
                className="flex items-center justify-between gap-3 rounded-md border border-stone-200 bg-white px-3.5 py-2.5 text-[15px] hover:border-blue-500 dark:border-zinc-800 dark:bg-[#11151d]"
              >
                <span className="min-w-0 truncate">
                  <span className="mr-2 font-mono text-[13px] font-bold text-blue-700 dark:text-blue-400">{r.lec.code}</span>
                  {r.lec.titleZh}
                </span>
                <span className="shrink-0 font-mono text-[11.5px] text-stone-500 dark:text-zinc-400">
                  {r.wrong ? `${r.wrong} 错题 · ` : r.answered === 0 ? '未练习 · ' : ''}
                  {r.due} 卡到期
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="space-y-4">
        <h2 className="font-serif-display text-lg font-semibold text-stone-950 dark:text-zinc-100">逐讲进度</h2>
        {LECTURE_GROUPS.map((group) => (
          <div key={group} className="space-y-1.5">
            <div className="font-mono text-[12px] font-semibold uppercase tracking-wider text-stone-400 dark:text-zinc-500">{group}</div>
            <div className="overflow-x-auto rounded-lg border border-stone-200 bg-white dark:border-zinc-800 dark:bg-[#11151d]">
              <table className="w-full min-w-[640px] text-[14px]">
                <tbody className="divide-y divide-stone-100 dark:divide-zinc-800/80">
                  {perLecture
                    .filter((r) => r.lec.partGroup === group)
                    .map((r) => {
                      const status = p.lectures[r.lec.id]?.status ?? 'new';
                      const checked = p.lectures[r.lec.id]?.checked.length ?? 0;
                      return (
                        <tr key={r.lec.id}>
                          <td className="w-16 px-3 py-2 font-mono text-[13px] font-bold text-blue-700 dark:text-blue-400">{r.lec.code}</td>
                          <td className="px-2 py-2">
                            <Link to={`/lecture/${r.lec.slug}`} className="text-stone-800 hover:text-blue-700 dark:text-zinc-200 dark:hover:text-blue-400">
                              {r.lec.titleZh}
                            </Link>
                            <span className={`ml-2 font-mono text-[11px] ${WEIGHT[r.lec.examWeight].cls}`}>{WEIGHT[r.lec.examWeight].label}</span>
                          </td>
                          <td className="w-24 px-2 py-2 font-mono text-[12px] text-stone-500 dark:text-zinc-400" title="知识点自查表已勾选">
                            自查 {checked}/{r.lec.readingChecklist.length}
                          </td>
                          <td className="w-24 px-2 py-2 font-mono text-[12px] text-stone-500 dark:text-zinc-400" title="已学会（未到期）的卡片">
                            卡片 {r.learned}/{r.cards}
                          </td>
                          <td className="w-24 px-2 py-2 font-mono text-[12px] text-stone-500 dark:text-zinc-400" title="做过的练习题 / 答错">
                            练习 {r.answered}/{r.qs}
                            {r.wrong > 0 && <span className="text-red-600 dark:text-red-400"> ✗{r.wrong}</span>}
                          </td>
                          <td className="w-28 px-3 py-2 text-right">
                            <select
                              aria-label={`${r.lec.code} 掌握程度`}
                              value={status}
                              onChange={(e) => setLectureStatus(r.lec.id, e.target.value as LectureStatus)}
                              className={`rounded border px-1.5 py-0.5 text-[12px] ${STATUS_META[status].chip} bg-transparent`}
                            >
                              {(Object.keys(STATUS_META) as LectureStatus[]).map((s) => (
                                <option key={s} value={s}>
                                  {STATUS_META[s].label}
                                </option>
                              ))}
                            </select>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </section>

      <section className="rounded-lg border border-stone-200 bg-white p-4 dark:border-zinc-800 dark:bg-[#11151d] space-y-2">
        <h2 className="text-[16px] font-semibold text-stone-900 dark:text-zinc-100">进度数据</h2>
        <p className="text-[13px] text-stone-500 dark:text-zinc-400">进度保存在浏览器 localStorage 中，换设备或清理浏览器前可以先导出。</p>
        <div className="flex flex-wrap gap-2 text-[13px]">
          <button onClick={download} className="inline-flex items-center gap-1.5 rounded-md border border-stone-300 px-3 py-1.5 hover:bg-stone-50 dark:border-zinc-700 dark:hover:bg-zinc-800 cursor-pointer">
            <Download className="h-3.5 w-3.5" /> 导出 JSON
          </button>
          <button onClick={() => fileRef.current?.click()} className="inline-flex items-center gap-1.5 rounded-md border border-stone-300 px-3 py-1.5 hover:bg-stone-50 dark:border-zinc-700 dark:hover:bg-zinc-800 cursor-pointer">
            <Upload className="h-3.5 w-3.5" /> 导入 JSON
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void upload(f);
              e.target.value = '';
            }}
          />
          <button
            onClick={() => {
              if (window.confirm('确定清空所有复习进度？此操作无法撤销（建议先导出）。')) {
                resetProgress();
                setMsg('已清空进度。');
              }
            }}
            className="inline-flex items-center gap-1.5 rounded-md border border-red-300 px-3 py-1.5 text-red-700 hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950/40 cursor-pointer"
          >
            清空进度
          </button>
        </div>
        {msg && <div className="text-[13px] text-stone-600 dark:text-zinc-300">{msg}</div>}
      </section>
    </div>
  );
};
