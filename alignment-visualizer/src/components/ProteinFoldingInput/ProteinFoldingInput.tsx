import { useState } from 'react';
import type { FoldingAlgorithmType } from '../../types';
import './ProteinFoldingInput.css';

interface ProteinFoldingInputProps {
  onRun: (sequence: string, algorithm: FoldingAlgorithmType, params: Record<string, number>) => void;
}

const PROTEIN_REGEX = /^[ACDEFGHIKLMNPQRSTVWY]*$/i;

export function ProteinFoldingInput({ onRun }: ProteinFoldingInputProps) {
  const [sequence, setSequence] = useState('ACDEFGHIKLMNPQRSTVWY');
  const [algorithm, setAlgorithm] = useState<FoldingAlgorithmType>('genetic');
  const [populationSize, setPopulationSize] = useState(18);
  const [generations, setGenerations] = useState(12);
  const [mutationRate, setMutationRate] = useState(0.001);
  const [hillIterations, setHillIterations] = useState(30);
  const [hillRestartInterval, setHillRestartInterval] = useState(12);
  const [saIterations, setSaIterations] = useState(40);
  const [saStartTemperature, setSaStartTemperature] = useState(6);
  const [saCoolingRate, setSaCoolingRate] = useState(0.9);
  const [windowSize, setWindowSize] = useState(6);
  const [helixThreshold, setHelixThreshold] = useState(1.03);
  const [sheetThreshold, setSheetThreshold] = useState(1.0);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sequence) {
      setError('Protein sequence is required');
      return;
    }
    if (!PROTEIN_REGEX.test(sequence)) {
      setError('Use standard amino acids only (ACDEFGHIKLMNPQRSTVWY)');
      return;
    }
    setError(null);

    const uppercaseSequence = sequence.toUpperCase();

    if (algorithm === 'genetic') {
      onRun(uppercaseSequence, algorithm, {
        populationSize,
        generations,
        mutationRate,
      });
    } else if (algorithm === 'hill-climb') {
      onRun(uppercaseSequence, algorithm, {
        iterations: hillIterations,
        restartInterval: hillRestartInterval,
      });
    } else if (algorithm === 'simulated-annealing') {
      onRun(uppercaseSequence, algorithm, {
        iterations: saIterations,
        startTemperature: saStartTemperature,
        coolingRate: saCoolingRate,
      });
    } else {
      onRun(uppercaseSequence, algorithm, {
        windowSize,
        helixThreshold,
        sheetThreshold,
      });
    }
  };

  return (
    <div className="protein-input-card">
      <div className="card-header">
        <div>
          <h2>Protein Folding Playground</h2>
          <p>Enter a primary sequence and explore folding strategies.</p>
        </div>
        <button
          className="pill-btn"
          type="button"
          onClick={() => {
            setSequence('ACDEFGHIKLMNPQRSTVWY');
            setError(null);
          }}
        >
          Load Example
        </button>
      </div>

      <form onSubmit={handleSubmit} className="protein-form">
        <label className="input-label" htmlFor="protein-sequence">
          Protein Sequence
        </label>
        <textarea
          id="protein-sequence"
          value={sequence}
          onChange={(e) => setSequence(e.target.value.toUpperCase())}
          rows={3}
          placeholder="Enter amino acid sequence (ACDEFGHIKLMNPQRSTVWY)"
        />
        {error && <p className="input-error">{error}</p>}

        <div className="algo-toggle">
          <button
            type="button"
            className={`pill-btn ${algorithm === 'genetic' ? 'selected' : ''}`}
            onClick={() => setAlgorithm('genetic')}
          >
            Genetic Algorithm
          </button>
          <button
            type="button"
            className={`pill-btn ${algorithm === 'hill-climb' ? 'selected' : ''}`}
            onClick={() => setAlgorithm('hill-climb')}
          >
            Hill Climbing
          </button>
          <button
            type="button"
            className={`pill-btn ${algorithm === 'simulated-annealing' ? 'selected' : ''}`}
            onClick={() => setAlgorithm('simulated-annealing')}
          >
            Simulated Annealing
          </button>
          <button
            type="button"
            className={`pill-btn ${algorithm === 'chou-fasman' ? 'selected' : ''}`}
            onClick={() => setAlgorithm('chou-fasman')}
          >
            Chou-Fasman
          </button>
        </div>

        {algorithm === 'genetic' ? (
          <div className="params-grid">
            <div className="param-field">
              <label>Population Size</label>
              <input
                type="number"
                min={6}
                max={50}
                value={populationSize}
                onChange={(e) => setPopulationSize(Number(e.target.value))}
              />
            </div>
            <div className="param-field">
              <label>Generations</label>
              <input
                type="number"
                min={5}
                max={50}
                value={generations}
                onChange={(e) => setGenerations(Number(e.target.value))}
              />
            </div>
            <div className="param-field">
              <label>Mutation Rate</label>
              <input
                type="number"
                step="0.001"
                min={0}
                max={0.6}
                value={mutationRate}
                onChange={(e) => setMutationRate(Number(e.target.value))}
              />
            </div>
          </div>
        ) : algorithm === 'hill-climb' ? (
          <div className="params-grid">
            <div className="param-field">
              <label>Iterations</label>
              <input
                type="number"
                min={5}
                max={120}
                value={hillIterations}
                onChange={(e) => setHillIterations(Number(e.target.value))}
              />
            </div>
            <div className="param-field">
              <label>Restart Interval</label>
              <input
                type="number"
                min={0}
                max={120}
                value={hillRestartInterval}
                onChange={(e) => setHillRestartInterval(Number(e.target.value))}
              />
            </div>
          </div>
        ) : algorithm === 'simulated-annealing' ? (
          <div className="params-grid">
            <div className="param-field">
              <label>Iterations</label>
              <input
                type="number"
                min={5}
                max={150}
                value={saIterations}
                onChange={(e) => setSaIterations(Number(e.target.value))}
              />
            </div>
            <div className="param-field">
              <label>Start Temperature</label>
              <input
                type="number"
                step="0.1"
                min={0.1}
                max={20}
                value={saStartTemperature}
                onChange={(e) => setSaStartTemperature(Number(e.target.value))}
              />
            </div>
            <div className="param-field">
              <label>Cooling Rate</label>
              <input
                type="number"
                step="0.01"
                min={0.5}
                max={0.99}
                value={saCoolingRate}
                onChange={(e) => setSaCoolingRate(Number(e.target.value))}
              />
            </div>
          </div>
        ) : (
          <div className="params-grid">
            <div className="param-field">
              <label>Window Size</label>
              <input
                type="number"
                min={4}
                max={10}
                value={windowSize}
                onChange={(e) => setWindowSize(Number(e.target.value))}
              />
            </div>
            <div className="param-field">
              <label>Helix Threshold</label>
              <input
                type="number"
                step="0.01"
                value={helixThreshold}
                onChange={(e) => setHelixThreshold(Number(e.target.value))}
              />
            </div>
            <div className="param-field">
              <label>Sheet Threshold</label>
              <input
                type="number"
                step="0.01"
                value={sheetThreshold}
                onChange={(e) => setSheetThreshold(Number(e.target.value))}
              />
            </div>
          </div>
        )}

        <button type="submit" className="primary-btn">
          Run Folding
        </button>
      </form>
    </div>
  );
}
