# 🧬 Bio Insights

An interactive web-based educational tool for visualizing and understanding fundamental bioinformatics algorithms. This tool provides step-by-step visualizations of key algorithms, making abstract concepts concrete through interactive visualization.

---

## 👥 Contributors

Developed by Masters students of Computer Science:

| Name | LinkedIn |
|------|----------|
| **Mohan Veeraghanta** | [LinkedIn](https://www.linkedin.com/in/mohan-veeraghanta-9b55a1201/) |
| **Sritha Dongla** | [LinkedIn](https://www.linkedin.com/in/durga-sritha-dongla/) |
| **Pavan Sai Nalluri** | [LinkedIn](https://www.linkedin.com/in/pavansainalluri/) |
| **Subodh Bhyri** | [LinkedIn](https://www.linkedin.com/in/subodhbhyri/) |

---

## 📁 Project Structure

```
BioInformatics_Final_Project/
├── alignment-visualizer/          # Main React application
│   ├── src/
│   │   ├── algorithms/            # Algorithm implementations
│   │   │   ├── global/            # Needleman-Wunsch (Global Alignment)
│   │   │   ├── local/             # Smith-Waterman (Local Alignment)
│   │   │   ├── banded/            # Banded Alignment
│   │   │   └── dovetail/          # Dovetail Alignment
│   │   ├── components/            # React UI components
│   │   │   ├── Homepage/          # Landing page
│   │   │   ├── SequenceInput/     # Sequence input form
│   │   │   ├── AlignmentMatrix/   # DP matrix visualization
│   │   │   ├── AlignmentResult/   # Alignment output display
│   │   │   ├── StepVisualizer/    # Step-by-step controls
│   │   │   ├── ScoringMatrix/     # PAM & BLOSUM matrices
│   │   │   ├── SuffixTree/        # Suffix Tree & Array visualization
│   │   │   ├── PhylogenyTree/     # Phylogenetic tree builder
│   │   │   ├── DistanceMatrix/    # UPGMA clustering
│   │   │   └── ProteinStructure/  # Protein folding visualization
│   │   ├── types/                 # TypeScript type definitions
│   │   ├── App.tsx                # Main application component
│   │   └── main.tsx               # Application entry point
│   ├── public/                    # Static assets
│   ├── package.json               # Dependencies and scripts
│   └── vite.config.ts             # Vite configuration
└── README.md                      # This file
```

---

## 📦 Dependencies

### Core
| Package | Version | Purpose |
|---------|---------|---------|
| React | ^19.2.0 | UI framework |
| React DOM | ^19.2.0 | DOM rendering |
| react-d3-tree | ^3.6.6 | Tree visualization |

### Development
| Package | Version | Purpose |
|---------|---------|---------|
| TypeScript | ~5.9.3 | Type-safe JavaScript |
| Vite (rolldown) | 7.2.5 | Build tool & dev server |
| ESLint | ^9.39.1 | Code linting |

---

## 🎯 Main Features

### 1. Sequence Alignment
- **Global Alignment (Needleman-Wunsch)** – Aligns entire sequences end-to-end
- **Local Alignment (Smith-Waterman)** – Finds best matching subsequences
- **Banded Alignment** – Optimized alignment within a diagonal band
- **Dovetail Alignment** – Overlap alignment for sequence assembly

### 2. Scoring Matrices
- **PAM Matrices** – Step-by-step construction from evolutionary model
- **BLOSUM Matrices** – Direct computation from protein blocks
- **Interactive comparison** – Side-by-side PAM vs BLOSUM analysis

### 3. Suffix Tree & Suffix Array
- **Visual tree construction** – Step-by-step suffix tree building
- **Suffix array generation** – Sorted suffix visualization
- **Pattern matching** – Understanding string indexing structures

### 4. Phylogenetic Trees
- **Newick format parsing** – Standard tree notation
- **Canonical Newick** – Normalized tree representation
- **Interactive tree visualization** – Expandable/collapsible nodes

### 5. Distance Matrix & UPGMA
- **Distance matrix computation** – Pairwise sequence distances
- **UPGMA clustering** – Hierarchical tree construction
- **Step-by-step merging** – Visual cluster formation

### 6. Protein Structure
- **Genetic algorithm optimization** – Folding simulation
- **Hill climbing** – Local search optimization
- **Energy minimization** – Structure prediction concepts

### Interactive Features
- ✅ Custom sequence input (DNA/Protein)
- ✅ Adjustable scoring parameters
- ✅ Step-by-step visualization with auto-play
- ✅ Traceback path highlighting
- ✅ Alignment statistics (identity, coverage, gaps)
- ✅ Responsive design for all devices

---

## 🚀 How to Run

### Prerequisites
- Node.js (v18 or higher)
- npm (v9 or higher)

### Installation

```bash
# Clone the repository
git clone https://github.com/D-Sritha-D/BioInformatics_Final_Project.git
cd BioInformatics_Final_Project

# Navigate to the application
cd alignment-visualizer

# Install dependencies
npm install

# Start the development server
npm run dev
```

The application will be available at `http://localhost:5173`

### Build for Production

```bash
# Create production build
npm run build

# Preview production build locally
npm run preview
```

### Other Commands

```bash
# Run linting
npm run lint
```

---

## 🎓 Educational Purpose

This tool is designed as a pedagogical resource for students learning bioinformatics, featuring:
- Visual representation of dynamic programming matrices
- Step-by-step algorithm execution
- Interactive parameter adjustment
- Real-time visualization of results
- Comprehensive explanations at each step

---

## 📄 License

This project is licensed under the MIT License.
