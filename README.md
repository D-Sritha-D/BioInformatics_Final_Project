# 🧬 BioInsight: Algorithm Visualizer

## Overview
An interactive web-based educational tool for visualizing and understanding fundamental sequence alignment algorithms in bioinformatics. This tool provides step-by-step visualizations of key algorithms, making abstract algorithmic concepts concrete through visualization.

## 🎯 Features

### Alignment Algorithms (Implemented)
- **Global Alignment (Needleman-Wunsch)** - Aligns entire sequences end-to-end
- **Banded Alignment** - Optimized alignment within a diagonal band

### Coming Soon
- Local Alignment (Smith-Waterman)
- Dovetail Alignment
- Scoring Matrices (BLOSUM, PAM)

### Interactive Features
- Input custom DNA or protein sequences
- Adjust scoring parameters (match, mismatch, gap penalties)
- Step-by-step matrix filling visualization
- Traceback path highlighting
- Alignment statistics (identity, coverage, gaps)

## 🚀 Installation

```bash
# Clone the repository
git clone https://github.com/D-Sritha-D/BioInformatics_Final_Project.git
cd BioInformatics_Final_Project

# Navigate to the alignment visualizer
cd alignment-visualizer

# Install dependencies
npm install

# Start the development server
npm run dev
```

## 📁 Project Structure

```
Project/
├── alignment-visualizer/     # React application
│   ├── src/
│   │   ├── algorithms/       # Alignment algorithm implementations
│   │   │   ├── global/       # Needleman-Wunsch algorithm
│   │   │   └── banded/       # Banded alignment algorithm
│   │   ├── components/       # React UI components
│   │   │   ├── SequenceInput/
│   │   │   ├── AlignmentMatrix/
│   │   │   ├── AlignmentResult/
│   │   │   └── StepVisualizer/
│   │   ├── types/            # TypeScript type definitions
│   │   ├── App.tsx           # Main application component
│   │   └── main.tsx          # Application entry point
│   ├── package.json
│   └── vite.config.ts
└── README.md
```

## 🛠️ Tech Stack

- **React** - UI framework
- **TypeScript** - Type-safe JavaScript
- **Vite** - Build tool and dev server
- **CSS3** - Styling with modern features

## 📖 Algorithm Details

### Global Alignment (Needleman-Wunsch)
The Needleman-Wunsch algorithm finds the optimal global alignment between two sequences using dynamic programming.

- **Time Complexity:** O(m × n)
- **Space Complexity:** O(m × n)
- **Use Case:** Comparing sequences of similar length

### Banded Alignment
An optimization that only considers cells within a diagonal band of width k.

- **Time Complexity:** O(k × n)
- **Space Complexity:** O(k × n)
- **Use Case:** Similar sequences where gaps are limited

## 🎓 Educational Purpose

This tool is designed as a pedagogical resource for students learning bioinformatics, featuring:
- Visual representation of dynamic programming matrices
- Step-by-step algorithm execution
- Interactive parameter adjustment
- Real-time visualization of alignment results

## 👥 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License.

## 📬 Contact

For questions or feedback, please contact the project maintainers.
