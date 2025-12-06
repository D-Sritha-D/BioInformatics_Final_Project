import './AlignmentResult.css';

interface AlignmentResultProps {
  alignedSeq1: string;
  alignedSeq2: string;
  score: number;
  algorithm: string;
}

export function AlignmentResult({
  alignedSeq1,
  alignedSeq2,
  algorithm,
}: AlignmentResultProps) {
  // Generate the match line showing matches, mismatches, and gaps
  const generateMatchLine = (): string => {
    return alignedSeq1
      .split('')
      .map((char, idx) => {
        if (char === '-' || alignedSeq2[idx] === '-') return ' ';
        if (char === alignedSeq2[idx]) return '|';
        return '·';
      })
      .join('');
  };

  // Calculate alignment statistics
  const calculateStats = () => {
    let matches = 0;
    let mismatches = 0;
    let gaps = 0;

    for (let i = 0; i < alignedSeq1.length; i++) {
      if (alignedSeq1[i] === '-' || alignedSeq2[i] === '-') {
        gaps++;
      } else if (alignedSeq1[i] === alignedSeq2[i]) {
        matches++;
      } else {
        mismatches++;
      }
    }

    const identity = ((matches / alignedSeq1.length) * 100).toFixed(1);
    const coverage = (((matches + mismatches) / alignedSeq1.length) * 100).toFixed(1);

    return { matches, mismatches, gaps, identity, coverage };
  };

  const stats = calculateStats();
  const matchLine = generateMatchLine();

  const getCharClass = (char1: string, char2: string): string => {
    if (char1 === '-' || char2 === '-') return 'gap';
    if (char1 === char2) return 'match';
    return 'mismatch';
  };

  return (
    <div className="result-container">
      <h2>Alignment Result</h2>

      <div className="result-header">
        <div className="algorithm-badge">
          {algorithm === 'global' && 'Global Alignment'}
          {algorithm === 'local' && 'Local Alignment'}
          {algorithm === 'dovetail' && 'Dovetail Alignment'}
          {algorithm === 'banded' && 'Banded Alignment'}
        </div>
      </div>

      <div className="alignment-display">
        <div className="sequence-row">
          <span className="sequence-label">Seq 1:</span>
          <div className="sequence-chars">
            {alignedSeq1.split('').map((char, idx) => (
              <span
                key={idx}
                className={`seq-char ${getCharClass(char, alignedSeq2[idx])}`}
              >
                {char}
              </span>
            ))}
          </div>
        </div>

        <div className="match-row">
          <span className="sequence-label"></span>
          <div className="sequence-chars">
            {matchLine.split('').map((char, idx) => (
              <span key={idx} className="match-char">
                {char}
              </span>
            ))}
          </div>
        </div>

        <div className="sequence-row">
          <span className="sequence-label">Seq 2:</span>
          <div className="sequence-chars">
            {alignedSeq2.split('').map((char, idx) => (
              <span
                key={idx}
                className={`seq-char ${getCharClass(alignedSeq1[idx], char)}`}
              >
                {char}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-item">
          <span className="stat-value matches">{stats.matches}</span>
          <span className="stat-label">Matches</span>
        </div>
        <div className="stat-item">
          <span className="stat-value mismatches">{stats.mismatches}</span>
          <span className="stat-label">Mismatches</span>
        </div>
        <div className="stat-item">
          <span className="stat-value gaps">{stats.gaps}</span>
          <span className="stat-label">Gaps</span>
        </div>
        <div className="stat-item">
          <span className="stat-value identity">{stats.identity}%</span>
          <span className="stat-label">Identity</span>
        </div>
        <div className="stat-item">
          <span className="stat-value coverage">{stats.coverage}%</span>
          <span className="stat-label">Coverage</span>
        </div>
      </div>

      <div className="legend">
        <div className="legend-item">
          <span className="legend-color match"></span>
          <span>Match</span>
        </div>
        <div className="legend-item">
          <span className="legend-color mismatch"></span>
          <span>Mismatch</span>
        </div>
        <div className="legend-item">
          <span className="legend-color gap"></span>
          <span>Gap</span>
        </div>
      </div>
    </div>
  );
}
