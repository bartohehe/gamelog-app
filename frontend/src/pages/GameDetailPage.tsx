import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Trash2 } from 'lucide-react';
import { getGameById } from '../services/gamesService';
import { getLibrary, updateLibraryItem, removeFromLibrary } from '../services/libraryService';
import StatusBadge from '../components/StatusBadge';
import ScoreSlider from '../components/ScoreSlider';
import AddToLibraryModal from '../components/AddToLibraryModal';
import type { GameDto, UserGameDto, GameStatus, UpdateLibraryItemDto } from '../types';

const STATUSES: { value: GameStatus; label: string }[] = [
  { value: 'Planned', label: 'Planowane' },
  { value: 'InProgress', label: 'W trakcie' },
  { value: 'Completed', label: 'Ukończone' },
  { value: 'Abandoned', label: 'Porzucone' },
];

const PLATFORMS = ['PC', 'PS5', 'PS4', 'Xbox Series X', 'Xbox One', 'Nintendo Switch', 'Mobile', 'Inne'];

export default function GameDetailPage() {
  const { igdbId } = useParams<{ igdbId: string }>();
  const navigate = useNavigate();
  const [game, setGame] = useState<GameDto | null>(null);
  const [libraryItem, setLibraryItem] = useState<UserGameDto | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<UpdateLibraryItemDto>({
    status: 'Planned',
    platform: 'PC',
    score: undefined,
    review: '',
  });

  useEffect(() => {
    if (!igdbId) return;
    const id = Number(igdbId);

    getGameById(id).then(setGame).catch(() => {});

    getLibrary().then(lib => {
      const item = lib.find(g => g.igdbId === id) ?? null;
      setLibraryItem(item);
      if (item) {
        setForm({
          status: item.status,
          platform: item.platform,
          score: item.score,
          review: item.review ?? '',
        });
      }
    }).catch(() => {});
  }, [igdbId]);

  const handleSave = async () => {
    if (!libraryItem) return;
    setSaving(true);
    try {
      const updated = await updateLibraryItem(libraryItem.id, form);
      setLibraryItem(updated);
    } catch { /* ignore */ }
    finally { setSaving(false); }
  };

  const handleRemove = async () => {
    if (!libraryItem) return;
    if (!confirm('Usunąć tę grę z biblioteki?')) return;
    await removeFromLibrary(libraryItem.id);
    setLibraryItem(null);
  };

  if (!game) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-2 border-accent-purple border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <main className="max-w-4xl mx-auto px-6 py-10">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-text-primary/50 hover:text-text-primary transition-colors mb-6 text-sm"
      >
        <ArrowLeft size={16} /> Wróć
      </button>

      {/* Game header */}
      <div className="flex gap-6 mb-8">
        {game.coverImageUrl ? (
          <img src={game.coverImageUrl} alt={game.title} className="w-32 h-44 object-cover rounded-xl flex-shrink-0" />
        ) : (
          <div className="w-32 h-44 bg-bg-card rounded-xl flex items-center justify-center text-4xl flex-shrink-0">🎮</div>
        )}
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold text-text-primary">{game.title}</h1>
          {game.releaseYear && <p className="text-text-primary/40 text-sm">{game.releaseYear}</p>}
          {game.genres.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              {game.genres.map(g => (
                <span key={g} className="bg-white/5 text-text-primary/60 text-xs px-2.5 py-1 rounded-full border border-white/10">{g}</span>
              ))}
            </div>
          )}
          {libraryItem && <StatusBadge status={libraryItem.status} />}
        </div>
      </div>

      {/* Not in library */}
      {!libraryItem && (
        <div className="bg-bg-card rounded-xl p-6 border border-white/10 text-center">
          <p className="text-text-primary/50 mb-4">Ta gra nie jest jeszcze w Twojej bibliotece.</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-accent-purple text-white px-6 py-2.5 rounded-lg hover:bg-accent-purple/80 transition-colors"
          >
            Dodaj do biblioteki
          </button>
        </div>
      )}

      {/* In library — edit form */}
      {libraryItem && (
        <div className="bg-bg-card rounded-xl p-6 border border-white/10 flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-text-primary">Moje dane</h2>
            <button
              onClick={handleRemove}
              className="text-text-primary/30 hover:text-red-400 transition-colors flex items-center gap-1 text-sm"
            >
              <Trash2 size={14} /> Usuń
            </button>
          </div>

          {/* Status */}
          <div>
            <label className="text-sm text-text-primary/60 mb-2 block">Status</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {STATUSES.map(s => (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, status: s.value }))}
                  className={`py-2 px-3 rounded-lg text-sm font-medium transition-all border ${
                    form.status === s.value
                      ? 'bg-accent-purple border-accent-purple text-white'
                      : 'bg-bg-primary border-white/10 text-text-primary/60 hover:border-accent-purple/50'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Platform */}
          <div>
            <label className="text-sm text-text-primary/60 mb-2 block">Platforma</label>
            <select
              value={form.platform}
              onChange={e => setForm(f => ({ ...f, platform: e.target.value }))}
              className="w-full bg-bg-primary border border-white/10 rounded-lg px-4 py-2.5 text-text-primary text-sm focus:outline-none focus:border-accent-purple"
            >
              {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>

          {/* Score */}
          <div>
            <ScoreSlider
              value={form.score}
              onChange={val => setForm(f => ({ ...f, score: val }))}
            />
          </div>

          {/* Review */}
          <div>
            <label className="text-sm text-text-primary/60 mb-2 block">Recenzja</label>
            <textarea
              value={form.review ?? ''}
              onChange={e => setForm(f => ({ ...f, review: e.target.value }))}
              rows={4}
              placeholder="Napisz kilka słów o tej grze..."
              className="w-full bg-bg-primary border border-white/10 rounded-lg px-4 py-3 text-text-primary text-sm focus:outline-none focus:border-accent-purple resize-none placeholder-text-primary/30"
            />
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-accent-purple text-white py-2.5 rounded-lg font-medium hover:bg-accent-purple/80 transition-colors disabled:opacity-50"
          >
            {saving ? 'Zapisywanie...' : 'Zapisz zmiany'}
          </button>
        </div>
      )}

      {showAddModal && (
        <AddToLibraryModal
          game={game}
          onClose={() => setShowAddModal(false)}
          onAdded={() => {
            setShowAddModal(false);
            // Reload library item
            getLibrary().then(lib => {
              const item = lib.find(g => g.igdbId === Number(igdbId)) ?? null;
              setLibraryItem(item);
              if (item) setForm({ status: item.status, platform: item.platform, score: item.score, review: item.review ?? '' });
            }).catch(() => {});
          }}
        />
      )}
    </main>
  );
}
