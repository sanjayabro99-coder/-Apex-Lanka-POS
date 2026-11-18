import React, { useState, useEffect } from 'react';
import {
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  Package,
  History,
  Settings as SettingsIcon,
  Store,
  Clock,
  Calendar,
  Laptop,
  Users,
  HandCoins
} from 'lucide-react';
import { StoreSettings, Language } from '../types';
import { TRANSLATIONS } from '../utils/defaultData';
import { soundFx } from '../utils/audio';
import { getBackgroundTheme } from '../utils/theme';

interface HeaderProps {
  settings: StoreSettings;
  onUpdateSettings: (newSettings: StoreSettings) => void;
  onOpenManageProducts: () => void;
  onOpenHistory: () => void;
  onOpenSettings: () => void;
  onOpenCustomers?: () => void;
  onOpenCredit?: () => void;
  pendingCreditCount?: number;
  onOpenInstallGuide: () => void;
  todaySalesCount?: number;
  todaySalesTotal?: number;
}

export const Header: React.FC<HeaderProps> = ({
  settings,
  onUpdateSettings,
  onOpenManageProducts,
  onOpenHistory,
  onOpenSettings,
  onOpenCustomers,
  onOpenCredit,
  pendingCreditCount = 0,
  onOpenInstallGuide,
}) => {
  const [dateStr, setDateStr] = useState<string>('');
  const [timeStr, setTimeStr] = useState<string>('');
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const t = TRANSLATIONS[settings.language];

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      // Clean readable formatted date
      const dOptions: Intl.DateTimeFormatOptions = {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      };
      setDateStr(now.toLocaleDateString(settings.language === 'si' ? 'si-LK' : 'en-US', dOptions));
      setTimeStr(
        now.toLocaleTimeString('en-US', {
          hour12: true,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, [settings.language]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
      }
    }
  };

  const toggleSound = () => {
    const next = !settings.soundEffects;
    soundFx.enabled = next;
    onUpdateSettings({ ...settings, soundEffects: next });
    if (next) soundFx.playBeep();
  };

  const toggleLanguage = (lang: Language) => {
    onUpdateSettings({ ...settings, language: lang });
  };

  const theme = getBackgroundTheme(settings.backgroundColor);

  return (
    <header className={`bg-slate-900 text-white shadow-md select-none print:hidden ${theme.headerAccent} transition-all duration-300`}>
      <div className="max-w-7xl mx-auto px-3 sm:px-5 py-2.5 flex flex-wrap items-center justify-between gap-3">
        {/* Left: Brand / Store info */}
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg ${theme.headerIconBg} flex items-center justify-center text-white shadow-sm font-bold text-lg transition-colors duration-300`}>
            <Store className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-base sm:text-lg tracking-tight leading-tight">
                {settings.language === 'si' ? settings.shopNameSi || settings.shopName : settings.shopName}
              </h1>
              <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-blue-950/80 text-blue-300 border border-blue-800/60 px-2 py-0.5 rounded-full">
                <Laptop className="w-3 h-3" />
                Windows POS
              </span>
              <span className="hidden lg:inline-flex items-center text-[10px] font-semibold text-slate-400 bg-slate-800 border border-slate-700 px-2 py-0.5 rounded-full">
                Powered By Apex Lanka Solution
              </span>
            </div>
            <p className="text-xs text-slate-400 truncate max-w-xs sm:max-w-md">
              {t.subtitle} <span className="text-slate-500 font-medium">| Powered By Apex Lanka Solution</span>
            </p>
          </div>
        </div>

        {/* Center: Live Date & Time in a slightly larger, prominent size */}
        <div className="hidden md:flex items-center gap-3.5 bg-slate-800/90 border border-slate-700/80 px-4 py-1.5 rounded-xl shadow-inner">
          <div className="flex items-center gap-2 text-slate-300 font-medium text-sm">
            <Calendar className="w-4 h-4 text-blue-400 shrink-0" />
            <span className="tracking-wide">{dateStr}</span>
          </div>
          <div className="h-4 w-px bg-slate-700" />
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-base font-mono tracking-wider">
            <Clock className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{timeStr}</span>
          </div>
        </div>

        {/* Right: Actions (Language, Products, History, Settings, Sound, Fullscreen) */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Language Toggle */}
          <div className="flex bg-slate-800 p-0.5 rounded-lg border border-slate-700 text-xs">
            <button
              id="lang-si-btn"
              type="button"
              onClick={() => toggleLanguage('si')}
              className={`px-2.5 py-1 rounded font-medium transition-colors ${
                settings.language === 'si'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              සිංහල
            </button>
            <button
              id="lang-en-btn"
              type="button"
              onClick={() => toggleLanguage('en')}
              className={`px-2.5 py-1 rounded font-medium transition-colors ${
                settings.language === 'en'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              English
            </button>
          </div>

          {/* Manage Products button */}
          <button
            id="manage-products-btn"
            type="button"
            onClick={onOpenManageProducts}
            title={t.manageProducts}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-slate-200 hover:text-white rounded-lg border border-slate-700 text-xs font-medium transition-all"
          >
            <Package className="w-4 h-4 text-amber-400" />
            <span className="hidden lg:inline">{t.manageProducts}</span>
          </button>

          {/* Sales History button */}
          <button
            id="sales-history-btn"
            type="button"
            onClick={onOpenHistory}
            title={t.salesHistory}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-slate-200 hover:text-white rounded-lg border border-slate-700 text-xs font-medium transition-all"
          >
            <History className="w-4 h-4 text-emerald-400" />
            <span className="hidden lg:inline">{t.salesHistory}</span>
          </button>

          {/* My Customers button */}
          {onOpenCustomers && (
            <button
              id="my-customers-btn"
              type="button"
              onClick={onOpenCustomers}
              title={settings.language === 'si' ? 'My Customers (පාරිභෝගික නාමාවලිය)' : 'My Customers'}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-slate-200 hover:text-white rounded-lg border border-slate-700 text-xs font-medium transition-all"
            >
              <Users className="w-4 h-4 text-emerald-400" />
              <span className="hidden xl:inline">{settings.language === 'si' ? 'පාරිභෝගිකයින්' : 'Customers'}</span>
            </button>
          )}

          {/* Credit Management button */}
          {onOpenCredit && (
            <button
              id="header-credit-btn"
              type="button"
              onClick={onOpenCredit}
              title={settings.language === 'si' ? 'Credit (ණය කළමනාකරණය)' : 'Credit Accounts'}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-950/80 hover:bg-amber-900 active:bg-amber-950 text-amber-200 hover:text-white rounded-lg border border-amber-700/60 text-xs font-semibold transition-all cursor-pointer shadow-xs"
            >
              <HandCoins className="w-4 h-4 text-amber-300" />
              <span>Credit</span>
              {pendingCreditCount > 0 && (
                <span className="bg-amber-500 text-slate-950 text-[10px] font-black px-1.5 py-0.2 rounded-full font-mono">
                  {pendingCreditCount}
                </span>
              )}
            </button>
          )}

          {/* Settings button */}
          <button
            id="settings-btn"
            type="button"
            onClick={onOpenSettings}
            title={t.settings}
            className="p-2 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-slate-300 hover:text-white rounded-lg border border-slate-700 transition-all"
          >
            <SettingsIcon className="w-4 h-4" />
          </button>

          {/* Windows PC Install / Download Modal button */}
          <button
            id="install-guide-btn"
            type="button"
            onClick={onOpenInstallGuide}
            title="Install or Download for Windows PC"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-lg text-xs font-bold transition-all shadow-xs border border-blue-400/30 active:scale-98"
          >
            <Laptop className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">
              {settings.language === 'si' ? 'PC එකට Install / Download' : 'Install on PC'}
            </span>
          </button>

          {/* Sound toggle */}
          <button
            id="sound-toggle-btn"
            type="button"
            onClick={toggleSound}
            title={settings.soundEffects ? 'Mute Sound' : 'Enable Sound'}
            className="p-2 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-slate-300 hover:text-white rounded-lg border border-slate-700 transition-all"
          >
            {settings.soundEffects ? (
              <Volume2 className="w-4 h-4 text-blue-400" />
            ) : (
              <VolumeX className="w-4 h-4 text-slate-500" />
            )}
          </button>

          {/* Fullscreen button */}
          <button
            id="fullscreen-toggle-btn"
            type="button"
            onClick={toggleFullscreen}
            title={t.fullscreen}
            className="p-2 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-slate-300 hover:text-white rounded-lg border border-slate-700 transition-all"
          >
            {isFullscreen ? (
              <Minimize className="w-4 h-4 text-slate-200" />
            ) : (
              <Maximize className="w-4 h-4 text-slate-200" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
