import { createBrowserRouter } from 'react-router-dom';
import App from './App';
import { JobProgressPage } from './pages/JobProgressPage';
import { NewCalendarPage } from './pages/NewCalendarPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
  },
  {
    path: '/new',
    element: <NewCalendarPage />,
  },
  {
    path: '/jobs/:jobId',
    element: <JobProgressPage />,
  },
]);
