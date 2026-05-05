import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { getMyStats } from '../services/statsService';
import { getLibrary } from '../services/libraryService';
import Cover from '../components/Cover';
import ScoreBadge from '../components/ScoreBadge';
import type { UserStatsDto, UserGameDto } from '../types';

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const { t } = useTheme();
  const navigate = useNavigate();
  const [stats, setStats] = useState<UserStatsDto | null>(null);
  const [library, setLibrary] = useState<UserGameDto[]>([]);

  useEffect(() => {
    getMyStats().then(setStats).catch(() => {});
    getLibrary().then(setLibrary).catch(() => {});
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const topScored = library
    .filter(g => g.score != null)
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
    .slice(0, 5);

  return (
    <div style={{ flex: 1, overflow: 'auto', padding: '32px 36px' }}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        {/* Profile card */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 24,
            marginBottom: 36,
            background: t.bgCard,
            border: `1px solid ${t.border}`,
            borderRadius: 16,
            padding: 28,
          }}
        >
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              background: t.accentGlow,
              border: `3px solid ${t.accent}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 28,
              color: t.accent,
              fontWeight: 700,
              fontFamily: 'Syne, sans-serif',
            }}
          >
            {user?.username?.[0]?.toUpperCase() ?? '?'}
          </div>
          <div style={{ flex: 1 }}>
            <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 24, fontWeight: 700, color: t.text }}>
              {user?.username}
            </h1>
            <div style={{ fontSize: 13, color: t.textMuted, marginTop: 2 }}>
              @{user?.username?.toLowerCase()}
            </div>
          </div>
          <button
            onClick={handleLogout}
            style={{
              padding: '8px 18px',
              background: 'none',
              border: `1px solid ${t.border}`,
              borderRadius: 8,
              color: t.textMuted,
              cursor: 'pointer',
              fontSize: 12,
              fontFamily: 'Inter, sans-serif',
            }}
          >
            Wyloguj się
          </button>
        </div>

        {/* Stats 4 cards */}
        {stats && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 36 }}>
            {[
              { label: 'Ukończonych', value: stats.completedCount },
              { label: 'Łącznie gier', value: stats.totalGames },
              { label: 'Średnia ocena', value: stats.averageScore != null ? stats.averageScore.toFixed(1) : '—' },
              { label: 'Zaplanowanych', value: stats.plannedCount },
            ].map(kpi => (
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
                    fontSize: 30,
                    fontWeight: 800,
                    color: t.text,
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

        {/* Top scored */}
        {topScored.length > 0 && (
          <div
            style={{
              background: t.bgCard,
              border: `1px solid ${t.border}`,
              borderRadius: 14,
              padding: 24,
            }}
          >
            <h3 style={{ fontFamily: 'Syne, sans-serif', fontSize: 16, fontWeight: 600, color: t.text, marginBottom: 16 }}>
              Top ocenione
            </h3>
            {topScored.map((game, i) => (
              <div
                key={game.id}
                onClick={() => navigate(`/game/${game.igdbId}`)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  marginBottom: 12,
                  cursor: 'pointer',
                }}
              >
                <span style={{ fontSize: 12, color: t.textFaint, minWidth: 18 }}>#{i + 1}</span>
                <div style={{ width: 34, height: 46, borderRadius: 5, overflow: 'hidden', flexShrink: 0 }}>
                  <Cover title={game.title} coverImageUrl={game.coverImageUrl} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: t.text,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {game.title}
                  </div>
                </div>
                <ScoreBadge score={game.score} size="md" />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
