import type { FoldingResult, FoldingStep } from '../../types';

const HELIX_PROPENSITY: Record<string, number> = {
  A: 1.45,
  C: 0.77,
  D: 1.01,
  E: 1.51,
  F: 1.13,
  G: 0.53,
  H: 1.00,
  I: 1.08,
  K: 1.16,
  L: 1.34,
  M: 1.20,
  N: 0.73,
  P: 0.34,
  Q: 1.17,
  R: 0.79,
  S: 0.79,
  T: 0.82,
  V: 1.06,
  W: 1.14,
  Y: 0.61,
};

const SHEET_PROPENSITY: Record<string, number> = {
  A: 0.97,
  C: 1.30,
  D: 0.54,
  E: 0.37,
  F: 1.23,
  G: 0.81,
  H: 0.71,
  I: 1.60,
  K: 0.74,
  L: 1.22,
  M: 1.67,
  N: 0.65,
  P: 0.62,
  Q: 1.23,
  R: 0.90,
  S: 0.72,
  T: 1.20,
  V: 1.65,
  W: 1.37,
  Y: 1.29,
};

interface ChouFasmanParams {
  windowSize?: number;
  helixThreshold?: number;
  sheetThreshold?: number;
}

function getPropensity(char: string, table: Record<string, number>): number {
  return table[char] ?? 0.8;
}

function assignStructure(
  helixScore: number,
  sheetScore: number,
  helixThreshold: number,
  sheetThreshold: number
): 'H' | 'E' | 'C' {
  if (helixScore >= helixThreshold && helixScore >= sheetScore) return 'H';
  if (sheetScore >= sheetThreshold && sheetScore > helixScore) return 'E';
  return 'C';
}

export function runChouFasman(
  sequence: string,
  params: ChouFasmanParams = {}
): FoldingResult {
  const windowSize = params.windowSize ?? 6;
  const helixThreshold = params.helixThreshold ?? 1.03;
  const sheetThreshold = params.sheetThreshold ?? 1.00;

  const steps: FoldingStep[] = [];
  const structures: string[] = [];
  const residues = sequence.split('');

  for (let i = 0; i < residues.length; i++) {
    const windowStart = Math.max(0, i - Math.floor(windowSize / 2));
    const windowEnd = Math.min(residues.length, i + Math.ceil(windowSize / 2));
    const window = residues.slice(windowStart, windowEnd);

    const helixScore =
      window.reduce((sum, residue) => sum + getPropensity(residue, HELIX_PROPENSITY), 0) /
      window.length;
    const sheetScore =
      window.reduce((sum, residue) => sum + getPropensity(residue, SHEET_PROPENSITY), 0) /
      window.length;

    const structure = assignStructure(helixScore, sheetScore, helixThreshold, sheetThreshold);
    structures.push(structure);

    steps.push({
      title: `Residue ${i + 1}: ${residues[i]}`,
      description: `Analyzed local window ${windowStart + 1}-${windowEnd} to weigh helix vs sheet tendencies.`,
      structurePreview: structures.join('').padEnd(sequence.length, '•'),
      metrics: [
        { label: 'Helix Propensity', value: helixScore.toFixed(2) },
        { label: 'Sheet Propensity', value: sheetScore.toFixed(2) },
        { label: 'Decision', value: structure === 'H' ? 'Helix' : structure === 'E' ? 'Sheet' : 'Coil' },
      ],
      note:
        structure === 'H'
          ? 'Strong helix-forming potential in this neighborhood.'
          : structure === 'E'
            ? 'β-sheet favored based on averaged propensities.'
            : 'No dominant secondary structure; marked as coil.',
    });
  }

  const stabilityScore = Number(
    (
      structures.reduce((score, s) => score + (s === 'H' ? 1.1 : s === 'E' ? 1 : 0.6), 0) /
      structures.length
    ).toFixed(2)
  );

  return {
    algorithm: 'chou-fasman',
    finalStructure: structures.join(''),
    stabilityScore,
    summary:
      'Chou-Fasman assigns secondary structure by averaging helix and sheet propensities in a sliding window across the sequence.',
    steps,
  };
}
