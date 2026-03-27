import { useEffect, useState } from 'react';
import { Search, Plus, X, Swords, Monitor } from 'lucide-react';
import api from '../services/api';
import GameCard from '../components/GameCard';
import RatingSlider from '../components/RatingSlider';

interface Game { id: number; title: string; genre?: string; coverUrl?: string; gameMode: string; }
interface UserGame {
  id: number; status: string; rating?: number; notes?: string; platform?: string; addedAt: string;
  game: Game;
}
interface PlayerProfile {
  id: number; nickname: string; rank?: string; region?: string;
  game: Game;
}

type Tab = 'singleplayer' | 'multiplayer';

const STATUSES = ['playing', 'completed', 'backlog', 'dropped'];

export default function Library() {
  const [tab, setTab] = useState<Tab>('singleplayer');
  const [userGames, setUserGames] = useState<UserGame[]>([]);
  const [profiles, setProfiles] = useState<PlayerProfile[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [searchResults, setSearchResults] = useState<Game[]>([]);
  const [searchQ, setSearchQ] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [editTarget, setEditTarget] = useState<UserGame | null>(null);

  // Add form state
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [status, setStatus] = useState('backlog');
  const [rating, setRating] = useState(50);
  const [notes, setNotes] = useState('');
  const [platform, setPlatform] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.get('/usergames').then(r => setUserGames(r.data)).catch(() => {});
    api.get('/player-profiles').then(r => setProfiles(r.data)).catch(() => {});
    api.get('/games').then(r => setGames(r.data)).catch(() => {});
  }, []);

  const handleGameSearch = async (q: string) => {
    setSearchQ(q);
    if (q.length < 2) { setSearchResults([]); return; }
    const r = await api.get(`/games/search?q=${encodeURIComponent(q)}`);
    // Normalize RAWG response vs local
    const results = Array.isArray(r.data?.results) ? r.data.results.map((g: any) => ({
      id: g.id, title: g.name, genre: g.genres?.[0]?.name, coverUrl: g.background_image, gameMode: 'singleplayer'
    })) : (Array.isArray(r.data) ? r.data : []);
    setSearchResults(results);
  };

  const handleAdd = async () => {
    if (!selectedGame) return;
    setSubmitting(true);
    try {
      // Ensure game exists in local DB
      let gameId = games.find(g => g.title === selectedGame.title)?.id;
      if (!gameId) {
        const r = await api.post('/games', { title: selectedGame.title, genre: selectedGame.genre, coverUrl: selectedGame.coverUrl, gameMode: selectedGame.gameMode });
        gameId = r.data.id;
        setGames(prev => [...prev, r.data]);
      }
      const r = await api.post('/usergames', { gameId, status, rating, notes, platform });
      setUserGames(prev => [...prev, r.data]);
      resetForm();
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async () => {
    if (!editTarget) return;
    setSubmitting(true);
    try {
      const r = await api.put(`/usergames/${editTarget.id}`, { status, rating, notes, platform });
      setUserGames(prev => prev.map(ug => ug.id === editTarget.id ? { ...ug, ...r.data } : ug));
      setEditTarget(null);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    await api.delete(`/usergames/${id}`);
    setUserGames(prev => prev.filter(ug => ug.id !== id));
  };

  const openEdit = (ug: UserGame) => {
    setEditTarget(ug);
    setStatus(ug.status);
    setRating(ug.rating ?? 50);
    setNotes(ug.notes ?? '');
    setPlatform(ug.platform ?? '');
  };

  const resetForm = () => {
    setShowAdd(false); setSelectedGame(null); setSearchQ(''); setSearchResults([]);
    setStatus('backlog'); setRating(50); setNotes(''); setPlatform('');
  };

  const spGames = userGames.filter(ug => ug.game.gameMode !== 'multiplayer');
  const mpGames = userGames.filter(ug => ug.game.gameMode === 'multiplayer');
  const spStats = {
    total: spGames.length,
    playing: spGames.filter(g => g.status === 'playing').length,
    completed: spGames.filter(g => g.status === 'completed').length,
    backlog: spGames.filter(g => g.status === 'backlog').length,
  };

  const tierColors: Record<string, string> = {
    Diamond: 'text-[#0CD5EB]', Platinum: 'text-slate-300', Gold: 'text-yellow-400',
    Silver: 'text-slate-400', Bronze: 'text-orange-400', Iron: 'text-slate-600',
  };

  return (
    <main className="max-w-7xl mx-auto px-4 py-8">
      {/* Tabs */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => setTab('singleplayer')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === 'singleplayer' ? 'bg-[#E65252] text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
        >
          <Monitor className="w-4 h-4" /> Singleplayer
        </button>
        <button
          onClick={() => setTab('multiplayer')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === 'multiplayer' ? 'bg-[#E65252] text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
        >
          <Swords className="w-4 h-4" /> Multiplayer
        </button>
        <button
          onClick={() => setShowAdd(true)}
          className="ml-auto flex items-center gap-2 px-4 py-2 bg-[#E65252] text-white rounded-lg text-sm font-medium hover:bg-[#d44444] transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Game
        </button>
      </div>

      {tab === 'singleplayer' && (
        <>
          {/* Stats row */}
          <div className="grid grid-cols-4 gap-3 mb-6">
            {[
              { label: 'Total', value: spStats.total, color: 'text-white' },
              { label: 'Playing', value: spStats.playing, color: 'text-[#5284E6]' },
              { label: 'Completed', value: spStats.completed, color: 'text-[#52E6A3]' },
              { label: 'Backlog', value: spStats.backlog, color: 'text-slate-400' },
            ].map(s => (
              <div key={s.label} className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-center">
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-slate-500 text-xs mt-1">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Game grid */}
          {spGames.length === 0 ? (
            <div className="text-center py-20 text-slate-500">No singleplayer games yet. Add one!</div>
          ) : (
            <div className="grid grid-cols-3 gap-4">
              {spGames.map(ug => (
                <div key={ug.id} className="relative group">
                  <GameCard
                    title={ug.game.title}
                    genre={ug.game.genre}
                    coverUrl={ug.game.coverUrl}
                    status={ug.status}
                    rating={ug.rating}
                    onClick={() => openEdit(ug)}
                  />
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(ug.id); }}
                    className="absolute top-2 left-2 bg-slate-900/80 text-slate-400 hover:text-[#E65252] p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {tab === 'multiplayer' && (
        <div className="space-y-3">
          {profiles.length === 0 && mpGames.length === 0 ? (
            <div className="text-center py-20 text-slate-500">No multiplayer games tracked yet.</div>
          ) : (
            [...mpGames].map(ug => {
              const profile = profiles.find(p => p.game.id === ug.game.id);
              const tierKey = profile?.rank?.split(' ')[0] ?? '';
              return (
                <div key={ug.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center gap-4">
                  <div className="w-12 h-12 bg-slate-800 rounded-lg overflow-hidden shrink-0">
                    {ug.game.coverUrl && <img src={ug.game.coverUrl} alt={ug.game.title} className="w-full h-full object-cover" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-semibold text-sm truncate">{ug.game.title}</p>
                    {profile && (
                      <p className="text-xs mt-0.5">
                        <span className={tierColors[tierKey] ?? 'text-slate-400'}>{profile.rank}</span>
                        {profile.region && <span className="text-slate-600"> · {profile.region}</span>}
                        {profile.nickname && <span className="text-slate-500"> · {profile.nickname}</span>}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${ug.status === 'playing' ? 'bg-[#5284E6]/20 text-[#5284E6]' : 'bg-slate-700 text-slate-400'}`}>
                      {ug.status}
                    </span>
                    {ug.rating != null && <span className="text-[#E65252] text-sm font-bold">{ug.rating}</span>}
                    <button onClick={() => handleDelete(ug.id)} className="text-slate-600 hover:text-[#E65252]"><X className="w-4 h-4" /></button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Add Game Dialog */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-white font-bold text-lg">Add Game</h2>
              <button onClick={resetForm} className="text-slate-500 hover:text-white"><X className="w-5 h-5" /></button>
            </div>

            {/* Search */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
              <input
                value={searchQ}
                onChange={e => handleGameSearch(e.target.value)}
                placeholder="Search for a game..."
                className="w-full bg-slate-800 border border-slate-700 text-white pl-9 pr-4 py-2 rounded-lg text-sm focus:outline-none focus:border-[#E65252]"
              />
            </div>

            {searchResults.length > 0 && !selectedGame && (
              <div className="max-h-40 overflow-y-auto mb-4 space-y-1 border border-slate-700 rounded-lg p-2">
                {searchResults.map(g => (
                  <button
                    key={g.id}
                    onClick={() => { setSelectedGame(g); setSearchQ(g.title); setSearchResults([]); }}
                    className="w-full text-left px-3 py-2 rounded hover:bg-slate-700 text-sm text-white"
                  >
                    {g.title}
                    {g.genre && <span className="text-slate-500 ml-2 text-xs">{g.genre}</span>}
                  </button>
                ))}
              </div>
            )}

            {selectedGame && (
              <div className="bg-slate-800 rounded-lg px-3 py-2 mb-4 flex items-center justify-between">
                <span className="text-white text-sm font-medium">{selectedGame.title}</span>
                <button onClick={() => { setSelectedGame(null); setSearchQ(''); }} className="text-slate-500 hover:text-white"><X className="w-4 h-4" /></button>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Status</label>
                <select
                  value={status}
                  onChange={e => setStatus(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none"
                >
                  {STATUSES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Platform</label>
                <input
                  value={platform}
                  onChange={e => setPlatform(e.target.value)}
                  placeholder="PC, PS5, Xbox..."
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none"
                />
              </div>
              <RatingSlider value={rating} onChange={setRating} />
              <div>
                <label className="block text-sm text-slate-400 mb-1">Notes</label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  rows={2}
                  placeholder="Optional notes..."
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-5">
              <button onClick={resetForm} className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-2 rounded-lg text-sm transition-colors">Cancel</button>
              <button
                onClick={handleAdd}
                disabled={!selectedGame || submitting}
                className="flex-1 bg-[#E65252] hover:bg-[#d44444] text-white py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
              >
                {submitting ? 'Adding...' : 'Add Game'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Dialog */}
      {editTarget && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-white font-bold text-lg">Edit: {editTarget.game.title}</h2>
              <button onClick={() => setEditTarget(null)} className="text-slate-500 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Status</label>
                <select
                  value={status}
                  onChange={e => setStatus(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm"
                >
                  {STATUSES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Platform</label>
                <input
                  value={platform}
                  onChange={e => setPlatform(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <RatingSlider value={rating} onChange={setRating} />
              <div>
                <label className="block text-sm text-slate-400 mb-1">Notes</label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  rows={2}
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm resize-none"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setEditTarget(null)} className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-2 rounded-lg text-sm">Cancel</button>
              <button
                onClick={handleEdit}
                disabled={submitting}
                className="flex-1 bg-[#E65252] hover:bg-[#d44444] text-white py-2 rounded-lg text-sm font-medium disabled:opacity-50"
              >
                {submitting ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
