import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getLibrary } from '../services/libraryService';
import { useTheme } from '../contexts/ThemeContext';
import Cover from '../components/Cover';
import StatusBadge from '../components/StatusBadge';
import ScoreBadge from '../components/ScoreBadge';
import type { UserGameDto, GameStatus } from '../types';

const FILTER_OPTIONS: { value: GameStatus | 'All'; label: string }[] = [
  { value: 'All', label: 'Wszystkie' },
  { value: 'InProgress', label: 'W trakcie' },
  { value: 'Planned', label: 'Planowane' },
  { value: 'Completed', label: 'Ukończone' },
  { value: 'Abandoned', label: 'Porzucone' },
];

type SortKey = 'title' | 'score' | 'date';
type ViewMode = 'grid' | 'list';

function GridCard({ game, onClick }: { game: UserGameDto; onClick: () => void }) {
  const { t } = useTheme();
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: t.bgCard,
        border: `1px solid ${hovered ? t.borderHover : t.border}`,
        borderRadius: 10,
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'all 0.15s',
        transform: hovered ? 'translateY(-2px)' : 'translateY(0)',
        boxShadow: hovered ? `0 8px 24px ${t.accentGlow}` : 'none',
      }}
    >
      <div style={{ height: 215, position: 'relative' }}>
        <Cover title={game.title} coverImageUrl={game.coverImageUrl} />
        <div style={{ position: 'absolute', top: 7, right: 7 }}>
          <StatusBadge status={game.status} small />
        </div>
        {game.score != null && (
          <div style={{ position: 'absolute', bottom: 7, left: 7 }}>
            <ScoreBadge score={game.score} size="sm" />
          </div>
        )}
      </div>
      <div style={{ padding: '9px 11px' }}>
        <div
          style={{
            fontWeight: 600,
            fontSize: 12.5,
            color: t.text,
            lineHeight: 1.3,
            marginBottom: 2,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {game.title}
        </div>
      </div>
    </div>
  );
}

function ListCard({ game, onClick }: { game: UserGameDto; onClick: () => void }) {
  const { t } = useTheme();
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? t.bgHover : t.bgCard,
        border: `1px solid ${hovered ? t.borderHover : t.border}`,
        borderRadius: 10,
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        cursor: 'pointer',
        transition: 'all 0.15s',
      }}
    >
      <div style={{ width: 40, height: 54, borderRadius: 5, overflow: 'hidden', flexShrink: 0 }}>
        <Cover title={game.title} coverImageUrl={game.coverImageUrl} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, color: t.text, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {game.title}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
        <StatusBadge status={game.status} small />
        <ScoreBadge score={game.score} size="sm" />
      </div>
    </div>
  );
}

export default function LibraryPage() {
  const { t } = useTheme();
  const navigate = useNavigate();
  const [games, setGames] = useState<UserGameDto[]>([]);
  const [filter, setFilter] = useState<GameStatus | 'All'>('All');
  const [sort, setSort] = useState<SortKey>('title');
  const [view, setView] = useState<ViewMode>('grid');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getLibrary()
      .then(setGames)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = (filter === 'All' ? games : games.filter(g => g.status === filter))
    .slice()
    .sort((a, b) => {
      if (sort === 'score') return (b.score ?? -1) - (a.score ?? -1);
      if (sort === 'date') return new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime();
      return a.title.localeCompare(b.title);
    });

  const countFor = (status: GameStatus | 'All') =>
    status === 'All' ? games.length : games.filter(g => g.status === status).length;

  const statusColorFor = (status: GameStatus | 'All'): string => {
    if (status === 'All') return t.accent;
    const map: Record<GameStatus, string> = {
      Planned: t.statusPlanned,
      InProgress: t.statusInProgress,
      Completed: t.statusCompleted,
      Abandoned: t.statusAbandoned,
    };
    return map[status];
  };

  if (loading) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: t.bg }}>
        <div
          style={{
            width: 32,
            height: 32,
            border: `2px solid ${t.accent}`,
            borderTopColor: 'transparent',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
          }}
        />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ flex: 1, overflow: 'auto', padding: '32px 36px' }}>
      <div style={{ maxWidth: 1100 }}>
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 24,
          }}
        >
          <div>
            <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 26, fontWeight: 700, color: t.text }}>
              Moja Biblioteka
            </h1>
            <div style={{ fontSize: 13, color: t.textMuted, marginTop: 4 }}>
              {games.length} gier w kolekcji
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            {/* Sort select */}
            <select
              value={sort}
              onChange={e => setSort(e.target.value as SortKey)}
              style={{
                background: t.bgCard,
                border: `1px solid ${t.border}`,
                color: t.textMuted,
                borderRadius: 8,
                padding: '7px 12px',
                fontSize: 12,
                cursor: 'pointer',
                fontFamily: 'Inter, sans-serif',
                outline: 'none',
              }}
            >
              <option value="title">A-Z</option>
              <option value="score">Ocena</option>
              <option value="date">Data</option>
            </select>

            {/* View toggle */}
            <div
              style={{
                display: 'flex',
                background: t.bgCard,
                border: `1px solid ${t.border}`,
                borderRadius: 8,
                overflow: 'hidden',
              }}
            >
              {(['grid', 'list'] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  style={{
                    padding: '7px 12px',
                    border: 'none',
                    cursor: 'pointer',
                    background: view === v ? t.accent : 'transparent',
                    color: view === v ? '#fff' : t.textMuted,
                    fontSize: 14,
                    transition: 'all 0.15s',
                  }}
                >
                  {v === 'grid' ? '⊞' : '≡'}
                </button>
              ))}
            </div>

            {/* Add game */}
            <button
              onClick={() => navigate('/search')}
              style={{
                padding: '8px 16px',
                background: t.accent,
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: 600,
                boxShadow: `0 0 20px ${t.accentGlow}`,
              }}
            >
              + Dodaj grę
            </button>
          </div>
        </div>

        {/* Filter tabs */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 24, flexWrap: 'wrap' }}>
          {FILTER_OPTIONS.map(opt => {
            const active = filter === opt.value;
            const color = statusColorFor(opt.value);
            return (
              <button
                key={opt.value}
                onClick={() => setFilter(opt.value)}
                style={{
                  padding: '5px 14px',
                  borderRadius: 20,
                  fontSize: 12,
                  cursor: 'pointer',
                  border: `1px solid ${active ? color : t.border}`,
                  background: active ? `${color}20` : 'transparent',
                  color: active ? color : t.textMuted,
                  fontWeight: active ? 600 : 400,
                  fontFamily: 'Inter, sans-serif',
                  transition: 'all 0.15s',
                }}
              >
                {opt.label}
                <span style={{ marginLeft: 5, opacity: 0.7, fontSize: 11 }}>{countFor(opt.value)}</span>
              </button>
            );
          })}
        </div>

        {/* Empty */}
        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 24px', color: t.textMuted }}>
            <p style={{ fontSize: 15 }}>
              {filter === 'All' ? 'Biblioteka jest pusta. Znajdź swoje pierwsze gry!' : 'Brak gier w tej kategorii.'}
            </p>
          </div>
        )}

        {/* Grid view */}
        {view === 'grid' && filtered.length > 0 && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(155px, 1fr))',
              gap: 14,
            }}
          >
            {filtered.map(game => (
              <GridCard key={game.id} game={game} onClick={() => navigate(`/game/${game.igdbId}`)} />
            ))}
          </div>
        )}

        {/* List view */}
        {view === 'list' && filtered.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {filtered.map(game => (
              <ListCard key={game.id} game={game} onClick={() => navigate(`/game/${game.igdbId}`)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
