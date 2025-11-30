/**
 * Types for protein folding visualizations
 */

export type FoldingAlgorithmType = 'genetic' | 'chou-fasman' | 'hill-climb' | 'simulated-annealing';

export interface UniqueConformation {
  path: string;
  fitness: number;
  contacts: number;
  isElite?: boolean;
  positions?: { x: number; y: number }[];
}

export interface FoldingMetric {
  label: string;
  value: string | number;
  hint?: string;
}

export interface FoldingStep {
  title: string;
  description: string;
  structurePreview?: string;
  metrics?: FoldingMetric[];
  note?: string;
}

export interface FoldingResult {
  algorithm: FoldingAlgorithmType;
  finalStructure: string;
  stabilityScore: number;
  summary: string;
  steps: FoldingStep[];
  uniqueConformations?: UniqueConformation[];
}
