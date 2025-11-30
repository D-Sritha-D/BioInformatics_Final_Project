import type { FoldingResult, FoldingStep } from '../../types';

interface SimulatedAnnealingParams {
  iterations?: number;
  startTemperature?: number;
  coolingRate?: number;
}

type Direction = 'L' | 'R' | 'F';

interface Point {
  x: number;
  y: number;
}

interface Candidate {
  moves: Direction[];
  positions: Point[];
  fitness: number;
}

const HYDROPHOBIC = new Set(['A', 'V', 'I', 'L', 'M', 'F', 'Y', 'W']);
const DIRECTIONS: Direction[] = ['L', 'F', 'R'];

function seededRandom(seed: string) {
  let value = 0;
  for (let i = 0; i < seed.length; i++) {
    value = (value * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 0xffffffff;
  };
}

function rotate(orientation: number, turn: Direction): number {
  if (turn === 'L') return (orientation + 3) % 4;
  if (turn === 'R') return (orientation + 1) % 4;
  return orientation;
}

function stepVector(orientation: number): Point {
  switch (orientation) {
    case 0:
      return { x: 0, y: 1 };
    case 1:
      return { x: 1, y: 0 };
    case 2:
      return { x: 0, y: -1 };
    case 3:
    default:
      return { x: -1, y: 0 };
  }
}

function tracePath(moves: Direction[]): { positions: Point[]; valid: boolean } {
  const visited = new Set<string>();
  const positions: Point[] = [{ x: 0, y: 0 }];
  visited.add('0,0');
  let orientation = 0;

  for (const move of moves) {
    orientation = rotate(orientation, move);
    const vector = stepVector(orientation);
    const current = positions[positions.length - 1];
    const next = { x: current.x + vector.x, y: current.y + vector.y };
    const key = `${next.x},${next.y}`;

    if (visited.has(key)) {
      return { positions, valid: false };
    }

    positions.push(next);
    visited.add(key);
  }

  return { positions, valid: true };
}

function hydrophobicMask(sequence: string): boolean[] {
  return sequence.split('').map((residue) => HYDROPHOBIC.has(residue));
}

function countHHContacts(sequence: string, positions: Point[]): number {
  const mask = hydrophobicMask(sequence);
  let contacts = 0;

  for (let i = 0; i < positions.length; i++) {
    if (!mask[i]) continue;
    for (let j = i + 2; j < positions.length; j++) {
      if (!mask[j]) continue;
      const dx = Math.abs(positions[i].x - positions[j].x);
      const dy = Math.abs(positions[i].y - positions[j].y);
      if (dx + dy === 1) {
        contacts += 1;
      }
    }
  }

  return contacts;
}

function generateValidMoves(length: number, rand: () => number): Direction[] {
  if (length <= 1) return [];
  const movesNeeded = length - 1;
  const maxAttempts = 20;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const moves: Direction[] = [];
    let orientation = 0;
    const visited = new Set<string>(['0,0']);
    let current: Point = { x: 0, y: 0 };
    let valid = true;

    for (let i = 0; i < movesNeeded; i++) {
      const shuffled = [...DIRECTIONS].sort(() => rand() - 0.5);
      let chosen: Direction | null = null;

      for (const dir of shuffled) {
        const nextOrientation = rotate(orientation, dir);
        const vector = stepVector(nextOrientation);
        const next = { x: current.x + vector.x, y: current.y + vector.y };
        const key = `${next.x},${next.y}`;
        if (!visited.has(key)) {
          chosen = dir;
          orientation = nextOrientation;
          current = next;
          visited.add(key);
          break;
        }
      }

      if (!chosen) {
        valid = false;
        break;
      }

      moves.push(chosen);
    }

    if (valid) {
      return moves;
    }
  }

  return Array.from({ length: movesNeeded }, () => 'F' as Direction);
}

function evaluateCandidate(sequence: string, moves: Direction[], rand: () => number): Candidate {
  let attemptMoves = moves;
  for (let attempt = 0; attempt < 5; attempt++) {
    const traced = tracePath(attemptMoves);
    if (traced.valid && traced.positions.length === sequence.length) {
      const fitness = countHHContacts(sequence, traced.positions);
      return { moves: attemptMoves, positions: traced.positions, fitness };
    }
    attemptMoves = generateValidMoves(sequence.length, rand);
  }

  const fallbackMoves = Array.from({ length: Math.max(0, sequence.length - 1) }, () => 'F' as Direction);
  const traced = tracePath(fallbackMoves);
  return { moves: fallbackMoves, positions: traced.positions, fitness: countHHContacts(sequence, traced.positions) };
}

function mutateMoves(moves: Direction[], rand: () => number): Direction[] {
  if (moves.length === 0) return moves;
  const index = Math.floor(rand() * moves.length);
  const current = moves[index];
  const options = DIRECTIONS.filter((d) => d !== current);
  const mutated = [...moves];
  mutated[index] = options[Math.floor(rand() * options.length)];
  return mutated;
}

export function runSimulatedAnnealingFolding(
  sequence: string,
  params: SimulatedAnnealingParams = {}
): FoldingResult {
  const iterations = params.iterations ?? 40;
  const startTemperature = params.startTemperature ?? 6;
  const coolingRate = params.coolingRate ?? 0.9;

  const rand = seededRandom(sequence + 'anneal');
  const makeCandidate = () => evaluateCandidate(sequence, generateValidMoves(sequence.length, rand), rand);

  let current = makeCandidate();
  let best = current;
  let temperature = startTemperature;

  const steps: FoldingStep[] = [
    {
      title: 'Initialization',
      description: 'Started simulated annealing with a random conformation and high temperature.',
      structurePreview: current.moves.join(''),
      metrics: [
        { label: 'H-H Contacts', value: current.fitness },
        { label: 'Temperature', value: temperature.toFixed(2) },
        { label: 'Cooling Rate', value: coolingRate },
      ],
      note: 'High temperature allows uphill and downhill moves to explore broadly.',
    },
  ];

  for (let iter = 0; iter < iterations; iter++) {
    const neighbor = evaluateCandidate(sequence, mutateMoves(current.moves, rand), rand);
    const delta = neighbor.fitness - current.fitness;
    const accept = delta > 0 || rand() < Math.exp(delta / Math.max(temperature, 1e-6));

    if (accept) {
      current = neighbor;
    }

    if (current.fitness > best.fitness) {
      best = current;
    }

    steps.push({
      title: `Iteration ${iter + 1}`,
      description: accept
        ? 'Accepted neighbor based on Metropolis criterion.'
        : 'Rejected neighbor; kept current conformation.',
      structurePreview: current.moves.join(''),
      metrics: [
        { label: 'Current H-H Contacts', value: current.fitness },
        { label: 'Best So Far', value: best.fitness },
        { label: 'Temperature', value: temperature.toFixed(2) },
        { label: 'Accepted Move', value: accept ? 'Yes' : 'No' },
      ],
      note: delta > 0 ? 'Improving or equal move.' : 'Occasional worse moves keep search from freezing early.',
    });

    temperature *= coolingRate;
  }

  steps.push({
    title: 'Final Selection',
    description: 'Annealing complete; returning the best conformation encountered.',
    structurePreview: best.moves.join(''),
    metrics: [
      { label: 'Stability (H-H contacts)', value: best.fitness },
      { label: 'Iterations', value: iterations },
      { label: 'Final Temperature', value: temperature.toFixed(2) },
    ],
    note: 'Gradual cooling balances exploration and exploitation.',
  });

  return {
    algorithm: 'simulated-annealing',
    finalStructure: best.moves.join(''),
    stabilityScore: best.fitness,
    summary:
      'Simulated annealing explores folds with temperature-controlled randomness, accepting occasional worse moves to escape local optima while maximizing hydrophobic contacts.',
    steps,
  };
}
