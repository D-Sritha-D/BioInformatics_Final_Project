import React from 'react';
import './Homepage.css';

interface ConceptCard {
  id: string;
  title: string;
  description: string;
  icon: string;
}

interface HomepageProps {
  onNavigateToVisualizer?: () => void;
  onNavigateToScoringMatrix?: () => void;
  onNavigateToSuffixTree?: () => void;
  onNavigateToPhylogeny?: () => void;
  onNavigateToDistanceMatrix?: () => void;
  onNavigateToProteinStructure?: () => void;
}

const Homepage: React.FC<HomepageProps> = ({ onNavigateToVisualizer, onNavigateToScoringMatrix, onNavigateToSuffixTree, onNavigateToPhylogeny, onNavigateToDistanceMatrix, onNavigateToProteinStructure }) => {
  const concepts: ConceptCard[] = [
    {
    id: 'global-alignment',
    title: 'Sequence Alignment',
    description: 'Compare DNA or protein sequences to identify similarity, conserved regions, and evolutionary relationships.',
    icon: '🧬'
    },
    {
    id: 'protein-folding',
    title: 'Protein Structure Prediction',
    description: 'Explore genetic algorithms and hill climbing to optimize folding-related computations.',
    icon: '🔗'
    },
    {
    id: 'scoring-matrix',
    title: 'Scoring Matrix Computation',
    description: 'Evaluate sequence similarity using substitution matrices like PAM and BLOSUM to guide accurate alignments.',
    icon: '📊'
    },
    {
    id: 'suffix-tree',
    title: 'Suffix Tree and Suffix Array',
    description: 'Efficient data structures for fast pattern matching, substring searches, and genome indexing applications.',
    icon: '🌲'
    },
    {
    id: 'phylogeny-tree',
    title: 'Phylogenetic Trees',
    description: 'Visualize evolutionary relationships between species using tree structures built from sequence data.',
    icon: '🌳'
    },
    {
    id: 'distance-matrix',
    title: 'Distance Matrix & UPGMA',
    description: 'Learn hierarchical clustering with UPGMA algorithm to build phylogenetic trees from distance matrices.',
    icon: '📐'
    }
  ];

  const handleLearnMore = (conceptId: string) => {
    console.log('Learn more about:', conceptId);
    // Navigate to visualizer for alignment-related concepts
    if ((conceptId === 'global-alignment' || conceptId === 'banded-alignment') && onNavigateToVisualizer) {
      onNavigateToVisualizer();
    }
    // Navigate to scoring matrix page
    if (conceptId === 'scoring-matrix' && onNavigateToScoringMatrix) {
      onNavigateToScoringMatrix();
    }
    // Navigate to suffix tree page
    if (conceptId === 'suffix-tree' && onNavigateToSuffixTree) {
      onNavigateToSuffixTree();
    }
    // Navigate to phylogeny tree page
    if (conceptId === 'phylogeny-tree' && onNavigateToPhylogeny) {
      onNavigateToPhylogeny();
    }
    // Navigate to distance matrix page
    if (conceptId === 'distance-matrix' && onNavigateToDistanceMatrix) {
      onNavigateToDistanceMatrix();
    }
    // Navigate to protein structure page
    if (conceptId === 'protein-folding' && onNavigateToProteinStructure) {
      onNavigateToProteinStructure();
    }
  };

  return (
    <div className="homepage">
      {/* Navigation Bar */}
      <nav className="navbar">
        <div className="nav-container">
          <div className="nav-logo">Bio Insights</div>
          <div className="nav-links">
            <a href="#" className="nav-link" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>Homepage</a>
            <a href="#about" className="nav-link">About</a>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">
            Bio Insights
          </h1>
          <p className="hero-subtitle">
            Interactive tool to understand, alignments, mutations and more!
          </p>
        </div>
      </section>

      {/* Key Concepts Section */}
      <section className="concepts-section">
        <div className="concepts-container">
          <h2 className="concepts-title">Explore Key Concepts</h2>
          <p className="concepts-subtitle">
            Dive into the fundamental algorithms of life
          </p>

          <div className="concepts-grid">
            {concepts.map((concept) => (
              <div key={concept.id} className="concept-card">
                <div className="concept-icon">{concept.icon}</div>
                <h3 className="concept-title">{concept.title}</h3>
                <p className="concept-description">{concept.description}</p>
                <button
                  className="learn-more-button"
                  onClick={() => handleLearnMore(concept.id)}
                >
                  Learn More
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="about-section">
        <div className="about-container">
          <h2 className="about-title">About Bio Insights</h2>
          <p className="about-description">
            This website is designed to make learning bioinformatics algorithms easy and intuitive through interactive visualizations. 
            Whether you're exploring sequence alignment, phylogenetic trees, or distance matrices, our tool provides step-by-step 
            visual explanations to help you understand these fundamental concepts.
          </p>
          <p className="about-credits">
            Developed by Masters students of Computer Science @ UF
          </p>
          <div className="contributors-grid">
            <a href="https://www.linkedin.com/in/mohan-veeraghanta-9b55a1201/" target="_blank" rel="noopener noreferrer" className="contributor-card">
              <div className="contributor-avatar">MV</div>
              <span className="contributor-name">Mohan Veeraghanta</span>
            </a>
            <a href="https://www.linkedin.com/in/durga-sritha-dongla/" target="_blank" rel="noopener noreferrer" className="contributor-card">
              <div className="contributor-avatar">SD</div>
              <span className="contributor-name">Sritha Dongla</span>
            </a>
            <a href="https://www.linkedin.com/in/pavansainalluri/" target="_blank" rel="noopener noreferrer" className="contributor-card">
              <div className="contributor-avatar">PN</div>
              <span className="contributor-name">Pavan Sai Nalluri</span>
            </a>
            <a href="https://www.linkedin.com/in/subodhbhyri/" target="_blank" rel="noopener noreferrer" className="contributor-card">
              <div className="contributor-avatar">SB</div>
              <span className="contributor-name">Subodh Bhyri</span>
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-container">
          <p className="copyright">&copy; {new Date().getFullYear()} Bio Insights. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Homepage;
