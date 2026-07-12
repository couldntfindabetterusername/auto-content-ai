import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { ChannelInputForm } from '../components/ChannelInputForm';

export function NewCalendarPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-3.5rem)]">
        <svg className="animate-spin h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    );
  }

  if (!user) return null;

  function handleSuccess(jobId: string) {
    navigate(`/jobs/${jobId}`);
  }

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-3.5rem)] bg-background px-4 py-12">
      <div className="bg-card rounded-2xl border border-border shadow-sm p-8 w-full max-w-lg">
        <h1 className="text-xl font-semibold text-foreground mb-1">Create New Content Calendar</h1>
        <p className="text-sm text-muted-foreground mb-8">
          Enter your channel details and we'll generate a content plan.
        </p>
        <ChannelInputForm onSuccess={handleSuccess} />
      </div>
    </div>
  );
}
