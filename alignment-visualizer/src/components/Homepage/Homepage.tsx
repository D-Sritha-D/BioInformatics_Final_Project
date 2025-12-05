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
}

const Homepage: React.FC<HomepageProps> = ({ onNavigateToVisualizer, onNavigateToScoringMatrix, onNavigateToSuffixTree }) => {
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
    description: 'Predict secondary or tertiary structures from amino-acid sequences using classical or computational methods.',
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
    icon: '🌳'
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
    // Implement navigation to concept detail page for others
  };

  return (
    <div className="homepage">
      {/* Navigation Bar */}
      <nav className="navbar">
        <div className="nav-container">
          <div className="nav-logo">Bio Insights</div>
          <div className="nav-links">
            <a href="#" className="nav-link">Homepage</a>
            <a href="#" className="nav-link">About</a>
            <button className="nav-menu-button" aria-label="Menu">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
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
    </div>
  );
};

export default Homepage;

