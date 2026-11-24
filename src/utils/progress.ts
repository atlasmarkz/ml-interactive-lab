/**
 * Local-only study progress: lecture status, checklist ticks, flashcard
 * scheduling (a small SM-2 variant) and quiz history. Everything lives in
 * localStorage so the static site keeps working without a backend; the
 * Review Hub offers JSON export / import to move progress between devices.
 */
import { useSyncExternalStore } from 'react';

export type LectureStatus = 'new' | 'learning' | 'mastered';
export type Rating = 'again' | 'hard' | 'good' | 'easy';

export interface CardState {
  ease: number;
  interval: number; // days
  due: number; // epoch day number
  reps: number;
  lapses: number;
}

export interface QuizState {
  attempts: number;
  correct: number;
  lastCorrect: boolean;
  lastAt: number;
}

export interface Progress {
  version: 1;
  lectures: Record<string, { status: LectureStatus; checked: number[] }>;
  cards: Record<string, CardState>;
  quiz: Record<string, QuizState>;
  /** Epoch days on which the user reviewed anything (for the streak). */
  activeDays: number[];
}

const KEY = 'ml-lab-progress-v1';
const EMPTY: Progress = { version: 1, lectures: {}, cards: {}, quiz: {}, activeDays: [] };

export const today = (): number => Math.floor((Date.now() - new Date().getTimezoneOffset() * 60000) / 86400000);

function load(): Progress {
  if (typeof window === 'undefined') return EMPTY;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw) as Partial<Progress>;
    return { ...EMPTY, ...parsed, version: 1 };
  } catch {
    return EMPTY;
  }
}

let state: Progress = load();
const listeners = new Set<() => void>();

function commit(next: Progress) {
  state = next;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* storage full or disabled: keep in-memory state */
  }
  listeners.forEach((l) => l());
}

function markActive(p: Progress): number[] {
  const d = today();
  return p.activeDays.includes(d) ? p.activeDays : [...p.activeDays, d].slice(-400);
}

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === KEY) {
      state = load();
      listeners.forEach((l) => l());
    }
  });
}

export function useProgress(): Progress {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => state,
    () => EMPTY
  );
}

export function getProgress(): Progress {
  return state;
}

export function setLectureStatus(lectureId: string, status: LectureStatus) {
  const cur = state.lectures[lectureId] ?? { status: 'new', checked: [] };
  commit({ ...state, lectures: { ...state.lectures, [lectureId]: { ...cur, status } } });
}

export function toggleChecklist(lectureId: string, index: number) {
  const cur = state.lectures[lectureId] ?? { status: 'new' as LectureStatus, checked: [] };
  const checked = cur.checked.includes(index) ? cur.checked.filter((i) => i !== index) : [...cur.checked, index];
  const status: LectureStatus = cur.status === 'new' && checked.length > 0 ? 'learning' : cur.status;
  commit({ ...state, lectures: { ...state.lectures, [lectureId]: { status, checked } } });
}

/** SM-2-style scheduling with four buttons. Returns the new state. */
export function schedule(prev: CardState | undefined, rating: Rating): CardState {
  const base: CardState = prev ?? { ease: 2.5, interval: 0, due: today(), reps: 0, lapses: 0 };
  if (rating === 'again') {
    return { ease: Math.max(1.3, base.ease - 0.2), interval: 0, due: today(), reps: 0, lapses: base.lapses + 1 };
  }
  const ease = Math.max(1.3, base.ease + (rating === 'hard' ? -0.15 : rating === 'easy' ? 0.15 : 0));
  let interval: number;
  if (base.reps === 0) interval = rating === 'easy' ? 4 : 1;
  else if (base.reps === 1) interval = rating === 'hard' ? 2 : rating === 'good' ? 3 : 6;
  else {
    const mult = rating === 'hard' ? 1.2 : rating === 'good' ? ease : ease * 1.3;
    interval = Math.max(base.interval + 1, Math.round(base.interval * mult));
  }
  return { ease, interval, due: today() + interval, reps: base.reps + 1, lapses: base.lapses };
}

export function rateCard(cardId: string, rating: Rating) {
  const next = schedule(state.cards[cardId], rating);
  commit({ ...state, cards: { ...state.cards, [cardId]: next }, activeDays: markActive(state) });
}

export function recordAnswer(questionId: string, correct: boolean) {
  const cur = state.quiz[questionId] ?? { attempts: 0, correct: 0, lastCorrect: false, lastAt: 0 };
  const next: QuizState = {
    attempts: cur.attempts + 1,
    correct: cur.correct + (correct ? 1 : 0),
    lastCorrect: correct,
    lastAt: Date.now(),
  };
  commit({ ...state, quiz: { ...state.quiz, [questionId]: next }, activeDays: markActive(state) });
}

export function isDue(cardId: string, p: Progress = state): boolean {
  const c = p.cards[cardId];
  return !c || c.due <= today();
}

export function streak(p: Progress = state): number {
  const days = new Set(p.activeDays);
  let d = today();
  if (!days.has(d)) d -= 1; // today not studied yet: count up to yesterday
  let n = 0;
  while (days.has(d)) {
    n += 1;
    d -= 1;
  }
  return n;
}

export function exportProgress(): string {
  return JSON.stringify(state, null, 2);
}

export function importProgress(json: string): void {
  const parsed = JSON.parse(json) as Partial<Progress>;
  if (typeof parsed !== 'object' || parsed === null || !('cards' in parsed) || !('quiz' in parsed)) {
    throw new Error('不是有效的进度文件');
  }
  commit({ ...EMPTY, ...parsed, version: 1 });
}

export function resetProgress() {
  commit(EMPTY);
}
