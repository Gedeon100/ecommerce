import React, { useState, useEffect } from 'react';
import { Smartphone, Monitor, Download, X } from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall.ts';
import { PWAInstallModal } from './PWAInstallModal.tsx';
import { useLanguage } from '../../i18n/LanguageContext.tsx';

export const PWAInstallBanner: React.FC = () => {
  const {
    isInstalled,
    isIOS,
    isAndroid,
    isDesktop,
    isInIframe,
    hasNativePrompt,
    triggerInstall,
    showIOSModal,
    setShowIOSModal,
  } = usePWAInstall();
  const { t } = useLanguage();
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    const dismissed = sessionStorage.getItem('beninmarket_pwa_dismissed');
    if (dismissed === 'true') {
      setIsDismissed(true);
    }
  }, []);

  const handleDismiss = () => {
    setIsDismissed(true);
    sessionStorage.setItem('beninmarket_pwa_dismissed', 'true');
  };

  if (isInstalled || isDismissed) {
    return (
      <PWAInstallModal
        isOpen={showIOSModal}
        onClose={() => setShowIOSModal(false)}
        isIOS={isIOS}
        isAndroid={isAndroid}
        isDesktop={isDesktop}
        isInIframe={isInIframe}
        hasNativePrompt={hasNativePrompt}
        onDirectInstall={triggerInstall}
      />
    );
  }

  return (
    <>
      <aside
        aria-label="Installation de l'application BéninMarket"
        className="bg-gradient-to-r from-amber-600 via-amber-500 to-amber-700 text-slate-950 px-3.5 py-2 shadow-md flex items-center justify-between gap-3 text-xs sm:text-sm font-medium z-30 transition-all border-b border-amber-400/30"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-slate-950 text-amber-400 p-1.5 flex-shrink-0 flex items-center justify-center shadow-sm">
            {isDesktop ? (
              <Monitor className="w-4 h-4 text-amber-400" />
            ) : (
              <Smartphone className="w-4 h-4 text-amber-400" />
            )}
          </div>
          <div className="truncate leading-tight">
            <span className="font-bold text-slate-950 block sm:inline">
              {t('pwa.bannerTitle')}
            </span>{' '}
            <span className="text-slate-900 hidden sm:inline">
              {t('pwa.bannerDesc')}
            </span>
            <span className="text-slate-900 sm:hidden text-[11px]">
              {t('pwa.installNow')} (1 clic)
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button
            onClick={triggerInstall}
            className="px-3.5 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-900 text-amber-400 font-bold text-xs flex items-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{t('pwa.installNow')}</span>
          </button>
          <button
            onClick={handleDismiss}
            aria-label="Masquer la bannière"
            className="p-1 rounded-md text-slate-900 hover:text-slate-950 hover:bg-amber-400/40 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </aside>

      <PWAInstallModal
        isOpen={showIOSModal}
        onClose={() => setShowIOSModal(false)}
        isIOS={isIOS}
        isAndroid={isAndroid}
        isDesktop={isDesktop}
        isInIframe={isInIframe}
        hasNativePrompt={hasNativePrompt}
        onDirectInstall={triggerInstall}
      />
    </>
  );
};
