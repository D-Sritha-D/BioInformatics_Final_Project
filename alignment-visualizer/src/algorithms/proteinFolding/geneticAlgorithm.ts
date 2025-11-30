import type { FoldingResult, FoldingStep } from '../../types';
import type { UniqueConformation } from '../../types';

interface GeneticParams {
  populationSize?: number;
  generations?: number;
  mutationRate?: number;
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
      return { x: 0, y: 1 }; // up
    case 1:
      return { x: 1, y: 0 }; // right
    case 2:
      return { x: 0, y: -1 }; // down
    case 3:
    default:
      return { x: -1, y: 0 }; // left
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

function residueContributions(sequence: string, positions: Point[]): number[] {
  const contributions = Array(sequence.length).fill(0);
  const mask = hydrophobicMask(sequence);

  for (let i = 0; i < positions.length; i++) {
    if (!mask[i]) continue;
    for (let j = i + 2; j < positions.length; j++) {
      if (!mask[j]) continue;
      const dx = Math.abs(positions[i].x - positions[j].x);
      const dy = Math.abs(positions[i].y - positions[j].y);
      if (dx + dy === 1) {
        contributions[i] += 1;
        contributions[j] += 1;
      }
    }
  }

  return contributions;
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

  // fallback: straight line walk (always valid)
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

function selectParent(population: Candidate[], rand: () => number): Candidate {
  const totalFitness = population.reduce((sum, cand) => sum + Math.max(0, cand.fitness), 0);
  if (totalFitness === 0) {
    return population[Math.floor(rand() * population.length)];
  }

  let pick = rand() * totalFitness;
  for (const candidate of population) {
    pick -= Math.max(0, candidate.fitness);
    if (pick <= 0) {
      return candidate;
    }
  }

  return population[population.length - 1];
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

function chooseCrossoverPoint(
  parentA: Candidate,
  parentB: Candidate,
  sequence: string
): number {
  const contribA = residueContributions(sequence, parentA.positions);
  const contribB = residueContributions(sequence, parentB.positions);
  let bestIndex = Math.floor(sequence.length / 2);
  let bestGap = 0;

  for (let i = 1; i < sequence.length - 1; i++) {
    const gap = Math.abs(contribA[i] - contribB[i]);
    if (gap > bestGap) {
      bestGap = gap;
      bestIndex = i;
    }
  }

  const upperBound = Math.max(0, sequence.length - 2);
  return Math.min(upperBound, Math.max(0, bestIndex));
}

function strategicCrossover(
  parentA: Candidate,
  parentB: Candidate,
  sequence: string,
  rand: () => number
): Direction[] {
  const pivot = chooseCrossoverPoint(parentA, parentB, sequence);
  const contribA = residueContributions(sequence, parentA.positions);
  const contribB = residueContributions(sequence, parentB.positions);
  const frontA = contribA.slice(0, pivot + 1).reduce((s, v) => s + v, 0);
  const frontB = contribB.slice(0, pivot + 1).reduce((s, v) => s + v, 0);
  const useAFront = frontA >= frontB;

  const prefix = useAFront ? parentA.moves.slice(0, pivot) : parentB.moves.slice(0, pivot);
  const suffix = useAFront ? parentB.moves.slice(pivot) : parentA.moves.slice(pivot);

  const candidate = [...prefix, ...suffix];
  if (tracePath(candidate).valid) return candidate;

  const flipped = [...suffix, ...prefix];
  if (tracePath(flipped).valid) return flipped;

  const saferParent = parentA.fitness >= parentB.fitness ? parentA.moves : parentB.moves;
  const mutated = mutateMoves(saferParent, rand);
  if (tracePath(mutated).valid) return mutated;

  return generateValidMoves(sequence.length, rand);
}

function selectSurvivors(
  combined: Candidate[],
  populationSize: number,
  rand: () => number
): { survivors: Candidate[]; elites: number } {
  const sorted = [...combined].sort((a, b) => b.fitness - a.fitness);
  const eliteCount = Math.max(1, Math.floor(sorted.length * 0.05));
  const elites = sorted.slice(0, eliteCount);
  const pool = sorted.slice(eliteCount);

  const survivors: Candidate[] = [...elites];

  while (survivors.length < populationSize && pool.length > 0) {
    const totalFitness = pool.reduce((sum, cand) => sum + Math.max(0, cand.fitness), 0);
    const pick = totalFitness === 0 ? Math.floor(rand() * pool.length) : (() => {
      let target = rand() * totalFitness;
      for (let i = 0; i < pool.length; i++) {
        target -= Math.max(0, pool[i].fitness);
        if (target <= 0) return i;
      }
      return pool.length - 1;
    })();

    survivors.push(pool[pick]);
    pool.splice(pick, 1);
  }

  while (survivors.length < populationSize && sorted[survivors.length]) {
    survivors.push(sorted[survivors.length]);
  }

  return { survivors, elites: eliteCount };
}

export function runGeneticFolding(
  sequence: string,
  params: GeneticParams = {}
): FoldingResult {
  const populationSize = params.populationSize ?? 18;
  const generations = params.generations ?? 12;
  const mutationRate = params.mutationRate ?? 0.001;

  const rand = seededRandom(sequence);
  let population: Candidate[] = Array.from({ length: populationSize }, () =>
    evaluateCandidate(sequence, generateValidMoves(sequence.length, rand), rand)
  );

  let globalBest = population.reduce((best, cand) => (cand.fitness > best.fitness ? cand : best), population[0]);
  let lastElites = 0;
  const steps: FoldingStep[] = [
    {
      title: 'Population Initialization',
      description: `Created ${populationSize} random self-avoiding conformations to seed the search.`,
      structurePreview: population[0]?.moves.join('') ?? '',
      metrics: [
        { label: 'Initial Diversity', value: new Set(population.map((c) => c.moves.join(''))).size },
        { label: 'Best H-H Contacts', value: globalBest.fitness },
      ],
      note: 'Random diversity provides the genetic material for crossover and mutation.',
    },
  ];

  for (let gen = 0; gen < generations; gen++) {
    const children: Candidate[] = [];
    while (children.length < populationSize) {
      const parentA = selectParent(population, rand);
      const parentB = selectParent(population, rand);
      const childMoves = strategicCrossover(parentA, parentB, sequence, rand);
      children.push(evaluateCandidate(sequence, childMoves, rand));
    }

    const combined = [...population, ...children];
    const { survivors, elites } = selectSurvivors(combined, populationSize, rand);
    lastElites = elites;

    let mutationsApplied = 0;
    const nextPopulation = survivors.map((candidate, idx) => {
      if (idx < elites) return candidate;
      if (rand() < mutationRate) {
        mutationsApplied += 1;
        const mutatedMoves = mutateMoves(candidate.moves, rand);
        return evaluateCandidate(sequence, mutatedMoves, rand);
      }
      return candidate;
    });

    population = nextPopulation;

    const generationBest = population.reduce(
      (best, cand) => (cand.fitness > best.fitness ? cand : best),
      population[0]
    );

    if (generationBest.fitness > globalBest.fitness) {
      globalBest = generationBest;
    }

    const averageFitness = population.reduce((sum, cand) => sum + cand.fitness, 0) / population.length;
    const diversity = new Set(population.map((c) => c.moves.join(''))).size;

    steps.push({
      title: `Generation ${gen + 1}`,
      description: 'Population → Reproduction → Selection → Mutation cycle completed.',
      structurePreview: generationBest.moves.join(''),
      metrics: [
        { label: 'Best H-H Contacts', value: generationBest.fitness },
        { label: 'Average Fitness', value: averageFitness.toFixed(2) },
        { label: 'Unique Conformations', value: diversity },
        { label: 'Elites Preserved', value: elites },
        { label: 'Mutations Applied', value: mutationsApplied },
      ],
      note:
        'Elitism keeps the strongest 5%, fitness-proportional selection keeps promising diversity, and rare mutations (<0.1%) help escape local optima.',
    });
  }

  steps.push({
    title: 'Final Selection',
    description: 'Survivors converged; returning the conformation with the most H-H contacts discovered.',
    structurePreview: globalBest.moves.join(''),
    metrics: [
      { label: 'Stability (H-H contacts)', value: globalBest.fitness },
      { label: 'Generations', value: generations },
      { label: 'Population Size', value: populationSize },
    ],
    note: 'Higher H-H contacts indicate tighter hydrophobic packing and a more compact fold.',
  });

  const uniqueMap = new Map<string, UniqueConformation>();
  population.forEach((cand, idx) => {
    const path = cand.moves.join('');
    const isElite = idx < lastElites;
    const entry = uniqueMap.get(path);
    if (!entry || cand.fitness > entry.fitness) {
      uniqueMap.set(path, {
        path,
        fitness: cand.fitness,
        contacts: cand.fitness,
        isElite,
        positions: cand.positions,
      });
    } else if (entry && isElite) {
      entry.isElite = true;
    }
  });

  const uniqueConformations = Array.from(uniqueMap.values()).sort((a, b) => b.fitness - a.fitness);

  return {
    algorithm: 'genetic',
    finalStructure: globalBest.moves.join(''),
    stabilityScore: globalBest.fitness,
    summary:
      'Genetic search builds self-avoiding lattice conformations, rewards hydrophobic contacts, and evolves them with strategic crossover, elitist selection, and rare mutations.',
    steps,
    uniqueConformations,
  };
}
