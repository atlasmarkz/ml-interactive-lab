import { PartModule } from '../types/curriculum';
import { PARTS_0_TO_2 } from './curriculumPart0to2';
import { PARTS_3_TO_5 } from './curriculumPart3to5';

export const CURRICULUM: PartModule[] = [...PARTS_0_TO_2, ...PARTS_3_TO_5];

export function getPartBySlug(slug: string): PartModule | undefined {
  return CURRICULUM.find((p) => p.slug === slug);
}
