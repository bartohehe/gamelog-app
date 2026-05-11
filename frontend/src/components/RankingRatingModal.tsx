import { useEffect, useRef, useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { RATING_CATEGORIES } from '../constants/ratingCategories';
import { getAllRankings, updateCategoryRanking } from '../services/rankingService';
import type { RankingItem } from '../services/rankingService';
import type { UserGameDto } from '../types';

interface Props {
  game: UserGameDto;
  onClose: () => void;
  onSaved: (newScore: number) => void;
}

export default function RankingRatingModal({ game, onClose, onSaved }: Props) {
  const { t } = useTheme();
  const [rankings, setRankings] = useState<Record<string, RankingItem[]>>({});
  // placements[categoryId] = position index to insert (0 = top), null = not placed yet
  const [placements, setPlacements] = useState<Record<string, number | null>>(() =>
    Object.fromEntries(RATING_CATEGORIES.map(c => [c.id, null]))
  );
  const [activeCategory, setActiveCategory] = useState('gameplay');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // drag state
  const dragOverIndexRef = useRef<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    getAllRankings().then(data => {
      // Remove the current game from all rankings so it can be re-placed
      const cleaned = Object.fromEntries(
        Object.entries(data).map(([cat, items]) => [
          cat,
          items
            .filter(i => i.userGameId !== game.id)
            .sort((a, b) => a.position - b.position),
        ])
      );
      setRankings(cleaned);
      // Pre-fill placements for categories where the game already exists in fetched data
      const existing: Record<string, number | null> = {};
      RATING_CATEGORIES.forEach(cat => {
        const found = data[cat.id]?.find(i => i.userGameId === game.id);
        existing[cat.id] = found ? found.position : null;
      });
      setPlacements(existing);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [game.id]);

  // ── Score computation ──────────────────────────────────────────────────────
  const computeScore = (): number => {
    let weightedSum = 0;
    let usedWeights = 0;
    RATING_CATEGORIES.forEach(cat => {
      const pos = placements[cat.id];
      if (pos === null) return;
      const total = (rankings[cat.id] ?? []).length; // without current game
      // pos is 0-indexed insert position; total+1 = total slots including current game
      const catScore = Math.round(40 + (1 - (pos + 1) / (total + 2)) * 55);
      weightedSum += catScore * cat.weight;
      usedWeights += cat.weight;
    });
    return usedWeights > 0 ? Math.round(weightedSum / usedWeights) : 0;
  };

  const placedCount = RATING_CATEGORIES.filter(c => placements[c.id] !== null).length;
  const previewScore = placedCount > 0 ? computeScore() : null;

  // ── Save ──────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    setSaving(true);
    try {
      await Promise.all(
        RATING_CATEGORIES
          .filter(cat => placements[cat.id] !== null)
          .map(cat => {
            const pos = placements[cat.id]!;
            const newList = [...(rankings[cat.id] ?? [])];
            const newItem: RankingItem = {
              userGameId: game.id,
              igdbId: game.igdbId,
              title: game.title,
              coverImageUrl: game.coverImageUrl,
              position: pos,
            };
            newList.splice(pos, 0, newItem);
            const ids = newList.map(i => i.userGameId);
            return updateCategoryRanking(cat.id, ids);
          })
      );
      onSaved(computeScore());
      onClose();
    } catch {
      /* ignore — UI stays open */
    } finally {
      setSaving(false);
    }
  };

  // ── Remove placement for a category ───────────────────────────────────────
  const removePlacement = (categoryId: string) => {
    setPlacements(p => ({ ...p, [categoryId]: null }));
  };

  // ── Drag & drop helpers ───────────────────────────────────────────────────
  const handleDragStart = () => {
    setIsDragging(true);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    setDragOverIndex(null);
    dragOverIndexRef.current = null;
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    dragOverIndexRef.current = index;
    setDragOverIndex(index);
  };

  const handleDrop = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setPlacements(p => ({ ...p, [activeCategory]: index }));
    setDragOverIndex(null);
    dragOverIndexRef.current = null;
    setIsDragging(false);
  };

  const handleDragLeave = () => {
    // only clear if leaving the list entirely — handled by dragEnd
  };

  // ── Current category list ─────────────────────────────────────────────────
  const currentList = rankings[activeCategory] ?? [];
  const currentPlacement = placements[activeCategory];

  // Build display list: list items + drop zones
  // Drop zones are between items (and before first / after last)
  // total drop zones = currentList.length + 1
  const dropZones = Array.from({ length: currentList.length + 1 }, (_, i) => i);

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
          maxWidth: 860,
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 24px 80px rgba(0,0,0,0.5)',
          fontFamily: 'Inter, sans-serif',
        }}
      >
        {/* ── Header ── */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 20px',
            borderBottom: `1px solid ${t.border}`,
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ fontWeight: 700, fontSize: 15, color: t.text }}>
              Oceń przez ranking: <span style={{ color: t.accent }}>{game.title}</span>
            </div>
            {/* Progress dots */}
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              {RATING_CATEGORIES.map(cat => (
                <div
                  key={cat.id}
                  title={cat.label}
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: placements[cat.id] !== null ? t.accent : t.textFaint,
                    transition: 'background 0.2s',
                  }}
                />
              ))}
              <span style={{ fontSize: 11, color: t.textMuted, marginLeft: 4 }}>
                {placedCount}/{RATING_CATEGORIES.length} kategorii
              </span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {previewScore !== null && (
              <div style={{ fontSize: 13, color: t.textMuted }}>
                Wynik: <strong style={{ color: t.accent, fontSize: 15 }}>{previewScore}</strong>/100
              </div>
            )}
            <button
              onClick={onClose}
              style={{ background: 'none', border: 'none', color: t.textMuted, cursor: 'pointer', fontSize: 18, lineHeight: 1, padding: 4 }}
            >✕</button>
          </div>
        </div>

        {/* ── Body ── */}
        {loading ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40 }}>
            <div style={{ width: 28, height: 28, border: `2px solid ${t.accent}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        ) : (
          <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '200px 1fr', overflow: 'hidden' }}>

            {/* ── Left: category list ── */}
            <div style={{ borderRight: `1px solid ${t.border}`, padding: '12px 0', overflowY: 'auto', flexShrink: 0 }}>
              {RATING_CATEGORIES.map(cat => {
                const isActive = activeCategory === cat.id;
                const isPlaced = placements[cat.id] !== null;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      padding: '11px 18px',
                      background: isActive ? `${t.accent}18` : 'transparent',
                      border: 'none',
                      borderLeft: isActive ? `3px solid ${t.accent}` : '3px solid transparent',
                      color: isActive ? t.text : t.textMuted,
                      fontFamily: 'Inter, sans-serif',
                      fontSize: 13,
                      fontWeight: isActive ? 600 : 400,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 8,
                    }}
                  >
                    <span>{cat.label}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: t.textFaint }}>
                      <span style={{ color: isPlaced ? '#22c55e' : t.textFaint }}>{cat.weight}%</span>
                      {isPlaced && <span style={{ color: '#22c55e' }}>✓</span>}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* ── Right: ranking list for active category ── */}
            <div style={{ overflowY: 'auto', padding: '16px 20px' }}>
              <div style={{ fontSize: 11, color: t.textFaint, letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 14, fontWeight: 600 }}>
                {RATING_CATEGORIES.find(c => c.id === activeCategory)?.label} — ranking
              </div>

              {/* If already placed: show "remove" option */}
              {currentPlacement !== null && (
                <div style={{
                  marginBottom: 14,
                  padding: '8px 14px',
                  background: `${t.accent}15`,
                  border: `1px solid ${t.accent}40`,
                  borderRadius: 8,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: 12,
                  color: t.textMuted,
                }}>
                  <span>Gra umieszczona na pozycji <strong style={{ color: t.accent }}>#{currentPlacement + 1}</strong></span>
                  <button
                    onClick={() => removePlacement(activeCategory)}
                    style={{ background: 'none', border: 'none', color: t.textFaint, cursor: 'pointer', fontSize: 12, fontFamily: 'Inter, sans-serif' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#ef4444'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = t.textFaint; }}
                  >
                    ✕ Cofnij
                  </button>
                </div>
              )}

              {/* Drag card — only when not yet placed */}
              {currentPlacement === null && (
                <div
                  style={{
                    padding: '10px 14px',
                    marginBottom: 16,
                    background: `${t.accent}10`,
                    border: `2px dashed ${t.accent}`,
                    borderRadius: 10,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    cursor: 'grab',
                    fontSize: 13,
                    color: t.text,
                    userSelect: 'none',
                  }}
                  draggable
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                >
                  {game.coverImageUrl ? (
                    <img src={game.coverImageUrl} alt={game.title} style={{ width: 28, height: 37, borderRadius: 4, objectFit: 'cover', flexShrink: 0 }} />
                  ) : (
                    <div style={{ width: 28, height: 37, borderRadius: 4, background: t.bgElevated, flexShrink: 0 }} />
                  )}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600 }}>{game.title}</div>
                    <div style={{ fontSize: 11, color: t.textMuted, marginTop: 2 }}>Przeciągnij na pozycję w rankingu ↓</div>
                  </div>
                  <span style={{ fontSize: 16, color: t.textFaint }}>⠿</span>
                </div>
              )}

              {/* List with drop zones */}
              {currentList.length === 0 && currentPlacement === null && (
                <DropZone
                  index={0}
                  dragOverIndex={dragOverIndex}
                  isDragging={isDragging}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  onDragLeave={handleDragLeave}
                  t={t}
                  isEmpty
                />
              )}

              {currentList.length > 0 && dropZones.map(dropIdx => (
                <div key={`zone-${dropIdx}`}>
                  <DropZone
                    index={dropIdx}
                    dragOverIndex={dragOverIndex}
                    isDragging={isDragging}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    onDragLeave={handleDragLeave}
                    t={t}
                    isEmpty={false}
                  />
                  {dropIdx < currentList.length && (
                    <RankingCard
                      item={currentList[dropIdx]}
                      position={dropIdx}
                      isCurrentGame={currentList[dropIdx].userGameId === game.id}
                      t={t}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Footer ── */}
        <div style={{ padding: '14px 20px', borderTop: `1px solid ${t.border}`, display: 'flex', justifyContent: 'flex-end', gap: 10, flexShrink: 0 }}>
          <button
            onClick={onClose}
            style={{ padding: '10px 22px', background: 'transparent', border: `1px solid ${t.border}`, color: t.textMuted, borderRadius: 8, fontSize: 13, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}
          >
            Anuluj
          </button>
          <button
            onClick={handleSave}
            disabled={placedCount === 0 || saving}
            style={{
              padding: '10px 22px',
              background: placedCount === 0 ? t.bgElevated : t.accent,
              color: placedCount === 0 ? t.textFaint : '#fff',
              border: 'none',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              cursor: placedCount === 0 || saving ? 'not-allowed' : 'pointer',
              opacity: saving ? 0.6 : 1,
              boxShadow: placedCount > 0 ? `0 0 20px ${t.accentGlow}` : 'none',
              fontFamily: 'Inter, sans-serif',
              transition: 'all 0.15s',
            }}
          >
            {saving ? 'Zapisywanie...' : `Zapisz ocenę${previewScore !== null ? ` (${previewScore}/100)` : ''}`}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────

interface DropZoneProps {
  index: number;
  dragOverIndex: number | null;
  isDragging: boolean;
  onDragOver: (e: React.DragEvent, index: number) => void;
  onDrop: (e: React.DragEvent, index: number) => void;
  onDragLeave: () => void;
  t: ReturnType<typeof useTheme>['t'];
  isEmpty: boolean;
}

function DropZone({ index, dragOverIndex, isDragging, onDragOver, onDrop, onDragLeave, t, isEmpty }: DropZoneProps) {
  const isOver = dragOverIndex === index;
  return (
    <div
      onDragOver={e => onDragOver(e, index)}
      onDrop={e => onDrop(e, index)}
      onDragLeave={onDragLeave}
      style={{
        height: isDragging ? (isOver ? 44 : 8) : (isEmpty ? 80 : 8),
        borderRadius: 8,
        margin: '2px 0',
        background: isOver ? `${t.accent}20` : isEmpty && isDragging ? `${t.bgElevated}` : 'transparent',
        border: isOver ? `2px dashed ${t.accent}` : isEmpty ? `2px dashed ${t.border}` : '2px dashed transparent',
        transition: 'all 0.15s',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: isOver ? t.accent : t.textFaint,
        fontSize: 12,
      }}
    >
      {isEmpty && !isDragging && (
        <span style={{ color: t.textFaint, fontSize: 12 }}>Przeciągnij grę tutaj, żeby ją umieścić</span>
      )}
      {isOver && <span>Upuść tutaj</span>}
    </div>
  );
}

interface RankingCardProps {
  item: RankingItem;
  position: number;
  isCurrentGame: boolean;
  t: ReturnType<typeof useTheme>['t'];
}

function RankingCard({ item, position, t }: RankingCardProps) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '8px 12px',
        background: t.bgElevated,
        border: `1px solid ${t.border}`,
        borderRadius: 8,
        marginBottom: 2,
      }}
    >
      <span style={{ fontSize: 13, fontWeight: 700, color: t.textFaint, minWidth: 22, textAlign: 'right' }}>
        #{position + 1}
      </span>
      {item.coverImageUrl ? (
        <img src={item.coverImageUrl} alt={item.title} style={{ width: 28, height: 37, borderRadius: 4, objectFit: 'cover', flexShrink: 0 }} />
      ) : (
        <div style={{ width: 28, height: 37, borderRadius: 4, background: t.bgCard, flexShrink: 0 }} />
      )}
      <span style={{ fontSize: 13, color: t.text, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {item.title}
      </span>
    </div>
  );
}
