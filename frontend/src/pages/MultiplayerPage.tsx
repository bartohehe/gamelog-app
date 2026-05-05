import { useEffect, useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import {
  getMultiplayerEntries,
  createMultiplayerEntry,
  updateMultiplayerEntry,
  deleteMultiplayerEntry,
  syncLolRank,
  syncCs2Stats,
  type MultiplayerEntryDto,
  type UpsertMultiplayerEntryDto,
} from '../services/multiplayerService';

/* ── Tier config ── */
const TIER_COLORS: Record<string, string> = {
  iron: '#6b6b6b',
  bronze: '#cd7f32',
  silver: '#a8a9ad',
  gold: '#ffd700',
  platinum: '#4fc3f7',
  emerald: '#50c878',
  diamond: '#b388ff',
  master: '#f48fb1',
  grandmaster: '#ff6b6b',
  challenger: '#00e5ff',
};

const TIER_ICONS: Record<string, string> = {
  iron: '▪', bronze: '◉', silver: '◈', gold: '●',
  platinum: '▲', emerald: '◆', diamond: '◆',
  master: '★', grandmaster: '★', challenger: '★',
};

const TIERS = ['iron','bronze','silver','gold','platinum','emerald','diamond','master','grandmaster','challenger'];

function tierColor(tier?: string) {
  return TIER_COLORS[tier?.toLowerCase() ?? ''] ?? '#888';
}

/* ── Empty form ── */
const emptyForm = (): UpsertMultiplayerEntryDto => ({
  gameTitle: '', mode: '', tier: 'gold', rank: '',
  rankPoints: undefined, rankPointsMax: 100,
  winRate: undefined, kdRatio: undefined, hoursPlayed: undefined,
  platform: 'PC', inGameUsername: '',
});

/* ── Entry Modal ── */
function EntryModal({
  initial,
  onSave,
  onClose,
}: {
  initial?: MultiplayerEntryDto;
  onSave: (dto: UpsertMultiplayerEntryDto) => Promise<void>;
  onClose: () => void;
}) {
  const { t } = useTheme();
  const [form, setForm] = useState<UpsertMultiplayerEntryDto>(
    initial
      ? {
          gameTitle: initial.gameTitle,
          mode: initial.mode ?? '',
          tier: initial.tier ?? 'gold',
          rank: initial.rank ?? '',
          rankPoints: initial.rankPoints,
          rankPointsMax: initial.rankPointsMax ?? 100,
          winRate: initial.winRate,
          kdRatio: initial.kdRatio,
          hoursPlayed: initial.hoursPlayed,
          platform: initial.platform ?? 'PC',
          inGameUsername: initial.inGameUsername ?? '',
        }
      : emptyForm()
  );
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState<'lol' | 'cs2' | null>(null);
  const [syncInput, setSyncInput] = useState('');
  const [syncError, setSyncError] = useState('');
  const [lolPlatform, setLolPlatform] = useState('eun1');

  const set = (k: keyof UpsertMultiplayerEntryDto, v: unknown) =>
    setForm(f => ({ ...f, [k]: v }));

  async function handleSync(type: 'lol' | 'cs2') {
    if (!syncInput.trim()) return;
    setSyncError('');
    setSaving(true);
    try {
      const fetched = type === 'lol'
        ? await syncLolRank(syncInput.trim(), lolPlatform)
        : await syncCs2Stats(syncInput.trim());
      setForm(f => ({ ...f, ...fetched }));
      setSyncing(null);
      setSyncInput('');
    } catch (err: unknown) {
      // Wyciągnij faktyczny komunikat z odpowiedzi backendu
      let msg = 'Nie udało się pobrać danych.';
      if (err && typeof err === 'object' && 'response' in err) {
        const resp = (err as { response?: { data?: { message?: string } } }).response;
        if (resp?.data?.message) msg = resp.data.message;
      }
      setSyncError(msg);
    } finally {
      setSaving(false);
    }
  }

  const inputStyle = {
    width: '100%',
    background: t.inputBg,
    border: `1px solid ${t.inputBorder}`,
    borderRadius: 8,
    padding: '9px 12px',
    color: t.text,
    fontSize: 13,
    fontFamily: 'Inter, sans-serif',
    outline: 'none',
  };

  const labelStyle = { fontSize: 11, color: t.textMuted, marginBottom: 5, display: 'block' as const };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try { await onSave(form); } finally { setSaving(false); }
  }

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, backdropFilter: 'blur(4px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 16, padding: 28, width: 480, maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 18, fontWeight: 700, color: t.text, marginBottom: 24 }}>
          {initial ? 'Edytuj wpis' : 'Dodaj grę multiplayerową'}
        </div>

        {/* Auto-fill from API */}
        {!initial && (
          <div style={{ marginBottom: 24, background: t.bgElevated, borderRadius: 12, padding: 16 }}>
            <div style={{ fontSize: 11, color: t.textFaint, letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 12 }}>Pobierz automatycznie</div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
              <button type="button" onClick={() => { setSyncing('lol'); setSyncError(''); }}
                style={{ flex: 1, padding: '8px 0', borderRadius: 8, border: `1px solid ${syncing === 'lol' ? '#C89B3C' : t.border}`, background: syncing === 'lol' ? 'rgba(200,155,60,0.12)' : 'transparent', color: syncing === 'lol' ? '#C89B3C' : t.textMuted, cursor: 'pointer', fontSize: 12, fontFamily: 'Inter, sans-serif', fontWeight: syncing === 'lol' ? 600 : 400 }}>
                LoL / Riot
              </button>
              <button type="button" onClick={() => { setSyncing('cs2'); setSyncError(''); }}
                style={{ flex: 1, padding: '8px 0', borderRadius: 8, border: `1px solid ${syncing === 'cs2' ? '#4b8cff' : t.border}`, background: syncing === 'cs2' ? 'rgba(75,140,255,0.12)' : 'transparent', color: syncing === 'cs2' ? '#4b8cff' : t.textMuted, cursor: 'pointer', fontSize: 12, fontFamily: 'Inter, sans-serif', fontWeight: syncing === 'cs2' ? 600 : 400 }}>
                CS2 / Steam
              </button>
            </div>

            {syncing === 'lol' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input value={syncInput} onChange={e => setSyncInput(e.target.value)} placeholder="Riot ID  np. Faker#KR1"
                    style={{ flex: 1, background: t.inputBg, border: `1px solid ${t.inputBorder}`, borderRadius: 8, padding: '8px 12px', color: t.text, fontSize: 13, fontFamily: 'Inter, sans-serif', outline: 'none' }} />
                  <select value={lolPlatform} onChange={e => setLolPlatform(e.target.value)}
                    style={{ background: t.inputBg, border: `1px solid ${t.inputBorder}`, borderRadius: 8, padding: '8px 10px', color: t.textMuted, fontSize: 12, fontFamily: 'Inter, sans-serif', outline: 'none', cursor: 'pointer' }}>
                    {['eun1','euw1','na1','kr','br1','la1','la2','oc1','tr1','ru','jp1'].map(r => <option key={r} value={r}>{r.toUpperCase()}</option>)}
                  </select>
                </div>
                <button type="button" disabled={saving} onClick={() => handleSync('lol')}
                  style={{ padding: '8px 0', background: '#C89B3C', border: 'none', borderRadius: 8, color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: 'Inter, sans-serif' }}>
                  {saving ? 'Pobieranie...' : 'Pobierz rangi LoL'}
                </button>
              </div>
            )}

            {syncing === 'cs2' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <input value={syncInput} onChange={e => setSyncInput(e.target.value)} placeholder="Steam ID 64-bit  np. 76561198..."
                  style={{ background: t.inputBg, border: `1px solid ${t.inputBorder}`, borderRadius: 8, padding: '8px 12px', color: t.text, fontSize: 13, fontFamily: 'Inter, sans-serif', outline: 'none' }} />
                <button type="button" disabled={saving} onClick={() => handleSync('cs2')}
                  style={{ padding: '8px 0', background: '#4b8cff', border: 'none', borderRadius: 8, color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: 'Inter, sans-serif' }}>
                  {saving ? 'Pobieranie...' : 'Pobierz statystyki CS2'}
                </button>
              </div>
            )}

            {syncError && <div style={{ fontSize: 12, color: '#ef4444', marginTop: 6 }}>{syncError}</div>}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            {/* Tytuł gry */}
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>Tytuł gry *</label>
              <input required style={inputStyle} value={form.gameTitle} onChange={e => set('gameTitle', e.target.value)} placeholder="np. Valorant" />
            </div>

            {/* Tryb */}
            <div>
              <label style={labelStyle}>Tryb gry</label>
              <input style={inputStyle} value={form.mode ?? ''} onChange={e => set('mode', e.target.value)} placeholder="np. 5v5 Tactical" />
            </div>

            {/* Platforma */}
            <div>
              <label style={labelStyle}>Platforma</label>
              <select style={{ ...inputStyle, cursor: 'pointer' }} value={form.platform ?? 'PC'} onChange={e => set('platform', e.target.value)}>
                {['PC','PS5','PS4','Xbox','Switch','Mobile'].map(p => <option key={p}>{p}</option>)}
              </select>
            </div>

            {/* Tier */}
            <div>
              <label style={labelStyle}>Tier</label>
              <select style={{ ...inputStyle, cursor: 'pointer', color: tierColor(form.tier) }} value={form.tier ?? ''} onChange={e => set('tier', e.target.value)}>
                <option value="">— brak —</option>
                {TIERS.map(t => <option key={t} value={t} style={{ color: tierColor(t) }}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
              </select>
            </div>

            {/* Ranga */}
            <div>
              <label style={labelStyle}>Ranga</label>
              <input style={inputStyle} value={form.rank ?? ''} onChange={e => set('rank', e.target.value)} placeholder="np. Diamond 2" />
            </div>

            {/* LP / RP */}
            <div>
              <label style={labelStyle}>LP / RP (aktualne)</label>
              <input type="number" min={0} style={inputStyle} value={form.rankPoints ?? ''} onChange={e => set('rankPoints', e.target.value ? +e.target.value : undefined)} placeholder="np. 78" />
            </div>

            {/* LP max */}
            <div>
              <label style={labelStyle}>LP / RP (maksimum)</label>
              <input type="number" min={1} style={inputStyle} value={form.rankPointsMax ?? 100} onChange={e => set('rankPointsMax', +e.target.value || 100)} />
            </div>

            {/* Win rate */}
            <div>
              <label style={labelStyle}>Win Rate (%)</label>
              <input type="number" min={0} max={100} step={0.1} style={inputStyle} value={form.winRate ?? ''} onChange={e => set('winRate', e.target.value ? +e.target.value : undefined)} placeholder="np. 54" />
            </div>

            {/* K/D */}
            <div>
              <label style={labelStyle}>K/D Ratio</label>
              <input type="number" min={0} step={0.01} style={inputStyle} value={form.kdRatio ?? ''} onChange={e => set('kdRatio', e.target.value ? +e.target.value : undefined)} placeholder="np. 1.42" />
            </div>

            {/* Godziny */}
            <div>
              <label style={labelStyle}>Godziny rozgrywki</label>
              <input type="number" min={0} style={inputStyle} value={form.hoursPlayed ?? ''} onChange={e => set('hoursPlayed', e.target.value ? +e.target.value : undefined)} placeholder="np. 340" />
            </div>

            {/* Nick */}
            <div>
              <label style={labelStyle}>Nick w grze</label>
              <input style={inputStyle} value={form.inGameUsername ?? ''} onChange={e => set('inGameUsername', e.target.value)} placeholder="np. Player#1234" />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 24, justifyContent: 'flex-end' }}>
            <button type="button" onClick={onClose} style={{ padding: '9px 20px', background: 'transparent', border: `1px solid ${t.border}`, borderRadius: 8, color: t.textMuted, cursor: 'pointer', fontSize: 13, fontFamily: 'Inter, sans-serif' }}>
              Anuluj
            </button>
            <button type="submit" disabled={saving} style={{ padding: '9px 22px', background: t.accent, border: 'none', borderRadius: 8, color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: 'Inter, sans-serif', boxShadow: `0 0 16px ${t.accentGlow}` }}>
              {saving ? 'Zapisuję...' : 'Zapisz'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ── Detail view ── */
function EntryDetail({
  entry,
  onBack,
  onEdit,
  onDelete,
}: {
  entry: MultiplayerEntryDto;
  onBack: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { t } = useTheme();
  const tc = tierColor(entry.tier);
  const icon = TIER_ICONS[entry.tier?.toLowerCase() ?? ''] ?? '◆';
  const pct = entry.rankPoints != null && entry.rankPointsMax
    ? Math.min(100, (entry.rankPoints / entry.rankPointsMax) * 100)
    : null;

  const statBox = (label: string, value: string | number | undefined) =>
    value != null ? (
      <div style={{ background: t.bgElevated, borderRadius: 10, padding: '14px 18px', textAlign: 'center' as const }}>
        <div style={{ fontSize: 22, fontWeight: 800, color: t.text, fontFamily: 'Syne, sans-serif' }}>{value}</div>
        <div style={{ fontSize: 11, color: t.textMuted, marginTop: 3 }}>{label}</div>
      </div>
    ) : null;

  return (
    <div style={{ maxWidth: 680, margin: '0 auto' }}>
      {/* Back */}
      <button onClick={onBack} style={{ background: 'none', border: 'none', color: t.textMuted, cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 20, fontFamily: 'Inter, sans-serif', padding: 0 }}>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 12L6 8l4-4"/></svg>
        Wszystkie gry
      </button>

      {/* Header card */}
      <div style={{ background: t.bgCard, border: `1px solid ${tc}50`, borderRadius: 16, padding: 24, marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20 }}>
          {/* Tier badge */}
          <div style={{ width: 64, height: 64, borderRadius: 14, background: `${tc}20`, border: `2px solid ${tc}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, color: tc, flexShrink: 0 }}>
            {icon}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 22, fontWeight: 800, color: t.text, margin: 0, marginBottom: 4 }}>
              {entry.gameTitle}
            </h2>
            {entry.mode && <div style={{ fontSize: 12, color: t.textMuted, marginBottom: 10 }}>{entry.mode}</div>}
            {entry.rank && (
              <div style={{ fontSize: 18, fontWeight: 700, color: tc, fontFamily: 'Syne, sans-serif', marginBottom: 8 }}>
                {entry.rank}
              </div>
            )}
            {/* Progress bar */}
            {pct !== null && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 11, color: t.textMuted }}>Do awansu</span>
                  <span style={{ fontSize: 11, color: tc }}>{entry.rankPoints} / {entry.rankPointsMax} LP</span>
                </div>
                <div style={{ height: 6, background: t.bgElevated, borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: tc, borderRadius: 3, transition: 'width 0.4s' }} />
                </div>
              </div>
            )}
          </div>
          {/* Actions */}
          <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
            <button onClick={onEdit} style={{ padding: '7px 14px', background: `${t.accent}20`, border: `1px solid ${t.accent}50`, borderRadius: 8, color: t.accent, cursor: 'pointer', fontSize: 12, fontFamily: 'Inter, sans-serif' }}>
              Edytuj
            </button>
            <button onClick={onDelete} style={{ padding: '7px 14px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, color: '#ef4444', cursor: 'pointer', fontSize: 12, fontFamily: 'Inter, sans-serif' }}>
              Usuń
            </button>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
        {statBox('Win Rate', entry.winRate != null ? `${entry.winRate.toFixed(1)}%` : undefined)}
        {statBox('K/D Ratio', entry.kdRatio?.toFixed(2))}
        {statBox('Godzin', entry.hoursPlayed)}
      </div>

      {/* Meta info */}
      <div style={{ background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 12, padding: '14px 20px', display: 'flex', gap: 24, flexWrap: 'wrap' as const }}>
        {entry.platform && (
          <div><span style={{ fontSize: 11, color: t.textFaint }}>Platforma</span><div style={{ fontSize: 13, color: t.text, marginTop: 2 }}>{entry.platform}</div></div>
        )}
        {entry.inGameUsername && (
          <div><span style={{ fontSize: 11, color: t.textFaint }}>Nick</span><div style={{ fontSize: 13, color: t.text, marginTop: 2 }}>{entry.inGameUsername}</div></div>
        )}
        <div><span style={{ fontSize: 11, color: t.textFaint }}>Ostatnia aktualizacja</span><div style={{ fontSize: 13, color: t.text, marginTop: 2 }}>{new Date(entry.updatedAt).toLocaleDateString('pl-PL')}</div></div>
      </div>
    </div>
  );
}

/* ── Main page ── */
export default function MultiplayerPage() {
  const { t } = useTheme();
  const [entries, setEntries] = useState<MultiplayerEntryDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<MultiplayerEntryDto | null>(null);
  const [modal, setModal] = useState<'add' | 'edit' | null>(null);

  useEffect(() => {
    getMultiplayerEntries()
      .then(setEntries)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleSave(dto: UpsertMultiplayerEntryDto) {
    if (modal === 'edit' && selected) {
      const updated = await updateMultiplayerEntry(selected.id, dto);
      setEntries(es => es.map(e => e.id === updated.id ? updated : e));
      setSelected(updated);
    } else {
      const created = await createMultiplayerEntry(dto);
      setEntries(es => [...es, created]);
    }
    setModal(null);
  }

  async function handleDelete() {
    if (!selected) return;
    await deleteMultiplayerEntry(selected.id);
    setEntries(es => es.filter(e => e.id !== selected.id));
    setSelected(null);
  }

  if (loading) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: t.bg }}>
        <div style={{ width: 32, height: 32, border: `2px solid ${t.accent}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  return (
    <div style={{ flex: 1, overflow: 'auto', padding: '32px 36px', background: t.bg }}>

      {/* Detail view */}
      {selected && modal === null && (
        <EntryDetail
          entry={selected}
          onBack={() => setSelected(null)}
          onEdit={() => setModal('edit')}
          onDelete={handleDelete}
        />
      )}

      {/* List view */}
      {!selected && (
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
            <div>
              <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 26, fontWeight: 700, color: t.text, margin: 0 }}>Multiplayer</h1>
              <div style={{ fontSize: 13, color: t.textMuted, marginTop: 4 }}>{entries.length} {entries.length === 1 ? 'gra' : 'gier'} w trackingu</div>
            </div>
            <button
              onClick={() => setModal('add')}
              style={{ padding: '9px 18px', background: t.accent, border: 'none', borderRadius: 9, color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: 'Inter, sans-serif', boxShadow: `0 0 20px ${t.accentGlow}` }}
            >
              + Dodaj grę
            </button>
          </div>

          {/* Empty state */}
          {entries.length === 0 && (
            <div style={{ textAlign: 'center', padding: '80px 24px' }}>
              <div style={{ fontSize: 40, marginBottom: 16 }}>🎮</div>
              <div style={{ fontSize: 15, color: t.textMuted, marginBottom: 8 }}>Brak gier multiplayerowych</div>
              <div style={{ fontSize: 13, color: t.textFaint }}>Dodaj swoją pierwszą grę i śledź rangi</div>
            </div>
          )}

          {/* Entry cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {entries.map(entry => {
              const tc = tierColor(entry.tier);
              const icon = TIER_ICONS[entry.tier?.toLowerCase() ?? ''] ?? '◆';
              const pct = entry.rankPoints != null && entry.rankPointsMax
                ? Math.min(100, (entry.rankPoints / entry.rankPointsMax) * 100)
                : null;

              return (
                <div
                  key={entry.id}
                  onClick={() => setSelected(entry)}
                  style={{ background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 12, padding: '16px 20px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 16, transition: 'border-color 0.15s, box-shadow 0.15s' }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLDivElement).style.borderColor = tc;
                    (e.currentTarget as HTMLDivElement).style.boxShadow = `0 0 14px ${tc}30`;
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLDivElement).style.borderColor = t.border;
                    (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
                  }}
                >
                  {/* Tier icon */}
                  <div style={{ width: 44, height: 44, borderRadius: 10, background: `${tc}18`, border: `1px solid ${tc}50`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, color: tc, flexShrink: 0 }}>
                    {icon}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: t.text, fontFamily: 'Syne, sans-serif' }}>{entry.gameTitle}</div>
                    <div style={{ fontSize: 11, color: t.textMuted, marginTop: 2 }}>
                      {[entry.mode, entry.platform].filter(Boolean).join(' · ')}
                    </div>
                    {/* Progress bar */}
                    {pct !== null && (
                      <div style={{ marginTop: 7, height: 3, background: t.bgElevated, borderRadius: 2, overflow: 'hidden', maxWidth: 200 }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: tc, borderRadius: 2 }} />
                      </div>
                    )}
                  </div>

                  {/* Rank + stats */}
                  <div style={{ textAlign: 'right' as const, flexShrink: 0 }}>
                    {entry.rank && <div style={{ fontSize: 14, fontWeight: 700, color: tc, fontFamily: 'Syne, sans-serif' }}>{entry.rank}</div>}
                    <div style={{ fontSize: 11, color: t.textMuted, marginTop: 3, display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                      {entry.winRate != null && <span>{entry.winRate.toFixed(0)}% WR</span>}
                      {entry.hoursPlayed != null && <span>{entry.hoursPlayed}h</span>}
                    </div>
                  </div>

                  {/* Arrow */}
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke={t.textFaint} strokeWidth="1.5" style={{ flexShrink: 0 }}>
                    <path d="M6 4l4 4-4 4"/>
                  </svg>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal */}
      {modal && (
        <EntryModal
          initial={modal === 'edit' ? selected ?? undefined : undefined}
          onSave={handleSave}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}
