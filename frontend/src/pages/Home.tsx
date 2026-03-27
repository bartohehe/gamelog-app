import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Gamepad2, Clock, Trophy, BookOpen, Plus } from 'lucide-react';
import api from '../services/api';
import GameCard from '../components/GameCard';
import StarRating from '../components/StarRating';

interface Stats {
  totalGames: number;
  completed: number;
  playing: number;
  backlog: number;
}

interface UserGame {
  id: number;
  status: string;
  rating?: number;
  notes?: string;
  addedAt: string;
  game: { id: number; title: string; genre?: string; coverUrl?: string };
}

export default function Home() {
  const [stats, setStats] = useState<Stats>({ totalGames: 0, completed: 0, playing: 0, backlog: 0 });
  const [recentGames, setRecentGames] = useState<UserGame[]>([]);
  const [recentReviews, setRecentReviews] = useState<UserGame[]>([]);

  useEffect(() => {
    api.get('/stats/summary').then(r => setStats(r.data)).catch(() => {});
    api.get('/usergames').then(r => {
      const all: UserGame[] = r.data;
      setRecentGames(all.slice(0, 8));
      setRecentReviews(all.filter(g => g.rating != null).slice(0, 4));
    }).catch(() => {});
  }, []);

  const statCards = [
    { label: 'Total Games', value: stats.totalGames, icon: Gamepad2, color: 'from-[#E65252]/20 to-[#E65252]/5', iconColor: 'text-[#E65252]' },
    { label: 'Total Hours', value: '—', icon: Clock, color: 'from-[#52E6A3]/20 to-[#52E6A3]/5', iconColor: 'text-[#52E6A3]' },
    { label: 'Completed', value: stats.completed, icon: Trophy, color: 'from-[#5284E6]/20 to-[#5284E6]/5', iconColor: 'text-[#5284E6]' },
  ];

  return (
    <main className="max-w-7xl mx-auto px-4 py-8 space-y-10">
      {/* Stats */}
      <section className="grid grid-cols-3 gap-4">
        {statCards.map(({ label, value, icon: Icon, color, iconColor }) => (
          <div key={label} className={`bg-gradient-to-br ${color} border border-slate-800 rounded-2xl p-5 flex items-center gap-4`}>
            <div className={`${iconColor} p-3 bg-slate-900/50 rounded-xl`}>
              <Icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-slate-400 text-sm">{label}</p>
              <p className="text-white text-2xl font-bold">{value}</p>
            </div>
          </div>
        ))}
      </section>

      {/* Trending / Recent Games */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white text-xl font-bold">My Games</h2>
          <Link to="/library" className="text-[#E65252] text-sm hover:underline">View all →</Link>
        </div>
        {recentGames.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-10 text-center text-slate-500">
            No games added yet.{' '}
            <Link to="/library" className="text-[#E65252] hover:underline">Add your first game →</Link>
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-4">
            {recentGames.map(ug => (
              <GameCard
                key={ug.id}
                title={ug.game.title}
                genre={ug.game.genre}
                coverUrl={ug.game.coverUrl}
                status={ug.status}
                rating={ug.rating}
              />
            ))}
          </div>
        )}
      </section>

      {/* Latest Reviews */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white text-xl font-bold">Latest Reviews</h2>
          <Link to="/reviews" className="text-[#E65252] text-sm hover:underline">View all →</Link>
        </div>
        {recentReviews.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center text-slate-500">
            No reviews yet.{' '}
            <Link to="/reviews" className="text-[#E65252] hover:underline">Write a review →</Link>
          </div>
        ) : (
          <div className="space-y-3">
            {recentReviews.map(ug => (
              <div key={ug.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex gap-4">
                <div className="w-12 h-16 bg-slate-800 rounded-lg overflow-hidden shrink-0">
                  {ug.game.coverUrl && <img src={ug.game.coverUrl} alt={ug.game.title} className="w-full h-full object-cover" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-white font-semibold text-sm truncate">{ug.game.title}</h3>
                    <StarRating value={Math.round((ug.rating ?? 0) / 20)} readonly size={14} />
                  </div>
                  {ug.notes && <p className="text-slate-400 text-xs line-clamp-2">{ug.notes}</p>}
                  <p className="text-slate-600 text-xs mt-1">{new Date(ug.addedAt).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Quick Actions */}
      <section>
        <h2 className="text-white text-xl font-bold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-4">
          <Link to="/library" className="bg-slate-900 border border-slate-800 hover:border-[#E65252] rounded-2xl p-6 flex items-center gap-4 transition-colors group">
            <div className="bg-[#E65252]/10 p-3 rounded-xl group-hover:bg-[#E65252]/20 transition-colors">
              <Plus className="w-6 h-6 text-[#E65252]" />
            </div>
            <div>
              <p className="text-white font-semibold">Add Game</p>
              <p className="text-slate-400 text-sm">Track a new game</p>
            </div>
          </Link>
          <Link to="/reviews" className="bg-slate-900 border border-slate-800 hover:border-[#0CD5EB] rounded-2xl p-6 flex items-center gap-4 transition-colors group">
            <div className="bg-[#0CD5EB]/10 p-3 rounded-xl group-hover:bg-[#0CD5EB]/20 transition-colors">
              <BookOpen className="w-6 h-6 text-[#0CD5EB]" />
            </div>
            <div>
              <p className="text-white font-semibold">Write Review</p>
              <p className="text-slate-400 text-sm">Share your thoughts</p>
            </div>
          </Link>
        </div>
      </section>
    </main>
  );
}
