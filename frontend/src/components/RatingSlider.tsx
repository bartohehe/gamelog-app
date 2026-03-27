interface RatingSliderProps {
  value: number;
  onChange: (value: number) => void;
  label?: string;
}

export default function RatingSlider({ value, onChange, label = 'Rating' }: RatingSliderProps) {
  const getColor = (v: number) => {
    if (v >= 80) return '#52E6A3';
    if (v >= 50) return '#5284E6';
    return '#E65252';
  };

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <label className="text-sm text-slate-400">{label}</label>
        <span className="text-lg font-bold" style={{ color: getColor(value) }}>{value}</span>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        className="w-full h-2 rounded-full appearance-none bg-slate-700 cursor-pointer"
        style={{ accentColor: getColor(value) }}
      />
      <div className="flex justify-between text-xs text-slate-600">
        <span>0</span>
        <span>50</span>
        <span>100</span>
      </div>
    </div>
  );
}
