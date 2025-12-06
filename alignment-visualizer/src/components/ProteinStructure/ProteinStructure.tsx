import React from 'react';
import './ProteinStructure.css';

interface ProteinStructureProps {
  onNavigateToHomepage: () => void;
}

interface FoldingAlgorithm {
  id: string;
  title: string;
  tag: string;
  description: string;
  highlights: string[];
}

interface Chromosome {
  id: string;
  genes: string;
  fitness: number;
}

type SelectionMethod = 'roulette' | 'tournament';
type AlgorithmView = 'ga' | 'hill';

const algorithms: FoldingAlgorithm[] = [
  {
    id: 'genetic',
    title: 'Genetic Algorithm',
    tag: 'Population search',
    description: 'Evolves a population of candidate folds using selection, crossover, and mutation to minimize energy.',
    highlights: [
      'Maintains many candidates to avoid a single bad local minimum',
      'Fitness = energy score + constraint penalties',
      'Mutation rate and crossover strategy control exploration',
    ],
  },
  {
    id: 'hill',
    title: 'Hill Climbing',
    tag: 'Greedy search',
    description: 'Greedy ascent on the fitness landscape: move to a better neighbor if it improves the score.',
    highlights: [
      'Picks the best single-bit flip each step',
      'Stops when no neighbor improves fitness',
      'Great for teaching local optima and greedy plateaus',
    ],
  },
];

const ProteinStructure: React.FC<ProteinStructureProps> = ({ onNavigateToHomepage }) => {
  const [activeView, setActiveView] = React.useState<AlgorithmView>('ga');
  const [target, setTarget] = React.useState('1110010110');
  const [popSize, setPopSize] = React.useState(6);
  const [selectionMethod, setSelectionMethod] = React.useState<SelectionMethod>('roulette');
  const [crossoverRate, setCrossoverRate] = React.useState(0.8);
  const [mutationRate, setMutationRate] = React.useState(0.1);
  const [population, setPopulation] = React.useState<Chromosome[]>([]);
  const [generation, setGeneration] = React.useState(0);

  const [selectedParents, setSelectedParents] = React.useState<Chromosome[]>([]);
  const [crossoverPairs, setCrossoverPairs] = React.useState<
    { parents: [Chromosome, Chromosome]; children: [Chromosome, Chromosome]; crossoverPoint: number | null; crossed: boolean }[]
  >([]);
  const [mutations, setMutations] = React.useState<
    { id: string; mutatedIndices: number[]; before: string; after: string; fitness: number }[]
  >([]);
  const [stageStep, setStageStep] = React.useState(0); // unlocked stage
  const [gaActiveStep, setGaActiveStep] = React.useState(0); // which step user is viewing
  const gaRefs = {
    population: React.useRef<HTMLDivElement>(null),
    selection: React.useRef<HTMLDivElement>(null),
    crossover: React.useRef<HTMLDivElement>(null),
    mutation: React.useRef<HTMLDivElement>(null),
    summary: React.useRef<HTMLDivElement>(null),
  };

  // Hill climbing state (bitstring hill-climb)
  const [hillTarget, setHillTarget] = React.useState('1110010110');
  const [hillCurrent, setHillCurrent] = React.useState<string>('');
  const [hillFitness, setHillFitness] = React.useState<number>(0);
  const [hillNeighbors, setHillNeighbors] = React.useState<{ state: string; fitness: number }[]>([]);
  const [hillBest, setHillBest] = React.useState<{ state: string; fitness: number } | null>(null);
  const [hillIter, setHillIter] = React.useState(0);
  const [hillMaxIter, setHillMaxIter] = React.useState(50);
  const [hillStopped, setHillStopped] = React.useState(false);
  const [hillPath, setHillPath] = React.useState<{ state: string; fitness: number }[]>([]);
  const [hillStep, setHillStep] = React.useState(0); // unlocked stage for hill
  const [hillActiveStep, setHillActiveStep] = React.useState(0);
  const hillRefs = {
    init: React.useRef<HTMLDivElement>(null),
    evaluate: React.useRef<HTMLDivElement>(null),
    neighbors: React.useRef<HTMLDivElement>(null),
    move: React.useRef<HTMLDivElement>(null),
    result: React.useRef<HTMLDivElement>(null),
  };

  const scrollToRef = (ref: React.RefObject<HTMLElement | null>) => {
    if (ref.current) {
      ref.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // ---------------- Hill climbing helpers ----------------
  const hillSafeTarget = React.useMemo(() => hillTarget.replace(/[^01]/g, '').padEnd(4, '0'), [hillTarget]);

  const hillInitialState = React.useCallback((len: number) => {
    let s = '';
    for (let i = 0; i < len; i++) {
      s += Math.random() < 0.5 ? '0' : '1';
    }
    return s;
  }, []);

  const hillFitnessFn = React.useCallback((state: string) => {
    const len = Math.min(state.length, hillSafeTarget.length);
    let f = 0;
    for (let i = 0; i < len; i++) {
      if (state[i] === hillSafeTarget[i]) f++;
    }
    return f;
  }, [hillSafeTarget]);

  const hillNeighborsFn = React.useCallback((state: string) => {
    const list: { state: string; fitness: number }[] = [];
    for (let i = 0; i < state.length; i++) {
      const flipped = state.slice(0, i) + (state[i] === '0' ? '1' : '0') + state.slice(i + 1);
      list.push({ state: flipped, fitness: hillFitnessFn(flipped) });
    }
    return list.sort((a, b) => b.fitness - a.fitness);
  }, [hillFitnessFn]);

  const initHill = React.useCallback(() => {
    const len = hillSafeTarget.length;
    const start = hillInitialState(len);
    const fit = hillFitnessFn(start);
    setHillCurrent(start);
    setHillFitness(fit);
    setHillNeighbors([]);
    setHillBest(null);
    setHillIter(0);
    setHillStopped(false);
    setHillPath([{ state: start, fitness: fit }]);
    setHillStep(0);
    setHillActiveStep(0);
    scrollToRef(hillRefs.init);
  }, [hillFitnessFn, hillInitialState, hillSafeTarget.length]);

  const hillNext = React.useCallback(() => {
    if (hillStopped || hillIter >= hillMaxIter) {
      setHillStep(4);
      setHillActiveStep(4);
      scrollToRef(hillRefs.result);
      return;
    }
    const neighbors = hillNeighborsFn(hillCurrent);
    const best = neighbors[0] ?? null;
    setHillNeighbors(neighbors);
    setHillBest(best);
    setHillStep(2);
    setHillActiveStep(2);
    scrollToRef(hillRefs.neighbors);

    if (best && best.fitness > hillFitness) {
      setHillCurrent(best.state);
      setHillFitness(best.fitness);
      setHillIter((prev) => prev + 1);
      setHillPath((prev) => [...prev, best]);
      setHillStep(3);
      setHillActiveStep(3);
      scrollToRef(hillRefs.move);
    } else {
      setHillStopped(true);
      setHillStep(4);
      setHillActiveStep(4);
      scrollToRef(hillRefs.result);
    }
  }, [hillBest, hillCurrent, hillFitness, hillIter, hillMaxIter, hillNeighborsFn, hillRefs.move, hillRefs.neighbors, hillRefs.result, hillStopped]);


  const geneLength = Math.max(4, Math.min(32, target.length || 10));
  const safeTarget = target.padEnd(geneLength, '0').slice(0, geneLength);

  const score = React.useCallback((genes: string, goal: string) => {
    const len = Math.min(genes.length, goal.length);
    let s = 0;
    for (let i = 0; i < len; i++) {
      if (genes[i] === goal[i]) s++;
    }
    return s;
  }, []);

  const randomGenes = React.useCallback((len: number) => {
    let g = '';
    for (let i = 0; i < len; i++) {
      g += Math.random() < 0.5 ? '0' : '1';
    }
    return g;
  }, []);

  const initializePopulation = React.useCallback(() => {
    const initial: Chromosome[] = Array.from({ length: popSize }, (_, idx) => {
      const genes = randomGenes(geneLength);
      return {
        id: `P${idx + 1}`,
        genes,
        fitness: score(genes, safeTarget),
      };
    });
    setPopulation(initial);
    setGeneration(1);
    setSelectedParents([]);
    setCrossoverPairs([]);
    setMutations([]);
    setStageStep(0);
    setGaActiveStep(0);
  }, [geneLength, popSize, randomGenes, score, target]);

  const selectParents = React.useCallback(
    (pop: Chromosome[]): Chromosome[] => {
      if (selectionMethod === 'tournament') {
        const selected: Chromosome[] = [];
        const k = 3;
        for (let i = 0; i < pop.length; i++) {
          const contenders = Array.from({ length: k }, () => pop[Math.floor(Math.random() * pop.length)]);
          const winner = contenders.reduce((best, curr) => (curr.fitness > best.fitness ? curr : best), contenders[0]);
          selected.push({ ...winner, id: `${winner.id}-sel-${i}` });
        }
        return selected;
      }

      // roulette
      const minFitness = Math.min(...pop.map((p) => p.fitness));
      const weights = pop.map((p) => p.fitness - minFitness + 1);
      const total = weights.reduce((sum, w) => sum + w, 0);
      const selected: Chromosome[] = [];
      for (let i = 0; i < pop.length; i++) {
        const r = Math.random() * total;
        let acc = 0;
        for (let idx = 0; idx < pop.length; idx++) {
          acc += weights[idx];
          if (acc >= r) {
            const base = pop[idx];
            selected.push({ ...base, id: `${base.id}-sel-${i}` });
            break;
          }
        }
      }
      return selected;
    },
    [selectionMethod]
  );

  const crossover = React.useCallback(
    (parents: Chromosome[], goal: string) => {
      const pairs: { parents: [Chromosome, Chromosome]; children: [Chromosome, Chromosome]; crossoverPoint: number | null; crossed: boolean }[] = [];
      for (let i = 0; i < parents.length; i += 2) {
        const p1 = parents[i];
        const p2 = parents[(i + 1) % parents.length];
        const doCross = Math.random() < crossoverRate;
        let cp: number | null = null;
        let child1 = p1.genes;
        let child2 = p2.genes;
        if (doCross) {
          cp = Math.floor(Math.random() * (geneLength - 1)) + 1;
          child1 = p1.genes.slice(0, cp) + p2.genes.slice(cp);
          child2 = p2.genes.slice(0, cp) + p1.genes.slice(cp);
        }
        const c1: Chromosome = { id: `${p1.id}-c`, genes: child1, fitness: score(child1, goal) };
        const c2: Chromosome = { id: `${p2.id}-c`, genes: child2, fitness: score(child2, goal) };
        pairs.push({ parents: [p1, p2], children: [c1, c2], crossoverPoint: cp, crossed: doCross });
      }
      return pairs;
    },
    [crossoverRate, geneLength, score]
  );

  const mutate = React.useCallback(
    (pairs: { parents: [Chromosome, Chromosome]; children: [Chromosome, Chromosome] }[], goal: string) => {
      const mutationRecords: { id: string; mutatedIndices: number[]; before: string; after: string; fitness: number }[] = [];
      const mutatedChildren: Chromosome[] = [];
      pairs.forEach(({ children }) => {
        children.forEach((child) => {
          let genesArr = child.genes.split('');
          const mutatedIdx: number[] = [];
          genesArr = genesArr.map((gene, idx) => {
            if (Math.random() < mutationRate) {
              mutatedIdx.push(idx);
              return gene === '0' ? '1' : '0';
            }
            return gene;
          });
          const newGenes = genesArr.join('');
          const fitness = score(newGenes, goal);
          mutatedChildren.push({ id: child.id.replace('-c', '-m'), genes: newGenes, fitness });
          mutationRecords.push({
            id: child.id,
            mutatedIndices: mutatedIdx,
            before: child.genes,
            after: newGenes,
            fitness,
          });
        });
      });
      return { mutationRecords, mutatedChildren };
    },
    [mutationRate, score]
  );

  const nextGeneration = React.useCallback(() => {
    const parents = selectParents(population);
    const pairData = crossover(parents, safeTarget);
    const { mutationRecords, mutatedChildren } = mutate(pairData, safeTarget);

    const newPop = mutatedChildren
      .sort((a, b) => b.fitness - a.fitness)
      .slice(0, popSize)
      .map((c, idx) => ({ ...c, id: `G${generation + 1}-P${idx + 1}` }));

    setSelectedParents(parents);
    setCrossoverPairs(pairData);
    setMutations(mutationRecords);
    setPopulation(newPop);
    setGeneration((prev) => prev + 1);
    setStageStep(4);
    setGaActiveStep(1);
    scrollToRef(gaRefs.selection);
  }, [crossover, geneLength, generation, mutate, popSize, population, scrollToRef, selectParents, target]);

  const renderGenes = React.useCallback(
    (genes: string, mutatedIdx: number[] = []) => {
      const spans = [];
      for (let i = 0; i < genes.length; i++) {
        const g = genes[i];
        const targetBit = safeTarget[i] ?? '0';
        const match = g === targetBit;
        const isMut = mutatedIdx.includes(i);
        const cls = isMut ? 'gene mutated' : match ? 'gene match' : 'gene mismatch';
        spans.push(
          <span key={i} className={cls}>
            {g}
          </span>
        );
        if ((i + 1) % 4 === 0 && i !== genes.length - 1) {
          spans.push(<span key={`space-${i}`} className="gene-space"> </span>);
        }
      }
      return spans;
    },
    [safeTarget]
  );


  return (
    <div className="protein-structure-container">
      <header className="ps-header">
        <div className="header-content">
          <h1>Protein Structure Prediction</h1>
          <p className="subtitle">Choose a folding strategy to explore how sequences search their energy landscape.</p>
          <div className="header-actions">
            <button className="back-button" onClick={onNavigateToHomepage}>
              ← Back to Homepage
            </button>
          </div>
        </div>
      </header>

      <main className="ps-main">
        <section className="intro-section">
          <div className="intro-card">
            <div>
              <p className="eyebrow">Overview</p>
              <h2>From amino-acid sequence to a stable fold</h2>
              <p className="lead">
                Folding is an energy minimization problem under geometric constraints. Each strategy below explores
                the search space differently — evolving populations, cooling random walks, or simplifying the model
                on a lattice.
              </p>
              <div className="pill-row">
                <span className="pill neutral">Energy landscapes</span>
                <span className="pill neutral">Constraints</span>
                <span className="pill neutral">Move sets</span>
              </div>
            </div>
            <div className="fact-grid">
              <div className="fact-tile">
                <h4>What you’ll control</h4>
                <p>Population size, mutation rate, cooling schedule, and lattice moves.</p>
              </div>
              <div className="fact-tile">
                <h4>What you’ll see</h4>
                <p>Energy traces, accepted moves, contact maps, and final conformations.</p>
              </div>
              <div className="fact-tile">
                <h4>Next step</h4>
                <p>Pick an algorithm to load its dedicated visualization in the next milestone.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="algorithm-section">
          <div className="section-header">
            <div>
              <p className="eyebrow">Algorithm menu</p>
              <h2>Pick a folding approach</h2>
              <p className="section-subtitle">
                Two complementary strategies: evolutionary population search and greedy hill climbing.
              </p>
            </div>
            <span className="pill neutral">2 options</span>
          </div>

          <div className="algorithm-grid">
            {algorithms.map((algo) => (
              <article key={algo.id} className="algorithm-card">
                <div className="card-top">
                  <span className="pill soft">{algo.tag}</span>
                  <h3>{algo.title}</h3>
                  <p className="card-description">{algo.description}</p>
                </div>
                <ul className="bullet-list">
                  {algo.highlights.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>

        <div className="view-toggle">
          <button className={`view-pill ${activeView === 'ga' ? 'active' : ''}`} onClick={() => setActiveView('ga')}>
            Genetic Algorithm
          </button>
          <button className={`view-pill ${activeView === 'hill' ? 'active' : ''}`} onClick={() => setActiveView('hill')}>
            Hill Climbing
          </button>
        </div>

        {activeView === 'ga' && (
        <section className="ga-section">
          <div className="section-header">
            <div>
              <p className="eyebrow">Genetic Algorithm — interactive</p>
              <h2>Step-by-step evolution</h2>
              <p className="section-subtitle">Initialize, select, crossover, mutate, and observe the next generation with live fitness updates.</p>
            </div>
            <span className="pill neutral">Generation {generation || 0}</span>
          </div>

              <div className="dual-pane">
                <div className="ga-controls sticky">
                  <div className="control-row">
                    <label>Target (fitness goal)</label>
                    <input
                  value={target}
                  onChange={(e) => setTarget(e.target.value.replace(/[^01]/g, ''))}
                  placeholder="Binary target, e.g. 101010"
                />
                <small className="help-text">Fitness = matching bits with target. Length sets chromosome length.</small>
              </div>
              <div className="control-row two-col">
                <div>
                  <label>Population size</label>
                  <input
                    type="number"
                    min={4}
                    max={20}
                    value={popSize}
                    onChange={(e) => setPopSize(Math.min(20, Math.max(4, Number(e.target.value))))}
                  />
                </div>
                <div>
                  <label>Selection</label>
                  <select value={selectionMethod} onChange={(e) => setSelectionMethod(e.target.value as SelectionMethod)}>
                    <option value="roulette">Roulette wheel</option>
                    <option value="tournament">Tournament</option>
                  </select>
                </div>
              </div>
              <div className="control-row two-col">
                <div>
                  <label>Crossover rate</label>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={crossoverRate}
                    onChange={(e) => setCrossoverRate(Number(e.target.value))}
                  />
                  <div className="slider-value">{Math.round(crossoverRate * 100)}%</div>
                </div>
                <div>
                  <label>Mutation rate</label>
                  <input
                    type="range"
                    min={0}
                    max={0.5}
                    step={0.01}
                    value={mutationRate}
                    onChange={(e) => setMutationRate(Number(e.target.value))}
                  />
                  <div className="slider-value">{Math.round(mutationRate * 100)}%</div>
                </div>
              </div>
              <div className="action-row">
                <button className="primary-btn" onClick={initializePopulation}>Initialize Population</button>
                <button className="secondary-btn" onClick={nextGeneration} disabled={population.length === 0}>
                  Next Generation
                </button>
              </div>
              <p className="help-text">Use “Initialize” to start; “Next Generation” runs selection → crossover → mutation once.</p>
                  <div className="stepper">
                    {[
                      { id: 0, label: 'Initialize', ref: gaRefs.population },
                      { id: 1, label: 'Selection', ref: gaRefs.selection },
                      { id: 2, label: 'Crossover', ref: gaRefs.crossover },
                      { id: 3, label: 'Mutation', ref: gaRefs.mutation },
                      { id: 4, label: 'Next Generation', ref: gaRefs.summary },
                    ].map((step) => {
                      const unlocked = stageStep >= step.id;
                      return (
                        <button
                          key={step.id}
                          className={`stepper-btn ${gaActiveStep === step.id ? 'active' : ''}`}
                          disabled={!unlocked && step.id !== 0}
                          onClick={() => {
                            if (step.id === 0 || unlocked) {
                              setGaActiveStep(step.id);
                              scrollToRef(step.ref);
                            }
                          }}
                        >
                          {step.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="ga-visuals scrollable">
                  <div ref={gaRefs.population} className={`panel ${gaActiveStep === 0 ? 'active-panel' : ''}`}>
                    <h4>Current Population {generation ? `(Gen ${generation})` : ''}</h4>
                    <div className="chromosome-grid">
                      {population.length === 0 && <div className="empty-state">Initialize to see chromosomes.</div>}
                      {population.map((c) => (
                        <div key={c.id} className="chromosome-card">
                          <div className="chromosome-genes chip-box">{renderGenes(c.genes)}</div>
                          <div className="chromosome-meta">
                            <span className="pill soft">Fitness: {c.fitness}</span>
                            <span className="chip small">{c.id}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div ref={gaRefs.selection} className={`panel ${gaActiveStep === 1 ? 'active-panel' : ''}`}>
                    <h4>Selection</h4>
                    <p className="help-text">Selected parents highlighted; roulette uses fitness-weighted sampling, tournament picks the best of random groups.</p>
                    {stageStep < 1 ? (
                      <div className="empty-state">Click “Next Generation” to populate this step.</div>
                    ) : (
                      <div className="chromosome-grid">
                        {selectedParents.length === 0 && <div className="empty-state">Run a generation to view selected parents.</div>}
                        {selectedParents.map((p, idx) => (
                          <div key={`${p.id}-${idx}`} className="chromosome-card selected">
                            <div className="chromosome-genes chip-box">{renderGenes(p.genes)}</div>
                            <div className="chromosome-meta">
                              <span className="pill soft">Fitness: {p.fitness}</span>
                              <span className="chip small">Parent {idx + 1}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div ref={gaRefs.crossover} className={`panel ${gaActiveStep === 2 ? 'active-panel' : ''}`}>
                    <h4>Crossover</h4>
                    {stageStep < 2 ? (
                      <div className="empty-state">Click “Next Generation” to populate this step.</div>
                    ) : (
                      <div className="crossover-grid">
                        {crossoverPairs.length === 0 && <div className="empty-state">Run a generation to view crossover pairs.</div>}
                        {crossoverPairs.map((pair, idx) => (
                          <div key={idx} className="crossover-card">
                            <div className="pair-row">
                              <div className="mini-chromo">
                                <span className="label">Parent A</span>
                                <span className="genes chip-box">{renderGenes(pair.parents[0].genes)}</span>
                              </div>
                              <div className="mini-chromo">
                                <span className="label">Parent B</span>
                                <span className="genes chip-box">{renderGenes(pair.parents[1].genes)}</span>
                              </div>
                            </div>
                            <div className="crossover-info">
                              {pair.crossed ? (
                                <span className="pill soft">Single-point @ {pair.crossoverPoint}</span>
                              ) : (
                                <span className="pill soft">No crossover (copied)</span>
                              )}
                            </div>
                            <div className="pair-row children">
                              <div className="mini-chromo child">
                                <span className="label">Child A</span>
                                <span className="genes chip-box">{renderGenes(pair.children[0].genes)}</span>
                                <span className="chip small">Fitness {pair.children[0].fitness}</span>
                              </div>
                              <div className="mini-chromo child">
                                <span className="label">Child B</span>
                                <span className="genes chip-box">{renderGenes(pair.children[1].genes)}</span>
                                <span className="chip small">Fitness {pair.children[1].fitness}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div ref={gaRefs.mutation} className={`panel ${gaActiveStep === 3 ? 'active-panel' : ''}`}>
                    <h4>Mutation</h4>
                    {stageStep < 3 ? (
                      <div className="empty-state">Click “Next Generation” to populate this step.</div>
                    ) : (
                      <div className="mutation-grid">
                        {mutations.length === 0 && <div className="empty-state">Run a generation to view mutations.</div>}
                        {mutations.map((m) => (
                          <div key={m.id} className="mutation-card">
                            <div className="mutation-genes">
                              <span className="label">Before</span>
                              <span className="genes chip-box">{renderGenes(m.before)}</span>
                            </div>
                            <div className="mutation-genes after">
                              <span className="label">After</span>
                              <span className="genes chip-box">
                                {renderGenes(m.after, m.mutatedIndices)}
                              </span>
                            </div>
                            <div className="mutation-meta">
                              <span className="pill soft">Mutated {m.mutatedIndices.length} gene(s)</span>
                              <span className="chip small">Fitness {m.fitness}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div ref={gaRefs.summary} className={`panel summary ${gaActiveStep === 4 ? 'active-panel' : ''}`}>
                    <h4>Next Generation Summary</h4>
                    <p className="help-text">Highest fitness is highlighted; population is trimmed to the top N you set.</p>
                    {stageStep < 4 ? (
                      <div className="empty-state">Click “Next Gen” to reveal the new population.</div>
                    ) : (
                      <div className="chromosome-grid">
                        {population
                          .slice()
                          .sort((a, b) => b.fitness - a.fitness)
                          .map((c, idx) => (
                            <div key={`summary-${c.id}`} className={`chromosome-card ${idx === 0 ? 'best' : ''}`}>
                              <div className={`chromosome-genes chip-box ${idx === 0 ? 'best-chip' : ''}`}>{renderGenes(c.genes)}</div>
                              <div className="chromosome-meta">
                                <span className="pill soft">Fitness: {c.fitness}</span>
                                <span className="chip small">{idx + 1 === 1 ? '#1 Best' : `#${idx + 1}`}</span>
                              </div>
                            </div>
                          ))}
                      </div>
                )}
              </div>

                <div className="panel summary">
                  <h4>How this works</h4>
                  <ul className="bullet-list">
                    <li>Initialize: create a random population of bitstrings; fitness = matches to target.</li>
                    <li>Selection: pick parents via roulette or tournament (fitter strings more likely).</li>
                  <li>Crossover: swap segments to create children; builds new combinations of bits.</li>
                  <li>Mutation: flip random bits to keep diversity and escape local optima.</li>
                  <li>Next Gen: keep the top candidates and repeat until you’re satisfied.</li>
                </ul>
              </div>
            </div>
          </div>
        </section>
        )}


        {activeView === 'hill' && (
          <section className="ga-section">
            <div className="section-header">
              <div>
                <p className="eyebrow">Hill Climbing — interactive</p>
                <h2>Greedy ascent on a bitstring fitness landscape</h2>
                <p className="section-subtitle">Generate neighbors, pick the best, move only if improved, stop at a peak.</p>
              </div>
              <span className="pill neutral generation-pill">Iter {hillIter}</span>
            </div>

            <div className="dual-pane">
              <div className="ga-controls sticky">
                <div className="control-row">
                  <label>Target bitstring</label>
                  <input
                    value={hillTarget}
                    onChange={(e) => setHillTarget(e.target.value.replace(/[^01]/g, ''))}
                    placeholder="e.g. 1110010110"
                  />
                  <small className="help-text">Fitness = matching bits. Length sets the search space.</small>
                </div>
                <div className="control-row">
                  <label>Max iterations</label>
                  <input
                    type="number"
                    min={1}
                    max={200}
                    value={hillMaxIter}
                    onChange={(e) => setHillMaxIter(Math.min(200, Math.max(1, Number(e.target.value))))}
                  />
                </div>
                <div className="action-row">
                  <button className="primary-btn" onClick={initHill}>Initialize State</button>
                  <button className="secondary-btn" onClick={hillNext} disabled={!hillCurrent}>
                    Next Step
                  </button>
                </div>
                <p className="help-text">“Next Step” generates neighbors, picks best, moves only if fitness improves.</p>
                <div className="stage-buttons vertical">
                  {[0,1,2,3,4].map((tab) => {
                    const labels = ['Initialize','Evaluate','Neighbors','Move/Stop','Result'];
                    const refMap = [hillRefs.init, hillRefs.evaluate, hillRefs.neighbors, hillRefs.move, hillRefs.result];
                    return (
                      <button
                        key={tab}
                          className={`stage-btn ${hillActiveStep === tab ? 'active' : ''}`}
                          disabled={tab > hillStep}
                          onClick={() => {
                            setHillActiveStep(tab);
                            scrollToRef(refMap[tab]);
                          }}
                        >
                      {labels[tab]}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="ga-visuals scrollable">
                <div className="panel" ref={hillRefs.init}>
                  <h4>Initialize</h4>
                  {!hillCurrent ? (
                    <div className="empty-state">Click “Initialize State” to start.</div>
                  ) : (
                    <>
                      <p className="help-text">Random bitstring; fitness = matches with target.</p>
                      <div className="chip-box">{renderGenes(hillCurrent)}</div>
                      <p className="help-text">Fitness: {hillFitness} / {hillSafeTarget.length}</p>
                    </>
                  )}
                </div>

                <div className={`panel ${hillActiveStep === 1 ? 'active-panel' : ''}`} ref={hillRefs.evaluate}>
                  <h4>Evaluate</h4>
                  {!hillCurrent ? (
                    <div className="empty-state">Run initialize to populate.</div>
                  ) : (
                    <div className="meta-card">
                      <div><strong>State:</strong> <span className="chip-box">{renderGenes(hillCurrent)}</span></div>
                      <div><strong>Fitness:</strong> {hillFitness} / {hillSafeTarget.length}</div>
                      <div><strong>Iteration:</strong> {hillIter}</div>
                    </div>
                  )}
                </div>

                <div className={`panel ${hillActiveStep === 2 ? 'active-panel' : ''}`} ref={hillRefs.neighbors}>
                  <h4>Neighbors</h4>
                  {!hillNeighbors.length ? (
                    <div className="empty-state">Run a step to populate this.</div>
                  ) : (
                    <>
                      <p className="help-text">Generated by flipping one bit; sorted by fitness desc.</p>
                      <div className="chromosome-grid">
                        {hillNeighbors.map((n, idx) => (
                          <div key={`${n.state}-${idx}`} className={`chromosome-card ${idx === 0 ? 'best' : ''}`}>
                            <div className="chromosome-genes chip-box">{renderGenes(n.state)}</div>
                            <div className="chromosome-meta">
                              <span className="pill soft">Fitness: {n.fitness}</span>
                              <span className="chip small">{idx === 0 ? 'Best' : 'Neighbor'}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>

                <div className={`panel ${hillActiveStep === 3 ? 'active-panel' : ''}`} ref={hillRefs.move}>
                  <h4>Move / Stop</h4>
                  {!hillCurrent ? (
                    <div className="empty-state">Run a step to populate this.</div>
                  ) : (
                    <div className="meta-card">
                      <div><strong>Current fitness:</strong> {hillFitness}</div>
                      <div><strong>Best neighbor fitness:</strong> {hillBest?.fitness ?? '—'}</div>
                      <div><strong>Decision:</strong> {hillStopped ? 'No better neighbor — stop' : hillBest && hillBest.fitness > hillFitness ? 'Move to best neighbor' : 'No improvement'}</div>
                    </div>
                  )}
                </div>

                <div className={`panel summary ${hillActiveStep === 4 ? 'active-panel' : ''}`} ref={hillRefs.result}>
                  <h4>Result</h4>
                  {!hillCurrent ? (
                    <div className="empty-state">Run steps to see the result.</div>
                  ) : (
                    <>
                      <div className="meta-card">
                        <div><strong>Final state:</strong> <span className="chip-box">{renderGenes(hillCurrent)}</span></div>
                        <div><strong>Fitness:</strong> {hillFitness} / {hillSafeTarget.length}</div>
                        <div><strong>Iterations:</strong> {hillIter}</div>
                        <div><strong>Status:</strong> {hillStopped || hillIter >= hillMaxIter ? 'Stopped' : 'Continuing'}</div>
                      </div>
                      <div className="energy-chart">
                        <svg viewBox="0 0 320 120" preserveAspectRatio="none">
                          {hillPath.length > 1 && (() => {
                            const fitnesses = hillPath.map((p) => p.fitness);
                            const max = Math.max(...fitnesses);
                            const min = Math.min(...fitnesses);
                            const range = Math.max(1, max - min);
                            const points = fitnesses.map((v, idx) => {
                              const x = (idx / Math.max(1, fitnesses.length - 1)) * 320;
                              const y = 120 - ((v - min) / range) * 100 - 10;
                              return `${x},${y}`;
                            }).join(' ');
                            return <polyline points={points} fill="none" stroke="var(--primary)" strokeWidth="2" />;
                          })()}
                        </svg>
                        <div className="help-text">Fitness over iterations (higher is better). Steps: {hillPath.length - 1}</div>
                      </div>
                    </>
                  )}
                </div>

                <div className="panel summary">
                  <h4>How Hill Climbing works</h4>
                  <ul className="bullet-list">
                    <li>Initialize: start from a random bitstring; fitness = matches to target.</li>
                    <li>Neighbors: generate every 1-bit flip; evaluate fitness for each.</li>
                    <li>Move: pick the best neighbor and move only if it improves the score.</li>
                    <li>Stop: no improving neighbor → local optimum reached.</li>
                    <li>Lesson: fast and simple, but can get stuck; useful to explain local optima.</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>
        )}


        <section className="next-steps">
          <div className="next-card">
            <h3>What’s next?</h3>
            <p>
              Selecting an algorithm will load its dedicated view with controls for sequences, energy functions,
              move sets, and play/pause stepping — matching the style of our alignment and phylogeny modules.
            </p>
            <div className="step-chips">
              <span className="chip">Inputs: sequence + parameters</span>
              <span className="chip">Outputs: fold path + energy trace</span>
              <span className="chip">Controls: play / pause / reset</span>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default ProteinStructure;
