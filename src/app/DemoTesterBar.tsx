import { useState, useEffect } from 'react';
import { RotateCcw, Smartphone, MessageSquareHeart, Home, Sparkles, X } from 'lucide-react';
import { resetDemo } from '../data/demo';

export function DemoTesterBar() {
  const [minimized, setMinimized] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleReset = async () => {
    if (confirm('Reset the test database to clean starter notes? Any changes made during testing will be refreshed.')) {
      setResetting(true);
      try {
        await resetDemo();
        window.location.reload();
      } catch (e: any) {
        alert(e.message || 'Error resetting demo.');
        setResetting(false);
      }
    }
  };

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      setDeferredPrompt(null);
    } else {
      alert('To test as a full PWA app:\n• On iPhone/Safari: Tap Share ➔ "Add to Home Screen"\n• On Android/Desktop: Click Install in the browser address bar');
    }
  };

  if (minimized) {
    return (
      <button
        onClick={() => setMinimized(false)}
        className="tester-btn"
        style={{
          position: 'fixed',
          bottom: '16px',
          right: '16px',
          zIndex: 9999,
          padding: '8px 12px',
          fontSize: '0.8125rem',
          background: 'var(--accent, #21665D)',
          color: '#FFF',
          boxShadow: '3px 3px 0 #2F241E',
        }}
        title="Open Emily & Matt Tester Controls"
      >
        🐾 Tester Controls
      </button>
    );
  }

  return (
    <div className="tester-bar">
      <div className="tester-bar-info">
        <Sparkles size={16} />
        <span>🐾 <strong>Emily & Matt Beta Sandbox</strong></span>
        <span style={{ opacity: 0.85, fontSize: '0.75rem', marginLeft: '0.25rem' }}>
          (Private & unindexed · saved strictly in your browser)
        </span>
      </div>

      <div className="tester-bar-actions">
        <button
          onClick={handleReset}
          disabled={resetting}
          className="tester-btn"
          title="Reset sample notes to fresh state"
        >
          <RotateCcw size={12} />
          <span>{resetting ? 'Resetting...' : 'Reset Demo'}</span>
        </button>

        <button
          onClick={handleInstall}
          className="tester-btn"
          title="Install as Progressive Web App"
        >
          <Smartphone size={12} />
          <span>Install PWA</span>
        </button>

        <a
          href="mailto:karim@decisionpixel.com?subject=EvieScratch%20Beta%20Feedback"
          className="tester-btn"
          title="Send feedback or bug report to Karim"
        >
          <MessageSquareHeart size={12} />
          <span>Feedback</span>
        </a>

        <a
          href="/"
          className="tester-btn"
          title="Return to main preview page"
        >
          <Home size={12} />
          <span>Preview Page</span>
        </a>

        <button
          onClick={() => setMinimized(true)}
          className="tester-btn"
          title="Hide tester banner for full distraction-free writing"
          style={{ padding: '4px' }}
        >
          <X size={12} />
        </button>
      </div>
    </div>
  );
}
