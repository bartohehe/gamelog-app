import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getGameById } from '../services/gamesService';
import { getLibrary, updateLibraryItem, removeFromLibrary } from '../services/libraryService';
import { useTheme } from '../contexts/ThemeContext';
import { useFeatureFlags } from '../contexts/FeatureFlagsContext';
import Cover from '../components/Cover';
import StatusBadge from '../components/StatusBadge';
import ScoreSlider from '../components/ScoreSlider';
import AddToLibraryModal from '../components/AddToLibraryModal';
import RankingRatingModal from '../components/RankingRatingModal';
import type { GameDto, UserGameDto, GameStatus, UpdateLibraryItemDto } from '../types';

const STATUSES: { value: GameStatus; label: string }[] = [
  { value: 'Wishlist', label: 'Lista życzeń' },
  { value: 'Planned', label: 'Planowane' },
  { value: 'InProgress', label: 'W trakcie' },
  { value: 'OnHold', label: 'Wstrzymane' },
  { value: 'Completed', label: 'Ukończone' },
  { value: 'Abandoned', label: 'Porzucone' },
];

const PLATFORMS = ['PC', 'PS5', 'PS4', 'Xbox Series X', 'Xbox One', 'Nintendo Switch', 'Mobile', 'Inne'];

function getScoreLabel(score: number): string {
  if (score >= 90) return 'Arcydzieło';
  if (score >= 80) return 'Świetna';
  if (score >= 70) return 'Dobra';
  if (score >= 60) return 'Przeciętna';
  if (score > 0) return 'Słaba';
  return 'Brak oceny';
}

export default function GameDetailPage() {
  const { igdbId } = useParams<{ igdbId: string }>();
  const navigate = useNavigate();
  const { t } = useTheme();
  const { advancedRatingEnabled, reviewsEnabled } = useFeatureFlags();

  const [game, setGame] = useState<GameDto | null>(null);
  const [libraryItem, setLibraryItem] = useState<UserGameDto | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
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
        setForm({ status: item.status, platform: item.platform, score: item.score, review: item.review ?? '' });
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

  const scoreColor = form.score
    ? (form.score >= 80 ? '#22c55e' : form.score >= 60 ? '#f59e0b' : '#ef4444')
    : t.textFaint;

  const ratingColor = game.rating
    ? (game.rating >= 80 ? '#22c55e' : game.rating >= 60 ? '#f59e0b' : '#ef4444')
    : t.textFaint;

  return (
    <div style={{ flex: 1, overflow: 'auto', background: t.bg }}>
      <div style={{ padding: '28px 36px 36px' }}>

        {/* Back */}
        <button
          onClick={() => navigate(-1)}
          style={{ background: 'none', border: 'none', color: t.textMuted, fontSize: 13, cursor: 'pointer', padding: '0 0 20px 0', display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'Inter, sans-serif' }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = t.text; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = t.textMuted; }}
        >← Wróć</button>

        {/* ── 2-column layout ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 28, alignItems: 'start' }}>

          {/* ── LEFT COLUMN ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Game header */}
            <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
              <div style={{ width: 110, height: 145, borderRadius: 10, overflow: 'hidden', border: `2px solid ${t.border}`, flexShrink: 0 }}>
                <Cover title={game.title} coverImageUrl={game.coverImageUrl} />
              </div>
              <div style={{ flex: 1, paddingTop: 4 }}>
                {libraryItem && <div style={{ marginBottom: 8 }}><StatusBadge status={libraryItem.status} /></div>}
                <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 26, fontWeight: 700, color: t.text, marginBottom: 6, lineHeight: 1.2 }}>
                  {game.title}
                </h1>
                <div style={{ fontSize: 13, color: t.textMuted, marginBottom: 10 }}>
                  {[game.releaseYear, game.genres.join(' · ')].filter(Boolean).join(' · ')}
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {game.genres.map(g => (
                    <span key={g} style={{ fontSize: 11, background: t.tagBg, color: t.tagText, border: `1px solid ${t.tagText}30`, borderRadius: 20, padding: '2px 10px' }}>{g}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* Library action */}
            {!libraryItem ? (
              <div style={{ textAlign: 'center', padding: '32px 24px', background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 14 }}>
                <p style={{ color: t.textMuted, marginBottom: 14, fontSize: 13 }}>Ta gra nie jest jeszcze w Twojej bibliotece.</p>
                <button
                  onClick={() => setShowAddModal(true)}
                  style={{ padding: '11px 24px', background: t.accent, border: 'none', borderRadius: 10, color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', boxShadow: `0 0 30px ${t.accentGlow}` }}
                >+ Dodaj do biblioteki</button>
              </div>
            ) : (
              <div style={{ background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 14, padding: 22 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
                  <h3 style={{ fontFamily: 'Syne, sans-serif', fontSize: 16, fontWeight: 600, color: t.text }}>Moja recenzja</h3>
                  <button onClick={handleRemove} style={{ fontSize: 12, color: t.textFaint, background: 'none', border: 'none', cursor: 'pointer' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#ef4444'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = t.textFaint; }}>
                    ✕ Usuń z biblioteki
                  </button>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
                  <div style={{ fontSize: 46, fontWeight: 900, color: scoreColor, fontFamily: 'Syne, sans-serif', minWidth: 72 }}>{form.score || '–'}</div>
                  <div>
                    <div style={{ fontSize: 12, color: t.textMuted }}>/100</div>
                    {form.score != null && form.score > 0 && <div style={{ fontSize: 11, color: scoreColor, marginTop: 2, fontWeight: 600 }}>{getScoreLabel(form.score)}</div>}
                  </div>
                </div>

                {reviewsEnabled && advancedRatingEnabled ? (
                  <button
                    onClick={() => setShowRatingModal(true)}
                    style={{
                      width: '100%',
                      padding: '11px 16px',
                      background: t.bgElevated,
                      border: `1px solid ${t.border}`,
                      borderRadius: 8,
                      color: t.text,
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: 'pointer',
                      fontFamily: 'Inter, sans-serif',
                      textAlign: 'left',
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = t.accent; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = t.border; }}
                  >
                    {form.score ? `Ocena: ${form.score}/100 — Edytuj ranking` : 'Oceń przez ranking'}
                  </button>
                ) : (
                  <ScoreSlider value={form.score} onChange={(val) => setForm(f => ({ ...f, score: val === 0 ? undefined : val }))} accentColor={t.accent} />
                )}

                <div style={{ marginTop: 18, marginBottom: 14 }}>
                  <label style={{ fontSize: 12, color: t.textMuted, display: 'block', marginBottom: 8 }}>Status</label>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {STATUSES.map(s => {
                      const active = form.status === s.value;
                      return (
                        <button key={s.value} onClick={() => setForm(f => ({ ...f, status: s.value }))}
                          style={{ background: active ? t.accent : t.bgElevated, color: active ? '#fff' : t.textMuted, border: `1px solid ${active ? t.accent : t.border}`, borderRadius: 8, padding: '7px 14px', fontSize: 13, fontWeight: active ? 600 : 400, cursor: 'pointer', transition: 'all 0.15s', fontFamily: 'Inter, sans-serif' }}>
                          {s.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div style={{ marginBottom: 14 }}>
                  <label style={{ fontSize: 12, color: t.textMuted, display: 'block', marginBottom: 8 }}>Platforma</label>
                  <select value={form.platform} onChange={e => setForm(f => ({ ...f, platform: e.target.value }))}
                    style={{ width: '100%', background: t.inputBg, border: `1px solid ${t.inputBorder}`, borderRadius: 8, padding: '10px 14px', color: t.text, fontSize: 13, outline: 'none', fontFamily: 'Inter, sans-serif' }}>
                    {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>

                <textarea value={form.review ?? ''} onChange={e => setForm(f => ({ ...f, review: e.target.value }))}
                  placeholder="Napisz swoją recenzję..."
                  style={{ width: '100%', minHeight: 100, background: t.inputBg, border: `1px solid ${t.inputBorder}`, borderRadius: 8, padding: 14, color: t.text, fontSize: 13.5, fontFamily: 'Inter, sans-serif', lineHeight: 1.7, resize: 'vertical', outline: 'none', boxSizing: 'border-box' }}
                  onFocus={e => { (e.target as HTMLTextAreaElement).style.borderColor = t.accent; }}
                  onBlur={e => { (e.target as HTMLTextAreaElement).style.borderColor = t.inputBorder; }}
                />

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 14 }}>
                  <button onClick={handleSave} disabled={saving}
                    style={{ padding: '10px 24px', background: t.accent, border: 'none', borderRadius: 8, color: '#fff', cursor: saving ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 600, opacity: saving ? 0.6 : 1, boxShadow: `0 0 20px ${t.accentGlow}`, fontFamily: 'Inter, sans-serif' }}>
                    {saving ? 'Zapisywanie...' : 'Zapisz zmiany'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ── RIGHT COLUMN ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Description */}
            {game.summary && (
              <div style={{ padding: '18px 20px', background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 14 }}>
                <div style={{ fontSize: 10, color: t.textFaint, letterSpacing: 1.3, textTransform: 'uppercase', marginBottom: 10, fontWeight: 600 }}>Opis</div>
                <p style={{ fontSize: 13.5, color: t.textMuted, lineHeight: 1.8, margin: 0 }}>{game.summary}</p>
              </div>
            )}

            {/* Game details */}
            <div style={{ padding: '18px 20px', background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 14 }}>
              <div style={{ fontSize: 10, color: t.textFaint, letterSpacing: 1.3, textTransform: 'uppercase', marginBottom: 14, fontWeight: 600 }}>Informacje</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

                {game.developer && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 12, color: t.textFaint }}>Deweloper</span>
                    <span style={{ fontSize: 13, color: t.text, fontWeight: 600 }}>{game.developer}</span>
                  </div>
                )}

                {game.releaseYear && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 12, color: t.textFaint }}>Rok wydania</span>
                    <span style={{ fontSize: 13, color: t.text, fontWeight: 600 }}>{game.releaseYear}</span>
                  </div>
                )}

                {game.rating != null && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 12, color: t.textFaint }}>Ocena IGDB</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: ratingColor }}>
                      {game.rating.toFixed(0)}/100
                      {game.ratingCount && <span style={{ fontSize: 11, color: t.textFaint, fontWeight: 400, marginLeft: 6 }}>({game.ratingCount.toLocaleString()} ocen)</span>}
                    </span>
                  </div>
                )}

                {game.platforms && game.platforms.length > 0 && (
                  <div>
                    <span style={{ fontSize: 12, color: t.textFaint, display: 'block', marginBottom: 8 }}>Platformy</span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {game.platforms.map(p => (
                        <span key={p} style={{ fontSize: 11, background: t.bgElevated, color: t.textMuted, border: `1px solid ${t.border}`, borderRadius: 6, padding: '3px 10px' }}>{p}</span>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            </div>

          </div>
        </div>
      </div>

      {showAddModal && game && (
        <AddToLibraryModal
          game={game}
          onClose={() => setShowAddModal(false)}
          onAdded={() => {
            setShowAddModal(false);
            getLibrary().then(lib => {
              const item = lib.find(g => g.igdbId === Number(igdbId)) ?? null;
              setLibraryItem(item);
              if (item) setForm({ status: item.status, platform: item.platform, score: item.score, review: item.review ?? '' });
            }).catch(() => {});
          }}
        />
      )}

      {showRatingModal && libraryItem && (
        <RankingRatingModal
          game={libraryItem}
          onClose={() => setShowRatingModal(false)}
          onSaved={async (score) => {
            const updated = await updateLibraryItem(libraryItem.id, { ...form, score });
            setLibraryItem(updated);
            setForm(f => ({ ...f, score }));
          }}
        />
      )}
    </div>
  );
}

