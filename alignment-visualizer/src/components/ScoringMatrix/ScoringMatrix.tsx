import React, { useState } from 'react';
import './ScoringMatrix.css';

interface ScoringMatrixProps {
  onNavigateToHomepage: () => void;
}

const ScoringMatrix: React.FC<ScoringMatrixProps> = ({ onNavigateToHomepage }) => {
  const [activeTab, setActiveTab] = useState<'pam' | 'blosum'>('pam');
  const [pamStep, setPamStep] = useState(0);
  const [blosumStep, setBlosumStep] = useState(0);

  const pamSteps = [
    {
      title: 'Step 1: Start with Global Alignments of Closely Related Sequences',
      description: 'PAM matrices are constructed from GLOBAL alignments of protein sequences that share at least 85% identity. Dayhoff chose this threshold because at high similarity, we can confidently identify which amino acids have mutated. The limitation: this uses a relatively small amount of data since only very similar sequences qualify.',
    },
    {
      title: 'Step 2: Count Amino Acid Substitutions from Aligned Pairs',
      description: 'For every position across all aligned sequence pairs, count how often amino acid i is aligned with amino acid j. This builds a symmetric count matrix A(i,j). The diagonal elements (same amino acid) will be very high because most positions are conserved in closely related sequences.',
    },
    {
      title: 'Step 3: Calculate Mutation Probabilities to Build PAM-1',
      description: 'Convert raw counts to conditional probabilities M(i→j), the probability that amino acid i mutates to amino acid j in ONE unit of evolutionary time (1 PAU = 1 Point Accepted Mutation per 100 residues). This is NOT saying amino acids always stay the same - it is the probability over a very short evolutionary distance.',
    },
    {
      title: 'Step 4: Matrix Exponentiation to Derive PAM-k',
      description: 'The key mathematical insight: PAM-k = (PAM-1)^k. To model longer evolutionary distances, we multiply the PAM-1 matrix by itself k times. PAM-250 means 250 units of evolutionary time, which corresponds to approximately 80% sequence divergence (only 20% identity remaining on average).',
    },
    {
      title: 'Step 5: Convert Probabilities to Log-Odds Scores',
      description: 'For every cell (i,j), compute: Score(i,j) = log(OBSERVED / EXPECTED). Here, OBSERVED = M(i,j) is the mutation probability from the PAM-k matrix, and EXPECTED = f(j) is the background frequency of amino acid j. This is the SAME fundamental formula as BLOSUM - both matrices use log(observed/expected). The difference is only in HOW observed and expected are calculated.',
    },
  ];

  const blosumSteps = [
    {
      title: 'Step 1: Start with Local Alignments from BLOCKS Database',
      description: 'BLOSUM matrices use LOCAL ungapped alignments called "blocks" from the BLOCKS database. These blocks are essentially MOTIFS - conserved functional sequence patterns found across many protein families. Unlike PAM, BLOSUM uses a vast amount of sequence data from thousands of protein families, and sequences can be quite divergent (not limited to 85% identity).',
    },
    {
      title: 'Step 2: Cluster Similar Sequences to Reduce Bias',
      description: 'For BLOSUM-K, sequences sharing K% or more identity are clustered together and treated as a single sequence. This prevents closely related sequences from being over-represented. Each cluster gets equal weight regardless of how many sequences it contains. The value of K determines the matrix name (e.g., K=62 gives BLOSUM-62).',
    },
    {
      title: 'Step 3: Count All Amino Acid Pairs in Each Column',
      description: 'For every column in every block, enumerate ALL possible pairs of amino acids. If a column has n sequences (or clusters), there are C(n,2) = n(n-1)/2 pairs. Sum these counts across all columns and all blocks to build the total pair frequency table f(i,j).',
    },
    {
      title: 'Step 4: Calculate Observed vs Expected Frequencies for Each Pair',
      description: 'For each amino acid pair (i,j): OBSERVED frequency q(i,j) comes from the actual pair counts. EXPECTED frequency e(i,j) = p(i) × p(j) for i=j, or 2×p(i)×p(j) for i≠j, where p(i) is the overall frequency of amino acid i. This comparison reveals which substitutions are favored or disfavored by evolution.',
    },
    {
      title: 'Step 5: Compute Log-Odds Score for Every Matrix Cell',
      description: 'For EVERY cell (i,j) in the final matrix: Score(i,j) = round(2 × log₂(q(i,j) / e(i,j))). This is the core formula. Positive scores indicate the pair occurs MORE often than random chance (evolutionarily favorable substitution). Negative scores indicate LESS often than chance (deleterious substitution).',
    },
  ];

  const renderPamVisual = () => {
    switch (pamStep) {
      case 0:
        return (
          <div className="visual-container">
            <h4>Example: 5 Closely Related Protein Sequences (greater than 85% identical)</h4>
            <p className="visual-subtitle">Red cells indicate positions where mutations have occurred. Most positions are conserved.</p>
            
            <div className="example-sequences">
              <div className="seq-alignment-box">
                <div className="position-header">
                  <span></span>
                  {['1', '2', '3', '4', '5'].map(p => <span key={p} className="pos-num">{p}</span>)}
                </div>
                <div className="seq-row">
                  <span className="seq-name">Seq 1:</span>
                  <span className="aa">A</span>
                  <span className="aa">C</span>
                  <span className="aa">D</span>
                  <span className="aa">E</span>
                  <span className="aa">F</span>
                </div>
                <div className="seq-row">
                  <span className="seq-name">Seq 2:</span>
                  <span className="aa">A</span>
                  <span className="aa">C</span>
                  <span className="aa">D</span>
                  <span className="aa mutation">D</span>
                  <span className="aa">F</span>
                </div>
                <div className="seq-row">
                  <span className="seq-name">Seq 3:</span>
                  <span className="aa">A</span>
                  <span className="aa">C</span>
                  <span className="aa mutation">N</span>
                  <span className="aa">E</span>
                  <span className="aa">F</span>
                </div>
                <div className="seq-row">
                  <span className="seq-name">Seq 4:</span>
                  <span className="aa mutation">G</span>
                  <span className="aa">C</span>
                  <span className="aa">D</span>
                  <span className="aa">E</span>
                  <span className="aa">F</span>
                </div>
                <div className="seq-row">
                  <span className="seq-name">Seq 5:</span>
                  <span className="aa">A</span>
                  <span className="aa">C</span>
                  <span className="aa">D</span>
                  <span className="aa">E</span>
                  <span className="aa mutation">Y</span>
                </div>
              </div>
            </div>

            <div className="insight-box">
              <h5>Key Points about PAM Data Source:</h5>
              <ul>
                <li><strong>Global alignments</strong> - entire sequences are aligned from start to end, not just conserved regions</li>
                <li><strong>Phylogenetic approach</strong> - mutations are inferred from evolutionary trees of related sequences</li>
                <li>Mutations highlighted in <span className="mutation-inline">red</span> represent accepted point mutations that did not destroy protein function</li>
              </ul>
            </div>
          </div>
        );

      case 1:
        return (
          <div className="visual-container">
            <h4>Counting Substitutions: Building the Raw Count Matrix A(i,j)</h4>
            <p className="visual-subtitle">For each column, count how many times amino acid i appears paired with amino acid j across all sequence pairs</p>
            
            <div className="counting-example">
              <div className="column-analysis">
                <h5>Position 4 Analysis:</h5>
                <div className="column-data">
                  <div className="col-visual">
                    <span className="col-aa">E</span>
                    <span className="col-aa highlight">D</span>
                    <span className="col-aa">E</span>
                    <span className="col-aa">E</span>
                    <span className="col-aa">E</span>
                  </div>
                  <div className="pairs-from-column">
                    <h6>All pairs from this column (5 sequences = 10 pairs):</h6>
                    <div className="pair-calc">
                      <span>E-E pairs: 6 (from positions 1-3, 1-4, 1-5, 3-4, 3-5, 4-5)</span>
                      <span>E-D pairs: 4 (from positions 1-2, 2-3, 2-4, 2-5)</span>
                      <span>D-D pairs: 0 (only one D in column)</span>
                    </div>
                    <p className="calc-note">Total pairs: C(5,2) = 5×4/2 = 10 pairs</p>
                  </div>
                </div>
              </div>

              <div className="arrow-right">→</div>

              <div className="count-matrix-example">
                <h5>Accumulated Count Matrix A(i,j):</h5>
                <table className="mini-matrix-table">
                  <thead>
                    <tr><th></th><th>A</th><th>D</th><th>E</th><th>...</th></tr>
                  </thead>
                  <tbody>
                    <tr><th>A</th><td className="high">180</td><td>3</td><td>2</td><td>...</td></tr>
                    <tr><th>D</th><td>3</td><td className="high">150</td><td>8</td><td>...</td></tr>
                    <tr><th>E</th><td>2</td><td>8</td><td className="high">175</td><td>...</td></tr>
                    <tr><th>...</th><td>...</td><td>...</td><td>...</td><td>...</td></tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="formula-highlight">
              <strong>Observation:</strong> Diagonal values (A-A, D-D, E-E) are much higher because at 85%+ identity, most amino acids remain unchanged. Off-diagonal values capture the rare mutations.
            </div>
          </div>
        );

      case 2:
        return (
          <div className="visual-container">
            <h4>PAM-1: Mutation Probabilities for ONE Evolutionary Time Unit</h4>
            <p className="visual-subtitle">PAM-1 represents 1 PAU (Point Accepted Mutation per 100 amino acids) - a very short evolutionary distance</p>
            
            <div className="probability-calc">
              <div className="formula-box">
                <code>M(i→j) = Count(i→j) / Total mutations from i</code>
              </div>

              <div className="calc-example">
                <h5>Example: Probabilities for Alanine (A) in PAM-1</h5>
                <div className="calc-steps">
                  <div className="calc-row">
                    <span className="calc-label">A → A:</span>
                    <span className="calc-formula">9867 / 10000 = 98.67%</span>
                  </div>
                  <div className="calc-row">
                    <span className="calc-label">A → R:</span>
                    <span className="calc-formula">2 / 10000 = 0.02%</span>
                  </div>
                  <div className="calc-row">
                    <span className="calc-label">A → N:</span>
                    <span className="calc-formula">9 / 10000 = 0.09%</span>
                  </div>
                  <div className="calc-row">
                    <span className="calc-label">A → D:</span>
                    <span className="calc-formula">10 / 10000 = 0.10%</span>
                  </div>
                </div>
              </div>

              <div className="pam1-matrix-display">
                <h5>PAM-1 Matrix (values × 10,000 for precision):</h5>
                <table className="score-matrix">
                  <thead>
                    <tr><th></th><th>A</th><th>R</th><th>N</th><th>D</th><th>C</th></tr>
                  </thead>
                  <tbody>
                    <tr><th>A</th><td className="high-prob">9867</td><td>2</td><td>9</td><td>10</td><td>3</td></tr>
                    <tr><th>R</th><td>1</td><td className="high-prob">9913</td><td>4</td><td>6</td><td>0</td></tr>
                    <tr><th>N</th><td>4</td><td>2</td><td className="high-prob">9822</td><td>36</td><td>1</td></tr>
                    <tr><th>D</th><td>6</td><td>2</td><td>42</td><td className="high-prob">9859</td><td>0</td></tr>
                    <tr><th>C</th><td>1</td><td>0</td><td>1</td><td>0</td><td className="high-prob">9973</td></tr>
                  </tbody>
                </table>
                <p className="matrix-note">Each row sums to 10,000 (representing 100%)</p>
              </div>
            </div>

            <div className="insight-box">
              <h5>Critical Understanding of the 98% Value:</h5>
              <ul>
                <li><strong>98% does NOT mean "A always stays A"</strong> - it means A has 98% probability of remaining A after ONE PAU of evolutionary time</li>
                <li><strong>1 PAU is a very short distance</strong> - defined as 1 accepted mutation per 100 amino acid positions</li>
                <li><strong>Over longer evolution</strong>, the probability of A→A decreases significantly (see next step)</li>
              </ul>
            </div>

            <div className="insight-box warning">
              <h5>Why the Diagonal is High in PAM-1:</h5>
              <p>At 1 PAU, most amino acids have NOT yet mutated. The 98.67% for A→A means: "If we look at Alanine after 1 PAU of evolution, there is a 98.67% chance it is still Alanine." This probability decreases as we apply matrix exponentiation for longer evolutionary distances.</p>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="visual-container">
            <h4>Matrix Exponentiation: PAM-k = (PAM-1)^k</h4>
            <p className="visual-subtitle">To model longer evolutionary distances, multiply PAM-1 by itself k times using matrix multiplication</p>
            
            <div className="matrix-power-visual">
              <div className="power-equation">
                <div className="matrix-symbol">PAM-1</div>
                <div className="power-op">×</div>
                <div className="matrix-symbol">PAM-1</div>
                <div className="equals">=</div>
                <div className="matrix-symbol result">PAM-2</div>
              </div>
              
              <div className="power-equation">
                <div className="matrix-symbol">PAM-1</div>
                <div className="power-op">^250</div>
                <div className="equals">=</div>
                <div className="matrix-symbol result">PAM-250</div>
              </div>
            </div>

            <div className="insight-box">
              <h5>How Diagonal Values Change with k:</h5>
              <ul>
                <li><strong>PAM-1:</strong> A→A ≈ 98.67% (very high - most A's unchanged after 1 PAU)</li>
                <li><strong>PAM-30:</strong> A→A ≈ 66% (after 30 PAU, only 2/3 of A's remain)</li>
                <li><strong>PAM-120:</strong> A→A ≈ 38% (approaching 50% divergence)</li>
                <li><strong>PAM-250:</strong> A→A ≈ 13% (highly divergent - most A's have mutated)</li>
              </ul>
              <p>This demonstrates why the 98% is only valid for 1 PAU - it drops dramatically over evolutionary time.</p>
            </div>

            <div className="pam-scale">
              <h5>PAM Scale - Evolutionary Distance Interpretation:</h5>
              <div className="scale-bar">
                <div className="scale-point" style={{left: '5%'}}>
                  <div className="scale-marker"></div>
                  <div className="scale-label">
                    <strong>PAM-1</strong>
                    <span>1% divergent</span>
                    <span className="use">Very similar</span>
                  </div>
                </div>
                <div className="scale-point" style={{left: '35%'}}>
                  <div className="scale-marker"></div>
                  <div className="scale-label">
                    <strong>PAM-120</strong>
                    <span>~50% divergent</span>
                    <span className="use">Moderately related</span>
                  </div>
                </div>
                <div className="scale-point highlight" style={{left: '70%'}}>
                  <div className="scale-marker"></div>
                  <div className="scale-label">
                    <strong>PAM-250</strong>
                    <span>~80% divergent</span>
                    <span className="use">Distant homologs</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="insight-box warning">
              <h5>Important Convention:</h5>
              <p><strong>Higher PAM number = MORE divergent sequences</strong></p>
              <p>PAM-250 is commonly used for finding distant evolutionary relationships because it models sequences that have undergone extensive mutation.</p>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="visual-container">
            <h4>Converting Probabilities to Log-Odds Alignment Scores</h4>
            <p className="visual-subtitle">For each cell (i,j), compute log(OBSERVED / EXPECTED) - the same fundamental formula used by BLOSUM</p>
            
            <div className="log-odds-calc">
              <div className="formula-box large">
                <code>Score(i,j) = log( OBSERVED / EXPECTED ) = log( M(i,j) / f(j) )</code>
              </div>
              
              <div className="formula-explanation">
                <div className="formula-part">
                  <strong>OBSERVED = M(i,j)</strong> = Probability that amino acid i mutates to j (from PAM-k matrix)
                </div>
                <div className="formula-part">
                  <strong>EXPECTED = f(j)</strong> = Background frequency of amino acid j (random chance)
                </div>
                <div className="formula-part">
                  <strong>Scaling:</strong> PAM uses 10 × log₁₀, BLOSUM uses 2 × log₂
                </div>
              </div>
            </div>

            <div className="detailed-calc-section">
              <h5>Detailed Calculation Example:</h5>
              <div className="calc-steps">
                <div className="calc-row">
                  <span className="calc-label">Given:</span>
                  <span className="calc-formula">M(A,A) in PAM-250 = 0.13, f(A) = 0.087</span>
                </div>
                <div className="calc-row">
                  <span className="calc-label">Ratio:</span>
                  <span className="calc-formula">0.13 / 0.087 = 1.49 (greater than 1 → favorable)</span>
                </div>
                <div className="calc-row">
                  <span className="calc-label">Log-odds:</span>
                  <span className="calc-formula">10 × log₁₀(1.49) = 10 × 0.17 ≈ +2</span>
                </div>
              </div>
            </div>

            <div className="log-odds-interpretation">
              <h5>Score Interpretation - What Each Value Means:</h5>
              <div className="interpretation-grid">
                <div className="interp-item positive">
                  <span className="score-ex">+6</span>
                  <span className="meaning">Ratio greater than 1</span>
                  <span className="desc">Substitution is FAVORED by evolution - occurs more than random chance</span>
                </div>
                <div className="interp-item zero">
                  <span className="score-ex">0</span>
                  <span className="meaning">Ratio ≈ 1</span>
                  <span className="desc">Neutral - substitution occurs at the same rate as random chance</span>
                </div>
                <div className="interp-item negative">
                  <span className="score-ex">-4</span>
                  <span className="meaning">Ratio less than 1</span>
                  <span className="desc">DISFAVORED - occurs less than random, likely deleterious</span>
                </div>
              </div>
            </div>

            <div className="final-matrix-example">
              <h5>Final PAM-250 Matrix (subset showing log-odds scores):</h5>
              <table className="score-matrix final">
                <thead>
                  <tr><th></th><th>A</th><th>R</th><th>N</th><th>D</th><th>C</th></tr>
                </thead>
                <tbody>
                  <tr><th>A</th><td className="positive">+2</td><td className="negative">-2</td><td className="zero">0</td><td className="zero">0</td><td className="negative">-2</td></tr>
                  <tr><th>R</th><td className="negative">-2</td><td className="positive">+6</td><td className="zero">0</td><td className="negative">-1</td><td className="negative">-4</td></tr>
                  <tr><th>N</th><td className="zero">0</td><td className="zero">0</td><td className="positive">+2</td><td className="positive">+2</td><td className="negative">-4</td></tr>
                  <tr><th>D</th><td className="zero">0</td><td className="negative">-1</td><td className="positive">+2</td><td className="positive">+4</td><td className="negative">-5</td></tr>
                  <tr><th>C</th><td className="negative">-2</td><td className="negative">-4</td><td className="negative">-4</td><td className="negative">-5</td><td className="positive">+12</td></tr>
                </tbody>
              </table>
            </div>

            <div className="insight-box">
              <h5>Reading the Final Matrix:</h5>
              <ul>
                <li><strong>C-C = +12:</strong> Cysteine is highly conserved (forms disulfide bonds), OBSERVED much greater than EXPECTED</li>
                <li><strong>D-N = +2:</strong> Aspartate and Asparagine have similar properties, substitution is favorable</li>
                <li><strong>C-D = -5:</strong> Very different amino acids, substitution rarely accepted by evolution</li>
              </ul>
            </div>

            <div className="insight-box warning">
              <h5>Key Insight: Both PAM and BLOSUM Use the Same Core Formula</h5>
              <p><strong>Score = log(OBSERVED / EXPECTED)</strong></p>
              <p>The ONLY difference between PAM and BLOSUM is HOW they calculate observed and expected values:</p>
              <ul>
                <li><strong>PAM:</strong> OBSERVED = mutation probability from evolutionary model (matrix exponentiation); EXPECTED = background amino acid frequency</li>
                <li><strong>BLOSUM:</strong> OBSERVED = actual pair frequency from blocks; EXPECTED = product of individual amino acid frequencies</li>
              </ul>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const renderBlosumVisual = () => {
    switch (blosumStep) {
      case 0:
        return (
          <div className="visual-container">
            <h4>BLOCKS Database: Conserved Motifs as Local Ungapped Alignments</h4>
            <p className="visual-subtitle">BLOSUM uses conserved "blocks" which are essentially MOTIFS - conserved functional sequence patterns found across diverse protein families</p>
            
            <div className="blocks-example">
              <div className="block-visual">
                <h5>Example Block/Motif: Conserved Kinase ATP-binding Domain</h5>
                <div className="block-sequences">
                  <div className="block-row">
                    <span className="block-name">Human:</span>
                    <span className="block-seq">G T G S F G</span>
                  </div>
                  <div className="block-row">
                    <span className="block-name">Mouse:</span>
                    <span className="block-seq">G T G S F G</span>
                  </div>
                  <div className="block-row">
                    <span className="block-name">Yeast:</span>
                    <span className="block-seq">G S G A F G</span>
                  </div>
                  <div className="block-row">
                    <span className="block-name">E.coli:</span>
                    <span className="block-seq">G T G A Y G</span>
                  </div>
                  <div className="block-row">
                    <span className="block-name">Plant:</span>
                    <span className="block-seq">G T G S F G</span>
                  </div>
                </div>
                <p className="block-note">No gaps allowed within blocks - these are ungapped local alignments</p>
              </div>
            </div>

            <div className="insight-box">
              <h5>Key Differences from PAM Data Source:</h5>
              <ul>
                <li><strong>Blocks are Motifs</strong> - conserved functional sequence patterns that appear across many protein families</li>
                <li><strong>Local alignments</strong> - only conserved functional regions are used, not entire protein sequences</li>
                <li><strong>Vast amount of data</strong> - thousands of protein families contribute blocks (vs. small PAM dataset)</li>
                <li><strong>No gaps</strong> - blocks are strictly ungapped regions</li>
                <li><strong>Diverse sequences</strong> - sequences can be distantly related (not limited to 85% identity like PAM)</li>
                <li><strong>Direct observation</strong> - substitution patterns are observed directly, not modeled through phylogenetic trees</li>
              </ul>
            </div>
          </div>
        );

      case 1:
        return (
          <div className="visual-container">
            <h4>Clustering Sequences by Percent Identity</h4>
            <p className="visual-subtitle">For BLOSUM-K, sequences sharing K% or more identity are grouped into clusters to prevent over-representation</p>
            
            <div className="clustering-example">
              <div className="before-clustering">
                <h5>Before Clustering (5 sequences in a block):</h5>
                <div className="sequence-list">
                  <div className="seq-item group-a">Seq1: GTGSFG <span className="identity">(reference)</span></div>
                  <div className="seq-item group-a">Seq2: GTGSFG <span className="identity">(100% to Seq1)</span></div>
                  <div className="seq-item group-a">Seq3: GTGAFG <span className="identity">(83% to Seq1, 83% to Seq2)</span></div>
                  <div className="seq-item group-b">Seq4: ASGAYG <span className="identity">(33% to others)</span></div>
                  <div className="seq-item group-b">Seq5: ASGAYG <span className="identity">(100% to Seq4)</span></div>
                </div>
              </div>
              
              <div className="arrow-down">↓ Apply K% clustering threshold (for BLOSUM-K)</div>
              
              <div className="after-clustering">
                <h5>After Clustering (sequences with K%+ identity to each other are grouped):</h5>
                <div className="cluster-boxes">
                  <div className="cluster-box">
                    <div className="cluster-header">Cluster A</div>
                    <div className="cluster-members">Seq1, Seq2, Seq3 (all share K%+ identity with each other)</div>
                    <div className="cluster-weight">Weight = 1 (counts as ONE sequence)</div>
                  </div>
                  <div className="cluster-box">
                    <div className="cluster-header">Cluster B</div>
                    <div className="cluster-members">Seq4, Seq5 (share K%+ identity with each other)</div>
                    <div className="cluster-weight">Weight = 1 (counts as ONE sequence)</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="blosum-scale">
              <h5>BLOSUM-K: The K Value Determines the Matrix</h5>
              <div className="scale-items">
                <div className="scale-item">
                  <strong>BLOSUM-80</strong>
                  <span>K=80% clustering threshold</span>
                  <span className="use">For comparing similar sequences</span>
                </div>
                <div className="scale-item highlight">
                  <strong>BLOSUM-62</strong>
                  <span>K=62% clustering threshold</span>
                  <span className="use">General purpose (BLAST default)</span>
                </div>
                <div className="scale-item">
                  <strong>BLOSUM-45</strong>
                  <span>K=45% clustering threshold</span>
                  <span className="use">For comparing divergent sequences</span>
                </div>
              </div>
            </div>

            <div className="insight-box warning">
              <h5>Critical: BLOSUM Numbers are OPPOSITE to PAM</h5>
              <p><strong>Lower BLOSUM-K = designed for MORE divergent sequence comparisons</strong></p>
              <p>BLOSUM-45 is for finding distant relationships; BLOSUM-80 is for similar sequences.</p>
              <p>This is because lower clustering thresholds allow more diverse sequences to contribute to the matrix.</p>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="visual-container">
            <h4>Counting All Amino Acid Pairs in Every Column</h4>
            <p className="visual-subtitle">For each column, enumerate ALL possible pairs of amino acids from the sequences (or clusters)</p>
            
            <div className="pair-counting-detailed">
              <div className="column-example-detailed">
                <h5>Example: Position 4 has amino acids [S, S, A, A, S] across 5 sequences</h5>
                <div className="column-visual-large">
                  <span className="col-aa-large">S</span>
                  <span className="col-aa-large">S</span>
                  <span className="col-aa-large highlight">A</span>
                  <span className="col-aa-large highlight">A</span>
                  <span className="col-aa-large">S</span>
                </div>
              </div>
              
              <div className="pair-calculation">
                <h5>Step-by-step Pair Enumeration (C(5,2) = 10 total pairs):</h5>
                <div className="pairs-table">
                  <div className="pair-row">
                    <span className="pair-type">S-S pairs:</span>
                    <span className="pair-count">3</span>
                    <span className="pair-calc">Pairs (1,2), (1,5), (2,5) - positions where both have S</span>
                  </div>
                  <div className="pair-row">
                    <span className="pair-type">A-A pairs:</span>
                    <span className="pair-count">1</span>
                    <span className="pair-calc">Pair (3,4) - the only two positions with A</span>
                  </div>
                  <div className="pair-row">
                    <span className="pair-type">S-A pairs:</span>
                    <span className="pair-count">6</span>
                    <span className="pair-calc">Pairs (1,3), (1,4), (2,3), (2,4), (5,3), (5,4)</span>
                  </div>
                  <div className="pair-row total">
                    <span className="pair-type">Total:</span>
                    <span className="pair-count">10</span>
                    <span className="pair-calc">Verify: 3 + 1 + 6 = 10 = C(5,2)</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="frequency-calc">
              <h5>Convert Counts to Observed Frequencies q(i,j):</h5>
              <div className="freq-items">
                <div className="freq-item">
                  <span className="freq-label">q(S,S) =</span>
                  <span className="freq-value">3 / 10 = 0.30 (30% of pairs)</span>
                </div>
                <div className="freq-item">
                  <span className="freq-label">q(A,A) =</span>
                  <span className="freq-value">1 / 10 = 0.10 (10% of pairs)</span>
                </div>
                <div className="freq-item">
                  <span className="freq-label">q(S,A) =</span>
                  <span className="freq-value">6 / 10 = 0.60 (60% of pairs)</span>
                </div>
              </div>
              <p className="calc-note">These are summed across ALL columns in ALL blocks to get the final q(i,j) values</p>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="visual-container">
            <h4>Observed vs Expected: The Core of BLOSUM Scoring</h4>
            <p className="visual-subtitle">Compare actual pair frequencies to what we would expect if amino acids paired randomly</p>
            
            <div className="obs-vs-exp">
              <div className="frequency-section">
                <h5>First, Calculate Individual Amino Acid Frequencies:</h5>
                <div className="aa-freqs">
                  <span>p(S) = 3/5 = 0.60 (S appears in 3 of 5 sequences)</span>
                  <span>p(A) = 2/5 = 0.40 (A appears in 2 of 5 sequences)</span>
                </div>
              </div>

              <div className="comparison-calc">
                <div className="calc-column observed">
                  <h5>OBSERVED Frequency q(i,j)</h5>
                  <p className="calc-desc">What we actually see in the data</p>
                  <div className="calc-values">
                    <div className="calc-item">q(S,S) = 0.30</div>
                    <div className="calc-item">q(A,A) = 0.10</div>
                    <div className="calc-item">q(S,A) = 0.60</div>
                  </div>
                </div>
                
                <div className="vs-divider">vs</div>
                
                <div className="calc-column expected">
                  <h5>EXPECTED Frequency e(i,j)</h5>
                  <p className="calc-desc">If pairing were completely random</p>
                  <div className="calc-values">
                    <div className="calc-item">e(S,S) = p(S)² = 0.6² = 0.36</div>
                    <div className="calc-item">e(A,A) = p(A)² = 0.4² = 0.16</div>
                    <div className="calc-item">e(S,A) = 2×p(S)×p(A) = 2×0.6×0.4 = 0.48</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="ratio-analysis">
              <h5>The Key Ratio: q(i,j) / e(i,j) for Each Pair</h5>
              <div className="ratio-items">
                <div className="ratio-item">
                  <span className="ratio-pair">S-S:</span>
                  <span className="ratio-value">0.30 / 0.36 = 0.83 (less than 1)</span>
                  <span className="ratio-meaning negative">Occurs LESS than random - conservation pressure not strong</span>
                </div>
                <div className="ratio-item">
                  <span className="ratio-pair">A-A:</span>
                  <span className="ratio-value">0.10 / 0.16 = 0.63 (less than 1)</span>
                  <span className="ratio-meaning negative">Occurs LESS than random - A substitutes frequently</span>
                </div>
                <div className="ratio-item">
                  <span className="ratio-pair">S-A:</span>
                  <span className="ratio-value">0.60 / 0.48 = 1.25 (greater than 1)</span>
                  <span className="ratio-meaning positive">Occurs MORE than random - favorable substitution!</span>
                </div>
              </div>
            </div>

            <div className="insight-box">
              <h5>Understanding the Ratio:</h5>
              <ul>
                <li><strong>Ratio &gt; 1:</strong> Pair occurs more often than random chance - evolutionarily favorable</li>
                <li><strong>Ratio = 1:</strong> Pair occurs at exactly the random rate - neutral</li>
                <li><strong>Ratio &lt; 1:</strong> Pair occurs less than random - evolutionarily disfavored (often deleterious)</li>
              </ul>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="visual-container">
            <h4>Final BLOSUM Score: Log-Odds for Every Matrix Cell</h4>
            <p className="visual-subtitle">For EVERY cell (i,j), calculate the log of the observed/expected ratio</p>
            
            <div className="blosum-formula">
              <div className="formula-box large">
                <code>Score(i,j) = round( 2 × log₂( q(i,j) / e(i,j) ) )</code>
              </div>
              
              <div className="formula-explanation">
                <div className="formula-part">
                  <strong>q(i,j)</strong> = Observed frequency of pair (i,j) in the data
                </div>
                <div className="formula-part">
                  <strong>e(i,j)</strong> = Expected frequency if pairing were random
                </div>
                <div className="formula-part">
                  <strong>2 ×</strong> = Scaling factor (BLOSUM uses base-2 log scaled by 2)
                </div>
              </div>
            </div>

            <div className="score-calculation">
              <h5>Detailed Score Calculations for Common Pairs:</h5>
              <div className="calc-examples">
                <div className="calc-ex">
                  <span className="calc-pair">Cysteine (C-C):</span>
                  <span className="calc-work">q=0.089, e=0.010, ratio=8.9 → 2 × log₂(8.9) = 2 × 3.15 ≈ <strong>+9</strong></span>
                  <span className="calc-note">Very conserved - forms disulfide bonds</span>
                </div>
                <div className="calc-ex">
                  <span className="calc-pair">Alanine (A-A):</span>
                  <span className="calc-work">q=0.074, e=0.046, ratio=1.61 → 2 × log₂(1.61) = 2 × 0.69 ≈ <strong>+4</strong></span>
                  <span className="calc-note">Moderately conserved</span>
                </div>
                <div className="calc-ex">
                  <span className="calc-pair">Asp-Asn (D-N):</span>
                  <span className="calc-work">q=0.019, e=0.012, ratio=1.58 → 2 × log₂(1.58) = 2 × 0.66 ≈ <strong>+1</strong></span>
                  <span className="calc-note">Similar properties - acceptable substitution</span>
                </div>
                <div className="calc-ex">
                  <span className="calc-pair">Cys-Arg (C-R):</span>
                  <span className="calc-work">q=0.001, e=0.005, ratio=0.2 → 2 × log₂(0.2) = 2 × (-2.32) ≈ <strong>-3</strong></span>
                  <span className="calc-note">Very different - rarely substituted</span>
                </div>
              </div>
            </div>

            <div className="final-blosum-matrix">
              <h5>BLOSUM-62 Matrix (subset):</h5>
              <table className="score-matrix final">
                <thead>
                  <tr><th></th><th>A</th><th>R</th><th>N</th><th>D</th><th>C</th></tr>
                </thead>
                <tbody>
                  <tr><th>A</th><td className="positive">+4</td><td className="negative">-1</td><td className="negative">-2</td><td className="negative">-2</td><td className="zero">0</td></tr>
                  <tr><th>R</th><td className="negative">-1</td><td className="positive">+5</td><td className="zero">0</td><td className="negative">-2</td><td className="negative">-3</td></tr>
                  <tr><th>N</th><td className="negative">-2</td><td className="zero">0</td><td className="positive">+6</td><td className="positive">+1</td><td className="negative">-3</td></tr>
                  <tr><th>D</th><td className="negative">-2</td><td className="negative">-2</td><td className="positive">+1</td><td className="positive">+6</td><td className="negative">-3</td></tr>
                  <tr><th>C</th><td className="zero">0</td><td className="negative">-3</td><td className="negative">-3</td><td className="negative">-3</td><td className="positive">+9</td></tr>
                </tbody>
              </table>
            </div>

            <div className="insight-box">
              <h5>Reading BLOSUM-62 Scores:</h5>
              <ul>
                <li><strong>Positive score:</strong> log(q/e) &gt; 0 means q &gt; e → substitution is evolutionarily FAVORABLE</li>
                <li><strong>Zero score:</strong> log(q/e) ≈ 0 means q ≈ e → substitution is NEUTRAL (random rate)</li>
                <li><strong>Negative score:</strong> log(q/e) &lt; 0 means q &lt; e → substitution is DISFAVORED (likely harmful)</li>
                <li><strong>C-C = +9:</strong> Highest positive score because cysteine is critical for protein structure (disulfide bonds)</li>
                <li><strong>D-N = +1:</strong> Small positive because both are small, polar amino acids with similar properties</li>
              </ul>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="scoring-matrix-page">
      <header className="page-header">
        <div className="header-content">
          <h1>Scoring Matrix Computation</h1>
          <p className="subtitle">Understanding how PAM and BLOSUM substitution matrices are derived from sequence data</p>
          <button onClick={onNavigateToHomepage} className="back-button">
            ← Back to Homepage
          </button>
        </div>
      </header>

      <main className="page-main">
        {/* Tab Navigation */}
        <div className="tab-navigation">
          <button 
            className={`tab-button ${activeTab === 'pam' ? 'active' : ''}`}
            onClick={() => { setActiveTab('pam'); setPamStep(0); }}
          >
            <span className="tab-icon">PAM</span>
          </button>
          <button 
            className={`tab-button ${activeTab === 'blosum' ? 'active' : ''}`}
            onClick={() => { setActiveTab('blosum'); setBlosumStep(0); }}
          >
            <span className="tab-icon">BLOSUM</span>
          </button>
        </div>

        {/* PAM Section */}
        {activeTab === 'pam' && (
          <div className="matrix-section">
            <div className="section-intro">
              <h2>PAM (Point Accepted Mutation) Matrices</h2>
              <p>
                Developed by <strong>Margaret Dayhoff in 1978</strong>. PAM matrices model protein evolution 
                using closely related sequences with at least 85% identity. The fundamental insight: 
                <strong> PAM-k = (PAM-1)<sup>k</sup></strong> - higher PAM matrices are derived by 
                matrix exponentiation, not by examining more divergent sequences directly.
              </p>
            </div>

            {/* Step Progress */}
            <div className="step-progress">
              {pamSteps.map((_step, index) => (
                <div 
                  key={index}
                  className={`progress-step ${index === pamStep ? 'active' : ''} ${index < pamStep ? 'completed' : ''}`}
                  onClick={() => setPamStep(index)}
                >
                  <div className="step-number">{index + 1}</div>
                </div>
              ))}
            </div>

            {/* Current Step Content */}
            <div className="step-content">
              <div className="step-title-row">
                <h3>{pamSteps[pamStep].title}</h3>
              </div>
              <div className="step-description">
                <p>{pamSteps[pamStep].description}</p>
              </div>
              <div className="step-visual">
                {renderPamVisual()}
              </div>
            </div>

            {/* Step Navigation */}
            <div className="step-navigation">
              <button 
                className="nav-button prev"
                onClick={() => setPamStep(Math.max(0, pamStep - 1))}
                disabled={pamStep === 0}
              >
                ← Previous
              </button>
              <span className="step-indicator">{pamStep + 1} / {pamSteps.length}</span>
              <button 
                className="nav-button next"
                onClick={() => setPamStep(Math.min(pamSteps.length - 1, pamStep + 1))}
                disabled={pamStep === pamSteps.length - 1}
              >
                Next →
              </button>
            </div>
          </div>
        )}

        {/* BLOSUM Section */}
        {activeTab === 'blosum' && (
          <div className="matrix-section">
            <div className="section-intro">
              <h2>BLOSUM (BLOcks SUbstitution Matrix)</h2>
              <p>
                Developed by <strong>Henikoff and Henikoff in 1992</strong>. BLOSUM matrices are computed directly 
                from conserved protein blocks in the BLOCKS database. Unlike PAM, no evolutionary model or phylogenetic 
                tree is needed - substitution frequencies are observed directly from aligned sequences.
                The key formula for every cell: <strong>Score(i,j) = 2 × log₂(observed / expected)</strong>
              </p>
            </div>

            {/* Step Progress */}
            <div className="step-progress">
              {blosumSteps.map((_step, index) => (
                <div 
                  key={index}
                  className={`progress-step ${index === blosumStep ? 'active' : ''} ${index < blosumStep ? 'completed' : ''}`}
                  onClick={() => setBlosumStep(index)}
                >
                  <div className="step-number">{index + 1}</div>
                </div>
              ))}
            </div>

            {/* Current Step Content */}
            <div className="step-content">
              <div className="step-title-row">
                <h3>{blosumSteps[blosumStep].title}</h3>
              </div>
              <div className="step-description">
                <p>{blosumSteps[blosumStep].description}</p>
              </div>
              <div className="step-visual">
                {renderBlosumVisual()}
              </div>
            </div>

            {/* Step Navigation */}
            <div className="step-navigation">
              <button 
                className="nav-button prev"
                onClick={() => setBlosumStep(Math.max(0, blosumStep - 1))}
                disabled={blosumStep === 0}
              >
                ← Previous
              </button>
              <span className="step-indicator">{blosumStep + 1} / {blosumSteps.length}</span>
              <button 
                className="nav-button next"
                onClick={() => setBlosumStep(Math.min(blosumSteps.length - 1, blosumStep + 1))}
                disabled={blosumStep === blosumSteps.length - 1}
              >
                Next →
              </button>
            </div>
          </div>
        )}

        {/* Comparison Section */}
        <div className="comparison-section">
          <h2>PAM vs BLOSUM: Key Differences</h2>
          
          <div className="common-formula-box">
            <h3>The Common Foundation: Both Use the Same Core Formula</h3>
            <div className="formula-box large">
              <code>Score(i,j) = log( OBSERVED / EXPECTED )</code>
            </div>
            <p>The difference lies ONLY in how OBSERVED and EXPECTED are calculated:</p>
            <div className="formula-comparison">
              <div className="formula-side pam-side">
                <h4>PAM</h4>
                <p><strong>OBSERVED:</strong> M(i,j) from evolutionary model (matrix exponentiation)</p>
                <p><strong>EXPECTED:</strong> f(j) = background frequency of amino acid j</p>
              </div>
              <div className="formula-side blosum-side">
                <h4>BLOSUM</h4>
                <p><strong>OBSERVED:</strong> q(i,j) = actual pair frequency from blocks/motifs</p>
                <p><strong>EXPECTED:</strong> e(i,j) = p(i) × p(j) or 2×p(i)×p(j)</p>
              </div>
            </div>
          </div>

          <div className="comparison-table">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Aspect</th>
                  <th>PAM</th>
                  <th>BLOSUM</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>1</td>
                  <td><strong>Alignment Type</strong></td>
                  <td>Built from <span className="highlight-text">GLOBAL</span> alignments of entire sequences</td>
                  <td>Built from <span className="highlight-text">LOCAL</span> ungapped alignments (blocks/motifs)</td>
                </tr>
                <tr>
                  <td>2</td>
                  <td><strong>Amount of Data</strong></td>
                  <td><span className="highlight-text">Small</span> dataset (85% identity requirement limits data)</td>
                  <td><span className="highlight-text">Vast</span> dataset (thousands of protein families)</td>
                </tr>
                <tr>
                  <td>3</td>
                  <td><strong>How OBSERVED is Calculated</strong></td>
                  <td>Mutation probability from <span className="highlight-text">evolutionary model</span> (PAM-1 raised to power k)</td>
                  <td><span className="highlight-text">Direct counting</span> of amino acid pairs from blocks</td>
                </tr>
                <tr>
                  <td>4</td>
                  <td><strong>How EXPECTED is Calculated</strong></td>
                  <td>Background frequency f(j) of target amino acid</td>
                  <td>Product of individual frequencies: p(i) × p(j)</td>
                </tr>
                <tr>
                  <td>5</td>
                  <td><strong>Number Convention</strong></td>
                  <td><span className="highlight-text warning">Higher PAM = MORE divergent</span> (PAM-250 for distant)</td>
                  <td><span className="highlight-text warning">Lower BLOSUM = MORE divergent</span> (BLOSUM-45 for distant)</td>
                </tr>
                <tr>
                  <td>6</td>
                  <td><strong>For Distant Homologs</strong></td>
                  <td>Use higher numbers: PAM-200, PAM-250</td>
                  <td>Use lower numbers: BLOSUM-45, BLOSUM-50</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="quick-reference">
            <h3>Quick Reference Guide</h3>
            <div className="reference-cards">
              <div className="ref-card">
                <h4>For Similar Sequences</h4>
                <div className="ref-values">
                  <span className="pam-value">PAM-40, PAM-80</span>
                  <span className="blosum-value">BLOSUM-80, BLOSUM-90</span>
                </div>
              </div>
              <div className="ref-card">
                <h4>For Distant Sequences</h4>
                <div className="ref-values">
                  <span className="pam-value">PAM-200, PAM-250</span>
                  <span className="blosum-value">BLOSUM-45, BLOSUM-50</span>
                </div>
              </div>
              <div className="ref-card highlight">
                <h4>Default Choice (BLAST)</h4>
                <div className="ref-values">
                  <span className="blosum-value">BLOSUM-62</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="page-footer">
        <p>Scoring Matrix Computation - Educational Visualization</p>
      </footer>
    </div>
  );
};

export default ScoringMatrix;
