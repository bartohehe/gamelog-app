import { Link } from 'react-router-dom';
import StatusBadge from './StatusBadge';
import type { UserGameDto } from '../types';

export default function GameCard({ game }: { game: UserGameDto }) {
  return (
    <Link
      to={`/game/${game.igdbId}`}
      className="bg-bg-card rounded-xl overflow-hidden border border-white/5 hover:border-accent-purple/40 transition-all hover:shadow-lg hover:shadow-accent-purple/10 flex flex-col"
    >
      <div className="relative">
        {game.coverImageUrl ? (
          <img
            src={game.coverImageUrl}
            alt={game.title}
            className="w-full h-40 object-cover"
          />
        ) : (
          <div className="w-full h-40 bg-bg-primary flex items-center justify-center text-text-primary/20 text-4xl">
            🎮
          </div>
        )}
        <div className="absolute top-2 right-2">
          <StatusBadge status={game.status} />
        </div>
      </div>
      <div className="p-4 flex flex-col gap-2 flex-1">
        <h3 className="font-semibold text-text-primary line-clamp-2 text-sm leading-snug">
          {game.title}
        </h3>
        <div className="flex items-center justify-between mt-auto">
          <span className="text-xs text-text-primary/40">{game.platform || '—'}</span>
          {game.score !== undefined && game.score !== null ? (
            <span className="text-sm font-bold text-accent-gold">{game.score}/100</span>
          ) : (
            <span className="text-xs text-text-primary/30">Brak oceny</span>
          )}
        </div>
      </div>
    </Link>
  );
}
