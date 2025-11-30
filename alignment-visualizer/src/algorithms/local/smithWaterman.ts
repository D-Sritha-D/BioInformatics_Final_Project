/**
 * Smith-Waterman Local Alignment Algorithm
 * 
 * This algorithm finds the best local alignment between two sequences.
 * Unlike global alignment, it finds the highest-scoring subsequence alignment,
 * allowing the alignment to start and end anywhere in the sequences.
 * 
 * Key differences from Needleman-Wunsch:
 * 1. Matrix cells cannot go below 0 (negative scores reset to 0)
 * 2. Traceback starts from the highest-scoring cell (not bottom-right)
 * 3. Traceback ends when a cell with score 0 is reached
 */

import { Direction } from '../../types';
import type {
  MatrixCell,
  AlignmentResult,
  AlignmentStep,
  ScoringParams,
} from '../../types';

/**
 * Initialize the DP matrix with base cases (all zeros for local alignment)
 */
function initializeMatrix(rows: number, cols: number): MatrixCell[][] {
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
): { steps: AlignmentStep[]; maxCell: { row: number; col: number; score: number } } {
  const steps: AlignmentStep[] = [];
  let maxCell = { row: 0, col: 0, score: 0 };

  for (let i = 1; i < matrix.length; i++) {
    for (let j = 1; j < matrix[0].length; j++) {
      const char1 = seq1[i - 1];
      const char2 = seq2[j - 1];
      const matchScore = getMatchScore(char1, char2, params);

      // Calculate scores from three directions
      const diagonalScore = matrix[i - 1][j - 1].score + matchScore;
      const upScore = matrix[i - 1][j].score + params.gapPenalty;
      const leftScore = matrix[i][j - 1].score + params.gapPenalty;

      // For local alignment, the score cannot go below 0
      const maxScore = Math.max(0, diagonalScore, upScore, leftScore);
      let direction: Direction = Direction.NONE;

      if (maxScore === 0) {
        direction = Direction.NONE;
      } else if (maxScore === diagonalScore) {
        direction = Direction.DIAGONAL;
      } else if (maxScore === upScore) {
        direction = Direction.UP;
      } else {
        direction = Direction.LEFT;
      }

      matrix[i][j].score = maxScore;
      matrix[i][j].direction = direction;

      // Track the maximum scoring cell for traceback start
      if (maxScore > maxCell.score) {
        maxCell = { row: i, col: j, score: maxScore };
      }

      // Record step for visualization
      steps.push({
        row: i,
        col: j,
        score: maxScore,
        direction,
        explanation: `Comparing ${char1} with ${char2}: ${char1 === char2 ? 'Match' : 'Mismatch'}${maxScore === 0 ? ' (reset to 0)' : ''}`,
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
          {
            source: 'zero',
            value: 0,
            operation: 'Reset to 0 (local alignment)',
          },
        ],
      });
    }
  }

  return { steps, maxCell };
}

/**
 * Traceback through the matrix to find the optimal local alignment
 * Starts from the maximum scoring cell and ends when score reaches 0
 */
function traceback(
  matrix: MatrixCell[][],
  seq1: string,
  seq2: string,
  startCell: { row: number; col: number }
): { alignedSeq1: string; alignedSeq2: string; path: Array<{ row: number; col: number }> } {
  let alignedSeq1 = '';
  let alignedSeq2 = '';
  const path: Array<{ row: number; col: number }> = [];

  let i = startCell.row;
  let j = startCell.col;

  // Continue until we hit a cell with score 0 or reach the boundary
  while (i > 0 && j > 0 && matrix[i][j].score > 0) {
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
      // Direction.NONE - stop traceback
      break;
    }
  }

  return { alignedSeq1, alignedSeq2, path: path.reverse() };
}

/**
 * Main function to perform Smith-Waterman local alignment
 */
export function localAlignment(
  seq1: string,
  seq2: string,
  params: ScoringParams
): AlignmentResult {
  const rows = seq1.length + 1;
  const cols = seq2.length + 1;

  // Initialize matrix (all zeros)
  const matrix = initializeMatrix(rows, cols);

  // Fill matrix and get steps
  const { steps, maxCell } = fillMatrix(matrix, seq1, seq2, params);

  // Traceback from the maximum scoring cell
  const { alignedSeq1, alignedSeq2, path } = traceback(matrix, seq1, seq2, maxCell);

  return {
    matrix,
    alignedSeq1,
    alignedSeq2,
    score: maxCell.score,
    path,
    steps,
  };
}
