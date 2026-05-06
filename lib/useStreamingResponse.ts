'use client';

import { useCallback, useRef } from 'react';

interface StreamingOptions {
  onChunk?: (chunk: string) => void;
  onComplete?: () => void;
  onError?: (error: Error) => void;
  onAbort?: () => void;
}

export function useStreamingResponse() {
  const abortControllerRef = useRef<AbortController | null>(null);

  const stream = useCallback(
    async (url: string, options: StreamingOptions = {}): Promise<string> => {
      const { onChunk, onComplete, onError, onAbort } = options;

      // Create new AbortController for this request
      abortControllerRef.current = new AbortController();

      let fullContent = '';

      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        if (!response.body) {
          throw new Error('Response body is null');
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        try {
          while (true) {
            const { done, value } = await reader.read();

            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            fullContent += chunk;

            if (onChunk) {
              onChunk(chunk);
            }
          }

          // Final flush of decoder
          const final = decoder.decode();
          if (final) {
            fullContent += final;
            if (onChunk) {
              onChunk(final);
            }
          }

          if (onComplete) {
            onComplete();
          }
        } finally {
          reader.releaseLock();
        }

        return fullContent;
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
          if (onAbort) {
            onAbort();
          }
          return fullContent;
        }

        const err = error instanceof Error ? error : new Error(String(error));
        if (onError) {
          onError(err);
        }
        throw err;
      } finally {
        abortControllerRef.current = null;
      }
    },
    [],
  );

  const abort = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  return {
    stream,
    abort,
    isStreaming: () => abortControllerRef.current !== null,
  };
}
