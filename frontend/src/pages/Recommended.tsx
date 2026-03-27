import { useEffect, useState } from 'react';
import { TrendingUp, Search } from 'lucide-react';
import api from '../services/api';

interface RawgGame {
  id: number;
  name: string;
  background_image?: string;
  genres?: { name: string }[];
  rating?: number;
  ratings_count?: number;
}

export default function Recommended() {
  const [games, setGames] = useState<RawgGame[]>([]);
  const [searchQ, setSearchQ] = useState('');
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Default: load top-rated games from RAWG
  useEffect(() => {
    setLoading(true);
    api.get('/games/search?q=action').then(r => {
      const results = Array.isArray(r.data?.results) ? r.data.results : [];
      setGames(results.slice(0, 12));
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQ.trim()) return;
    setLoading(true);
    setHasSearched(true);
    try {
      const r = await api.get(`/games/search?q=${encodeURIComponent(searchQ)}`);
      const results = Array.isArray(r.data?.results) ? r.data.results : (Array.isArray(r.data) ? r.data : []);
      setGames(results.slice(0, 12));
    } finally {
      setLoading(false);
    }
  };

  const addToLibrary = async (game: RawgGame) => {
    try {
      const gameRes = await api.post('/games', {
        title: game.name,
        genre: game.genres?.[0]?.name,
        coverUrl: game.background_image,
        gameMode: 'singleplayer',
        rawgId: String(game.id),
      });
      await api.post('/usergames', { gameId: gameRes.data.id, status: 'backlog', rating: null });
      alert(`"${game.name}" added to your library!`);
    } catch {
      alert('Could not add game. It may already be in your library.');
    }
  };

  return (
    <main className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-white text-2xl font-bold">Recommended</h1>
        <div className="flex items-center gap-1 text-[#E65252] text-sm">
          <TrendingUp className="w-4 h-4" /> Powered by RAWG
        </div>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-3 mb-8">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
          <input
            value={searchQ}
            onChange={e => setSearchQ(e.target.value)}
            placeholder="Search games to discover..."
            className="w-full bg-slate-800 border border-slate-700 text-white pl-9 pr-4 py-2 rounded-lg text-sm focus:outline-none focus:border-[#E65252]"
          />
        </div>
        <button type="submit" className="bg-[#E65252] hover:bg-[#d44444] text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors">
          Search
        </button>
      </form>

      {loading ? (
        <div className="text-center py-20 text-slate-500">Loading games...</div>
      ) : games.length === 0 && hasSearched ? (
        <div className="text-center py-20 text-slate-500">No games found. Try a different query.</div>
      ) : (
        <div className="grid grid-cols-4 gap-4">
          {games.map(game => (
            <div key={game.id} className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden hover:border-slate-600 transition-all group">
              <div className="h-40 bg-slate-800 overflow-hidden">
                {game.background_image
                  ? <img src={game.background_image} alt={game.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  : <div className="w-full h-full flex items-center justify-center text-slate-600 text-xs">No Image</div>
                }
              </div>
              <div className="p-3">
                <h3 className="text-white text-sm font-semibold truncate">{game.name}</h3>
                {game.genres?.[0] && <p className="text-slate-400 text-xs mt-0.5">{game.genres[0].name}</p>}
                <div className="flex items-center justify-between mt-3">
                  {game.rating != null && (
                    <div className="flex items-center gap-1">
                      <span className="text-[#52E6A3] text-xs font-bold">{game.rating.toFixed(1)}</span>
                      <span className="text-slate-600 text-xs">/ 5</span>
                    </div>
                  )}
                  <button
                    onClick={() => addToLibrary(game)}
                    className="ml-auto text-xs bg-slate-700 hover:bg-[#E65252] text-white px-3 py-1 rounded-lg transition-colors"
                  >
                    + Add
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
