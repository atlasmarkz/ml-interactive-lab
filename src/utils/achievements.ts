/** Achievements are derived from progress on the fly — nothing extra is stored. */
import { LECTURES, LECTURE_GROUPS } from '../data/lectures';
import { ALL_CARDS, ALL_QUESTIONS, waKey } from '../data/review';
import { Progress, longestStreak, totalReviews } from './progress';

export interface Achievement {
  id: string;
  title: string;
  desc: string;
  icon: 'sprout' | 'flame' | 'calendar' | 'layers' | 'target' | 'eraser' | 'scroll' | 'crown' | 'grad' | 'moon' | 'sunrise' | 'zap';
  /** current / target, for a progress hint on locked badges */
  value: (p: Progress) => [number, number];
}

const WA_QUESTIONS = ALL_QUESTIONS.filter((q) => waKey(q.style)?.startsWith('WA'));
const seenCards = (p: Progress) => ALL_CARDS.filter((c) => p.cards[c.id]).length;
const correctTotal = (p: Progress) => Object.values(p.quiz).reduce((n, q) => n + q.correct, 0);
const masteredParts = (p: Progress) =>
  LECTURE_GROUPS.filter((g) => !g.startsWith('Part 0')) // Part 0 has a single lecture: too easy to count
    .filter((g) => LECTURES.filter((l) => l.partGroup === g).every((l) => p.lectures[l.id]?.status === 'mastered')).length;

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'first', title: '迈出第一步', desc: '第一次复习卡片或做练习题', icon: 'sprout', value: (p) => [Math.min(1, totalReviews(p)), 1] },
  { id: 'streak3', title: '三日不辍', desc: '连续 3 天复习', icon: 'flame', value: (p) => [Math.min(3, longestStreak(p)), 3] },
  { id: 'streak7', title: '一周打卡', desc: '连续 7 天复习', icon: 'flame', value: (p) => [Math.min(7, longestStreak(p)), 7] },
  { id: 'streak30', title: '月度坚持', desc: '连续 30 天复习', icon: 'calendar', value: (p) => [Math.min(30, longestStreak(p)), 30] },
  { id: 'cards30', title: '卡片入门', desc: '学过 30 张抽认卡', icon: 'layers', value: (p) => [Math.min(30, seenCards(p)), 30] },
  { id: 'cardsAll', title: '卡组通关', desc: `全部 ${ALL_CARDS.length} 张卡片都复习过`, icon: 'layers', value: (p) => [seenCards(p), ALL_CARDS.length] },
  { id: 'reviews200', title: '熟能生巧', desc: '累计复习 200 次', icon: 'zap', value: (p) => [Math.min(200, totalReviews(p)), 200] },
  { id: 'correct50', title: '神射手', desc: '练习题累计答对 50 次', icon: 'target', value: (p) => [Math.min(50, correctTotal(p)), 50] },
  {
    id: 'clean', title: '错题清零', desc: '做过至少 20 道题且错题本为空', icon: 'eraser',
    value: (p) => {
      const done = Object.keys(p.quiz).length;
      const wrong = Object.values(p.quiz).filter((q) => !q.lastCorrect).length;
      return [done >= 20 && wrong === 0 ? 1 : 0, 1];
    },
  },
  { id: 'wa', title: 'WA 题型全覆盖', desc: `做完全部 ${WA_QUESTIONS.length} 道 WA 题型题`, icon: 'scroll', value: (p) => [WA_QUESTIONS.filter((q) => p.quiz[q.id]).length, WA_QUESTIONS.length] },
  { id: 'part', title: 'Part 专家', desc: '掌握 Part 1–5 中某个 Part 的全部讲次', icon: 'crown', value: (p) => [Math.min(1, masteredParts(p)), 1] },
  { id: 'grad', title: '准备毕业', desc: `全部 ${LECTURES.length} 讲都标记为已掌握`, icon: 'grad', value: (p) => [LECTURES.filter((l) => p.lectures[l.id]?.status === 'mastered').length, LECTURES.length] },
  { id: 'owl', title: '夜猫子', desc: '凌晨 0–5 点还在复习（注意休息）', icon: 'moon', value: (p) => [p.flags.includes('night-owl') ? 1 : 0, 1] },
  { id: 'bird', title: '早起的鸟儿', desc: '早上 5–7 点开始复习', icon: 'sunrise', value: (p) => [p.flags.includes('early-bird') ? 1 : 0, 1] },
];

export const isUnlocked = (a: Achievement, p: Progress) => {
  const [v, t] = a.value(p);
  return v >= t;
};

export const unlockedIds = (p: Progress) => new Set(ACHIEVEMENTS.filter((a) => isUnlocked(a, p)).map((a) => a.id));
