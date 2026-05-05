import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { getMyStats } from '../services/statsService';
import { getTopGames } from '../services/statsService';
import { getPopularGames } from '../services/gamesService';
import { getLibrary } from '../services/libraryService';
import type { UserStatsDto, TopGameDto, GameDto, UserGameDto } from '../types';
import Cover from '../components/Cover';
import ScoreBadge from '../components/ScoreBadge';
import SectionHeader from '../components/SectionHeader';

/* ── Horizontal scroll row ── */
function GameRow({
  games,
  onClickGame,
  cardHeight = 180,
}: {
  games: (TopGameDto | GameDto | UserGameDto)[];
  onClickGame: (game: TopGameDto | GameDto | UserGameDto) => void;
  cardHeight?: number;
}) {
  const { t } = useTheme();
  return (
    <div style={{ display: 'flex', gap: 14, overflowX: 'auto', paddingBottom: 8, scrollbarWidth: 'thin' }}>
      {games.map(game => {
        const igdbId = game.igdbId;
        const score = 'averageScore' in game ? game.averageScore : ('score' in game ? game.score : undefined);
        return (
          <div
            key={igdbId}
            onClick={() => onClickGame(game)}
            style={{ width: 140, flexShrink: 0, background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 10, overflow: 'hidden', cursor: 'pointer', transition: 'all 0.15s' }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLDivElement).style.borderColor = t.borderHover;
              (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-3px)';
              (e.currentTarget as HTMLDivElement).style.boxShadow = `0 10px 30px ${t.accentGlow}`;
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLDivElement).style.borderColor = t.border;
              (e.currentTarget as HTMLDivElement).style.transform = '';
              (e.currentTarget as HTMLDivElement).style.boxShadow = '';
            }}
          >
            <div style={{ height: cardHeight, position: 'relative' }}>
              <Cover title={game.title} coverImageUrl={game.coverImageUrl} />
              {score != null && score > 0 && (
                <div style={{ position: 'absolute', bottom: 6, left: 6 }}>
                  <ScoreBadge score={Math.round(score)} size="sm" />
                </div>
              )}
            </div>
            <div style={{ padding: '9px 11px' }}>
              <div style={{ fontWeight: 600, fontSize: 12, color: t.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {game.title}
              </div>
              {'releaseYear' in game && game.releaseYear && (
                <div style={{ fontSize: 11, color: t.textFaint, marginTop: 2 }}>{game.releaseYear}</div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ── Trending 2×grid card ── */
function TrendingCard({ game, onClick }: { game: TopGameDto; onClick: () => void }) {
  const { t } = useTheme();
  return (
    <div
      onClick={onClick}
      style={{ background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 12, overflow: 'hidden', cursor: 'pointer', transition: 'all 0.15s' }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLDivElement).style.borderColor = t.borderHover;
        (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLDivElement).style.borderColor = t.border;
        (e.currentTarget as HTMLDivElement).style.transform = '';
      }}
    >
      <div style={{ height: 160, position: 'relative' }}>
        <Cover title={game.title} coverImageUrl={game.coverImageUrl} />
        {game.averageScore > 0 && (
          <div style={{ position: 'absolute', bottom: 8, left: 8 }}>
            <ScoreBadge score={Math.round(game.averageScore)} size="sm" />
          </div>
        )}
      </div>
      <div style={{ padding: '10px 13px' }}>
        <div style={{ fontWeight: 700, color: t.text, fontSize: 13, marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {game.title}
        </div>
        <div style={{ fontSize: 11, color: t.textMuted }}>{game.reviewCount} ocen</div>
      </div>
    </div>
  );
}

export default function HomePage() {
  const { isAuthenticated } = useAuth();
  const { t } = useTheme();
  const navigate = useNavigate();

  const [stats, setStats] = useState<UserStatsDto | null>(null);
  const [topGames, setTopGames] = useState<TopGameDto[]>([]);
  const [popularGames, setPopularGames] = useState<GameDto[]>([]);
  const [library, setLibrary] = useState<UserGameDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const base = [
      getTopGames().then(setTopGames).catch(() => {}),
      getPopularGames().then(setPopularGames).catch(() => {}),
    ];
    const authed = isAuthenticated
      ? [
          getMyStats().then(setStats).catch(() => {}),
          getLibrary().then(setLibrary).catch(() => {}),
        ]
      : [];
    Promise.all([...base, ...authed]).finally(() => setLoading(false));
  }, [isAuthenticated]);

  const spinner = (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: t.bg }}>
      <div style={{ width: 32, height: 32, border: `2px solid ${t.accent}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (loading) return spinner;

  /* ────────── NIEZALOGOWANY ────────── */
  if (!isAuthenticated) {
    return (
      <div style={{ flex: 1, overflow: 'auto', background: t.bg }}>
        {/* Hero */}
        <div style={{ position: 'relative', height: 380 }}>
          <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(135deg, ${t.bgElevated} 0%, ${t.accent}40 100%)` }} />
          <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(to bottom, transparent 40%, ${t.bg} 100%)` }} />
          <div style={{ position: 'absolute', inset: 0, padding: '60px 40px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', maxWidth: 700 }}>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 }}>✦ Śledź swoją przygodę z grami</div>
            <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 52, fontWeight: 900, color: '#fff', lineHeight: 1, marginBottom: 16 }}>Gamelogg</h1>
            <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.65)', lineHeight: 1.7, marginBottom: 28, maxWidth: 480 }}>
              Oceniaj gry, pisz recenzje i odkrywaj nowe tytuły. Twoja osobista biblioteka gier w jednym miejscu.
            </p>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <button
                onClick={() => navigate('/login')}
                style={{ padding: '12px 28px', background: t.accent, border: 'none', borderRadius: 10, color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter, sans-serif', boxShadow: `0 0 30px ${t.accentGlow}` }}
              >
                Zaloguj się
              </button>
              <button
                onClick={() => navigate('/register')}
                style={{ padding: '12px 20px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 10, color: '#fff', fontSize: 14, cursor: 'pointer', fontFamily: 'Inter, sans-serif', backdropFilter: 'blur(8px)' }}
              >
                Zarejestruj się
              </button>
            </div>
          </div>
        </div>

        {/* Top gry */}
        {topGames.length > 0 && (
          <div style={{ padding: '0 40px 40px', marginTop: 32 }}>
            <SectionHeader title="Najwyżej oceniane" sub="Gry z najlepszymi recenzjami" />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14, marginBottom: 40 }}>
              {topGames.slice(0, 6).map(game => (
                <TrendingCard key={game.igdbId} game={game} onClick={() => navigate('/login')} />
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  /* ────────── ZALOGOWANY ────────── */
  const hero = topGames[0] ?? null;
  const inProgress = library.filter(g => g.status === 'InProgress');
  const trendingGrid = topGames.slice(0, 4);
  const discoverRow = popularGames.slice(0, 8);

  const kpis = stats
    ? [
        { label: 'Łącznie gier',   value: stats.totalGames },
        { label: 'W trakcie',      value: stats.inProgressCount },
        { label: 'Ukończone',      value: stats.completedCount },
        { label: 'Planowane',      value: stats.plannedCount },
        { label: 'Porzucone',      value: stats.abandonedCount },
        ...(stats.averageScore != null ? [{ label: 'Śr. ocena', value: stats.averageScore.toFixed(1) }] : []),
      ]
    : [];

  return (
    <div style={{ flex: 1, overflow: 'auto', background: t.bg }}>

      {/* ── Full-bleed hero ── */}
      {hero && (
        <div style={{ position: 'relative', height: 400 }}>
          {/* Background — rozmyte cover */}
          {hero.coverImageUrl ? (
            <img
              src={hero.coverImageUrl}
              alt=""
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', filter: 'blur(20px) brightness(0.4)', transform: 'scale(1.1)' }}
            />
          ) : (
            <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(135deg, ${t.bgElevated}, ${t.accent}50)` }} />
          )}
          {/* Gradient overlay */}
          <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(to bottom, transparent 30%, ${t.bg} 100%)` }} />
          <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(to right, ${t.bg}90 0%, transparent 60%)` }} />

          {/* Content */}
          <div style={{ position: 'absolute', inset: 0, padding: '60px 40px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', maxWidth: 700 }}>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 }}>✦ Popularne teraz</div>
            <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 46, fontWeight: 900, color: '#fff', lineHeight: 1, marginBottom: 12 }}>{hero.title}</h1>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 0 }}>
              {hero.averageScore > 0 && <ScoreBadge score={Math.round(hero.averageScore)} size="lg" />}
              <button
                onClick={() => navigate(`/game/${hero.igdbId}`)}
                style={{ padding: '11px 24px', background: t.accent, border: 'none', borderRadius: 10, color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter, sans-serif', boxShadow: `0 0 30px ${t.accentGlow}` }}
              >
                Szczegóły
              </button>
              <button
                onClick={() => navigate('/search')}
                style={{ padding: '11px 18px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 10, color: '#fff', fontSize: 14, cursor: 'pointer', fontFamily: 'Inter, sans-serif', backdropFilter: 'blur(8px)' }}
              >
                + Dodaj do biblioteki
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Content pod hero ── */}
      <div style={{ padding: '0 40px 40px' }}>

        {/* 2-column layout */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 32 }}>

          {/* ── Left ── */}
          <div>
            {/* Trending 2×2 grid */}
            {trendingGrid.length > 0 && (
              <>
                <SectionHeader title="Popularne teraz" sub="Najwyżej oceniane przez społeczność" />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 40 }}>
                  {trendingGrid.map(game => (
                    <TrendingCard key={game.igdbId} game={game} onClick={() => navigate(`/game/${game.igdbId}`)} />
                  ))}
                </div>
              </>
            )}

            {/* Discover row */}
            {discoverRow.length > 0 && (
              <>
                <SectionHeader title="Odkryj nowe gry" sub="Przeglądaj popularne tytuły" onMore={() => navigate('/search')} />
                <GameRow games={discoverRow} onClickGame={g => navigate(`/game/${g.igdbId}`)} />
              </>
            )}
          </div>

          {/* ── Right sidebar ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Kontynuuj granie */}
            <div style={{ background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 14, padding: 20 }}>
              <SectionHeader title="Kontynuuj" onMore={() => navigate('/library')} />
              {inProgress.length === 0 ? (
                <p style={{ fontSize: 12, color: t.textFaint, textAlign: 'center', padding: '16px 0' }}>Brak aktywnych gier</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {inProgress.slice(0, 5).map(game => (
                    <div
                      key={game.id}
                      onClick={() => navigate(`/game/${game.igdbId}`)}
                      style={{ display: 'flex', gap: 11, cursor: 'pointer', alignItems: 'center' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.opacity = '0.75'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.opacity = '1'; }}
                    >
                      <div style={{ width: 38, height: 50, borderRadius: 6, overflow: 'hidden', flexShrink: 0 }}>
                        <Cover title={game.title} coverImageUrl={game.coverImageUrl} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: 12.5, color: t.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {game.title}
                        </div>
                        <div style={{ fontSize: 11, color: t.textFaint, marginTop: 2 }}>{game.platform}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Moja biblioteka — statsy */}
            {stats && (
              <div style={{ background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 14, padding: 20 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: t.text, fontFamily: 'Syne, sans-serif', marginBottom: 16 }}>Moja biblioteka</div>
                {[
                  { label: 'Ukończone', value: stats.completedCount, color: t.statusCompleted },
                  { label: 'W trakcie', value: stats.inProgressCount, color: t.statusInProgress },
                  { label: 'Planowane', value: stats.plannedCount, color: t.statusPlanned },
                  { label: 'Porzucone', value: stats.abandonedCount, color: t.statusAbandoned },
                ].map(row => (
                  <div
                    key={row.label}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: row.color }} />
                      <span style={{ fontSize: 12, color: t.textMuted }}>{row.label}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, margin: '0 12px' }}>
                      <div style={{ flex: 1, height: 3, background: t.bgElevated, borderRadius: 2, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${stats.totalGames > 0 ? (row.value / stats.totalGames) * 100 : 0}%`, background: row.color, borderRadius: 2 }} />
                      </div>
                    </div>
                    <span style={{ fontSize: 12, color: t.textFaint, minWidth: 20, textAlign: 'right' }}>{row.value}</span>
                  </div>
                ))}
                {stats.averageScore != null && (
                  <div style={{ marginTop: 16, paddingTop: 14, borderTop: `1px solid ${t.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 12, color: t.textMuted }}>Średnia ocena</span>
                    <span style={{ fontSize: 18, fontWeight: 800, color: t.accent, fontFamily: 'Syne, sans-serif' }}>{stats.averageScore.toFixed(1)}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
