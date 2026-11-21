import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './app/App';
import { applyVisualMode, readVisualMode } from './app/theme';
import './styles/tokens.css';
import './styles/app.css';

const initialMode = readVisualMode();
applyVisualMode(initialMode);
const root = document.getElementById('root');
if (!root) throw new Error('EvieScratch root element is missing.');

createRoot(root).render(
  <StrictMode>
    <App initialMode={initialMode} />
  </StrictMode>,
);
