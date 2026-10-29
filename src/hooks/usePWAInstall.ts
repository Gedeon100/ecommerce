import { useState, useEffect, useCallback } from 'react';

export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

declare global {
  interface Window {
    __beninMarketDeferredPrompt?: BeforeInstallPromptEvent | null;
  }
}

// Module-level singleton state so every Header / Banner / Footer button shares the exact same OS prompt
let sharedPrompt: BeforeInstallPromptEvent | null =
  typeof window !== 'undefined' ? window.__beninMarketDeferredPrompt || null : null;
let sharedIsInstalled = false;
let sharedModalOpen = false;
const subscribers = new Set<() => void>();

function notifySubscribers() {
  subscribers.forEach((cb) => cb());
}

if (typeof window !== 'undefined') {
  sharedIsInstalled =
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true ||
    document.referrer.includes('android-app://');

  window.addEventListener('beforeinstallprompt', (e: Event) => {
    e.preventDefault();
    sharedPrompt = e as BeforeInstallPromptEvent;
    window.__beninMarketDeferredPrompt = sharedPrompt;
    notifySubscribers();
  });

  window.addEventListener('beninmarket-pwa-ready', () => {
    if (window.__beninMarketDeferredPrompt) {
      sharedPrompt = window.__beninMarketDeferredPrompt;
      notifySubscribers();
    }
  });

  window.addEventListener('appinstalled', () => {
    sharedIsInstalled = true;
    sharedPrompt = null;
    window.__beninMarketDeferredPrompt = null;
    sharedModalOpen = false;
    notifySubscribers();
  });
}

export async function executeDirectPWAInstall(): Promise<'accepted' | 'dismissed' | 'fallback'> {
  if (sharedIsInstalled) return 'accepted';

  const promptEvent = sharedPrompt || (typeof window !== 'undefined' ? window.__beninMarketDeferredPrompt : null);

  if (promptEvent) {
    try {
      await promptEvent.prompt();
      const choice = await promptEvent.userChoice;
      if (choice.outcome === 'accepted') {
        sharedIsInstalled = true;
        sharedPrompt = null;
        if (typeof window !== 'undefined') window.__beninMarketDeferredPrompt = null;
        sharedModalOpen = false;
        notifySubscribers();
        return 'accepted';
      }
      sharedPrompt = null;
      if (typeof window !== 'undefined') window.__beninMarketDeferredPrompt = null;
      notifySubscribers();
      return 'dismissed';
    } catch (err) {
      console.warn('PWA direct prompt error, opening install helper:', err);
    }
  }

  sharedModalOpen = true;
  notifySubscribers();
  return 'fallback';
}

export function usePWAInstall() {
  const [, forceRender] = useState(0);

  const userAgent = typeof window !== 'undefined' ? window.navigator.userAgent.toLowerCase() : '';
  const isIOS =
    typeof window !== 'undefined' &&
    (/iphone|ipad|ipod/.test(userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1));
  const isAndroid = typeof window !== 'undefined' && /android/.test(userAgent);
  const isDesktop = !isIOS && !isAndroid;
  const isInIframe =
    typeof window !== 'undefined' &&
    (() => {
      try {
        return window.self !== window.top;
      } catch {
        return true;
      }
    })();

  useEffect(() => {
    const onChange = () => forceRender((n) => n + 1);
    subscribers.add(onChange);

    if (typeof window !== 'undefined' && window.__beninMarketDeferredPrompt && !sharedPrompt) {
      sharedPrompt = window.__beninMarketDeferredPrompt;
      onChange();
    }

    const handleGlobalInstallRequest = () => {
      void executeDirectPWAInstall();
    };
    window.addEventListener('beninmarket-open-install', handleGlobalInstallRequest);

    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const handleMediaChange = (e: MediaQueryListEvent) => {
      sharedIsInstalled = e.matches;
      notifySubscribers();
    };
    mediaQuery.addEventListener('change', handleMediaChange);

    return () => {
      subscribers.delete(onChange);
      window.removeEventListener('beninmarket-open-install', handleGlobalInstallRequest);
      mediaQuery.removeEventListener('change', handleMediaChange);
    };
  }, []);

  const triggerInstall = useCallback(async () => {
    await executeDirectPWAInstall();
  }, []);

  const setShowIOSModal = useCallback((open: boolean) => {
    sharedModalOpen = open;
    notifySubscribers();
  }, []);

  const hasNativePrompt = Boolean(sharedPrompt || (typeof window !== 'undefined' && window.__beninMarketDeferredPrompt));

  return {
    isInstalled: sharedIsInstalled,
    isIOS,
    isAndroid,
    isDesktop,
    isInIframe,
    hasNativePrompt,
    canInstall: !sharedIsInstalled,
    triggerInstall,
    showIOSModal: sharedModalOpen,
    setShowIOSModal,
  };
}

export const promptPWAInstall = () => {
  void executeDirectPWAInstall();
};
