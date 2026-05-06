import Prism from 'prismjs';
import 'prismjs/themes/prism-okaidia.css';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-markup';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-bash';
import Image from 'next/image';
import toast from 'react-hot-toast';
import Markdown from 'react-markdown';
import { assets } from '@/assets/assets';
import { Copy, Check, Volume2, RotateCcw, Eye, X } from 'lucide-react';
import React, {
  useEffect,
  useState,
  ReactNode,
  ChangeEvent,
  MouseEvent,
  useCallback,
} from 'react';
import { useAppContext } from '@/context/AppContext';
import { useVoiceConversation } from '@/lib/useVoiceConversation';
interface TooltipProps {
  text: string;
  children: ReactNode;
}
const Tooltip: React.FC<TooltipProps> = ({ text, children }) => {
  return (
    <div className="relative group/tooltip">
      {children}
      <div className="absolute top-8 left-1/2 transform -translate-x-1/2 p-2 bg-black text-white text-sm font-serif rounded opacity-0 group-hover/tooltip:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10 shadow-lg">
        {text}
        <div className="absolute left-1/2 bottom-full -translate-x-1/2 translate-y-1/2 w-2.5 h-2.5 bg-black rotate-45"></div>
      </div>
    </div>
  );
};

interface ChatMessage {
  role: string;
  content: string;
}
interface SelectedChat {
  messages: ChatMessage[];
}
interface AppContextType {
  editAndResendMessage: (index: number, content: string) => void;
  selectedChat: SelectedChat | null;
  speak: (text: string) => void;
  isSpeaking: boolean;
  setIsSpeaking: React.Dispatch<React.SetStateAction<boolean>>;
}
interface MessageProps {
  role: string;
  content: string;
  index: number;
  messageId: string;
  isWriting: boolean;
  isVoiceMessage?: boolean;
  expand: boolean;
  setExpand: (expand: boolean) => void;
}
const Message: React.FC<MessageProps> = ({
  role,
  expand,
  setExpand,
  content,
  index,
  messageId,
  isWriting,
  isVoiceMessage,
}) => {
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editedContent, setEditedContent] = useState<string>(content);
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const {
    editAndResendMessage,
    selectedChat,
    speak,
    isSpeaking,
    setIsSpeaking,
  } = useAppContext() as AppContextType;
  const voice = useVoiceConversation({
    language: 'en-US',
    onSpeakingStart: () => {
      setIsPlayingAudio(true);
    },
    onSpeakingEnd: () => {
      setIsPlayingAudio(false);
    },
    onError: (error) => {
      toast.error(`Voice error: ${error}`);
      setIsPlayingAudio(false);
    },
  });
  const handleServerSpeak = useCallback(
    async (e: MouseEvent<HTMLDivElement>) => {
      e.stopPropagation();
      if (role !== 'assistant') return;
      try {
        setIsPlayingAudio(true);
        toast.loading('Converting text to speech...');
        await voice.playResponse(content, true);
        toast.dismiss();
        toast.success('Playing response...');
      } catch (error) {
        toast.dismiss();
        toast.error('Failed to play audio');
        setIsPlayingAudio(false);
      }
    },
    [role, content, voice],
  );
  useEffect(() => {
    if (typeof window !== 'undefined') {
      Prism.highlightAll();
    }
  }, [content]);
  useEffect(() => {
    setEditedContent(content);
  }, [content]);
  const copyMessage = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(content);
      toast.success('Message copied to clipboard');
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      toast.error('Copy failed');
    }
  };
  const handleSpeak = (e: MouseEvent<HTMLDivElement>): void => {
    e.stopPropagation();
    if (role === 'assistant') {
      if (voice.isSupported.synthesizer) {
        speak(content);
        setIsPlayingAudio(true);
        toast.success('Speaking...');
      } else {
        handleServerSpeak(e);
      }
    }
  };
  const handleStopSpeech = (e: MouseEvent<HTMLDivElement>): void => {
    e.stopPropagation();
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsPlayingAudio(false);
      setIsSpeaking(false);
      toast.success('Speech stopped');
    }
  };
  const handleEdit = (e: MouseEvent<HTMLDivElement>): void => {
    e.stopPropagation();
    setIsEditing(true);
  };
  const handleCancel = (): void => {
    setIsEditing(false);
    setEditedContent(content);
  };
  const handleSend = (): void => {
    if (editedContent.trim()) {
      editAndResendMessage(index, editedContent);
      setIsEditing(false);
    } else {
      toast.error('Message cannot be empty');
    }
  };
  const handleRegenerate = (e: MouseEvent<HTMLDivElement>): void => {
    e.stopPropagation();
    if (selectedChat && index > 0) {
      let userMessageIndex = index - 1;
      while (
        userMessageIndex >= 0 &&
        selectedChat.messages[userMessageIndex].role !== 'user'
      ) {
        userMessageIndex--;
      }
      if (userMessageIndex >= 0) {
        const userMessage = selectedChat.messages[userMessageIndex];
        editAndResendMessage(userMessageIndex, userMessage.content);
      }
    }
  };

  const copyCode = (code: string): void => {
    navigator.clipboard.writeText(code);
    toast.success('Code copied to clipboard!');
  };

  const extractAllCodeBlocks = useCallback(() => {
    const codeBlockRegex = /```(\w+)\n([\s\S]*?)```/g;
    const blocks: { lang: string; code: string }[] = [];
    let match;

    while ((match = codeBlockRegex.exec(content)) !== null) {
      blocks.push({
        lang: match[1].toLowerCase(),
        code: match[2].trim(),
      });
    }

    return blocks;
  }, [content]);

  const CodeBlock = ({
    code,
    language,
  }: {
    code: string;
    language: string;
  }) => {
    const [isPreviewMode, setIsPreviewMode] = useState<boolean>(false);
    const codeRef = React.useRef<HTMLElement>(null);
    const isHtml = ['html', 'htm'].includes(language.toLowerCase());
    const allBlocks = extractAllCodeBlocks();

    let displayCode = code;
    let compiledHtml = code;
    let isPreviewable = false;

    if (isHtml && allBlocks.length > 1) {
      const cssBlock = allBlocks.find((b) => b.lang === 'css');
      const jsBlock = allBlocks.find((b) =>
        ['js', 'javascript'].includes(b.lang),
      );

      let htmlContent = code;

      if (
        !htmlContent.includes('<!DOCTYPE') &&
        !htmlContent.includes('<html')
      ) {
        htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Code Preview</title>
</head>
<body>
${htmlContent}
</body>
</html>`;
      }

      if (cssBlock && !htmlContent.includes('<style')) {
        const styleTag = `<style>\n${cssBlock.code}\n</style>`;
        htmlContent = htmlContent.replace('</head>', `${styleTag}\n</head>`);
      }

      if (jsBlock && !htmlContent.includes('<script')) {
        const scriptTag = `<script type="text/javascript">
${jsBlock.code}
</script>`;
        htmlContent = htmlContent.replace('</body>', `${scriptTag}\n</body>`);
      }

      compiledHtml = htmlContent;
      displayCode = code;
      isPreviewable = true;
    } else if (isHtml) {
      isPreviewable = true;
      compiledHtml = code;
    }

    const generateIframeContent = (): string => {
      let finalHtml = compiledHtml;

      if (!finalHtml.includes('<!DOCTYPE')) {
        finalHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body>
${finalHtml}
</body>
</html>`;
      }

      return finalHtml;
    };

    useEffect(() => {
      if (codeRef.current && !isPreviewMode) {
        Prism.highlightElement(codeRef.current);
      }
    }, [displayCode, isPreviewMode, language]);

    return (
      <div className="relative group/code rounded-lg my-2 overflow-x-auto">
        {!isPreviewMode && (
          <div className="absolute top-4 right-2 flex items-center gap-2 opacity-0 group-hover/code:opacity-100 transition-all z-20">
            <Tooltip text="Copy code">
              <div
                onClick={() => copyCode(displayCode)}
                className="cursor-pointer hover:bg-white/20 p-2 rounded-md transition"
              >
                <Copy className="w-4 h-4 text-white" />
              </div>
            </Tooltip>
            {isPreviewable && (
              <Tooltip text="Live Preview">
                <div
                  onClick={() => setIsPreviewMode(true)}
                  className="cursor-pointer hover:bg-white/20 p-2 rounded-md transition"
                >
                  <Eye className="w-4 h-4 text-white" />
                </div>
              </Tooltip>
            )}
          </div>
        )}

        {isPreviewMode ? (
          <div className="relative w-full bg-white rounded-lg overflow-hidden border-2 border-gray-300 h-96 md:h-[90vh]">
            <button
              onClick={() => setIsPreviewMode(false)}
              className="absolute top-2 text-xs right-2 z-50 cursor-pointer bg-black/70 hover:bg-black/90 text-white px-2 py-1.5 rounded-md transition flex items-center gap-1 font-head font-bold"
            >
              <X className="w-4 h-4" /> Stop
            </button>
            <iframe
              key={`preview-${isPreviewMode}`}
              srcDoc={generateIframeContent()}
              className="w-full h-full border-0 bg-white"
              title="Code Preview"
              sandbox="allow-scripts allow-same-origin allow-forms"
            />
          </div>
        ) : (
          <pre className="overflow-auto bg-[#0f0f1e] rounded-lg text-sm leading-relaxed font-mono">
            <code
              ref={codeRef}
              className={`language-${language} text-[13px] code-highlight`}
            >
              {displayCode}
            </code>
          </pre>
        )}
      </div>
    );
  };
  if (isEditing && role === 'user') {
    return (
      <div className="flex flex-col items-center w-full max-w-3xl text-sm">
        {}
        <div className="flex flex-col w-full mb-4 items-end">
          <div className="w-full max-w-2xl relative">
            <textarea
              value={editedContent}
              onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
                setEditedContent(e.target.value)
              }
              className="w-full rounded-2xl bg-[#121212] [#414158] p-4 text-white/90 outline-none resize-none min-h-20"
              rows={3}
              autoFocus
              placeholder="Edit your message..."
            />
            <div className="absolute bottom-3 right-3 flex space-x-2 gap-2">
              {}
              <button
                onClick={handleCancel}
                className="px-4 py-2 rounded-xl bg-[#27272a] text-white hover:bg-[#212124] cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSend}
                className="px-4 py-2 rounded-xl bg-primary text-white hover:bg-[#326ab9] cursor-pointer transition-colors"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="flex flex-col items-center w-full max-w-3xl text-sm">
      <div
        className={`flex flex-col w-full mb-4 ${
          role === 'user' ? 'items-end' : ''
        }`}
      >
        {}
        <div
          className={`group relative flex max-w-2xl py-3 rounded-xl ${
            role === 'user' ? 'bg-[#121212] [#414158] px-5' : 'gap-3'
          }`}
        >
          <div
            className={`opacity-0 group-hover:opacity-100 absolute transition-all ${
              role === 'user' ? '-left-16 top-2.5' : 'left-9 -bottom-6'
            }`}
          >
            <div className="flex items-center gap-2 opacity-70">
              {role === 'user' ? (
                <>
                  <Tooltip text={isCopied ? 'Copied!' : 'Copy'}>
                    <div
                      onClick={copyMessage}
                      className="cursor-pointer text-white w-6 h-6 flex items-center justify-center"
                    >
                      {isCopied ? (
                        <div className="hover:bg-white/10 p-1 rounded-md">
                          <Check className="w-4 h-4 text-green-500" />
                        </div>
                      ) : (
                        <div className="hover:bg-white/10 p-1 rounded-md">
                          <Copy className="w-4 h-4" />
                        </div>
                      )}
                    </div>
                  </Tooltip>
                  <Tooltip text="Edit message">
                    <div
                      onClick={handleEdit}
                      className="hover:bg-white/10 p-1 rounded-md w-6 h-6 flex items-center justify-center cursor-pointer"
                    >
                      <Image
                        src={assets.pencil_icon as string}
                        alt="Edit"
                        width={16}
                        height={16}
                        className="w-4"
                      />
                    </div>
                  </Tooltip>
                </>
              ) : (
                <>
                  <Tooltip text={isCopied ? 'Copied!' : 'Copy'}>
                    <div
                      onClick={copyMessage}
                      className="cursor-pointer text-white w-6 h-6 flex items-center justify-center"
                    >
                      {isCopied ? (
                        <div className="hover:bg-white/10 p-1 rounded-md">
                          <Check className="w-4 h-4 text-green-500" />
                        </div>
                      ) : (
                        <div className="hover:bg-white/10 p-1 rounded-md">
                          <Copy className="w-4 h-4" />
                        </div>
                      )}
                    </div>
                  </Tooltip>
                  <Tooltip text={isPlayingAudio ? 'Stop speech' : 'Read aloud'}>
                    <div
                      onClick={isPlayingAudio ? handleStopSpeech : handleSpeak}
                      className={`cursor-pointer w-6 h-6 flex items-center justify-center rounded-md transition ${
                        isPlayingAudio
                          ? 'bg-blue-500/30 hover:bg-blue-500/40'
                          : 'hover:bg-white/10'
                      }`}
                    >
                      {isPlayingAudio ? (
                        <RotateCcw className="w-4 h-4 text-blue-400 animate-spin" />
                      ) : (
                        <Volume2 className="w-4 h-4" />
                      )}
                    </div>
                  </Tooltip>
                  <Tooltip text="Regenerate response">
                    <div
                      onClick={handleRegenerate}
                      className="hover:bg-white/10 p-1 rounded-md w-6 h-6 flex items-center justify-center cursor-pointer"
                    >
                      <Image
                        src={assets.regenerate_icon as string}
                        alt="Regenerate"
                        width={16}
                        height={16}
                        className="w-4"
                      />
                    </div>
                  </Tooltip>
                  <Tooltip text="Like response">
                    <div className="hover:bg-white/10 p-1 rounded-md w-6 h-6 flex items-center justify-center cursor-pointer">
                      <Image
                        src={assets.like_icon as string}
                        alt="Like"
                        width={16}
                        height={16}
                        className="w-4"
                      />
                    </div>
                  </Tooltip>
                  <Tooltip text="Dislike response">
                    <div className="hover:bg-white/10 p-1 rounded-md w-6 h-6 flex items-center justify-center cursor-pointer">
                      <Image
                        src={assets.dislike_icon as string}
                        alt="Dislike"
                        width={16}
                        height={16}
                        className="w-4"
                      />
                    </div>
                  </Tooltip>
                </>
              )}
            </div>
          </div>
          {role === 'user' ? (
            <span className="text-white/90 text-xs md:text-s whitespace-pre-wrap wrap-break-word">
              {content}
            </span>
          ) : (
            <>
              <Image
                src={assets.logo_icon as string}
                alt="OMG Logo"
                width={36}
                height={36}
                className="h-9 w-9 p-1 border border-white/15 rounded-full shrink-0"
              />
              <div className="space-y-4 w-full overflow-hidden">
                <div className="prose prose-invert max-w-none">
                  <Markdown
                    components={{
                      code: ({
                        node,
                        inline,
                        className,
                        children,
                        ...props
                      }: any) => {
                        const match = /language-(\w+)/.exec(className || '');
                        const language = match ? match[1] : 'text';
                        const code = String(children).replace(/\n$/, '');

                        if (inline) {
                          return (
                            <code className={className} {...props}>
                              {children}
                            </code>
                          );
                        }

                        return <CodeBlock code={code} language={language} />;
                      },
                    }}
                  >
                    {isWriting ? `${content || ''} ▌` : content || ''}
                  </Markdown>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
export default Message;
