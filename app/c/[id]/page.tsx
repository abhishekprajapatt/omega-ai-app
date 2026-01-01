'use client';
import Image from 'next/image';
import { assets } from '@/assets/assets';
import { useClerk } from '@clerk/nextjs';
import Message from '@/components/Message';
import Sidebar from '@/components/Sidebar';
import { ChevronDown } from 'lucide-react';
import { useParams } from 'next/navigation';
import PromptBox from '@/components/PromptBox';
import { useAppContext } from '@/context/AppContext';
import {
  useEffect,
  useRef,
  useState,
  MouseEvent,
  FormEvent,
  useCallback,
} from 'react';

interface MessageType {
  _id?: string;
  role: string;
  content: string;
  isVoiceMessage?: boolean;
}

interface SelectedChat {
  _id: string;
  name: string;
  messages: MessageType[];
}

interface AppContextType {
  selectedChat: SelectedChat | null;
  chats: SelectedChat[];
  setSelectedChat: (chat: SelectedChat | null) => void;
  sendPrompt: (
    e: FormEvent<HTMLFormElement> | MouseEvent | undefined,
    prompt: string
  ) => void;
  user: any;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  isWriting: boolean;
  setIsWriting: (writing: boolean) => void;
  isClient: boolean;
}

const ChatPage: React.FC = () => {
  const [expand, setExpand] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [greeting, setGreeting] = useState<string>('');
  const params = useParams();
  const chatId = params.id as string;

  const {
    selectedChat,
    chats,
    setSelectedChat,
    sendPrompt,
    user,
    isLoading,
    setIsLoading,
    isWriting,
    setIsWriting,
    isClient,
  } = useAppContext() as AppContextType;

  const { openSignIn } = useClerk();

  useEffect(() => {
    if (isClient && user === null) {
      openSignIn();
    }
  }, [user, isClient, openSignIn]);

  useEffect(() => {
    if (!chatId || !chats || chats.length === 0) return;
    if (selectedChat && selectedChat._id === chatId) return;
    const chat = chats.find((c) => c._id === chatId);
    if (chat) {
      setSelectedChat(chat);
    }
  }, [chatId, chats, selectedChat, setSelectedChat]);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTo({
        top: containerRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [selectedChat?.messages]);

  const getGreeting = useCallback((): string => {
    const now = new Date();
    const hours = now.getHours();

    if (hours >= 5 && hours < 12) {
      return 'Good morning 🌅';
    } else if (hours >= 12 && hours < 17) {
      return 'Good afternoon ☀️';
    } else if (hours >= 17 && hours < 21) {
      return 'Good evening 🌇';
    } else {
      return 'Good night 🌙';
    }
  }, []);

  useEffect(() => {
    setGreeting(getGreeting());
  }, [getGreeting]);


  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTo({
        top: containerRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [selectedChat]);

  const handleToggleExpand = (e: MouseEvent<HTMLImageElement>): void => {
    e.stopPropagation();
    setExpand((prev) => !prev);
  };

  return (
    <div className="flex h-screen">
      <Sidebar expand={expand} setExpand={setExpand} />
      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-12 sm:pb-8 bg-[#09090b] [#292a2d] text-white relative">
        <div className="md:hidden absolute px-4 top-6 flex items-center justify-between w-full">
          <Image
            onClick={handleToggleExpand}
            className="rotate-180 cursor-pointer"
            src={assets.menu_icon as string}
            alt="Menu"
            width={24}
            height={24}
          />
          <Image
            className="opacity-70"
            src={assets.chat_icon as string}
            alt="Chat"
            width={24}
            height={24}
          />
        </div>
        <>
          {!selectedChat ||
          !selectedChat.messages ||
          selectedChat.messages.length === 0 ? (
            <>
              <div className="flex items-center gap-3">
                <Image
                  src={assets.logo_icon as string}
                  alt="Omega Logo"
                  width={40}
                  height={40}
                  className="h-14 w-14 rounded-full"
                />
                <p className="text-3xl md:text-5xl font-serif font-bold font-sans text-shadow-white">
                  {greeting}
                </p>
              </div>
              <p className="text-xs md:text-sm text-center my-2 md:my-4 mask-b-from-neutral-50">
                {user
                  ? `Hey ${user?.firstName || ''}, How can I help you today?`
                  : `How can I help you today?`}
              </p>
            </>
          ) : (
            <>
              <div
                ref={containerRef}
                className="relative flex flex-col items-center justify-start w-full mt-20 max-h-screen overflow-y-auto"
              >
                <div
                  className={`fixed top-4 flex gap-2 ${
                    expand ? 'hidden md:left-72' : 'left-20'
                  } border border-transparent hover:border-gray-500/50 py-1 px-2 rounded-lg font-semibold mb-6 text-sm z-10 hover:bg-[#292a2d] bg-opacity-90`}
                >
                  {selectedChat.name}{' '}
                  <ChevronDown
                    size={16}
                    className={`transition-transform cursor-pointer ${
                      expand ? 'rotate-180' : ''
                    }`}
                  />
                </div>
                {selectedChat.messages.map((message, index) => (
                  <Message
                    key={message._id || index}
                    role={message.role}
                    content={message.content}
                    index={index}
                    messageId={message._id || ''}
                    expand={expand}
                    setExpand={setExpand}
                    isWriting={
                      isWriting &&
                      index === selectedChat.messages.length - 1 &&
                      message.role === 'assistant'
                    }
                    isVoiceMessage={message.isVoiceMessage}
                  />
                ))}
                {isLoading && (
                  <div className="flex gap-2 max-w-3xl w-full py-3">
                    <Image
                      className="h-10 w-10 p-1 border border-white/15 rounded-full shrink-0"
                      src={assets.logo_icon as string}
                      alt="Omega Logo"
                      width={40}
                      height={40}
                    />
                    <div className="loader flex justify-center items-center gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-white animate-bounce delay-0"></div>
                      <div className="w-1.5 h-1.5 rounded-full bg-white animate-bounce delay-100"></div>
                      <div className="w-1.5 h-1.5 rounded-full bg-white animate-bounce delay-200"></div>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </>

        <PromptBox />
        <p className="text-xs absolute bottom-5 sm:bottom-1 text-gray-500">
          Omega can make mistakes. Verify important information.
        </p>
      </div>
    </div>
  );
};

export default ChatPage;
