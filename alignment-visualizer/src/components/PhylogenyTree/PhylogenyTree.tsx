import React, { useState, useCallback, useMemo } from 'react';
import Tree from 'react-d3-tree';
import type { RawNodeDatum, CustomNodeElementProps } from 'react-d3-tree';
import './PhylogenyTree.css';

interface PhylogenyTreeProps {
  onNavigateToHomepage: () => void;
}

type Mode = 'newick' | 'canonical';

// Example phylogenetic data
const NEWICK_EXAMPLE = '((Human:0.3,Chimp:0.2)Primates:0.4,(Mouse:0.5,Rat:0.4)Rodents:0.3)Mammals;';

// Tree data for react-d3-tree (used for both modes)
const phylogenyTreeData: RawNodeDatum = {
  name: 'Mammals',
  attributes: { distance: '0.0' },
  children: [
    {
      name: 'Primates',
      attributes: { distance: '0.4' },
      children: [
        { name: 'Human', attributes: { distance: '0.3' } },
        { name: 'Chimp', attributes: { distance: '0.2' } },
      ],
    },
    {
      name: 'Rodents',
      attributes: { distance: '0.3' },
      children: [
        { name: 'Mouse', attributes: { distance: '0.5' } },
        { name: 'Rat', attributes: { distance: '0.4' } },
      ],
    },
  ],
};

// Newick parsing steps (String → Tree)
interface NewickStep {
  stepNumber: number;
  title: string;
  description: string;
  highlightedNewick: React.ReactNode;
  treeState: RawNodeDatum | null;
  explanation: string;
}

// Canonical Newick steps (Tree → String with sorting)
interface CanonicalStep {
  stepNumber: number;
  title: string;
  description: string;
  treeState: RawNodeDatum;
  currentNewick: React.ReactNode;
  sortingInfo: React.ReactNode;
  explanation: string;
}

const PhylogenyTree: React.FC<PhylogenyTreeProps> = ({ onNavigateToHomepage }) => {
  const [mode, setMode] = useState<Mode>('newick');
  const [newickStep, setNewickStep] = useState(0);
  const [canonicalStep, setCanonicalStep] = useState(0);

  const handleModeChange = useCallback((newMode: Mode) => {
    setMode(newMode);
    setNewickStep(0);
    setCanonicalStep(0);
  }, []);

  // Newick format step-by-step explanation (Building: Tree → String)
  const newickSteps: NewickStep[] = useMemo(() => [
    {
      stepNumber: 0,
      title: 'Introduction to Newick Format',
      description: 'Newick format represents tree structures using nested parentheses. We will build this string from a tree.',
      highlightedNewick: (
        <span className="newick-string">
          Building: Tree → String
        </span>
      ),
      treeState: phylogenyTreeData,
      explanation: 'Given a phylogenetic tree, we will construct its Newick string representation. Each pair of parentheses will represent a branching point (internal node).',
    },
    {
      stepNumber: 1,
      title: 'Step 1: Identify Leaf Nodes',
      description: 'Start by identifying all leaf nodes (species) and their branch lengths.',
      highlightedNewick: (
        <span className="newick-string">
          Leaves: <span className="highlight-leaf">Human:0.3</span>, <span className="highlight-leaf">Chimp:0.2</span>, <span className="highlight-leaf">Mouse:0.5</span>, <span className="highlight-leaf">Rat:0.4</span>
        </span>
      ),
      treeState: phylogenyTreeData,
      explanation: 'We identify all leaf nodes in the tree: Human (distance 0.3), Chimp (distance 0.2), Mouse (distance 0.5), and Rat (distance 0.4). Each leaf will be written as Name:Distance.',
    },
    {
      stepNumber: 2,
      title: 'Step 2: Build Leaf Pairs (Clades)',
      description: 'Group sibling leaves together within parentheses.',
      highlightedNewick: (
        <span className="newick-string">
          <span className="highlight-clade">(Human:0.3,Chimp:0.2)</span> and <span className="highlight-clade">(Mouse:0.5,Rat:0.4)</span>
        </span>
      ),
      treeState: phylogenyTreeData,
      explanation: 'Siblings that share a parent are grouped in parentheses separated by commas. Human and Chimp are siblings under Primates. Mouse and Rat are siblings under Rodents.',
    },
    {
      stepNumber: 3,
      title: 'Step 3: Add Internal Node Labels',
      description: 'After the closing parenthesis, add the internal node name and its branch length.',
      highlightedNewick: (
        <span className="newick-string">
          (<span className="highlight-leaf">Human:0.3</span>,<span className="highlight-leaf">Chimp:0.2</span>)<span className="highlight-clade">Primates:0.4</span>,(<span className="highlight-leaf">Mouse:0.5</span>,<span className="highlight-leaf">Rat:0.4</span>)<span className="highlight-clade">Rodents:0.3</span>
        </span>
      ),
      treeState: phylogenyTreeData,
      explanation: 'The internal node name comes right after the closing parenthesis, followed by its branch length. Primates:0.4 means the Primates clade is 0.4 units from its parent.',
    },
    {
      stepNumber: 4,
      title: 'Step 4: Add Root Node',
      description: 'Wrap all clades with the root parentheses and add root name with semicolon.',
      highlightedNewick: (
        <span className="newick-string">
          <span className="highlight-root">(</span>(Human:0.3,Chimp:0.2)Primates:0.4,(Mouse:0.5,Rat:0.4)Rodents:0.3<span className="highlight-root">)Mammals;</span>
        </span>
      ),
      treeState: phylogenyTreeData,
      explanation: 'The outermost parentheses group all children of the root. The root name "Mammals" comes after, and a semicolon marks the end of the Newick string.',
    },
    {
      stepNumber: 5,
      title: 'Complete Newick String',
      description: 'The final Newick string fully represents our tree.',
      highlightedNewick: (
        <span className="newick-string newick-complete">
          {NEWICK_EXAMPLE}
        </span>
      ),
      treeState: phylogenyTreeData,
      explanation: 'The complete Newick string encodes the entire tree structure: Human and Chimp share ancestor Primates, Mouse and Rat share Rodents, and all share Mammals as the root.',
    },
  ], []);

  // Canonical Newick format step-by-step (Tree → String with alphabetical sorting)
  const canonicalSteps: CanonicalStep[] = useMemo(() => [
    {
      stepNumber: 0,
      title: 'Introduction to Canonical Newick',
      description: 'Canonical Newick is a standardized way to write trees where nodes are sorted alphabetically.',
      treeState: phylogenyTreeData,
      currentNewick: <span className="newick-string">?</span>,
      sortingInfo: (
        <div className="sorting-rules">
          <h4>Canonical Rules:</h4>
          <ol>
            <li><strong>Alphabetical sorting</strong> of children at each node</li>
            <li><strong>Internal nodes</strong> labeled based on their first leaf descendant</li>
            <li><strong>Consistent representation</strong> regardless of input order</li>
          </ol>
        </div>
      ),
      explanation: 'The same tree can be written in many equivalent Newick strings. Canonical form ensures a unique representation by sorting children alphabetically. This is essential for comparing trees.',
    },
    {
      stepNumber: 1,
      title: 'Step 1: Identify All Leaves',
      description: 'First, identify all leaf nodes (species) in the tree.',
      treeState: phylogenyTreeData,
      currentNewick: (
        <span className="newick-string">
          Leaves: <span className="highlight-leaf">Chimp</span>, <span className="highlight-leaf">Human</span>, <span className="highlight-leaf">Mouse</span>, <span className="highlight-leaf">Rat</span>
        </span>
      ),
      sortingInfo: (
        <div className="sorting-table">
          <h4>Leaf Nodes (Alphabetically):</h4>
          <table>
            <thead><tr><th>Original</th><th>Sorted</th></tr></thead>
            <tbody>
              <tr><td>Human, Chimp, Mouse, Rat</td><td><strong>Chimp, Human, Mouse, Rat</strong></td></tr>
            </tbody>
          </table>
        </div>
      ),
      explanation: 'We identify all 4 leaf nodes: Human, Chimp, Mouse, Rat. In alphabetical order: Chimp, Human, Mouse, Rat. This ordering will guide how we write the Newick string.',
    },
    {
      stepNumber: 2,
      title: 'Step 2: Sort Children at Each Internal Node',
      description: 'At each internal node, sort children alphabetically by their "first" leaf.',
      treeState: {
        name: 'Mammals',
        attributes: { distance: '0.0' },
        children: [
          {
            name: 'Primates',
            attributes: { distance: '0.4', sorted: 'yes' },
            children: [
              { name: 'Chimp', attributes: { distance: '0.2', order: '1st' } },
              { name: 'Human', attributes: { distance: '0.3', order: '2nd' } },
            ],
          },
          {
            name: 'Rodents',
            attributes: { distance: '0.3', sorted: 'yes' },
            children: [
              { name: 'Mouse', attributes: { distance: '0.5', order: '1st' } },
              { name: 'Rat', attributes: { distance: '0.4', order: '2nd' } },
            ],
          },
        ],
      },
      currentNewick: (
        <span className="newick-string">
          Primates: [<span className="highlight-sorted">Chimp</span>, Human] → "C" before "H" ✓<br/>
          Rodents: [<span className="highlight-sorted">Mouse</span>, Rat] → "M" before "R" ✓
        </span>
      ),
      sortingInfo: (
        <div className="sorting-table">
          <h4>Internal Node Sorting:</h4>
          <table>
            <thead><tr><th>Node</th><th>Children</th><th>First Leaf</th><th>Sorted Order</th></tr></thead>
            <tbody>
              <tr><td>Primates</td><td>Human, Chimp</td><td>Chimp (C)</td><td><strong>Chimp, Human</strong></td></tr>
              <tr><td>Rodents</td><td>Mouse, Rat</td><td>Mouse (M)</td><td><strong>Mouse, Rat</strong></td></tr>
            </tbody>
          </table>
        </div>
      ),
      explanation: 'For Primates: Chimp (C) comes before Human (H) alphabetically, so Chimp is listed first. For Rodents: Mouse (M) comes before Rat (R), so Mouse is first.',
    },
    {
      stepNumber: 3,
      title: 'Step 3: Sort Root Children',
      description: 'Sort the root\'s children by their first leaf descendant.',
      treeState: {
        name: 'Mammals',
        attributes: { distance: '0.0' },
        children: [
          {
            name: 'Primates',
            attributes: { distance: '0.4', firstLeaf: 'Chimp' },
            children: [
              { name: 'Chimp', attributes: { distance: '0.2' } },
              { name: 'Human', attributes: { distance: '0.3' } },
            ],
          },
          {
            name: 'Rodents',
            attributes: { distance: '0.3', firstLeaf: 'Mouse' },
            children: [
              { name: 'Mouse', attributes: { distance: '0.5' } },
              { name: 'Rat', attributes: { distance: '0.4' } },
            ],
          },
        ],
      },
      currentNewick: (
        <span className="newick-string">
          Root (Mammals): [Primates→<span className="highlight-clade">Chimp</span>, Rodents→<span className="highlight-clade">Mouse</span>]<br/>
          "C" before "M" → <strong>Primates first, then Rodents</strong>
        </span>
      ),
      sortingInfo: (
        <div className="sorting-table">
          <h4>Root Children Sorting:</h4>
          <table>
            <thead><tr><th>Child Clade</th><th>First Leaf</th><th>Sort Key</th></tr></thead>
            <tbody>
              <tr><td>Primates</td><td>Chimp</td><td><strong>C</strong></td></tr>
              <tr><td>Rodents</td><td>Mouse</td><td><strong>M</strong></td></tr>
            </tbody>
          </table>
          <p className="sort-result">Order: Primates (C) → Rodents (M)</p>
        </div>
      ),
      explanation: 'Primates\' first leaf is "Chimp" (C), Rodents\' first leaf is "Mouse" (M). Since C comes before M, Primates is written before Rodents in the Newick string.',
    },
    {
      stepNumber: 4,
      title: 'Step 4: Build Newick String (Leaves)',
      description: 'Start building the string from the innermost nodes (leaves).',
      treeState: phylogenyTreeData,
      currentNewick: (
        <span className="newick-string">
          (<span className="highlight-leaf">Chimp:0.2</span>,<span className="highlight-leaf">Human:0.3</span>)...,(<span className="highlight-leaf">Mouse:0.5</span>,<span className="highlight-leaf">Rat:0.4</span>)...
        </span>
      ),
      sortingInfo: (
        <div className="building-steps">
          <h4>Building from leaves:</h4>
          <div className="build-step">
            <span className="step-num">1.</span> Write sorted leaf pairs with distances
          </div>
          <div className="build-step">
            <span className="step-num">2.</span> Primates: (<strong>Chimp:0.2,Human:0.3</strong>)
          </div>
          <div className="build-step">
            <span className="step-num">3.</span> Rodents: (<strong>Mouse:0.5,Rat:0.4</strong>)
          </div>
        </div>
      ),
      explanation: 'We write each clade\'s children in sorted order. Note that Chimp comes before Human (alphabetically), and Mouse comes before Rat.',
    },
    {
      stepNumber: 5,
      title: 'Step 5: Add Internal Node Labels',
      description: 'Add the internal node names and branch lengths.',
      treeState: phylogenyTreeData,
      currentNewick: (
        <span className="newick-string">
          (<span className="highlight-clade">(Chimp:0.2,Human:0.3)Primates:0.4</span>,<span className="highlight-clade">(Mouse:0.5,Rat:0.4)Rodents:0.3</span>)...
        </span>
      ),
      sortingInfo: (
        <div className="building-steps">
          <h4>Adding internal labels:</h4>
          <div className="build-step">
            <span className="step-num">1.</span> Close Primates: )Primates:0.4
          </div>
          <div className="build-step">
            <span className="step-num">2.</span> Close Rodents: )Rodents:0.3
          </div>
          <div className="build-step">
            <span className="step-num">3.</span> Separate with comma
          </div>
        </div>
      ),
      explanation: 'After listing the children, we close the parentheses and add the internal node name followed by its branch length to the parent.',
    },
    {
      stepNumber: 6,
      title: 'Step 6: Complete Canonical Newick String',
      description: 'Wrap everything with the root and add the semicolon.',
      treeState: phylogenyTreeData,
      currentNewick: (
        <span className="newick-string newick-complete">
          <span className="highlight-root">(</span>(Chimp:0.2,Human:0.3)Primates:0.4,(Mouse:0.5,Rat:0.4)Rodents:0.3<span className="highlight-root">)Mammals;</span>
        </span>
      ),
      sortingInfo: (
        <div className="final-comparison">
          <h4>Canonical vs Original:</h4>
          <div className="comparison-item">
            <strong>Original:</strong>
            <code>((Human:0.3,Chimp:0.2)Primates:0.4,(Mouse:0.5,Rat:0.4)Rodents:0.3)Mammals;</code>
          </div>
          <div className="comparison-item canonical">
            <strong>Canonical:</strong>
            <code>((Chimp:0.2,Human:0.3)Primates:0.4,(Mouse:0.5,Rat:0.4)Rodents:0.3)Mammals;</code>
          </div>
          <p className="diff-note">Difference: <span className="highlight-diff">Chimp,Human</span> vs Human,Chimp (sorted alphabetically)</p>
        </div>
      ),
      explanation: 'The final canonical Newick string! Notice the only difference from the original: children are now in alphabetical order (Chimp before Human). This ensures any tree has exactly ONE canonical representation.',
    },
  ], []);

  const currentNewickStep = newickSteps[newickStep];
  const currentCanonicalStep = canonicalSteps[canonicalStep];

  // Custom node component for the tree
  const renderCustomNode = ({ nodeDatum }: CustomNodeElementProps) => {
    const isLeaf = !nodeDatum.children || nodeDatum.children.length === 0;
    return (
      <g>
        <circle
          r={isLeaf ? 10 : 8}
          fill={isLeaf ? '#4CAF50' : '#2D1B4E'}
          stroke={isLeaf ? '#388E3C' : '#1a0f2e'}
          strokeWidth={1.5}
        />
        <text
          fill="#444"
          x={isLeaf ? 16 : -45}
          y={isLeaf ? 4 : -4}
          textAnchor={isLeaf ? 'start' : 'end'}
          fontSize={isLeaf ? '12px' : '10px'}
          fontWeight="300"
          fontFamily="'Helvetica Neue', Arial, sans-serif"
          style={{ letterSpacing: '0.3px' }}
        >
          {nodeDatum.name}
        </text>
        {nodeDatum.attributes?.distance && (
          <text
            fill="#999"
            x={isLeaf ? 16 : -45}
            y={isLeaf ? 17 : 9}
            textAnchor={isLeaf ? 'start' : 'end'}
            fontSize="9px"
            fontWeight="300"
            fontFamily="'Helvetica Neue', Arial, sans-serif"
          >
            d: {nodeDatum.attributes.distance}
          </text>
        )}
      </g>
    );
  };

  return (
    <div className="phylogeny-container">
      {/* Header */}
      <header className="phylogeny-header">
        <div className="header-content">
          <h1>Phylogenetic Trees</h1>
          <button className="back-button" onClick={onNavigateToHomepage}>
            ← Back to Homepage
          </button>
        </div>
      </header>

      <main className="phylogeny-main">
        {/* Definition Section */}
        <section className="definition-section">
          <div className="definition-card">
            <div className="definition-visual">
              <div className="tree-icon-large tree-icon-svg">
                <svg viewBox="0 0 100 100" width="80" height="80">
                  <line x1="50" y1="90" x2="50" y2="50" stroke="#2D1B4E" strokeWidth="3"/>
                  <line x1="50" y1="50" x2="25" y2="20" stroke="#2D1B4E" strokeWidth="3"/>
                  <line x1="50" y1="50" x2="75" y2="20" stroke="#2D1B4E" strokeWidth="3"/>
                  <circle cx="50" cy="50" r="6" fill="#2D1B4E"/>
                  <circle cx="25" cy="20" r="6" fill="#4CAF50"/>
                  <circle cx="75" cy="20" r="6" fill="#4CAF50"/>
                  <circle cx="50" cy="90" r="6" fill="#2D1B4E"/>
                </svg>
              </div>
              <div className="branch-lines">
                <div className="branch branch-1"></div>
                <div className="branch branch-2"></div>
                <div className="branch branch-3"></div>
              </div>
            </div>
            <div className="definition-content">
              <h2>What is a Phylogenetic Tree?</h2>
              <p className="definition-main">
                A <strong>phylogenetic tree</strong> (or evolutionary tree) is a branching diagram showing the 
                <span className="highlight-term"> evolutionary relationships</span> among biological species based on 
                similarities and differences in their physical or genetic characteristics.
              </p>
              <div className="key-concepts">
                <div className="concept-item">
                  <span className="concept-icon concept-leaf"></span>
                  <div>
                    <strong>Leaves (Tips)</strong>
                    <p>Represent current species or sequences</p>
                  </div>
                </div>
                <div className="concept-item">
                  <span className="concept-icon concept-internal"></span>
                  <div>
                    <strong>Internal Nodes</strong>
                    <p>Represent common ancestors (hypothetical)</p>
                  </div>
                </div>
                <div className="concept-item">
                  <span className="concept-icon concept-branch"></span>
                  <div>
                    <strong>Branch Lengths</strong>
                    <p>Represent evolutionary distance or time</p>
                  </div>
                </div>
                <div className="concept-item">
                  <span className="concept-icon concept-root"></span>
                  <div>
                    <strong>Root</strong>
                    <p>The most recent common ancestor of all taxa</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Mode Selector */}
        <section className="mode-section">
          <h2>Tree Representation Formats</h2>
          <p className="mode-subtitle">Explore two ways to work with Newick format</p>
          
          <div className="mode-selector">
            <button
              className={`mode-button ${mode === 'newick' ? 'active' : ''}`}
              onClick={() => handleModeChange('newick')}
            >
              <span className="mode-icon mode-icon-newick"></span>
              <span className="mode-name">Newick Format</span>
              <span className="mode-desc">Build string from tree</span>
            </button>
            <button
              className={`mode-button ${mode === 'canonical' ? 'active' : ''}`}
              onClick={() => handleModeChange('canonical')}
            >
              <span className="mode-icon mode-icon-canonical"></span>
              <span className="mode-name">Canonical Newick</span>
              <span className="mode-desc">Build string from tree (sorted)</span>
            </button>
          </div>
        </section>

        {/* Newick Format Section (Tree → String) */}
        {mode === 'newick' && (
          <section className="format-section">
            <div className="format-header">
              <h2>Newick Format: Tree → String</h2>
              <p>Build a text-based Newick string from a phylogenetic tree</p>
            </div>

            <div className="example-box">
              <h3>Example Newick String:</h3>
              <div className="newick-display">
                {currentNewickStep.highlightedNewick}
              </div>
            </div>

            <div className="step-content">
              <div className="step-info">
                <div className="step-header">
                  <span className="step-badge">Step {currentNewickStep.stepNumber}</span>
                  <h3>{currentNewickStep.title}</h3>
                </div>
                <p className="step-description">{currentNewickStep.description}</p>
                <div className="step-explanation">
                  <span className="explanation-icon">i</span>
                  <p>{currentNewickStep.explanation}</p>
                </div>
              </div>

              <div className="tree-visualization">
                <h4>Tree Visualization</h4>
                {currentNewickStep.treeState ? (
                  <div className="tree-container tree-container-large">
                    <Tree
                      data={currentNewickStep.treeState}
                      orientation="vertical"
                      pathFunc="step"
                      translate={{ x: 280, y: 50 }}
                      nodeSize={{ x: 150, y: 110 }}
                      renderCustomNodeElement={renderCustomNode}
                      zoom={0.75}
                      enableLegacyTransitions
                    />
                  </div>
                ) : (
                  <div className="tree-placeholder">
                    <span className="placeholder-icon"></span>
                    <p>Tree visualization loading...</p>
                  </div>
                )}
              </div>
            </div>

            <div className="step-navigation">
              <button
                className="nav-button"
                onClick={() => setNewickStep(Math.max(0, newickStep - 1))}
                disabled={newickStep === 0}
              >
                ← Previous
              </button>
              <div className="step-indicators">
                {newickSteps.map((_, idx) => (
                  <button
                    key={idx}
                    className={`step-dot ${idx === newickStep ? 'active' : ''}`}
                    onClick={() => setNewickStep(idx)}
                  />
                ))}
              </div>
              <button
                className="nav-button"
                onClick={() => setNewickStep(Math.min(newickSteps.length - 1, newickStep + 1))}
                disabled={newickStep === newickSteps.length - 1}
              >
                Next →
              </button>
            </div>
          </section>
        )}

        {/* Canonical Newick Format Section (Tree → String) */}
        {mode === 'canonical' && (
          <section className="format-section">
            <div className="format-header">
              <h2>Canonical Newick: Tree → String</h2>
              <p>Build a standardized Newick string from a tree using alphabetical sorting</p>
            </div>

            <div className="step-content canonical-content">
              <div className="step-info">
                <div className="step-header">
                  <span className="step-badge">Step {currentCanonicalStep.stepNumber}</span>
                  <h3>{currentCanonicalStep.title}</h3>
                </div>
                <p className="step-description">{currentCanonicalStep.description}</p>

                {/* Current Newick Building Progress */}
                <div className="newick-progress">
                  <h4>Current Output:</h4>
                  <div className="newick-display">
                    {currentCanonicalStep.currentNewick}
                  </div>
                </div>

                {/* Sorting Information */}
                <div className="sorting-info">
                  {currentCanonicalStep.sortingInfo}
                </div>

                <div className="step-explanation">
                  <span className="explanation-icon">i</span>
                  <p>{currentCanonicalStep.explanation}</p>
                </div>
              </div>

              <div className="tree-visualization">
                <h4>Source Tree</h4>
                <div className="tree-container tree-container-large">
                  <Tree
                    data={currentCanonicalStep.treeState}
                    orientation="vertical"
                    pathFunc="step"
                    translate={{ x: 280, y: 50 }}
                    nodeSize={{ x: 150, y: 110 }}
                    renderCustomNodeElement={renderCustomNode}
                    zoom={0.7}
                    enableLegacyTransitions
                  />
                </div>
              </div>
            </div>

            <div className="step-navigation">
              <button
                className="nav-button"
                onClick={() => setCanonicalStep(Math.max(0, canonicalStep - 1))}
                disabled={canonicalStep === 0}
              >
                ← Previous
              </button>
              <div className="step-indicators">
                {canonicalSteps.map((_, idx) => (
                  <button
                    key={idx}
                    className={`step-dot ${idx === canonicalStep ? 'active' : ''}`}
                    onClick={() => setCanonicalStep(idx)}
                  />
                ))}
              </div>
              <button
                className="nav-button"
                onClick={() => setCanonicalStep(Math.min(canonicalSteps.length - 1, canonicalStep + 1))}
                disabled={canonicalStep === canonicalSteps.length - 1}
              >
                Next →
              </button>
            </div>
          </section>
        )}

        {/* Legend Section */}
        <section className="legend-section">
          <h3>Tree Legend</h3>
          <div className="legend-items">
            <div className="legend-item">
              <div className="legend-node leaf-node"></div>
              <span>Leaf Node (Current Species)</span>
            </div>
            <div className="legend-item">
              <div className="legend-node internal-node"></div>
              <span>Internal Node (Common Ancestor)</span>
            </div>
            <div className="legend-item">
              <div className="legend-line"></div>
              <span>Branch (Evolutionary Path)</span>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default PhylogenyTree;
