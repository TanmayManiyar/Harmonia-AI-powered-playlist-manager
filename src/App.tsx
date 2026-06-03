import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { HomePage } from './pages/HomePage';
import { LandingPage } from './pages/LandingPage';
import { SharedPlaylistPage } from './pages/SharedPlaylistPage';
import { AuthModal } from './components';
import { useAuthStore } from './store/authStore';

const REDIRECT_KEY = 'playlist-manager:redirect';

/** Remember where the user was headed, then send them to the landing/login. */
function RequireLoginRedirect() {
  const location = useLocation();
  try {
    sessionStorage.setItem(REDIRECT_KEY, location.pathname);
  } catch {
    /* ignore */
  }
  return <Navigate to="/" replace />;
}

function App() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const restoreSession = useAuthStore((state) => state.restoreSession);

  useEffect(() => {
    void restoreSession();
  }, [restoreSession]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={isAuthenticated ? <HomePage /> : <LandingPage />} />
        <Route path="/login" element={<Navigate to="/" replace />} />
        <Route
          path="/p/:shareId"
          element={isAuthenticated ? <SharedPlaylistPage /> : <RequireLoginRedirect />}
        />
      </Routes>
      <AuthModal />
    </BrowserRouter>
  );
}

export default App;
