import './UniqueConformations.css';
import type { UniqueConformation } from '../../types';

interface Point {
  x: number;
  y: number;
}

interface UniqueConformationsProps {
  conformations?: UniqueConformation[];
  sequence: string;
}

function computePositions(path: string): Point[] {
  const positions: Point[] = [{ x: 0, y: 0 }];
  let orientation = 0; // 0 up, 1 right, 2 down, 3 left

  for (const move of path) {
    if (move === 'L') orientation = (orientation + 3) % 4;
    if (move === 'R') orientation = (orientation + 1) % 4;
    const step =
      orientation === 0 ? { x: 0, y: 1 } :
      orientation === 1 ? { x: 1, y: 0 } :
      orientation === 2 ? { x: 0, y: -1 } :
      { x: -1, y: 0 };
    const last = positions[positions.length - 1];
    positions.push({ x: last.x + step.x, y: last.y + step.y });
  }

  return positions;
}

function MiniLattice({ conformation }: { conformation: UniqueConformation }) {
  const positions = conformation.positions ?? computePositions(conformation.path);
  if (positions.length === 0) return null;

  const xs = positions.map((p) => p.x);
  const ys = positions.map((p) => p.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const width = maxX - minX + 1;
  const height = maxY - minY + 1;

  const occupied = new Map<string, number>();
  positions.forEach((p, idx) => {
    const key = `${p.x - minX},${maxY - p.y}`;
    occupied.set(key, idx);
  });

  const cells = [];
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const key = `${x},${y}`;
      const idx = occupied.get(key);
      cells.push(
        <div
          key={key}
          className={
            idx === undefined
              ? 'cell empty'
              : idx === 0
              ? 'cell start'
              : idx === positions.length - 1
              ? 'cell end'
              : 'cell filled'
          }
          title={idx !== undefined ? `Residue ${idx + 1}` : undefined}
        />
      );
    }
  }

  return (
    <div
      className="mini-lattice"
      style={{ gridTemplateColumns: `repeat(${width}, 14px)`, gridTemplateRows: `repeat(${height}, 14px)` }}
    >
      {cells}
    </div>
  );
}

export function UniqueConformations({ conformations, sequence }: UniqueConformationsProps) {
  if (!conformations || conformations.length === 0) return null;

  return (
    <div className="unique-conformations">
      <div className="uc-header">
        <div>
          <h3>Unique Conformations</h3>
          <p className="muted">Final generation diversity for the genetic algorithm.</p>
        </div>
        <div className="uc-pill">{conformations.length} unique</div>
      </div>

      <div className="uc-grid">
        {conformations.map((c) => (
          <div key={c.path} className="uc-card">
            <div className="uc-top">
              <div className="uc-path mono">{c.path}</div>
              {c.isElite && <span className="elite-badge">Elite</span>}
            </div>
            <div className="uc-meta">
              <span>Fitness: {c.fitness}</span>
              <span>H-H: {c.contacts}</span>
            </div>
            <MiniLattice conformation={c} />
            <div className="uc-seq mono muted">{sequence}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
