import { createBrowserRouter } from 'react-router-dom';
import App from './App';
import { JobProgressPage } from './pages/JobProgressPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
  },
  {
    path: '/jobs/:jobId',
    element: <JobProgressPage />,
  },
]);
