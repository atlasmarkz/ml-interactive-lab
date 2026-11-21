export type SemanticRole = 'data' | 'param' | 'output' | 'loss' | 'hyper';

export interface FormulaTerm {
  id: string;
  label: string;
  role: SemanticRole;
  shape: string;
  explanation: string;
  numpyLines: number[];
  pytorchLines?: number[];
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

export interface DerivationStep {
  rule: string; // e.g. "Chain Rule", "Log-Derivative Trick", "Add & Subtract E[h_S]"
  latex: string;
  justification: string;
}

export interface DerivationSpec {
  id: string;
  title: string;
  goal: string;
  steps: DerivationStep[];
  conclusion: string;
}

export interface ConceptBlock {
  heading: string;
  body: string;
  latex?: string;
  points?: string[];
  table?: {
    headers: string[];
    rows: string[][];
  };
}

export interface PitfallNote {
  title: string;
  detail: string;
}

export interface SandboxSpec {
  id: string;
  title: string;
  description: string;
  starterCode: string;
}

export type VerifierId =
  | 'l01-ols-ridge'
  | 'l02-1-logistic-gd'
  | 'l02-2-nb-surrogate'
  | 'l03-bias-variance'
  | 'l04-mlp-backprop'
  | 'l05-norm-opt'
  | 'l06-conv-flops'
  | 'l07-lstm-rnn'
  | 'l08-self-attention'
  | 'l09-vit-clip'
  | 'l10-gen-models'
  | 'l11-rl-bellman-ppo';

export interface LectureModule {
  id: string;
  code: string; // e.g. "L01", "L02.1"
  partGroup: 'Part I · Statistical & Linear Foundations' | 'Part II · Deep Learning Foundations' | 'Part III · Transformers, Generative Models & RL';
  slug: string;
  titleZh: string;
  titleEn: string;
  abstract: string;
  readingChecklist: string[];
  verifierId: VerifierId;
  derivations: DerivationSpec[];
  concepts: ConceptBlock[];
  formulaSpecs: FormulaCodeSpec[];
  pitfalls: PitfallNote[];
  sandbox?: SandboxSpec;
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
