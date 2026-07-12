import { Moon, Sun } from 'lucide-react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useDarkMode } from '../hooks/useDarkMode';
import { logout } from '../api/auth';

export function AppLayout() {
  const { user, loading } = useAuth();
  const location = useLocation();
  const { dark, toggle } = useDarkMode();

  async function handleLogout() {
    await logout();
    window.location.href = '/';
  }

  function isActive(path: string) {
    return location.pathname === path;
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="sticky top-0 z-50 bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-semibold text-foreground hover:opacity-80 transition-opacity shrink-0">
            <div className="w-5 h-5 rounded bg-primary" />
            AutoContent
          </Link>

          <div className="flex items-center gap-4">
            <button
              onClick={toggle}
              title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
              className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors"
            >
              {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {!loading && user && (
              <>
                <nav className="flex items-center gap-5">
                  <Link
                    to="/new"
                    className={`text-sm transition-colors ${isActive('/new') ? 'text-foreground font-medium' : 'text-muted-foreground hover:text-foreground'}`}
                  >
                    New Calendar
                  </Link>
                  <Link
                    to="/history"
                    className={`text-sm transition-colors ${isActive('/history') ? 'text-foreground font-medium' : 'text-muted-foreground hover:text-foreground'}`}
                  >
                    History
                  </Link>
                </nav>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-muted-foreground hidden sm:block">{user.name}</span>
                  <button
                    onClick={handleLogout}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Logout
                  </button>
                </div>
              </>
            )}
            {!loading && !user && (
              <a
                href="/api/auth/google"
                className="text-sm font-medium bg-primary text-primary-foreground px-3 py-1.5 rounded-md hover:bg-primary/90 transition-colors"
              >
                Sign in
              </a>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 min-h-0">
        <Outlet />
      </main>
    </div>
  );
}
