import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import type { AuthResponseDto } from '../types';

export default function RegisterPage() {
  const { login } = useAuth();
  const { t } = useTheme();
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
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err && (err as { response?: { status?: number } }).response?.status === 409) {
        setError('Ten email jest już zajęty.');
      } else {
        setError('Wystąpił błąd podczas rejestracji.');
      }
    } finally {
      setLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    background: t.inputBg,
    border: `1px solid ${t.inputBorder}`,
    borderRadius: 8,
    padding: '11px 14px',
    color: t.text,
    fontSize: 14,
    fontFamily: 'Inter, sans-serif',
    outline: 'none',
    transition: 'border-color 0.15s',
  };

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        background: t.bg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          background: t.bgCard,
          border: `1px solid ${t.border}`,
          borderRadius: 16,
          padding: 40,
          width: 420,
          maxWidth: 'calc(100vw - 32px)',
        }}
      >
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32 }}>
          <div
            style={{
              width: 36,
              height: 36,
              background: t.accent,
              borderRadius: 9,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 18,
              fontWeight: 900,
              color: '#fff',
              fontFamily: 'Syne, sans-serif',
              boxShadow: `0 0 18px ${t.accentGlow}`,
            }}
          >
            G
          </div>
          <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 20, color: t.text }}>
            Gamelogg
          </span>
        </div>

        <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 22, fontWeight: 700, color: t.text, marginBottom: 24 }}>
          Utwórz konto
        </h2>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ fontSize: 13, color: t.textMuted, display: 'block', marginBottom: 6 }}>Nazwa użytkownika</label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
              minLength={3}
              placeholder="GraczXD"
              style={inputStyle}
              onFocus={e => { (e.target as HTMLInputElement).style.borderColor = t.accent; }}
              onBlur={e => { (e.target as HTMLInputElement).style.borderColor = t.inputBorder; }}
            />
          </div>
          <div>
            <label style={{ fontSize: 13, color: t.textMuted, display: 'block', marginBottom: 6 }}>Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              placeholder="jan@example.com"
              style={inputStyle}
              onFocus={e => { (e.target as HTMLInputElement).style.borderColor = t.accent; }}
              onBlur={e => { (e.target as HTMLInputElement).style.borderColor = t.inputBorder; }}
            />
          </div>
          <div>
            <label style={{ fontSize: 13, color: t.textMuted, display: 'block', marginBottom: 6 }}>Hasło</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={6}
              placeholder="••••••••"
              style={inputStyle}
              onFocus={e => { (e.target as HTMLInputElement).style.borderColor = t.accent; }}
              onBlur={e => { (e.target as HTMLInputElement).style.borderColor = t.inputBorder; }}
            />
          </div>

          {error && <p style={{ color: '#ef4444', fontSize: 13 }}>{error}</p>}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px',
              background: t.accent,
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1,
              boxShadow: `0 0 24px ${t.accentGlow}`,
              fontFamily: 'Inter, sans-serif',
              transition: 'opacity 0.15s',
            }}
          >
            {loading ? 'Rejestracja...' : 'Zarejestruj się'}
          </button>
        </form>

        <p style={{ textAlign: 'center', color: t.textMuted, fontSize: 13, marginTop: 24 }}>
          Masz już konto?{' '}
          <Link to="/login" style={{ color: t.accent, textDecoration: 'none' }}>
            Zaloguj się
          </Link>
        </p>
      </div>
    </div>
  );
}
