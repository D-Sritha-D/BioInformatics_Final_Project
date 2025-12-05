import { useState } from 'react';
import type { ScoringParams, BandedParams, AlgorithmType } from '../../types';
import './SequenceInput.css';

interface SequenceInputProps {
  onAlign: (
    seq1: string,
    seq2: string,
    algorithm: AlgorithmType,
    params: ScoringParams | BandedParams
  ) => void;
  onAlgorithmChange?: (algorithm: AlgorithmType) => void;
}

// DNA validation regex - only allows A, T, C, G characters
const DNA_REGEX = /^[ATCG]*$/i;

export function SequenceInput({ onAlign, onAlgorithmChange }: SequenceInputProps) {
  const [seq1, setSeq1] = useState('GCATGCG');
  const [seq2, setSeq2] = useState('GATTACA');
  const [algorithm, setAlgorithm] = useState<AlgorithmType>('global');

  const handleAlgorithmChange = (newAlgorithm: AlgorithmType) => {
    setAlgorithm(newAlgorithm);
    onAlgorithmChange?.(newAlgorithm);
  };
  
  // Scoring parameters
  const [match, setMatch] = useState(1);
  const [mismatch, setMismatch] = useState(-1);
  const [gapPenalty, setGapPenalty] = useState(-2);
  const [bandwidth, setBandwidth] = useState(3);

  // Validation errors
  const [errors, setErrors] = useState<{ seq1?: string; seq2?: string }>({});

  const validateDNASequence = (seq: string): boolean => {
    return DNA_REGEX.test(seq);
  };

  const handleSeq1Change = (value: string) => {
    const upperValue = value.toUpperCase();
    setSeq1(upperValue);
    if (upperValue && !validateDNASequence(upperValue)) {
      setErrors((prev) => ({
        ...prev,
        seq1: 'Invalid DNA sequence. Only A, T, C, G characters are allowed.',
      }));
    } else {
      setErrors((prev) => ({ ...prev, seq1: undefined }));
    }
  };

  const handleSeq2Change = (value: string) => {
    const upperValue = value.toUpperCase();
    setSeq2(upperValue);
    if (upperValue && !validateDNASequence(upperValue)) {
      setErrors((prev) => ({
        ...prev,
        seq2: 'Invalid DNA sequence. Only A, T, C, G characters are allowed.',
      }));
    } else {
      setErrors((prev) => ({ ...prev, seq2: undefined }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!seq1 || !seq2) {
      setErrors({
        seq1: !seq1 ? 'Sequence 1 is required' : undefined,
        seq2: !seq2 ? 'Sequence 2 is required' : undefined,
      });
      return;
    }

    if (errors.seq1 || errors.seq2) return;

    const params: ScoringParams | BandedParams =
      algorithm === 'banded'
        ? { match, mismatch, gapPenalty, bandwidth }
        : { match, mismatch, gapPenalty };

    onAlign(seq1, seq2, algorithm, params);
  };

  const loadExample = () => {
    setSeq1('GCATGCG');
    setSeq2('GATTACA');
    setErrors({});
  };

  return (
    <div className="sequence-input-container">
      <form onSubmit={handleSubmit}>
        <div className="input-section">
          <div className="sequence-inputs">
            <div className="input-group">
              <label htmlFor="seq1">Sequence 1:</label>
              <input
                id="seq1"
                type="text"
                value={seq1}
                onChange={(e) => handleSeq1Change(e.target.value)}
                placeholder="Enter DNA sequence (A, T, C, G)"
                className={errors.seq1 ? 'error' : ''}
              />
              {errors.seq1 && <span className="error-message">{errors.seq1}</span>}
            </div>

            <div className="input-group">
              <label htmlFor="seq2">Sequence 2:</label>
              <input
                id="seq2"
                type="text"
                value={seq2}
                onChange={(e) => handleSeq2Change(e.target.value)}
                placeholder="Enter DNA sequence (A, T, C, G)"
                className={errors.seq2 ? 'error' : ''}
              />
              {errors.seq2 && <span className="error-message">{errors.seq2}</span>}
            </div>
          </div>

          <button type="button" className="example-btn" onClick={loadExample}>
            Load Example
          </button>
        </div>

        <div className="algorithm-section">
          <h3>Algorithm</h3>
          <div className="algorithm-selector">
            <label className={`algorithm-option ${algorithm === 'global' ? 'selected' : ''}`}>
              <input
                type="radio"
                value="global"
                checked={algorithm === 'global'}
                onChange={(e) => handleAlgorithmChange(e.target.value as AlgorithmType)}
              />
              <div className="algorithm-info">
                <strong>Global Alignment</strong>
                <span>(Needleman-Wunsch)</span>
                <p>Aligns entire sequences end-to-end</p>
              </div>
            </label>

            <label className={`algorithm-option ${algorithm === 'local' ? 'selected' : ''}`}>
              <input
                type="radio"
                value="local"
                checked={algorithm === 'local'}
                onChange={(e) => handleAlgorithmChange(e.target.value as AlgorithmType)}
              />
              <div className="algorithm-info">
                <strong>Local Alignment</strong>
                <span>(Smith-Waterman)</span>
                <p>Finds best matching subsequences</p>
              </div>
            </label>

            <label className={`algorithm-option ${algorithm === 'dovetail' ? 'selected' : ''}`}>
              <input
                type="radio"
                value="dovetail"
                checked={algorithm === 'dovetail'}
                onChange={(e) => handleAlgorithmChange(e.target.value as AlgorithmType)}
              />
              <div className="algorithm-info">
                <strong>Dovetail Alignment</strong>
                <span>(Semi-Global)</span>
                <p>Finds overlapping sequence alignments</p>
              </div>
            </label>

            <label className={`algorithm-option ${algorithm === 'banded' ? 'selected' : ''}`}>
              <input
                type="radio"
                value="banded"
                checked={algorithm === 'banded'}
                onChange={(e) => handleAlgorithmChange(e.target.value as AlgorithmType)}
              />
              <div className="algorithm-info">
                <strong>Banded Alignment</strong>
                <span>(Optimized)</span>
                <p>Faster alignment within a diagonal band</p>
              </div>
            </label>
          </div>
        </div>

        <div className="scoring-section">
          <h3>Scoring Parameters</h3>
          <div className="scoring-grid">
            <div className="score-input">
              <label htmlFor="match">Match Score:</label>
              <input
                id="match"
                type="number"
                value={match}
                onChange={(e) => setMatch(Number(e.target.value))}
              />
            </div>

            <div className="score-input">
              <label htmlFor="mismatch">Mismatch Score:</label>
              <input
                id="mismatch"
                type="number"
                value={mismatch}
                onChange={(e) => setMismatch(Number(e.target.value))}
              />
            </div>

            <div className="score-input">
              <label htmlFor="gap">Gap Penalty:</label>
              <input
                id="gap"
                type="number"
                value={gapPenalty}
                onChange={(e) => setGapPenalty(Number(e.target.value))}
              />
            </div>

            {algorithm === 'banded' && (
              <div className="score-input">
                <label htmlFor="bandwidth">Bandwidth (k):</label>
                <input
                  id="bandwidth"
                  type="number"
                  min={1}
                  value={bandwidth}
                  onChange={(e) => setBandwidth(Math.max(1, Number(e.target.value)))}
                />
              </div>
            )}
          </div>
        </div>

        <button type="submit" className="align-btn">
          Run Alignment
        </button>
      </form>
    </div>
  );
}
