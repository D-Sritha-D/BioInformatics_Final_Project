import { useMemo } from 'react';
import type { MatrixCell } from '../../types';
import { Direction } from '../../types';
import './AlignmentMatrix.css';

interface AlignmentMatrixProps {
  matrix: MatrixCell[][];
  seq1: string;
  seq2: string;
  currentStep?: number;
  showBand?: boolean;
  bandwidth?: number;
}

export function AlignmentMatrix({
  matrix,
  seq1,
  seq2,
  currentStep,
  showBand = false,
  bandwidth = 0,
}: AlignmentMatrixProps) {
  // Determine which cells have been filled based on current step
  const filledCells = useMemo(() => {
    if (currentStep === undefined) return null; // null means show all cells (final result mode)
    
    const cells = new Set<string>();
    // Track cells that have been filled up to the current step
    let count = 0;
    for (let i = 1; i < matrix.length; i++) {
      for (let j = 1; j < matrix[0].length; j++) {
        if (count <= currentStep) {
          cells.add(`${i}-${j}`);
        }
        count++;
      }
    }
    return cells;
  }, [matrix, currentStep]);

  const isInBand = (row: number, col: number): boolean => {
    return Math.abs(row - col) <= bandwidth;
  };

  const getDirectionArrow = (direction: Direction): string => {
    switch (direction) {
      case Direction.DIAGONAL:
        return '↖';
      case Direction.UP:
        return '↑';
      case Direction.LEFT:
        return '←';
      default:
        return '';
    }
  };

  // Check if a cell should show its value (in step-by-step mode)
  const isCellFilled = (row: number, col: number): boolean => {
    // First row and column are always filled (base cases)
    if (row === 0 || col === 0) return true;
    // If not in step-by-step mode, show all
    if (filledCells === null) return true;
    // Check if this cell has been filled
    return filledCells.has(`${row}-${col}`);
  };

  // Check if a cell is the current step being calculated
  const isCurrentStep = (row: number, col: number): boolean => {
    if (currentStep === undefined || row === 0 || col === 0) return false;
    
    let count = 0;
    for (let i = 1; i < matrix.length; i++) {
      for (let j = 1; j < matrix[0].length; j++) {
        if (i === row && j === col) {
          return count === currentStep;
        }
        count++;
      }
    }
    return false;
  };

  const getCellClass = (cell: MatrixCell): string => {
    const classes = ['matrix-cell'];
    
    // In final result mode, show the path
    if (filledCells === null && cell.isOnPath) {
      classes.push('on-path');
    }
    
    if (showBand && !isInBand(cell.row, cell.col)) {
      classes.push('outside-band');
    }
    
    // Highlight the current step being calculated
    if (isCurrentStep(cell.row, cell.col)) {
      classes.push('current-step');
    } else if (filledCells !== null && isCellFilled(cell.row, cell.col) && cell.row > 0 && cell.col > 0) {
      classes.push('filled');
    }
    
    // Mark unfilled cells in step-by-step mode
    if (filledCells !== null && !isCellFilled(cell.row, cell.col)) {
      classes.push('unfilled');
    }
    
    return classes.join(' ');
  };

  const renderCellContent = (cell: MatrixCell): React.ReactNode => {
    const filled = isCellFilled(cell.row, cell.col);
    
    if (!filled) {
      return (
        <div className="cell-content">
          <span className="cell-score cell-empty">?</span>
        </div>
      );
    }
    
    return (
      <div className="cell-content">
        <span className="cell-score">
          {cell.score === -Infinity ? '−∞' : cell.score}
        </span>
        <span className="cell-arrow">{getDirectionArrow(cell.direction)}</span>
      </div>
    );
  };

  return (
    <div className="matrix-container">
      <div className="matrix-wrapper">
        <table className="alignment-matrix">
          <thead>
            <tr>
              <th className="corner-cell"></th>
              <th className="header-cell">-</th>
              {seq2.split('').map((char, idx) => (
                <th key={idx} className="header-cell seq-char">
                  {char}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <th className="row-header">-</th>
              {matrix[0].map((cell, j) => (
                <td key={j} className={getCellClass(cell)}>
                  {renderCellContent(cell)}
                </td>
              ))}
            </tr>
            {seq1.split('').map((char, i) => (
              <tr key={i}>
                <th className="row-header seq-char">{char}</th>
                {matrix[i + 1].map((cell, j) => (
                  <td key={j} className={getCellClass(cell)}>
                    {renderCellContent(cell)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="matrix-legend">
        <div className="legend-item">
          <div className="legend-color on-path"></div>
          <span>Optimal Path</span>
        </div>
        {showBand && (
          <div className="legend-item">
            <div className="legend-color outside-band"></div>
            <span>Outside Band</span>
          </div>
        )}
        {filledCells !== null && (
          <div className="legend-item">
            <div className="legend-color current-step"></div>
            <span>Current Step</span>
          </div>
        )}
        <div className="legend-item">
          <span className="arrow-legend">↖ Diagonal (match/mismatch)</span>
        </div>
        <div className="legend-item">
          <span className="arrow-legend">↑ Up (gap in seq2)</span>
        </div>
        <div className="legend-item">
          <span className="arrow-legend">← Left (gap in seq1)</span>
        </div>
      </div>
    </div>
  );
}
