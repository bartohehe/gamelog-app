import { useState } from 'react';
import { X } from 'lucide-react';
import type { GameDto, GameStatus, AddToLibraryDto } from '../types';
import { addToLibrary } from '../services/libraryService';

const STATUSES: { value: GameStatus; label: string }[] = [
  { value: 'Planned', label: 'Planowane' },
  { value: 'InProgress', label: 'W trakcie' },
  { value: 'Completed', label: 'Ukończone' },
  { value: 'Abandoned', label: 'Porzucone' },
];

const PLATFORMS = ['PC', 'PS5', 'PS4', 'Xbox Series X', 'Xbox One', 'Nintendo Switch', 'Mobile', 'Inne'];

interface Props {
  game: GameDto;
  onClose: () => void;
  onAdded: () => void;
}

export default function AddToLibraryModal({ game, onClose, onAdded }: Props) {
  const [status, setStatus] = useState<GameStatus>('Planned');
  const [platform, setPlatform] = useState('PC');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const dto: AddToLibraryDto = { igdbId: game.igdbId, status, platform };
      await addToLibrary(dto);
      onAdded();
      onClose();
    } catch (err: any) {
      if (err.response?.status === 409) {
        setError('Ta gra jest już w Twojej bibliotece.');
      } else {
        setError('Wystąpił błąd. Spróbuj ponownie.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-bg-card rounded-2xl w-full max-w-md border border-white/10 shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-white/10">
          <div className="flex gap-4">
            {game.coverImageUrl && (
              <img src={game.coverImageUrl} alt={game.title} className="w-14 h-14 rounded-lg object-cover" />
            )}
            <div>
              <h2 className="text-text-primary font-bold text-lg leading-tight">{game.title}</h2>
              <p className="text-text-primary/40 text-sm mt-0.5">Dodaj do biblioteki</p>
            </div>
          </div>
          <button onClick={onClose} className="text-text-primary/40 hover:text-text-primary transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-5">
          {/* Status */}
          <div>
            <label className="text-sm text-text-primary/60 mb-2 block">Status</label>
            <div className="grid grid-cols-2 gap-2">
              {STATUSES.map(s => (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => setStatus(s.value)}
                  className={`py-2 px-3 rounded-lg text-sm font-medium transition-all border ${
                    status === s.value
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
              value={platform}
              onChange={e => setPlatform(e.target.value)}
              className="w-full bg-bg-primary border border-white/10 rounded-lg px-4 py-2.5 text-text-primary text-sm focus:outline-none focus:border-accent-purple"
            >
              {PLATFORMS.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <div className="flex gap-3 mt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-lg border border-white/10 text-text-primary/60 hover:bg-white/5 transition-colors text-sm"
            >
              Anuluj
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 rounded-lg bg-accent-purple text-white font-medium hover:bg-accent-purple/80 transition-colors disabled:opacity-50 text-sm"
            >
              {loading ? 'Dodawanie...' : 'Dodaj do biblioteki'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
