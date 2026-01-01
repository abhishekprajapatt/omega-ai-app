'use client';
import Image from 'next/image';
import { assets } from '@/assets/assets';
import { useClerk } from '@clerk/nextjs';
import Sidebar from '@/components/Sidebar';
import PromptBox from '@/components/PromptBox';
import Message from '@/components/Message';
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
}

interface SelectedChat {
  _id?: string;
  name: string;
  messages: MessageType[];
}

interface AppContextType {
  selectedChat: SelectedChat | null;
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

const Home: React.FC = () => {
  const [expand, setExpand] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [greeting, setGreeting] = useState<string>('');
  const [welcomeMessage, setWelcomeMessage] = useState<string>('');

  const {
    selectedChat,
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

    // Morning greetings (5-12)
    const morningGreetings = [
      'Rise & Grind 🚀',
      'Good Morning, Dev! ☀️',
      'Time to Code 💻',
      "Let's Build Something 🏗️",
      'Morning Motivation 💪',
      'Seize the Day 🎯',
      'Coffee & Code ☕',
    ];

    // Afternoon greetings (12-17)
    const afternoonGreetings = [
      "Let's Ship It ⚡",
      'Afternoon Push 💯',
      'Keep the Momentum 🔥',
      'Crushing It 🎪',
      'Peak Productivity Hours 📈',
      'Making Progress 🛠️',
      'Afternoon Grind 💪',
    ];

    // Evening greetings (17-21)
    const eveningGreetings = [
      'Evening Mode Activated 🌃',
      'Sunset Code Session 🌅',
      'Evening Hustle 🌙',
      'Night Vision Engaged 👓',
      'Second Wind Time ⚡',
      'After Hours Coding 🎸',
      'Evening Flow State 🌊',
    ];

    // Night greetings (21-5)
    const nightGreetings = [
      'Night Owl Energy 🦉',
      'Deep Work Mode 🌌',
      'Midnight Hacker Vibes 🕵️',
      'Night Mode Unlocked 🌙',
      'The Hour of Code ⏰',
      'Late Night Grind 🔌',
      'Nocturnal Developer 🌃',
    ];

    let greetings = [];
    if (hours >= 5 && hours < 12) {
      greetings = morningGreetings;
    } else if (hours >= 12 && hours < 17) {
      greetings = afternoonGreetings;
    } else if (hours >= 17 && hours < 21) {
      greetings = eveningGreetings;
    } else {
      greetings = nightGreetings;
    }

    const randomIndex = Math.floor(Math.random() * greetings.length);
    return greetings[randomIndex];
  }, []);

  const getWelcomeMessage = useCallback((): string => {
    const userWelcomes = [
      "Welcome, {name}! Let's elevate your ideas. 🚀",
      'Hey {name}! Ready to build something amazing? 💡',
      'Welcome back, {name}! Time to create magic ✨',
      "{name}! Let's turn ideas into reality 🎯",
      "Great to see you, {name}! Let's code it up 💻",
      'Welcome, {name}! Your next big idea starts here 🌟',
      "Hey {name}! Excited to see what we'll build 🔥",
      'Welcome, {name}! Innovation mode: ON 🎪',
    ];

    const guestWelcomes = [
      'How can I help you today? 🤔',
      "Let's create something together! 🚀",
      'Ready to explore the possibilities? 💭',
      "What's on your mind? Let's dive in! 🌊",
      "Got an idea? Let's make it happen! 💡",
      'Welcome! What can I build for you? 🛠️',
      "Let's collaborate and create! 🎨",
      "Your journey starts here. Let's go! ⚡",
    ];

    const messageArray = user ? userWelcomes : guestWelcomes;
    const randomIndex = Math.floor(Math.random() * messageArray.length);
    let message = messageArray[randomIndex];

    if (user) {
      message = message.replace('{name}', user?.firstName || 'Developer');
    }

    return message;
  }, [user]);

  useEffect(() => {
    setGreeting(getGreeting());
    setWelcomeMessage(getWelcomeMessage());
  }, [user, getGreeting, getWelcomeMessage]);

  useEffect(() => {
    setSelectedChat(null);
  }, [setSelectedChat]);

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

        {!selectedChat || selectedChat.messages.length === 0 ? (
          // Welcome Screen
          <>
            <div className="flex items-center gap-3">
              <Image
                src={assets.logo_icon as string}
                alt="Omega Logo"
                width={40}
                height={40}
                className="h-14 w-14 rounded-full"
              />
              <p className="text-xl md:text-4xl font-head font-black text-shadow-white">
                {greeting}
              </p>
            </div>
            <p className="text-xs md:text-sm font-head text-center my-2 md:my-4 mask-b-from-neutral-50">
              {welcomeMessage}
            </p>
          </>
        ) : (
          // Messages Screen
          <div
            ref={containerRef}
            className="w-full flex-1 overflow-y-auto mb-6 flex flex-col gap-4 scrollbar-hide"
          >
            {selectedChat.messages.map((message, index) => (
              <Message
                key={index}
                role={message.role}
                content={message.content}
                index={index}
                messageId={message._id || `msg-${index}`}
                isWriting={isWriting}
                expand={expand}
                setExpand={setExpand}
              />
            ))}
          </div>
        )}

        <PromptBox />
        <p className="text-xs absolute bottom-5 sm:bottom-1 font-head text-gray-500">
          Omega can make mistakes. Verify important information.
        </p>
      </div>
    </div>
  );
};

export default Home;
