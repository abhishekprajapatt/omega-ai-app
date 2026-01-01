import Prism from 'prismjs';
import Image from 'next/image';
import toast from 'react-hot-toast';
import Markdown from 'react-markdown';
import { assets } from '@/assets/assets';
import { Copy, Check } from 'lucide-react';
import React, {
  useEffect,
  useState,
  ReactNode,
  ChangeEvent,
  MouseEvent,
} from 'react';
import { useAppContext } from '@/context/AppContext';

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
  const { editAndResendMessage, selectedChat } =
    useAppContext() as AppContextType;

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

  if (isEditing && role === 'user') {
    return (
      <div className="flex flex-col items-center w-full max-w-3xl text-sm">
        {/* Message Edit Form */}
        <div className="flex flex-col w-full mb-8 items-end">
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
              {/* Cancel & Send Buttons */}
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
        className={`flex flex-col w-full mb-8 ${
          role === 'user' ? 'items-end' : ''
        }`}
      >
        {/* Message */}
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
                alt="Omega Logo"
                width={36}
                height={36}
                className="h-9 w-9 p-1 border border-white/15 rounded-full shrink-0"
              />
              <div className="space-y-4 w-full overflow-hidden">
                <div className="prose prose-invert max-w-none">
                  <Markdown>
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
