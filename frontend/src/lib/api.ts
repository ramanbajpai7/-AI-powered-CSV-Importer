import { UploadResponse, ProcessingResult, ProgressUpdate } from '@/types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export async function uploadCSV(file: File): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE}/api/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to upload file');
  }

  return response.json();
}

export function processRecordsWithStreaming(
  records: Record<string, string>[],
  onProgress: (update: ProgressUpdate) => void,
  onComplete: (result: ProcessingResult) => void,
  onError: (error: string) => void
): AbortController {
  const controller = new AbortController();

  (async () => {
    try {
      const response = await fetch(`${API_BASE}/api/process`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'text/event-stream',
        },
        body: JSON.stringify({ records }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const error = await response.json();
        onError(error.error || 'Failed to process records');
        return;
      }

      const reader = response.body?.getReader();
      if (!reader) {
        onError('Streaming not supported');
        return;
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data: ProgressUpdate = JSON.parse(line.slice(6));
              if (data.type === 'complete' && data.result) {
                onComplete(data.result);
              } else if (data.type === 'error') {
                onError(data.message || 'Processing failed');
              } else {
                onProgress(data);
              }
            } catch {
            }
          }
        }
      }
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        onError(
          error instanceof Error ? error.message : 'An unexpected error occurred'
        );
      }
    }
  })();

  return controller;
}

export async function processRecords(
  records: Record<string, string>[]
): Promise<ProcessingResult> {
  const response = await fetch(`${API_BASE}/api/process`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ records }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to process records');
  }

  return response.json();
}
