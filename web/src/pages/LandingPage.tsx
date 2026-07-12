import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { getLoginUrl } from '../api/auth';

export function LandingPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  function handleCTA() {
    if (user) {
      navigate('/new');
    } else {
      window.location.href = getLoginUrl();
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 text-center">
      <h1 className="text-5xl font-bold text-gray-900 mb-4">
        Content Calendar AI Generator
      </h1>
      <p className="text-xl text-gray-500 mb-8 max-w-xl">
        AI-powered YouTube content planning. Analyze your channel, discover trends, and
        generate 4 ready-to-produce video concepts with outlines and SEO packages.
      </p>
      <button
        onClick={handleCTA}
        disabled={loading}
        className="px-8 py-3 bg-blue-600 text-white text-lg font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 cursor-pointer"
      >
        {loading ? 'Loading...' : 'Generate Your Content Calendar'}
      </button>
      <ul className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-6 text-left max-w-2xl w-full">
        <li className="p-4 border rounded-lg">
          <p className="font-semibold text-gray-800">Channel Analysis</p>
          <p className="text-sm text-gray-500 mt-1">Understand your content performance and audience</p>
        </li>
        <li className="p-4 border rounded-lg">
          <p className="font-semibold text-gray-800">Trend Research</p>
          <p className="text-sm text-gray-500 mt-1">Surface what's rising in your niche right now</p>
        </li>
        <li className="p-4 border rounded-lg">
          <p className="font-semibold text-gray-800">4 Video Concepts</p>
          <p className="text-sm text-gray-500 mt-1">Outlines, titles, descriptions, and tags included</p>
        </li>
      </ul>
    </div>
  );
}
