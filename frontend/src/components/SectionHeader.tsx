import { useTheme } from '../contexts/ThemeContext';

interface Props {
  title: string;
  sub?: string;
  onMore?: () => void;
}

export default function SectionHeader({ title, sub, onMore }: Props) {
  const { t } = useTheme();

  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 16 }}>
      <div>
        <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 20, fontWeight: 700, color: t.text }}>
          {title}
        </div>
        {sub && (
          <div style={{ fontSize: 12, color: t.textMuted, marginTop: 3 }}>{sub}</div>
        )}
      </div>
      {onMore && (
        <button
          onClick={onMore}
          style={{
            fontSize: 12,
            color: t.accent,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontFamily: 'Inter, sans-serif',
          }}
        >
          Zobacz więcej →
        </button>
      )}
    </div>
  );
}
