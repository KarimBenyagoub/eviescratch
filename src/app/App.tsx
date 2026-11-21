import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Archive, BookOpen, Check, Download, Gift, Grid2X2, House, Inbox, Layers, Menu, Pin, Plus, Search, Settings as SettingsIcon, Sun, Trash2, TriangleAlert, X } from 'lucide-react';
import type { Journal, Note, Shelf, VisualMode } from '../domain/model';
import { INBOX_ID } from '../domain/model';
import { createNote, database, openLibrary, readLibrary, type Library } from '../data/database';
import { deleteJournal, deleteShelf, saveJournal, saveShelf, undoChange, updateNoteMetadata, type UndoChange } from '../data/organization';
import { SaveSession } from '../data/save-session';
import { downloadJson, downloadRecovery } from '../data/recovery';
import { parseNote } from '../editor/schema';
import { plainText } from '../search/index';
import { useSearch } from '../search/use-search';
import { applyVisualMode, saveVisualMode } from './theme';
import { readPreferences, savePreferences, type Preferences } from './preferences';
import { Dialog } from './Dialog';
import { AppNavigation } from './AppNavigation';
import { HelpTip } from './HelpTip';
import { Settings } from './Settings';
import { GettingStarted } from './GettingStarted';
import { Plans } from './Plans';
import { Journals, JournalForm, ShelfForm, DeleteJournal, MoveNote } from './Journals';
import { readAppMode, storeAppMode, type AppMode } from './environment';
import { resetDemo } from '../data/demo';
import { Home } from './Home';
import { Onboarding } from './Onboarding';
import { Companion } from './Companion';
import { NoteCard } from './NoteCard';
import { NoteOptions } from './NoteOptions';
import { MoveToShelf } from './MoveToShelf';
import { EviePortrait } from './EviePortrait';
import { TrialRemaining } from './TrialRemaining';
import { createDemoAccess } from '../domain/trial';
import { StorageManager } from './StorageManager';
import { exportNativeBackup, exportReadableMarkdown, triggerBlobDownload } from '../data/backup';

const NoteEditor = lazy(() => import('../editor/NoteEditor'));

type Filter = { kind: 'all' | 'journal' | 'shelf' | 'pinned' | 'archive' | 'trash'; id?: string };
type Modal = { type: 'settings' | 'plans' | 'library' | 'move' | 'move-shelf' | 'note-options' | 'evie' | 'brand' | 'reset-demo' | 'storage' } | { type: 'journal'; current?: Journal; shelfId?: string } | { type: 'shelf'; current?: Shelf } | { type: 'delete-journal'; current: Journal } | { type: 'delete-shelf'; current: Shelf } | null;
const emptyLibrary: Library = { notes: [], journals: [], shelves: [], attachments: [], defaultJournalId: INBOX_ID };

function inScope(note: Note, filter: Filter, library: Library, includeArchived = false) {
  if (filter.kind === 'trash') return !!note.deletedAt;
  if (note.deletedAt) return false;
  if (filter.kind === 'archive') return !!note.archivedAt;
  if (note.archivedAt && !includeArchived) return false;
  if (filter.kind === 'journal') return note.journalId === filter.id;
  if (filter.kind === 'shelf') return library.journals.some(journal => journal.id === note.journalId && journal.shelfId === filter.id && !journal.deletedAt);
  if (filter.kind === 'pinned') return note.pinned;
  return true;
}

export function App({ initialMode }: { initialMode: VisualMode }) {
  const [mode, setMode] = useState(initialMode);
  const [appMode] = useState(readAppMode);
  const [wideView, setWideView] = useState(() => window.innerWidth >= 640);
  const [actionNoteId, setActionNoteId] = useState<string>();
  const [preferences, setPreferences] = useState(readPreferences);
  const [preferenceSaved, setPreferenceSaved] = useState(true);
  const [library, setLibrary] = useState<Library>(emptyLibrary);
  const [session, setSession] = useState<SaveSession>();
  const [ready, setReady] = useState(false);
  const [homeDraft, setHomeDraft] = useState('');
  const [startupError, setStartupError] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const discardingDemo = useRef(false);
  const [introRun, setIntroRun] = useState(0);
  const [filter, setFilter] = useState<Filter>({ kind: 'all' });
  const [section, setSection] = useState<'home' | 'notes' | 'journals'>('home');
  const [mobileView, setMobileView] = useState<'home' | 'notes' | 'editor' | 'journals'>('home');
  const [focusNewNote, setFocusNewNote] = useState(false);
  const [modal, setModal] = useState<Modal>(null);
  const [toast, setToast] = useState<{ message: string; undo?: UndoChange }>();
  const [query, setQuery] = useState('');
  const [searchExpanded, setSearchExpanded] = useState(false);
  const [includeArchived, setIncludeArchived] = useState(false);
  const [visibleCount, setVisibleCount] = useState(60);
  const searchInput = useRef<HTMLInputElement>(null);
  const search = useSearch(library.notes, query);
  const journals = library.journals.filter(item => !item.deletedAt);
  const shelves = library.shelves.filter(item => !item.deletedAt);
  const activeAccess = appMode === 'test' ? preferences.demoAccess : null;
  const noteAwake = section === 'notes' && !!session && (wideView || mobileView === 'editor');
  const sleepingCompanion = preferences.showEvie && !startupError ? <Companion inline awake={false} onHide={() => changePreferences({ showEvie: false })} /> : null;
  const actionId = actionNoteId ?? session?.draft.id;
  const actionNote = actionId === session?.draft.id ? session?.draft : library.notes.find(note => note.id === actionId);
  const journal = journals.find(item => item.id === session?.draft.journalId);
  const filterTitle = filter.kind === 'journal' ? journals.find(item => item.id === filter.id)?.name ?? 'Journal'
    : filter.kind === 'shelf' ? shelves.find(item => item.id === filter.id)?.name ?? 'Shelf'
    : ({ all: 'All notes', pinned: 'Pinned notes', archive: 'Archive', trash: 'Litter box' } as const)[filter.kind];

  const changePreferences = useCallback((change: Partial<Preferences>) => {
    setPreferences(previous => { const next = { ...previous, ...change }; setPreferenceSaved(savePreferences(next)); return next; });
  }, []);
  const onCommit = useCallback((note: Note) => {
    setLibrary(previous => ({ ...previous, notes: [note, ...previous.notes.filter(item => item.id !== note.id)] }));
    if (note.title.trim() || plainText(note.document.content).trim()) {
      setPreferences(previous => {
        if (previous.guide !== 0) return previous;
        const next = { ...previous, guide: 1 };
        savePreferences(next);
        return next;
      });
    }
  }, []);

  useEffect(() => {
    let active = true;
    void openLibrary().then(() => readLibrary()).then(data => {
      if (!active) return;
      setLibrary(data);
      const orderedNotes = data.notes.filter(note => !note.deletedAt && !note.archivedAt).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
      const linkedId = location.hash.startsWith('#note/') ? location.hash.slice(6) : null;
      const first = data.notes.find(note => note.id === linkedId) ?? orderedNotes[0];
      if (first) setSession(new SaveSession(first, onCommit));
      if (linkedId && first?.id === linkedId) { setSection('notes'); setMobileView('editor'); setFocusNewNote(true); }
      else if (location.hash === '#journals') { setSection('journals'); setMobileView('journals'); }
      else if (location.hash === '#notes') { setSection('notes'); setMobileView('notes'); }
      setReady(true);
    }).catch(() => { if (active) setStartupError(true); });
    return () => { active = false; };
  }, [onCommit]);

  useEffect(() => {
    const hidden = () => { if (document.visibilityState === 'hidden') void session?.flush(); };
    const beforeUnload = (event: BeforeUnloadEvent) => { if ((session?.dirty || homeDraft.trim()) && !discardingDemo.current) { event.preventDefault(); event.returnValue = ''; } };
    const pageHide = () => { void session?.flush(); };
    document.addEventListener('visibilitychange', hidden);
    window.addEventListener('beforeunload', beforeUnload);
    window.addEventListener('pagehide', pageHide);
    return () => { document.removeEventListener('visibilitychange', hidden); window.removeEventListener('beforeunload', beforeUnload); window.removeEventListener('pagehide', pageHide); };
  }, [session, homeDraft]);
  useEffect(() => {
    const viewport = window.visualViewport;
    const resize = () => { document.documentElement.style.setProperty('--app-height', `${viewport?.height ?? window.innerHeight}px`); setWideView(window.innerWidth >= 640); };
    resize(); viewport?.addEventListener('resize', resize); window.addEventListener('resize', resize);
    return () => { viewport?.removeEventListener('resize', resize); window.removeEventListener('resize', resize); };
  }, []);
  useEffect(() => { setVisibleCount(60); }, [filter, query]);

  const visibleNotes = useMemo(() => {
    const eligible = library.notes.filter(note => inScope(note, filter, library, !!query.trim() && includeArchived));
    if (query.trim()) {
      const positions = new Map(search.ids.map((id, index) => [id, index]));
      return eligible.filter(note => positions.has(note.id)).sort((a, b) => positions.get(a.id)! - positions.get(b.id)!);
    }
    return eligible.sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.updatedAt.localeCompare(a.updatedAt) || a.id.localeCompare(b.id));
  }, [library, filter, query, includeArchived, search.ids]);

  function changeMode(next: VisualMode) { applyVisualMode(next); setMode(next); setPreferenceSaved(saveVisualMode(next)); }
  function openModal(next: Modal) { setError(''); setModal(next); }
  async function flushCurrent() {
    if (session && !await session.flush()) { setSection('notes'); setMobileView('editor'); setModal(null); return false; }
    return true;
  }
  async function refresh() {
    const data = await readLibrary();
    setLibrary(data);
    const updated = data.notes.find(note => note.id === session?.draft.id);
    if (updated && session) session.adoptCommitted(updated);
    return data;
  }
  async function perform(work: () => Promise<void>, close = true) {
    if (lock.current) return;
    lock.current = true; setBusy(true); setError('');
    try { if (!await flushCurrent()) return; await work(); if (close) setModal(null); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Could not save this change. Your original notes are still here.'); }
    finally { lock.current = false; setBusy(false); }
  }
  async function selectNote(note: Note) {
    await perform(async () => {
      const saved = parseNote(await database.notes.get(note.id));
      if (session?.draft.id !== saved.id) setSession(new SaveSession(saved, onCommit));
      else session.adoptCommitted(saved);
      setFocusNewNote(true); setSection('notes'); setMobileView('editor'); location.hash = `note/${saved.id}`;
      if (query.trim() && preferences.guide === 2) changePreferences({ guide: 3 });
    });
  }
  async function addNote() {
    await perform(async () => {
      const note = await createNote(database, filter.kind === 'journal' ? filter.id : undefined);
      onCommit(note); setSession(new SaveSession(note, onCommit)); setFocusNewNote(true); location.hash = `note/${note.id}`;
      if (filter.kind !== 'journal') setFilter({ kind: 'all' });
      setSection('notes'); setMobileView('editor'); setQuery('');
    });
  }
  async function navigate(next: Filter) {
    await perform(async () => {
      location.hash = 'notes'; setFilter(next); setQuery(''); setIncludeArchived(false); setSection('notes'); setMobileView('notes');
      const first = library.notes.filter(note => inScope(note, next, library)).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0];
      if (first && first.id !== session?.draft.id) setSession(new SaveSession(first, onCommit));
    });
  }
  function showHome() { location.hash = 'home'; setSection('home'); setMobileView('home'); setModal(null); }
  function showJournals() { location.hash = 'journals'; setSection('journals'); setMobileView('journals'); setModal(null); }
  function startSearch() {
    setSearchExpanded(true); setModal(null);
    requestAnimationFrame(() => searchInput.current?.focus());
  }
  function updateSearch(value: string) {
    setQuery(value);
    if (!value.trim()) return;
    location.hash = 'notes'; setFilter({ kind: 'all' }); setIncludeArchived(false); setSection('notes'); setMobileView('notes');
  }
  function closeSearch() { setQuery(''); setSearchExpanded(false); }
  async function metadata(change: Parameters<typeof updateNoteMetadata>[2], label: string, follow?: Filter, targetId = session?.draft.id) {
    await perform(async () => {
      const source = session && targetId === session.draft.id ? session.draft : library.notes.find(note => note.id === targetId);
      if (!source) throw new Error('Open a note first.');
      const result = await updateNoteMetadata(source.id, source.revision, change, label);
      if (session?.draft.id === source.id) session.adoptCommitted(result.note); else onCommit(result.note);
      setToast({ message: label, undo: result.undo });
      if (follow) { setFilter(follow); setQuery(''); }
      if (change.journalId && preferences.guide < 2) changePreferences({ guide: 2 });
    });
  }
  async function recover() {
    try { await downloadRecovery(); setToast({ message: 'Recovery JSON downloaded. Automatic restore is still being built.' }); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Recovery download failed.'); }
  }
  async function capture(text: string): Promise<boolean> {
    let captured = false;
    await perform(async () => {
      const note = await createNote();
      const next = new SaveSession(note, onCommit);
      onCommit(note); setSession(next); setFocusNewNote(true);
      setSection('notes'); setMobileView('editor'); setFilter({ kind: 'all' }); setQuery(''); location.hash = `note/${note.id}`;
      if (text.trim()) {
        next.edit({ document: { schemaVersion: 1, content: { type: 'doc', content: text.split('\n').map(line => ({ type: 'paragraph', ...(line ? { content: [{ type: 'text', text: line }] } : {}) })) } } });
        captured = await next.flush();
      } else captured = true;
    });
    return captured;
  }
  async function changeAppMode(next: AppMode) {
    if (next === appMode) return;
    if (homeDraft.trim()) { setError('Save or clear your quick note before switching modes.'); return; }
    await perform(async () => { storeAppMode(next); database.close(); location.reload(); });
  }
  function replayOnboarding() {
    void perform(async () => { changePreferences({ onboarded: false, guide: 0 }); setIntroRun(value => value + 1); });
  }
  async function resetDemoNow() {
    if (appMode !== 'test' || lock.current) return;
    lock.current = true; setBusy(true); setError('');
    try { discardingDemo.current = true; await resetDemo(); location.hash = ''; location.reload(); }
    catch (reason) { discardingDemo.current = false; setError(reason instanceof Error ? reason.message : 'Could not reset the demo.'); lock.current = false; setBusy(false); }
  }
  async function createHomeAndMove(shelfName: string, journalName: string, shelfId?: string) {
    await perform(async () => {
      const source = session && actionId === session.draft.id ? session.draft : library.notes.find(note => note.id === actionId);
      if (!source) throw new Error('Choose a note first.');
      const result = await database.transaction('rw', [database.notes, database.journals, database.shelves, database.checkpoints, database.pendingChanges], async () => {
        const destinationShelf = shelfId ?? (shelfName ? (await saveShelf(shelfName)).id : null);
        const destination = await saveJournal(journalName, destinationShelf);
        return updateNoteMetadata(source.id, source.revision, { journalId: destination.id }, 'Note moved to its new home.');
      });
      if (session?.draft.id === source.id) session.adoptCommitted(result.note); else onCommit(result.note);
      await refresh(); changePreferences({ guide: 2 });
      setToast({ message: result.undo.label, undo: result.undo });
    });
  }
  const guide = <GettingStarted step={preferences.guide} access={activeAccess} onPlans={() => openModal({ type: 'plans' })} onSkip={() => changePreferences({ guide: 3 })} onAction={() => {
    if (preferences.guide === 0) { document.getElementById('note-body')?.focus(); }
    else if (preferences.guide === 1) { setActionNoteId(session?.draft.id); openModal({ type: 'move' }); } else startSearch();
  }} />;

  function navigation(includeSettings = false) {
    const items = [
      { label: 'All notes', icon: BookOpen, target: { kind: 'all' } as Filter },
      { label: journals.find(item => item.id === library.defaultJournalId)?.name ?? 'Inbox', icon: Inbox, target: { kind: 'journal', id: library.defaultJournalId } as Filter },
      { label: 'Pinned', icon: Pin, target: { kind: 'pinned' } as Filter },
      { label: 'Archive', icon: Archive, target: { kind: 'archive' } as Filter },
      { label: 'Litter box', icon: Trash2, target: { kind: 'trash' } as Filter },
    ];
    return <><span className="eyebrow nav-eyebrow">YOUR LIBRARY</span><button className="nav-link" aria-current={section === 'home' ? 'page' : undefined} onClick={showHome}><House size={19} aria-hidden="true" />Home</button>{items.map(({ label, icon: Icon, target }) => <button className="nav-link" key={target.kind} aria-current={section === 'notes' && filter.kind === target.kind && filter.id === target.id ? 'page' : undefined} onClick={() => void navigate(target)}><Icon size={19} aria-hidden="true" />{label}{target.kind === 'trash' && <span>{library.notes.filter(note => note.deletedAt).length || ''}</span>}</button>)}<div className="nav-divider" /><button className="nav-link" aria-current={section === 'journals' ? 'page' : undefined} onClick={showJournals}><Layers size={19} aria-hidden="true" />Journals & Shelves</button>{journals.filter(item => item.id !== library.defaultJournalId).slice(0, 8).map(item => <button className="nav-link nav-journal" key={item.id} onClick={() => void navigate({ kind: 'journal', id: item.id })}><BookOpen size={16} aria-hidden="true" /><span>{item.name}</span></button>)}<button className="nav-link nav-add" onClick={() => openModal({ type: 'journal' })}><Plus size={17} aria-hidden="true" />New Journal</button><div className="nav-bottom"><button className="nav-link" onClick={() => openModal({ type: 'plans' })}><Gift size={19} aria-hidden="true" />Trial & plans</button>{includeSettings && <button className="nav-link" onClick={() => openModal({ type: 'settings' })}><SettingsIcon size={19} aria-hidden="true" />Settings</button>}<p className="local-footnote">Saved on this device.<br />Local prototype · Cloud sync comes later.</p></div></>;
  }

  const resetPanel = modal?.type === 'reset-demo' ? <Dialog title="Hard reset demo?" onClose={() => setModal(null)}><p>Erase all demo notes, Journals, Shelves and demo preferences on this device, then restart from the EvieScratch logo and full onboarding.</p><p><strong>Normal-mode notes are in a separate library and will be kept.</strong></p>{error && <p className="form-error" role="alert">{error}</p>}<div className="dialog-actions"><button className="secondary-button" onClick={() => setModal(null)}>Keep demo</button><button className="danger-button" disabled={busy || appMode !== 'test'} onClick={() => void resetDemoNow()}>Reset demo from scratch</button></div></Dialog> : null;
  const brandPanel = modal?.type === 'brand' ? <Dialog title="EvieScratch" onClose={() => setModal(null)}><div className="brand-dialog-cat"><EviePortrait className="brand-dialog-portrait" awake={noteAwake} /><p>Your notes, neatly tucked away.<br />A little cat company.</p></div><div className="complete-note-options"><button onClick={showHome}><House size={20} aria-hidden="true" />Home</button><button onClick={replayOnboarding}><BookOpen size={20} aria-hidden="true" />Replay welcome & onboarding</button>{appMode === 'test' ? <button className="text-danger" onClick={() => openModal({ type: 'reset-demo' })}><Trash2 size={20} aria-hidden="true" />Hard reset demo</button> : <button onClick={() => void changeAppMode('test')}>Open Test mode</button>}</div></Dialog> : null;
  if (!startupError && !preferences.onboarded) return <><Onboarding key={introRun} mode={appMode} access={activeAccess} ready={ready && !busy} error={error} onReset={() => openModal({ type: 'brand' })} onFinish={async (plan, journalName, intent) => {
    await perform(async () => {
      if (intent !== 'explore' && appMode !== 'test') throw new Error('Secure checkout is not connected yet. No trial, subscription or payment has started.');
      if (journalName && !journals.some(item => item.name.toLocaleLowerCase() === journalName.toLocaleLowerCase())) await saveJournal(journalName, null);
      await refresh();
      const demoAccess = appMode === 'test' && plan && intent !== 'explore' ? createDemoAccess(plan, intent) : activeAccess;
      changePreferences({ onboarded: true, plan: plan ?? preferences.plan, guide: 0, demoAccess }); showHome();
    });
  }} />{brandPanel}{resetPanel}</>;
  return <AppNavigation.Provider value={() => openModal({ type: 'library' })}><div className="app-shell" data-mobile-view={mobileView} data-section={section} data-text-size={preferences.textSize} data-evie-visible={preferences.showEvie}>
    {appMode === 'test' && <div className="test-mode-banner"><strong>TEST MODE</strong><span>Demo data · Full local access</span><button onClick={() => openModal({ type: 'reset-demo' })}>Hard reset demo</button></div>}
    <header className="app-header" data-search-expanded={searchExpanded}><a className="skip-link" href="#note-body">Skip to note</a><button className="brand brand-button" aria-label="EvieScratch logo — welcome and demo reset" onClick={() => openModal({ type: 'brand' })}><span className="brand-mark"><BookOpen size={22} aria-hidden="true" /></span><span>EvieScratch<span className="brand-dot">.</span></span></button><span className="prototype-label">A little room for your thoughts</span><div className="header-actions"><div className={`global-search ${searchExpanded ? 'global-search-expanded' : ''}`}>{searchExpanded ? <><Search size={18} aria-hidden="true" /><input ref={searchInput} aria-label="Find anything" placeholder="Find anything" value={query} onChange={event => updateSearch(event.target.value)} onKeyDown={event => { if (event.key === 'Escape') closeSearch(); }} /><button className="icon-button global-search-close" aria-label="Close search" onClick={closeSearch}><X size={18} aria-hidden="true" /></button></> : <button className="icon-button global-search-open" aria-label="Find anything" title="Find anything" aria-expanded="false" onClick={startSearch}><Search size={21} aria-hidden="true" /></button>}</div><button className="trial-link" onClick={() => openModal({ type: 'plans' })}><Gift size={17} aria-hidden="true" /><span className="trial-button-copy"><span>{activeAccess?.kind === 'paid' ? 'Subscription' : '3 days free'}</span><TrialRemaining access={activeAccess} /></span></button><div className="mode-switch header-appearance" role="group" aria-label="Appearance"><button aria-pressed={mode === 'normal'} onPointerDown={event => event.preventDefault()} onClick={() => changeMode('normal')}><Sun size={16} aria-hidden="true" />Normal</button><button aria-pressed={mode === 'pixel'} onPointerDown={event => event.preventDefault()} onClick={() => changeMode('pixel')}><Grid2X2 size={16} aria-hidden="true" />Pixel Art</button></div><button className="icon-button app-menu-button" aria-label="Open app menu" title="Menu" onPointerDown={event => event.preventDefault()} aria-haspopup="dialog" aria-expanded={modal?.type === 'library'} onClick={() => openModal({ type: 'library' })}><Menu size={21} aria-hidden="true" /></button></div></header>
    {error && !modal && section !== 'notes' && <p className="notice" role="alert">{error}</p>}
    {!preferenceSaved && <p className="notice" role="status">Your preference changed, but this browser could not remember it for next time.</p>}
    {startupError ? <main className="recovery-screen"><TriangleAlert size={28} aria-hidden="true" /><h1>Let’s keep your notes safe.</h1><p>This browser could not open your saved library. Keep your browser data; close other EvieScratch tabs and retry, or download the original records for recovery.</p><div className="recovery-actions"><button className="primary-button" onClick={() => location.reload()}>Try again</button><button className="secondary-button" onClick={() => void recover()}><Download size={18} aria-hidden="true" />Download recovery snapshot</button></div>{error && <p role="alert">{error}</p>}</main> : <main className="workspace" aria-label="Your notes">
      <nav className="library-nav" aria-label="Library navigation">{navigation()}</nav>
      <aside className="notes-pane" aria-label={`${filterTitle} notes`}><div className="library-heading"><span className="eyebrow">YOUR NOTES</span><span className="local-label"><Check size={14} aria-hidden="true" />On this device</span></div><div className="inbox-heading"><h1>{filterTitle}</h1><span className="note-count">{visibleNotes.length}</span>{!noteAwake && sleepingCompanion}</div><div className="help-row"><HelpTip label="Search notes">Use Find anything in the top bar to search note titles, text and tags across your active notes. Turn on Include archived notes to search those too.</HelpTip><p className="search-scope">{query ? `Finding anything · title, text & tags` : `${filterTitle} · newest first`}</p></div>{query && !['archive', 'trash'].includes(filter.kind) && <label className="include-archived"><input type="checkbox" checked={includeArchived} onChange={event => setIncludeArchived(event.target.checked)} />Include archived notes</label>}<button className="primary-button new-note" disabled={busy || !ready} onClick={() => void addNote()}><Plus size={20} aria-hidden="true" />New note</button>
        <div className="note-list" aria-label="Notes">{search.pending && query ? <p className="empty-small" role="status">Searching your library…</p> : search.error && query ? <p className="form-error" role="alert">Search could not start. Reload after saving your draft.</p> : <>{visibleNotes.slice(0, visibleCount).map(note => <NoteCard key={note.id} note={note} journalName={journals.find(item => item.id === note.journalId)?.name} selected={session?.draft.id === note.id} disabled={busy} onOpen={() => void selectNote(note)} onOptions={() => { setActionNoteId(note.id); openModal({ type: 'note-options' }); }} />)}{!visibleNotes.length && ready && <div className="list-empty"><Search size={25} aria-hidden="true" /><strong>{query ? 'No matching notes' : filter.kind === 'trash' ? 'The litter box is empty' : 'A little room for something new'}</strong><p>{query ? 'Try another word or choose a different search scope.' : filter.kind === 'trash' ? 'Notes in the litter box can be restored here.' : 'Create a note whenever a thought comes along.'}</p></div>}{visibleNotes.length > visibleCount && <button className="secondary-button" onClick={() => setVisibleCount(count => count + 60)}>Show more notes</button>}</>}</div><p className="notes-pane-footer">Notes → Journals → optional Shelves</p>
      </aside>
      {section === 'home' && <Home library={library} busy={busy} draft={homeDraft} onDraftChange={setHomeDraft} showEvie={preferences.showEvie} onEvie={() => openModal({ type: 'evie' })} onCapture={capture} onNote={note => void selectNote(note)} onOptions={note => { setActionNoteId(note.id); openModal({ type: 'note-options' }); }} onJournals={showJournals} onJournal={id => void navigate({ kind: 'journal', id })} onNewJournal={() => openModal({ type: 'journal' })} />}
      {section === 'journals' && <Journals library={library} companion={sleepingCompanion} onOpen={(id, kind) => void navigate({ kind, id })} onNewJournal={shelfId => openModal(shelfId ? { type: 'journal', shelfId } : { type: 'journal' })} onEditJournal={current => openModal({ type: 'journal', current })} onNewShelf={() => openModal({ type: 'shelf' })} onEditShelf={current => openModal({ type: 'shelf', current })} />}
      <section className="editor-pane" aria-label="Note editor" aria-busy={busy} aria-hidden={busy || section !== 'notes'} inert={busy}>{error && !modal && <p className="notice" role="alert">{error}</p>}{session ? <Suspense fallback={<p className="loading-message" role="status">Opening your page…</p>}><NoteEditor key={session.draft.id} session={session} focusOnOpen={focusNewNote} readyForFocus={!busy && section === 'notes' && mobileView === 'editor'} journal={journal} guide={guide} attachments={library.attachments.filter(att => att.noteId === session.draft.id && !att.deletedAt)} onAttachmentChange={async () => { await refresh(); }} onHome={showHome} onBack={() => setMobileView('notes')} onOptions={() => { setActionNoteId(session.draft.id); openModal({ type: 'note-options' }); }} onPin={() => void metadata({ pinned: !session.draft.pinned }, session.draft.pinned ? 'Unpinned note.' : 'Pinned note.')} onArchive={() => void metadata({ archivedAt: session.draft.archivedAt ? null : new Date().toISOString() }, session.draft.archivedAt ? 'Note returned to your notes.' : 'Note archived.', { kind: session.draft.archivedAt ? 'all' : 'archive' })} onTrash={() => void metadata({ deletedAt: new Date().toISOString() }, 'Note moved to the litter box.', { kind: 'trash' })} onRestore={() => void metadata({ deletedAt: null }, 'Note restored.', { kind: session.draft.archivedAt ? 'archive' : 'all' })} /></Suspense> : <div className="editor-empty">{ready ? <><BookOpen size={38} aria-hidden="true" /><h2>Your next thought starts here.</h2><p>Create a note, or open one from your library.</p><button className="primary-button" onClick={() => void addNote()}><Plus size={18} aria-hidden="true" />New note</button><button className="text-button" onClick={() => openModal({ type: 'plans' })}>3 days free · View plans</button></> : <p role="status">Opening your notebook…</p>}</div>}</section>
      <nav className="mobile-navigation" aria-label="Main navigation"><button aria-current={section === 'home' ? 'page' : undefined} onClick={showHome}><House size={20} aria-hidden="true" />Home</button><button aria-current={section === 'notes' ? 'page' : undefined} onClick={() => { setSection('notes'); setMobileView('notes'); }}><BookOpen size={20} aria-hidden="true" />Notes</button><button aria-current={section === 'journals' ? 'page' : undefined} onClick={showJournals}><Layers size={20} aria-hidden="true" />Journals</button></nav>
    </main>}
    {toast && <div className="toast" role="status"><span>{toast.message}</span>{toast.undo && <button disabled={busy} onClick={() => void perform(async () => { await undoChange(toast.undo!); await refresh(); setToast({ message: 'Change undone.' }); })}>Undo</button>}<button className="icon-button" aria-label="Dismiss notification" onClick={() => setToast(undefined)}><X size={17} aria-hidden="true" /></button></div>}
    {modal?.type === 'settings' && <Settings mode={mode} changeMode={changeMode} preferences={preferences} changePreferences={changePreferences} onPlans={() => openModal({ type: 'plans' })} onReplay={replayOnboarding} appMode={appMode} access={activeAccess} onModeChange={next => void changeAppMode(next)} onReset={() => openModal({ type: 'reset-demo' })} onOpenStorage={() => openModal({ type: 'storage' })} onExportBackup={async () => { const { blob, filename } = await exportNativeBackup(); triggerBlobDownload(blob, filename); }} onExportMarkdown={async () => { const { blob, filename } = await exportReadableMarkdown(library); triggerBlobDownload(blob, filename); }} errorMessage={error} onClose={() => setModal(null)} />}
    {modal?.type === 'storage' && <StorageManager library={library} onRefresh={refresh} onOpenNote={noteId => { const note = library.notes.find(n => n.id === noteId); if (note) void selectNote(note); }} onClose={() => setModal(null)} />}
    {modal?.type === 'plans' && <Plans selected={preferences.plan} appMode={appMode} access={activeAccess} onChoose={async (plan, intent) => {
      if (appMode !== 'test') throw new Error('Secure checkout is not connected yet. No trial, subscription or payment has started.');
      if (!await flushCurrent()) return;
      changePreferences({ plan, demoAccess: createDemoAccess(plan, intent) }); setModal(null);
      setToast({ message: intent === 'trial' ? 'Test trial started — 3 days remaining. No real payment.' : 'Test purchase completed. No real payment.' });
    }} onClose={() => setModal(null)} />}
    {modal?.type === 'library' && <Dialog title="Your library" onClose={() => setModal(null)}><nav className="dialog-navigation" aria-label="Choose library view">{navigation(true)}</nav></Dialog>}
    {modal?.type === 'journal' && <JournalForm key={modal.current?.id ?? 'new-journal'} {...(modal.current ? { current: modal.current } : {})} {...(modal.shelfId ? { shelfId: modal.shelfId } : {})} shelves={shelves} busy={busy} error={error} onSave={(name, shelfId) => void perform(async () => { await saveJournal(name, shelfId, modal.current); await refresh(); setToast({ message: modal.current ? 'Journal updated.' : 'Journal created.' }); })} onDelete={() => modal.current && openModal({ type: 'delete-journal', current: modal.current })} onClose={() => setModal(null)} />}
    {modal?.type === 'shelf' && <ShelfForm key={modal.current?.id ?? 'new-shelf'} {...(modal.current ? { current: modal.current } : {})} busy={busy} error={error} onSave={name => void perform(async () => { await saveShelf(name, modal.current); await refresh(); setToast({ message: modal.current ? 'Shelf updated.' : 'Shelf created.' }); })} onDelete={() => modal.current && openModal({ type: 'delete-shelf', current: modal.current })} onClose={() => setModal(null)} />}
    {modal?.type === 'delete-journal' && <DeleteJournal journal={modal.current} library={library} busy={busy} error={error} onConfirm={(disposition, target) => void perform(async () => { const ticket = await deleteJournal(modal.current, disposition, target); await refresh(); setFilter({ kind: 'all' }); setToast({ message: ticket.label, undo: ticket }); })} onClose={() => setModal(null)} />}
    {modal?.type === 'delete-shelf' && <Dialog title={`Delete “${modal.current.name}”?`} onClose={() => setModal(null)}><p>The Shelf will be removed. Its Journals and all their notes will be kept. You can undo this change.</p>{error && <p role="alert" className="form-error">{error}</p>}<div className="dialog-actions"><button className="secondary-button" onClick={() => setModal(null)}>Cancel</button><button className="danger-button" disabled={busy} onClick={() => void perform(async () => { const ticket = await deleteShelf(modal.current); await refresh(); setToast({ message: ticket.label, undo: ticket }); })}>Delete Shelf</button></div></Dialog>}
    {preferences.showEvie && noteAwake && !startupError && <Companion awake onHide={() => changePreferences({ showEvie: false })} />}
    {brandPanel}{resetPanel}
    {modal?.type === 'evie' && <Dialog title="A little Evie company" onClose={() => setModal(null)}><p>Evie can stay beside your notes, or give you a little more room.</p><div className="dialog-actions"><button className="secondary-button" onClick={() => setModal(null)}>Keep Evie here</button><button className="primary-button" onClick={() => { changePreferences({ showEvie: false }); setModal(null); }}>Hide Evie</button></div><p className="small muted">Bring her back any time in Settings.</p></Dialog>}
    {modal?.type === 'note-options' && actionNote && <NoteOptions note={actionNote} busy={busy} onShelf={() => openModal({ type: 'move-shelf' })} onJournal={() => openModal({ type: 'move' })} onLitter={() => void metadata({ deletedAt: new Date().toISOString() }, 'Note moved to the litter box.', { kind: 'trash' }, actionNote.id)} onPin={() => void metadata({ pinned: !actionNote.pinned }, actionNote.pinned ? 'Note unpinned.' : 'Note pinned.', undefined, actionNote.id)} onArchive={() => void metadata({ archivedAt: actionNote.archivedAt ? null : new Date().toISOString() }, actionNote.archivedAt ? 'Note unarchived.' : 'Note archived.', undefined, actionNote.id)} onRestore={() => void metadata({ deletedAt: null }, 'Note restored.', undefined, actionNote.id)} onDownload={() => downloadJson({ format: 'eviescratch-note-draft', version: 1, note: actionNote }, `eviescratch-draft-${actionNote.id}.json`)} onClose={() => setModal(null)} />}
    {modal?.type === 'move-shelf' && actionNote && <MoveToShelf shelves={shelves} journals={journals} busy={busy} error={error} onMove={id => void metadata({ journalId: id }, 'Note moved to its Shelf and Journal.', undefined, actionNote.id)} onCreate={(shelfName, journalName, shelfId) => void createHomeAndMove(shelfName, journalName, shelfId)} onClose={() => setModal(null)} />}
    {modal?.type === 'move' && actionNote && <MoveNote journals={journals} shelves={shelves} currentId={actionNote.journalId} busy={busy} error={error} onMove={id => void metadata({ journalId: id }, 'Note moved to its Journal.', { kind: 'journal', id }, actionNote.id)} onCreate={name => void createHomeAndMove('', name)} onClose={() => setModal(null)} />}
  </div></AppNavigation.Provider>;
}
