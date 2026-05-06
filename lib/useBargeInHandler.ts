'use client';

import { useCallback, useRef } from 'react';
import SpeechRecognition from 'react-speech-recognition';

interface BargeInHandlerOptions {
  onBargeIn?: () => void;
  onStreamAbort?: () => void;
  onSpeechCancel?: () => void;
}

export function useBargeInHandler(options: BargeInHandlerOptions = {}) {
  const { onBargeIn, onStreamAbort, onSpeechCancel } = options;
  const streamAbortControllerRef = useRef<AbortController | null>(null);
  const speechSynthRef = useRef<SpeechSynthesis | null>(null);
  const listeningDetectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const initSpeechSynth = useCallback(() => {
    if (typeof window !== 'undefined' && !speechSynthRef.current) {
      speechSynthRef.current = window.speechSynthesis;
    }
  }, []);

  const setStreamAbortController = useCallback(
    (controller: AbortController | null) => {
      streamAbortControllerRef.current = controller;
    },
    [],
  );

  const detectUserSpeech = useCallback(
    (transcript: string, isFinal: boolean) => {
      if (listeningDetectionTimeoutRef.current) {
        clearTimeout(listeningDetectionTimeoutRef.current);
      }

      if (isFinal && transcript && transcript.trim().length > 0) {
        console.log('🎤 User speech detected - BARGE-IN TRIGGERED');
        triggerBargeIn();
      }
    },
    [],
  );

  const triggerBargeIn = useCallback(() => {
    console.log('⛔ BARGE-IN: Canceling AI response and streaming');

    if (speechSynthRef.current && speechSynthRef.current.speaking) {
      console.log('  → Canceling speech synthesis');
      speechSynthRef.current.cancel();
      if (onSpeechCancel) {
        onSpeechCancel();
      }
    }

    if (streamAbortControllerRef.current) {
      console.log('  → Aborting API stream');
      streamAbortControllerRef.current.abort();
      if (onStreamAbort) {
        onStreamAbort();
      }
    }

    try {
      SpeechRecognition.stopListening();
      console.log('  → Stopped speech recognition (for echo prevention)');

      listeningDetectionTimeoutRef.current = setTimeout(() => {
        SpeechRecognition.startListening({ continuous: true });
        console.log('  → Resumed speech recognition');
      }, 100);
    } catch (error) {
      console.error(
        'Error managing speech recognition during barge-in:',
        error,
      );
    }

    if (onBargeIn) {
      onBargeIn();
    }
  }, [onBargeIn, onStreamAbort, onSpeechCancel]);

  const cleanup = useCallback(() => {
    if (listeningDetectionTimeoutRef.current) {
      clearTimeout(listeningDetectionTimeoutRef.current);
    }
  }, []);

  return {
    initSpeechSynth,
    setStreamAbortController,
    detectUserSpeech,
    triggerBargeIn,
    cleanup,
  };
}
