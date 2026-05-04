import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getGameById } from '../services/gamesService';
import { getLibrary, updateLibraryItem, removeFromLibrary } from '../services/libraryService';
import { useTheme } from '../contexts/ThemeContext';
import Cover from '../components/Cover';
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

  return (
    <div style={{ flex: 1, overflow: 'auto' }}>
      {/* Hero background */}
      <div style={{ position: 'relative', height: 280 }}>
        <div style={{ position: 'absolute', inset: 0 }}>
          <Cover title={game.title} coverImageUrl={game.coverImageUrl} style={{ borderRadius: 0 }} />
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: `linear-gradient(to bottom, transparent 20%, ${t.bg} 100%)`,
            }}
          />
        </div>
        <button
          onClick={() => navigate(-1)}
          style={{
            position: 'absolute',
            top: 20,
            left: 24,
            background: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: 8,
            color: '#fff',
            padding: '6px 14px',
            fontSize: 13,
            cursor: 'pointer',
          }}
        >
          ← Wróć
        </button>
      </div>

      <div style={{ padding: '0 36px 36px', maxWidth: 860, marginTop: -60 }}>
        {/* Game header */}
        <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
          <div
            style={{
              width: 110,
              height: 145,
              borderRadius: 10,
              overflow: 'hidden',
              border: `3px solid ${t.border}`,
              flexShrink: 0,
              boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
            }}
          >
            <Cover title={game.title} coverImageUrl={game.coverImageUrl} />
          </div>
          <div style={{ flex: 1, paddingTop: 24 }}>
            {libraryItem && (
              <div style={{ marginBottom: 6 }}>
                <StatusBadge status={libraryItem.status} />
              </div>
            )}
            <h1
              style={{
                fontFamily: 'Syne, sans-serif',
                fontSize: 28,
                fontWeight: 700,
                color: t.text,
                marginBottom: 6,
                lineHeight: 1.2,
              }}
            >
              {game.title}
            </h1>
            <div style={{ fontSize: 13, color: t.textMuted, marginBottom: 12 }}>
              {[game.releaseYear, game.genres.join(' · ')].filter(Boolean).join(' · ')}
            </div>
            <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
              {game.genres.map(g => (
                <span
                  key={g}
                  style={{
                    fontSize: 11,
                    background: t.tagBg,
                    color: t.tagText,
                    border: `1px solid ${t.tagText}30`,
                    borderRadius: 20,
                    padding: '2px 10px',
                  }}
                >
                  {g}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Stats cards */}
        {libraryItem && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, margin: '28px 0' }}>
            {[
              { label: 'Platforma', value: libraryItem.platform },
              { label: 'Data dodania', value: new Date(libraryItem.addedAt).toLocaleDateString('pl-PL') },
              { label: 'Status', value: libraryItem.status },
            ].map(s => (
              <div
                key={s.label}
                style={{
                  background: t.bgCard,
                  border: `1px solid ${t.border}`,
                  borderRadius: 10,
                  padding: '14px 18px',
                }}
              >
                <div style={{ fontSize: 18, fontWeight: 700, color: t.text, fontFamily: 'Syne, sans-serif' }}>
                  {s.value}
                </div>
                <div style={{ fontSize: 11, color: t.textMuted, marginTop: 3 }}>{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Not in library */}
        {!libraryItem && (
          <div
            style={{
              textAlign: 'center',
              padding: '40px 24px',
              background: t.bgCard,
              border: `1px solid ${t.border}`,
              borderRadius: 14,
              margin: '28px 0',
            }}
          >
            <p style={{ color: t.textMuted, marginBottom: 16 }}>
              Ta gra nie jest jeszcze w Twojej bibliotece.
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              style={{
                padding: '11px 24px',
                background: t.accent,
                border: 'none',
                borderRadius: 10,
                color: '#fff',
                fontSize: 14,
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: `0 0 30px ${t.accentGlow}`,
              }}
            >
              + Dodaj do biblioteki
            </button>
          </div>
        )}

        {/* Review form */}
        {libraryItem && (
          <div
            style={{
              background: t.bgCard,
              border: `1px solid ${t.border}`,
              borderRadius: 14,
              padding: 24,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h3 style={{ fontFamily: 'Syne, sans-serif', fontSize: 17, fontWeight: 600, color: t.text }}>
                Moja recenzja
              </h3>
              <button
                onClick={handleRemove}
                style={{ fontSize: 12, color: t.textFaint, background: 'none', border: 'none', cursor: 'pointer' }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#ef4444'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = t.textFaint; }}
              >
                ✕ Usuń z biblioteki
              </button>
            </div>

            {/* Score display */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
              <div style={{ fontSize: 48, fontWeight: 900, color: scoreColor, fontFamily: 'Syne, sans-serif', minWidth: 80 }}>
                {form.score || '–'}
              </div>
              <div>
                <div style={{ fontSize: 12, color: t.textMuted }}>/100</div>
                {form.score != null && form.score > 0 && (
                  <div style={{ fontSize: 11, color: scoreColor, marginTop: 2, fontWeight: 600 }}>
                    {getScoreLabel(form.score)}
                  </div>
                )}
              </div>
            </div>

            <ScoreSlider
              value={form.score}
              onChange={(val) => setForm(f => ({ ...f, score: val === 0 ? undefined : val }))}
              accentColor={t.accent}
            />

            {/* Status buttons */}
            <div style={{ marginTop: 20, marginBottom: 16 }}>
              <label style={{ fontSize: 12, color: t.textMuted, display: 'block', marginBottom: 8 }}>Status</label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {STATUSES.map(s => {
                  const active = form.status === s.value;
                  return (
                    <button
                      key={s.value}
                      onClick={() => setForm(f => ({ ...f, status: s.value }))}
                      style={{
                        background: active ? t.accent : t.bgElevated,
                        color: active ? '#fff' : t.textMuted,
                        border: `1px solid ${active ? t.accent : t.border}`,
                        borderRadius: 8,
                        padding: '7px 14px',
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
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, color: t.textMuted, display: 'block', marginBottom: 8 }}>Platforma</label>
              <select
                value={form.platform}
                onChange={e => setForm(f => ({ ...f, platform: e.target.value }))}
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

            {/* Review textarea */}
            <textarea
              value={form.review ?? ''}
              onChange={e => setForm(f => ({ ...f, review: e.target.value }))}
              placeholder="Napisz swoją recenzję..."
              style={{
                width: '100%',
                minHeight: 110,
                background: t.inputBg,
                border: `1px solid ${t.inputBorder}`,
                borderRadius: 8,
                padding: 14,
                color: t.text,
                fontSize: 13.5,
                fontFamily: 'Inter, sans-serif',
                lineHeight: 1.7,
                resize: 'vertical',
                outline: 'none',
              }}
              onFocus={e => { (e.target as HTMLTextAreaElement).style.borderColor = t.accent; }}
              onBlur={e => { (e.target as HTMLTextAreaElement).style.borderColor = t.inputBorder; }}
            />

            {/* Save button */}
            <div style={{ display: 'flex', gap: 10, marginTop: 16, justifyContent: 'flex-end' }}>
              <button
                onClick={handleSave}
                disabled={saving}
                style={{
                  padding: '10px 24px',
                  background: t.accent,
                  border: 'none',
                  borderRadius: 8,
                  color: '#fff',
                  cursor: saving ? 'not-allowed' : 'pointer',
                  fontSize: 13,
                  fontWeight: 600,
                  opacity: saving ? 0.6 : 1,
                  boxShadow: `0 0 20px ${t.accentGlow}`,
                  fontFamily: 'Inter, sans-serif',
                }}
              >
                {saving ? 'Zapisywanie...' : 'Zapisz zmiany'}
              </button>
            </div>
          </div>
        )}
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
    </div>
  );
}

