import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { getMyStats } from '../services/statsService';
import { getTopGames } from '../services/statsService';
import { getPopularGames } from '../services/gamesService';
import { getLibrary } from '../services/libraryService';
import type { UserStatsDto, TopGameDto, GameDto, UserGameDto } from '../types';
import GameRowCard from '../components/GameRowCard';
import SectionHeader from '../components/SectionHeader';

function GameRow({ games, onClickGame }: { games: (GameDto | UserGameDto | TopGameDto)[]; onClickGame: (game: GameDto | UserGameDto | TopGameDto) => void }) {
  return (
    <div style={{ display: 'flex', gap: 14, overflowX: 'auto', paddingBottom: 8, scrollbarWidth: 'thin' }}>
      {games.map((game) => (
        <GameRowCard
          key={'id' in game ? game.id : game.igdbId}
          game={game}
          onClick={() => onClickGame(game)}
        />
      ))}
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
  const [inProgressGames, setInProgressGames] = useState<UserGameDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const promises: Promise<void>[] = [
      getTopGames().then(setTopGames).catch(() => {}),
      getPopularGames().then(setPopularGames).catch(() => {}),
    ];

    if (isAuthenticated) {
      promises.push(
        getMyStats().then(setStats).catch(() => {}),
        getLibrary().then(lib => {
          setInProgressGames(lib.filter(g => g.status === 'InProgress'));
        }).catch(() => {}),
      );
    }

    Promise.all(promises).finally(() => setLoading(false));
  }, [isAuthenticated]);

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

  /* ── Niezalogowany ── */
  if (!isAuthenticated) {
    return (
      <div style={{ flex: 1, overflow: 'auto', padding: '32px 36px' }}>
        {/* Hero */}
        <div
          style={{
            background: `linear-gradient(135deg, ${t.bgElevated}, ${t.bgCard})`,
            borderRadius: 16,
            padding: '60px 40px',
            marginBottom: 40,
            border: `1px solid ${t.border}`,
          }}
        >
          <h1
            style={{
              fontFamily: 'Syne, sans-serif',
              fontSize: 46,
              fontWeight: 900,
              color: t.text,
              marginBottom: 12,
            }}
          >
            Gamelogg
          </h1>
          <p
            style={{
              fontSize: 16,
              color: t.textMuted,
              marginBottom: 28,
              maxWidth: 480,
              lineHeight: 1.7,
            }}
          >
            Śledź swoją przygodę z grami wideo. Oceniaj, recenzuj i odkrywaj nowe tytuły.
          </p>
          <div style={{ display: 'flex', gap: 12 }}>
            <button
              onClick={() => navigate('/login')}
              style={{
                padding: '12px 28px',
                background: t.accent,
                color: '#fff',
                border: 'none',
                borderRadius: 10,
                fontSize: 14,
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: `0 0 24px ${t.accentGlow}`,
              }}
            >
              Zaloguj się
            </button>
            <button
              onClick={() => navigate('/register')}
              style={{
                padding: '12px 20px',
                background: 'rgba(255,255,255,0.08)',
                color: t.text,
                border: `1px solid ${t.border}`,
                borderRadius: 10,
                fontSize: 14,
                cursor: 'pointer',
              }}
            >
              Zarejestruj
            </button>
          </div>
        </div>

        {/* Top gry */}
        {topGames.length > 0 && (
          <>
            <SectionHeader title="Najwyżej oceniane" />
            <GameRow
              games={topGames}
              onClickGame={() => navigate('/login')}
            />
          </>
        )}
      </div>
    );
  }

  /* ── Zalogowany ── */
  const kpis = stats ? [
    { label: 'Łącznie', value: stats.totalGames },
    { label: 'W trakcie', value: stats.inProgressCount },
    { label: 'Ukończone', value: stats.completedCount },
    { label: 'Porzucone', value: stats.abandonedCount },
    { label: 'Planowane', value: stats.plannedCount },
    ...(stats.averageScore != null ? [{ label: 'Średnia ocena', value: stats.averageScore.toFixed(1) }] : []),
  ] : [];

  return (
    <div style={{ flex: 1, overflow: 'auto', padding: '32px 36px' }}>
      <div style={{ maxWidth: 1100 }}>
        {/* KPI row */}
        {kpis.length > 0 && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
              gap: 12,
              marginBottom: 40,
            }}
          >
            {kpis.map(kpi => (
              <div
                key={kpi.label}
                style={{
                  background: t.bgCard,
                  border: `1px solid ${t.border}`,
                  borderRadius: 12,
                  padding: '18px 20px',
                }}
              >
                <div
                  style={{
                    fontSize: 28,
                    fontWeight: 800,
                    color: t.accent,
                    fontFamily: 'Syne, sans-serif',
                  }}
                >
                  {kpi.value}
                </div>
                <div style={{ fontSize: 11, color: t.textMuted, marginTop: 4 }}>{kpi.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Kontynuuj granie */}
        {inProgressGames.length > 0 && (
          <div style={{ marginBottom: 40 }}>
            <SectionHeader
              title="Kontynuuj granie"
              sub="Twoje aktywne gry"
              onMore={() => navigate('/library')}
            />
            <GameRow
              games={inProgressGames}
              onClickGame={(game) => navigate(`/game/${game.igdbId}`)}
            />
          </div>
        )}

        {/* Popularne teraz */}
        {topGames.length > 0 && (
          <div style={{ marginTop: 40 }}>
            <SectionHeader
              title="Popularne teraz"
              sub="Najwyżej oceniane przez społeczność"
            />
            <GameRow
              games={topGames}
              onClickGame={(game) => navigate(`/game/${game.igdbId}`)}
            />
          </div>
        )}

        {/* Odkryj nowe */}
        {popularGames.length > 0 && (
          <div style={{ marginTop: 40, marginBottom: 8 }}>
            <SectionHeader
              title="Odkryj nowe gry"
              onMore={() => navigate('/search')}
            />
            <GameRow
              games={popularGames}
              onClickGame={(game) => navigate(`/game/${game.igdbId}`)}
            />
          </div>
        )}
      </div>
    </div>
  );
}
