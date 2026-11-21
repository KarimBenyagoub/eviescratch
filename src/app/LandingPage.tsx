import { useState, useEffect } from 'react';
import { Heart, Sparkles, Download, ShieldCheck, HardDrive, Smartphone, BookOpen, ArrowRight, Mail } from 'lucide-react';
import '../styles/landing.css';

interface HeartBubble {
  id: number;
  x: number;
}

export function LandingPage() {
  const [catState, setCatState] = useState<'sleeping' | 'awake' | 'scratch'>('sleeping');
  const [petCount, setPetCount] = useState(0);
  const [hearts, setHearts] = useState<HeartBubble[]>([]);
  const [quickThought, setQuickThought] = useState('Writing down something cozy before Evie wakes up...');
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [installed, setInstalled] = useState(false);

  // Catch PWA install prompt
  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', () => setInstalled(true));
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setInstalled(true);
      }
      setDeferredPrompt(null);
    } else {
      alert('To install on iOS: Tap Share ➔ Add to Home Screen.\nOn Desktop/Android: Look for the Install icon in the browser address bar!');
    }
  };

  const handlePet = () => {
    setPetCount((prev) => prev + 1);
    const newHeart: HeartBubble = {
      id: Date.now() + Math.random(),
      x: (Math.random() - 0.5) * 120,
    };
    setHearts((prev) => [...prev, newHeart]);
    setTimeout(() => {
      setHearts((prev) => prev.filter((h) => h.id !== newHeart.id));
    }, 1200);

    // Cycle cat animation playfully
    if (catState === 'sleeping') {
      setCatState('awake');
    } else if (catState === 'awake') {
      setCatState('scratch');
      setTimeout(() => setCatState('awake'), 2500);
    }
  };

  const catImage =
    catState === 'sleeping'
      ? '/images/evie-sleeping.webp'
      : catState === 'scratch'
      ? '/images/evie-intro-scratch.webp'
      : '/images/evie-awake.webp';

  const catStatusMessage =
    catState === 'sleeping'
      ? 'Evie is napping peacefully beside your note.'
      : catState === 'scratch'
      ? 'Purr purr! Evie is happily scratching!'
      : 'Evie is awake, watching your thoughts unfold!';

  return (
    <div className="landing-page" data-theme="pixel">
      {/* Header */}
      <header className="landing-header">
        <div className="landing-container header-content">
          <a href="/" className="pixel-logo">
            <img src="/images/pwa-192.png" alt="Evie icon" className="pixel-logo-icon" />
            <span>EvieScratch</span>
          </a>

          <div className="header-actions">
            <button
              onClick={handleInstallClick}
              className="pixel-btn pixel-btn-sm"
              title="Install as PWA"
            >
              <Smartphone size={14} />
              <span>{installed ? 'Installed' : 'Install PWA'}</span>
            </button>
            <a href="/demo" className="pixel-btn pixel-btn-primary pixel-btn-sm">
              <span>Try Demo</span>
              <ArrowRight size={14} />
            </a>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="landing-container">
          <div className="hero-grid">
            <div className="hero-content">
              <div className="pixel-badge">
                <Sparkles size={14} />
                <span>Pixel-Art Cat Note Companion</span>
              </div>

              <h1 className="hero-title">
                A calmer place for your thoughts, with a <span className="accent-text">gentle cat</span> beside you.
              </h1>

              <p className="hero-subtitle">
                No accounts. No endless cloud syncing. No intrusive notifications. Just your
                private notes saved safely on your device with Evie, the cozy ginger cat.
              </p>

              <div className="hero-actions">
                <a href="/demo" className="pixel-btn pixel-btn-primary">
                  <Sparkles size={16} />
                  <span>Launch Live Demo</span>
                </a>
                <button onClick={handleInstallClick} className="pixel-btn">
                  <Download size={16} />
                  <span>{installed ? 'App Installed' : 'Get PWA App'}</span>
                </button>
              </div>

              <div className="hero-pills">
                <span className="hero-pill-item">
                  <ShieldCheck size={16} /> 100% Private (On-Device)
                </span>
                <span className="hero-pill-item">
                  <HardDrive size={16} /> Works Completely Offline
                </span>
                <span className="hero-pill-item">
                  <Heart size={16} /> Zero Distractions
                </span>
              </div>
            </div>

            {/* Interactive Evie Card */}
            <div className="hero-visual-card">
              <div className="cat-stage">
                {hearts.map((heart) => (
                  <span
                    key={heart.id}
                    className="floating-heart"
                    style={{ left: `calc(50% + ${heart.x}px)` }}
                  >
                    ❤️
                  </span>
                ))}
                <img
                  src={catImage}
                  alt="Evie the ginger cat"
                  className="cat-avatar"
                  draggable={false}
                />
                <span className="cat-status-badge">{catStatusMessage}</span>
              </div>

              <button onClick={handlePet} className="pixel-btn pixel-btn-ginger" style={{ width: '100%' }}>
                <Heart size={18} fill="#FFF" />
                <span>Pet Evie {petCount > 0 ? `(${petCount} pets ❤️)` : ''}</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Quick Scratchpad */}
      <section className="scratchpad-section">
        <div className="landing-container">
          <div className="scratchpad-box">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <BookOpen size={20} color="var(--ginger, #A34726)" />
                <h3 style={{ margin: 0, fontFamily: 'var(--font-display, monospace)' }}>
                  Interactive Scratchpad
                </h3>
              </div>
              <span style={{ fontSize: '0.8125rem', color: 'var(--muted, #695847)' }}>
                {quickThought.length} characters · autosaved live
              </span>
            </div>

            <textarea
              className="scratchpad-textarea"
              value={quickThought}
              onChange={(e) => {
                setQuickThought(e.target.value);
                if (catState === 'sleeping' && e.target.value.length > 5) {
                  setCatState('awake');
                }
              }}
              placeholder="Type any thought here... watch Evie accompany you quietly."
            />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <span className="pixel-badge" style={{ margin: 0, background: '#FFF' }}>
                  🏷️ #cozy-notes
                </span>
                <span className="pixel-badge" style={{ margin: 0, background: '#FFF' }}>
                  🐱 with Evie
                </span>
              </div>
              <a href="/demo" className="pixel-btn pixel-btn-sm pixel-btn-primary">
                <span>Open Full Editor in Demo</span>
                <ArrowRight size={14} />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Showcase Grid */}
      <section className="features-section">
        <div className="landing-container">
          <div className="section-header">
            <div className="pixel-badge">Built For Quiet Thinkers</div>
            <h2 className="section-title">Everything you need, nothing you don't.</h2>
            <p className="section-subtitle">
              Designed to feel like a tactile pocket journal on your phone or laptop.
            </p>
          </div>

          <div className="features-grid">
            <div className="pixel-card">
              <div className="card-icon-box">🐱</div>
              <h3 className="card-title">A Gentle Cat Companion</h3>
              <p className="card-desc">
                Evie curls up and breathes gently in the corner while you write. When you pause, she blinks, yawns, or flicks her tail.
              </p>
            </div>

            <div className="pixel-card">
              <div className="card-icon-box">🔒</div>
              <h3 className="card-title">100% On-Device & Private</h3>
              <p className="card-desc">
                Your thoughts stay on your hardware. IndexedDB storage guarantees zero tracking, zero telemetries, and zero third-party cloud leaks.
              </p>
            </div>

            <div className="pixel-card">
              <div className="card-icon-box">📲</div>
              <h3 className="card-title">Progressive Web App (PWA)</h3>
              <p className="card-desc">
                Install to your iPhone, Android, or desktop home screen with a single tap. Opens instantly full-screen even when completely offline.
              </p>
            </div>

            <div className="pixel-card">
              <div className="card-icon-box">📚</div>
              <h3 className="card-title">Shelves & Journals</h3>
              <p className="card-desc">
                Organize thoughts into neat shelves and journals. Pin important ideas to the top, archive finished projects, or clean up with ease.
              </p>
            </div>

            <div className="pixel-card">
              <div className="card-icon-box">⚡</div>
              <h3 className="card-title">Blazing Fast Search</h3>
              <p className="card-desc">
                Instant search runs locally inside a dedicated Web Worker. Finds any note, tag, or word across your library in milliseconds.
              </p>
            </div>

            <div className="pixel-card">
              <div className="card-icon-box">💾</div>
              <h3 className="card-title">Native Backup & Markdown</h3>
              <p className="card-desc">
                Never locked in. Export all your journals as standard Markdown zip archives or full JSON snapshots with a single click.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* PWA Easy Testing & Installation Guide */}
      <section className="landing-container">
        <div className="pwa-guide-box">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <Smartphone size={22} color="var(--accent, #21665D)" />
            <h3 style={{ margin: 0, fontFamily: 'var(--font-display, monospace)', fontSize: '1.25rem' }}>
              How to Test EvieScratch on Mobile & Desktop
            </h3>
          </div>
          <p style={{ margin: 0, color: 'var(--muted, #695847)' }}>
            EvieScratch is packaged as a high-performance PWA so you can test it directly on your phone as a standalone app:
          </p>

          <div className="pwa-guide-grid">
            <div className="pwa-step-card">
              <span className="pwa-step-number">1</span>
              <h4 style={{ margin: '0 0 0.25rem', fontFamily: 'var(--font-display, monospace)' }}>
                iPhone / iPad (Safari)
              </h4>
              <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--muted, #695847)' }}>
                Open this page in Safari, tap the <strong>Share</strong> button (box with arrow), and select <strong>"Add to Home Screen"</strong>.
              </p>
            </div>

            <div className="pwa-step-card">
              <span className="pwa-step-number">2</span>
              <h4 style={{ margin: '0 0 0.25rem', fontFamily: 'var(--font-display, monospace)' }}>
                Android (Chrome)
              </h4>
              <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--muted, #695847)' }}>
                Tap the three dots menu in Chrome, or click the <strong>"Install PWA"</strong> button above to install directly to your app launcher.
              </p>
            </div>

            <div className="pwa-step-card">
              <span className="pwa-step-number">3</span>
              <h4 style={{ margin: '0 0 0.25rem', fontFamily: 'var(--font-display, monospace)' }}>
                Mac / Windows / Linux
              </h4>
              <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--muted, #695847)' }}>
                Look for the install badge in your browser's address bar (Chrome, Edge, Brave) to run EvieScratch as a standalone desktop app.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="landing-container footer-content">
          <div className="footer-developed-by">
            Developed by{' '}
            <a href="https://decisionpixel.com" target="_blank" rel="noopener noreferrer">
              DecisionPixel.com
            </a>
          </div>

          <div className="footer-contact">
            <Mail size={16} />
            <span>Contact</span>
            <a href="mailto:karim@decisionpixel.com">karim@decisionpixel.com</a>
            <span>for any inquiry</span>
          </div>

          <div className="footer-bottom-row">
            <div>© {new Date().getFullYear()} EvieScratch · All rights reserved.</div>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <a
                href="/demo"
                style={{ color: 'var(--muted, #695847)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
              >
                <span>🐾 Tester Sandbox</span>
              </a>
              <span>·</span>
              <a
                href="https://decisionpixel.com"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: 'var(--muted, #695847)', textDecoration: 'none' }}
              >
                DecisionPixel
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
