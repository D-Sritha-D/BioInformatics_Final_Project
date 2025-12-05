import React, { useState, useCallback, useMemo } from 'react';
import './DistanceMatrix.css';

interface DistanceMatrixProps {
  onNavigateToHomepage: () => void;
}

interface UPGMAStep {
  stepNumber: number;
  title: string;
  description: string;
  matrix: number[][];
  labels: string[];
  mergedPair: [string, string] | null;
  newCluster: string | null;
  clusterHeight: number | null;
  explanation: string;
}

// Default example data
const DEFAULT_SPECIES = ['A', 'B', 'C', 'D', 'E'];
const DEFAULT_MATRIX = [
  [0, 2, 4, 6, 6],
  [2, 0, 4, 6, 6],
  [4, 4, 0, 6, 6],
  [6, 6, 6, 0, 4],
  [6, 6, 6, 4, 0],
];

const DistanceMatrix: React.FC<DistanceMatrixProps> = ({ onNavigateToHomepage }) => {
  const [species, setSpecies] = useState<string[]>(DEFAULT_SPECIES);
  const [matrix, setMatrix] = useState<number[][]>(DEFAULT_MATRIX);
  const [currentStep, setCurrentStep] = useState(0);
  const [inputMode, setInputMode] = useState<'example' | 'custom'>('example');
  const [customSpeciesInput, setCustomSpeciesInput] = useState('A,B,C,D,E');
  const [customMatrixInput, setCustomMatrixInput] = useState(
    '0,2,4,6,6\n2,0,4,6,6\n4,4,0,6,6\n6,6,6,0,4\n6,6,6,4,0'
  );
  const [inputError, setInputError] = useState<string | null>(null);

  // UPGMA Algorithm Implementation
  const computeUPGMASteps = useCallback((initialMatrix: number[][], initialLabels: string[]): UPGMAStep[] => {
    const steps: UPGMAStep[] = [];
    let currentMatrix = initialMatrix.map(row => [...row]);
    let currentLabels = [...initialLabels];
    const clusterSizes: { [key: string]: number } = {};
    initialLabels.forEach(label => { clusterSizes[label] = 1; });

    // Initial step
    steps.push({
      stepNumber: 0,
      title: 'Initial Distance Matrix',
      description: 'Starting with the original pairwise distance matrix between all taxa.',
      matrix: currentMatrix.map(row => [...row]),
      labels: [...currentLabels],
      mergedPair: null,
      newCluster: null,
      clusterHeight: null,
      explanation: `We begin with ${initialLabels.length} taxa: ${initialLabels.join(', ')}. The matrix shows pairwise distances between each pair of taxa. UPGMA will iteratively merge the closest pair until only one cluster remains.`,
    });

    let stepNum = 1;
    while (currentLabels.length > 1) {
      // Find minimum distance (excluding diagonal)
      let minDist = Infinity;
      let minI = 0;
      let minJ = 1;

      for (let i = 0; i < currentMatrix.length; i++) {
        for (let j = i + 1; j < currentMatrix.length; j++) {
          if (currentMatrix[i][j] < minDist) {
            minDist = currentMatrix[i][j];
            minI = i;
            minJ = j;
          }
        }
      }

      const clusterA = currentLabels[minI];
      const clusterB = currentLabels[minJ];
      const newClusterName = `(${clusterA},${clusterB})`;
      const height = minDist / 2;

      // Calculate new distances using UPGMA formula
      const newRow: number[] = [];
      const sizeA = clusterSizes[clusterA];
      const sizeB = clusterSizes[clusterB];

      for (let k = 0; k < currentMatrix.length; k++) {
        if (k === minI || k === minJ) {
          continue;
        }
        const distAK = currentMatrix[minI][k];
        const distBK = currentMatrix[minJ][k];
        const newDist = (sizeA * distAK + sizeB * distBK) / (sizeA + sizeB);
        newRow.push(newDist);
      }

      // Build new matrix
      const newMatrix: number[][] = [];
      const newLabels: string[] = [newClusterName];

      // First row is the new cluster
      newMatrix.push([0, ...newRow]);

      // Add remaining rows
      let newRowIdx = 1;
      for (let i = 0; i < currentMatrix.length; i++) {
        if (i === minI || i === minJ) continue;
        newLabels.push(currentLabels[i]);
        const row: number[] = [newRow[newRowIdx - 1]];
        for (let j = 0; j < currentMatrix.length; j++) {
          if (j === minI || j === minJ) continue;
          row.push(currentMatrix[i][j]);
        }
        newMatrix.push(row);
        newRowIdx++;
      }

      clusterSizes[newClusterName] = sizeA + sizeB;

      steps.push({
        stepNumber: stepNum,
        title: `Step ${stepNum}: Merge ${clusterA} and ${clusterB}`,
        description: `Merging the closest pair with distance ${minDist.toFixed(2)}.`,
        matrix: newMatrix.map(row => row.map(v => Math.round(v * 100) / 100)),
        labels: newLabels,
        mergedPair: [clusterA, clusterB],
        newCluster: newClusterName,
        clusterHeight: height,
        explanation: `The minimum distance is ${minDist.toFixed(2)} between ${clusterA} and ${clusterB}. We merge them into cluster ${newClusterName} at height ${height.toFixed(2)}. New distances are calculated using weighted averages: d(${newClusterName}, X) = (${sizeA} × d(${clusterA}, X) + ${sizeB} × d(${clusterB}, X)) / ${sizeA + sizeB}.`,
      });

      currentMatrix = newMatrix;
      currentLabels = newLabels;
      stepNum++;
    }

    return steps;
  }, []);

  const upgmaSteps = useMemo(() => computeUPGMASteps(matrix, species), [matrix, species, computeUPGMASteps]);

  const currentStepData = upgmaSteps[currentStep];

  const handleParseCustomInput = useCallback(() => {
    try {
      setInputError(null);
      
      // Parse species
      const parsedSpecies = customSpeciesInput.split(',').map(s => s.trim()).filter(s => s.length > 0);
      if (parsedSpecies.length < 2) {
        throw new Error('Please enter at least 2 species separated by commas.');
      }

      // Parse matrix
      const rows = customMatrixInput.trim().split('\n');
      if (rows.length !== parsedSpecies.length) {
        throw new Error(`Matrix must have ${parsedSpecies.length} rows to match the number of species.`);
      }

      const parsedMatrix: number[][] = [];
      for (let i = 0; i < rows.length; i++) {
        const values = rows[i].split(',').map(v => parseFloat(v.trim()));
        if (values.length !== parsedSpecies.length) {
          throw new Error(`Row ${i + 1} must have ${parsedSpecies.length} values.`);
        }
        if (values.some(v => isNaN(v))) {
          throw new Error(`Row ${i + 1} contains invalid numbers.`);
        }
        parsedMatrix.push(values);
      }

      // Validate matrix is symmetric and diagonal is 0
      for (let i = 0; i < parsedMatrix.length; i++) {
        if (parsedMatrix[i][i] !== 0) {
          throw new Error(`Diagonal values must be 0. Found ${parsedMatrix[i][i]} at position (${i + 1}, ${i + 1}).`);
        }
        for (let j = i + 1; j < parsedMatrix.length; j++) {
          if (Math.abs(parsedMatrix[i][j] - parsedMatrix[j][i]) > 0.001) {
            throw new Error(`Matrix must be symmetric. Values at (${i + 1}, ${j + 1}) and (${j + 1}, ${i + 1}) don't match.`);
          }
        }
      }

      setSpecies(parsedSpecies);
      setMatrix(parsedMatrix);
      setCurrentStep(0);
    } catch (err) {
      setInputError(err instanceof Error ? err.message : 'Invalid input');
    }
  }, [customSpeciesInput, customMatrixInput]);

  const handleLoadExample = useCallback(() => {
    setSpecies(DEFAULT_SPECIES);
    setMatrix(DEFAULT_MATRIX);
    setCustomSpeciesInput('A,B,C,D,E');
    setCustomMatrixInput('0,2,4,6,6\n2,0,4,6,6\n4,4,0,6,6\n6,6,6,0,4\n6,6,6,4,0');
    setCurrentStep(0);
    setInputError(null);
  }, []);

  // Generate tree visualization (simple text-based)
  const generateTreeVisualization = useCallback(() => {
    const nodes: { cluster: string; height: number; children: [string, string] | null }[] = [];
    
    for (let i = 1; i < upgmaSteps.length; i++) {
      const step = upgmaSteps[i];
      if (step.mergedPair && step.newCluster && step.clusterHeight !== null) {
        nodes.push({
          cluster: step.newCluster,
          height: step.clusterHeight,
          children: step.mergedPair,
        });
      }
    }

    return nodes;
  }, [upgmaSteps]);

  const treeNodes = useMemo(() => generateTreeVisualization(), [generateTreeVisualization]);

  return (
    <div className="distance-matrix-container">
      {/* Header */}
      <header className="dm-header">
        <div className="header-content">
          <h1>Distance Matrix and UPGMA</h1>
          <button className="back-button" onClick={onNavigateToHomepage}>
            ← Back to Homepage
          </button>
        </div>
      </header>

      <main className="dm-main">
        {/* Definition Section */}
        <section className="definition-section">
          <div className="definition-card">
            <div className="definition-visual">
              <div className="matrix-icon">
                <svg viewBox="0 0 100 100" width="80" height="80">
                  <rect x="10" y="10" width="25" height="25" fill="#2D1B4E" rx="3"/>
                  <rect x="40" y="10" width="25" height="25" fill="#4a3a6e" rx="3"/>
                  <rect x="70" y="10" width="20" height="25" fill="#6b5b8e" rx="3"/>
                  <rect x="10" y="40" width="25" height="25" fill="#4a3a6e" rx="3"/>
                  <rect x="40" y="40" width="25" height="25" fill="#2D1B4E" rx="3"/>
                  <rect x="70" y="40" width="20" height="25" fill="#4a3a6e" rx="3"/>
                  <rect x="10" y="70" width="25" height="20" fill="#6b5b8e" rx="3"/>
                  <rect x="40" y="70" width="25" height="20" fill="#4a3a6e" rx="3"/>
                  <rect x="70" y="70" width="20" height="20" fill="#2D1B4E" rx="3"/>
                </svg>
              </div>
            </div>
            <div className="definition-content">
              <h2>What is UPGMA?</h2>
              <p className="definition-main">
                <strong>UPGMA</strong> (Unweighted Pair Group Method with Arithmetic Mean) is a 
                <span className="highlight-term"> hierarchical clustering algorithm</span> used to construct 
                phylogenetic trees from a distance matrix. It assumes a constant rate of evolution (molecular clock hypothesis).
              </p>
              <div className="key-concepts">
                <div className="concept-item">
                  <span className="concept-icon concept-distance"></span>
                  <div>
                    <strong>Distance Matrix</strong>
                    <p>Symmetric matrix of pairwise distances between taxa</p>
                  </div>
                </div>
                <div className="concept-item">
                  <span className="concept-icon concept-merge"></span>
                  <div>
                    <strong>Clustering</strong>
                    <p>Iteratively merge closest pairs into clusters</p>
                  </div>
                </div>
                <div className="concept-item">
                  <span className="concept-icon concept-average"></span>
                  <div>
                    <strong>Average Linkage</strong>
                    <p>New distances calculated as weighted averages</p>
                  </div>
                </div>
                <div className="concept-item">
                  <span className="concept-icon concept-tree"></span>
                  <div>
                    <strong>Ultrametric Tree</strong>
                    <p>All leaves equidistant from the root</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Input Section */}
        <section className="input-section">
          <div className="input-card">
            <h2>Input Distance Matrix</h2>
            <div className="input-mode-selector">
              <button
                className={`mode-btn ${inputMode === 'example' ? 'active' : ''}`}
                onClick={() => { setInputMode('example'); handleLoadExample(); }}
              >
                Use Example
              </button>
              <button
                className={`mode-btn ${inputMode === 'custom' ? 'active' : ''}`}
                onClick={() => setInputMode('custom')}
              >
                Custom Input
              </button>
            </div>

            {inputMode === 'custom' && (
              <div className="custom-input-form">
                <div className="input-group">
                  <label>Species/Taxa (comma-separated):</label>
                  <input
                    type="text"
                    value={customSpeciesInput}
                    onChange={(e) => setCustomSpeciesInput(e.target.value)}
                    placeholder="A,B,C,D,E"
                  />
                </div>
                <div className="input-group">
                  <label>Distance Matrix (one row per line, comma-separated):</label>
                  <textarea
                    value={customMatrixInput}
                    onChange={(e) => setCustomMatrixInput(e.target.value)}
                    placeholder="0,2,4,6,6&#10;2,0,4,6,6&#10;4,4,0,6,6&#10;6,6,6,0,4&#10;6,6,6,4,0"
                    rows={6}
                  />
                </div>
                {inputError && <div className="input-error">{inputError}</div>}
                <button className="parse-btn" onClick={handleParseCustomInput}>
                  Run UPGMA
                </button>
              </div>
            )}
          </div>
        </section>

        {/* UPGMA Steps Section */}
        <section className="upgma-section">
          <div className="upgma-header">
            <h2>UPGMA Algorithm Steps</h2>
            <p>Follow the step-by-step clustering process</p>
          </div>

          <div className="step-content">
            <div className="step-info">
              <div className="step-header">
                <span className="step-badge">Step {currentStepData.stepNumber}</span>
                <h3>{currentStepData.title}</h3>
              </div>
              <p className="step-description">{currentStepData.description}</p>

              {/* Current Matrix Display */}
              <div className="matrix-display">
                <h4>Distance Matrix:</h4>
                <div className="matrix-table-wrapper">
                  <table className="matrix-table">
                    <thead>
                      <tr>
                        <th></th>
                        {currentStepData.labels.map((label, idx) => (
                          <th key={idx} className="matrix-header">{label}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {currentStepData.matrix.map((row, i) => (
                        <tr key={i}>
                          <td className="matrix-header">{currentStepData.labels[i]}</td>
                          {row.map((val, j) => {
                            const isMinimum = currentStepData.mergedPair && 
                              ((currentStepData.labels[i] === currentStepData.mergedPair[0] && currentStepData.labels[j] === currentStepData.mergedPair[1]) ||
                               (currentStepData.labels[i] === currentStepData.mergedPair[1] && currentStepData.labels[j] === currentStepData.mergedPair[0]));
                            return (
                              <td 
                                key={j} 
                                className={`matrix-cell ${i === j ? 'diagonal' : ''} ${isMinimum ? 'minimum' : ''}`}
                              >
                                {val.toFixed(val % 1 === 0 ? 0 : 2)}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Merge Info */}
              {currentStepData.mergedPair && (
                <div className="merge-info">
                  <h4>Merge Operation:</h4>
                  <div className="merge-details">
                    <span className="merge-item">{currentStepData.mergedPair[0]}</span>
                    <span className="merge-arrow">+</span>
                    <span className="merge-item">{currentStepData.mergedPair[1]}</span>
                    <span className="merge-arrow">=</span>
                    <span className="merge-result">{currentStepData.newCluster}</span>
                  </div>
                  <p className="merge-height">Branch height: {currentStepData.clusterHeight?.toFixed(2)}</p>
                </div>
              )}

              <div className="step-explanation">
                <span className="explanation-icon">i</span>
                <p>{currentStepData.explanation}</p>
              </div>
            </div>

            {/* Tree Visualization */}
            <div className="tree-visualization">
              <h4>Clustering Progress</h4>
              <div className="tree-display">
                {treeNodes.length === 0 ? (
                  <div className="tree-initial">
                    <p>Initial state: {species.length} individual taxa</p>
                    <div className="taxa-list">
                      {species.map((s, idx) => (
                        <span key={idx} className="taxon-badge">{s}</span>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="tree-steps">
                    {treeNodes.slice(0, currentStep).map((node, idx) => (
                      <div key={idx} className="tree-node-row">
                        <span className="tree-step-num">{idx + 1}.</span>
                        <span className="tree-cluster">{node.cluster}</span>
                        <span className="tree-height">h = {node.height.toFixed(2)}</span>
                      </div>
                    ))}
                    {currentStep === 0 && (
                      <p className="tree-hint">Navigate through steps to see clustering progress</p>
                    )}
                  </div>
                )}
              </div>

              {/* Final Tree Structure */}
              {currentStep === upgmaSteps.length - 1 && treeNodes.length > 0 && (
                <div className="final-tree">
                  <h4>Final Newick Format:</h4>
                  <code className="newick-output">
                    {treeNodes[treeNodes.length - 1]?.cluster};
                  </code>
                </div>
              )}
            </div>
          </div>

          {/* Step Navigation */}
          <div className="step-navigation">
            <button
              className="nav-button"
              onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
              disabled={currentStep === 0}
            >
              ← Previous
            </button>
            <div className="step-indicators">
              {upgmaSteps.map((_, idx) => (
                <button
                  key={idx}
                  className={`step-dot ${idx === currentStep ? 'active' : ''}`}
                  onClick={() => setCurrentStep(idx)}
                />
              ))}
            </div>
            <button
              className="nav-button"
              onClick={() => setCurrentStep(Math.min(upgmaSteps.length - 1, currentStep + 1))}
              disabled={currentStep === upgmaSteps.length - 1}
            >
              Next →
            </button>
          </div>
        </section>

        {/* Algorithm Explanation */}
        <section className="algorithm-section">
          <h2>UPGMA Algorithm Overview</h2>
          <div className="algorithm-steps">
            <div className="algo-step">
              <div className="algo-step-num">1</div>
              <div className="algo-step-content">
                <h4>Initialize</h4>
                <p>Start with each taxon as its own cluster. The distance matrix contains pairwise distances between all taxa.</p>
              </div>
            </div>
            <div className="algo-step">
              <div className="algo-step-num">2</div>
              <div className="algo-step-content">
                <h4>Find Minimum</h4>
                <p>Identify the pair of clusters with the smallest distance in the matrix.</p>
              </div>
            </div>
            <div className="algo-step">
              <div className="algo-step-num">3</div>
              <div className="algo-step-content">
                <h4>Merge Clusters</h4>
                <p>Combine the two closest clusters into a new cluster. The branch height is half the distance.</p>
              </div>
            </div>
            <div className="algo-step">
              <div className="algo-step-num">4</div>
              <div className="algo-step-content">
                <h4>Update Distances</h4>
                <p>Calculate distances from the new cluster to all others using weighted average: d(AB,X) = (n_A × d(A,X) + n_B × d(B,X)) / (n_A + n_B)</p>
              </div>
            </div>
            <div className="algo-step">
              <div className="algo-step-num">5</div>
              <div className="algo-step-content">
                <h4>Repeat</h4>
                <p>Continue until all taxa are merged into a single cluster, forming the final tree.</p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default DistanceMatrix;
