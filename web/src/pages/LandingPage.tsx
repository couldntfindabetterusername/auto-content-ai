import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { getLoginUrl } from '../api/auth';
import { BarChart2, TrendingUp, Video } from 'lucide-react';

const features = [
  {
    icon: BarChart2,
    title: 'Channel Analysis',
    description: 'Understand your content performance and audience patterns.',
  },
  {
    icon: TrendingUp,
    title: 'Trend Research',
    description: "Surface what's rising in your niche right now.",
  },
  {
    icon: Video,
    title: '4 Video Concepts',
    description: 'Outlines, titles, descriptions, and tags included.',
  },
];

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
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-6 py-16 text-center">
      <div className="max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-6">
          AI-powered content planning
        </div>
        <h1 className="text-5xl font-bold text-foreground mb-5 leading-tight">
          Your YouTube content calendar,{' '}
          <span className="text-primary">generated in minutes</span>
        </h1>
        <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto leading-relaxed">
          Analyze your channel, discover rising trends, and generate 4 ready-to-produce
          video concepts with outlines and SEO packages.
        </p>
        <button
          onClick={handleCTA}
          disabled={loading}
          className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground text-sm font-semibold rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors cursor-pointer"
        >
          {loading ? 'Loading…' : 'Generate Your Content Calendar'}
        </button>
      </div>

      <div className="mt-20 grid grid-cols-1 sm:grid-cols-3 gap-5 max-w-3xl w-full">
        {features.map(({ icon: Icon, title, description }) => (
          <div key={title} className="p-5 bg-card border border-border rounded-xl text-left shadow-sm">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
              <Icon className="w-4 h-4 text-primary" />
            </div>
            <p className="font-semibold text-foreground text-sm mb-1">{title}</p>
            <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
