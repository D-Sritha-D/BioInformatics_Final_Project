/**
 * Banded Alignment Algorithm
 * 
 * An optimization of the Needleman-Wunsch algorithm that only fills
 * a diagonal band of the DP matrix. This reduces time and space complexity
 * from O(mn) to O(kn) where k is the bandwidth.
 * 
 * This is useful when we expect the sequences to be similar and the
 * optimal alignment to stay close to the main diagonal.
 */

import { Direction } from '../../types';
import type {
  MatrixCell,
  AlignmentResult,
  AlignmentStep,
  BandedParams,
} from '../../types';

/**
 * Check if a cell is within the band
 */
function isInBand(row: number, col: number, bandwidth: number): boolean {
  return Math.abs(row - col) <= bandwidth;
}

/**
 * Initialize the DP matrix with base cases for banded alignment
 */
function initializeMatrix(
  rows: number,
  cols: number,
  gapPenalty: number,
  bandwidth: number
): MatrixCell[][] {
  const matrix: MatrixCell[][] = [];

  for (let i = 0; i < rows; i++) {
    matrix[i] = [];
    for (let j = 0; j < cols; j++) {
      matrix[i][j] = {
        score: isInBand(i, j, bandwidth) ? 0 : -Infinity,
        direction: Direction.NONE,
        row: i,
        col: j,
        isOnPath: false,
      };
    }
  }

  // Initialize first row within band
  for (let j = 0; j < cols && j <= bandwidth; j++) {
    matrix[0][j].score = j * gapPenalty;
    matrix[0][j].direction = j === 0 ? Direction.NONE : Direction.LEFT;
  }

  // Initialize first column within band
  for (let i = 0; i < rows && i <= bandwidth; i++) {
    matrix[i][0].score = i * gapPenalty;
    matrix[i][0].direction = i === 0 ? Direction.NONE : Direction.UP;
  }

  return matrix;
}

/**
 * Calculate the score for a match or mismatch
 */
function getMatchScore(
  char1: string,
  char2: string,
  match: number,
  mismatch: number
): number {
  return char1 === char2 ? match : mismatch;
}

/**
 * Fill the DP matrix within the band and record steps for visualization
 */
function fillMatrix(
  matrix: MatrixCell[][],
  seq1: string,
  seq2: string,
  params: BandedParams
): AlignmentStep[] {
  const steps: AlignmentStep[] = [];
  const { match, mismatch, gapPenalty, bandwidth } = params;

  for (let i = 1; i < matrix.length; i++) {
    // Only iterate through cells within the band
    const jStart = Math.max(1, i - bandwidth);
    const jEnd = Math.min(matrix[0].length - 1, i + bandwidth);

    for (let j = jStart; j <= jEnd; j++) {
      if (!isInBand(i, j, bandwidth)) continue;

      const char1 = seq1[i - 1];
      const char2 = seq2[j - 1];
      const matchScore = getMatchScore(char1, char2, match, mismatch);

      // Calculate scores from three directions (only if in band)
      const diagonalScore = isInBand(i - 1, j - 1, bandwidth)
        ? matrix[i - 1][j - 1].score + matchScore
        : -Infinity;
      const upScore = isInBand(i - 1, j, bandwidth)
        ? matrix[i - 1][j].score + gapPenalty
        : -Infinity;
      const leftScore = isInBand(i, j - 1, bandwidth)
        ? matrix[i][j - 1].score + gapPenalty
        : -Infinity;

      // Find the maximum score and direction
      const maxScore = Math.max(diagonalScore, upScore, leftScore);
      let direction: Direction;

      if (maxScore === diagonalScore) {
        direction = Direction.DIAGONAL;
      } else if (maxScore === upScore) {
        direction = Direction.UP;
      } else {
        direction = Direction.LEFT;
      }

      matrix[i][j].score = maxScore;
      matrix[i][j].direction = direction;

      // Record step for visualization
      const cellsConsidered = [];
      if (isInBand(i - 1, j - 1, bandwidth)) {
        cellsConsidered.push({
          source: 'diagonal',
          value: diagonalScore,
          operation: `${matrix[i - 1][j - 1].score} + ${matchScore} (${char1 === char2 ? 'match' : 'mismatch'})`,
        });
      }
      if (isInBand(i - 1, j, bandwidth)) {
        cellsConsidered.push({
          source: 'up',
          value: upScore,
          operation: `${matrix[i - 1][j].score} + ${gapPenalty} (gap in seq2)`,
        });
      }
      if (isInBand(i, j - 1, bandwidth)) {
        cellsConsidered.push({
          source: 'left',
          value: leftScore,
          operation: `${matrix[i][j - 1].score} + ${gapPenalty} (gap in seq1)`,
        });
      }

      steps.push({
        row: i,
        col: j,
        score: maxScore,
        direction,
        explanation: `Comparing ${char1} with ${char2}: ${char1 === char2 ? 'Match' : 'Mismatch'} (within band)`,
        cellsConsidered,
      });
    }
  }

  return steps;
}

/**
 * Perform traceback to find the optimal alignment
 */
function traceback(
  matrix: MatrixCell[][],
  seq1: string,
  seq2: string,
  bandwidth: number
): { alignedSeq1: string; alignedSeq2: string; path: Array<{ row: number; col: number }> } {
  let alignedSeq1 = '';
  let alignedSeq2 = '';
  const path: Array<{ row: number; col: number }> = [];

  let i = matrix.length - 1;
  let j = matrix[0].length - 1;

  // Check if the endpoint is reachable within the band
  if (!isInBand(i, j, bandwidth)) {
    console.warn('Endpoint not reachable within band. Bandwidth may be too small.');
  }

  while (i > 0 || j > 0) {
    path.push({ row: i, col: j });
    matrix[i][j].isOnPath = true;

    const direction = matrix[i][j].direction;

    if (direction === Direction.DIAGONAL) {
      alignedSeq1 = seq1[i - 1] + alignedSeq1;
      alignedSeq2 = seq2[j - 1] + alignedSeq2;
      i--;
      j--;
    } else if (direction === Direction.UP) {
      alignedSeq1 = seq1[i - 1] + alignedSeq1;
      alignedSeq2 = '-' + alignedSeq2;
      i--;
    } else if (direction === Direction.LEFT) {
      alignedSeq1 = '-' + alignedSeq1;
      alignedSeq2 = seq2[j - 1] + alignedSeq2;
      j--;
    } else {
      break;
    }
  }

  path.push({ row: 0, col: 0 });
  matrix[0][0].isOnPath = true;

  return { alignedSeq1, alignedSeq2, path: path.reverse() };
}

/**
 * Main function to perform banded alignment
 */
export function bandedAlignment(
  seq1: string,
  seq2: string,
  params: BandedParams
): AlignmentResult {
  const rows = seq1.length + 1;
  const cols = seq2.length + 1;

  // Ensure bandwidth is sufficient
  const minBandwidth = Math.abs(seq1.length - seq2.length);
  const effectiveBandwidth = Math.max(params.bandwidth, minBandwidth);

  // Initialize matrix
  const matrix = initializeMatrix(rows, cols, params.gapPenalty, effectiveBandwidth);

  // Fill matrix and get steps
  const steps = fillMatrix(matrix, seq1, seq2, {
    ...params,
    bandwidth: effectiveBandwidth,
  });

  // Perform traceback
  const { alignedSeq1, alignedSeq2, path } = traceback(matrix, seq1, seq2, effectiveBandwidth);

  return {
    matrix,
    alignedSeq1,
    alignedSeq2,
    score: matrix[rows - 1][cols - 1].score,
    path,
    steps,
  };
}

/**
 * Utility function to check if banded alignment is suitable
 */
export function isBandedSuitable(seq1: string, seq2: string, bandwidth: number): boolean {
  const lengthDiff = Math.abs(seq1.length - seq2.length);
  return bandwidth >= lengthDiff;
}
