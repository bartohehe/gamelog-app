import { TrendingUp } from 'lucide-react';

interface GameCardProps {
  title: string;
  genre?: string;
  coverUrl?: string;
  rating?: number;
  status?: string;
  trendingPercent?: number;
  onClick?: () => void;
}

export default function GameCard({ title, genre, coverUrl, rating, status, trendingPercent, onClick }: GameCardProps) {
  const statusColors: Record<string, string> = {
    playing: 'bg-[#5284E6]',
    completed: 'bg-[#52E6A3] text-slate-900',
    backlog: 'bg-slate-600',
    dropped: 'bg-red-800',
  };

  return (
    <div
      onClick={onClick}
      className={`bg-slate-900 rounded-xl overflow-hidden border border-slate-800 hover:border-slate-600 transition-all group ${onClick ? 'cursor-pointer' : ''}`}
    >
      {/* Cover */}
      <div className="relative h-40 bg-slate-800">
        {coverUrl ? (
          <img src={coverUrl} alt={title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-600 text-sm">No Image</div>
        )}
        {trendingPercent !== undefined && (
          <div className="absolute top-2 right-2 flex items-center gap-1 bg-[#E65252] text-white text-xs px-2 py-0.5 rounded-full">
            <TrendingUp className="w-3 h-3" />
            +{trendingPercent}%
          </div>
        )}
        {status && (
          <div className={`absolute bottom-2 left-2 text-xs px-2 py-0.5 rounded-full text-white ${statusColors[status] ?? 'bg-slate-600'}`}>
            {status}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3">
        <h3 className="text-white text-sm font-semibold truncate">{title}</h3>
        {genre && <p className="text-slate-400 text-xs mt-0.5">{genre}</p>}
        {rating !== undefined && (
          <div className="mt-2 flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
              <div className="h-full bg-[#E65252] rounded-full" style={{ width: `${rating}%` }} />
            </div>
            <span className="text-xs text-[#E65252] font-bold">{rating}</span>
          </div>
        )}
      </div>
    </div>
  );
}
