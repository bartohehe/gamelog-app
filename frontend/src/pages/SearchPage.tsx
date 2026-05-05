import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { searchGames } from '../services/gamesService';
import { getLibrary } from '../services/libraryService';
import { useTheme } from '../contexts/ThemeContext';
import AddToLibraryModal from '../components/AddToLibraryModal';
import Cover from '../components/Cover';
import type { GameDto, UserGameDto } from '../types';

const POPULAR_TAGS = ["Elden Ring", "Baldur's Gate 3", "Cyberpunk 2077", "Hades II"];

export default function SearchPage() {
  const { t } = useTheme();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GameDto[]>([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const [selectedGame, setSelectedGame] = useState<GameDto | null>(null);
  const [library, setLibrary] = useState<UserGameDto[]>([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    getLibrary().then(setLibrary).catch(() => {});
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) {
      setResults([]);
      setSearched(false);
      return;
    }
    debounceRef.current = setTimeout(() => {
      setSearching(true);
      searchGames(query)
        .then(data => {
          setResults(data);
          setSearched(true);
        })
        .catch(() => setResults([]))
        .finally(() => setSearching(false));
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  const isInLib = (igdbId: number) => library.some(g => g.igdbId === igdbId);

  return (
    <div style={{ flex: 1, overflow: 'auto', padding: '32px 36px' }}>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 26, fontWeight: 700, color: t.text, marginBottom: 24 }}>
          Wyszukaj gry
        </h1>

        {/* Search input */}
        <div style={{ position: 'relative', marginBottom: 32 }}>
          <svg
            style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            stroke={t.textFaint}
            strokeWidth="1.5"
          >
            <circle cx="6.5" cy="6.5" r="4.5" />
            <line x1="10" y1="10" x2="14" y2="14" />
          </svg>
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Wpisz tytuł gry..."
            style={{
              width: '100%',
              background: t.bgCard,
              border: `1px solid ${t.inputBorder}`,
              borderRadius: 12,
              padding: '14px 14px 14px 44px',
              color: t.text,
              fontSize: 16,
              fontFamily: 'Inter, sans-serif',
              outline: 'none',
            }}
            onFocus={e => { (e.target as HTMLInputElement).style.borderColor = t.accent; }}
            onBlur={e => { (e.target as HTMLInputElement).style.borderColor = t.inputBorder; }}
          />
          {searching && (
            <div style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', fontSize: 12, color: t.textFaint }}>
              szukam...
            </div>
          )}
        </div>

        {/* Popular tags */}
        {!searched && (
          <div>
            <div
              style={{
                fontSize: 11,
                color: t.textFaint,
                letterSpacing: 1.5,
                textTransform: 'uppercase',
                marginBottom: 12,
              }}
            >
              Popularne
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {POPULAR_TAGS.map(s => (
                <button
                  key={s}
                  onClick={() => setQuery(s)}
                  style={{
                    padding: '7px 14px',
                    background: t.tagBg,
                    border: `1px solid ${t.border}`,
                    borderRadius: 20,
                    color: t.tagText,
                    fontSize: 12,
                    cursor: 'pointer',
                    fontFamily: 'Inter, sans-serif',
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* No results */}
        {searched && results.length === 0 && !searching && (
          <p style={{ color: t.textMuted, textAlign: 'center', padding: '40px 0' }}>
            Brak wyników dla &quot;{query}&quot;
          </p>
        )}

        {/* Results */}
        {results.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div
              style={{
                fontSize: 11,
                color: t.textFaint,
                letterSpacing: 1.5,
                textTransform: 'uppercase',
                marginBottom: 4,
              }}
            >
              Wyniki ({results.length})
            </div>
            {results.map(game => (
              <div
                key={game.igdbId}
                style={{
                  background: t.bgCard,
                  border: `1px solid ${t.border}`,
                  borderRadius: 10,
                  padding: '12px 16px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  transition: 'all 0.15s',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = t.borderHover; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = t.border; }}
                onClick={() => navigate(`/game/${game.igdbId}`)}
              >
                <div style={{ width: 44, height: 58, borderRadius: 6, overflow: 'hidden', flexShrink: 0 }}>
                  <Cover title={game.title} coverImageUrl={game.coverImageUrl} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, color: t.text, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {game.title}
                  </div>
                  <div style={{ fontSize: 12, color: t.textMuted, marginTop: 2 }}>
                    {[game.releaseYear, game.genres.slice(0, 2).join(', ')].filter(Boolean).join(' · ')}
                  </div>
                </div>
                {isInLib(game.igdbId) ? (
                  <span
                    style={{
                      fontSize: 11,
                      color: t.statusCompleted,
                      background: `${t.statusCompleted}18`,
                      border: `1px solid ${t.statusCompleted}35`,
                      borderRadius: 20,
                      padding: '3px 10px',
                      flexShrink: 0,
                    }}
                    onClick={e => e.stopPropagation()}
                  >
                    ✓ W bibliotece
                  </span>
                ) : (
                  <button
                    onClick={e => { e.stopPropagation(); setSelectedGame(game); }}
                    style={{
                      background: `${t.accent}18`,
                      color: t.accent,
                      border: `1px solid ${t.accent}40`,
                      borderRadius: 8,
                      padding: '7px 16px',
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      fontFamily: 'Inter, sans-serif',
                      flexShrink: 0,
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = t.accent; (e.currentTarget as HTMLButtonElement).style.color = '#fff'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = `${t.accent}18`; (e.currentTarget as HTMLButtonElement).style.color = t.accent; }}
                  >
                    + Dodaj
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedGame && (
        <AddToLibraryModal
          game={selectedGame}
          onClose={() => setSelectedGame(null)}
          onAdded={() => {
            setSelectedGame(null);
            getLibrary().then(setLibrary).catch(() => {});
          }}
        />
      )}
    </div>
  );
}
