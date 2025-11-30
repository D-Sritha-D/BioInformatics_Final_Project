import { useState, useCallback } from 'react';
import {
  SequenceInput,
  AlignmentMatrix,
  AlignmentResult,
  StepVisualizer,
} from './components';
import { globalAlignment, localAlignment, dovetailAlignment, bandedAlignment } from './algorithms';
import type {
  AlgorithmType,
  ScoringParams,
  BandedParams,
  AlignmentResult as AlignmentResultType,
} from './types';
import './App.css';

function App() {
  const [result, setResult] = useState<AlignmentResultType | null>(null);
  const [sequences, setSequences] = useState<{ seq1: string; seq2: string }>({
    seq1: '',
    seq2: '',
  });
  const [algorithm, setAlgorithm] = useState<AlgorithmType>('global');
  const [bandwidth, setBandwidth] = useState<number>(3);
  const [currentStep, setCurrentStep] = useState<number | undefined>(undefined);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showStepVisualizer, setShowStepVisualizer] = useState(false);

  const handleAlign = useCallback(
    (
      seq1: string,
      seq2: string,
      algo: AlgorithmType,
      params: ScoringParams | BandedParams
    ) => {
      setSequences({ seq1, seq2 });
      setAlgorithm(algo);
      setCurrentStep(undefined);
      setIsPlaying(false);

      let alignmentResult: AlignmentResultType;

      if (algo === 'global') {
        alignmentResult = globalAlignment(seq1, seq2, params);
      } else if (algo === 'local') {
        alignmentResult = localAlignment(seq1, seq2, params);
      } else if (algo === 'dovetail') {
        alignmentResult = dovetailAlignment(seq1, seq2, params);
      } else {
        const bandedParams = params as BandedParams;
        setBandwidth(bandedParams.bandwidth);
        alignmentResult = bandedAlignment(seq1, seq2, bandedParams);
      }

      setResult(alignmentResult);
    },
    []
  );

  const handleStepChange = useCallback((step: number) => {
    setCurrentStep(step);
  }, []);

  const handlePlayPause = useCallback(() => {
    setIsPlaying((prev) => !prev);
  }, []);

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <h1>🧬 Sequence Alignment</h1>
          <p className="subtitle">
            Interactive visualization of bioinformatics alignment algorithms
          </p>
        </div>
      </header>

      <main className="app-main">
        <div className="input-panel">
          <SequenceInput onAlign={handleAlign} />
        </div>

        {result && (
          <div className="results-panel">
            <div className="visualization-controls">
              <button
                className={`viz-toggle ${showStepVisualizer ? '' : 'active'}`}
                onClick={() => setShowStepVisualizer(false)}
              >
                Final Result
              </button>
              <button
                className={`viz-toggle ${showStepVisualizer ? 'active' : ''}`}
                onClick={() => setShowStepVisualizer(true)}
              >
                Step-by-Step
              </button>
            </div>

            <div className="result-section">
              <AlignmentResult
                alignedSeq1={result.alignedSeq1}
                alignedSeq2={result.alignedSeq2}
                score={result.score}
                algorithm={algorithm}
              />
            </div>

            {showStepVisualizer && result.steps.length > 0 ? (
              <div className="step-by-step-layout">
                <div className="matrix-with-controls">
                  <h2>Dynamic Programming Matrix</h2>
                  <AlignmentMatrix
                    matrix={result.matrix}
                    seq1={sequences.seq1}
                    seq2={sequences.seq2}
                    currentStep={currentStep}
                    showBand={algorithm === 'banded'}
                    bandwidth={bandwidth}
                  />
                </div>
                <div className="step-section">
                  <StepVisualizer
                    steps={result.steps}
                    onStepChange={handleStepChange}
                    isPlaying={isPlaying}
                    onPlayPause={handlePlayPause}
                  />
                </div>
              </div>
            ) : (
              <div className="matrix-section">
                <h2>Dynamic Programming Matrix</h2>
                <AlignmentMatrix
                  matrix={result.matrix}
                  seq1={sequences.seq1}
                  seq2={sequences.seq2}
                  currentStep={undefined}
                  showBand={algorithm === 'banded'}
                  bandwidth={bandwidth}
                />
              </div>
            )}
          </div>
        )}

        <section className="info-section">
          <div className="algorithm-info-card">
            <h3>🎯 Global Alignment (Needleman-Wunsch)</h3>
            <p>
              The Needleman-Wunsch algorithm finds the best alignment between two
              sequences over their entire lengths. It uses dynamic programming to
              fill a scoring matrix and traceback to find the optimal path.
            </p>
            <ul>
              <li>Time Complexity: O(m × n)</li>
              <li>Space Complexity: O(m × n)</li>
              <li>Best for: Comparing sequences of similar length</li>
            </ul>
          </div>

          <div className="algorithm-info-card">
            <h3>🔍 Local Alignment (Smith-Waterman)</h3>
            <p>
              The Smith-Waterman algorithm finds the best local alignment by
              identifying the highest-scoring subsequence match. Negative scores
              reset to zero, allowing alignment to start and end anywhere.
            </p>
            <ul>
              <li>Time Complexity: O(m × n)</li>
              <li>Space Complexity: O(m × n)</li>
              <li>Best for: Finding conserved regions or motifs</li>
            </ul>
          </div>

          <div className="algorithm-info-card">
            <h3>🔗 Dovetail Alignment (Semi-Global)</h3>
            <p>
              Dovetail alignment finds overlapping alignments between sequences,
              allowing free gaps at sequence ends. It's ideal for sequence
              assembly where fragments overlap.
            </p>
            <ul>
              <li>Time Complexity: O(m × n)</li>
              <li>Space Complexity: O(m × n)</li>
              <li>Best for: Sequence assembly, finding overlaps</li>
            </ul>
          </div>

          <div className="algorithm-info-card">
            <h3>📏 Banded Alignment</h3>
            <p>
              Banded alignment is an optimization that only considers cells within
              a diagonal band of width k. This assumes the optimal alignment stays
              close to the main diagonal.
            </p>
            <ul>
              <li>Time Complexity: O(k × n)</li>
              <li>Space Complexity: O(k × n)</li>
              <li>Best for: Similar sequences where gaps are limited</li>
            </ul>
          </div>
        </section>
      </main>

      <footer className="app-footer">
        <p>
          Built for educational purposes | Sequence Alignment Visualizer
        </p>
      </footer>
    </div>
  );
}

export default App;
