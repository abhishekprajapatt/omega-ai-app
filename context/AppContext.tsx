'use client';
import toast from 'react-hot-toast';
import { assets } from '@/assets/assets';
import { useAuth, useUser } from '@clerk/nextjs';
import axios, { type AxiosResponse } from 'axios';
import type { StaticImageData } from 'next/image';
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  type ReactNode,
  type FormEvent,
  type MouseEvent,
} from 'react';
import SpeechRecognition, {
  useSpeechRecognition,
} from 'react-speech-recognition';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  _id?: string;
  id?: string;
  isVoiceMessage?: boolean;
}

interface Chat {
  _id: string;
  name: string;
  messages: Message[];
  userId: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

interface AppContextValue {
  user: ReturnType<typeof useUser>['user'];
  chats: Chat[];
  setChats: React.Dispatch<React.SetStateAction<Chat[]>>;
  selectedChat: Chat | null;
  setSelectedChat: React.Dispatch<React.SetStateAction<Chat | null>>;
  fetchUserChats: () => Promise<void>;
  createNewChat: () => Promise<void>;
  deleteChat: (chatId: string) => Promise<void>;
  renameChat: (chatId: string, newName: string) => Promise<void>;
  generateChatTitle: (chatId: string, userQuery: string) => Promise<void>;
  renamingChatId: string | null;
  setRenamingChatId: React.Dispatch<React.SetStateAction<string | null>>;
  isWriting: boolean;
  setIsWriting: React.Dispatch<React.SetStateAction<boolean>>;
  isLoading: boolean;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  textUpdateTimeouts: NodeJS.Timeout[];
  setTextUpdateTimeouts: React.Dispatch<React.SetStateAction<NodeJS.Timeout[]>>;
  editAndResendMessage: (
    messageIndex: number,
    newContent: string
  ) => Promise<void>;
  handleEditMessage: (messageId: string, newContent: string) => void;
  requestMicrophonePermission: () => Promise<boolean>;
  sendPrompt: (
    e?: FormEvent<HTMLFormElement> | MouseEvent | null,
    customPrompt?: string
  ) => Promise<void>;
  speak: (text: string) => void;
  speakWithPriority: (text: string) => void;
  playNotificationSound: () => Promise<void>;
  toggleContinuousListening: () => Promise<void>;
  processTranscript: (currentTranscript: string) => void;
  isFixedResponse: (text: string) => boolean;
  stopTextGeneration: () => void;
  isSpeaking: boolean;
  setIsSpeaking: React.Dispatch<React.SetStateAction<boolean>>;
  isContinuousListening: boolean;
  setIsContinuousListening: React.Dispatch<React.SetStateAction<boolean>>;
  selectedVoice: SpeechSynthesisVoice | null;
  setSelectedVoice: React.Dispatch<
    React.SetStateAction<SpeechSynthesisVoice | null>
  >;
  voices: SpeechSynthesisVoice[];
  hasInteracted: boolean;
  setHasInteracted: React.Dispatch<React.SetStateAction<boolean>>;
  isClient: boolean;
  transcript: string;
  resetTranscript: () => void;
  browserSupportsSpeechRecognition: boolean;
  selectedModel: string;
  setSelectedModel: React.Dispatch<React.SetStateAction<string>>;
  availableModels: Array<{
    id: string;
    name: string;
    image: StaticImageData | string;
  }>;
  detectedLang: string;
  setDetectedLang: React.Dispatch<React.SetStateAction<string>>;
}

const AppContext = createContext<AppContextValue | null>(null);

export const useAppContext = (): AppContextValue => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppContextProvider');
  }
  return context;
};

interface AppContextProviderProps {
  children: ReactNode;
}

export const AppContextProvider: React.FC<AppContextProviderProps> = ({
  children,
}) => {
  const { user } = useUser();
  const { getToken } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [renamingChatId, setRenamingChatId] = useState<string | null>(null);
  const [isWriting, setIsWriting] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [textUpdateTimeouts, setTextUpdateTimeouts] = useState<
    NodeJS.Timeout[]
  >([]);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [isContinuousListening, setIsContinuousListening] =
    useState<boolean>(false);
  const [alwaysListening, setAlwaysListening] = useState<boolean>(false);
  const [selectedVoice, setSelectedVoice] =
    useState<SpeechSynthesisVoice | null>(null);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [hasInteracted, setHasInteracted] = useState<boolean>(false);
  const [isClient, setIsClient] = useState<boolean>(false);
  const [detectedLang, setDetectedLang] = useState<string>('en-US');

  const [selectedModel, setSelectedModel] = useState<string>('deepseek');

  const availableModels = [
    {
      id: 'deepseek',
      name: 'DeepSeek R1',
      image: assets.deepseek_model,
    },
    { id: 'openai', name: 'ChatGPT-5', image: assets.chatgpt_model },
    { id: 'grok', name: 'Grok 4', image: assets.grok_model },
    { id: 'gemini', name: 'Gemini 2.5 Pro', image: assets.gemini_model },
    { id: 'claude', name: 'Claude Sonnet 4.5', image: assets.claude_model },
  ];

  const { transcript, resetTranscript, browserSupportsSpeechRecognition } =
    useSpeechRecognition();
  const speechSynthRef = useRef<SpeechSynthesis | null>(null);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastTranscriptRef = useRef<string>('');
  const microphoneStreamRef = useRef<MediaStream | null>(null);
  const soundDetectionTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isSpeakingRef = useRef<boolean>(false);
  const isLoadingRef = useRef<boolean>(false);
  const welcomeSpokenRef = useRef<boolean>(false);
  const fixedResponsesRef = useRef<{
    greetings: string[];
  }>({
    greetings: [
      `Hey ${user?.firstName || 'there'}, I'm OMEGA, how can I help you today?`,
      `What's up ${
        user?.firstName || 'there'
      }! I'm OMEGA. Let's create something amazing!`,
      `Hey ${user?.firstName || 'there'}, OMEGA here! What's on your mind?`,
      `${
        user?.firstName || 'there'
      }! I'm OMEGA. Ready to build something incredible?`,
      `Welcome ${
        user?.firstName || 'there'
      }! I'm OMEGA, your AI assistant. What can I do for you?`,
      `Hey there ${
        user?.firstName || 'friend'
      }! It's OMEGA. Let's turn your ideas into reality!`,
      `${
        user?.firstName || 'Developer'
      }, meet OMEGA! How can I assist you today?`,
      `What's happening ${
        user?.firstName || 'there'
      }? I'm OMEGA. Let's collaborate!`,
    ],
  });

  useEffect(() => {
    if (transcript) {
      processTranscript(transcript);
    }
  }, [transcript]);

  useEffect(() => {
    setIsClient(true);

    if (typeof window !== 'undefined') {
      speechSynthRef.current = window.speechSynthesis;

      const browserLang = navigator.language || 'en-US';
      setDetectedLang(browserLang);

      requestMicrophonePermission().then((hasAccess) => {
        if (hasAccess) {
          console.log(
            'Microphone permission granted, setting up background listening'
          );
          setAlwaysListening(true);
          resetTranscript();
          SpeechRecognition.startListening({ continuous: true });
        }
      });
    }

    const handleBeforeUnload = () => {
      if (speechSynthRef.current) {
        speechSynthRef.current.cancel();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      if (speechSynthRef.current) {
        speechSynthRef.current.cancel();
      }

      textUpdateTimeouts.forEach((timeout) => clearTimeout(timeout));

      if (microphoneStreamRef.current) {
        microphoneStreamRef.current
          .getTracks()
          .forEach((track) => track.stop());
      }

      if (soundDetectionTimerRef.current) {
        clearInterval(soundDetectionTimerRef.current);
      }

      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
      }

      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [textUpdateTimeouts]);

  useEffect(() => {
    if (!isClient || !alwaysListening || isContinuousListening) return;

    const restartListeningTimer = setInterval(() => {
      if (alwaysListening && !isContinuousListening) {
        const isCurrentlySpeaking =
          isSpeakingRef.current ||
          isLoadingRef.current ||
          (speechSynthRef.current && speechSynthRef.current.speaking);

        if (!isCurrentlySpeaking) {
          try {
            SpeechRecognition.startListening({ continuous: true });
          } catch (e) {
            console.error('Error restarting background listening:', e);
          }
        }
      }
    }, 5000);

    return () => clearInterval(restartListeningTimer);
  }, [alwaysListening, isContinuousListening, isClient]);

  useEffect(() => {
    if (!isClient || typeof window === 'undefined') return;

    const loadVoices = () => {
      if (!speechSynthRef.current) return;

      const allVoices = speechSynthRef.current.getVoices();
      if (allVoices.length === 0) {
        setTimeout(loadVoices, 500);
        return;
      }

      console.log('Voices loaded:', allVoices.length);
      setVoices(allVoices);

      const femaleVoices = allVoices.filter((v) => {
        const voiceName = v.name.toLowerCase();
        return (
          voiceName.includes('female') ||
          voiceName.includes('woman') ||
          voiceName.includes('girl')
        );
      });

      let selectedCuteVoice =
        femaleVoices.find((v) => v.name.toLowerCase().includes('joanna')) ||
        femaleVoices.find((v) => v.localService && v.lang.startsWith('en')) ||
        femaleVoices.find((v) => v.lang.startsWith('en')) ||
        allVoices.find((v) => v.lang.startsWith('en') && v.localService) ||
        allVoices.find((v) => v.lang.startsWith('en')) ||
        allVoices[0];

      console.log('Selected cute female voice:', selectedCuteVoice?.name);
      setSelectedVoice(selectedCuteVoice || allVoices[0]);
    };

    loadVoices();

    if (speechSynthRef.current) {
      speechSynthRef.current.onvoiceschanged = loadVoices;
    }
  }, [isClient]);

  const requestMicrophonePermission = async (): Promise<boolean> => {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      return true;
    } catch (error: unknown) {
      console.error('Microphone access denied:', error);
      toast.error(
        'Please allow microphone access in your browser settings to use voice features'
      );
      return false;
    }
  };

  const playNotificationSound = async (): Promise<void> => {
    if (!isClient) return Promise.resolve();

    try {
      const audio = new Audio('/sounds/ms_notification.mp3');
      await audio.play();
      return new Promise((resolve) => {
        audio.onended = () => resolve();
      });
    } catch (error: unknown) {
      console.error('Audio playback failed:', error);
      return Promise.resolve();
    }
  };

  const cleanTextForSpeech = (text: string): string => {
    if (!text) return '';

    let cleanedText = text
      .replace(/```[\s\S]*?```/g, '')
      .replace(/`[^`]+`/g, '')
      .replace(/^#{1,6}\s+/gm, '')
      .replace(/(\*\*|__)(.*?)\1/g, '$2')
      .replace(/(\*|_)(.*?)\1/g, '$2')
      .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')
      .replace(/<[^>]*>/g, '')
      .replace(/^[\s]*[-*+]\s+/gm, '')
      .replace(/^\d+\.\s+/gm, '')
      .replace(/[#*_`~\[\](){}]/g, '')
      .replace(/https?:\/\/[^\s]+/g, '')
      .replace(/\n+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (cleanedText.length < 5) {
      return 'Response received.';
    }

    return cleanedText;
  };

  const detectLanguage = (text: string): string => {
    const hindiWords =
      /\b(है|हैं|का|की|के|में|से|को|पर|और|या|यह|वह|जो|कि|तो|न|नहीं|क्या|कैसे|कहाँ|कब|क्यों)\b/;
    const hindiPattern = /[\u0900-\u097F]/;

    const arabicWords =
      /\b(في|من|إلى|على|هذا|هذه|التي|الذي|لا|نعم|كيف|أين|متى|لماذا)\b/;
    const arabicPattern = /[\u0600-\u06FF]/;

    const chinesePattern = /[\u4e00-\u9fff]/;
    const japanesePattern = /[\u3040-\u309f\u30a0-\u30ff]/;
    const koreanPattern = /[\uac00-\ud7af]/;

    if (hindiPattern.test(text) || hindiWords.test(text)) {
      return 'hi-IN';
    }

    if (arabicPattern.test(text) || arabicWords.test(text)) {
      return 'ar-SA';
    }

    if (chinesePattern.test(text)) return 'zh-CN';
    if (japanesePattern.test(text)) return 'ja-JP';
    if (koreanPattern.test(text)) return 'ko-KR';

    return 'en-US';
  };

  const getBestVoiceForLanguage = (
    targetLang: string,
    availableVoices: SpeechSynthesisVoice[]
  ): SpeechSynthesisVoice | null => {
    if (!availableVoices || availableVoices.length === 0) return null;

    const langCode = targetLang.split('-')[0];
    let voice = availableVoices.find((v) => v.lang === targetLang);

    if (voice) return voice;

    voice = availableVoices.find((v) => v.lang.startsWith(langCode));

    if (voice) return voice;

    if (langCode === 'hi') {
      voice = availableVoices.find((v) => v.lang === 'en-IN');
      if (voice) return voice;
    }

    voice = availableVoices.find(
      (v) => v.lang.startsWith(langCode) && v.localService
    );
    if (voice) return voice;
    return (
      availableVoices.find((v) => v.lang.startsWith('en')) || availableVoices[0]
    );
  };

  const speakWithPriority = (text: string): void => {
    if (!isClient || !speechSynthRef.current) return;

    if (typeof window === 'undefined' || !window.speechSynthesis) {
      console.error('Speech synthesis not available');
      return;
    }

    const cleanedText = cleanTextForSpeech(text);
    console.log('Original text:', text);
    console.log('Cleaned text for speech:', cleanedText);

    if (
      cleanedText.length < 10 ||
      /^[\s\n\r]*$/.test(cleanedText) ||
      cleanedText.includes('function') ||
      cleanedText.includes('const ') ||
      cleanedText.includes('let ') ||
      cleanedText.includes('var ') ||
      cleanedText.includes('import ') ||
      cleanedText.includes('export ')
    ) {
      console.log('Skipping code/technical content');
      setIsSpeaking(false);
      isSpeakingRef.current = false;
      return;
    }

    try {
      if (speechSynthRef.current) {
        speechSynthRef.current.cancel();
      }

      const speechLang = detectedLang || 'en-US';
      const maxChunkLength = 150;
      const textChunks: string[] = [];

      for (let i = 0; i < cleanedText.length; i += maxChunkLength) {
        textChunks.push(cleanedText.substring(i, i + maxChunkLength));
      }

      setIsSpeaking(true);
      isSpeakingRef.current = true;

      const speakNextChunk = (index: number): void => {
        if (index >= textChunks.length) {
          console.log('All chunks spoken, setting isSpeaking to false');
          setIsSpeaking(false);
          isSpeakingRef.current = false;
          if (alwaysListening && !isContinuousListening) {
            try {
              SpeechRecognition.startListening({ continuous: true });
            } catch (e) {
              console.error(
                'Error restarting background listening after speech:',
                e
              );
            }
          }
          return;
        }

        try {
          const utterance = new SpeechSynthesisUtterance(textChunks[index]);

          if (selectedVoice) {
            utterance.voice = selectedVoice;
          } else {
            const availableVoices = speechSynthRef.current?.getVoices() || [];
            const bestVoice = getBestVoiceForLanguage(
              speechLang,
              availableVoices
            );
            if (bestVoice) {
              utterance.voice = bestVoice;
              console.log(
                'Using voice:',
                bestVoice.name,
                'for language:',
                speechLang
              );
            }
          }

          utterance.lang = speechLang || 'en-US';
          utterance.rate = 0.9;
          utterance.pitch = 1;
          utterance.volume = 1;

          utterance.onend = () => {
            setTimeout(() => speakNextChunk(index + 1), 50);
          };

          utterance.onerror = (e: SpeechSynthesisErrorEvent) => {
            if (e.error !== 'interrupted') {
              console.error('Speech error in chunk', index, ':', e.error);
            }
            setTimeout(() => speakNextChunk(index + 1), 50);
          };

          if (speechSynthRef.current) {
            speechSynthRef.current.speak(utterance);
          }
        } catch (chunkError) {
          console.error('Error speaking chunk', index, ':', chunkError);
          setTimeout(() => speakNextChunk(index + 1), 50);
        }
      };

      speakNextChunk(0);
    } catch (error: unknown) {
      console.error('Speech synthesis error:', error);
      setIsSpeaking(false);
      isSpeakingRef.current = false;
    }
  };

  const speak = (text: string): void => {
    speakWithPriority(text);
  };

  const isFixedResponse = (text: string): boolean => {
    if (!text) return false;

    const lowerText = text.toLowerCase().trim();

    if (
      fixedResponsesRef.current.greetings.some(
        (greeting) =>
          lowerText === greeting.toLowerCase() ||
          lowerText.includes('i am here how can i help you') ||
          lowerText.includes('how can i help you')
      )
    ) {
      return true;
    }

    return false;
  };

  const getRandomGreeting = (): string => {
    const greetings = fixedResponsesRef.current.greetings;
    return greetings[Math.floor(Math.random() * greetings.length)];
  };

  const toggleContinuousListening = async (): Promise<void> => {
    if (!isClient) return;

    if (!browserSupportsSpeechRecognition) {
      toast.error('Speech recognition not available in this browser');
      return;
    }

    try {
      const hasMicAccess = await requestMicrophonePermission();
      if (!hasMicAccess) return;

      if (isContinuousListening) {
        SpeechRecognition.stopListening();
        setIsContinuousListening(false);
        if (alwaysListening) {
          resetTranscript();
          SpeechRecognition.startListening({ continuous: true });
        }
      } else {
        resetTranscript();
        SpeechRecognition.startListening({ continuous: true });
        setIsContinuousListening(true);
        setHasInteracted(true);

        playNotificationSound().then(() => {
          speakWithPriority(getRandomGreeting());
        });
      }
    } catch (error: unknown) {
      console.error('Failed to toggle continuous listening:', error);
      toast.error('Failed to toggle speech recognition');
    }
  };

  const processTranscript = (currentTranscript: string): void => {
    if (!isClient) return;
    if (!currentTranscript) return;
    if (isLoading || isSpeaking) return;

    const newPart = currentTranscript
      .slice(lastTranscriptRef.current.length)
      .trim()
      .toLowerCase();

    if (
      !isContinuousListening &&
      (newPart.includes('hey omega') ||
        newPart.includes('hii omega') ||
        newPart.includes('hello omega') ||
        newPart.includes('hey baby'))
    ) {
      resetTranscript();
      SpeechRecognition.startListening({ continuous: true });
      setIsContinuousListening(true);
      setHasInteracted(true);
      lastTranscriptRef.current = '';
      welcomeSpokenRef.current = true;

      playNotificationSound().then(() => {
        speakWithPriority(getRandomGreeting());
      });
      return;
    }

    if (isContinuousListening) {
      if (
        newPart.includes('hey omega') ||
        newPart.includes('hii omega') ||
        newPart.includes('hello omega') ||
        newPart.includes('hey baby')
      ) {
        if (!welcomeSpokenRef.current) {
          playNotificationSound().then(() => {
            speakWithPriority(getRandomGreeting());
          });
          welcomeSpokenRef.current = true;
        }

        resetTranscript();
        lastTranscriptRef.current = '';
        return;
      }

      if (currentTranscript !== lastTranscriptRef.current) {
        if (silenceTimerRef.current) {
          clearTimeout(silenceTimerRef.current);
        }

        silenceTimerRef.current = setTimeout(() => {
          if (currentTranscript.trim() && !isSpeaking && !isLoading) {
            console.log(
              'Silence detected, processing command:',
              currentTranscript
            );

            if (isFixedResponse(currentTranscript)) {
              console.log('Fixed response detected, not sending to backend');
              resetTranscript();
              lastTranscriptRef.current = '';
            } else {
              sendPrompt(null, currentTranscript);
              resetTranscript();
              lastTranscriptRef.current = '';
            }
          }
        }, 2500);

        lastTranscriptRef.current = currentTranscript;
      }
    }
  };

  const sendPrompt = async (
    e?: FormEvent<HTMLFormElement> | MouseEvent | null,
    customPrompt?: string
  ): Promise<void> => {
    if (e) e.preventDefault();
    let finalPrompt = customPrompt !== undefined ? customPrompt : '';
    let images: string[] = [];
    const isVoiceInput = customPrompt !== undefined;

    if (finalPrompt.includes('"prompt"') && finalPrompt.includes('"images"')) {
      try {
        const parsed = JSON.parse(finalPrompt);
        finalPrompt = parsed.prompt || '';
        images = parsed.images || [];
      } catch (e) {}
    }

    const promptCopy = finalPrompt;

    try {
      if (isLoading) {
        toast.error('Wait for the previous prompt response');
        return;
      }
      if (!finalPrompt.trim() && images.length === 0) {
        toast.error('Prompt is empty');
        return;
      }

      let chatToUse = selectedChat;
      if (!chatToUse) {
        try {
          await createNewChat();
          const tempChatId = `temp_${Date.now()}_${Math.random()
            .toString(36)
            .substr(2, 9)}`;
          const tempChat: Chat = {
            _id: tempChatId,
            name: 'New Chat',
            messages: [],
            userId: user?.id || '',
          };
          chatToUse = tempChat;
          setSelectedChat(tempChat);
          setChats((prevChats) => [tempChat, ...prevChats]);
        } catch (error) {
          console.error('Failed to create chat:', error);
          toast.error('Failed to create chat');
          return;
        }
      }

      if (isFixedResponse(finalPrompt)) {
        console.log(
          'Fixed response detected in sendPrompt, not sending to backend'
        );
        return;
      }

      if (speechSynthRef.current) {
        speechSynthRef.current.cancel();
        setIsSpeaking(false);
        isSpeakingRef.current = false;
      }

      textUpdateTimeouts.forEach((timeout) => clearTimeout(timeout));
      setTextUpdateTimeouts([]);

      setIsLoading(true);
      isLoadingRef.current = true;

      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = null;
      }
      if (isContinuousListening) {
        resetTranscript();
        lastTranscriptRef.current = '';
      }

      let chatId = chatToUse._id;
      let shouldGenerateTitle = false;

      if (chatId.startsWith('temp_')) {
        try {
          const token = await getToken();
          const createResponse: AxiosResponse<ApiResponse<{ _id: string }>> =
            await axios.post(
              '/api/chat/create',
              {},
              { headers: { Authorization: `Bearer ${token}` } }
            );
          if (createResponse.data.success && createResponse.data.data) {
            const newChatId = createResponse.data.data._id;
            chatId = newChatId;
            shouldGenerateTitle = true;

            const updatedChat: Chat = {
              ...chatToUse,
              _id: newChatId,
              name: 'New Chat',
              messages: chatToUse.messages || [],
            };
            setSelectedChat(updatedChat);
            setChats((prevChats) =>
              prevChats.map((chat) =>
                chat._id === chatToUse._id ? updatedChat : chat
              )
            );
            if (typeof window !== 'undefined') {
              window.history.pushState({}, '', `/c/${newChatId}`);
            }
          } else {
            console.error('Failed to create chat - no data returned');
            toast.error('Failed to create chat');
            setIsLoading(false);
            return;
          }
        } catch (error) {
          console.error('Failed to create chat:', error);
          toast.error('Failed to create chat');
          setIsLoading(false);
          return;
        }
      }

      if (!chatId || chatId.startsWith('temp_')) {
        console.error('Invalid chatId after creation:', chatId);
        toast.error('Failed to initialize chat');
        setIsLoading(false);
        return;
      }

      const userPrompt: Message = {
        role: 'user',
        content: finalPrompt,
        timestamp: Date.now(),
        isVoiceMessage: isVoiceInput,
      };

      setChats((prevChats: Chat[]) =>
        prevChats.map((chat: Chat) =>
          chat._id === chatId
            ? { ...chat, messages: [...(chat.messages || []), userPrompt] }
            : chat
        )
      );

      setSelectedChat((prev: Chat | null): Chat | null => {
        if (!prev) return prev;
        return {
          ...prev,
          messages: [...(prev.messages || []), userPrompt],
        };
      });

      setIsWriting(true);
      const token = await getToken();
      const response: AxiosResponse<ApiResponse<{ content: string }>> =
        await axios.post(
          '/api/chat/ai',
          {
            chatId: chatId,
            prompt: finalPrompt,
            images: images,
            model: selectedModel,
          },
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

      const { data } = response;

      if (data.success && data.data) {
        const message = data.data?.content ?? '';
        const isFromFallback = (data.data as any)?.isFromFallback ?? false;

        // Show toast if response is from fallback
        if (isFromFallback) {
          toast.success('Using local fallback model for response', {
            position: 'top-right',
            duration: 4000,
          });
        }

        let assistantMessage: Message = {
          role: 'assistant',
          content: '',
          timestamp: Date.now(),
          isVoiceMessage: isVoiceInput,
        };

        setSelectedChat((prev: Chat | null): Chat | null => {
          if (!prev) return prev;
          return {
            ...prev,
            messages: [...prev.messages, assistantMessage],
          };
        });

        setChats((prevChats: Chat[]) =>
          prevChats.map((chat: Chat) =>
            chat._id === chatId
              ? {
                  ...chat,
                  messages: [...chat.messages, assistantMessage],
                }
              : chat
          )
        );

        if (message && isVoiceInput) {
          setTimeout(() => {
            speak(message);
          }, 100);
        }

        const messageTokens = message.split(' ');
        const newTimeouts: NodeJS.Timeout[] = [];

        const wordsPerMinute = 150;
        const millisecondsPerWord = (60 * 1000) / wordsPerMinute;

        for (let i = 0; i < messageTokens.length; i++) {
          const timeout = setTimeout(() => {
            const updatedContent = messageTokens.slice(0, i + 1).join(' ');

            setSelectedChat((prev: Chat | null): Chat | null => {
              if (!prev) return prev;

              const updatedMessages = prev.messages.map(
                (msg: Message, index: number) => {
                  if (
                    index === prev.messages.length - 1 &&
                    msg.role === 'assistant'
                  ) {
                    return { ...msg, content: updatedContent };
                  }
                  return msg;
                }
              );

              return { ...prev, messages: updatedMessages };
            });

            setChats((prevChats: Chat[]) =>
              prevChats.map((chat: Chat) =>
                chat._id === chatId
                  ? {
                      ...chat,
                      messages: chat.messages.map(
                        (msg: Message, index: number) => {
                          if (
                            index === chat.messages.length - 1 &&
                            msg.role === 'assistant'
                          ) {
                            return { ...msg, content: updatedContent };
                          }
                          return msg;
                        }
                      ),
                    }
                  : chat
              )
            );

            if (i === messageTokens.length - 1) {
              setTimeout(() => {
                setIsWriting(false);
              }, millisecondsPerWord);
            }
          }, i * millisecondsPerWord);

          newTimeouts.push(timeout);
        }

        setTextUpdateTimeouts(newTimeouts);

        if (shouldGenerateTitle) {
          generateChatTitle(chatId, finalPrompt);
        }
      } else {
        toast.error(data.message || 'Failed to get response');
        setIsWriting(false);
      }
    } catch (error: unknown) {
      console.error('API call error:', error);
      toast.error(
        (error as any).response?.data?.message ||
          (error as Error).message ||
          'An error occurred'
      );
      setIsWriting(false);
    } finally {
      setIsLoading(false);
      isLoadingRef.current = false;
    }
  };

  const handleEditMessage = (messageId: string, newContent: string): void => {
    if (!selectedChat) return;
    const updatedMessages = selectedChat.messages.map((msg: Message) => {
      if (msg.id === messageId || msg._id === messageId) {
        return { ...msg, content: newContent };
      }
      return msg;
    });

    setSelectedChat({
      ...selectedChat,
      messages: updatedMessages,
    });

    setChats((prevChats: Chat[]) =>
      prevChats.map((chat: Chat) =>
        chat._id === selectedChat._id
          ? { ...chat, messages: updatedMessages }
          : chat
      )
    );
  };

  const stopTextGeneration = (): void => {
    textUpdateTimeouts.forEach((timeout) => clearTimeout(timeout));
    setTextUpdateTimeouts([]);
    setIsWriting(false);

    if (speechSynthRef.current) {
      speechSynthRef.current.cancel();
      setIsSpeaking(false);
    }

    if (selectedChat && selectedChat.messages.length > 0) {
      const lastMessageIndex = selectedChat.messages.length - 1;
      const lastMessage = selectedChat.messages[lastMessageIndex];

      if (lastMessage.role === 'assistant') {
        const originalContent = selectedChat.messages[lastMessageIndex].content;

        setSelectedChat((prev: Chat | null): Chat | null => {
          if (!prev) return prev;
          const updatedMessages = [...prev.messages];
          const fullMessage = originalContent || '';

          updatedMessages[lastMessageIndex] = {
            ...updatedMessages[lastMessageIndex],
            content: fullMessage,
          };

          return { ...prev, messages: updatedMessages };
        });
      }
    }
  };

  const createNewChat = async (): Promise<void> => {
    try {
      if (!user) return;

      if (
        selectedChat &&
        selectedChat.messages &&
        selectedChat.messages.length === 0
      ) {
        toast.error(
          'Please send at least one message before creating a new chat'
        );
        return;
      }

      const tempChatId = `temp_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`;
      const tempChat: Chat = {
        _id: tempChatId,
        name: 'New Chat',
        messages: [],
        userId: user.id,
      };

      setSelectedChat(tempChat);
      setChats((prevChats) => [tempChat, ...prevChats]);
    } catch (error: unknown) {
      toast.error((error as Error).message || '');
    }
  };
  const deleteChat = async (chatId: string): Promise<void> => {
    try {
      if (!user) return;
      const token = await getToken();
      const { data }: AxiosResponse<ApiResponse> = await axios.delete(
        `/api/chat/delete/${chatId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (data.success) {
        fetchUserChats();
        if (selectedChat && selectedChat._id === chatId) {
          setSelectedChat(null);
        }
      } else {
        toast.error(data.message || '');
      }
    } catch (error: unknown) {
      toast.error((error as Error).message || '');
    }
  };

  const renameChat = async (chatId: string, newName: string): Promise<void> => {
    try {
      if (!user) return;
      const token = await getToken();
      const { data }: AxiosResponse<ApiResponse> = await axios.put(
        `/api/chat/rename/${chatId}`,
        { name: newName },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (data.success) {
        fetchUserChats();
        if (selectedChat && selectedChat._id === chatId) {
          setSelectedChat({ ...selectedChat, name: newName });
        }
      } else {
        toast.error(data.message || '');
      }
    } catch (error: unknown) {
      toast.error((error as Error).message || '');
    }
  };

  const generateChatTitle = async (
    chatId: string,
    userQuery: string
  ): Promise<void> => {
    setRenamingChatId(chatId);
    try {
      if (!user || !chatId) return;
      const token = await getToken();

      let titleSuggestion = '';

      if (userQuery && userQuery.trim()) {
        const words = userQuery.trim().split(' ');
        titleSuggestion = words.slice(0, 5).join(' ');

        if (words.length > 5) {
          titleSuggestion += '...';
        }

        if (titleSuggestion.length > 40) {
          titleSuggestion = titleSuggestion.substring(0, 37) + '...';
        }
      } else {
        titleSuggestion = 'New Chat';
      }

      try {
        const { data }: AxiosResponse<ApiResponse> = await axios.post(
          '/api/chat/rename',
          {
            chatId: chatId,
            name: titleSuggestion,
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (data.success) {
          if (selectedChat && selectedChat._id === chatId) {
            setSelectedChat({ ...selectedChat, name: titleSuggestion });
          }
          setChats((prevChats) =>
            prevChats.map((chat) =>
              chat._id === chatId ? { ...chat, name: titleSuggestion } : chat
            )
          );
        } else {
          console.warn('Failed to rename chat:', data.message);
          if (selectedChat && selectedChat._id === chatId) {
            setSelectedChat({ ...selectedChat, name: titleSuggestion });
          }
          setChats((prevChats) =>
            prevChats.map((chat) =>
              chat._id === chatId ? { ...chat, name: titleSuggestion } : chat
            )
          );
        }
      } catch (apiError) {
        console.error('Error calling rename API:', apiError);
        if (selectedChat && selectedChat._id === chatId) {
          setSelectedChat({ ...selectedChat, name: titleSuggestion });
        }
        setChats((prevChats) =>
          prevChats.map((chat) =>
            chat._id === chatId ? { ...chat, name: titleSuggestion } : chat
          )
        );
      }
    } catch (error: unknown) {
      console.error('Error generating title:', error);
    } finally {
      setRenamingChatId(null);
    }
  };

  const fetchUserChats = async (): Promise<void> => {
    try {
      const token = await getToken();
      const { data }: AxiosResponse<ApiResponse<Chat[]>> = await axios.get(
        '/api/chat/get',
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (data.success) {
        const chatsData: Chat[] = Array.isArray(data.data) ? data.data : [];
        console.log('fetchUserChats', chatsData);
        const sortedData = chatsData.sort(
          (a: Chat, b: Chat) =>
            new Date(b.updatedAt || 0).getTime() -
            new Date(a.updatedAt || 0).getTime()
        );
        setChats(sortedData);

        if (chatsData.length === 0) {
          await createNewChat();
          return fetchUserChats();
        }
      } else {
        toast.error(data.message || '');
      }
    } catch (error: unknown) {
      toast.error((error as Error).message || '');
    }
  };

  const editAndResendMessage = async (
    messageIndex: number,
    newContent: string
  ): Promise<void> => {
    try {
      if (!selectedChat || !selectedChat.messages) return;

      let finalPrompt = newContent;
      let images: string[] = [];

      if (
        finalPrompt.includes('"prompt"') &&
        finalPrompt.includes('"images"')
      ) {
        try {
          const parsed = JSON.parse(finalPrompt);
          finalPrompt = parsed.prompt || '';
          images = parsed.images || [];
        } catch (e) {}
      }

      if (speechSynthRef.current) {
        speechSynthRef.current.cancel();
      }

      textUpdateTimeouts.forEach((timeout) => clearTimeout(timeout));
      setTextUpdateTimeouts([]);
      setIsWriting(false);
      setIsSpeaking(false);

      const truncatedMessages = selectedChat.messages.slice(
        0,
        messageIndex + 1
      );
      truncatedMessages[messageIndex] = {
        ...truncatedMessages[messageIndex],
        content: finalPrompt,
      };

      setSelectedChat({
        ...selectedChat,
        messages: truncatedMessages,
      });

      setChats((prevChats: Chat[]) =>
        prevChats.map((chat: Chat) =>
          chat._id === selectedChat._id
            ? { ...chat, messages: truncatedMessages }
            : chat
        )
      );

      try {
        setIsLoading(true);
        setIsWriting(true);

        const token = await getToken();
        const { data }: AxiosResponse<ApiResponse<{ content: string }>> =
          await axios.post(
            '/api/chat/ai',
            {
              chatId: selectedChat._id,
              prompt: finalPrompt,
              images: images,
              model: selectedModel,
              isEdit: true,
              editedMessageIndex: messageIndex,
            },
            { headers: { Authorization: `Bearer ${token}` } }
          );
        if (data.success) {
          const message = data.data?.content ?? '';

          let assistantMessage: Message = {
            role: 'assistant',
            content: '',
            timestamp: Date.now(),
          };

          setSelectedChat((prev: Chat | null): Chat | null => ({
            ...prev!,
            messages: [...truncatedMessages, assistantMessage],
          }));

          if (message) {
            setTimeout(() => {
              speak(message);
            }, 100);
          }

          const messageTokens = message.split(' ');
          const newTimeouts: NodeJS.Timeout[] = [];

          const wordsPerMinute = 150;
          const millisecondsPerWord = (60 * 1000) / wordsPerMinute;

          for (let i = 0; i < messageTokens.length; i++) {
            const timeout = setTimeout(() => {
              const updatedContent = messageTokens.slice(0, i + 1).join(' ');

              setSelectedChat((prev: Chat | null): Chat | null => {
                if (!prev) return prev;

                const updatedMessages = prev.messages.map(
                  (msg: Message, idx: number) => {
                    if (
                      idx === prev.messages.length - 1 &&
                      msg.role === 'assistant'
                    ) {
                      return { ...msg, content: updatedContent };
                    }
                    return msg;
                  }
                );

                return { ...prev, messages: updatedMessages };
              });

              if (i === messageTokens.length - 1) {
                setTimeout(() => {
                  setIsWriting(false);
                }, millisecondsPerWord);
              }
            }, i * millisecondsPerWord);

            newTimeouts.push(timeout);
          }

          setTextUpdateTimeouts(newTimeouts);

          setChats((prevChats: Chat[]) =>
            prevChats.map((chat: Chat) =>
              chat._id === selectedChat._id
                ? {
                    ...chat,
                    messages: [
                      ...truncatedMessages,
                      {
                        role: 'assistant',
                        content: data.data?.content ?? message,
                        timestamp: Date.now(),
                      },
                    ],
                  }
                : chat
            )
          );

          if (truncatedMessages.length === 1) {
            generateChatTitle(selectedChat._id, finalPrompt);
          }
        } else {
          toast.error(data.message || 'Error in edit response');
          setIsWriting(false);
        }
      } catch (error: unknown) {
        console.error('API call error:', error);
        toast.error(
          (error as any).response?.data?.message ||
            (error as Error).message ||
            'An error occurred'
        );
        setIsWriting(false);
      } finally {
        setIsLoading(false);
      }

      toast.success('Message edited successfully');
    } catch (error: unknown) {
      console.error('Failed to edit and resend message:', error);
      toast.error('Failed to edit message');
      fetchUserChats();
    }
  };

  useEffect(() => {
    if (user) {
      fetchUserChats();
    }
  }, [user]);

  const value: AppContextValue = {
    user,
    chats,
    setChats,
    selectedChat,
    setSelectedChat,
    fetchUserChats,
    createNewChat,
    deleteChat,
    renameChat,
    generateChatTitle,
    renamingChatId,
    setRenamingChatId,
    isWriting,
    setIsWriting,
    isLoading,
    setIsLoading,
    textUpdateTimeouts,
    setTextUpdateTimeouts,
    editAndResendMessage,
    handleEditMessage,
    requestMicrophonePermission,
    sendPrompt,
    speak,
    speakWithPriority,
    playNotificationSound,
    toggleContinuousListening,
    processTranscript,
    isFixedResponse,
    stopTextGeneration,
    isSpeaking,
    setIsSpeaking,
    isContinuousListening,
    setIsContinuousListening,
    selectedVoice,
    setSelectedVoice,
    voices,
    hasInteracted,
    setHasInteracted,
    isClient,
    transcript,
    resetTranscript,
    browserSupportsSpeechRecognition,
    selectedModel,
    setSelectedModel,
    availableModels,
    detectedLang,
    setDetectedLang,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
