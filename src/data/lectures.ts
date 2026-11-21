import { LectureModule } from '../types/curriculum';
import { LECTURES_PART_1 } from './lecturesPart1';
import { LECTURES_PART_2 } from './lecturesPart2';
import { LECTURES_PART_3 } from './lecturesPart3';

export const LECTURES: LectureModule[] = [
  ...LECTURES_PART_1,
  ...LECTURES_PART_2,
  ...LECTURES_PART_3,
];

export const LECTURE_GROUPS = [
  'Part I · Statistical & Linear Foundations',
  'Part II · Deep Learning Foundations',
  'Part III · Transformers, Generative Models & RL',
] as const;

export function getLectureBySlug(slug: string): LectureModule | undefined {
  return LECTURES.find((l) => l.slug === slug);
}
