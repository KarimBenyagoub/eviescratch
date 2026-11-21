import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './app/App';
import { LandingPage } from './app/LandingPage';
import { DemoTesterBar } from './app/DemoTesterBar';
import { applyVisualMode, readVisualMode } from './app/theme';
import { storeAppMode } from './app/environment';
import './styles/tokens.css';
import './styles/app.css';

// Register Service Worker for PWA
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .catch((err) => console.warn('SW registration skipped:', err));
  });
}

function Root() {
  const [initialMode] = useState(readVisualMode);
  const [isDemo] = useState(() => {
    const path = window.location.pathname.toLowerCase();
    const hash = window.location.hash.toLowerCase();
    const search = window.location.search.toLowerCase();
    return path.startsWith('/demo') || hash.startsWith('#demo') || search.includes('demo');
  });

  useEffect(() => {
    applyVisualMode(initialMode);
  }, [initialMode]);

  useEffect(() => {
    if (isDemo) {
      storeAppMode('test');
      document.title = 'EvieScratch Demo · Emily & Matt Sandbox';

      // Ensure demo page is never indexed
      let meta = document.querySelector('meta[name="robots"]');
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute('name', 'robots');
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', 'noindex, nofollow, noarchive');
    } else {
      document.title = 'EvieScratch · Calmer Pixel Notes with Evie';
      const meta = document.querySelector('meta[name="robots"]');
      if (meta) meta.remove();
    }
  }, [isDemo]);

  if (isDemo) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: '100vh' }}>
        <DemoTesterBar />
        <div style={{ flex: 1, position: 'relative' }}>
          <App initialMode={initialMode} />
        </div>
      </div>
    );
  }

  return <LandingPage />;
}

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('EvieScratch root element is missing.');

createRoot(rootElement).render(
  <StrictMode>
    <Root />
  </StrictMode>,
);
