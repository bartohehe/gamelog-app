import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Gamepad2, Search, Library, LogOut, LogIn, UserPlus } from 'lucide-react';

export default function Navbar() {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="bg-bg-card border-b border-white/10 px-6 py-4 flex items-center justify-between sticky top-0 z-50">
      <Link to="/" className="flex items-center gap-2 text-accent-gold font-bold text-xl hover:opacity-80 transition-opacity">
        <Gamepad2 size={24} />
        GameLog
      </Link>

      <div className="flex items-center gap-4">
        {isAuthenticated ? (
          <>
            <Link to="/search" className="flex items-center gap-1.5 text-text-primary/70 hover:text-text-primary transition-colors text-sm">
              <Search size={16} /> Szukaj
            </Link>
            <Link to="/library" className="flex items-center gap-1.5 text-text-primary/70 hover:text-text-primary transition-colors text-sm">
              <Library size={16} /> Biblioteka
            </Link>
            <span className="text-text-primary/40 text-sm">{user?.username}</span>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-text-primary/70 hover:text-red-400 transition-colors text-sm"
            >
              <LogOut size={16} /> Wyloguj
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="flex items-center gap-1.5 text-text-primary/70 hover:text-text-primary transition-colors text-sm">
              <LogIn size={16} /> Zaloguj
            </Link>
            <Link to="/register" className="flex items-center gap-1.5 bg-accent-purple text-white px-4 py-2 rounded-lg hover:bg-accent-purple/80 transition-colors text-sm">
              <UserPlus size={16} /> Zarejestruj
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
