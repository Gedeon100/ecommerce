import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { ErrorBoundary } from './components/common/ErrorBoundary.tsx';
import { registerSW } from 'virtual:pwa-register';
import './index.css';

// Register Service Worker for offline support and native app installation
registerSW({
  immediate: true,
  onNeedRefresh() {
    console.log('BéninMarket: Une nouvelle version est disponible');
  },
  onOfflineReady() {
    console.log('BéninMarket: Application prête pour une utilisation hors-ligne');
  },
});

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);


