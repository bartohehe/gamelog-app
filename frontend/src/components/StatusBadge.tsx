import type { GameStatus } from '../types';
import { useTheme } from '../contexts/ThemeContext';

const STATUS_META: Record<GameStatus, { label: string; icon: string }> = {
  Planned:    { label: 'Planowane',  icon: '◷' },
  InProgress: { label: 'W trakcie', icon: '▶' },
  Completed:  { label: 'Ukończone', icon: '✓' },
  Abandoned:  { label: 'Porzucone', icon: '✕' },
};

interface Props {
  status: GameStatus;
  small?: boolean;
}

export default function StatusBadge({ status, small }: Props) {
  const { t } = useTheme();

  const colorMap: Record<GameStatus, string> = {
    Planned:    t.statusPlanned,
    InProgress: t.statusInProgress,
    Completed:  t.statusCompleted,
    Abandoned:  t.statusAbandoned,
  };

  const color = colorMap[status];
  const meta = STATUS_META[status];

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        background: `${color}18`,
        color,
        border: `1px solid ${color}35`,
        borderRadius: 20,
        fontWeight: 600,
        fontSize: small ? 10 : 11,
        padding: small ? '2px 7px' : '3px 10px',
      }}
    >
      {meta.icon} {meta.label}
    </span>
  );
}
