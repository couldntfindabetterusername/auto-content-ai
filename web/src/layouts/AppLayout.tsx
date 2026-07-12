import { Link, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { logout } from '../api/auth';

export function AppLayout() {
  const { user, loading } = useAuth();

  async function handleLogout() {
    await logout();
    window.location.href = '/';
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b bg-white px-6 py-3 flex items-center justify-between">
        <Link to="/" className="text-xl font-bold text-blue-600">
          AutoContent
        </Link>
        <nav className="flex items-center gap-4">
          {!loading && user && (
            <>
              <Link to="/new" className="text-sm text-gray-600 hover:text-gray-900">
                New Calendar
              </Link>
              <Link to="/history" className="text-sm text-gray-600 hover:text-gray-900">
                History
              </Link>
              <span className="text-sm text-gray-600">{user.name}</span>
              <button
                onClick={handleLogout}
                className="text-sm text-red-600 hover:text-red-800"
              >
                Logout
              </button>
            </>
          )}
          {!loading && !user && (
            <a href="/api/auth/google" className="text-sm text-blue-600 hover:text-blue-800">
              Sign in
            </a>
          )}
        </nav>
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}
