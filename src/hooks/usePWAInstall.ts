import { useState, useEffect, useCallback } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [showIOSModal, setShowIOSModal] = useState(false);

  const triggerInstall = useCallback(async () => {
    if (isInstalled) return;

    if (deferredPrompt) {
      // Android / Chrome direct install prompt
      try {
        await deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice.outcome === 'accepted') {
          setIsInstalled(true);
        }
        setDeferredPrompt(null);
      } catch (err) {
        console.error('PWA install prompt error:', err);
      }
    } else if (isIOS) {
      // iOS Safari manual instructions modal
      setShowIOSModal(true);
    } else {
      // Fallback for browsers that don't emit prompt or when prompt was already consumed
      setShowIOSModal(true);
    }
  }, [deferredPrompt, isIOS, isInstalled]);

  useEffect(() => {
    // Detect if running in standalone mode (already installed as an app)
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true ||
      document.referrer.includes('android-app://');

    setIsInstalled(isStandalone);

    // Detect platform
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice =
      /iphone|ipad|ipod/.test(userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const isAndroidDevice = /android/.test(userAgent);

    setIsIOS(isIOSDevice);
    setIsAndroid(isAndroidDevice);

    // Listen for BeforeInstallPromptEvent (Android & desktop Chrome)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Custom event to trigger install from anywhere in the app
    const handleGlobalInstallRequest = () => {
      triggerInstall();
    };
    window.addEventListener('beninmarket-open-install', handleGlobalInstallRequest);

    // Watch for display mode changes (e.g. if opened in standalone)
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const handleMediaChange = (e: MediaQueryListEvent) => {
      setIsInstalled(e.matches);
    };
    mediaQuery.addEventListener('change', handleMediaChange);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('beninmarket-open-install', handleGlobalInstallRequest);
      mediaQuery.removeEventListener('change', handleMediaChange);
    };
  }, [triggerInstall]);

  return {
    isInstalled,
    isIOS,
    isAndroid,
    canInstall: !isInstalled && (deferredPrompt !== null || isIOS),
    triggerInstall,
    showIOSModal,
    setShowIOSModal
  };
}

export const promptPWAInstall = () => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('beninmarket-open-install'));
  }
};
