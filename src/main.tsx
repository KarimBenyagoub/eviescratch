import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './app/App';
import { applyVisualMode, readVisualMode } from './app/theme';
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

  useEffect(() => {
    applyVisualMode(initialMode);
  }, [initialMode]);

  useEffect(() => {
    document.title = 'EvieScratch · Calmer Pixel Notes';
  }, []);

  return <App initialMode={initialMode} />;
}

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('EvieScratch root element is missing.');

createRoot(rootElement).render(
  <StrictMode>
    <Root />
  </StrictMode>,
);
