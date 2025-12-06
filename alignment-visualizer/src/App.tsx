import { useState, useCallback, useEffect } from 'react';
import {
  SequenceInput,
  AlignmentMatrix,
  AlignmentResult,
  StepVisualizer,
  Homepage,
  ScoringMatrix,
  SuffixTree,
  PhylogenyTree,
  DistanceMatrix,
  ProteinStructure,
} from './components';
import { globalAlignment, localAlignment, dovetailAlignment, bandedAlignment } from './algorithms';
import type {
  AlgorithmType,
  ScoringParams,
  BandedParams,
  AlignmentResult as AlignmentResultType,
} from './types';
import './App.css';

type PageType = 'homepage' | 'alignment' | 'scoring-matrix' | 'suffix-tree' | 'phylogeny' | 'distance-matrix' | 'protein-structure';

// Helper function to get page from URL hash
const getPageFromHash = (): PageType => {
  const hash = window.location.hash.slice(1); // Remove the '#'
  const validPages: PageType[] = [
    'homepage',
    'alignment',
    'scoring-matrix',
    'suffix-tree',
    'phylogeny',
    'distance-matrix',
    'protein-structure',
  ];
  return validPages.includes(hash as PageType) ? (hash as PageType) : 'homepage';
};

// Helper function to set URL hash
const setHashForPage = (page: PageType) => {
  window.location.hash = page;
};

function App() {
  const [currentPage, setCurrentPage] = useState<PageType>(getPageFromHash);
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

  // Listen for hash changes (browser back/forward buttons)
  useEffect(() => {
    const handleHashChange = () => {
      setCurrentPage(getPageFromHash());
    };
    
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Update hash when page changes
  useEffect(() => {
    setHashForPage(currentPage);
  }, [currentPage]);

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

  const handleNavigateToVisualizer = useCallback(() => {
    setCurrentPage('alignment');
    // Reset to default state when coming from homepage
    setResult(null);
    setCurrentStep(undefined);
    setIsPlaying(false);
    setAlgorithm('global');
  }, []);

  const handleNavigateToHomepage = useCallback(() => {
    setCurrentPage('homepage');
  }, []);

  const handleNavigateToScoringMatrix = useCallback(() => {
    setCurrentPage('scoring-matrix');
  }, []);

  const handleNavigateToSuffixTree = useCallback(() => {
    setCurrentPage('suffix-tree');
  }, []);

  const handleNavigateToPhylogeny = useCallback(() => {
    setCurrentPage('phylogeny');
  }, []);

  const handleNavigateToDistanceMatrix = useCallback(() => {
    setCurrentPage('distance-matrix');
  }, []);

  const handleNavigateToProteinStructure = useCallback(() => {
    setCurrentPage('protein-structure');
  }, []);

  const handleAlgorithmChange = useCallback((algo: AlgorithmType) => {
    setAlgorithm(algo);
    // Clear previous results to avoid confusion when switching algorithms
    setResult(null);
    setCurrentStep(undefined);
    setIsPlaying(false);
  }, []);

  if (currentPage === 'homepage') {
    return (
      <Homepage 
        onNavigateToVisualizer={handleNavigateToVisualizer} 
        onNavigateToScoringMatrix={handleNavigateToScoringMatrix}
        onNavigateToSuffixTree={handleNavigateToSuffixTree}
        onNavigateToPhylogeny={handleNavigateToPhylogeny}
        onNavigateToDistanceMatrix={handleNavigateToDistanceMatrix}
        onNavigateToProteinStructure={handleNavigateToProteinStructure}
      />
    );
  }

  if (currentPage === 'scoring-matrix') {
    return <ScoringMatrix onNavigateToHomepage={handleNavigateToHomepage} />;
  }

  if (currentPage === 'suffix-tree') {
    return <SuffixTree onNavigateToHomepage={handleNavigateToHomepage} />;
  }

  if (currentPage === 'phylogeny') {
    return <PhylogenyTree onNavigateToHomepage={handleNavigateToHomepage} />;
  }

  if (currentPage === 'distance-matrix') {
    return <DistanceMatrix onNavigateToHomepage={handleNavigateToHomepage} />;
  }

  if (currentPage === 'protein-structure') {
    return <ProteinStructure onNavigateToHomepage={handleNavigateToHomepage} />;
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <h1>🧬 Sequence Alignment</h1>
          <button
            onClick={handleNavigateToHomepage}
            style={{
              marginTop: '1rem',
              padding: '0.5rem 1.5rem',
              background: 'rgba(255, 255, 255, 0.2)',
              border: '1px solid rgba(255, 255, 255, 0.5)',
              borderRadius: '8px',
              color: '#ffffff',
              fontSize: '0.9rem',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
            }}
          >
            ← Back to Homepage
          </button>
        </div>
      </header>

      <main className="app-main">
        <div className="input-panel">
          <SequenceInput onAlign={handleAlign} onAlgorithmChange={handleAlgorithmChange} />
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
          {algorithm === 'global' && (
            <div className="algorithm-info-card full-width">
              <h3>Global Alignment (Needleman-Wunsch)</h3>
              <p>
                The Needleman-Wunsch algorithm finds the optimal alignment between two
                sequences over their <strong>entire lengths</strong>. Published in 1970, it was
                the first application of dynamic programming to biological sequence comparison.
              </p>
              
              <div className="formula-section">
                <h4>Recurrence Relation</h4>
                <div className="formula">
                  <code>
                    F(i,j) = max {'{'}
                    <br />
                    &nbsp;&nbsp;F(i-1, j-1) + S(xᵢ, yⱼ),&nbsp;&nbsp;<span className="formula-comment">// Match/Mismatch</span>
                    <br />
                    &nbsp;&nbsp;F(i-1, j) + d,&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span className="formula-comment">// Gap in sequence Y</span>
                    <br />
                    &nbsp;&nbsp;F(i, j-1) + d&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span className="formula-comment">// Gap in sequence X</span>
                    <br />
                    {'}'}
                  </code>
                </div>
                <p className="formula-legend">
                  Where: <strong>S(xᵢ, yⱼ)</strong> = substitution score (match/mismatch), <strong>d</strong> = gap penalty
                </p>
              </div>

              <div className="info-grid">
                <div className="info-item">
                  <h4>Initialization</h4>
                  <p>F(i,0) = i × d<br/>F(0,j) = j × d</p>
                </div>
                <div className="info-item">
                  <h4>Traceback</h4>
                  <p>Starts from F(m,n) and traces back to F(0,0)</p>
                </div>
                <div className="info-item">
                  <h4>Time Complexity</h4>
                  <p>O(m × n)</p>
                </div>
                <div className="info-item">
                  <h4>Space Complexity</h4>
                  <p>O(m × n)</p>
                </div>
              </div>

              <div className="use-cases">
                <h4>Best Use Cases</h4>
                <ul>
                  <li>Comparing full-length gene sequences</li>
                  <li>Protein sequence comparison</li>
                  <li>Evolutionary relationship analysis</li>
                  <li>When sequences are expected to be similar throughout</li>
                </ul>
              </div>
            </div>
          )}

          {algorithm === 'local' && (
            <div className="algorithm-info-card full-width">
              <h3>Local Alignment (Smith-Waterman)</h3>
              <p>
                The Smith-Waterman algorithm finds the <strong>highest-scoring local subsequence</strong> alignment.
                Published in 1981, it modifies Needleman-Wunsch by allowing alignment to start and end anywhere,
                making it ideal for finding conserved regions.
              </p>
              
              <div className="formula-section">
                <h4>Recurrence Relation</h4>
                <div className="formula">
                  <code>
                    F(i,j) = max {'{'}
                    <br />
                    &nbsp;&nbsp;0,&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span className="formula-comment">// Reset (key difference!)</span>
                    <br />
                    &nbsp;&nbsp;F(i-1, j-1) + S(xᵢ, yⱼ),&nbsp;&nbsp;<span className="formula-comment">// Match/Mismatch</span>
                    <br />
                    &nbsp;&nbsp;F(i-1, j) + d,&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span className="formula-comment">// Gap in sequence Y</span>
                    <br />
                    &nbsp;&nbsp;F(i, j-1) + d&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span className="formula-comment">// Gap in sequence X</span>
                    <br />
                    {'}'}
                  </code>
                </div>
                <p className="formula-legend">
                  Key difference: Scores <strong>cannot go below 0</strong>, allowing alignment to restart anywhere.
                </p>
              </div>

              <div className="info-grid">
                <div className="info-item">
                  <h4>Initialization</h4>
                  <p>F(i,0) = 0<br/>F(0,j) = 0</p>
                </div>
                <div className="info-item">
                  <h4>Traceback</h4>
                  <p>Starts from the <strong>maximum score cell</strong> and ends at any cell with score 0</p>
                </div>
                <div className="info-item">
                  <h4>Time Complexity</h4>
                  <p>O(m × n)</p>
                </div>
                <div className="info-item">
                  <h4>Space Complexity</h4>
                  <p>O(m × n)</p>
                </div>
              </div>

              <div className="use-cases">
                <h4>Best Use Cases</h4>
                <ul>
                  <li>Finding conserved domains in proteins</li>
                  <li>Identifying motifs in DNA sequences</li>
                  <li>Database searching (BLAST uses similar concepts)</li>
                  <li>When only parts of sequences are expected to match</li>
                </ul>
              </div>
            </div>
          )}

          {algorithm === 'dovetail' && (
            <div className="algorithm-info-card full-width">
              <h3>Dovetail Alignment (Semi-Global)</h3>
              <p>
                Dovetail alignment is a <strong>semi-global</strong> approach that finds optimal overlapping
                alignments. It allows free gaps at the beginning and end of sequences, making it perfect
                for sequence assembly tasks.
              </p>
              
              <div className="formula-section">
                <h4>Recurrence Relation</h4>
                <div className="formula">
                  <code>
                    F(i,j) = max {'{'}
                    <br />
                    &nbsp;&nbsp;F(i-1, j-1) + S(xᵢ, yⱼ),&nbsp;&nbsp;<span className="formula-comment">// Match/Mismatch</span>
                    <br />
                    &nbsp;&nbsp;F(i-1, j) + d,&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span className="formula-comment">// Gap in sequence Y</span>
                    <br />
                    &nbsp;&nbsp;F(i, j-1) + d&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span className="formula-comment">// Gap in sequence X</span>
                    <br />
                    {'}'}
                  </code>
                </div>
                <p className="formula-legend">
                  Key difference: <strong>No penalty for leading/trailing gaps</strong> (first row and column initialized to 0).
                </p>
              </div>

              <div className="info-grid">
                <div className="info-item">
                  <h4>Initialization</h4>
                  <p>F(i,0) = 0 (no penalty)<br/>F(0,j) = 0 (no penalty)</p>
                </div>
                <div className="info-item">
                  <h4>Traceback</h4>
                  <p>Starts from <strong>max in last row or column</strong> (allows trailing gaps)</p>
                </div>
                <div className="info-item">
                  <h4>Time Complexity</h4>
                  <p>O(m × n)</p>
                </div>
                <div className="info-item">
                  <h4>Space Complexity</h4>
                  <p>O(m × n)</p>
                </div>
              </div>

              <div className="use-cases">
                <h4>Best Use Cases</h4>
                <ul>
                  <li>Sequence assembly (finding overlapping reads)</li>
                  <li>Contig assembly in genome sequencing</li>
                  <li>Finding how two fragments overlap at ends</li>
                  <li>Primer alignment to templates</li>
                </ul>
              </div>
            </div>
          )}

          {algorithm === 'banded' && (
            <div className="algorithm-info-card full-width">
              <h3>Banded Alignment</h3>
              <p>
                Banded alignment is an <strong>optimization of global alignment</strong> that only computes
                cells within a diagonal band of width k. This significantly reduces computation time
                when sequences are known to be similar.
              </p>
              
              <div className="formula-section">
                <h4>Recurrence Relation</h4>
                <div className="formula">
                  <code>
                    F(i,j) = max {'{'}
                    <br />
                    &nbsp;&nbsp;F(i-1, j-1) + S(xᵢ, yⱼ),&nbsp;&nbsp;<span className="formula-comment">// if |i-j| ≤ k</span>
                    <br />
                    &nbsp;&nbsp;F(i-1, j) + d,&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span className="formula-comment">// if |i-j| ≤ k</span>
                    <br />
                    &nbsp;&nbsp;F(i, j-1) + d&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span className="formula-comment">// if |i-j| ≤ k</span>
                    <br />
                    {'}'}&nbsp;&nbsp;<strong>only when |i - j| ≤ k</strong>
                  </code>
                </div>
                <p className="formula-legend">
                  Key constraint: Only cells where <strong>|i - j| ≤ k</strong> (bandwidth) are computed. Cells outside band = -∞
                </p>
              </div>

              <div className="info-grid">
                <div className="info-item">
                  <h4>Band Constraint</h4>
                  <p>|i - j| ≤ k<br/>k = bandwidth parameter</p>
                </div>
                <div className="info-item">
                  <h4>Traceback</h4>
                  <p>Same as global alignment, but constrained within the band</p>
                </div>
                <div className="info-item">
                  <h4>Time Complexity</h4>
                  <p>O(k × n) — much faster!</p>
                </div>
                <div className="info-item">
                  <h4>Space Complexity</h4>
                  <p>O(k × n)</p>
                </div>
              </div>

              <div className="use-cases">
                <h4>Best Use Cases</h4>
                <ul>
                  <li>Aligning highly similar sequences</li>
                  <li>When sequences have similar lengths</li>
                  <li>Large-scale sequence comparisons</li>
                  <li>When gaps are expected to be small and localized</li>
                </ul>
              </div>

              <div className="warning-box">
                <strong>Note:</strong> If the optimal alignment path goes outside the band, 
                the result may be suboptimal. Choose bandwidth carefully based on expected divergence.
              </div>
            </div>
          )}
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
