import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Gamepad2 } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import type { AuthResponseDto } from '../types';

export default function RegisterPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await api.post<AuthResponseDto>('/api/auth/register', { username, email, password });
      login(res.data);
      navigate('/');
    } catch (err: any) {
      if (err.response?.status === 409) {
        setError('Ten email jest już zajęty.');
      } else {
        setError('Wystąpił błąd podczas rejestracji.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center p-4">
      <div className="bg-bg-card rounded-2xl p-8 w-full max-w-md border border-white/10">
        <div className="flex items-center gap-3 mb-8">
          <Gamepad2 className="text-accent-gold" size={32} />
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Dołącz do GameLog</h1>
            <p className="text-text-primary/50 text-sm">Stwórz konto i śledź swoje gry</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="text-sm text-text-primary/60 mb-1.5 block">Nazwa użytkownika</label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
              minLength={3}
              className="w-full bg-bg-primary border border-white/10 rounded-lg px-4 py-3 text-text-primary text-sm focus:outline-none focus:border-accent-purple transition-colors"
              placeholder="GraczXD"
            />
          </div>
          <div>
            <label className="text-sm text-text-primary/60 mb-1.5 block">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="w-full bg-bg-primary border border-white/10 rounded-lg px-4 py-3 text-text-primary text-sm focus:outline-none focus:border-accent-purple transition-colors"
              placeholder="jan@example.com"
            />
          </div>
          <div>
            <label className="text-sm text-text-primary/60 mb-1.5 block">Hasło</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full bg-bg-primary border border-white/10 rounded-lg px-4 py-3 text-text-primary text-sm focus:outline-none focus:border-accent-purple transition-colors"
              placeholder="••••••••"
            />
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-accent-purple text-white py-3 rounded-lg font-medium hover:bg-accent-purple/80 transition-colors disabled:opacity-50 mt-2"
          >
            {loading ? 'Rejestracja...' : 'Zarejestruj się'}
          </button>
        </form>

        <p className="text-center text-text-primary/50 text-sm mt-6">
          Masz już konto?{' '}
          <Link to="/login" className="text-accent-purple hover:underline">
            Zaloguj się
          </Link>
        </p>
      </div>
    </div>
  );
}
