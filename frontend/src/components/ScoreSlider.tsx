interface Props {
  value?: number;
  onChange: (value: number) => void;
  readonly?: boolean;
}

function getScoreColor(score: number): string {
  if (score >= 75) return '#10B981';
  if (score >= 50) return '#F5A623';
  return '#EF4444';
}

export default function ScoreSlider({ value, onChange, readonly = false }: Props) {
  const current = value ?? 0;
  const color = getScoreColor(current);

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-text-primary/50">Ocena</span>
        <span className="text-sm font-bold" style={{ color }}>
          {value !== undefined ? value : '—'}/100
        </span>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        value={current}
        disabled={readonly}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full h-2 rounded-lg appearance-none cursor-pointer disabled:cursor-default"
        style={{ accentColor: color }}
      />
    </div>
  );
}
