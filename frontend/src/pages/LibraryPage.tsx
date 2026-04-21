import { useEffect, useState } from 'react';
import { getLibrary } from '../services/libraryService';
import GameCard from '../components/GameCard';
import type { UserGameDto, GameStatus } from '../types';

const FILTER_OPTIONS: { value: GameStatus | 'All'; label: string }[] = [
  { value: 'All', label: 'Wszystkie' },
  { value: 'InProgress', label: 'W trakcie' },
  { value: 'Planned', label: 'Planowane' },
  { value: 'Completed', label: 'Ukończone' },
  { value: 'Abandoned', label: 'Porzucone' },
];

export default function LibraryPage() {
  const [games, setGames] = useState<UserGameDto[]>([]);
  const [filter, setFilter] = useState<GameStatus | 'All'>('All');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getLibrary()
      .then(setGames)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = filter === 'All' ? games : games.filter(g => g.status === filter);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-2 border-accent-purple border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <main className="max-w-6xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-text-primary">Moja biblioteka</h1>
        <span className="text-text-primary/40 text-sm">{games.length} gier</span>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap mb-8">
        {FILTER_OPTIONS.map(opt => (
          <button
            key={opt.value}
            onClick={() => setFilter(opt.value)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all border ${
              filter === opt.value
                ? 'bg-accent-purple border-accent-purple text-white'
                : 'bg-bg-card border-white/10 text-text-primary/60 hover:border-accent-purple/40'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-text-primary/30">
          <div className="text-5xl mb-4">🎮</div>
          <p>{filter === 'All' ? 'Biblioteka jest pusta. Znajdź swoje pierwsze gry!' : 'Brak gier w tej kategorii.'}</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filtered.map(game => (
            <GameCard key={game.id} game={game} />
          ))}
        </div>
      )}
    </main>
  );
}
