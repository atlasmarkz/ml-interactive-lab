import { LectureModule, PartGroup } from '../types/curriculum';
import { LECTURES_PART_0 } from './lecturesPart0';
import { LECTURES_PART_1 } from './lecturesPart1';
import { LECTURES_PART_2 } from './lecturesPart2';
import { LECTURES_PART_3 } from './lecturesPart3';
import { LECTURES_PART_4 } from './lecturesPart4';
import { LECTURES_PART_5 } from './lecturesPart5';

/** All lectures in slide order (L00 → L16), one module per slide deck. */
export const LECTURES: LectureModule[] = [
  ...LECTURES_PART_0,
  ...LECTURES_PART_1,
  ...LECTURES_PART_2,
  ...LECTURES_PART_3,
  ...LECTURES_PART_4,
  ...LECTURES_PART_5,
];

export const LECTURE_GROUPS: readonly PartGroup[] = [
  'Part 0 · Introduction',
  'Part 1 · Foundations of Machine Learning',
  'Part 2 · Foundations of Deep Learning',
  'Part 3 · Advanced Deep Learning',
  'Part 4 · Generative Models for Images',
  'Part 5 · Reinforcement Learning',
] as const;

export function getLectureBySlug(slug: string): LectureModule | undefined {
  return LECTURES.find((l) => l.slug === slug);
}

export function getLectureById(id: string): LectureModule | undefined {
  return LECTURES.find((l) => l.id === id);
}
