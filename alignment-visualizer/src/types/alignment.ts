/**
 * Types for sequence alignment algorithms
 */

// Direction for traceback in dynamic programming matrix
export const Direction = {
  NONE: 'none',
  DIAGONAL: 'diagonal',
  UP: 'up',
  LEFT: 'left',
} as const;

export type Direction = (typeof Direction)[keyof typeof Direction];

// Single cell in the DP matrix
export interface MatrixCell {
  score: number;
  direction: Direction;
  row: number;
  col: number;
  isOnPath: boolean;
}

// Complete alignment result
export interface AlignmentResult {
  matrix: MatrixCell[][];
  alignedSeq1: string;
  alignedSeq2: string;
  score: number;
  path: Array<{ row: number; col: number }>;
  steps: AlignmentStep[];
}

// Step-by-step visualization data
export interface AlignmentStep {
  row: number;
  col: number;
  score: number;
  direction: Direction;
  explanation: string;
  cellsConsidered: Array<{
    source: string;
    value: number;
    operation: string;
  }>;
}

// Scoring parameters
export interface ScoringParams {
  match: number;
  mismatch: number;
  gapPenalty: number;
}

// Banded alignment specific params
export interface BandedParams extends ScoringParams {
  bandwidth: number;
}

// Algorithm type
export type AlgorithmType = 'global' | 'local' | 'dovetail' | 'banded';

// Sequence type
export type SequenceType = 'dna' | 'protein';
