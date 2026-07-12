import { createContext } from 'react';
import { useAuth } from './hooks/useAuth';
import type { AuthState } from './hooks/useAuth';
import { LoginButton } from './components/LoginButton';

export const AuthContext = createContext<AuthState>({ user: null, loading: true });

export default function App() {
  const auth = useAuth();

  return (
    <AuthContext.Provider value={auth}>
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-4xl font-bold">AutoContent</h1>
          {!auth.loading && !auth.user && <LoginButton />}
          {!auth.loading && auth.user && (
            <p className="mt-4 text-lg">Welcome, {auth.user.name}</p>
          )}
        </div>
      </div>
    </AuthContext.Provider>
  );
}
