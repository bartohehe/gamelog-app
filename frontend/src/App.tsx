import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';

// Pages — lazy imports to be replaced once pages exist
import { lazy, Suspense } from 'react';

const HomePage = lazy(() => import('./pages/HomePage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const SearchPage = lazy(() => import('./pages/SearchPage'));
const LibraryPage = lazy(() => import('./pages/LibraryPage'));
const GameDetailPage = lazy(() => import('./pages/GameDetailPage'));

function LoadingSpinner() {
  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-accent-purple border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-bg-primary text-text-primary">
          <Navbar />
          <Suspense fallback={<LoadingSpinner />}>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/search" element={
                <ProtectedRoute><SearchPage /></ProtectedRoute>
              } />
              <Route path="/library" element={
                <ProtectedRoute><LibraryPage /></ProtectedRoute>
              } />
              <Route path="/game/:igdbId" element={
                <ProtectedRoute><GameDetailPage /></ProtectedRoute>
              } />
            </Routes>
          </Suspense>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}
