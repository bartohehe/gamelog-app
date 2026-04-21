import type { ReactNode } from 'react';

interface Props {
  label: string;
  value: string | number;
  icon: ReactNode;
  color?: string;
}

export default function KpiCard({ label, value, icon, color = 'text-accent-gold' }: Props) {
  return (
    <div className="bg-bg-card rounded-xl p-5 flex items-center gap-4 border border-white/5">
      <div className={`text-3xl ${color}`}>{icon}</div>
      <div>
        <div className="text-2xl font-bold text-text-primary">{value}</div>
        <div className="text-sm text-text-primary/50">{label}</div>
      </div>
    </div>
  );
}
