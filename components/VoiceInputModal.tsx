import { X } from 'lucide-react';
import { useState, useEffect, useRef, MouseEvent } from 'react';

type Mode = 'text' | 'speaking' | 'listening' | 'thinking';

interface VoiceInputModalProps {
  isContinuousListening: boolean;
  toggleContinuousListening: () => void;
  isSpeaking: boolean;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  className?: string;
}

const VoiceInputModal: React.FC<VoiceInputModalProps> = ({
  isContinuousListening,
  toggleContinuousListening,
  isSpeaking,
  isLoading,
  setIsLoading,
  className = '',
}) => {
  const audioVisualizerRef = useRef<HTMLCanvasElement>(null);
  const [mode, setMode] = useState<Mode>('text');
  const [isClosing, setIsClosing] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const prevModeRef = useRef<Mode>('text');
  const userClickedOpenRef = useRef(false);

  useEffect(() => {
    if (isContinuousListening && !userClickedOpenRef.current) {
      userClickedOpenRef.current = true;
      setIsModalOpen(true);
      setIsClosing(false);
    }
  }, [isContinuousListening]);

  useEffect(() => {
    let newMode: Mode = 'text';
    if (isLoading) {
      newMode = 'thinking';
    } else if (isSpeaking) {
      newMode = 'speaking';
    } else if (isContinuousListening) {
      newMode = 'listening';
    } else if (userClickedOpenRef.current) {
      newMode = 'listening';
    }

    if (newMode !== prevModeRef.current) {
      prevModeRef.current = newMode;
      setMode(newMode);
    }
  }, [isContinuousListening, isLoading, isSpeaking]);

  useEffect(() => {
    let animationFrame: number | null = null;
    const canvas = audioVisualizerRef.current;

    if (canvas && mode === 'thinking') {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const radius = Math.min(centerX, centerY) - 10;

      const animate = (): void => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const gradient = ctx.createRadialGradient(
          centerX,
          centerY,
          0,
          centerX,
          centerY,
          radius,
        );

        gradient.addColorStop(0, '#E1F5FE');
        gradient.addColorStop(1, '#2196F3');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.fill();

        const time = Date.now() / 1000;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 2;

        for (let i = 0; i < 3; i++) {
          const outerRadius = radius - 10 - i * 10;
          ctx.beginPath();

          for (let angle = 0; angle < Math.PI * 2; angle += 0.1) {
            const amplitude = 5 + Math.sin(time * 2 + i) * 5;
            const x =
              centerX +
              Math.cos(angle) *
                (outerRadius + Math.sin(angle * 8 + time * 3) * amplitude);
            const y =
              centerY +
              Math.sin(angle) *
                (outerRadius + Math.sin(angle * 8 + time * 3) * amplitude);

            if (angle === 0) {
              ctx.moveTo(x, y);
            } else {
              ctx.lineTo(x, y);
            }
          }

          ctx.closePath();
          ctx.stroke();
        }

        animationFrame = requestAnimationFrame(animate);
      };

      animate();
    }

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [mode]);

  if (!isModalOpen) return null;

  const handleClose = (e: MouseEvent<HTMLButtonElement>): void => {
    e.stopPropagation();
    setIsClosing(true);
    userClickedOpenRef.current = false;
    setTimeout(() => {
      setIsModalOpen(false);
      setIsClosing(false);
      toggleContinuousListening();
    }, 300);
  };

  return (
    <div
      className={`fixed inset-0 bg-black flex items-center justify-center z-50 transition-all duration-300 ${
        isClosing ? 'opacity-0 pointer-events-none' : 'opacity-100'
      } ${className}`}
    >
      <div
        className={`absolute top-8 right-[5%] ${
          isSpeaking ? 'right-[4%]' : ''
        }`}
      >
        <button
          onClick={handleClose}
          className="bg-gray-900 cursor-pointer p-2 md:p-3 text-white/90 rounded-full hover:bg-gray-800 transition"
          aria-label="Close modal"
        >
          <X size={30} />
        </button>
      </div>

      {mode === 'speaking' && (
        <div className="flex flex-col items-center">
          <div className="w-60 h-60 rounded-full relative overflow-hidden transition-all">
            <video
              className="w-full h-full object-cover"
              autoPlay
              loop
              muted
              playsInline
            >
              <source src="/waterflow.mp4" type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          </div>
          <p className="font-serif font-bold text-2xl text-white text-center my-4 drop-shadow-lg">
            Speaking...
          </p>
        </div>
      )}

      {mode === 'listening' && (
        <div className="flex flex-col items-center">
          <div className="w-60 h-60 rounded-full relative overflow-hidden transition-all">
            <video
              className="w-full h-full object-cover"
              autoPlay
              loop
              muted
              playsInline
            >
              <source src="/thinkflow.mp4" type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          </div>
          <p className="font-serif font-bold text-2xl text-white text-center my-4 drop-shadow-lg">
            Listening...
          </p>
        </div>
      )}

      {mode === 'thinking' && (
        <div className="flex flex-col items-center">
          <canvas
            ref={audioVisualizerRef}
            width={240}
            height={240}
            className="rounded-full w-60 h-60 border border-white/20"
          />
          <p className="font-serif font-bold text-2xl text-white text-center my-4 drop-shadow-lg">
            Thinking...
          </p>
        </div>
      )}
    </div>
  );
};

export default VoiceInputModal;
