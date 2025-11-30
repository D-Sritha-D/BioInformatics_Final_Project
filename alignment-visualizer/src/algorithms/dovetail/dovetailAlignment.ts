/**
 * Dovetail (Semi-Global) Alignment Algorithm
 * 
 * Dovetail alignment is designed for overlapping sequences, such as when
 * assembling DNA fragments. It allows free gaps at the beginning of one
 * sequence and the end of the other (or vice versa).
 * 
 * This is useful for:
 * - Sequence assembly (finding overlaps between reads)
 * - Finding how two sequences overlap at their ends
 * 
 * Key differences from global alignment:
 * 1. No penalty for gaps at the start of seq1 or seq2 (first row/col = 0)
 * 2. Traceback can start from the last row or last column (not just bottom-right)
 * 3. No penalty for trailing gaps at the end
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
 * For dovetail: first row and first column are all 0 (no gap penalty for leading gaps)
 */
function initializeMatrix(rows: number, cols: number): MatrixCell[][] {
  const matrix: MatrixCell[][] = [];

  for (let i = 0; i < rows; i++) {
    matrix[i] = [];
    for (let j = 0; j < cols; j++) {
      matrix[i][j] = {
        score: 0, // No penalty for leading gaps
        direction: Direction.NONE,
        row: i,
        col: j,
        isOnPath: false,
      };
    }
  }

  // First row: direction is LEFT (but score stays 0)
  for (let j = 1; j < cols; j++) {
    matrix[0][j].direction = Direction.LEFT;
  }

  // First column: direction is UP (but score stays 0)
  for (let i = 1; i < rows; i++) {
    matrix[i][0].direction = Direction.UP;
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
      let direction: Direction = Direction.DIAGONAL;

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
 * Find the best starting cell for traceback
 * For dovetail: can start from last row or last column (whichever has highest score)
 */
function findBestEndCell(
  matrix: MatrixCell[][]
): { row: number; col: number; score: number } {
  const rows = matrix.length;
  const cols = matrix[0].length;
  let bestCell = { row: rows - 1, col: cols - 1, score: matrix[rows - 1][cols - 1].score };

  // Check last row (seq1 fully aligned, seq2 may have trailing gap)
  for (let j = 0; j < cols; j++) {
    if (matrix[rows - 1][j].score > bestCell.score) {
      bestCell = { row: rows - 1, col: j, score: matrix[rows - 1][j].score };
    }
  }

  // Check last column (seq2 fully aligned, seq1 may have trailing gap)
  for (let i = 0; i < rows; i++) {
    if (matrix[i][cols - 1].score > bestCell.score) {
      bestCell = { row: i, col: cols - 1, score: matrix[i][cols - 1].score };
    }
  }

  return bestCell;
}

/**
 * Traceback through the matrix to find the optimal dovetail alignment
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

  const rows = matrix.length;
  const cols = matrix[0].length;

  let i = startCell.row;
  let j = startCell.col;

  // Add trailing gaps if we didn't start at bottom-right
  if (i < rows - 1) {
    // Add gaps for remaining seq1
    for (let k = rows - 1; k > i; k--) {
      alignedSeq1 = seq1[k - 1] + alignedSeq1;
      alignedSeq2 = '-' + alignedSeq2;
    }
  }
  if (j < cols - 1) {
    // Add gaps for remaining seq2
    for (let k = cols - 1; k > j; k--) {
      alignedSeq1 = '-' + alignedSeq1;
      alignedSeq2 = seq2[k - 1] + alignedSeq2;
    }
  }

  // Standard traceback
  while (i > 0 && j > 0) {
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
    } else {
      alignedSeq1 = '-' + alignedSeq1;
      alignedSeq2 = seq2[j - 1] + alignedSeq2;
      j--;
    }
  }

  // Handle remaining characters (leading gaps - no penalty in dovetail)
  while (i > 0) {
    alignedSeq1 = seq1[i - 1] + alignedSeq1;
    alignedSeq2 = '-' + alignedSeq2;
    path.push({ row: i, col: 0 });
    matrix[i][0].isOnPath = true;
    i--;
  }
  while (j > 0) {
    alignedSeq1 = '-' + alignedSeq1;
    alignedSeq2 = seq2[j - 1] + alignedSeq2;
    path.push({ row: 0, col: j });
    matrix[0][j].isOnPath = true;
    j--;
  }

  path.push({ row: 0, col: 0 });
  matrix[0][0].isOnPath = true;

  return { alignedSeq1, alignedSeq2, path: path.reverse() };
}

/**
 * Main function to perform dovetail (semi-global) alignment
 */
export function dovetailAlignment(
  seq1: string,
  seq2: string,
  params: ScoringParams
): AlignmentResult {
  const rows = seq1.length + 1;
  const cols = seq2.length + 1;

  // Initialize matrix (no penalty for leading gaps)
  const matrix = initializeMatrix(rows, cols);

  // Fill matrix and get steps
  const steps = fillMatrix(matrix, seq1, seq2, params);

  // Find best cell to start traceback (can be last row or last column)
  const bestEndCell = findBestEndCell(matrix);

  // Traceback to find alignment
  const { alignedSeq1, alignedSeq2, path } = traceback(matrix, seq1, seq2, bestEndCell);

  return {
    matrix,
    alignedSeq1,
    alignedSeq2,
    score: bestEndCell.score,
    path,
    steps,
  };
}
