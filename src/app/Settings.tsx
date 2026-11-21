import { useEffect, useState } from 'react';
import { Archive, Download, Grid2X2, Sun, BookOpen, HardDrive } from 'lucide-react';
import { HelpTip } from './HelpTip';
import { Dialog } from './Dialog';
import type { Preferences } from './preferences';
import type { VisualMode } from '../domain/model';
import type { AppMode } from './environment';
import { TrialRemaining } from './TrialRemaining';
import type { DemoAccess } from '../domain/trial';
import { downloadRecovery } from '../data/recovery';

export function Settings({
  mode,
  changeMode,
  preferences,
  changePreferences,
  onReplay,
  onPlans,
  onClose,
  appMode,
  onModeChange,
  onReset,
  errorMessage,
  access,
  onOpenStorage,
  onExportBackup,
  onExportMarkdown,
}: {
  mode: VisualMode;
  changeMode: (mode: VisualMode) => void;
  preferences: Preferences;
  changePreferences: (changes: Partial<Preferences>) => void;
  onReplay: () => void;
  onPlans: () => void;
  onClose: () => void;
  access: DemoAccess | null;
  errorMessage: string;
  appMode: AppMode;
  onModeChange: (mode: AppMode) => void;
  onReset: () => void;
  onOpenStorage?: () => void;
  onExportBackup?: () => void;
  onExportMarkdown?: () => void;
}) {
  const [storage, setStorage] = useState('Checking browser storage…');
  const [message, setMessage] = useState('');
  useEffect(() => {
    if (!navigator.storage?.estimate) { setStorage('Storage estimates are unavailable in this browser.'); return; }
    void navigator.storage.estimate().then(({ usage, quota }) => setStorage(`${((usage ?? 0) / 1_000_000).toFixed(1)} MB used${quota ? ` · about ${Math.round(quota / 1_000_000)} MB browser-reported quota` : ''}`)).catch(() => setStorage('Storage estimates are unavailable in this browser.'));
  }, []);
  async function download() {
    try { await downloadRecovery(); setMessage('Recovery JSON downloaded. Keep it safe.'); }
    catch { setMessage('The recovery download failed. Keep your browser data and retry.'); }
  }
  return <Dialog title="Settings" onClose={onClose} wide>
    <section className="settings-section"><div className="help-row"><h3>App mode</h3><HelpTip label="App mode">Test and Normal keep separate libraries and preferences. Switching saves your open note first. Save or clear a Home capture before switching. Appearance changes only how the app looks.</HelpTip></div><p>{appMode === 'test' ? 'Test mode uses a separate demo library. Try all available local features and reset the demo whenever you like.' : 'Normal mode saves your own notes in a separate library. Demo reset cannot erase them.'}</p><div className="environment-options" role="group" aria-label="App mode"><button className="secondary-button" aria-pressed={appMode === 'test'} onClick={() => onModeChange('test')}>Test mode</button><button className="secondary-button" aria-pressed={appMode === 'normal'} onClick={() => onModeChange('normal')}>Normal mode</button></div>{appMode === 'test' && <button className="text-danger" onClick={onReset}>Hard reset demo</button>}<p className="small muted">Cloud accounts and live billing are not connected in either mode yet.</p>{errorMessage && <p className="form-error" role="alert">{errorMessage}</p>}</section>
    <section className="settings-section"><h3>Trial & plans</h3><p>3 days free, then $7.99 USD per week or $299.88 USD per year. First payment is due when the trial ends.</p><TrialRemaining access={access} /><p className="small muted">{appMode === 'test' && access ? 'Test simulation only. No real subscription or payment.' : 'No live trial, subscription or payment has started.'}</p><button className="secondary-button" onClick={onPlans}>Choose a plan</button></section>
    <section className="settings-section"><div className="help-row"><h3>Make yourself at home</h3><HelpTip label="Evie and appearance">Normal and Pixel Art share the same notes. Tap Evie to hide her; use A little Evie company below to bring her back. Writing size changes note text.</HelpTip></div><p>Choose your look. Your notes stay exactly where they are.</p>
      <div className="appearance-cards" role="group" aria-label="Settings appearance"><button aria-label="Normal" aria-pressed={mode === 'normal'} onClick={() => changeMode('normal')}><Sun size={22} aria-hidden="true" /><strong>Normal</strong><span>Warm paper. A quiet place to write.</span></button><button aria-label="Pixel Art" aria-pressed={mode === 'pixel'} onClick={() => changeMode('pixel')}><Grid2X2 size={22} aria-hidden="true" /><strong>Pixel Art</strong><span>A little pixel charm. Same clear writing.</span></button></div>
      <label className="settings-toggle"><span><strong>A little Evie company</strong><small>Show Evie beside your notes and welcome tips.</small></span><input type="checkbox" checked={preferences.showEvie} onChange={event => changePreferences({ showEvie: event.target.checked })} /></label>
      <label className="field-label">Writing size<select aria-label="Writing size" value={preferences.textSize} onChange={event => changePreferences({ textSize: event.target.value === 'large' ? 'large' : 'comfortable' })}><option value="comfortable">Comfortable</option><option value="large">Large</option></select></label>
      <p className="small muted">Evie’s gentle motion follows your device’s Reduce Motion setting.</p>
    </section>
    <section className="settings-section"><h3>Welcome & onboarding</h3><p>Replay the logo, welcome, organization and plan-choice flow. Your existing notes will be kept.</p><button className="secondary-button" onClick={onReplay}><BookOpen size={18} aria-hidden="true" />Replay welcome & onboarding</button></section>
    <section className="settings-section">
      <div className="help-row">
        <h3><HardDrive size={19} aria-hidden="true" />Your data & storage</h3>
        <HelpTip label="Storage & backups">Manage all attachments, inspect device storage, and export exact native backups (.zip) or readable Markdown files.</HelpTip>
      </div>
      <p>{storage}</p>
      <p className="small muted">All notes and attached files are stored securely on this device. Cloud sync is not connected yet.</p>
      <div className="settings-storage-controls">
        {onOpenStorage && (
          <button className="primary-button" onClick={onOpenStorage}>
            <HardDrive size={18} aria-hidden="true" />Manage files & storage
          </button>
        )}
        <div className="settings-export-buttons">
          {onExportBackup && (
            <button className="secondary-button" onClick={onExportBackup}>
              <Archive size={17} aria-hidden="true" />Export full backup (.zip)
            </button>
          )}
          {onExportMarkdown && (
            <button className="secondary-button" onClick={onExportMarkdown}>
              <Download size={17} aria-hidden="true" />Export Markdown (.zip)
            </button>
          )}
          <button className="secondary-button" onClick={() => void download()}>
            <Download size={17} aria-hidden="true" />Download recovery JSON
          </button>
        </div>
      </div>
      {message && <p role="status">{message}</p>}
    </section>
    <div className="settings-about"><strong>EvieScratch</strong><span>Your notes, neatly tucked away. A little cat company.</span><small>Local prototype · Notes → Journals → optional Shelves</small></div>
  </Dialog>;
}
