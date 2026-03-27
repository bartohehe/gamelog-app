import { useEffect, useState } from 'react';
import { Trophy, Gamepad2, Star, Clock, Edit2, Check, X } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';

interface UserInfo { id: number; email: string; username: string; createdAt: string; }
interface Stats { totalGames: number; completed: number; playing: number; backlog: number; }
interface UserGame {
  id: number; status: string; rating?: number; addedAt: string;
  game: { title: string; genre?: string };
}

const ACHIEVEMENTS = [
  { emoji: '🎮', name: 'First Game', desc: 'Added your first game', threshold: 1, key: 'totalGames' },
  { emoji: '🏆', name: 'Completionist', desc: 'Completed 10 games', threshold: 10, key: 'completed' },
  { emoji: '📚', name: 'Collector', desc: 'Library of 25 games', threshold: 25, key: 'totalGames' },
  { emoji: '⭐', name: 'Critic', desc: 'Rated 5 games', threshold: 5, key: 'rated' },
  { emoji: '🔥', name: 'Active Player', desc: 'Playing 3 games at once', threshold: 3, key: 'playing' },
  { emoji: '💯', name: 'Perfectionist', desc: 'Gave a 100 score', threshold: 1, key: 'perfect' },
];

export default function Profile() {
  const { user } = useAuth();
  const [info, setInfo] = useState<UserInfo | null>(null);
  const [stats, setStats] = useState<Stats>({ totalGames: 0, completed: 0, playing: 0, backlog: 0 });
  const [activity, setActivity] = useState<UserGame[]>([]);
  const [editing, setEditing] = useState(false);
  const [editUsername, setEditUsername] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/users/me').then(r => { setInfo(r.data); setEditUsername(r.data.username); setEditEmail(r.data.email); }).catch(() => {});
    api.get('/stats/summary').then(r => setStats(r.data)).catch(() => {});
    api.get('/usergames').then(r => setActivity((r.data as UserGame[]).slice(0, 8))).catch(() => {});
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const r = await api.put('/users/me', { username: editUsername, email: editEmail });
      setInfo(r.data);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  const initials = (info?.username ?? user?.username ?? 'U').slice(0, 2).toUpperCase();

  const ratedCount = activity.filter(g => g.rating != null).length;
  const perfectCount = activity.filter(g => g.rating === 100).length;
  const achievementValues: Record<string, number> = {
    totalGames: stats.totalGames, completed: stats.completed,
    playing: stats.playing, backlog: stats.backlog,
    rated: ratedCount, perfect: perfectCount,
  };

  const activityColor = (status: string) => {
    if (status === 'completed') return 'text-[#52E6A3]';
    if (status === 'playing') return 'text-[#5284E6]';
    return 'text-[#E65252]';
  };

  const activityLabel = (status: string) => {
    if (status === 'completed') return 'Completed';
    if (status === 'playing') return 'Started playing';
    return 'Added to library';
  };

  return (
    <main className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      {/* Profile header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex gap-6 items-start">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#E65252] to-[#5284E6] flex items-center justify-center text-white text-2xl font-bold shrink-0">
          {initials}
        </div>

        <div className="flex-1 min-w-0">
          {editing ? (
            <div className="space-y-3">
              <input
                value={editUsername}
                onChange={e => setEditUsername(e.target.value)}
                className="bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-1.5 text-sm w-full max-w-xs focus:outline-none focus:border-[#E65252]"
              />
              <input
                value={editEmail}
                onChange={e => setEditEmail(e.target.value)}
                className="bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-1.5 text-sm w-full max-w-xs focus:outline-none focus:border-[#E65252]"
              />
              <div className="flex gap-2">
                <button onClick={handleSave} disabled={saving} className="flex items-center gap-1 bg-[#52E6A3] text-slate-900 px-3 py-1.5 rounded-lg text-sm font-medium">
                  <Check className="w-3 h-3" /> {saving ? 'Saving...' : 'Save'}
                </button>
                <button onClick={() => setEditing(false)} className="flex items-center gap-1 bg-slate-700 text-white px-3 py-1.5 rounded-lg text-sm">
                  <X className="w-3 h-3" /> Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-white text-xl font-bold">{info?.username ?? user?.username}</h1>
                <button onClick={() => setEditing(true)} className="text-slate-500 hover:text-white transition-colors">
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>
              <p className="text-slate-400 text-sm">{info?.email}</p>
              <p className="text-slate-600 text-xs mt-1">
                Member since {info?.createdAt ? new Date(info.createdAt).toLocaleDateString() : '—'}
              </p>
            </>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Games Tracked', value: stats.totalGames, icon: Gamepad2, color: 'text-[#E65252]' },
          { label: 'Completed', value: stats.completed, icon: Trophy, color: 'text-[#52E6A3]' },
          { label: 'Playing Now', value: stats.playing, icon: Star, color: 'text-[#5284E6]' },
          { label: 'In Backlog', value: stats.backlog, icon: Clock, color: 'text-slate-400' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-center">
            <Icon className={`w-6 h-6 mx-auto mb-2 ${color}`} />
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
            <p className="text-slate-500 text-xs mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Achievements */}
      <section>
        <h2 className="text-white text-xl font-bold mb-4">Achievements</h2>
        <div className="grid grid-cols-3 gap-3">
          {ACHIEVEMENTS.map(ach => {
            const current = achievementValues[ach.key] ?? 0;
            const unlocked = current >= ach.threshold;
            return (
              <div
                key={ach.name}
                className={`bg-slate-900 border rounded-xl p-4 flex items-center gap-3 transition-all ${
                  unlocked ? 'border-slate-600' : 'border-slate-800 opacity-40'
                }`}
              >
                <span className="text-2xl">{ach.emoji}</span>
                <div>
                  <p className={`text-sm font-semibold ${unlocked ? 'text-white' : 'text-slate-500'}`}>{ach.name}</p>
                  <p className="text-slate-500 text-xs">{ach.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Recent Activity */}
      <section>
        <h2 className="text-white text-xl font-bold mb-4">Recent Activity</h2>
        {activity.length === 0 ? (
          <div className="text-center py-10 text-slate-500">No activity yet.</div>
        ) : (
          <div className="space-y-2">
            {activity.map(ug => (
              <div key={ug.id} className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 flex items-center gap-3">
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full bg-slate-800 ${activityColor(ug.status)}`}>
                  {activityLabel(ug.status)}
                </span>
                <span className="text-white text-sm font-medium">{ug.game.title}</span>
                {ug.game.genre && <span className="text-slate-500 text-xs">{ug.game.genre}</span>}
                <span className="ml-auto text-slate-600 text-xs">{new Date(ug.addedAt).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
