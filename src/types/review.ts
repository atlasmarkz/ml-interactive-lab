/** Review-oriented content attached to each lecture (by lecture id). */

export interface KeyFormula {
  name: string;
  latex: string;
  /** One-line reminder of when / why to use it. */
  note?: string;
}

export interface Flashcard {
  id: string;
  front: string;
  back: string;
}

export type QuizKind = 'mcq' | 'short' | 'calc';

export interface QuizQuestion {
  id: string;
  kind: QuizKind;
  prompt: string;
  /** For mcq: answer options; `answer` is the index of the correct one. */
  options?: string[];
  answer: number | string;
  explanation: string;
  /** Which assignment the question style mirrors, e.g. "WA3 Q2 题型". Never verbatim text. */
  style?: string;
}

export interface ReviewPack {
  lectureId: string;
  /** 3–8 must-remember takeaways, phrased for last-minute review. */
  keyPoints: string[];
  formulas: KeyFormula[];
  flashcards: Flashcard[];
  quiz: QuizQuestion[];
}
