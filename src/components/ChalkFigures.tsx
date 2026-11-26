/* Hand-drawn style chalk figures used as lesson illustrations.
   Pure SVG, decorative only (aria-hidden). */

type FigureProps = { className?: string; accent?: string; stroke?: string };

const CHALK = "#EEE9DA";

function wave(fn: (x: number) => number, x0: number, x1: number, steps: number, sx: number, sy: number, ox: number, oy: number) {
  const pts: string[] = [];
  for (let i = 0; i <= steps; i++) {
    const x = x0 + ((x1 - x0) * i) / steps;
    pts.push(`${(ox + x * sx).toFixed(1)},${(oy - fn(x) * sy).toFixed(1)}`);
  }
  return "M" + pts.join(" L");
}

export function PythagorasFigure({ className, accent = "#F4D35E", stroke = CHALK }: FigureProps) {
  return (
    <svg viewBox="-20 -70 360 370" className={className} aria-hidden="true" fill="none" strokeLinejoin="round">
      <polygon points="100,160 220,160 220,280 100,280" stroke={accent} fill={accent} fillOpacity=".1" strokeWidth="3" />
      <polygon points="100,70 100,160 10,160 10,70" stroke="#8FCBEC" fill="#8FCBEC" fillOpacity=".1" strokeWidth="3" />
      <polygon points="100,70 220,160 310,40 190,-50" stroke={stroke} fill={stroke} fillOpacity=".08" strokeWidth="3" />
      <polygon points="100,70 220,160 100,160" stroke={stroke} strokeWidth="4" />
      <polyline points="100,148 112,148 112,160" stroke={stroke} strokeWidth="2" />
      <g fontFamily="var(--font-serif)" fontStyle="italic" fontSize="28">
        <text x="148" y="230" fill={accent}>b²</text>
        <text x="36" y="124" fill="#8FCBEC">a²</text>
        <text x="196" y="66" fill={stroke}>c²</text>
      </g>
    </svg>
  );
}

export function TangentFigure({ className, accent = "#8FCBEC", stroke = CHALK }: FigureProps) {
  const f = (x: number) => 0.08 * x * x;
  const m = 0.64, y0 = f(4);
  return (
    <svg viewBox="0 0 400 220" className={className} aria-hidden="true" fill="none" strokeWidth="2.5">
      <line x1="20" y1="190" x2="380" y2="190" stroke={stroke} strokeOpacity=".35" />
      <line x1="200" y1="10" x2="200" y2="200" stroke={stroke} strokeOpacity=".35" />
      <path d={wave(f, -9, 9, 80, 20, 10, 200, 190)} stroke={stroke} />
      <path d={wave((x) => y0 + m * (x - 4), -1, 9, 2, 20, 10, 200, 190)} stroke={accent} />
      <circle cx={280} cy={190 - y0 * 10} r="5" fill={accent} />
    </svg>
  );
}

export function FourierFigure({ className, accent = "#F4A3A3", stroke = CHALK }: FigureProps) {
  const sq = (k: number) => (x: number) => {
    let s = 0;
    for (let i = 0; i < k; i++) s += Math.sin((2 * i + 1) * x) / (2 * i + 1);
    return s * 1.2;
  };
  return (
    <svg viewBox="0 0 400 220" className={className} aria-hidden="true" fill="none" strokeWidth="2.5">
      <line x1="20" y1="110" x2="390" y2="110" stroke={stroke} strokeOpacity=".35" />
      <path d={wave(sq(1), 0, 4 * Math.PI, 160, 26, 60, 40, 110)} stroke={accent} strokeDasharray="5 5" />
      <path d={wave(sq(6), 0, 4 * Math.PI, 260, 26, 60, 40, 110)} stroke={stroke} />
    </svg>
  );
}

export function BellFigure({ className, accent = "#9EDBA8", stroke = CHALK }: FigureProps) {
  const p = wave((x) => Math.exp((-x * x) / 2) * 2.6, -4, 4, 100, 45, 60, 200, 190);
  return (
    <svg viewBox="0 0 400 220" className={className} aria-hidden="true" strokeWidth="2.5">
      <line x1="10" y1="190" x2="390" y2="190" stroke={stroke} strokeOpacity=".35" />
      <path d={`${p} L380,190 L20,190Z`} fill={accent} fillOpacity=".15" stroke="none" />
      <path d={p} fill="none" stroke={stroke} />
      <line x1="200" y1="34" x2="200" y2="190" stroke={accent} strokeDasharray="4 4" />
    </svg>
  );
}

export function SineFigure({ className, accent = "#F4D35E", stroke = CHALK }: FigureProps) {
  return (
    <svg viewBox="0 0 400 220" className={className} aria-hidden="true" fill="none" strokeWidth="2.5">
      <line x1="10" y1="110" x2="390" y2="110" stroke={stroke} strokeOpacity=".35" />
      <circle cx="45" cy="110" r="32" stroke={accent} />
      <path d={wave(Math.cos, 0, 4 * Math.PI, 140, 22, 60, 90, 110)} stroke={accent} strokeDasharray="5 5" />
      <path d={wave(Math.sin, 0, 4 * Math.PI, 140, 22, 60, 90, 110)} stroke={stroke} />
    </svg>
  );
}

const FIGURES = [PythagorasFigure, TangentFigure, FourierFigure, BellFigure, SineFigure];
const ACCENTS = ["#F4D35E", "#8FCBEC", "#F4A3A3", "#9EDBA8", "#F4D35E"];

/** Stable decorative figure for any string (e.g. a video id or prompt). */
export function FigureFor({ seed, className }: { seed: string; className?: string }) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  const Fig = FIGURES[h % FIGURES.length];
  return <Fig className={className} accent={ACCENTS[h % ACCENTS.length]} />;
}
