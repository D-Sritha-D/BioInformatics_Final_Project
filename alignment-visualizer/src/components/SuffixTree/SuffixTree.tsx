import React, { useState, useMemo, useCallback } from 'react';
import './SuffixTree.css';

interface SuffixTreeProps {
  onNavigateToHomepage: () => void;
}

interface TreeNode {
  id: string;
  label: string;
  children: TreeNode[];
  isLeaf: boolean;
  suffixIndex?: number;
}

interface BuildStep {
  stepNumber: number;
  suffix: string;
  suffixIndex: number;
  description: string;
  treeSnapshot: TreeNode;
}

const VALID_CHARS = new Set(['A', 'T', 'G', 'C']);
const MAX_LENGTH = 10;

const SuffixTree: React.FC<SuffixTreeProps> = ({ onNavigateToHomepage }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [showFinalTree, setShowFinalTree] = useState(true);
  const [inputSequence, setInputSequence] = useState('TGAGTGCGA');
  const [inputError, setInputError] = useState<string | null>(null);
  const [sequence, setSequence] = useState('TGAGTGCGA$');

  // Validate and handle input change
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase();
    setInputSequence(value);
    
    // Validate
    if (value.length === 0) {
      setInputError('Please enter a sequence');
      return;
    }
    
    if (value.length > MAX_LENGTH - 1) { // -1 because we add $
      setInputError(`Sequence must be at most ${MAX_LENGTH - 1} characters (excluding $)`);
      return;
    }
    
    const invalidChars = value.split('').filter(c => !VALID_CHARS.has(c));
    if (invalidChars.length > 0) {
      setInputError(`Invalid characters: ${[...new Set(invalidChars)].join(', ')}. Only A, T, G, C are allowed.`);
      return;
    }
    
    setInputError(null);
  }, []);

  // Apply the sequence
  const handleApplySequence = useCallback(() => {
    if (!inputError && inputSequence.length > 0) {
      setSequence(inputSequence + '$');
      setCurrentStep(0);
    }
  }, [inputSequence, inputError]);
  
  // Generate all suffixes
  const suffixes = useMemo(() => {
    const result: { suffix: string; index: number }[] = [];
    for (let i = sequence.length-1; i >= 0; i--) {
      result.push({
        suffix: sequence.substring(i),
        index: i
      });
    }
    return result;
  }, [sequence]);

  // Build suffix tree step by step
  const buildSteps = useMemo((): BuildStep[] => {
    const steps: BuildStep[] = [];
    
    // Helper to deep clone a tree node
    const cloneTree = (node: TreeNode): TreeNode => ({
      ...node,
      children: node.children.map(cloneTree)
    });

    // Helper to insert a suffix into the tree
    const insertSuffix = (root: TreeNode, suffix: string, suffixIndex: number): void => {
      let current = root;
      let remaining = suffix;
      
      while (remaining.length > 0) {
        // Find a child that shares a prefix
        let found = false;
        
        for (let i = 0; i < current.children.length; i++) {
          const child = current.children[i];
          const label = child.label;
          
          // Find common prefix length
          let commonLen = 0;
          while (commonLen < label.length && commonLen < remaining.length && 
                 label[commonLen] === remaining[commonLen]) {
            commonLen++;
          }
          
          if (commonLen > 0) {
            if (commonLen === label.length) {
              // Full match, continue down
              current = child;
              remaining = remaining.substring(commonLen);
              found = true;
              break;
            } else {
              // Partial match, need to split
              const splitNode: TreeNode = {
                id: `node-${Math.random().toString(36).substr(2, 9)}`,
                label: label.substring(0, commonLen),
                children: [],
                isLeaf: false
              };
              
              // Original child becomes child of split node
              child.label = label.substring(commonLen);
              splitNode.children.push(child);
              
              // New leaf for remaining suffix
              const newLeaf: TreeNode = {
                id: `leaf-${suffixIndex}`,
                label: remaining.substring(commonLen),
                children: [],
                isLeaf: true,
                suffixIndex: suffixIndex
              };
              splitNode.children.push(newLeaf);
              
              // Replace child with split node
              current.children[i] = splitNode;
              return;
            }
          }
        }
        
        if (!found) {
          // No matching prefix, add new leaf
          const newLeaf: TreeNode = {
            id: `leaf-${suffixIndex}`,
            label: remaining,
            children: [],
            isLeaf: true,
            suffixIndex: suffixIndex
          };
          current.children.push(newLeaf);
          return;
        }
      }
      
      // If we consumed the entire suffix, mark current as leaf
      current.isLeaf = true;
      current.suffixIndex = suffixIndex;
    };

    // Initial empty tree
    let tree: TreeNode = {
      id: 'root',
      label: '',
      children: [],
      isLeaf: false
    };

    // Build tree step by step
    for (let i = 0; i < suffixes.length; i++) {
      const { suffix, index } = suffixes[i];
      insertSuffix(tree, suffix, index);
      
      steps.push({
        stepNumber: i + 1,
        suffix: suffix,
        suffixIndex: index,
        description: `Insert suffix "${suffix}" (starting at position ${index})`,
        treeSnapshot: cloneTree(tree)
      });
    }

    return steps;
  }, [suffixes]);

  const finalTree = buildSteps.length > 0 ? buildSteps[buildSteps.length - 1].treeSnapshot : null;
  const currentTree = buildSteps[currentStep]?.treeSnapshot || null;

  // Render tree as ASCII-style vertical tree
  const renderTreeText = (node: TreeNode, prefix: string = '', isLast: boolean = true, isRoot: boolean = true): React.ReactNode[] => {
    const lines: React.ReactNode[] = [];
    
    if (isRoot) {
      lines.push(
        <div key="root" className="tree-line root-line">
          <span className="tree-node-box root-box">ROOT</span>
        </div>
      );
      
      node.children.forEach((child, idx) => {
        const childLines = renderTreeText(child, '', idx === node.children.length - 1, false);
        lines.push(...childLines);
      });
    } else {
      const connector = isLast ? '└── ' : '├── ';
      const extension = isLast ? '    ' : '│   ';
      
      lines.push(
        <div key={node.id} className="tree-line">
          <span className="tree-prefix">{prefix}{connector}</span>
          <span className={`tree-edge-label ${node.isLeaf ? 'leaf-label' : ''}`}>{node.label}</span>
          {node.isLeaf && (
            <span className="tree-suffix-idx">[{node.suffixIndex}]</span>
          )}
        </div>
      );
      
      node.children.forEach((child, idx) => {
        const childLines = renderTreeText(child, prefix + extension, idx === node.children.length - 1, false);
        lines.push(...childLines);
      });
    }
    
    return lines;
  };

  return (
    <div className="suffix-tree-page">
      <header className="page-header">
        <div className="header-content">
          <h1>Suffix Tree Search Method</h1>
          <p className="subtitle">Understanding suffix tree construction for efficient string searching</p>
          <button onClick={onNavigateToHomepage} className="back-button">
            ← Back to Homepage
          </button>
        </div>
      </header>

      <main className="page-main">
        {/* Introduction Section */}
        <section className="intro-section">
          <div className="intro-content">
            <h2>What is a Suffix Tree?</h2>
            <p>
              A <strong>suffix tree</strong> is a compressed trie (prefix tree) containing all suffixes of a given string. 
              It is a powerful data structure used for fast pattern matching, finding repeated substrings, and many 
              other string operations in O(m) time, where m is the pattern length.
            </p>
            <div className="key-properties">
              <h3>Key Properties:</h3>
              <ul>
                <li>Every suffix of the string is represented as a path from root to a leaf</li>
                <li>Each edge is labeled with a non-empty substring</li>
                <li>No two edges from the same node can have labels starting with the same character</li>
                <li>Each leaf node represents a suffix and stores its starting position</li>
                <li>The string is typically terminated with a unique character (like $) to ensure all suffixes end at leaves</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Input Section */}
        <section className="input-section">
          <h2>Enter Your Sequence</h2>
          <div className="input-container">
            <div className="input-wrapper">
              <input
                type="text"
                value={inputSequence}
                onChange={handleInputChange}
                placeholder="Enter DNA sequence (e.g., TGAGTGCGA)"
                className={`sequence-input ${inputError ? 'error' : ''}`}
                maxLength={MAX_LENGTH - 1}
              />
              <button 
                className="apply-btn"
                onClick={handleApplySequence}
                disabled={!!inputError || inputSequence.length === 0}
              >
                Build Tree
              </button>
            </div>
            {inputError && <p className="input-error">{inputError}</p>}
            <p className="input-hint">
              Valid characters: A, T, G, C | Maximum length: {MAX_LENGTH - 1} characters | The $ terminator will be added automatically
            </p>
          </div>
        </section>

        {/* Example Sequence Section */}
        <section className="example-section">
          <h2>Building Suffix Tree for: {sequence}</h2>
          <div className="sequence-display">
            <h3>Input Sequence:</h3>
            <div className="sequence-box">
              {sequence.split('').map((char, idx) => (
                <span key={idx} className={`sequence-char ${char === '$' ? 'terminator' : ''}`}>
                  <span className="char">{char}</span>
                  <span className="index">{idx}</span>
                </span>
              ))}
            </div>
            <p className="sequence-note">
              The $ symbol is a termination character that ensures every suffix ends at a unique leaf node.
            </p>
          </div>

          <div className="suffixes-list">
            <h3>All Suffixes:</h3>
            <div className="suffixes-grid">
              {suffixes.map(({ suffix, index }) => (
                <div 
                  key={index} 
                  className={`suffix-item ${currentStep === index ? 'current' : ''} ${currentStep > index ? 'completed' : ''}`}
                >
                  <span className="suffix-index-label">Position {index}:</span>
                  <span className="suffix-text">{suffix}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* View Toggle */}
        <section className="view-toggle-section">
          <div className="toggle-buttons">
            <button 
              className={`toggle-btn ${showFinalTree ? 'active' : ''}`}
              onClick={() => setShowFinalTree(true)}
            >
              Final Tree
            </button>
            <button 
              className={`toggle-btn ${!showFinalTree ? 'active' : ''}`}
              onClick={() => setShowFinalTree(false)}
            >
              Step-by-Step Construction
            </button>
          </div>
        </section>

        {/* Final Tree View */}
        {showFinalTree && finalTree && (
          <section className="final-tree-section">
            <h2>Complete Suffix Tree for "{sequence}"</h2>
            <div className="tree-visualization">
              <div className="tree-text-container">
                {renderTreeText(finalTree)}
              </div>
            </div>
            <div className="tree-legend">
              <h4>How to Read the Tree:</h4>
              <ul>
                <li><strong>ROOT</strong>: Starting point for all suffix traversals</li>
                <li><strong>Edge labels</strong>: Substrings on the path (shown in purple for internal nodes, green for leaves)</li>
                <li><strong>[n]</strong>: Leaf nodes showing suffix starting position</li>
                <li><strong>├──</strong> and <strong>└──</strong>: Tree branch connectors showing parent-child relationships</li>
                <li>To find a suffix: Start at ROOT, follow edges that match the suffix characters</li>
              </ul>
            </div>

            <div className="search-example">
              <h3>Example: Searching for a Pattern</h3>
              <div className="search-steps">
                <div className="search-step">
                  <span className="step-num">1</span>
                  <span className="step-text">Start at ROOT</span>
                </div>
                <div className="search-step">
                  <span className="step-num">2</span>
                  <span className="step-text">Follow the edge whose label starts with the first character of your pattern</span>
                </div>
                <div className="search-step">
                  <span className="step-num">3</span>
                  <span className="step-text">Continue matching characters along edge labels</span>
                </div>
                <div className="search-step">
                  <span className="step-num">4</span>
                  <span className="step-text">If all pattern characters match, pattern exists. Leaf positions below give occurrences.</span>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Step-by-Step Construction */}
        {!showFinalTree && (
          <section className="step-section">
            <h2>Step-by-Step Construction</h2>
            
            {/* Step Progress */}
            <div className="step-progress">
              {buildSteps.map((_step, index) => (
                <div 
                  key={index}
                  className={`progress-step ${index === currentStep ? 'active' : ''} ${index < currentStep ? 'completed' : ''}`}
                  onClick={() => setCurrentStep(index)}
                >
                  <div className="step-number">{index + 1}</div>
                </div>
              ))}
            </div>

            {/* Current Step Info */}
            {buildSteps[currentStep] && (
              <div className="step-content">
                <div className="step-title-row">
                  <h3>Step {buildSteps[currentStep].stepNumber}: Insert Suffix</h3>
                </div>

                {/* Visual indicator showing current index in sequence */}
                <div className="current-index-indicator">
                  <h4>Current Suffix Position in Sequence:</h4>
                  <div className="sequence-with-indicator">
                    {sequence.split('').map((char, idx) => (
                      <span 
                        key={idx} 
                        className={`indicator-char ${idx >= buildSteps[currentStep].suffixIndex ? 'highlighted' : 'dimmed'} ${idx === buildSteps[currentStep].suffixIndex ? 'start-position' : ''} ${char === '$' ? 'terminator' : ''}`}
                      >
                        <span className="char-value">{char}</span>
                        <span className="char-index">{idx}</span>
                      </span>
                    ))}
                  </div>
                  <div className="indicator-legend">
                    <span className="legend-item"><span className="legend-box highlighted"></span> Current suffix</span>
                    <span className="legend-item"><span className="legend-box dimmed"></span> Not included</span>
                    <span className="legend-item"><span className="legend-box start-position"></span> Start position</span>
                  </div>
                </div>

                <div className="step-description">
                  <p>
                    <strong>Suffix:</strong> "{buildSteps[currentStep].suffix}" 
                    <span className="suffix-position">(starting at position {buildSteps[currentStep].suffixIndex})</span>
                  </p>
                  <p className="step-explanation">
                    {getStepExplanation(currentStep, buildSteps[currentStep], buildSteps.length)}
                  </p>
                </div>

                <div className="tree-visualization">
                  <div className="tree-text-container">
                    {currentTree && renderTreeText(currentTree)}
                  </div>
                </div>
              </div>
            )}

            {/* Step Navigation */}
            <div className="step-navigation">
              <button 
                className="nav-button prev"
                onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                disabled={currentStep === 0}
              >
                ← Previous
              </button>
              <span className="step-indicator">{currentStep + 1} / {buildSteps.length}</span>
              <button 
                className="nav-button next"
                onClick={() => setCurrentStep(Math.min(buildSteps.length - 1, currentStep + 1))}
                disabled={currentStep === buildSteps.length - 1}
              >
                Next →
              </button>
            </div>
          </section>
        )}

        {/* Applications Section */}
        <section className="applications-section">
          <h2>Applications of Suffix Trees</h2>
          <div className="applications-grid">
            <div className="application-card">
              <h3>Pattern Matching</h3>
              <p>Find all occurrences of a pattern in O(m) time, where m is the pattern length.</p>
            </div>
            <div className="application-card">
              <h3>Longest Repeated Substring</h3>
              <p>Find the longest substring that appears more than once by finding the deepest internal node.</p>
            </div>
            <div className="application-card">
              <h3>Longest Common Substring</h3>
              <p>Find the longest common substring between two strings using a generalized suffix tree.</p>
            </div>
            <div className="application-card">
              <h3>Genome Analysis</h3>
              <p>Essential for DNA sequence analysis, repeat detection, and sequence alignment.</p>
            </div>
          </div>
        </section>

        {/* Complexity Section */}
        <section className="complexity-section">
          <h2>Time and Space Complexity</h2>
          <div className="complexity-table">
            <table>
              <thead>
                <tr>
                  <th>Operation</th>
                  <th>Naive Construction</th>
                  <th>Ukkonen's Algorithm</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Construction Time</td>
                  <td>O(n²)</td>
                  <td>O(n)</td>
                </tr>
                <tr>
                  <td>Space</td>
                  <td>O(n²)</td>
                  <td>O(n)</td>
                </tr>
                <tr>
                  <td>Pattern Search</td>
                  <td colSpan={2}>O(m) where m = pattern length</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </main>

      <footer className="page-footer">
        <p>Suffix Tree Search Method - Educational Visualization</p>
      </footer>
    </div>
  );
};

// Helper function to generate step explanations
function getStepExplanation(stepIndex: number, step: BuildStep, totalSteps: number): string {
  // Building from shortest suffix (just $) to longest (full string)
  if (stepIndex === 0) {
    return `We start by inserting the shortest suffix "${step.suffix}" (just the terminator). Since the tree is empty, we create a single edge from ROOT. This establishes the base of our tree.`;
  }
  
  if (stepIndex === totalSteps - 1) {
    return `Finally, we insert the longest suffix "${step.suffix}" (the complete string). We check existing edges and add this path, completing the suffix tree construction.`;
  }
  
  const firstChar = step.suffix[0];
  return `Insert suffix "${step.suffix}" (position ${step.suffixIndex}). We check if any existing edge starts with '${firstChar}'. If a matching prefix exists, we follow or split the edge; otherwise, we create a new branch from the appropriate node.`;
}

export default SuffixTree;
