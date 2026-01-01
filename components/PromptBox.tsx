import React, {
  useEffect,
  useState,
  ChangeEvent,
  KeyboardEvent,
  FormEvent,
  MouseEvent,
  useCallback,
} from 'react';
import { mirage } from 'ldrs';
import Image from 'next/image';
import { useClerk } from '@clerk/nextjs';
import { ImOmega } from 'react-icons/im';
import { MdAddBox } from 'react-icons/md';
import type { StaticImageData } from 'next/image';
import { useAppContext } from '@/context/AppContext';
import SpeechRecognition, {
  useSpeechRecognition,
} from 'react-speech-recognition';
import { ArrowUp, AudioLines, CircleStop, ChevronDown } from 'lucide-react';
import VoiceInputModal from '@/components/VoiceInputModal';

interface Voice {
  lang: string;
}

interface AppContextType {
  selectedChat: { messages: any[] } | null;
  isLoading: boolean;
  isWriting: boolean;
  setIsLoading: (loading: boolean) => void;
  setIsWriting: (writing: boolean) => void;
  sendPrompt: (e: FormEvent | MouseEvent | undefined, prompt: string) => void;
  toggleContinuousListening: () => Promise<void>;
  processTranscript: (
    transcript: string,
    speech: typeof SpeechRecognition
  ) => void;
  isSpeaking: boolean;
  isContinuousListening: boolean;
  voices: Voice[];
  user: any;
  isClient: boolean;
  stopTextGeneration: () => void;
  isFixedResponse: (text: string) => boolean;
  selectedModel: string;
  setSelectedModel: (model: string) => void;
  availableModels: Array<{
    id: string;
    name: string;
    image: StaticImageData | string;
  }>;
}

const PromptBox: React.FC = () => {
  const [prompt, setPrompt] = useState<string>('');
  const [isModelOpen, setIsModelOpen] = useState<boolean>(false);
  const [modelSearch, setModelSearch] = useState<string>('');
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);

  const {
    selectedChat,
    isLoading,
    isWriting,
    setIsLoading,
    setIsWriting,
    sendPrompt,
    toggleContinuousListening: toggleContinuousListeningContext,
    processTranscript,
    isSpeaking,
    isContinuousListening,
    voices,
    user,
    isClient,
    stopTextGeneration,
    isFixedResponse,
    selectedModel,
    setSelectedModel,
    availableModels,
  } = useAppContext() as AppContextType;

  const {
    transcript,
    resetTranscript,
    listening,
    browserSupportsSpeechRecognition,
    isMicrophoneAvailable,
  } = useSpeechRecognition();

  const { openSignIn } = useClerk();

  useEffect(() => {
    const handleClickOutside = (event: Event) => {
      const target = event.target as HTMLElement;
      if (!target.closest('[data-model-selector]')) {
        setIsModelOpen(false);
      }
    };

    if (isModelOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isModelOpen]);

  const handlePromptChange = useCallback(
    (e: ChangeEvent<HTMLTextAreaElement>): void => {
      setPrompt(e.target.value);
    },
    []
  );

  const handleImageUpload = useCallback(
    (e: ChangeEvent<HTMLInputElement>): void => {
      const files = e.target.files;
      if (!files) return;

      Array.from(files).forEach((file) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          const base64String = event.target?.result as string;
          setUploadedImages((prev) => [...prev, base64String]);
        };
        reader.readAsDataURL(file);
      });

      if (e.target) e.target.value = '';
    },
    []
  );

  const removeImage = (index: number): void => {
    setUploadedImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSendPrompt = useCallback(
    (e?: FormEvent<HTMLFormElement> | MouseEvent): void => {
      if (e) e.preventDefault();
      if (!prompt.trim() && uploadedImages.length === 0) return;

      const data = {
        prompt,
        images: uploadedImages,
      };

      sendPrompt(e as any, JSON.stringify(data));
      setPrompt('');
      setUploadedImages([]);
    },
    [prompt, uploadedImages, sendPrompt]
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>): void => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSendPrompt(e as any);
      }
    },
    [handleSendPrompt]
  );

  const handleToggleContinuousListening = useCallback((): void => {
    toggleContinuousListeningContext();
  }, [toggleContinuousListeningContext]);

  useEffect(() => {
    if (!isClient) return;

    if (isContinuousListening && !listening) {
      console.log('Listening stopped unexpectedly, restarting...');
      SpeechRecognition.startListening({ continuous: true });
    }
  }, [listening, isContinuousListening, isClient]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      mirage.register();
    }
  }, []);

  if (!isClient) {
    return (
      <form
        className={`w-full ${
          (selectedChat?.messages?.length ?? 0) > 0 ? 'max-w-3xl' : 'max-w-2xl'
        } bg-[#404045] p-4 rounded-3xl mt-4 transition-all`}
      >
        <textarea
          className="outline-none w-full resize-none overflow-hidden wrap-break-word bg-transparent text-white"
          rows={2}
          placeholder="Loading voice recognition..."
          disabled
        />
        <div className="flex items-center justify-between text-sm mt-2">
          <p className="flex items-center sm:gap-2 text-xs border border-gray-300/40 px-2 py-1 rounded-full">
            <span className="sm:h-5 h-4 w-4 bg-transparent"></span>
            OMEGA - AI
          </p>
        </div>
      </form>
    );
  }

  const uniqueLangs: string[] =
    voices.length > 0
      ? Array.from(new Set(voices.map((v) => v.lang)))
      : ['en-US'];

  return (
    <form
      onSubmit={handleSendPrompt}
      className={`w-full ${
        (selectedChat?.messages?.length ?? 0) > 0 ? 'max-w-3xl' : 'max-w-2xl'
      } bg-[#121212] [#404045] p-4 border border-white/10 rounded-xl mt-4 transition-all  shadow-2xl shadow-gray-800`}
    >
      <textarea
        onKeyDown={handleKeyDown}
        className="outline-none w-full resize-none overflow-hidden wrap-break-word bg-transparent text-white min-h-[50px]"
        rows={2}
        placeholder="Message OMEGA"
        onChange={handlePromptChange}
        value={prompt}
      />

      {/* Image Preview */}
      {uploadedImages.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {uploadedImages.map((img, idx) => (
            <div key={idx} className="relative">
              <Image
                src={img}
                alt="preview"
                className="w-20 h-20 rounded-lg object-cover border border-white/20"
              />
              <button
                type="button"
                onClick={() => removeImage(idx)}
                className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
              >
                ✕ 
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between text-sm mt-2">
        <div className="flex items-center gap-2">
          <label
            title="Upload image"
            className="cursor-pointer hover:bg-gray-500/20 p-2 rounded-lg transition"
            htmlFor="image-upload"
          >
            <input
              id="image-upload"
              type="file"
              multiple
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
              title="Upload images"
            />
            <MdAddBox size={26} />
          </label>
          <p className="flex items-center sm:gap-1 text-xs border font-head font-black border-gray-300/40 px-2 py-1 w-22 sm:w-auto rounded-full select-none hover:bg-gray-500/20 transition">
            <ImOmega className="w-4" size={14} />
            OMEGA
          </p>

          {/* Model Selector Dropdown */}
          <div className="relative" data-model-selector>
            <button
              type="button"
              onClick={() => setIsModelOpen(!isModelOpen)}
              className="flex items-center justify-between gap-2 text-white bg-[#09090b] border border-gray-300/40 p-1 rounded-full hover:bg-gray-500/20 transition text-xs w-32 sm:w-auto"
              title="Select AI Model"
            >
              <div className="flex items-center gap-2">
                <Image
                  src={
                    availableModels.find((m) => m.id === selectedModel)
                      ?.image || '/assets/aimodels/deepseek.png'
                  }
                  alt="model"
                  width={20}
                  height={20}
                  className="w-5 h-5 rounded-full"
                />
                <span className="truncate">
                  {availableModels.find((m) => m.id === selectedModel)?.name}
                </span>
              </div>
              <ChevronDown
                size={16}
                className={`transition-transform ${
                  isModelOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {isModelOpen && (
              <div className="absolute bottom-full -left-32 md:left-0 mb-2 bg-[#09090b] border border-white/10 rounded-xl shadow-lg z-50 min-w-max w-64">
                <div className="p-3 border-b border-zinc-800">
                  <div className="relative">
                    <svg
                      className="absolute left-1 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                    <input
                      type="text"
                      placeholder="Search models..."
                      className="w-full text-white text-sm rounded-lg pl-8 pr-3 outline-none focus:border-zinc-600 placeholder-zinc-500"
                      value={modelSearch}
                      onChange={(e) => setModelSearch(e.target.value)}
                    />
                  </div>
                </div>

                <div className="max-h-72 overflow-y-auto p-2">
                  {availableModels
                    .filter((model) =>
                      model.name
                        .toLowerCase()
                        .includes(modelSearch.toLowerCase())
                    )
                    .map((model) => (
                      <button
                        key={model.id}
                        type="button"
                        onClick={() => {
                          setSelectedModel(model.id);
                          setIsModelOpen(false);
                          setModelSearch('');
                        }}
                        className={`w-full flex items-center cursor-pointer gap-3 px-4 py-2 rounded-md text-left text-sm transition ${
                          selectedModel === model.id
                            ? 'bg-[#27272a] text-white'
                            : 'text-white/80 hover:bg-white/5'
                        }`}
                      >
                        <Image
                          src={model.image}
                          alt={model.name}
                          width={24}
                          height={24}
                          className="w-6 h-6 rounded-full"
                        />
                        <span>{model.name}</span>
                      </button>
                    ))}
                </div>
              </div>
            )}
          </div>

          <div
            className={`flex items-center text-xs bord er border-gray-300/40 md:px-3 py-2.5 px-1.5 rounded-full ${
              isSpeaking && isContinuousListening && 'border bg-gray-500/20'
            }`}
          >
            {isSpeaking &&
              isContinuousListening &&
              React.createElement('l-mirage', {
                size: '20',
                speed: '2.5',
                color: 'white',
              })}
            {isContinuousListening && (
              <VoiceInputModal
                isContinuousListening={isContinuousListening}
                toggleContinuousListening={handleToggleContinuousListening}
                className={isContinuousListening ? '' : 'hidden'}
                isSpeaking={isSpeaking}
                isLoading={isLoading}
                setIsLoading={setIsLoading}
              />
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 px-1 sm:px-auto">
          {isWriting ? (
            <button
              type="button"
              title="Stop text generation"
              onClick={stopTextGeneration}
              className="rounded-full p-2 cursor-pointer bg-primary hover:bg-primary/80"
            >
              <CircleStop size={20} />
            </button>
          ) : prompt.trim() ? (
            <div className="relative group flex items-center justify-center">
              <div className="absolute bottom-full mb-4 opacity-0 group-hover:opacity-100 transition bg-black text-white/90 text-sm p-2 font-serif font-sans rounded-lg shadow-lg pointer-events-none whitespace-nowrap z-10">
                Send message
                <div className="absolute left-1/2 top-full -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-black rotate-45"></div>
              </div>
              <button
                type="submit"
                aria-label="Send message"
                className={`${
                  prompt ? 'bg-primary hover:bg-primary/80' : 'bg-[#71717a]'
                } rounded-full p-2 cursor-pointer`}
              >
                <ArrowUp size={20} />
              </button>
            </div>
          ) : (
            <div className="relative group flex items-center justify-center">
              <div className="absolute bottom-full mb-4 opacity-0 group-hover:opacity-100 transition bg-black text-white/90 text-sm p-2 font-serif font-sans rounded-lg shadow-lg pointer-events-none whitespace-nowrap z-10">
                Use voice mode
                <div className="absolute left-1/2 top-full -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-black rotate-45"></div>
              </div>
              <button
                type="button"
                title="Toggle voice input"
                onClick={() =>
                  isClient && !user
                    ? openSignIn()
                    : handleToggleContinuousListening()
                }
                className={`rounded-lg p-2 cursor-pointer text-white ${
                  isContinuousListening
                    ? 'bg-slate-500'
                    : 'bg-primary hover:bg-primary/80'
                }`}
              >
                <AudioLines size={20} />
              </button>
            </div>
          )}
        </div>
      </div>
    </form>
  );
};

export default PromptBox;
