import { useEffect, useState } from 'react';
import { PenLine, X, ThumbsUp } from 'lucide-react';
import api from '../services/api';
import StarRating from '../components/StarRating';
import RatingSlider from '../components/RatingSlider';

interface UserGame {
  id: number;
  rating?: number;
  notes?: string;
  addedAt: string;
  status: string;
  game: { id: number; title: string; genre?: string; coverUrl?: string };
}

export default function Reviews() {
  const [reviews, setReviews] = useState<UserGame[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [userGames, setUserGames] = useState<UserGame[]>([]);
  const [selectedId, setSelectedId] = useState<number | ''>('');
  const [rating, setRating] = useState(70);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.get('/usergames').then(r => {
      const all: UserGame[] = r.data;
      setUserGames(all);
      setReviews(all.filter(ug => ug.notes && ug.notes.trim().length > 0));
    }).catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedId) return;
    setSubmitting(true);
    try {
      const ug = userGames.find(g => g.id === selectedId);
      if (!ug) return;
      const r = await api.put(`/usergames/${selectedId}`, {
        status: ug.status,
        rating,
        notes,
        platform: undefined,
      });
      setUserGames(prev => prev.map(g => g.id === selectedId ? { ...g, ...r.data } : g));
      setReviews(prev => {
        const existing = prev.find(g => g.id === selectedId);
        const updated = { ...ug, rating, notes };
        return existing ? prev.map(g => g.id === selectedId ? updated : g) : [...prev, updated];
      });
      setShowForm(false);
      setSelectedId('');
      setRating(70);
      setNotes('');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-white text-2xl font-bold">Reviews</h1>
        <button
          onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-2 px-4 py-2 bg-[#0CD5EB] hover:bg-[#0bbfd4] text-slate-900 font-semibold rounded-lg text-sm transition-colors"
        >
          <PenLine className="w-4 h-4" />
          Write Review
        </button>
      </div>

      {/* Write Review Form */}
      {showForm && (
        <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-semibold">Write a Review</h2>
            <button onClick={() => setShowForm(false)} className="text-slate-500 hover:text-white"><X className="w-4 h-4" /></button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">Game</label>
              <select
                value={selectedId}
                onChange={e => setSelectedId(Number(e.target.value))}
                required
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm"
              >
                <option value="">Select a game...</option>
                {userGames.map(ug => (
                  <option key={ug.id} value={ug.id}>{ug.game.title}</option>
                ))}
              </select>
            </div>
            <RatingSlider value={rating} onChange={setRating} label="Score" />
            <div>
              <label className="block text-sm text-slate-400 mb-1">Review</label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                required
                rows={4}
                placeholder="Share your thoughts about this game..."
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0CD5EB] resize-none"
              />
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={() => setShowForm(false)} className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-2 rounded-lg text-sm">Cancel</button>
              <button type="submit" disabled={submitting} className="flex-1 bg-[#0CD5EB] hover:bg-[#0bbfd4] text-slate-900 font-semibold py-2 rounded-lg text-sm disabled:opacity-50">
                {submitting ? 'Saving...' : 'Post Review'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Review Cards */}
      {reviews.length === 0 ? (
        <div className="text-center py-20 text-slate-500">
          No reviews yet. Write your first one!
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map(ug => (
            <div key={ug.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex gap-4">
              {/* Cover */}
              <div className="w-14 h-20 bg-slate-800 rounded-lg overflow-hidden shrink-0">
                {ug.game.coverUrl
                  ? <img src={ug.game.coverUrl} alt={ug.game.title} className="w-full h-full object-cover" />
                  : <div className="w-full h-full bg-slate-700" />
                }
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div>
                    <h3 className="text-white font-semibold">{ug.game.title}</h3>
                    {ug.game.genre && <p className="text-slate-500 text-xs">{ug.game.genre}</p>}
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <StarRating value={Math.round((ug.rating ?? 0) / 20)} readonly size={16} />
                    <span className="text-[#E65252] font-bold text-sm">{ug.rating ?? '—'}</span>
                  </div>
                </div>
                <p className="text-slate-300 text-sm leading-relaxed mt-2">{ug.notes}</p>
                <div className="flex items-center gap-4 mt-3">
                  <span className="text-slate-600 text-xs">{new Date(ug.addedAt).toLocaleDateString()}</span>
                  <button className="flex items-center gap-1 text-slate-500 hover:text-[#52E6A3] text-xs transition-colors">
                    <ThumbsUp className="w-3 h-3" /> Helpful
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
