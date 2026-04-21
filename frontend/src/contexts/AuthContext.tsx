import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { AuthResponseDto } from '../types';

interface AuthContextType {
  user: AuthResponseDto | null;
  token: string | null;
  login: (data: AuthResponseDto) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthResponseDto | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('gamelog_auth');
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as AuthResponseDto;
        setUser(parsed);
        setToken(parsed.token);
      } catch {
        localStorage.removeItem('gamelog_auth');
      }
    }
  }, []);

  const login = (data: AuthResponseDto) => {
    localStorage.setItem('gamelog_auth', JSON.stringify(data));
    setUser(data);
    setToken(data.token);
  };

  const logout = () => {
    localStorage.removeItem('gamelog_auth');
    setUser(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
