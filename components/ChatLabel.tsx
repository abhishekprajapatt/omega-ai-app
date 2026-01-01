import Image from 'next/image';
import toast from 'react-hot-toast';
import { Loader2 } from 'lucide-react';
import { assets } from '@/assets/assets';
import { useRouter } from 'next/navigation';
import axios, { AxiosResponse } from 'axios';
import { useAppContext } from '@/context/AppContext';
import React, { useState, useEffect, useRef } from 'react';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  _id?: string;
  id?: string;
}

interface Chat {
  _id: string;
  name: string;
  messages: ChatMessage[];
  userId: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface ApiResponse {
  success: boolean;
  message: string;
}

interface OpenMenu {
  id: string | number;
  open: boolean;
}

interface ChatLabelProps {
  id: string;
  name: string;
  openMenu: OpenMenu;
  setOpenMenu: (menu: OpenMenu) => void;
}

const ChatLabel: React.FC<ChatLabelProps> = ({
  id,
  name,
  openMenu,
  setOpenMenu,
}) => {
  const router = useRouter();
  const {
    fetchUserChats,
    chats,
    setSelectedChat,
    selectedChat,
    generateChatTitle,
    renamingChatId,
    setRenamingChatId,
  } = useAppContext();
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [showRenameModal, setShowRenameModal] = useState<boolean>(false);
  const [renameInput, setRenameInput] = useState<string>(name);
  const isSelected = selectedChat && selectedChat._id === id;
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const autoGenerateTitle = async (): Promise<void> => {
      if (name === 'New Chat') {
        const chatData: Chat | undefined = chats.find(
          (chat: Chat) => chat._id === id
        );

        if (chatData && chatData.messages && chatData.messages.length > 0) {
          const userMessage: ChatMessage | undefined = chatData.messages.find(
            (msg: ChatMessage) => msg.role === 'user'
          );

          if (userMessage && userMessage.content) {
            await generateChatTitle(id, userMessage.content);
          }
        }
      }
    };

    autoGenerateTitle();
  }, [id, name, chats, generateChatTitle]);

  useEffect(() => {
    const handleClickOutside = (event: Event): void => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        openMenu.id === id &&
        openMenu.open
      ) {
        setOpenMenu({ id: 0, open: false });
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openMenu, id, setOpenMenu]);

  const selectChat = (e: React.MouseEvent<HTMLDivElement>): void => {
    e.preventDefault();
    const chatData: Chat | undefined = chats.find(
      (chat: Chat) => chat._id === id
    );
    if (chatData) {
      setSelectedChat(chatData);
      router.push(`/c/${id}`);
    }
    console.log(chatData);
  };

  const renameHandler = async (): Promise<void> => {
    try {
      const response: AxiosResponse<ApiResponse> = await axios.post(
        '/api/chat/rename',
        {
          chatId: id,
          name: renameInput,
        }
      );
      const { data } = response;
      if (data.success) {
        fetchUserChats();
        setOpenMenu({ id: 0, open: false });
        toast.success(data.message || 'Chat renamed successfully');
      } else {
        toast.error(data.message || 'Failed to rename chat');
      }
    } catch (error: any) {
      toast.error(
        error.response?.data?.error || error.message || 'Rename failed'
      );
    } finally {
      setShowRenameModal(false);
    }
  };

  const deleteHandler = async (): Promise<void> => {
    try {
      const response: AxiosResponse<ApiResponse> = await axios.post(
        '/api/chat/delete',
        { chatId: id }
      );
      const { data } = response;
      if (data.success) {
        fetchUserChats();
        setOpenMenu({ id: 0, open: false });
        toast.success(data.message || 'Chat deleted successfully');
      } else {
        toast.error(data.message || 'Failed to delete chat');
      }
    } catch (error: any) {
      toast.error(
        error.response?.data?.error || error.message || 'Delete failed'
      );
    } finally {
      setShowDeleteModal(false);
    }
  };

  useEffect(() => {
    document.title = selectedChat?.name || 'Omega';
  }, [selectedChat]);

  return (
    <>
      <div
        onClick={selectChat}
        className={`flex items-center justify-between my-1 py-1 px-2 text-white/80 hover:bg-white/5 ${
          isSelected && 'bg-[#27272a]'
        } rounded-lg text-sm group cursor-pointer`}
      >
        <p className="group-hover:max-w-5/6 truncate">{name}</p>
        {renamingChatId === id ? (
          <div className="flex flex-col items-center justify-center font-bold text-white">
            <Loader2 className="animate-spin w-4 h-4 text-blue-600" />
          </div>
        ) : (
          <div
            ref={menuRef}
            onClick={(e: React.MouseEvent<HTMLDivElement>) => {
              e.stopPropagation();
              setOpenMenu({ id: id, open: !openMenu.open });
            }}
            className="group relative flex items-center justify-center h-6 w-6 aspect-square hover:bg-black/180 rounded-lg"
          >
            <Image
              src={assets.three_dots as string}
              alt="Menu"
              width={20}
              height={20}
              className={`w-5 ${
                openMenu.id === id && openMenu.open ? 'block' : 'hidden'
              } group-hover:block`}
            />
            {openMenu.id === id && openMenu.open && (
              <div className="absolute top-8 right-0 bg-[#121212] rounded-xl w-max p-2 z-10 shadow-lg shadow-[#2a2929]">
                <div
                  onClick={() => setShowRenameModal(true)}
                  className="flex items-center gap-3 hover:bg-white/10 cursor-pointer px-3 py-2 rounded-lg"
                >
                  <Image
                    src={assets.pencil_icon as string}
                    alt="Rename"
                    width={16}
                    height={16}
                    className="w-4"
                  />
                  <p className="text-white text-sm">Rename</p>
                </div>
                <div
                  onClick={() => setShowDeleteModal(true)}
                  className="flex items-center gap-3 hover:bg-white/10 cursor-pointer px-3 py-2 rounded-lg"
                >
                  <Image
                    src={assets.delete_icon as string}
                    alt="Delete"
                    width={16}
                    height={16}
                    className="w-4"
                  />
                  <p className="text-white text-sm">Delete</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Delete Modal */}
      {showDeleteModal && (
        <div
          onClick={() => setShowDeleteModal(false)}
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4"
        >
          <div
            onClick={(e: React.MouseEvent<HTMLDivElement>) =>
              e.stopPropagation()
            }
            className="flex flex-col gap-6 bg-[#1e1e1e] p-6 rounded-xl w-full max-w-md shadow-lg text-white"
          >
            <h2 className="text-xl font-semibold border-b border-white/10 pb-2">
              Delete chat?
            </h2>
            <p className="mb-6">
              This will delete <span className="font-bold">{name}</span>.
            </p>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="bg-gray-700 hover:bg-gray-600 cursor-pointer px-4 py-2 rounded-lg text-white"
              >
                Cancel
              </button>
              <button
                onClick={deleteHandler}
                className="bg-red-800 hover:bg-red-700 px-4 py-2 cursor-pointer rounded-lg border-2 border-red-800 text-white"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rename Modal */}
      {showRenameModal && (
        <div
          onClick={() => setShowRenameModal(false)}
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4"
        >
          <div
            onClick={(e: React.MouseEvent<HTMLDivElement>) =>
              e.stopPropagation()
            }
            className="flex flex-col gap-6 bg-[#1e1e1e] p-6 rounded-xl w-full max-w-md shadow-lg text-white"
          >
            <h2 className="text-xl font-semibold border-b border-white/10 pb-2">
              Rename chat
            </h2>
            <textarea
              value={renameInput}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setRenameInput(e.target.value)
              }
              className="w-full px-4 py-2 text-white border border-white/20 rounded-lg mb-6 outline-none resize-none"
              rows={3}
              placeholder="Enter new name"
            />
            <div className="flex justify-end gap-4">
              <button
                onClick={() => {
                  setShowRenameModal(false);
                  setRenameInput(name);
                }}
                className="bg-gray-700 hover:bg-gray-600 cursor-pointer px-4 py-2 rounded-lg text-white"
              >
                Cancel
              </button>
              <button
                onClick={renameHandler}
                className="bg-blue-800 hover:bg-blue-700 px-4 py-2 cursor-pointer rounded-lg border-2 border-blue-800 text-white disabled:opacity-50"
                disabled={!renameInput.trim()}
              >
                Rename
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatLabel;
