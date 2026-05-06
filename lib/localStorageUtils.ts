const TEMP_CHATS_KEY = 'omg_ai_temp_chats';
const SELECTED_CHAT_ID_KEY = 'omg_ai_selected_chat_id';

interface StoredChat {
  _id: string;
  name: string;
  messages: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: number;
    _id?: string;
  }>;
  userId?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export const getTempChats = (): StoredChat[] => {
  try {
    const stored = localStorage.getItem(TEMP_CHATS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error reading temp chats from localStorage:', error);
    return [];
  }
};

export const saveTempChat = (chat: StoredChat): void => {
  try {
    const chats = getTempChats();
    const index = chats.findIndex((c) => c._id === chat._id);

    if (index >= 0) {
      chats[index] = chat;
    } else {
      chats.unshift(chat);
    }

    localStorage.setItem(TEMP_CHATS_KEY, JSON.stringify(chats));
  } catch (error) {
    console.error('Error saving temp chat to localStorage:', error);
  }
};

export const deleteTempChat = (chatId: string): void => {
  try {
    const chats = getTempChats();
    const filtered = chats.filter((c) => c._id !== chatId);
    localStorage.setItem(TEMP_CHATS_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Error deleting temp chat from localStorage:', error);
  }
};

export const clearTempChats = (): void => {
  try {
    localStorage.removeItem(TEMP_CHATS_KEY);
    localStorage.removeItem(SELECTED_CHAT_ID_KEY);
  } catch (error) {
    console.error('Error clearing temp chats from localStorage:', error);
  }
};

export const getSelectedChatId = (): string | null => {
  try {
    return localStorage.getItem(SELECTED_CHAT_ID_KEY);
  } catch (error) {
    console.error('Error reading selected chat ID from localStorage:', error);
    return null;
  }
};

export const setSelectedChatId = (chatId: string | null): void => {
  try {
    if (chatId) {
      localStorage.setItem(SELECTED_CHAT_ID_KEY, chatId);
    } else {
      localStorage.removeItem(SELECTED_CHAT_ID_KEY);
    }
  } catch (error) {
    console.error('Error saving selected chat ID to localStorage:', error);
  }
};
