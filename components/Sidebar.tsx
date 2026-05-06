import { assets } from '@/assets/assets';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { IoSettingsSharp } from 'react-icons/io5';
import { useFirebaseAuth } from '@/context/FirebaseAuthContext';
import React, { useEffect, useState, MouseEvent, useRef } from 'react';
import { FaInstagram, FaDownload, FaLinkedin } from 'react-icons/fa6';
import { GrSend } from 'react-icons/gr';
import { MdLogout } from 'react-icons/md';
import ChatLabel from '@/components/ChatLabel';
import { getTranslation } from '@/lib/translations';
import { FaReddit, FaDiscord } from 'react-icons/fa';
import { useAppContext } from '@/context/AppContext';
import SettingsModal from '@/components/SettingsModal';
import toast from 'react-hot-toast';

interface Chat {
  _id: string;
  name: string;
  updatedAt: Date | string | undefined;
  messages?: any[];
}

interface OpenMenu {
  id: number | string;
  open: boolean;
}

interface GroupedChats {
  recent: Chat[];
  today: Chat[];
  yesterday: Chat[];
  previousWeek: Chat[];
  previousMonth: Chat[];
  older: Chat[];
}

interface AppContextType {
  user: any;
  chats: Chat[];
  selectedChat: Chat | null;
  createNewChat: () => Promise<void>;
  isClient: boolean;
  setSelectedChat: (chat: Chat | null) => void;
  detectedLang: string;
}

interface SidebarProps {
  expand: boolean;
  setExpand: (expand: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ expand, setExpand }) => {
  const { signOut } = useFirebaseAuth();
  const router = useRouter();
  const {
    user,
    chats,
    selectedChat,
    createNewChat,
    isClient,
    setSelectedChat,
    detectedLang,
  } = useAppContext() as AppContextType;
  const [openMenu, setOpenMenu] = useState<OpenMenu>({ id: 0, open: false });
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [groupedChats, setGroupedChats] = useState<GroupedChats>({
    recent: [],
    today: [],
    yesterday: [],
    previousWeek: [],
    previousMonth: [],
    older: [],
  });
  const userMenuRef = useRef<HTMLDivElement>(null);

  const isNewChatDisabled =
    !selectedChat ||
    (selectedChat &&
      !selectedChat._id.startsWith('temp_') &&
      (!selectedChat.messages || selectedChat.messages.length === 0));

  const handleNewChatClickWithCheck = (
    e: MouseEvent<HTMLButtonElement>,
  ): void => {
    e.stopPropagation();

    if (!selectedChat) {
      return;
    }

    handleNewChatClick(e);
  };

  useEffect(() => {
    if (chats && chats.length > 0) {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const previousWeekStart = new Date(today);
      previousWeekStart.setDate(previousWeekStart.getDate() - 7);
      const previousMonthStart = new Date(today);
      previousMonthStart.setDate(previousMonthStart.getDate() - 30);

      const grouped: GroupedChats = {
        recent: [],
        today: [],
        yesterday: [],
        previousWeek: [],
        previousMonth: [],
        older: [],
      };

      chats.forEach((chat: Chat) => {
        const chatDate = new Date(chat.updatedAt || new Date());
        if (chatDate >= oneHourAgo) {
          grouped.recent.push(chat);
        } else if (chatDate >= today) {
          grouped.today.push(chat);
        } else if (chatDate >= yesterday) {
          grouped.yesterday.push(chat);
        } else if (chatDate >= previousWeekStart) {
          grouped.previousWeek.push(chat);
        } else if (chatDate >= previousMonthStart) {
          grouped.previousMonth.push(chat);
        } else {
          grouped.older.push(chat);
        }
      });

      setGroupedChats(grouped);
    }
  }, [chats]);

  useEffect(() => {
    const handleClickOutside = (event: Event) => {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
        setShowUserMenu(false);
      }
    };

    if (showUserMenu) {
      document.addEventListener(
        'mousedown',
        handleClickOutside as EventListener,
      );
      return () => {
        document.removeEventListener(
          'mousedown',
          handleClickOutside as EventListener,
        );
      };
    }
  }, [showUserMenu]);

  const handleCreateNewChat = async (): Promise<void> => {
    await createNewChat();
  };

  const renderChatGroup = (chats: Chat[], title: string): React.ReactNode => {
    if (!chats || chats.length === 0) return null;

    return (
      <div className="mb-4">
        <p className="text-white/25 my-1 text-xs">{title}</p>
        {chats.map((chat) => (
          <ChatLabel
            key={chat._id}
            name={chat.name}
            id={chat._id}
            openMenu={openMenu}
            setOpenMenu={setOpenMenu}
          />
        ))}
      </div>
    );
  };

  const handleToggleSidebar = (e: MouseEvent<HTMLDivElement>): void => {
    e.stopPropagation();
    setExpand(!expand);
  };

  const handleNewChatClick = (e: MouseEvent<HTMLButtonElement>): void => {
    e.stopPropagation();
    router.push('/');
  };

  return (
    <div
      className={`flex flex-col border-r border-white/10 bg-[#070707] [#212327] pt-7 transition-all z-50 max-md:absolute max-md:h-screen ${
        expand ? 'p-4 w-64' : 'md:w-12 w-0 max-md:overflow-hidden'
      }`}
    >
      <div className="flex flex-col h-full">
        <div
          className={`flex mb-6 ${
            expand ? 'flex-row gap-10' : 'flex-col items-center gap-8'
          }`}
        >
          <Image
            src={
              expand
                ? (assets.logo_text as string)
                : (assets.logo_icon as string)
            }
            alt="OMG Logo"
            width={expand ? 144 : 32}
            height={32}
            className={
              expand
                ? 'w-36'
                : 'cursor-pointer h-9 w-9 hover:bg-gray-500/20 rounded-lg'
            }
            onClick={
              !expand ? (e) => handleNewChatClickWithCheck(e as any) : undefined
            }
          />
          <div
            onClick={handleToggleSidebar}
            className="group relative flex items-center justify-center hover:bg-gray-500/20 transition-all duration-300 h-9 w-9 aspect-square rounded-lg cursor-e-resize"
          >
            <Image
              src={assets.menu_icon as string}
              alt="Menu"
              width={28}
              height={28}
              className="md:hidden"
            />
            <Image
              src={
                expand
                  ? (assets.sidebar_close_icon as string)
                  : (assets.sidebar_icon as string)
              }
              alt="Sidebar Toggle"
              width={28}
              height={28}
              className="hidden md:block w-7"
            />
            <div
              className={`absolute w-max ${
                expand ? 'left-12/4 -translate-x-1/2 -top-1' : '-top-1 left-10'
              } opacity-0 group-hover:opacity-100 transition bg-black font-head font-bold border border-white/20 text-white text-sm px-3 py-2 rounded-lg shadow-lg pointer-events-none z-10`}
            >
              {expand ? 'Close sidebar' : 'Open sidebar'}
              <div
                className={`w-3 h-3 absolute bg-black rotate-45 border-white/20  ${
                  expand
                    ? 'left-0 top-3 -translate-x-1/2 border-b border-l'
                    : 'border-b border-l -left-1.5 bottom-2.5'
                }`}
              />
            </div>
          </div>
        </div>
        <button
          onClick={handleNewChatClickWithCheck}
          disabled={isNewChatDisabled}
          suppressHydrationWarning
          className={`flex items-center justify-center cursor-pointer transition-all ${
            isNewChatDisabled ? 'opacity-50 cursor-not-allowed' : ''
          } ${
            expand
              ? 'bg-primary hover:opacity-90 rounded-xl gap-2 p-2 w-max disabled:hover:opacity-50'
              : 'group relative h-9 w-9 mx-auto hover:bg-gray-500/20 rounded-lg disabled:hover:bg-transparent'
          }`}
          title={
            !selectedChat
              ? 'Login or send a message first'
              : isNewChatDisabled
                ? 'Send a message first before creating a new chat'
                : 'New Chat'
          }
        >
          <Image
            src={
              expand
                ? (assets.chat_icon as string)
                : (assets.chat_icon_dull as string)
            }
            alt="New Chat"
            width={expand ? 24 : 28}
            height={28}
            className={expand ? 'w-6' : 'w-7'}
          />
          {!expand && (
            <div className="absolute w-max -top-1 -right-26 opacity-0 group-hover:opacity-100 transition bg-black text-white font-head font-bold border border-white/20 text-sm px-3 py-2 rounded-lg shadow-lg pointer-events-none z-10">
              {!selectedChat
                ? 'Login first'
                : isNewChatDisabled
                  ? 'Send a message first'
                  : getTranslation(detectedLang, 'newChat')}
              <div className="w-3 h-3 absolute bg-black rotate-45 -left-1.5 border-b border-l border-white/20 bottom-2.5" />
            </div>
          )}
          {expand && (
            <p className="font-head font-medium text-sm">
              {getTranslation(detectedLang, 'newChat')}
            </p>
          )}
        </button>

        {expand && (
          <div className="mt-4">
            <div className="relative">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40"
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
                placeholder={getTranslation(detectedLang, 'searchChatHistory')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#121212] text-white text-sm rounded-lg pl-9 pr-3 py-2 outline-none focus:bg-[#27272a] focus:border border-white/20 transition placeholder-white/40"
              />
            </div>
          </div>
        )}

        <div
          className={`mt-8 text-sm max-h-screen overflow-y-auto ${
            expand ? 'block' : 'hidden'
          }`}
        >
          {isClient && user ? (
            chats && chats.length > 0 ? (
              <>
                {searchQuery.trim() ? (
                  <div>
                    <p className="text-white/25 my-1 text-xs">
                      {getTranslation(detectedLang, 'searchResults')}
                    </p>
                    {chats
                      .filter((chat) =>
                        chat.name
                          .toLowerCase()
                          .includes(searchQuery.toLowerCase()),
                      )
                      .sort((a, b) => {
                        const dateA = new Date(
                          a.updatedAt || new Date(),
                        ).getTime();
                        const dateB = new Date(
                          b.updatedAt || new Date(),
                        ).getTime();
                        return dateB - dateA;
                      })
                      .map((chat) => (
                        <ChatLabel
                          key={chat._id}
                          name={chat.name}
                          id={chat._id}
                          openMenu={openMenu}
                          setOpenMenu={setOpenMenu}
                        />
                      ))}
                    {chats.filter((chat) =>
                      chat.name
                        .toLowerCase()
                        .includes(searchQuery.toLowerCase()),
                    ).length === 0 && (
                      <p className="text-white/25 my-4 text-sm">
                        {getTranslation(detectedLang, 'noMatchingChats')}
                      </p>
                    )}
                  </div>
                ) : (
                  <>
                    {renderChatGroup(
                      groupedChats.recent,
                      getTranslation(detectedLang, 'recent'),
                    )}
                    {renderChatGroup(
                      groupedChats.today,
                      getTranslation(detectedLang, 'today'),
                    )}
                    {renderChatGroup(
                      groupedChats.yesterday,
                      getTranslation(detectedLang, 'yesterday'),
                    )}
                    {renderChatGroup(
                      groupedChats.previousWeek,
                      getTranslation(detectedLang, 'previousWeek'),
                    )}
                    {renderChatGroup(
                      groupedChats.previousMonth,
                      getTranslation(detectedLang, 'previousMonth'),
                    )}
                    {renderChatGroup(
                      groupedChats.older,
                      getTranslation(detectedLang, 'older'),
                    )}
                  </>
                )}
              </>
            ) : (
              <p className="text-white/25 my-4 text-sm">
                {getTranslation(detectedLang, 'noChatsYet')}
              </p>
            )
          ) : null}
        </div>

        <div className="py-2 mt-auto">
          <div
            className={`flex items-center ${
              expand
                ? 'hover:bg-gray-500/10 rounded-lg justify-between'
                : 'justify-center w-full pt-4'
            } gap-3 text-white/60 text-sm p-2`}
            onClick={!user ? () => router.push('/') : undefined}
          >
            <div
              className="flex items-center gap-3"
              onClick={() => setShowUserMenu(!showUserMenu)}
            >
              {user ? (
                <Image
                  src={user.photoURL || assets.profile_icon}
                  alt="Profile"
                  width={28}
                  height={28}
                  className="w-7 rounded-full cursor-pointer"
                />
              ) : (
                <Image
                  src={assets.profile_icon as string}
                  alt="Profile"
                  width={28}
                  height={28}
                  className="w-7 cursor-pointer"
                  onClick={() => router.push('/')}
                />
              )}
              {expand && (
                <span className="text-sm font-head cursor-pointer">
                  {user ? `${user?.displayName || ''}` : 'Login'}
                </span>
              )}
            </div>
            {expand && (
              <Image
                src={assets.three_dots as string}
                alt="Menu"
                width={20}
                height={20}
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="w-5 cursor-pointer block group-hover:block"
              />
            )}
          </div>

          {user && showUserMenu && (
            <div
              ref={userMenuRef}
              className={`absolute ${
                expand ? 'left-4 bottom-18 ' : 'left-11 bottom-4'
              } bg-[#121212] border border-gray-500/20 rounded-xl w-max p-2 z-10 shadow-lg select-none`}
            >
              <button
                onClick={() =>
                  window.open('https://omg-ai.vercel.app', '_blank')
                }
                className="w-full flex items-center gap-3 font-head text-white/80 text-sm p-3 rounded-lg hover:bg-gray-500/20 transition cursor-pointer group relative"
              >
                <FaDownload size={16} />
                <span>{getTranslation(detectedLang, 'downloadApp')}</span>
                <Image
                  src={assets.new_icon as string}
                  alt="New"
                  width={16}
                  height={16}
                />
                <div
                  className={`absolute -top-60 pb-8 opacity-0 group-hover:opacity-100 hidden md:group-hover:block transition-all`}
                >
                  <div className="relative w-max bg-black border border-gray-500/20 text-white text-sm p-3 rounded-lg shadow-lg">
                    <Image
                      src={assets.qrcode}
                      alt="QR Code"
                      width={176}
                      height={176}
                      className="w-44"
                    />
                    <p className="text-xs text-white/40 mt-2">
                      Scan to download the app
                    </p>
                    <div className="w-3 h-3 border-b border-r border-gray-500/20 absolute bg-black rotate-45 right-1/2 -translate-x-1/2 -bottom-1.5" />
                  </div>
                </div>
              </button>

              <button
                onClick={() =>
                  window.open(
                    'https://instagram.com/abhishekprajapatt',
                    '_blank',
                  )
                }
                className="w-full flex items-center gap-3 font-head text-white/80 text-sm p-3 rounded-lg hover:bg-gray-500/20 transition cursor-pointer"
              >
                <FaInstagram size={16} />
                <span>{getTranslation(detectedLang, 'instagram')}</span>
              </button>

              <button
                onClick={() =>
                  window.open(
                    'https://linkedin.com/in/abhishekprajapatt',
                    '_blank',
                  )
                }
                className="w-full flex items-center gap-3 font-head text-white/80 text-sm p-3 rounded-lg hover:bg-gray-500/20 transition cursor-pointer"
              >
                <FaLinkedin size={16} />
                <span>LinkedIn</span>
              </button>

              <button
                onClick={() =>
                  window.open('https://discord.gg/abhishekprajapatt', '_blank')
                }
                className="w-full flex items-center gap-3 font-head text-white/80 text-sm p-3 rounded-lg hover:bg-gray-500/20 transition cursor-pointer"
              >
                <FaDiscord size={16} />
                <span>Discord</span>
              </button>

              <button
                onClick={() =>
                  window.open(
                    'https://reddit.com/u/abhishekprajapatt',
                    '_blank',
                  )
                }
                className="w-full flex items-center gap-3 font-head text-white/80 text-sm p-3 rounded-lg hover:bg-gray-500/20 transition cursor-pointer"
              >
                <FaReddit size={16} />
                <span>Reddit</span>
              </button>

              <button
                onClick={() => setShowSettings(true)}
                className="w-full flex items-center gap-3 font-head text-white/80 text-sm p-3 rounded-lg hover:bg-gray-500/20 transition cursor-pointer"
              >
                <IoSettingsSharp size={16} />
                <span>{getTranslation(detectedLang, 'settingsCard')}</span>
              </button>

              <button
                onClick={() => {
                  window.location.href =
                    'mailto:visionex.app@gmail.com?subject=Contact from Omega App';
                }}
                className="w-full flex font-head items-center gap-3 text-white/80 text-sm p-3 rounded-lg hover:bg-gray-500/20 transition cursor-pointer"
              >
                <GrSend size={16} />
                <span>{getTranslation(detectedLang, 'contactUs')}</span>
              </button>

              <button
                onClick={async () => {
                  try {
                    await signOut();
                    router.push('/');
                  } catch (error) {
                    toast.error('Failed to logout');
                    console.error('Logout error:', error);
                  }
                }}
                className="w-full flex items-center gap-3 font-head text-white/80 text-sm p-3 rounded-lg hover:bg-red-500/20 transition cursor-pointer"
              >
                <MdLogout size={16} />
                <span>{getTranslation(detectedLang, 'logoutButton')}</span>
              </button>
              <div
                className={`bg-[#121212]  border-gray-500/20 absolute rotate-45 -translate-x-1/2 ${
                  expand ? 'w-3 h-3 border-b border-r left-5 -bottom-1.5 ' : 'w-2.5 h-2.5 border-b border-l left-0 bottom-2'
                }`}
              />
            </div>
          )}

          {showSettings && (
            <SettingsModal
              isOpen={showSettings}
              onClose={() => setShowSettings(false)}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
