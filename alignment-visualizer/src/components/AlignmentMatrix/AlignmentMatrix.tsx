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
  // Determine which cells are highlighted based on current step
  const highlightedCells = useMemo(() => {
    if (currentStep === undefined) return new Set<string>();
    
    const cells = new Set<string>();
    // Highlight cells up to the current step
    let count = 0;
    for (let i = 1; i < matrix.length && count <= currentStep; i++) {
      for (let j = 1; j < matrix[0].length && count <= currentStep; j++) {
        cells.add(`${i}-${j}`);
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

  const getCellClass = (cell: MatrixCell): string => {
    const classes = ['matrix-cell'];
    
    if (cell.isOnPath) {
      classes.push('on-path');
    }
    
    if (showBand && !isInBand(cell.row, cell.col)) {
      classes.push('outside-band');
    }
    
    if (currentStep !== undefined && highlightedCells.has(`${cell.row}-${cell.col}`)) {
      classes.push('filled');
    }
    
    return classes.join(' ');
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
                  <div className="cell-content">
                    <span className="cell-score">{cell.score}</span>
                    <span className="cell-arrow">{getDirectionArrow(cell.direction)}</span>
                  </div>
                </td>
              ))}
            </tr>
            {seq1.split('').map((char, i) => (
              <tr key={i}>
                <th className="row-header seq-char">{char}</th>
                {matrix[i + 1].map((cell, j) => (
                  <td key={j} className={getCellClass(cell)}>
                    <div className="cell-content">
                      <span className="cell-score">
                        {cell.score === -Infinity ? '−∞' : cell.score}
                      </span>
                      <span className="cell-arrow">{getDirectionArrow(cell.direction)}</span>
                    </div>
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
