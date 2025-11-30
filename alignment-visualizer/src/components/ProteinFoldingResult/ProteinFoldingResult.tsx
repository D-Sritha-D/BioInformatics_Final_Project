import type { FoldingResult } from '../../types';
import './ProteinFoldingResult.css';

interface ProteinFoldingResultProps {
  result: FoldingResult;
  sequence: string;
}

function algorithmLabel(algo: FoldingResult['algorithm']) {
  if (algo === 'genetic') return 'Genetic Algorithm';
  if (algo === 'hill-climb') return 'Hill Climbing';
  if (algo === 'simulated-annealing') return 'Simulated Annealing';
  return 'Chou-Fasman';
}

function renderStructure(structure: string) {
  return structure.split('').map((char, idx) => {
    const className =
      char === 'H' ? 'helix' : char === 'E' ? 'sheet' : 'coil';
    return (
      <span key={`${char}-${idx}`} className={`structure-char ${className}`}>
        {char}
      </span>
    );
  });
}

export function ProteinFoldingResult({ result, sequence }: ProteinFoldingResultProps) {
  return (
    <div className="folding-result-card">
      <div className="result-header">
        <div>
          <h3>Predicted Fold</h3>
          <p className="muted">Algorithm: {algorithmLabel(result.algorithm)}</p>
        </div>
        <div className="score-pill">Stability {result.stabilityScore}</div>
      </div>

      <div className="sequence-block">
        <p className="muted">Input Sequence</p>
        <div className="mono">{sequence}</div>
      </div>

      <div className="structure-block">
        <p className="muted">Secondary Structure</p>
        <div className="mono structure-view">{renderStructure(result.finalStructure)}</div>
        <div className="legend">
          <span className="legend-item"><span className="dot helix" />Helix</span>
          <span className="legend-item"><span className="dot sheet" />Sheet</span>
          <span className="legend-item"><span className="dot coil" />Coil/Loop</span>
        </div>
      </div>

      <div className="summary">
        {result.summary}
      </div>
    </div>
  );
}
