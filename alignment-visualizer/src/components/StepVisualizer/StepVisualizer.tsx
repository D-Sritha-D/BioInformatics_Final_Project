import { useState, useEffect, useCallback } from 'react';
import type { AlignmentStep } from '../../types';
import './StepVisualizer.css';

interface StepVisualizerProps {
  steps: AlignmentStep[];
  onStepChange: (step: number) => void;
  isPlaying: boolean;
  onPlayPause: () => void;
}

export function StepVisualizer({
  steps,
  onStepChange,
  isPlaying,
  onPlayPause,
}: StepVisualizerProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(500);

  const totalSteps = steps.length;

  // Handle step changes
  const goToStep = useCallback(
    (step: number) => {
      const newStep = Math.max(0, Math.min(step, totalSteps - 1));
      setCurrentStep(newStep);
      onStepChange(newStep);
    },
    [totalSteps, onStepChange]
  );

  // Auto-play functionality
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev >= totalSteps - 1) {
          onPlayPause(); // Stop at the end
          return prev;
        }
        const next = prev + 1;
        onStepChange(next);
        return next;
      });
    }, playbackSpeed);

    return () => clearInterval(interval);
  }, [isPlaying, playbackSpeed, totalSteps, onStepChange, onPlayPause]);

  const currentStepData = steps[currentStep];

  return (
    <div className="step-visualizer">
      <h3>Step-by-Step Visualization</h3>

      <div className="controls">
        <button
          className="control-btn"
          onClick={() => goToStep(0)}
          disabled={currentStep === 0}
        >
          ⏮ Start
        </button>
        <button
          className="control-btn"
          onClick={() => goToStep(currentStep - 1)}
          disabled={currentStep === 0}
        >
          ◀ Prev
        </button>
        <button className="control-btn play-btn" onClick={onPlayPause}>
          {isPlaying ? '⏸ Pause' : '▶ Play'}
        </button>
        <button
          className="control-btn"
          onClick={() => goToStep(currentStep + 1)}
          disabled={currentStep >= totalSteps - 1}
        >
          Next ▶
        </button>
        <button
          className="control-btn"
          onClick={() => goToStep(totalSteps - 1)}
          disabled={currentStep >= totalSteps - 1}
        >
          End ⏭
        </button>
      </div>

      <div className="progress-section">
        <input
          type="range"
          min={0}
          max={totalSteps - 1}
          value={currentStep}
          onChange={(e) => goToStep(Number(e.target.value))}
          className="progress-slider"
        />
        <div className="progress-info">
          Step {currentStep + 1} of {totalSteps}
        </div>
      </div>

      <div className="speed-control">
        <label>Speed:</label>
        <select
          value={playbackSpeed}
          onChange={(e) => setPlaybackSpeed(Number(e.target.value))}
        >
          <option value={1000}>Slow (1s)</option>
          <option value={500}>Normal (0.5s)</option>
          <option value={200}>Fast (0.2s)</option>
          <option value={50}>Very Fast (0.05s)</option>
        </select>
      </div>

      {currentStepData && (
        <div className="step-details">
          <div className="step-header">
            <span className="step-position">
              Cell ({currentStepData.row}, {currentStepData.col})
            </span>
            <span className="step-score">Score: {currentStepData.score}</span>
          </div>

          <p className="step-explanation">{currentStepData.explanation}</p>

          <div className="cells-considered">
            <h4>Score Calculation:</h4>
            {currentStepData.cellsConsidered.map((cell, idx) => (
              <div
                key={idx}
                className={`cell-option ${
                  cell.source === currentStepData.direction ? 'selected' : ''
                }`}
              >
                <span className="option-source">
                  {cell.source === 'diagonal' && '↖'}
                  {cell.source === 'up' && '↑'}
                  {cell.source === 'left' && '←'}
                  {' '}
                  {cell.source.charAt(0).toUpperCase() + cell.source.slice(1)}:
                </span>
                <span className="option-operation">{cell.operation}</span>
                <span className="option-value">= {cell.value}</span>
              </div>
            ))}
          </div>

          <div className="chosen-direction">
            <strong>Chosen: </strong>
            {currentStepData.direction} (max value)
          </div>
        </div>
      )}
    </div>
  );
}
