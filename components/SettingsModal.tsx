'use client';
import Image from 'next/image';
import { X } from 'lucide-react';
import toast from 'react-hot-toast';
import { CgProfile } from 'react-icons/cg';
import { FiFileText } from 'react-icons/fi';
import { useClerk, useUser } from '@clerk/nextjs';
import { RxMixerHorizontal } from 'react-icons/rx';
import { BsDatabaseFillGear } from 'react-icons/bs';
import { useAppContext } from '@/context/AppContext';
import { getTranslation } from '@/lib/translations';
import React, { useState, useRef, useEffect } from 'react';

interface Language {
  code: string;
  name: string;
  nativeName: string;
}

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<
    'general' | 'profile' | 'data' | 'about'
  >('general');
  const [isLanguageOpen, setIsLanguageOpen] = useState(false);
  const [languageSearch, setLanguageSearch] = useState('');
  const languageMenuRef = useRef<HTMLDivElement>(null);
  const { user } = useUser();
  const { signOut } = useClerk();
  const { detectedLang, setDetectedLang } = useAppContext() as any;

  const languages: Language[] = [
    { code: 'ar', name: 'Arabic', nativeName: 'العربية' },
    { code: 'bn', name: 'Bengali', nativeName: 'বাংলা' },
    { code: 'cs', name: 'Czech', nativeName: 'Čestina' },
    { code: 'de', name: 'German', nativeName: 'Deutsch' },
    { code: 'en', name: 'English', nativeName: 'English' },
    { code: 'es', name: 'Spanish', nativeName: 'Español' },
    { code: 'fa', name: 'Persian', nativeName: 'فارسی' },
    { code: 'fil', name: 'Filipino', nativeName: 'Filipino' },
    { code: 'fr', name: 'French', nativeName: 'Français' },
    { code: 'hi', name: 'Hindi', nativeName: 'हिंदी' },
    { code: 'hu', name: 'Hungarian', nativeName: 'Magyar' },
    { code: 'id', name: 'Indonesian', nativeName: 'Bahasa Indonesia' },
    { code: 'it', name: 'Italian', nativeName: 'Italiano' },
    { code: 'ja', name: 'Japanese', nativeName: '日本語' },
    { code: 'ko', name: 'Korean', nativeName: '한국어' },
    { code: 'mr', name: 'Marathi', nativeName: 'मराठी' },
    { code: 'nl', name: 'Dutch', nativeName: 'Nederlands' },
    { code: 'pl', name: 'Polish', nativeName: 'Polski' },
    { code: 'pt', name: 'Portuguese', nativeName: 'Português' },
    { code: 'ro', name: 'Romanian', nativeName: 'Română' },
    { code: 'ru', name: 'Russian', nativeName: 'Русский' },
    { code: 'sv', name: 'Swedish', nativeName: 'Svenska' },
    { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்' },
    { code: 'te', name: 'Telugu', nativeName: 'తెలుగు' },
    { code: 'tr', name: 'Turkish', nativeName: 'Türkçe' },
    { code: 'uk', name: 'Ukrainian', nativeName: 'Українська мова' },
    { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt' },
    { code: 'zh-cn', name: 'Simplified Chinese', nativeName: '简体中文' },
    { code: 'zh-tw', name: 'Traditional Chinese', nativeName: '繁體中文' },
  ];

  useEffect(() => {
    const handleClickOutside = (event: Event) => {
      const target = event.target as HTMLElement;
      if (
        languageMenuRef.current &&
        !languageMenuRef.current.contains(target)
      ) {
        setIsLanguageOpen(false);
      }
    };

    if (isLanguageOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isLanguageOpen]);

  if (!isOpen) return null;

  const handleExportData = async () => {
    try {
      const response = await fetch('/api/user/export-data');
      if (!response.ok) {
        throw new Error('Failed to fetch export data');
      }
      const { data } = await response.json();

      const dataStr = JSON.stringify(data, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `omega-data-${Date.now()}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success('Data exported successfully!');
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Failed to export data');
    }
  };

  const handleDeleteAllChats = async () => {
    if (
      window.confirm(
        'Are you sure you want to delete ALL your chats? This action cannot be undone.'
      )
    ) {
      try {
        const response = await fetch('/api/user/delete-all-chats', {
          method: 'DELETE',
        });
        if (!response.ok) {
          throw new Error('Failed to delete chats');
        }
        const { message, deletedCount } = await response.json();
        toast.success(`Deleted ${deletedCount} conversation(s)`);
      } catch (error: any) {
        console.error('Delete failed:', error);
        toast.error(error.message || 'Failed to delete chats');
      }
    }
  };

  const handleDeleteAccount = async () => {
    if (
      window.confirm(
        'Are you sure you want to delete your account? This action cannot be undone.'
      )
    ) {
      try {
        await signOut({ redirectUrl: '/' });
        toast.success('Account deleted successfully');
      } catch (error) {
        toast.error('Failed to delete account');
      }
    }
  };

  const handleLogoutAllDevices = () => {
    signOut({ redirectUrl: '/' });
    toast.success('Logged out from all devices');
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-[#09090b] rounded-2xl max-w-2xl w-full max-h-[90vh] border border-white/10">
        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between px-4 py-2">
          <h2 className="text-2xl font-bold font-head text-white">
            {getTranslation(detectedLang, 'settings')}
          </h2>
          <button
            onClick={onClose}
            title="Close settings modal"
            className="p-2 hover:bg-white/10 rounded-lg transition"
          >
            <X size={24} className="text-white" />
          </button>
        </div>

        <div className="flex h-full">
          {/* Sidebar Tabs */}
          <div className="px-2 md:w-48 md:p-4 flex flex-col gap-2">
            <button
              onClick={() => setActiveTab('general')}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition ${
                activeTab === 'general'
                  ? 'bg-gray-500/30 text-white'
                  : 'text-white/60 hover:bg-gray-500/10'
              }`}
            >
              <RxMixerHorizontal size={20} />
              <span className="font-head text-sm">
                {getTranslation(detectedLang, 'general')}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('profile')}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition ${
                activeTab === 'profile'
                  ? 'bg-gray-500/30 text-white'
                  : 'text-white/60 hover:bg-gray-500/10'
              }`}
            >
              {user?.imageUrl ? (
                <Image
                  src={user.imageUrl}
                  alt="User profile"
                  width={24}
                  height={24}
                  className="rounded-full"
                />
              ) : (
                <CgProfile size={20} />
              )}
              <span className="font-head text-sm">
                {getTranslation(detectedLang, 'profile')}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('data')}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition ${
                activeTab === 'data'
                  ? 'bg-gray-500/30 text-white'
                  : 'text-white/60 hover:bg-gray-500/10'
              }`}
            >
              <BsDatabaseFillGear size={20} />
              <span className="font-head text-sm">
                {getTranslation(detectedLang, 'data')}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('about')}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition ${
                activeTab === 'about'
                  ? 'bg-gray-500/30 text-white'
                  : 'text-white/60 hover:bg-gray-500/10'
              }`}
            >
              <FiFileText size={20} />
              <span className="text-sm font-head">
                {getTranslation(detectedLang, 'about')}
              </span>
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 p-6 w-full max-h-[68vh] overflow-y-auto">
            {/* General Tab */}
            {activeTab === 'general' && (
              <div className="space-y-4">
                <h3 className="text-md md:text-lg font-head font-semibold text-white mb-4">
                  {getTranslation(detectedLang, 'generalSettings')}
                </h3>
                <div className="space-y-3">
                  <label className="flex items-center justify-between">
                    <span className="text-white/80 font-head">
                      {getTranslation(detectedLang, 'improveModel')}
                    </span>
                    <input
                      type="checkbox"
                      defaultChecked
                      className="w-5 h-5 rounded cursor-pointer"
                    />
                  </label>
                  <p className="text-xs md:text-sm font-head text-white/60">
                    {getTranslation(detectedLang, 'improveModelDesc')}
                  </p>
                </div>

                <div className="mt-6 pt-6 border-t border-white/10 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-white font-head font-medium">
                        {getTranslation(detectedLang, 'sharedLinks')}
                      </h4>
                      <p className="text-xs md:text-sm font-head text-white/60">
                        {getTranslation(detectedLang, 'manageSharedChats')}
                      </p>
                    </div>
                    <button className="px-4 py-2 text-xs md:text-sm border font-head border-white/20 rounded-lg hover:bg-white/10 transition text-white">
                      {getTranslation(detectedLang, 'manage')}
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-white font-head font-medium">
                        {getTranslation(detectedLang, 'exportData')}
                      </h4>
                      <p className="text-xs md:text-sm font-head text-white/60">
                        {getTranslation(detectedLang, 'exportDataDesc')}
                      </p>
                    </div>
                    <button
                      onClick={handleExportData}
                      className="px-4 py-2 text-xs md:text-sm border border-white/20 rounded-lg hover:bg-white/10 transition text-white whitespace-nowrap"
                    >
                      {getTranslation(detectedLang, 'export')}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <h3 className="text-md md:text-lg font-head font-semibold text-white mb-4">
                  {getTranslation(detectedLang, 'profileSettings')}
                </h3>

                <div className="flex items-center gap-4">
                  {user?.imageUrl && (
                    <Image
                      src={user.imageUrl}
                      alt="User profile"
                      width={64}
                      height={64}
                      className="w-12 h-12 md:w-16 md:h-16 rounded-full"
                    />
                  )}
                  <div>
                    <p className="text-xs md:text-sm text-white/60"></p>
                    <p className="text-md md:text-lg text-white font-head font-medium">
                      {user?.fullName || 'N/A'}
                    </p>
                    <p className="text-xs md:text-sm text-white/60">
                      {user?.primaryEmailAddress?.emailAddress || 'No email'}
                    </p>
                  </div>
                </div>

                <div className="border-t border-white/10">
                  <div className="flex items-center justify-between py-4">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🌐</span>
                      <div>
                        <p className="text-white font-head font-medium">
                          {getTranslation(detectedLang, 'language')}
                        </p>
                        <p className="text-xs md:text-sm text-white/60 font-head">
                          {languages.find((l) => l.code === detectedLang)
                            ?.name || 'English'}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setIsLanguageOpen(!isLanguageOpen)}
                      className="px-4 py-2 text-xs md:text-sm border cursor-pointer border-white/20 font-head rounded-full hover:bg-white/10 transition text-white whitespace-nowrap"
                    >
                      {getTranslation(detectedLang, 'change')}
                    </button>
                  </div>

                  {/* Language Dropdown */}
                  {isLanguageOpen && (
                    <div
                      ref={languageMenuRef}
                      className="mt-3 bg-[#1e1e1e] border border-white/10 rounded-lg shadow-lg z-50 overflow-hidden"
                    >
                      <div className="p-3 border-b border-white/10">
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
                            placeholder="Search language"
                            value={languageSearch}
                            onChange={(e) => setLanguageSearch(e.target.value)}
                            className="w-full text-white text-sm rounded-lg pl-10 pr-3 py-2 bg-white/5 outline-none focus:bg-white/10 border border-white/10 focus:border-white/20 transition placeholder-white/40"
                          />
                        </div>
                      </div>

                      <div className="max-h-72 overflow-y-auto p-2">
                        {languages
                          .filter(
                            (lang) =>
                              lang.name
                                .toLowerCase()
                                .includes(languageSearch.toLowerCase()) ||
                              lang.nativeName
                                .toLowerCase()
                                .includes(languageSearch.toLowerCase())
                          )
                          .map((lang) => (
                            <button
                              key={lang.code}
                              type="button"
                              onClick={() => {
                                setDetectedLang(lang.code);
                                setIsLanguageOpen(false);
                                setLanguageSearch('');
                                toast.success(
                                  `Language changed to ${lang.name}`
                                );
                              }}
                              className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-md text-left text-sm transition ${
                                detectedLang === lang.code
                                  ? 'bg-white/10 text-white'
                                  : 'text-white/80 hover:bg-white/5'
                              }`}
                            >
                              <span>{lang.nativeName}</span>
                              <span className="text-white/60">{lang.name}</span>
                              {detectedLang === lang.code && (
                                <span className="text-primary">✓</span>
                              )}
                            </button>
                          ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="border-t border-white/10 space-y-3">
                  <div className="flex items-center justify-between py-4">
                    <p className="text-white font-medium  font-head">
                      {getTranslation(detectedLang, 'logOutAllDevices')}
                    </p>
                    <button
                      onClick={handleLogoutAllDevices}
                      className="px-4 py-2 text-xs md:text-sm border cursor-pointer font-head border-white/20 rounded-full hover:bg-white/10 transition text-white whitespace-nowrap"
                    >
                      {getTranslation(detectedLang, 'logOut')}
                    </button>
                  </div>

                  <div className="flex items-center justify-between py-4 border-t border-white/10">
                    <p className="text-white font-medium font-head">
                      {getTranslation(detectedLang, 'deleteAccount')}
                    </p>
                    <button
                      onClick={handleDeleteAccount}
                      className="px-4 py-2 text-xs md:text-sm border cursor-pointer font-head border-red-500/50 rounded-full hover:bg-red-500/20 transition text-red-400 whitespace-nowrap"
                    >
                      {getTranslation(detectedLang, 'delete')}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Data Tab */}
            {activeTab === 'data' && (
              <div className="space-y-6">
                <h3 className=" text-lg md:text-xl font-head font-semibold text-white mb-4">
                  {getTranslation(detectedLang, 'dataPrivacy')}
                </h3>

                <div className="space-y-4">
                  <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                    <p className="text-xs md:text-sm font-head text-blue-200">
                      {getTranslation(detectedLang, 'dataEncrypted')}
                    </p>
                  </div>

                  <div className="flex items-center justify-between py-4 border-b border-white/10">
                    <div>
                      <h4 className="text-white font-head font-medium">
                        {getTranslation(detectedLang, 'deleteAllChats')}
                      </h4>
                      <p className="text-xs md:text-sm font-head text-white/60">
                        {getTranslation(detectedLang, 'deleteAllChatsDesc')}
                      </p>
                    </div>
                    <button
                      onClick={handleDeleteAllChats}
                      className="px-6 py-2 text-xs md:text-sm border font-head cursor-pointer border-red-500/50 rounded-full hover:bg-red-500/20 transition text-red-400 font-medium whitespace-nowrap"
                    >
                      {getTranslation(detectedLang, 'deleteAll')}
                    </button>
                  </div>

                  <div className="flex items-center justify-between py-4">
                    <div>
                      <h4 className="text-white font-head font-medium">
                        {getTranslation(detectedLang, 'exportAllData')}
                      </h4>
                      <p className="text-xs md:text-sm font-head text-white/60">
                        {getTranslation(detectedLang, 'exportAllDataDesc')}
                      </p>
                    </div>
                    <button
                      onClick={handleExportData}
                      className="px-6 py-2 text-xs md:text-sm border font-head cursor-pointer border-white/20 rounded-full hover:bg-white/10 transition text-white font-medium whitespace-nowrap"
                    >
                      {getTranslation(detectedLang, 'export')}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* About Tab */}
            {activeTab === 'about' && (
              <div className="space-y-6">
                <h3 className="text-md md:text-lg font-semibold font-head text-white mb-4">
                  {getTranslation(detectedLang, 'about')}
                </h3>

                <div className="space-y-6">
                  <div>
                    <h4 className="text-white font-head font-medium mb-2">
                      {getTranslation(detectedLang, 'termsOfUse')}
                    </h4>
                    <div className="text-xs md:text-sm font-head text-white/70 space-y-2 max-h-40 overflow-y-auto bg-white/5 p-4 rounded-lg border border-white/10">
                      <p>{getTranslation(detectedLang, 'termsContent1')}</p>
                      <p>{getTranslation(detectedLang, 'termsContent2')}</p>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-white font-head font-medium mb-2">
                      {getTranslation(detectedLang, 'privacyPolicy')}
                    </h4>
                    <div className="text-xs md:text-sm font-head text-white/70 space-y-2 max-h-40 overflow-y-auto bg-white/5 p-4 rounded-lg border border-white/10">
                      <p>{getTranslation(detectedLang, 'privacyContent1')}</p>
                      <p>{getTranslation(detectedLang, 'privacyContent2')}</p>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-white font-head font-medium mb-2">
                      {getTranslation(detectedLang, 'aboutOmega')}
                    </h4>
                    <p className="text-xs md:text-sm font-head text-white/70">
                      {getTranslation(detectedLang, 'aboutOmegaContent')}
                    </p>
                    <p className="text-xs md:text-sm font-head text-white/50 mt-2">
                      {getTranslation(detectedLang, 'version')}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
