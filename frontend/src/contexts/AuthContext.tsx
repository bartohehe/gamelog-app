import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import api from '../services/api';

interface AuthUser {
  id: number;
  username: string;
  token: string;
}

interface AuthContextType {
  user: AuthUser | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, username: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const username = localStorage.getItem('username');
    const id = localStorage.getItem('userId');
    if (token && username && id) {
      setUser({ token, username, id: parseInt(id) });
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api.post('/auth/login', { email, password });
    const { token, username, userId } = res.data;
    localStorage.setItem('token', token);
    localStorage.setItem('username', username);
    localStorage.setItem('userId', String(userId));
    setUser({ token, username, id: userId });
  };

  const register = async (email: string, username: string, password: string) => {
    const res = await api.post('/auth/register', { email, username, password });
    const { token, username: uname, userId } = res.data;
    localStorage.setItem('token', token);
    localStorage.setItem('username', uname);
    localStorage.setItem('userId', String(userId));
    setUser({ token, username: uname, id: userId });
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('userId');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
