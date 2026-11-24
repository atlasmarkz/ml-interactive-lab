import React, { Suspense, lazy } from 'react';

type Loader = () => Promise<Record<string, React.ComponentType>>;
const PART: Record<string, Loader> = {
  p01: () => import('./Part01') as unknown as Promise<Record<string, React.ComponentType>>,
  p2: () => import('./Part2') as unknown as Promise<Record<string, React.ComponentType>>,
  p3: () => import('./Part3') as unknown as Promise<Record<string, React.ComponentType>>,
  p4: () => import('./Part4') as unknown as Promise<Record<string, React.ComponentType>>,
  p5: () => import('./Part5') as unknown as Promise<Record<string, React.ComponentType>>,
};

const w = (part: keyof typeof PART, name: string) => ({
  name,
  C: lazy(() => PART[part]().then((m) => ({ default: m[name] }))),
});

/** Interactive explorables per lecture id, in reading order. */
export const EXPLORABLES: Record<string, { name: string; C: React.LazyExoticComponent<React.ComponentType> }[]> = {
  l00: [w('p01', 'EntropyKL')],
  l01: [w('p01', 'PolyFitExplorer')],
  'l02-1': [w('p01', 'LogisticBoundary')],
  'l02-2': [w('p01', 'SurrogateLosses')],
  l03: [w('p01', 'BiasVarianceSim')],
  l04: [w('p2', 'ActivationGradient')],
  l05: [w('p2', 'OptimizerRace')],
  l06: [w('p2', 'ConvStepper')],
  l07: [w('p2', 'RnnGradientFlow')],
  'l08-1': [w('p3', 'AttentionPlayground')],
  'l08-2': [w('p3', 'SamplingPlayground'), w('p3', 'BradleyTerry')],
  'l08-3': [w('p3', 'AgentLoop')],
  l09: [w('p3', 'PatchifyExplorer'), w('p3', 'ClipMatrix')],
  l10: [w('p4', 'VaeReparam')],
  l11: [w('p4', 'GanOneD')],
  l12: [w('p4', 'ForwardDiffusion')],
  l13: [w('p4', 'FlowParticles')],
  l14: [w('p5', 'GridValueIteration')],
  l15: [w('p5', 'Overestimation')],
  l16: [w('p5', 'BanditReinforce')],
};

export const hasExplorables = (lectureId: string) => (EXPLORABLES[lectureId]?.length ?? 0) > 0;

export const LectureExplorables: React.FC<{ lectureId: string }> = ({ lectureId }) => (
  <div className="space-y-6">
    {(EXPLORABLES[lectureId] ?? []).map(({ name, C }) => (
      <Suspense key={name} fallback={<div className="h-64 animate-pulse rounded-xl bg-stone-100 dark:bg-zinc-900" />}>
        <C />
      </Suspense>
    ))}
  </div>
);
