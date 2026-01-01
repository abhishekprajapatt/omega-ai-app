'use client';
import Link from 'next/link';
import { X } from 'lucide-react';
import { useState, useEffect } from 'react';

interface CookiePreferences {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
}

const setCookie = (name: string, value: string, days: number = 365): void => {
  try {
    const expires = new Date();
    expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
    const cookieString = `${name}=${encodeURIComponent(
      value
    )};expires=${expires.toUTCString()};path=/;SameSite=Strict`;
    document.cookie = cookieString;
  } catch (error) {
    console.error('Error setting cookie:', error);
  }
};

const getCookie = (name: string): string | null => {
  try {
    if (typeof document === 'undefined') return null;
    const nameEQ = name + '=';
    const cookies = document.cookie.split(';');
    for (let cookie of cookies) {
      cookie = cookie.trim();
      if (cookie.indexOf(nameEQ) === 0) {
        return decodeURIComponent(cookie.substring(nameEQ.length));
      }
    }
  } catch (error) {
    console.error('Error getting cookie:', error);
  }
  return null;
};

const initializeAnalytics = (enabled: boolean): void => {
  if (typeof window === 'undefined') return;

  if (enabled) {
    setCookie('_ga_enabled', 'true', 365);
    console.log('[Analytics] User tracking enabled');
    if ((window as any).gtag) {
      (window as any).gtag('event', 'page_view');
    }
  } else {
    setCookie('_ga_enabled', 'false', 365);
    console.log('[Analytics] User tracking disabled');
    if ((window as any).gtag) {
      (window as any).gtag('consent', 'update', {
        analytics_storage: 'denied',
      });
    }
  }
};

const initializeMarketing = (enabled: boolean): void => {
  if (typeof window === 'undefined') return;

  if (enabled) {
    setCookie('_marketing_enabled', 'true', 365);
    console.log('[Marketing] Ad tracking enabled');
    if ((window as any).gtag) {
      (window as any).gtag('consent', 'update', {
        ad_storage: 'granted',
        ad_user_data: 'granted',
        ad_personalization: 'granted',
      });
    }
  } else {
    setCookie('_marketing_enabled', 'false', 365);
    console.log('[Marketing] Ad tracking disabled');
    if ((window as any).gtag) {
      (window as any).gtag('consent', 'update', {
        ad_storage: 'denied',
        ad_user_data: 'denied',
        ad_personalization: 'denied',
      });
    }
  }
};

const CookieConsent: React.FC = () => {
  const [showConsent, setShowConsent] = useState<boolean>(false);
  const [showCustomize, setShowCustomize] = useState<boolean>(false);
  const [isClient, setIsClient] = useState<boolean>(false);
  const [preferences, setPreferences] = useState<CookiePreferences>({
    necessary: true,
    analytics: false,
    marketing: false,
  });

  useEffect(() => {
    setIsClient(true);

    const cookieConsent = getCookie('cookieConsent');
    const cookiePrefs = getCookie('cookiePreferences');

    if (!cookieConsent) {
      setShowConsent(true);
    } else if (cookiePrefs) {
      try {
        const prefs = JSON.parse(cookiePrefs);
        setPreferences(prefs);
        initializeAnalytics(prefs.analytics);
        initializeMarketing(prefs.marketing);
      } catch (error) {
        console.error('Error parsing cookie preferences:', error);
      }
    }
  }, []);

  const handleAcceptAll = (): void => {
    const allAccepted: CookiePreferences = {
      necessary: true,
      analytics: true,
      marketing: true,
    };

    setCookie('cookieConsent', 'accepted', 365);
    setCookie('cookiePreferences', JSON.stringify(allAccepted), 365);

    initializeAnalytics(true);
    initializeMarketing(true);

    setPreferences(allAccepted);
    setShowConsent(false);
    setShowCustomize(false);

    console.log('[CookieConsent] All cookies accepted');
  };

  const handleRejectAll = (): void => {
    const allRejected: CookiePreferences = {
      necessary: true,
      analytics: false,
      marketing: false,
    };

    setCookie('cookieConsent', 'rejected', 365);
    setCookie('cookiePreferences', JSON.stringify(allRejected), 365);

    initializeAnalytics(false);
    initializeMarketing(false);

    setPreferences(allRejected);
    setShowConsent(false);
    setShowCustomize(false);

    console.log('[CookieConsent] All cookies rejected');
  };

  const handleSavePreferences = (): void => {
    setCookie('cookieConsent', 'customized', 365);
    setCookie('cookiePreferences', JSON.stringify(preferences), 365);

    initializeAnalytics(preferences.analytics);
    initializeMarketing(preferences.marketing);

    setShowConsent(false);
    setShowCustomize(false);

    console.log('[CookieConsent] Preferences saved:', preferences);
  };

  const togglePreference = (key: keyof CookiePreferences): void => {
    if (key === 'necessary') return;
    setPreferences((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  if (!isClient || !showConsent) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-md">
      <div className="bg-[#09090b] border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
        {!showCustomize ? (
          <div className="p-4">
            <div className="flex items-start justify-between mb-3">
              <h3 className="text-lg font-bold text-white">
                Cookie settings 🍪
              </h3>
              <button
                onClick={handleRejectAll}
                className="text-gray-400 cursor-pointer hover:text-white transition shrink-0"
                title="Close"
              >
                <X size={20} />
              </button>
            </div>

            <p className="text-gray-300 text-xs font-head leading-relaxed mb-4">
              OMEGA uses cookies to enhance performance, analyze usage, and
              personalize your experience. You can read our Cookie Policy{' '}
              <Link
                href="/cookie-policy"
                title="cookie-policy"
                className="text-blue-400 cursor-pointer hover:text-blue-300 underline"
              >
                here
              </Link>
              .
            </p>

            <div className="flex flex-col gap-2">
              <button
                onClick={() => setShowCustomize(true)}
                className="w-full px-3 py-2 text-xs font-semibold cursor-pointer text-white border border-gray-600 rounded-lg hover:bg-gray-900/50 hover:border-gray-500 transition"
                title="Customize Cookie Settings"
              >
                Customize Cookie settings
              </button>

              <div className="flex gap-2">
                <button
                  onClick={handleRejectAll}
                  className="flex-1 px-3 py-2 text-xs cursor-pointer font-semibold text-gray-300 border border-gray-600 rounded-lg hover:bg-gray-900/50 transition"
                  title="Reject All Cookies"
                >
                  Reject All Cookies
                </button>
                <button
                  onClick={handleAcceptAll}
                  className="flex-1 px-3 py-2 text-xs cursor-pointer font-semibold text-black bg-white hover:bg-gray-100 rounded-lg transition"
                  title="Accept All Cookies"
                >
                  Accept All Cookies
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 max-h-96 overflow-y-auto">
            <div className="flex items-start justify-between mb-3">
              <h3 className="text-lg font-head font-bold text-white">
                Customize Cookies
              </h3>
              <button
                onClick={() => setShowCustomize(false)}
                className="text-gray-400 hover:text-white transition shrink-0"
                title="Back"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-gray-300 text-xs font-head leading-relaxed mb-4">
              OMEGA uses cookies to improve performance, analyze usage, and
              personalize your experience. You can choose which cookies to
              allow.
            </p>

            <div className="space-y-2 mb-4">
              {/* Necessary */}
              <div className="flex items-center justify-between p-2 bg-gray-900/30 border border-gray-800 rounded-lg">
                <div className="flex flex-col flex-1">
                  <h4 className="text-white font-head font-medium text-xs">
                    Necessary
                  </h4>
                  <p className="text-gray-400 font-head text-xs font-thin">
                    Enables security and basic functionality
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-2">
                  <p className="text-blue-400 font-head text-xs font-semibold">
                    On
                  </p>
                  <div className="relative inline-block w-10 h-5 bg-blue-600 rounded-full cursor-not-allowed">
                    <div className="absolute top-0.5 right-0.5 w-4 h-4 bg-white rounded-full transition"></div>
                  </div>
                </div>
              </div>

              {/* Analytics */}
              <div className="flex items-center justify-between p-2 bg-gray-900/30 border border-gray-800 rounded-lg hover:border-gray-700 transition">
                <div className="flex flex-col flex-1">
                  <h4 className="text-white font-head font-medium text-xs">
                    Analytics
                  </h4>
                  <p className="text-gray-400 font-head text-xs font-thin">
                    Track site performance and user behavior
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-2">
                  <p
                    className={`font-head text-xs font-semibold transition-colors ${
                      preferences.analytics ? 'text-blue-400' : 'text-gray-400'
                    }`}
                  >
                    {preferences.analytics ? 'On' : 'Off'}
                  </p>
                  <button
                    onClick={() => togglePreference('analytics')}
                    className={`shrink-0 relative cursor-pointer inline-block w-10 h-5 rounded-full transition-colors ${
                      preferences.analytics ? 'bg-blue-600' : 'bg-gray-600'
                    }`}
                    title="Toggle Analytics"
                  >
                    <div
                      className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${
                        preferences.analytics ? 'right-0.5' : 'left-0.5'
                      }`}
                    ></div>
                  </button>
                </div>
              </div>

              {/* Marketing */}
              <div className="flex items-center justify-between p-2 bg-gray-900/30 border border-gray-800 rounded-lg hover:border-gray-700 transition">
                <div className="flex flex-col flex-1">
                  <h4 className="text-white font-head font-medium text-xs">
                    Marketing
                  </h4>
                  <p className="text-gray-400 font-head text-xs font-thin">
                    Personalize ads and track ad performance
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-2">
                  <p
                    className={`font-head text-xs font-semibold transition-colors ${
                      preferences.marketing ? 'text-blue-400' : 'text-gray-400'
                    }`}
                  >
                    {preferences.marketing ? 'On' : 'Off'}
                  </p>
                  <button
                    onClick={() => togglePreference('marketing')}
                    className={`shrink-0 relative cursor-pointer inline-block w-10 h-5 rounded-full transition-colors ${
                      preferences.marketing ? 'bg-blue-600' : 'bg-gray-600'
                    }`}
                    title="Toggle Marketing"
                  >
                    <div
                      className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${
                        preferences.marketing ? 'right-0.5' : 'left-0.5'
                      }`}
                    ></div>
                  </button>
                </div>
              </div>
            </div>

            <button
              onClick={handleSavePreferences}
              className="w-full px-3 py-2 cursor-pointer font-head text-xs font-semibold text-black bg-white hover:bg-gray-100 rounded-lg transition"
              title="Save preferences"
            >
              Save Preferences
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CookieConsent;
