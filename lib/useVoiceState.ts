'use client';

import { useCallback, useRef, useState } from 'react';

export interface VoiceState {
  isAISpeaking: boolean;
  isUserSpeaking: boolean;
  isListening: boolean;
  isStreaming: boolean;
}

export function useVoiceState() {
  const [voiceState, setVoiceState] = useState<VoiceState>({
    isAISpeaking: false,
    isUserSpeaking: false,
    isListening: false,
    isStreaming: false,
  });

  const abortControllerRef = useRef<AbortController | null>(null);

  // AI is about to speak
  const onAISpeakStart = useCallback(() => {
    setVoiceState((prev) => ({
      ...prev,
      isAISpeaking: true,
      isListening: false, // Disable microphone
    }));
  }, []);

  // AI finished speaking
  const onAISpeakEnd = useCallback(() => {
    setVoiceState((prev) => ({
      ...prev,
      isAISpeaking: false,
      isListening: true, // Re-enable microphone (only if user wasn't speaking)
    }));
  }, []);

  // User starts speaking (detected by speech recognition)
  const onUserSpeakStart = useCallback(() => {
    setVoiceState((prev) => ({
      ...prev,
      isUserSpeaking: true,
    }));
  }, []);

  // User stops speaking
  const onUserSpeakEnd = useCallback(() => {
    setVoiceState((prev) => ({
      ...prev,
      isUserSpeaking: false,
    }));
  }, []);

  // Streaming started
  const onStreamStart = useCallback(() => {
    setVoiceState((prev) => ({
      ...prev,
      isStreaming: true,
      isListening: false, // Disable microphone during streaming
    }));
  }, []);

  // Streaming ended
  const onStreamEnd = useCallback(() => {
    setVoiceState((prev) => ({
      ...prev,
      isStreaming: false,
    }));
  }, []);

  // Listening enabled
  const onListeningStart = useCallback(() => {
    setVoiceState((prev) => ({
      ...prev,
      isListening: true,
    }));
  }, []);

  // Listening disabled
  const onListeningEnd = useCallback(() => {
    setVoiceState((prev) => ({
      ...prev,
      isListening: false,
    }));
  }, []);

  // Check if we should listen (CRITICAL: AI must not listen while speaking)
  const shouldListen = useCallback((): boolean => {
    return !voiceState.isAISpeaking && !voiceState.isStreaming;
  }, [voiceState]);

  // Barge-in: User interrupted AI
  const onBargeIn = useCallback(() => {
    setVoiceState((prev) => ({
      ...prev,
      isAISpeaking: false,
      isStreaming: false,
      isUserSpeaking: true,
      isListening: false,
    }));
  }, []);

  // Create abort signal for streaming (used to stop AI response when user barges in)
  const createAbortSignal = useCallback(() => {
    abortControllerRef.current = new AbortController();
    return abortControllerRef.current.signal;
  }, []);

  const abortStreaming = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  return {
    voiceState,
    onAISpeakStart,
    onAISpeakEnd,
    onUserSpeakStart,
    onUserSpeakEnd,
    onStreamStart,
    onStreamEnd,
    onListeningStart,
    onListeningEnd,
    shouldListen,
    onBargeIn,
    createAbortSignal,
    abortStreaming,
  };
}
