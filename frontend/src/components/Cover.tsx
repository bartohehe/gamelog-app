import type { CSSProperties } from 'react';

interface Props {
  title: string;
  coverImageUrl?: string;
  year?: number;
  style?: CSSProperties;
}

const GRAD_COLORS: [string, string][] = [
  ["#1a0a2e","#7c3aed"], ["#0a1628","#f59e0b"], ["#2a0a0a","#ef4444"],
  ["#0a1a0a","#22c55e"], ["#0a1a2a","#06b6d4"], ["#1a1008","#d97706"],
  ["#1a0808","#f97316"], ["#0a0a1a","#8b5cf6"], ["#080818","#64748b"],
];

export default function Cover({ title, coverImageUrl, year, style }: Props) {
  if (coverImageUrl) {
    return (
      <img
        src={coverImageUrl}
        alt={title}
        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', ...style }}
      />
    );
  }

  const letters = title
    .split(' ')
    .map(w => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const idx = title.charCodeAt(0) % GRAD_COLORS.length;
  const [c1, c2] = GRAD_COLORS[idx];

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: `linear-gradient(135deg, ${c1}, ${c2})`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        ...style,
      }}
    >
      <div
        style={{
          fontSize: 22,
          fontWeight: 800,
          color: 'rgba(255,255,255,0.9)',
          letterSpacing: 2,
          fontFamily: 'monospace',
        }}
      >
        {letters}
      </div>
      {year && (
        <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', marginTop: 3 }}>
          {year}
        </div>
      )}
    </div>
  );
}
