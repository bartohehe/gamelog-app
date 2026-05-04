import { useTheme } from '../contexts/ThemeContext';

interface Props {
  score?: number | null;
  size?: 'sm' | 'md' | 'lg';
}

export default function ScoreBadge({ score, size = 'sm' }: Props) {
  const { t } = useTheme();

  if (score == null) {
    return <span style={{ color: t.textFaint, fontSize: 11 }}>–</span>;
  }

  const color = score >= 80 ? '#22c55e' : score >= 60 ? '#f59e0b' : '#ef4444';

  const sizes = {
    sm: { fontSize: 11, padding: '2px 6px', fontWeight: 700 },
    md: { fontSize: 13, padding: '3px 8px', fontWeight: 700 },
    lg: { fontSize: 22, padding: '6px 14px', fontWeight: 900 },
  };

  const s = sizes[size];

  return (
    <span
      style={{
        background: `${color}20`,
        color,
        border: `1px solid ${color}40`,
        borderRadius: 6,
        fontWeight: s.fontWeight,
        fontFamily: 'monospace',
        fontSize: s.fontSize,
        padding: s.padding,
      }}
    >
      {score}
    </span>
  );
}
