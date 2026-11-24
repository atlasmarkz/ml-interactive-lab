import React from 'react';
import { CalendarDays, Flame, HelpCircle, Medal, Target } from 'lucide-react';
import { OverallProgress } from './OverallProgress';
import { AchievementGrid, ActivityHeatmap, DailyGoal, useStreakStats } from './Gamify';
import { QuestionOfTheDay } from './QuestionOfTheDay';

const Card: React.FC<{ icon: React.ComponentType<{ className?: string }>; title: string; right?: React.ReactNode; children: React.ReactNode }> = ({
  icon: Icon,
  title,
  right,
  children,
}) => (
  <div className="rounded-xl border border-stone-200 bg-white p-4 dark:border-zinc-800 dark:bg-[#11151d]">
    <div className="mb-3 flex items-center justify-between gap-2">
      <h3 className="flex items-center gap-2 text-[15px] font-semibold text-stone-900 dark:text-zinc-100">
        <Icon className="h-4 w-4 text-blue-700 dark:text-blue-400" />
        {title}
      </h3>
      {right}
    </div>
    {children}
  </div>
);

const Stat: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div>
    <div className="font-mono text-[18px] font-semibold tabular-nums text-stone-900 dark:text-zinc-100">{value}</div>
    <div className="text-[12px] text-stone-500 dark:text-zinc-400">{label}</div>
  </div>
);

/** Home-page study dashboard: overall progress, GitHub-style check-ins, daily goal, achievements, question of the day. */
export const Dashboard: React.FC = () => {
  const s = useStreakStats();
  return (
    <section className="space-y-5" aria-labelledby="dashboard-title">
      <h2 id="dashboard-title" className="font-serif-display text-[1.7rem] font-semibold tracking-tight text-stone-950 dark:text-zinc-50">
        学习看板
      </h2>
      <div className="grid gap-5 lg:grid-cols-[18rem_minmax(0,1fr)]">
        <OverallProgress showHeatmap={false} />
        <div className="space-y-5">
          <Card
            icon={CalendarDays}
            title="打卡日历"
            right={
              <span className="inline-flex items-center gap-1 text-[13px] text-stone-600 dark:text-zinc-400">
                <Flame className={`h-4 w-4 ${s.current > 0 ? 'text-orange-500' : 'text-stone-300 dark:text-zinc-600'}`} />
                连续 <b className="font-mono text-stone-900 dark:text-zinc-100">{s.current}</b> 天
              </span>
            }
          >
            <ActivityHeatmap />
            <div className="mt-3 grid grid-cols-3 gap-3 border-t border-stone-100 pt-3 dark:border-zinc-800">
              <Stat label="最长连续" value={`${s.longest} 天`} />
              <Stat label="打卡天数" value={s.days} />
              <Stat label="累计复习" value={s.total} />
            </div>
          </Card>
          <Card icon={Target} title="今日目标">
            <DailyGoal />
          </Card>
        </div>
      </div>
      <Card icon={Medal} title="成就">
        <AchievementGrid />
      </Card>
      <Card icon={HelpCircle} title="今日一题">
        <QuestionOfTheDay />
      </Card>
    </section>
  );
};
