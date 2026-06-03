import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { SharedPlaylistPage } from './pages/SharedPlaylistPage';
import { useAuthStore } from './store/authStore';

const REDIRECT_KEY = 'playlist-manager:redirect';

/** Remember where the user was headed, then bounce to login. */
function RequireLoginRedirect() {
  const location = useLocation();
  try {
    sessionStorage.setItem(REDIRECT_KEY, location.pathname);
  } catch {
    /* ignore */
  }
  return <Navigate to="/login" replace />;
}

/** After login, return to the saved destination (or home). */
function takeRedirect(): string {
  try {
    const dest = sessionStorage.getItem(REDIRECT_KEY);
    if (dest) {
      sessionStorage.removeItem(REDIRECT_KEY);
      return dest;
    }
  } catch {
    /* ignore */
  }
  return '/';
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
        <Route
          path="/"
          element={isAuthenticated ? <HomePage /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/login"
          element={!isAuthenticated ? <LoginPage /> : <Navigate to={takeRedirect()} replace />}
        />
        <Route
          path="/p/:shareId"
          element={isAuthenticated ? <SharedPlaylistPage /> : <RequireLoginRedirect />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
