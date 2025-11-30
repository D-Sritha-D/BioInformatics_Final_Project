import { useEffect, useState } from 'react';
import type { FoldingMetric, FoldingStep } from '../../types';
import './FoldingStepVisualizer.css';

interface FoldingStepVisualizerProps {
  steps: FoldingStep[];
}

export function FoldingStepVisualizer({ steps }: FoldingStepVisualizerProps) {
  const [index, setIndex] = useState(0);
  const [autoPlay, setAutoPlay] = useState(false);

  useEffect(() => {
    if (!autoPlay) return;
    const timer = setInterval(() => {
      setIndex((prev) => (prev >= steps.length - 1 ? prev : prev + 1));
    }, 700);
    return () => clearInterval(timer);
  }, [autoPlay, steps.length]);

  useEffect(() => {
    setIndex(0);
  }, [steps]);

  const step = steps[index];

  return (
    <div className="folding-steps">
      <div className="steps-header">
        <h3>Step-by-Step Folding</h3>
        <div className="step-controls">
          <button onClick={() => setIndex(0)} disabled={index === 0}>⏮</button>
          <button onClick={() => setIndex((i) => Math.max(0, i - 1))} disabled={index === 0}>◀</button>
          <button onClick={() => setAutoPlay((p) => !p)}>{autoPlay ? '⏸ Pause' : '▶ Play'}</button>
          <button onClick={() => setIndex((i) => Math.min(steps.length - 1, i + 1))} disabled={index === steps.length - 1}>▶</button>
          <button onClick={() => setIndex(steps.length - 1)} disabled={index === steps.length - 1}>⏭</button>
        </div>
        <div className="step-progress">
          Step {index + 1} of {steps.length}
        </div>
      </div>

      {step && (
        <div className="step-card">
          <div className="step-title">{step.title}</div>
          <p className="step-description">{step.description}</p>

          {step.structurePreview && (
            <div className="structure-preview">
              <p className="muted">Structure preview</p>
              <div className="mono">{step.structurePreview}</div>
            </div>
          )}

          {step.metrics && step.metrics.length > 0 && (
            <div className="metric-grid">
              {step.metrics.map((metric: FoldingMetric) => (
                <div key={metric.label} className="metric-card">
                  <p className="metric-label">{metric.label}</p>
                  <p className="metric-value">{metric.value}</p>
                  {metric.hint && <p className="metric-hint">{metric.hint}</p>}
                </div>
              ))}
            </div>
          )}

          {step.note && <div className="step-note">{step.note}</div>}
        </div>
      )}
    </div>
  );
}
