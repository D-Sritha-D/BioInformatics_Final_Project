/**
 * Needleman-Wunsch Global Alignment Algorithm
 * 
 * This algorithm finds the optimal global alignment between two sequences
 * using dynamic programming. It considers the entire length of both sequences.
 */

import { Direction } from '../../types';
import type {
  MatrixCell,
  AlignmentResult,
  AlignmentStep,
  ScoringParams,
} from '../../types';

/**
 * Initialize the DP matrix with base cases
 */
function initializeMatrix(
  rows: number,
  cols: number,
  gapPenalty: number
): MatrixCell[][] {
  const matrix: MatrixCell[][] = [];

  for (let i = 0; i < rows; i++) {
    matrix[i] = [];
    for (let j = 0; j < cols; j++) {
      matrix[i][j] = {
        score: 0,
        direction: Direction.NONE,
        row: i,
        col: j,
        isOnPath: false,
      };
    }
  }

  // Initialize first row (gaps in sequence 1)
  for (let j = 0; j < cols; j++) {
    matrix[0][j].score = j * gapPenalty;
    matrix[0][j].direction = j === 0 ? Direction.NONE : Direction.LEFT;
  }

  // Initialize first column (gaps in sequence 2)
  for (let i = 0; i < rows; i++) {
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
  params: ScoringParams
): number {
  return char1 === char2 ? params.match : params.mismatch;
}

/**
 * Fill the DP matrix and record steps for visualization
 */
function fillMatrix(
  matrix: MatrixCell[][],
  seq1: string,
  seq2: string,
  params: ScoringParams
): AlignmentStep[] {
  const steps: AlignmentStep[] = [];

  for (let i = 1; i < matrix.length; i++) {
    for (let j = 1; j < matrix[0].length; j++) {
      const char1 = seq1[i - 1];
      const char2 = seq2[j - 1];
      const matchScore = getMatchScore(char1, char2, params);

      // Calculate scores from three directions
      const diagonalScore = matrix[i - 1][j - 1].score + matchScore;
      const upScore = matrix[i - 1][j].score + params.gapPenalty;
      const leftScore = matrix[i][j - 1].score + params.gapPenalty;

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
      steps.push({
        row: i,
        col: j,
        score: maxScore,
        direction,
        explanation: `Comparing ${char1} with ${char2}: ${char1 === char2 ? 'Match' : 'Mismatch'}`,
        cellsConsidered: [
          {
            source: 'diagonal',
            value: diagonalScore,
            operation: `${matrix[i - 1][j - 1].score} + ${matchScore} (${char1 === char2 ? 'match' : 'mismatch'})`,
          },
          {
            source: 'up',
            value: upScore,
            operation: `${matrix[i - 1][j].score} + ${params.gapPenalty} (gap in seq2)`,
          },
          {
            source: 'left',
            value: leftScore,
            operation: `${matrix[i][j - 1].score} + ${params.gapPenalty} (gap in seq1)`,
          },
        ],
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
  seq2: string
): { alignedSeq1: string; alignedSeq2: string; path: Array<{ row: number; col: number }> } {
  let alignedSeq1 = '';
  let alignedSeq2 = '';
  const path: Array<{ row: number; col: number }> = [];

  let i = matrix.length - 1;
  let j = matrix[0].length - 1;

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
 * Main function to perform Needleman-Wunsch global alignment
 */
export function globalAlignment(
  seq1: string,
  seq2: string,
  params: ScoringParams
): AlignmentResult {
  const rows = seq1.length + 1;
  const cols = seq2.length + 1;

  // Initialize matrix
  const matrix = initializeMatrix(rows, cols, params.gapPenalty);

  // Fill matrix and get steps
  const steps = fillMatrix(matrix, seq1, seq2, params);

  // Perform traceback
  const { alignedSeq1, alignedSeq2, path } = traceback(matrix, seq1, seq2);

  return {
    matrix,
    alignedSeq1,
    alignedSeq2,
    score: matrix[rows - 1][cols - 1].score,
    path,
    steps,
  };
}
