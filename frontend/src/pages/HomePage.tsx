import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Trophy, Gamepad2, Clock, XCircle, Star } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import KpiCard from '../components/KpiCard';
import { getMyStats } from '../services/statsService';
import { getTopGames } from '../services/statsService';
import { getPopularGames } from '../services/gamesService';
import type { UserStatsDto, TopGameDto, GameDto } from '../types';

export default function HomePage() {
  const { isAuthenticated } = useAuth();
  const [stats, setStats] = useState<UserStatsDto | null>(null);
  const [topGames, setTopGames] = useState<TopGameDto[]>([]);
  const [popularGames, setPopularGames] = useState<GameDto[]>([]);

  useEffect(() => {
    getTopGames().then(setTopGames).catch(() => {});
    getPopularGames().then(setPopularGames).catch(() => {});
    if (isAuthenticated) {
      getMyStats().then(setStats).catch(() => {});
    }
  }, [isAuthenticated]);

  return (
    <main className="max-w-6xl mx-auto px-6 py-10 flex flex-col gap-12">

      {/* KPI section — only for authenticated users */}
      {isAuthenticated && stats && (
        <section>
          <h2 className="text-xl font-bold text-text-primary mb-4">Twoje statystyki</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <KpiCard label="Wszystkich gier" value={stats.totalGames} icon={<Gamepad2 size={28} />} color="text-accent-gold" />
            <KpiCard label="Planowane" value={stats.plannedCount} icon={<Clock size={28} />} color="text-status-planned" />
            <KpiCard label="W trakcie" value={stats.inProgressCount} icon={<Gamepad2 size={28} />} color="text-status-inprogress" />
            <KpiCard label="Ukończone" value={stats.completedCount} icon={<Trophy size={28} />} color="text-status-completed" />
            <KpiCard label="Porzucone" value={stats.abandonedCount} icon={<XCircle size={28} />} color="text-status-abandoned" />
          </div>
          {stats.averageScore !== undefined && stats.averageScore !== null && (
            <div className="mt-4 bg-bg-card rounded-xl p-4 border border-white/5 inline-flex items-center gap-3">
              <Star className="text-accent-gold" size={20} />
              <span className="text-text-primary/60 text-sm">Średnia ocena:</span>
              <span className="text-accent-gold font-bold">{stats.averageScore.toFixed(1)}/100</span>
            </div>
          )}
        </section>
      )}

      {/* Hero — for unauthenticated */}
      {!isAuthenticated && (
        <section className="text-center py-16">
          <div className="text-6xl mb-6">🎮</div>
          <h1 className="text-4xl font-bold text-text-primary mb-4">
            Twoja biblioteka gier
          </h1>
          <p className="text-text-primary/50 text-lg max-w-xl mx-auto mb-8">
            Śledź gry które grałeś, planujesz zagrać i oceniaj je. Dołącz do GameLog.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link to="/register" className="bg-accent-purple text-white px-6 py-3 rounded-xl font-medium hover:bg-accent-purple/80 transition-colors">
              Zacznij za darmo
            </Link>
            <Link to="/login" className="border border-white/20 text-text-primary/70 px-6 py-3 rounded-xl hover:bg-white/5 transition-colors">
              Zaloguj się
            </Link>
          </div>
        </section>
      )}

      {/* Top rated by users */}
      {topGames.length > 0 && (
        <section>
          <h2 className="text-xl font-bold text-text-primary mb-4 flex items-center gap-2">
            <Trophy className="text-accent-gold" size={20} /> Najwyżej oceniane
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {topGames.map(game => (
              <Link
                key={game.rawgId}
                to={isAuthenticated ? `/game/${game.rawgId}` : '/login'}
                className="bg-bg-card rounded-xl overflow-hidden border border-white/5 hover:border-accent-purple/40 transition-all group"
              >
                <div className="h-32 bg-bg-primary flex items-center justify-center text-3xl">🎮</div>
                <div className="p-3">
                  <p className="text-text-primary text-xs font-medium line-clamp-2 leading-snug">{game.title}</p>
                  <p className="text-accent-gold text-xs font-bold mt-1">⭐ {game.averageScore.toFixed(1)}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Popular from RAWG */}
      {popularGames.length > 0 && (
        <section>
          <h2 className="text-xl font-bold text-text-primary mb-4 flex items-center gap-2">
            <Star className="text-accent-purple" size={20} /> Popularne gry
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {popularGames.map(game => (
              <Link
                key={game.rawgId}
                to={isAuthenticated ? `/game/${game.rawgId}` : '/login'}
                className="bg-bg-card rounded-xl overflow-hidden border border-white/5 hover:border-accent-purple/40 transition-all group"
              >
                {game.coverImageUrl ? (
                  <img src={game.coverImageUrl} alt={game.title} className="w-full h-32 object-cover" />
                ) : (
                  <div className="h-32 bg-bg-primary flex items-center justify-center text-3xl">🎮</div>
                )}
                <div className="p-3">
                  <p className="text-text-primary text-xs font-medium line-clamp-2 leading-snug">{game.title}</p>
                  {game.releaseYear && (
                    <p className="text-text-primary/40 text-xs mt-1">{game.releaseYear}</p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

    </main>
  );
}
