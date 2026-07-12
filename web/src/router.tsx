import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom';
import { AppLayout } from './layouts/AppLayout';
import { LandingPage } from './pages/LandingPage';
import { JobProgressPage } from './pages/JobProgressPage';
import { NewCalendarPage } from './pages/NewCalendarPage';
import { CalendarResultPage } from './pages/CalendarResultPage';
import { CalendarHistoryPage } from './pages/CalendarHistoryPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { useAuth } from './hooks/useAuth';

function ProtectedRoute() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}

export const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      {
        path: '/',
        element: <LandingPage />,
      },
      {
        element: <ProtectedRoute />,
        children: [
          {
            path: '/new',
            element: <NewCalendarPage />,
          },
          {
            path: '/jobs/:jobId',
            element: <JobProgressPage />,
          },
          {
            path: '/calendar/:id',
            element: <CalendarResultPage />,
          },
          {
            path: '/history',
            element: <CalendarHistoryPage />,
          },
          {
            path: '/admin',
            element: <AdminDashboardPage />,
          },
        ],
      },
      {
        path: '*',
        element: <Navigate to="/" replace />,
      },
    ],
  },
]);
