import { useState } from 'react';
import { Search, Plus } from 'lucide-react';
import { searchGames } from '../services/gamesService';
import AddToLibraryModal from '../components/AddToLibraryModal';
import type { GameDto } from '../types';

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GameDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [selectedGame, setSelectedGame] = useState<GameDto | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    try {
      const data = await searchGames(query);
      setResults(data);
      setSearched(true);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="max-w-6xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-bold text-text-primary mb-6">Szukaj gier</h1>

      <form onSubmit={handleSearch} className="flex gap-3 mb-8">
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Wpisz tytuł gry..."
          className="flex-1 bg-bg-card border border-white/10 rounded-xl px-4 py-3 text-text-primary placeholder-text-primary/30 focus:outline-none focus:border-accent-purple transition-colors"
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-accent-purple text-white px-6 py-3 rounded-xl flex items-center gap-2 hover:bg-accent-purple/80 transition-colors disabled:opacity-50"
        >
          <Search size={18} />
          {loading ? 'Szukam...' : 'Szukaj'}
        </button>
      </form>

      {searched && results.length === 0 && (
        <p className="text-text-primary/40 text-center py-12">Brak wyników dla "{query}"</p>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {results.map(game => (
          <div
            key={game.igdbId}
            className="bg-bg-card rounded-xl overflow-hidden border border-white/5 hover:border-accent-purple/40 transition-all flex flex-col"
          >
            {game.coverImageUrl ? (
              <img src={game.coverImageUrl} alt={game.title} className="w-full h-32 object-cover" />
            ) : (
              <div className="h-32 bg-bg-primary flex items-center justify-center text-3xl">🎮</div>
            )}
            <div className="p-3 flex flex-col gap-2 flex-1">
              <p className="text-text-primary text-xs font-medium line-clamp-2 leading-snug flex-1">{game.title}</p>
              {game.releaseYear && (
                <p className="text-text-primary/40 text-xs">{game.releaseYear}</p>
              )}
              {game.genres.length > 0 && (
                <p className="text-text-primary/30 text-xs truncate">{game.genres.slice(0, 2).join(', ')}</p>
              )}
              <button
                onClick={() => setSelectedGame(game)}
                className="mt-1 w-full bg-accent-purple/20 border border-accent-purple/40 text-accent-purple text-xs py-1.5 rounded-lg hover:bg-accent-purple hover:text-white transition-all flex items-center justify-center gap-1"
              >
                <Plus size={12} /> Dodaj
              </button>
            </div>
          </div>
        ))}
      </div>

      {selectedGame && (
        <AddToLibraryModal
          game={selectedGame}
          onClose={() => setSelectedGame(null)}
          onAdded={() => setSelectedGame(null)}
        />
      )}
    </main>
  );
}
