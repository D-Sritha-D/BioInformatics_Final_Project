import { useState, useCallback } from 'react';
import {
  SequenceInput,
  AlignmentMatrix,
  AlignmentResult,
  StepVisualizer,
  ProteinFoldingInput,
  ProteinFoldingResult,
  FoldingStepVisualizer,
  UniqueConformations,
} from './components';
import {
  globalAlignment,
  bandedAlignment,
  runChouFasman,
  runGeneticFolding,
  runHillClimbingFolding,
  runSimulatedAnnealingFolding,
} from './algorithms';
import type {
  AlgorithmType,
  ScoringParams,
  BandedParams,
  AlignmentResult as AlignmentResultType,
  FoldingResult as FoldingResultType,
  FoldingAlgorithmType,
} from './types';
import './App.css';

function App() {
  const [activeSection, setActiveSection] = useState<'alignment' | 'folding'>('alignment');
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
  const [foldingResult, setFoldingResult] = useState<FoldingResultType | null>(null);
  const [foldingSequence, setFoldingSequence] = useState<string>('ACDEFGHIKLMNPQRSTVWY');

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

  const handleFoldingRun = useCallback(
    (sequence: string, algorithm: FoldingAlgorithmType, params: Record<string, number>) => {
      setFoldingSequence(sequence);
      let folding: FoldingResultType;
      switch (algorithm) {
        case 'genetic':
          folding = runGeneticFolding(sequence, params);
          break;
        case 'hill-climb':
          folding = runHillClimbingFolding(sequence, params);
          break;
        case 'simulated-annealing':
          folding = runSimulatedAnnealingFolding(sequence, params);
          break;
        default:
          folding = runChouFasman(sequence, params);
      }
      setFoldingResult(folding);
    },
    []
  );

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <h1>🧬 BioInsight: Algorithm Visualizer</h1>
          <p className="subtitle">
            Interactive visualization of bioinformatics alignment and protein folding algorithms
          </p>
        </div>
        <div className="nav-toggle">
          <button
            className={activeSection === 'alignment' ? 'nav-btn active' : 'nav-btn'}
            onClick={() => setActiveSection('alignment')}
          >
            Sequence Alignment
          </button>
          <button
            className={activeSection === 'folding' ? 'nav-btn active' : 'nav-btn'}
            onClick={() => setActiveSection('folding')}
          >
            Protein Folding
          </button>
        </div>
      </header>

      <main className="app-main">
        {activeSection === 'alignment' ? (
          <>
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

                <div className="matrix-section">
                  <h2>Dynamic Programming Matrix</h2>
                  <AlignmentMatrix
                    matrix={result.matrix}
                    seq1={sequences.seq1}
                    seq2={sequences.seq2}
                    currentStep={showStepVisualizer ? currentStep : undefined}
                    showBand={algorithm === 'banded'}
                    bandwidth={bandwidth}
                  />
                </div>

                {showStepVisualizer && result.steps.length > 0 && (
                  <div className="step-section">
                    <StepVisualizer
                      steps={result.steps}
                      onStepChange={handleStepChange}
                      isPlaying={isPlaying}
                      onPlayPause={handlePlayPause}
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
          </>
        ) : (
          <>
            <div className="folding-grid">
              <div className="input-panel">
                <ProteinFoldingInput onRun={handleFoldingRun} />
              </div>
              {foldingResult ? (
                <div className="folding-results">
                  <ProteinFoldingResult result={foldingResult} sequence={foldingSequence} />
                  <FoldingStepVisualizer steps={foldingResult.steps} />
                  {foldingResult.algorithm === 'genetic' && foldingResult.uniqueConformations?.length ? (
                    <UniqueConformations
                      conformations={foldingResult.uniqueConformations}
                      sequence={foldingSequence}
                    />
                  ) : null}
                </div>
              ) : (
                <div className="folding-placeholder">
                  <h3>Select a protein folding algorithm</h3>
                  <p>
                    Choose Genetic Algorithm for stochastic exploration of folds, or Chou-Fasman for
                    propensity-based secondary structure prediction.
                  </p>
                </div>
              )}
            </div>

            <section className="info-section">
              <div className="algorithm-info-card">
                <h3>🧠 Genetic Algorithm</h3>
                <p>
                  Evolves candidate secondary structures via crossover and mutation, keeping the most
                  stable folds each generation.
                </p>
                <ul>
                  <li>Explores diverse folds quickly</li>
                  <li>Scoring rewards hydrophobic cores</li>
                  <li>Great for experimentation</li>
                </ul>
              </div>

              <div className="algorithm-info-card">
                <h3>⛰️ Hill Climbing</h3>
                <p>
                  Greedily improves a single conformation by accepting only non-worse local tweaks, with periodic restarts.
                </p>
                <ul>
                  <li>Fast local refinement</li>
                  <li>Restarts help escape peaks</li>
                  <li>Simple, deterministic moves</li>
                </ul>
              </div>

              <div className="algorithm-info-card">
                <h3>❄️ Simulated Annealing</h3>
                <p>
                  Uses temperature-controlled randomness to accept occasional worse moves early, cooling into stronger folds.
                </p>
                <ul>
                  <li>Balances exploration/exploitation</li>
                  <li>Metropolis acceptance rule</li>
                  <li>Good for escaping local optima</li>
                </ul>
              </div>

              <div className="algorithm-info-card">
                <h3>📊 Chou-Fasman</h3>
                <p>
                  Uses residue-specific helix and sheet propensities in a sliding window to assign
                  secondary structure along the sequence.
                </p>
                <ul>
                  <li>Lightweight and deterministic</li>
                  <li>Highlights helix/sheet-prone regions</li>
                  <li>Ideal for quick heuristics</li>
                </ul>
              </div>
            </section>
          </>
        )}
      </main>

      <footer className="app-footer">
        <p>
          Built for educational purposes | BioInsight: Algorithm Visualizer
        </p>
      </footer>
    </div>
  );
}

export default App;
