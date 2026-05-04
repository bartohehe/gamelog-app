interface Props {
  value?: number;
  onChange: (value: number) => void;
  readonly?: boolean;
  accentColor?: string;
}

function getScoreColor(score: number): string {
  if (score >= 75) return '#10B981';
  if (score >= 50) return '#F5A623';
  return '#EF4444';
}

export default function ScoreSlider({ value, onChange, readonly = false, accentColor }: Props) {
  const current = value ?? 0;
  const color = accentColor ?? getScoreColor(current);
  const pct = current; // 0-100

  return (
    <div style={{ width: '100%' }}>
      <div style={{ position: 'relative', height: 24, display: 'flex', alignItems: 'center' }}>
        {/* Track background */}
        <div style={{
          position: 'absolute',
          left: 0, right: 0,
          height: 4,
          borderRadius: 2,
          background: 'rgba(255,255,255,0.1)',
        }} />
        {/* Track fill */}
        <div style={{
          position: 'absolute',
          left: 0,
          width: `${pct}%`,
          height: 4,
          borderRadius: 2,
          background: color,
          transition: 'width 0.1s, background 0.2s',
        }} />
        {/* Native range input (transparent, on top) */}
        <input
          type="range"
          min={0}
          max={100}
          value={current}
          disabled={readonly}
          onChange={e => onChange(Number(e.target.value))}
          style={{
            position: 'absolute',
            left: 0, right: 0,
            width: '100%',
            margin: 0,
            opacity: 0,
            height: 24,
            cursor: readonly ? 'default' : 'pointer',
            zIndex: 2,
          }}
        />
        {/* Thumb */}
        <div style={{
          position: 'absolute',
          left: `calc(${pct}% - 7px)`,
          width: 14,
          height: 14,
          borderRadius: '50%',
          background: color,
          boxShadow: `0 0 6px ${color}80`,
          transition: 'left 0.1s, background 0.2s',
          pointerEvents: 'none',
          zIndex: 1,
        }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 4 }}>
        <span>0</span><span>50</span><span>100</span>
      </div>
    </div>
  );
}
