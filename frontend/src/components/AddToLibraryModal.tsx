import { useState } from 'react';
import type { GameDto, GameStatus, AddToLibraryDto } from '../types';
import { addToLibrary } from '../services/libraryService';
import { useTheme } from '../contexts/ThemeContext';
import Cover from './Cover';

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
  const { t } = useTheme();
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
    } catch (err: unknown) {
      const axiosErr = err as { response?: { status?: number; data?: unknown } };
      if (axiosErr?.response?.status === 409) {
        setError('Ta gra jest już w Twojej bibliotece.');
      } else if (axiosErr?.response?.status === 401) {
        setError('Brak autoryzacji. Zaloguj się ponownie.');
      } else if (axiosErr?.response) {
        const data = axiosErr.response.data;
        const msg = typeof data === 'string' ? data : JSON.stringify(data);
        setError(`Błąd ${axiosErr.response.status}: ${msg}`);
      } else {
        setError(`Błąd sieci: ${(err as Error)?.message ?? 'nieznany'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.65)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 50,
        padding: 16,
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{
          background: t.bgCard,
          border: `1px solid ${t.border}`,
          borderRadius: 14,
          width: '100%',
          maxWidth: 440,
          boxShadow: `0 24px 80px rgba(0,0,0,0.5)`,
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '18px 20px',
            borderBottom: `1px solid ${t.border}`,
            gap: 14,
          }}
        >
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flex: 1, minWidth: 0 }}>
            <div style={{ width: 44, height: 58, borderRadius: 6, overflow: 'hidden', flexShrink: 0 }}>
              <Cover title={game.title} coverImageUrl={game.coverImageUrl} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  fontWeight: 700,
                  fontSize: 15,
                  color: t.text,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {game.title}
              </div>
              <div style={{ fontSize: 12, color: t.textMuted, marginTop: 2 }}>Dodaj do biblioteki</div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: t.textMuted,
              cursor: 'pointer',
              fontSize: 18,
              lineHeight: 1,
              padding: 4,
              flexShrink: 0,
            }}
          >
            ✕
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* Status */}
          <div>
            <label style={{ fontSize: 12, color: t.textMuted, display: 'block', marginBottom: 8 }}>Status</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {STATUSES.map(s => {
                const active = status === s.value;
                return (
                  <button
                    key={s.value}
                    type="button"
                    onClick={() => setStatus(s.value)}
                    style={{
                      background: active ? t.accent : t.bgElevated,
                      color: active ? '#fff' : t.textMuted,
                      border: `1px solid ${active ? t.accent : t.border}`,
                      borderRadius: 8,
                      padding: '9px 12px',
                      fontSize: 13,
                      fontWeight: active ? 600 : 400,
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                      fontFamily: 'Inter, sans-serif',
                    }}
                  >
                    {s.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Platform */}
          <div>
            <label style={{ fontSize: 12, color: t.textMuted, display: 'block', marginBottom: 8 }}>Platforma</label>
            <select
              value={platform}
              onChange={e => setPlatform(e.target.value)}
              style={{
                width: '100%',
                background: t.inputBg,
                border: `1px solid ${t.inputBorder}`,
                borderRadius: 8,
                padding: '10px 14px',
                color: t.text,
                fontSize: 13,
                outline: 'none',
                fontFamily: 'Inter, sans-serif',
              }}
            >
              {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>

          {error && <p style={{ color: '#ef4444', fontSize: 13 }}>{error}</p>}

          <div style={{ display: 'flex', gap: 10 }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                background: 'transparent',
                border: `1px solid ${t.border}`,
                color: t.textMuted,
                borderRadius: 8,
                padding: '10px',
                fontSize: 13,
                cursor: 'pointer',
                fontFamily: 'Inter, sans-serif',
              }}
            >
              Anuluj
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                flex: 1,
                background: t.accent,
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                padding: '10px',
                fontSize: 13,
                fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.6 : 1,
                fontFamily: 'Inter, sans-serif',
              }}
            >
              {loading ? 'Dodawanie...' : 'Dodaj do biblioteki'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
