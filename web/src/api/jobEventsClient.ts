import type { JobProgressEvent } from '../types/job';

export function subscribeToJobEvents(
  jobId: string,
  onEvent: (event: JobProgressEvent) => void,
  onError: (error: Error) => void,
): () => void {
  const source = new EventSource(`/api/jobs/${jobId}/events`);

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
