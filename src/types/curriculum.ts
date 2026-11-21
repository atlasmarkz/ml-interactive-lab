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
  /**
   * KaTeX string. Interactive terms use:
   * \htmlClass{formula-token formula-token-ROLE token-ID}{...}
   */
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

export interface PartModule {
  id: string; // e.g. 'part-0'
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
