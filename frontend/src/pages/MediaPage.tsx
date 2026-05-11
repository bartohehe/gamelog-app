import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { getMedia, removeMedia, updateMedia } from '../services/mediaService';
import type { UserMediaDto, MediaType, MediaWatchStatus, UpdateMediaDto } from '../types';
import { MEDIA_TYPE_META, MEDIA_STATUS_META } from '../constants/popularMedia';

type TypeFilter = 'all' | MediaType;
type StatusFilter = 'all' | MediaWatchStatus;

// ── Cover placeholder ──────────────────────────────────────────────────────────
function MediaCover({ item }: { item: UserMediaDto }) {
  const meta = MEDIA_TYPE_META[item.type];
  const letters = item.title
    .split(' ')
    .map(w => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  const bgMap: Record<string, [string, string]> = {
    Film:   ['#1a0808', '#ef4444'],
    Serial: ['#080818', '#3b82f6'],
    Anime:  ['#1a0818', '#e879f9'],
  };
  const [c0, c1] = bgMap[item.type] ?? ['#111', '#555'];
  return item.coverImageUrl ? (
    <img src={item.coverImageUrl} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
  ) : (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: `linear-gradient(150deg,${c0} 0%,${c1} 100%)`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
      }}
    >
      <div style={{ fontSize: 22, fontWeight: 800, color: 'rgba(255,255,255,0.9)', letterSpacing: 2, fontFamily: 'monospace' }}>{letters}</div>
      <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)' }}>{meta.icon} {item.year}</div>
    </div>
  );
}

// ── Edit modal ────────────────────────────────────────────────────────────────
interface EditModalProps {
  item: UserMediaDto;
  onClose: () => void;
  onSaved: (updated: UserMediaDto) => void;
}
function EditModal({ item, onClose, onSaved }: EditModalProps) {
  const { t } = useTheme();
  const [status, setStatus] = useState<MediaWatchStatus>(item.status);
  const [score, setScore] = useState<string>(item.score != null ? String(item.score) : '');
  const [watched, setWatched] = useState<string>(item.watchedEpisodes != null ? String(item.watchedEpisodes) : '');
  const [review, setReview] = useState(item.review);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const meta = MEDIA_TYPE_META[item.type];

  const handleSave = async () => {
    setLoading(true);
    setError('');
    try {
      const dto: UpdateMediaDto = {
        status,
        score: score !== '' ? Number(score) : undefined,
        watchedEpisodes: watched !== '' ? Number(watched) : undefined,
        review,
      };
      const updated = await updateMedia(item.id, dto);
      onSaved(updated);
      onClose();
    } catch {
      setError('Nie udało się zapisać zmian.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 16 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 14, width: '100%', maxWidth: 440, boxShadow: '0 24px 80px rgba(0,0,0,0.5)' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: `1px solid ${t.border}` }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
              <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 14, background: `${meta.color}20`, color: meta.color, fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase', border: `1px solid ${meta.color}35` }}>
                {meta.icon} {meta.label}
              </span>
            </div>
            <div style={{ fontWeight: 700, fontSize: 14, color: t.text }}>{item.title}</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: t.textMuted, cursor: 'pointer', fontSize: 18, padding: 4 }}>✕</button>
        </div>

        <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Status */}
          <div>
            <label style={{ fontSize: 12, color: t.textMuted, display: 'block', marginBottom: 8 }}>Status</label>
            <div style={{ display: 'flex', gap: 6 }}>
              {(['Watched', 'Watching', 'Backlog'] as MediaWatchStatus[]).map(s => {
                const sm = MEDIA_STATUS_META[s];
                const active = status === s;
                return (
                  <button
                    key={s}
                    onClick={() => setStatus(s)}
                    style={{
                      flex: 1,
                      padding: '8px 4px',
                      borderRadius: 8,
                      border: `1px solid ${active ? sm.color : t.border}`,
                      background: active ? `${sm.color}22` : t.bgElevated,
                      color: active ? sm.color : t.textMuted,
                      fontSize: 11.5,
                      fontWeight: active ? 600 : 400,
                      cursor: 'pointer',
                      fontFamily: 'Inter, sans-serif',
                    }}
                  >
                    {sm.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Score */}
          <div>
            <label style={{ fontSize: 12, color: t.textMuted, display: 'block', marginBottom: 8 }}>
              Ocena (0–100)
            </label>
            <input
              type="number"
              min={0}
              max={100}
              value={score}
              onChange={e => setScore(e.target.value)}
              placeholder="–"
              style={{
                width: '100%',
                background: t.inputBg,
                border: `1px solid ${t.inputBorder}`,
                borderRadius: 8,
                padding: '9px 14px',
                color: t.text,
                fontSize: 13,
                outline: 'none',
                fontFamily: 'Inter, sans-serif',
              }}
            />
          </div>

          {/* Episodes progress */}
          {item.episodes != null && item.episodes > 0 && (
            <div>
              <label style={{ fontSize: 12, color: t.textMuted, display: 'block', marginBottom: 8 }}>
                Obejrzane odcinki (z {item.episodes})
              </label>
              <input
                type="number"
                min={0}
                max={item.episodes}
                value={watched}
                onChange={e => setWatched(e.target.value)}
                placeholder="0"
                style={{
                  width: '100%',
                  background: t.inputBg,
                  border: `1px solid ${t.inputBorder}`,
                  borderRadius: 8,
                  padding: '9px 14px',
                  color: t.text,
                  fontSize: 13,
                  outline: 'none',
                  fontFamily: 'Inter, sans-serif',
                }}
              />
            </div>
          )}

          {/* Review */}
          <div>
            <label style={{ fontSize: 12, color: t.textMuted, display: 'block', marginBottom: 8 }}>Recenzja</label>
            <textarea
              value={review}
              onChange={e => setReview(e.target.value)}
              rows={3}
              placeholder="Napisz recenzję..."
              style={{
                width: '100%',
                background: t.inputBg,
                border: `1px solid ${t.inputBorder}`,
                borderRadius: 8,
                padding: '9px 14px',
                color: t.text,
                fontSize: 13,
                outline: 'none',
                resize: 'vertical',
                fontFamily: 'Inter, sans-serif',
              }}
            />
          </div>

          {error && <p style={{ color: '#ef4444', fontSize: 13 }}>{error}</p>}

          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={onClose} style={{ flex: 1, background: 'transparent', border: `1px solid ${t.border}`, color: t.textMuted, borderRadius: 8, padding: '10px', fontSize: 13, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
              Anuluj
            </button>
            <button onClick={handleSave} disabled={loading} style={{ flex: 1, background: t.accent, color: '#fff', border: 'none', borderRadius: 8, padding: '10px', fontSize: 13, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1, fontFamily: 'Inter, sans-serif' }}>
              {loading ? 'Zapisywanie...' : 'Zapisz'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Grid card ─────────────────────────────────────────────────────────────────
function GridCard({ item, onEdit, onRemove }: { item: UserMediaDto; onEdit: () => void; onRemove: () => void }) {
  const { t } = useTheme();
  const [hovered, setHovered] = useState(false);
  const meta = MEDIA_TYPE_META[item.type];
  const statusMeta = MEDIA_STATUS_META[item.status];
  const progress = item.episodes && item.watchedEpisodes != null
    ? Math.round((item.watchedEpisodes / item.episodes) * 100)
    : null;

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onEdit}
      style={{
        background: t.bgCard,
        border: `1px solid ${hovered ? meta.color : t.border}`,
        borderRadius: 10,
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'all 0.15s',
        transform: hovered ? 'translateY(-2px)' : 'translateY(0)',
        boxShadow: hovered ? `0 8px 24px ${meta.color}25` : 'none',
        position: 'relative',
      }}
    >
      <div style={{ height: 215, position: 'relative' }}>
        <MediaCover item={item} />
        {/* Type badge */}
        <div style={{ position: 'absolute', top: 7, left: 7, fontSize: 10, padding: '2px 8px', borderRadius: 14, background: 'rgba(0,0,0,0.7)', color: meta.color, fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase', backdropFilter: 'blur(6px)' }}>
          {meta.icon} {meta.label}
        </div>
        {/* Score */}
        {item.score != null && (
          <div style={{ position: 'absolute', bottom: 7, right: 7 }}>
            <span style={{ fontSize: 11, padding: '2px 6px', borderRadius: 6, background: `${item.score >= 80 ? '#22c55e' : item.score >= 60 ? '#f59e0b' : '#ef4444'}20`, color: item.score >= 80 ? '#22c55e' : item.score >= 60 ? '#f59e0b' : '#ef4444', border: `1px solid ${item.score >= 80 ? '#22c55e' : item.score >= 60 ? '#f59e0b' : '#ef4444'}40`, fontWeight: 700, fontFamily: 'monospace' }}>{item.score}</span>
          </div>
        )}
        {/* Progress bar */}
        {progress != null && progress < 100 && (
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, background: 'rgba(0,0,0,0.5)' }}>
            <div style={{ height: '100%', width: `${progress}%`, background: statusMeta.color }} />
          </div>
        )}
        {/* Remove button */}
        <button
          onClick={e => { e.stopPropagation(); onRemove(); }}
          style={{ position: 'absolute', top: 6, right: 6, width: 24, height: 24, borderRadius: '50%', background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: hovered ? 1 : 0, transition: 'opacity 0.15s', padding: 0 }}
          title="Usuń"
        >✕</button>
      </div>
      <div style={{ padding: '9px 11px 10px' }}>
        <div style={{ fontWeight: 600, fontSize: 12.5, color: t.text, lineHeight: 1.3, marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</div>
        <div style={{ fontSize: 10.5, color: t.textFaint, display: 'flex', justifyContent: 'space-between' }}>
          <span>{item.year}</span>
          {progress != null && progress < 100
            ? <span style={{ color: statusMeta.color }}>{item.watchedEpisodes}/{item.episodes}</span>
            : <span>{statusMeta.label}</span>}
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function MediaPage() {
  const { t } = useTheme();
  const navigate = useNavigate();
  const [items, setItems] = useState<UserMediaDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [editing, setEditing] = useState<UserMediaDto | null>(null);

  useEffect(() => {
    getMedia()
      .then(setItems)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleRemove = async (item: UserMediaDto) => {
    if (!confirm(`Usunąć „${item.title}" z biblioteki?`)) return;
    await removeMedia(item.id).catch(() => {});
    setItems(prev => prev.filter(i => i.id !== item.id));
  };

  const filtered = items
    .filter(i => typeFilter === 'all' || i.type === typeFilter)
    .filter(i => statusFilter === 'all' || i.status === statusFilter);

  const countByType = (type: MediaType | 'all') =>
    type === 'all' ? items.length : items.filter(i => i.type === type).length;

  if (loading) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: t.bg }}>
        <div style={{ width: 32, height: 32, border: `2px solid ${t.accent}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ flex: 1, overflow: 'auto', padding: '32px 36px' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 24, gap: 16 }}>
          <div>
            <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 26, fontWeight: 700, color: t.text }}>Media</h1>
            <p style={{ fontSize: 13, color: t.textMuted, marginTop: 4 }}>Filmy, seriale i anime</p>
          </div>
          <button
            onClick={() => navigate('/media-search')}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 16px', background: t.accent, border: 'none', borderRadius: 9, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', boxShadow: `0 0 20px ${t.accentGlow}`, fontFamily: 'Inter, sans-serif' }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.7"><circle cx="6" cy="6" r="4" /><line x1="9" y1="9" x2="12.5" y2="12.5" /></svg>
            Szukaj mediów
          </button>
        </div>

        {/* Type filter — segmented */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 14, padding: 4, background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 10, width: 'fit-content' }}>
          {([['all', 'Wszystko', null], ['Film', 'Filmy', MEDIA_TYPE_META.Film.color], ['Serial', 'Seriale', MEDIA_TYPE_META.Serial.color], ['Anime', 'Anime', MEDIA_TYPE_META.Anime.color]] as const).map(([key, label, color]) => {
            const active = typeFilter === key;
            const c = color ?? t.accent;
            return (
              <button
                key={key}
                onClick={() => setTypeFilter(key as TypeFilter)}
                style={{ padding: '7px 16px', borderRadius: 7, border: 'none', cursor: 'pointer', background: active ? (color ? `${c}25` : t.accent) : 'transparent', color: active ? (color ? c : '#fff') : t.textMuted, fontSize: 12.5, fontWeight: active ? 600 : 500, fontFamily: 'Inter, sans-serif', transition: 'all 0.15s' }}
              >
                {label} <span style={{ opacity: 0.6, fontSize: 11 }}>{countByType(key === 'all' ? 'all' : key as MediaType)}</span>
              </button>
            );
          })}
        </div>

        {/* Status filter — pills */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 24, flexWrap: 'wrap' }}>
          {([['all', 'Wszystkie statusy'], ...Object.entries(MEDIA_STATUS_META).map(([k, v]) => [k, v.label])] as [string, string][]).map(([key, label]) => {
            const active = statusFilter === key;
            const color = key === 'all' ? t.accent : MEDIA_STATUS_META[key]?.color ?? t.accent;
            return (
              <button
                key={key}
                onClick={() => setStatusFilter(key as StatusFilter)}
                style={{ padding: '4px 12px', borderRadius: 20, border: `1px solid ${active ? color : t.border}`, background: active ? `${color}20` : 'transparent', color: active ? color : t.textMuted, fontSize: 11.5, fontWeight: active ? 600 : 400, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* Empty */}
        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 24px', color: t.textMuted }}>
            <p style={{ fontSize: 15, marginBottom: 16 }}>
              {items.length === 0 ? 'Biblioteka mediów jest pusta.' : 'Brak wyników dla wybranego filtra.'}
            </p>
            {items.length === 0 && (
              <button
                onClick={() => navigate('/media-search')}
                style={{ padding: '10px 20px', background: t.accent, color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: 'Inter, sans-serif' }}
              >
                Znajdź swój pierwszy tytuł
              </button>
            )}
          </div>
        )}

        {/* Grid */}
        {filtered.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(155px, 1fr))', gap: 14 }}>
            {filtered.map(item => (
              <GridCard
                key={item.id}
                item={item}
                onEdit={() => setEditing(item)}
                onRemove={() => handleRemove(item)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Edit modal */}
      {editing && (
        <EditModal
          item={editing}
          onClose={() => setEditing(null)}
          onSaved={updated => setItems(prev => prev.map(i => i.id === updated.id ? updated : i))}
        />
      )}
    </div>
  );
}
