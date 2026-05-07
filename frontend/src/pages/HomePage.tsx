import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useFeatureFlags } from '../contexts/FeatureFlagsContext';
import { getMyStats } from '../services/statsService';
import { getTopGames } from '../services/statsService';
import { getPopularGames, getGamesByGenre } from '../services/gamesService';
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

/* ── Trending horizontal card ── */
function TrendingCard({ game, onClick }: { game: TopGameDto; onClick: () => void }) {
  const { t } = useTheme();
  return (
    <div
      onClick={onClick}
      style={{
        background: t.bgCard,
        border: `1px solid ${t.border}`,
        borderRadius: 12,
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'border-color 0.15s, box-shadow 0.15s',
        display: 'flex',
        height: 158,
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLDivElement).style.borderColor = t.accent;
        (e.currentTarget as HTMLDivElement).style.boxShadow = `0 0 16px ${t.accentGlow}`;
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLDivElement).style.borderColor = t.border;
        (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
      }}
    >
      {/* Left: text */}
      <div style={{ flex: 1, padding: '14px 14px', display: 'flex', flexDirection: 'column', justifyContent: 'center', minWidth: 0 }}>
        <div style={{ fontWeight: 700, color: t.text, fontSize: 13, fontFamily: 'Syne, sans-serif', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 6 }}>
          {game.title}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {game.averageScore > 0 && <ScoreBadge score={Math.round(game.averageScore)} size="sm" />}
          <span style={{ fontSize: 11, color: t.textMuted }}>{game.reviewCount} ocen</span>
        </div>
      </div>
      {/* Right: cover */}
      <div style={{ width: 90, flexShrink: 0 }}>
        <Cover title={game.title} coverImageUrl={game.coverImageUrl} />
      </div>
    </div>
  );
}

export default function HomePage() {
  const { isAuthenticated } = useAuth();
  const { authEnabled } = useFeatureFlags();
  const effectivelyAuthenticated = !authEnabled || isAuthenticated;
  const { t } = useTheme();
  const navigate = useNavigate();

  const [stats, setStats] = useState<UserStatsDto | null>(null);
  const [topGames, setTopGames] = useState<TopGameDto[]>([]);
  const [popularGames, setPopularGames] = useState<GameDto[]>([]);
  const [library, setLibrary] = useState<UserGameDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [recommended, setRecommended] = useState<GameDto[]>([]);
  const [recommendedGenre, setRecommendedGenre] = useState<string | null>(null);

  useEffect(() => {
    const base = [
      getTopGames().then(setTopGames).catch(() => {}),
      getPopularGames().then(setPopularGames).catch(() => {}),
    ];
    const authed = effectivelyAuthenticated
      ? [
          getMyStats().then(setStats).catch(() => {}),
          getLibrary().then(lib => {
            setLibrary(lib);
            // Wyznacz top gatunek z ukończonych/w trakcie gier
            const genres = lib
              .filter(g => g.status === 'Completed' || g.status === 'InProgress')
              .flatMap(g => (g as unknown as { genres?: string[] }).genres ?? []);
            if (genres.length === 0) return;
            const freq = genres.reduce<Record<string, number>>((acc, g) => {
              acc[g] = (acc[g] ?? 0) + 1; return acc;
            }, {});
            const top = Object.entries(freq).sort((a, b) => b[1] - a[1])[0]?.[0];
            if (!top) return;
            setRecommendedGenre(top);
            const libIds = new Set(lib.map(g => g.igdbId));
            getGamesByGenre(top)
              .then(games => setRecommended(games.filter(g => !libIds.has(g.igdbId))))
              .catch(() => {});
          }).catch(() => {}),
        ]
      : [];
    Promise.all([...base, ...authed]).finally(() => setLoading(false));
  }, [effectivelyAuthenticated]);

  const spinner = (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: t.bg }}>
      <div style={{ width: 32, height: 32, border: `2px solid ${t.accent}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (loading) return spinner;

  /* ────────── NIEZALOGOWANY ────────── */
  if (!effectivelyAuthenticated) {
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
  const recommendedSub = recommendedGenre
    ? `Najnowsze premiery z gatunku ${recommendedGenre}`
    : 'Najnowsze gry dopasowane do Twoich upodobań';


  return (
    <div style={{ flex: 1, overflow: 'auto', background: t.bg }}>

      {/* ── Full-bleed hero ── */}
      {hero && (
        <div style={{ position: 'relative', height: 320, overflow: 'hidden' }}>
          {/* Blurred cover background */}
          {hero.coverImageUrl ? (
            <img
              src={hero.coverImageUrl}
              alt=""
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', filter: 'blur(28px) brightness(0.55)', transform: 'scale(1.15)' }}
            />
          ) : (
            <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(135deg, ${t.bgElevated}, ${t.accent}50)` }} />
          )}
          {/* Gradient — mocne przyciemnienie tylko na dole */}
          <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(to bottom, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.55) 60%, ${t.bg} 100%)` }} />
          {/* Lewa strona — łagodne przyciemnienie dla czytelności */}
          <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(to right, rgba(0,0,0,0.45) 0%, transparent 55%)` }} />

          {/* Content */}
          <div style={{ position: 'absolute', inset: 0, padding: '40px 40px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', maxWidth: 680 }}>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)', letterSpacing: 2.5, textTransform: 'uppercase', marginBottom: 10, fontWeight: 600 }}>✦ Popularne teraz</div>
            <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 42, fontWeight: 900, color: '#fff', lineHeight: 1.05, marginBottom: 16 }}>{hero.title}</h1>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              {hero.averageScore > 0 && <ScoreBadge score={Math.round(hero.averageScore)} size="lg" />}
              <button
                onClick={() => navigate(`/game/${hero.igdbId}`)}
                style={{ padding: '10px 22px', background: t.accent, border: 'none', borderRadius: 9, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter, sans-serif', boxShadow: `0 0 24px ${t.accentGlow}` }}
              >
                Szczegóły
              </button>
              <button
                onClick={() => navigate('/search')}
                style={{ padding: '10px 16px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 9, color: '#fff', fontSize: 13, cursor: 'pointer', fontFamily: 'Inter, sans-serif', backdropFilter: 'blur(6px)' }}
              >
                + Dodaj do biblioteki
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Content pod hero ── */}
      <div style={{ padding: '24px 40px 40px' }}>

        {/* 2-column layout */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 32 }}>

          {/* ── Left ── */}
          <div>
            {/* Trending 2×2 grid */}
            {trendingGrid.length > 0 && (
              <>
                <SectionHeader title="Popularne teraz" sub="Najwyżej oceniane przez społeczność" />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 40 }}>
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
                    style={{ display: 'flex', alignItems: 'center', marginBottom: 10 }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 90 }}>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: row.color, flexShrink: 0 }} />
                      <span style={{ fontSize: 12, color: t.textMuted }}>{row.label}</span>
                    </div>
                    <div style={{ flex: 1, height: 3, background: t.bgElevated, borderRadius: 2, overflow: 'hidden', margin: '0 12px' }}>
                      <div style={{ height: '100%', width: `${stats.totalGames > 0 ? (row.value / stats.totalGames) * 100 : 0}%`, background: row.color, borderRadius: 2 }} />
                    </div>
                    <span style={{ fontSize: 12, color: t.textFaint, minWidth: 16, textAlign: 'right' }}>{row.value}</span>
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

        {/* ── Polecane dla ciebie ── pełna szerokość pod gridem */}
        {recommended.length > 0 && (
          <div style={{ marginTop: 40 }}>
            <SectionHeader
              title="Polecane dla Ciebie"
              sub={recommendedSub}
              onMore={() => navigate('/search')}
            />
            <GameRow games={recommended} onClickGame={g => navigate(`/game/${g.igdbId}`)} cardHeight={200} />
          </div>
        )}
      </div>
    </div>
  );
}
