import type { JobProgressEvent } from '../types/job';
import { apiUrl } from './apiUrl';

export function subscribeToJobEvents(
  jobId: string,
  onEvent: (event: JobProgressEvent) => void,
  onError: (error: Error) => void,
): () => void {
  // withCredentials required for cross-origin SSE (separate frontend/backend domains)
  const source = new EventSource(apiUrl(`/api/jobs/${jobId}/events`), { withCredentials: true });

  const parse = (data: string, typeOverride?: JobProgressEvent['type']) => {
    try {
      const event: JobProgressEvent = JSON.parse(data);
      if (typeOverride) event.type = typeOverride;
      onEvent(event);
    } catch {
      onError(new Error('Failed to parse SSE event'));
    }
  };

  source.onmessage = (e) => parse(e.data);
  source.addEventListener('completed', (e) => parse((e as MessageEvent).data, 'completed'));
  source.addEventListener('failed', (e) => parse((e as MessageEvent).data, 'failed'));
  source.onerror = () => onError(new Error('SSE connection error'));

  return () => source.close();
}
