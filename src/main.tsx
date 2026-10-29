import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { ErrorBoundary } from './components/common/ErrorBoundary.tsx';
import { LanguageProvider } from './i18n/LanguageContext.tsx';
import './hooks/usePWAInstall.ts';
import { registerSW } from 'virtual:pwa-register';
import './index.css';

// Register Service Worker in production; in dev, clear stale workbox dev caches and register lightweight pass-through SW
if (import.meta.env.PROD) {
  registerSW({
    immediate: true,
    onNeedRefresh() {
      console.log('BéninMarket: Une nouvelle version est disponible');
    },
    onOfflineReady() {
      console.log('BéninMarket: Application prête pour une utilisation hors-ligne');
    },
  });
} else if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((regs) => {
    regs.forEach((reg) => {
      if (reg.active?.scriptURL.includes('dev-sw.js')) {
        void reg.unregister();
      }
    });
  });
  if ('caches' in window) {
    caches.keys().then((keys) => {
      keys.forEach((k) => {
        if (k.includes('workbox')) void caches.delete(k);
      });
    });
  }
  navigator.serviceWorker.register('/sw.js').catch(() => {});
}

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary>
    <LanguageProvider>
      <App />
    </LanguageProvider>
  </ErrorBoundary>
);



