import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { useTheme } from './contexts/ThemeContext';
import { FeatureFlagsProvider, useFeatureFlags } from './contexts/FeatureFlagsContext';
import ProtectedRoute from './components/ProtectedRoute';
import Sidebar from './components/Sidebar';
import { lazy, Suspense } from 'react';

const HomePage = lazy(() => import('./pages/HomePage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const SearchPage = lazy(() => import('./pages/SearchPage'));
const LibraryPage = lazy(() => import('./pages/LibraryPage'));
const GameDetailPage = lazy(() => import('./pages/GameDetailPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const MultiplayerPage = lazy(() => import('./pages/MultiplayerPage'));
const MediaPage = lazy(() => import('./pages/MediaPage'));
const MediaSearchPage = lazy(() => import('./pages/MediaSearchPage'));

function LoadingSpinner() {
  const { t } = useTheme();
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', background: t.bg }}>
      <div
        style={{
          width: 32,
          height: 32,
          border: `2px solid ${t.accent}`,
          borderTopColor: 'transparent',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }}
      />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function AppShell() {
  const location = useLocation();
  const { t } = useTheme();
  const { authEnabled, multiplayerEnabled, mediaEnabled } = useFeatureFlags();

  const isAuthPage = ['/login', '/register'].includes(location.pathname);

  // When auth is disabled, redirect login/register to home
  if (isAuthPage) {
    if (!authEnabled) return <Navigate to="/" replace />;
    return (
      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Routes>
      </Suspense>
    );
  }

  // When auth is disabled, bypass ProtectedRoute
  const Guard = ({ children }: { children: React.ReactNode }) =>
    authEnabled ? <ProtectedRoute>{children}</ProtectedRoute> : <>{children}</>;

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', overflow: 'hidden', background: t.bg }}>
      <Sidebar />
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <Suspense fallback={<LoadingSpinner />}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/search" element={<Guard><SearchPage /></Guard>} />
            <Route path="/library" element={<Guard><LibraryPage /></Guard>} />
            <Route path="/game/:igdbId" element={<Guard><GameDetailPage /></Guard>} />
            <Route path="/profile" element={<Guard><ProfilePage /></Guard>} />
            {mediaEnabled && (
              <Route path="/media" element={<Guard><MediaPage /></Guard>} />
            )}
            {mediaEnabled && (
              <Route path="/media-search" element={<Guard><MediaSearchPage /></Guard>} />
            )}
            {multiplayerEnabled && (
              <Route path="/multiplayer" element={<Guard><MultiplayerPage /></Guard>} />
            )}
          </Routes>
        </Suspense>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <FeatureFlagsProvider>
      <AuthProvider>
        <ThemeProvider>
          <BrowserRouter>
            <AppShell />
          </BrowserRouter>
        </ThemeProvider>
      </AuthProvider>
    </FeatureFlagsProvider>
  );
}
