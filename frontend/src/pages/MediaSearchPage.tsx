import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { addMedia, searchMedia } from '../services/mediaService';
import type { MediaSearchResultDto, MediaType, MediaWatchStatus, AddMediaDto } from '../types';
import {
  TRENDING_MEDIA_SEARCHES,
  MEDIA_GENRE_QUICK,
  MEDIA_TYPE_META,
} from '../constants/popularMedia';

type TypeFilter = 'all' | MediaType;

// ── Add-to-library modal ───────────────────────────────────────────────────────
interface AddModalProps {
  item: MediaSearchResultDto;
  onClose: () => void;
  onAdded: () => void;
}
function AddModal({ item, onClose, onAdded }: AddModalProps) {
  const { t } = useTheme();
  const [status, setStatus] = useState<MediaWatchStatus>('Backlog');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const meta = MEDIA_TYPE_META[item.type];

  const handleAdd = async () => {
    setLoading(true);
    setError('');
    try {
      const dto: AddMediaDto = {
        title: item.title,
        type: item.type,
        year: item.year,
        genres: item.genres,
        creator: item.creator,
        status,
        runtime: item.runtime,
        episodes: item.episodes,
        coverImageUrl: item.coverImageUrl,
        review: '',
      };
      await addMedia(dto);
      onAdded();
      onClose();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { status?: number } };
      if (axiosErr?.response?.status === 409) {
        setError('Ten tytuł jest już w Twojej bibliotece.');
      } else {
        setError('Błąd podczas dodawania. Spróbuj ponownie.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 16 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 14, width: '100%', maxWidth: 420, boxShadow: '0 24px 80px rgba(0,0,0,0.5)', display: 'flex', overflow: 'hidden' }}>
        {/* Cover sidebar */}
        {item.coverImageUrl && (
          <div style={{ width: 100, flexShrink: 0 }}>
            <img src={item.coverImageUrl} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '16px 16px 12px', borderBottom: `1px solid ${t.border}` }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 14, background: `${meta.color}20`, color: meta.color, fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase', border: `1px solid ${meta.color}35` }}>
                  {meta.icon} {meta.label}
                </span>
                {item.year > 0 && <span style={{ fontSize: 11, color: t.textFaint }}>{item.year}</span>}
              </div>
              <div style={{ fontWeight: 700, fontSize: 14, color: t.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</div>
              {item.creator && <div style={{ fontSize: 11, color: t.textMuted, marginTop: 2 }}>{item.creator}</div>}
            </div>
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: t.textMuted, cursor: 'pointer', fontSize: 16, padding: '2px 4px', flexShrink: 0 }}>✕</button>
          </div>

          <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ fontSize: 11, color: t.textMuted, display: 'block', marginBottom: 7 }}>Status</label>
              <div style={{ display: 'flex', gap: 5 }}>
                {(['Backlog', 'Watching', 'Watched'] as MediaWatchStatus[]).map(s => {
                  const labels: Record<MediaWatchStatus, string> = { Backlog: 'Do obejrzenia', Watching: 'W trakcie', Watched: 'Obejrzane' };
                  const colors: Record<MediaWatchStatus, string> = { Backlog: '#94a3b8', Watching: '#f59e0b', Watched: '#22c55e' };
                  const active = status === s;
                  return (
                    <button key={s} onClick={() => setStatus(s)} style={{ flex: 1, padding: '7px 4px', borderRadius: 7, border: `1px solid ${active ? colors[s] : t.border}`, background: active ? `${colors[s]}22` : t.bgElevated, color: active ? colors[s] : t.textMuted, fontSize: 10.5, fontWeight: active ? 600 : 400, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
                      {labels[s]}
                    </button>
                  );
                })}
              </div>
            </div>

            {error && <p style={{ color: '#ef4444', fontSize: 12, margin: 0 }}>{error}</p>}

            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={onClose} style={{ flex: 1, background: 'transparent', border: `1px solid ${t.border}`, color: t.textMuted, borderRadius: 7, padding: '9px', fontSize: 12, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>Anuluj</button>
              <button onClick={handleAdd} disabled={loading} style={{ flex: 1, background: t.accent, color: '#fff', border: 'none', borderRadius: 7, padding: '9px', fontSize: 12, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1, fontFamily: 'Inter, sans-serif' }}>
                {loading ? 'Dodawanie...' : 'Dodaj'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Result row ────────────────────────────────────────────────────────────────
function ResultRow({ item, added, onAdd }: { item: MediaSearchResultDto; added: boolean; onAdd: () => void }) {
  const { t } = useTheme();
  const [hovered, setHovered] = useState(false);
  const meta = MEDIA_TYPE_META[item.type];
  const scoreColor = (item.criticScore ?? 0) >= 80 ? '#22c55e' : (item.criticScore ?? 0) >= 60 ? '#f59e0b' : '#ef4444';

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: hovered ? t.bgHover : t.bgCard, border: `1px solid ${hovered ? t.borderHover : t.border}`, borderRadius: 10, transition: 'all 0.12s' }}
    >
      {/* Cover thumbnail */}
      <div style={{ width: 40, height: 56, borderRadius: 6, overflow: 'hidden', flexShrink: 0, background: `${meta.color}18`, border: `1px solid ${meta.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {item.coverImageUrl
          ? <img src={item.coverImageUrl} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <span style={{ color: meta.color, fontSize: 16 }}>{meta.icon}</span>
        }
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, color: t.text, fontSize: 13.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</div>
        <div style={{ fontSize: 11.5, color: t.textMuted, marginTop: 2 }}>
          {item.creator && <span>{item.creator} · </span>}
          {item.year > 0 && <span>{item.year}</span>}
          {item.genres.length > 0 && <span> · {item.genres.slice(0, 2).join(', ')}</span>}
          {item.runtime && <span> · {item.runtime}</span>}
          {item.episodes && <span> · {item.episodes} odc.</span>}
        </div>
      </div>

      {/* Score */}
      {item.criticScore != null && (
        <span style={{ fontSize: 12, padding: '2px 7px', borderRadius: 6, background: `${scoreColor}18`, color: scoreColor, border: `1px solid ${scoreColor}35`, fontWeight: 700, fontFamily: 'monospace', flexShrink: 0 }}>
          {item.criticScore}
        </span>
      )}

      {/* Type badge */}
      <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 14, background: `${meta.color}18`, color: meta.color, fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase', border: `1px solid ${meta.color}30`, flexShrink: 0 }}>
        {meta.label}
      </span>

      {/* Add button */}
      <button
        onClick={onAdd}
        disabled={added}
        style={{ padding: '6px 14px', background: added ? 'transparent' : hovered ? t.accent : 'transparent', color: added ? t.statusCompleted : hovered ? '#fff' : t.textMuted, border: `1px solid ${added ? t.statusCompleted : hovered ? t.accent : t.border}`, borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: added ? 'default' : 'pointer', fontFamily: 'Inter, sans-serif', transition: 'all 0.15s', flexShrink: 0, minWidth: 70 }}
      >
        {added ? '✓ Dodano' : '+ Dodaj'}
      </button>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function MediaSearchPage() {
  const { t } = useTheme();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [results, setResults] = useState<MediaSearchResultDto[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState(false);
  const [adding, setAdding] = useState<MediaSearchResultDto | null>(null);
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  // Debounce 600ms
  useEffect(() => {
    if (query.trim().length < 2) { setDebounced(''); setResults([]); return; }
    const timer = setTimeout(() => setDebounced(query.trim()), 600);
    return () => clearTimeout(timer);
  }, [query]);

  // Fetch from API when debounced query or type changes
  useEffect(() => {
    if (debounced.length < 2) { setResults([]); return; }
    setSearching(true);
    setSearchError(false);
    searchMedia(debounced, typeFilter)
      .then(data => { setResults(data); setSearching(false); })
      .catch(() => { setSearchError(true); setSearching(false); });
  }, [debounced, typeFilter]);

  const showResults = debounced.length >= 2;

  return (
    <div style={{ flex: 1, overflow: 'auto', padding: '32px 36px' }}>
      <div style={{ maxWidth: 860, margin: '0 auto' }}>
        {/* Back */}
        <button
          onClick={() => navigate('/media')}
          style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: t.textMuted, cursor: 'pointer', fontSize: 13, fontFamily: 'Inter, sans-serif', marginBottom: 20, padding: 0 }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 2L4 7l5 5" /></svg>
          Moje media
        </button>

        <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 24, fontWeight: 700, color: t.text, marginBottom: 20 }}>Szukaj mediów</h1>

        {/* Search bar */}
        <div style={{ position: 'relative', marginBottom: 16 }}>
          <svg style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: t.textFaint, pointerEvents: 'none' }} width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8">
            <circle cx="7" cy="7" r="5" /><line x1="11" y1="11" x2="14.5" y2="14.5" />
          </svg>
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Szukaj filmów, seriali, anime..."
            style={{ width: '100%', background: t.inputBg, border: `1px solid ${t.inputBorder}`, borderRadius: 10, padding: '12px 40px 12px 42px', color: t.text, fontSize: 14, outline: 'none', fontFamily: 'Inter, sans-serif' }}
          />
          {query && (
            <button onClick={() => { setQuery(''); setResults([]); }} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: t.textFaint, cursor: 'pointer', fontSize: 14, padding: 2 }}>✕</button>
          )}
        </div>

        {/* Type filter */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 24, padding: 3, background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 9, width: 'fit-content' }}>
          {(['all', 'Film', 'Serial', 'Anime'] as const).map(key => {
            const labels = { all: 'Wszystko', Film: 'Filmy', Serial: 'Seriale', Anime: 'Anime' };
            const active = typeFilter === key;
            const color = key !== 'all' ? MEDIA_TYPE_META[key].color : t.accent;
            return (
              <button
                key={key}
                onClick={() => setTypeFilter(key)}
                style={{ padding: '6px 14px', borderRadius: 6, border: 'none', cursor: 'pointer', background: active ? (key !== 'all' ? `${color}25` : t.accent) : 'transparent', color: active ? (key !== 'all' ? color : '#fff') : t.textMuted, fontSize: 12, fontWeight: active ? 600 : 400, fontFamily: 'Inter, sans-serif', transition: 'all 0.12s' }}
              >
                {labels[key]}
              </button>
            );
          })}
        </div>

        {/* Empty state — no query */}
        {!showResults && (
          <div>
            <div style={{ marginBottom: 32 }}>
              <div style={{ fontSize: 11, color: t.textFaint, letterSpacing: 1.5, textTransform: 'uppercase', fontWeight: 600, marginBottom: 12 }}>Popularne teraz</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {TRENDING_MEDIA_SEARCHES.map(s => (
                  <button key={s} onClick={() => setQuery(s)}
                    style={{ padding: '7px 14px', background: t.tagBg, border: `1px solid ${t.border}`, borderRadius: 20, color: t.tagText, fontSize: 12, cursor: 'pointer', fontFamily: 'Inter, sans-serif', transition: 'all 0.12s' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = t.tagText; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = t.border; }}
                  >
                    <span style={{ marginRight: 5, fontSize: 10 }}>↗</span>{s}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div style={{ fontSize: 11, color: t.textFaint, letterSpacing: 1.5, textTransform: 'uppercase', fontWeight: 600, marginBottom: 12 }}>Przeglądaj po gatunkach</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 10 }}>
                {MEDIA_GENRE_QUICK.map(g => (
                  <button key={g.label} onClick={() => setQuery(g.label)}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px', background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 12, cursor: 'pointer', fontFamily: 'Inter, sans-serif', color: t.text, textAlign: 'left', transition: 'all 0.15s' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = g.color; (e.currentTarget as HTMLButtonElement).style.background = t.bgHover; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = t.border; (e.currentTarget as HTMLButtonElement).style.background = t.bgCard; }}
                  >
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: `${g.color}20`, border: `1px solid ${g.color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: g.color, fontSize: 16, flexShrink: 0 }}>{g.icon}</div>
                    <span style={{ fontSize: 13, fontWeight: 500 }}>{g.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Results */}
        {showResults && (
          <div>
            {searching && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: t.textMuted, fontSize: 13, marginBottom: 16 }}>
                <div style={{ width: 16, height: 16, border: `2px solid ${t.accent}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                Szukam...
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
              </div>
            )}

            {searchError && !searching && (
              <p style={{ color: '#ef4444', fontSize: 13 }}>Nie udało się wyszukać — spróbuj ponownie.</p>
            )}

            {!searching && !searchError && (
              <>
                <div style={{ fontSize: 12, color: t.textFaint, marginBottom: 12 }}>
                  {results.length} {results.length === 1 ? 'wynik' : 'wyników'}
                </div>
                {results.length === 0
                  ? <div style={{ textAlign: 'center', padding: '40px 24px', color: t.textMuted }}><p style={{ fontSize: 14 }}>Brak wyników dla „{debounced}".</p></div>
                  : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {results.map(item => (
                        <ResultRow
                          key={item.externalId}
                          item={item}
                          added={addedIds.has(item.externalId)}
                          onAdd={() => !addedIds.has(item.externalId) && setAdding(item)}
                        />
                      ))}
                    </div>
                  )
                }
              </>
            )}
          </div>
        )}
      </div>

      {adding && (
        <AddModal
          item={adding}
          onClose={() => setAdding(null)}
          onAdded={() => setAddedIds(prev => new Set(prev).add(adding!.externalId))}
        />
      )}
    </div>
  );
}
