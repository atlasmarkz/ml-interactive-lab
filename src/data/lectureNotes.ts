import { LectureSection } from '../types/curriculum';
import { LECTURE_NOTES_0_TO_2 } from './lectureNotesPart0to2';
import { LECTURE_NOTES_3_TO_5 } from './lectureNotesPart3to5';

export const LECTURE_NOTES: Record<number, LectureSection[]> = {
  ...LECTURE_NOTES_0_TO_2,
  ...LECTURE_NOTES_3_TO_5,
};
