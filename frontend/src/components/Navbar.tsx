import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Search, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import logo from '../assets/logo.png';

export default function Navbar() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  const handleSearch = (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/library?q=${encodeURIComponent(query.trim())}`);
      setQuery('');
    }
  };

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `px-3 py-1.5 rounded text-sm font-medium transition-colors ${
      isActive ? 'bg-[#E65252] text-white' : 'text-slate-300 hover:text-white'
    }`;

  return (
    <header className="sticky top-0 z-50 bg-slate-950 border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 flex items-center gap-6 h-14">
        {/* Logo */}
        <NavLink to="/" className="flex items-center gap-2 shrink-0">
          <img src={logo} alt="GameLog" className="h-7 w-7 object-contain" />
          <span className="font-bold text-white text-lg bg-gradient-to-r from-[#E65252] to-[#5284E6] bg-clip-text text-transparent">
            GameLog
          </span>
        </NavLink>

        {/* Search */}
        <form onSubmit={handleSearch} className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search games..."
              className="w-full bg-slate-800 text-white placeholder-slate-500 pl-9 pr-4 py-1.5 rounded-lg text-sm border border-slate-700 focus:outline-none focus:border-[#E65252]"
            />
          </div>
        </form>

        {/* Nav links */}
        <nav className="flex items-center gap-1">
          <NavLink to="/" end className={navLinkClass}>Home</NavLink>
          <NavLink to="/library" className={navLinkClass}>My Games</NavLink>
          <NavLink to="/reviews" className={navLinkClass}>Reviews</NavLink>
          <NavLink to="/recommended" className={navLinkClass}>Recommended</NavLink>
          <NavLink to="/profile" className={navLinkClass}>Profile</NavLink>
        </nav>

        {/* Logout */}
        <button
          onClick={logout}
          className="ml-auto text-slate-400 hover:text-white transition-colors"
          title="Logout"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
