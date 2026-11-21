export type SemanticRole = 'data' | 'param' | 'output' | 'loss' | 'hyper';

export interface FormulaTerm {
  id: string;
  label: string;
  role: SemanticRole;
  shape: string;
  explanation: string;
  numpyLines: number[]; // 1-indexed line numbers in numpyCode
  pytorchLines?: number[]; // 1-indexed line numbers in pytorchCode
}

export interface FormulaCodeSpec {
  id: string;
  title: string;
  subtitle: string;
  latex: string;
  numpyCode: string;
  pytorchCode?: string;
  terms: FormulaTerm[];
}

export interface SandboxSpec {
  id: string;
  title: string;
  description: string;
  starterCode: string;
  tips?: string[];
}

export interface ThoughtQuestion {
  question: string;
  answer: string;
}

export interface DeepDiveConcept {
  heading: string;
  badge?: string;
  summary: string;
  latex?: string;
  bullets: string[];
  table?: {
    headers: string[];
    rows: string[][];
  };
}

export interface LectureSection {
  id: string;
  lectureTag: string; // e.g. "L01 · 回归与正则化"
  title: string;
  concepts: DeepDiveConcept[];
}

export interface WorkedExampleStep {
  title: string;
  explanation: string;
  latex?: string;
}

export interface WorkedExample {
  id: string;
  tag: string; // e.g. "高频手算题型"
  title: string;
  problem: string;
  problemLatex?: string;
  steps: WorkedExampleStep[];
  keyTakeaway: string;
}

export interface PartModule {
  id: string;
  partNumber: number;
  slug: string;
  titleZh: string;
  titleEn: string;
  tagline: string;
  topics: string[];
  accentColor: string;
  keyTakeaways: string[];
  formulaSpecs: FormulaCodeSpec[];
  sandbox: SandboxSpec;
  thoughtQuestions: ThoughtQuestion[];
}

export interface PlotSeriesData {
  title: string;
  xlabel?: string;
  ylabel?: string;
  series: {
    name: string;
    x: number[];
    y: number[];
    color?: string;
  }[];
}
