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

interface SuffixArrayStep {
  stepNumber: number;
  suffixes: { suffix: string; index: number }[];
  description: string;
  sortedIndices: number[];
  sortedSuffixes?: { suffix: string; index: number }[];
}

type Mode = 'tree' | 'array';

const VALID_CHARS = new Set(['A', 'T', 'G', 'C']);
const MAX_LENGTH = 10;

const SuffixTree: React.FC<SuffixTreeProps> = ({ onNavigateToHomepage }) => {
  const [mode, setMode] = useState<Mode>('tree');
  const [currentStep, setCurrentStep] = useState(0);
  const [arrayCurrentStep, setArrayCurrentStep] = useState(0);
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

  // Handle mode change
  const handleModeChange = useCallback((newMode: Mode) => {
    setMode(newMode);
    setCurrentStep(0);
    setArrayCurrentStep(0);
    setShowFinalTree(true);
    // Reset input to force re-render with fresh state
    setSequence(inputSequence + '$');
  }, [inputSequence]);
  
  // Generate all suffixes (for tree: last to first, for array: first to last for display)
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

  // Generate suffixes for array display (in original order)
  const suffixesForArray = useMemo(() => {
    const result: { suffix: string; index: number }[] = [];
    for (let i = 0; i < sequence.length; i++) {
      result.push({
        suffix: sequence.substring(i),
        index: i
      });
    }
    return result;
  }, [sequence]);

  // Build suffix array step by step (sorting process)
  const suffixArraySteps = useMemo((): SuffixArrayStep[] => {
    const steps: SuffixArrayStep[] = [];
    const allSuffixes = suffixesForArray.map(s => ({ ...s }));
    
    // Step 1: List all suffixes (unsorted)
    steps.push({
      stepNumber: 1,
      suffixes: [...allSuffixes],
      description: 'List all suffixes with their starting positions',
      sortedIndices: allSuffixes.map(s => s.index),
      sortedSuffixes: undefined
    });

    // Sort suffixes lexicographically
    const sorted = [...allSuffixes].sort((a, b) => a.suffix.localeCompare(b.suffix));
    
    // Create step-by-step showing the sorting (one suffix at a time)
    for (let i = 0; i < sorted.length; i++) {
      steps.push({
        stepNumber: i + 2,
        suffixes: allSuffixes,
        description: i === sorted.length - 1 
          ? 'Sorting complete! All suffixes are in lexicographic order' 
          : `Placing suffix "${sorted[i].suffix}" at position ${i + 1}`,
        sortedIndices: sorted.slice(0, i + 1).map(s => s.index),
        sortedSuffixes: sorted.slice(0, i + 1)
      });
    }

    return steps;
  }, [suffixesForArray]);

  // Final suffix array - used by the sorted suffixes display
  const finalSuffixArray = useMemo(() => {
    return [...suffixesForArray].sort((a, b) => a.suffix.localeCompare(b.suffix)).map(s => s.index);
  }, [suffixesForArray]);

  // Use finalSuffixArray to prevent unused variable warning
  console.debug('Final suffix array computed:', finalSuffixArray.length);

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
          <h1>Suffix Tree and Suffix Array</h1>
          <p className="subtitle">Understanding suffix data structures for efficient string searching</p>
          <button onClick={onNavigateToHomepage} className="back-button">
            ← Back to Homepage
          </button>
        </div>
      </header>

      <main className="page-main">
        {/* Mode Selection */}
        <section className="mode-selection-section">
          <h2>Select Data Structure</h2>
          <div className="mode-selector">
            <label className={`mode-option ${mode === 'tree' ? 'active' : ''}`}>
              <input
                type="radio"
                name="mode"
                value="tree"
                checked={mode === 'tree'}
                onChange={() => handleModeChange('tree')}
              />
              <span className="mode-label">
                <span className="mode-name">Suffix Tree</span>
              </span>
            </label>
            <label className={`mode-option ${mode === 'array' ? 'active' : ''}`}>
              <input
                type="radio"
                name="mode"
                value="array"
                checked={mode === 'array'}
                onChange={() => handleModeChange('array')}
              />
              <span className="mode-label">
                <span className="mode-name">Suffix Array</span>
              </span>
            </label>
          </div>
        </section>

        {/* Introduction Section */}
        <section className="intro-section">
          <div className="intro-content">
            {mode === 'tree' ? (
              <>
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
              </>
            ) : (
              <>
                <h2>What is a Suffix Array?</h2>
                <p>
                  A <strong>suffix array</strong> is a sorted array of all suffixes of a string. It provides a space-efficient 
                  alternative to suffix trees while still enabling fast pattern matching and other string operations. 
                  The suffix array stores only the starting indices of suffixes in lexicographically sorted order.
                </p>
                <div className="key-properties">
                  <h3>Key Properties:</h3>
                  <ul>
                    <li>Contains starting indices of all suffixes sorted lexicographically</li>
                    <li>Space efficient: O(n) integers vs O(n) nodes in suffix tree</li>
                    <li>Can be constructed in O(n) time with advanced algorithms</li>
                    <li>Pattern search in O(m log n) time using binary search</li>
                    <li>Often used with LCP (Longest Common Prefix) array for enhanced operations</li>
                  </ul>
                </div>
              </>
            )}
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
                Build {mode === 'tree' ? 'Tree' : 'Array'}
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
          <h2>Building {mode === 'tree' ? 'Suffix Tree' : 'Suffix Array'} for: {sequence}</h2>
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
              The $ symbol is a termination character that ensures every suffix ends at a unique {mode === 'tree' ? 'leaf node' : 'position'}.
            </p>
          </div>

          <div className="suffixes-list">
            <h3>All Suffixes:</h3>
            <div className="suffixes-grid">
              {(mode === 'tree' ? suffixes : suffixesForArray).map(({ suffix, index }) => (
                <div 
                  key={index} 
                  className={`suffix-item`}
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
              {mode === 'tree' ? 'Final Tree' : 'Final Array'}
            </button>
            <button 
              className={`toggle-btn ${!showFinalTree ? 'active' : ''}`}
              onClick={() => setShowFinalTree(false)}
            >
              Step-by-Step Construction
            </button>
          </div>
        </section>

        {/* Suffix Tree: Final Tree View */}
        {mode === 'tree' && showFinalTree && finalTree && (
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

        {/* Suffix Array: Final Array View */}
        {mode === 'array' && showFinalTree && (
          <section className="final-tree-section">
            <h2>Complete Suffix Array for "{sequence}"</h2>
            <div className="suffix-array-result">
              <div className="array-visualization">
                <h4>Suffix Array (SA):</h4>
                <div className="array-container">
                  <div className="array-row header-row">
                    <span className="array-label">Index:</span>
                    {suffixArraySteps[suffixArraySteps.length - 1]?.sortedSuffixes?.map((_, idx) => (
                      <span key={idx} className="array-cell header">{idx}</span>
                    ))}
                  </div>
                  <div className="array-row">
                    <span className="array-label">SA[i]:</span>
                    {suffixArraySteps[suffixArraySteps.length - 1]?.sortedSuffixes?.map((s, idx) => (
                      <span key={idx} className="array-cell value">{s.index}</span>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="sorted-suffixes-table">
                <h4>Sorted Suffixes:</h4>
                <table className="suffix-table">
                  <thead>
                    <tr>
                      <th>SA Index</th>
                      <th>Original Position</th>
                      <th>Suffix</th>
                    </tr>
                  </thead>
                  <tbody>
                    {suffixArraySteps[suffixArraySteps.length - 1]?.sortedSuffixes?.map((s, idx) => (
                      <tr key={idx}>
                        <td>{idx}</td>
                        <td>{s.index}</td>
                        <td className="suffix-text-cell">{s.suffix}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="tree-legend">
              <h4>How to Read the Suffix Array:</h4>
              <ul>
                <li><strong>SA[i]</strong>: The starting position in the original string of the i-th lexicographically smallest suffix</li>
                <li><strong>Index</strong>: Position in the sorted array (0, 1, 2, ...)</li>
                <li><strong>Original Position</strong>: Where this suffix starts in the original string</li>
                <li>The suffixes are sorted in lexicographic (alphabetical) order</li>
              </ul>
            </div>

            <div className="search-example">
              <h3>Example: Binary Search for a Pattern</h3>
              <div className="search-steps">
                <div className="search-step">
                  <span className="step-num">1</span>
                  <span className="step-text">Given a pattern P, use binary search on the suffix array</span>
                </div>
                <div className="search-step">
                  <span className="step-num">2</span>
                  <span className="step-text">Compare P with suffix at SA[mid] lexicographically</span>
                </div>
                <div className="search-step">
                  <span className="step-num">3</span>
                  <span className="step-text">If P &lt; suffix, search left half; if P &gt; suffix, search right half</span>
                </div>
                <div className="search-step">
                  <span className="step-num">4</span>
                  <span className="step-text">If match found, SA[mid] gives the starting position of the pattern</span>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Suffix Tree: Step-by-Step Construction */}
        {mode === 'tree' && !showFinalTree && (
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
              <>
                {/* Current Suffix Position - Full width on top */}
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

                {/* Side-by-side layout: Tree on left, Explanation+Navigation on right */}
                <div className="step-content-wrapper">
                  {/* Tree on the left */}
                  <div className="tree-panel">
                    <div className="tree-visualization">
                      <div className="tree-text-container">
                        {currentTree && renderTreeText(currentTree)}
                      </div>
                    </div>
                  </div>

                  {/* Explanation and navigation on the right */}
                  <div className="info-panel">
                    <div className="step-content">
                      <div className="step-title-row">
                        <h3>Step {buildSteps[currentStep].stepNumber}: Insert Suffix</h3>
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
                    </div>

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
                  </div>
                </div>
              </>
            )}
          </section>
        )}

        {/* Suffix Array: Step-by-Step Construction */}
        {mode === 'array' && !showFinalTree && (
          <section className="step-section">
            <h2>Step-by-Step Construction (Sorting)</h2>
            
            {/* Step Progress */}
            <div className="step-progress">
              {suffixArraySteps.map((_step, index) => (
                <div 
                  key={index}
                  className={`progress-step ${index === arrayCurrentStep ? 'active' : ''} ${index < arrayCurrentStep ? 'completed' : ''}`}
                  onClick={() => setArrayCurrentStep(index)}
                >
                  <div className="step-number">{index + 1}</div>
                </div>
              ))}
            </div>

            {/* Current Step Info */}
            {suffixArraySteps[arrayCurrentStep] && (
              <div className="step-content">
                <div className="step-title-row">
                  <h3>Step {suffixArraySteps[arrayCurrentStep].stepNumber}: {suffixArraySteps[arrayCurrentStep].description}</h3>
                </div>

                <div className="suffix-array-step-content">
                  {arrayCurrentStep === 0 ? (
                    <div className="unsorted-suffixes">
                      <h4>All Suffixes (unsorted):</h4>
                      <div className="suffixes-step-grid">
                        {suffixArraySteps[arrayCurrentStep].suffixes.map((s, idx) => (
                          <div key={idx} className="suffix-step-item">
                            <span className="suffix-position-label">Pos {s.index}:</span>
                            <span className="suffix-text-value">{s.suffix}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="sorting-progress">
                      <h4>Sorted Suffixes ({arrayCurrentStep} of {suffixArraySteps.length - 1} sorted):</h4>
                      <div className="sorting-visualization">
                        {suffixArraySteps[arrayCurrentStep].sortedSuffixes?.map((s, idx) => (
                          <div 
                            key={idx} 
                            className={`sorted-suffix-item ${idx === arrayCurrentStep - 1 ? 'just-sorted' : ''} ${idx < arrayCurrentStep - 1 ? 'already-sorted' : ''}`}
                          >
                            <span className="sort-rank">{idx + 1}</span>
                            <span className="suffix-position-label">Pos {s.index}:</span>
                            <span className="suffix-text-value">{s.suffix}</span>
                          </div>
                        ))}
                      </div>
                      {arrayCurrentStep < suffixArraySteps.length - 1 && (
                        <p className="sorting-note">
                          Comparing suffixes lexicographically to find position {arrayCurrentStep + 1}...
                        </p>
                      )}
                      {arrayCurrentStep === suffixArraySteps.length - 1 && (
                        <p className="sorting-complete">
                          ✓ Sorting complete! The suffix array is: [{suffixArraySteps[arrayCurrentStep].sortedSuffixes?.map(s => s.index).join(', ')}]
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Step Navigation */}
            <div className="step-navigation">
              <button 
                className="nav-button prev"
                onClick={() => setArrayCurrentStep(Math.max(0, arrayCurrentStep - 1))}
                disabled={arrayCurrentStep === 0}
              >
                ← Previous
              </button>
              <span className="step-indicator">{arrayCurrentStep + 1} / {suffixArraySteps.length}</span>
              <button 
                className="nav-button next"
                onClick={() => setArrayCurrentStep(Math.min(suffixArraySteps.length - 1, arrayCurrentStep + 1))}
                disabled={arrayCurrentStep === suffixArraySteps.length - 1}
              >
                Next →
              </button>
            </div>
          </section>
        )}

        {/* Applications Section */}
        <section className="applications-section">
          <h2>Applications of {mode === 'tree' ? 'Suffix Trees' : 'Suffix Arrays'}</h2>
          {mode === 'tree' ? (
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
          ) : (
            <div className="applications-grid">
              <div className="application-card">
                <h3>Pattern Matching</h3>
                <p>Binary search for patterns in O(m log n) time. Can be improved to O(m + log n) with LCP array.</p>
              </div>
              <div className="application-card">
                <h3>Burrows-Wheeler Transform</h3>
                <p>Used in BWT for data compression (bzip2) and FM-index for efficient string matching.</p>
              </div>
              <div className="application-card">
                <h3>Read Alignment</h3>
                <p>Foundation for tools like BWA and Bowtie for aligning sequencing reads to reference genomes.</p>
              </div>
              <div className="application-card">
                <h3>Space Efficiency</h3>
                <p>Requires only n integers of space vs O(n) pointers in suffix trees - much more memory efficient.</p>
              </div>
            </div>
          )}
        </section>

        {/* Complexity Section */}
        <section className="complexity-section">
          <h2>Time and Space Complexity</h2>
          {mode === 'tree' ? (
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
          ) : (
            <div className="complexity-table">
              <table>
                <thead>
                  <tr>
                    <th>Operation</th>
                    <th>Naive (Sorting)</th>
                    <th>DC3/SA-IS Algorithm</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Construction Time</td>
                    <td>O(n² log n)</td>
                    <td>O(n)</td>
                  </tr>
                  <tr>
                    <td>Space</td>
                    <td>O(n)</td>
                    <td>O(n)</td>
                  </tr>
                  <tr>
                    <td>Pattern Search</td>
                    <td colSpan={2}>O(m log n) or O(m + log n) with LCP</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>

      <footer className="page-footer">
        <p>{mode === 'tree' ? 'Suffix Tree' : 'Suffix Array'} - Educational Visualization</p>
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
