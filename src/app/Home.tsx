import { BookOpen, Layers, PenLine, Pin, Plus, X } from 'lucide-react';
import type { Library } from '../data/database';
import type { Note } from '../domain/model';
import { HelpTip } from './HelpTip';
import { NoteCard } from './NoteCard';
import { EviePortrait } from './EviePortrait';

export function Home({ library, busy, draft, onDraftChange, showEvie, onCapture, onEvie, onNote, onOptions, onJournals, onJournal, onNewJournal }: {
  library: Library; busy: boolean; draft: string; onDraftChange: (value: string) => void; showEvie: boolean; onEvie: () => void; onCapture: (text: string) => Promise<boolean>;
  onNote: (note: Note) => void; onOptions: (note: Note) => void; onJournals: () => void; onJournal: (id: string) => void; onNewJournal: () => void;
}) {
  const notes = library.notes.filter(note => !note.deletedAt && !note.archivedAt).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  const journals = library.journals.filter(item => !item.deletedAt);
  const shelves = library.shelves.filter(item => !item.deletedAt);
  function card(note: Note) { return <NoteCard key={note.id} note={note} journalName={journals.find(item => item.id === note.journalId)?.name} disabled={busy} onOpen={() => onNote(note)} onOptions={() => onOptions(note)} />; }
  return <section className="home-screen" aria-labelledby="home-title"><header className="home-welcome"><div><p className="eyebrow">YOUR LITTLE CORNER</p><h1 id="home-title">A thought can start anywhere.</h1><p>Catch it here. Give it a home. Come back when you need it.</p></div>{showEvie && <button className="home-evie-button" aria-label="Evie — companion options" onClick={onEvie}><EviePortrait className="home-evie" /></button>}</header>
    <form className="quick-capture" onSubmit={event => { event.preventDefault(); void onCapture(draft).then(saved => { if (saved) onDraftChange(''); }); }}><div className="help-row"><label htmlFor="quick-thought"><PenLine size={19} aria-hidden="true" />What’s on your mind?</label><HelpTip label="Quick capture">Write a thought, then choose Save &amp; open note to save it in your default Journal and keep writing. An empty capture opens a new note.</HelpTip></div><div className="quick-capture-field"><textarea id="quick-thought" readOnly={busy} autoFocus value={draft} onChange={event => onDraftChange(event.target.value)} placeholder="A small idea, a reminder, a lovely little thing…" rows={3} aria-label="Quick note" maxLength={100_000} />{draft && <button type="button" className="icon-button" aria-label="Clear quick note" onClick={() => { onDraftChange(''); document.getElementById('quick-thought')?.focus(); }}><X size={18} aria-hidden="true" /></button>}</div><div className="capture-footer"><span>Saved on this device when you add it.</span><button className="primary-button" disabled={busy}><Plus size={18} aria-hidden="true" />{draft.trim() ? 'Save & open note' : 'New note'}</button></div></form>
    <div className="home-shortcuts"><button onClick={onJournals}><BookOpen size={20} aria-hidden="true" /><span>{journals.length} {journals.length === 1 ? 'Journal' : 'Journals'}<small>Give your notes a home</small></span></button><button onClick={onJournals}><Layers size={20} aria-hidden="true" /><span>{shelves.length} {shelves.length === 1 ? 'Shelf' : 'Shelves'}<small>Group related Journals</small></span></button></div>
    {notes.some(note => note.pinned) && <section className="home-notes"><div className="home-section-heading"><h2><Pin size={18} aria-hidden="true" />Kept close</h2></div><div className="home-card-grid">{notes.filter(note => note.pinned).slice(0, 3).map(card)}</div></section>}
    <section className="home-notes"><div className="home-section-heading"><h2>Pick up a thought</h2><span>{notes.length} {notes.length === 1 ? 'note' : 'notes'}</span></div><div className="home-card-grid">{notes.slice(0, 6).map(card)}</div>{!notes.length && <p className="empty-small">Your next note is a fresh beginning. Capture something above.</p>}</section>
    <section className="home-journals"><div className="home-section-heading"><h2>Your Journals</h2><button className="text-button" onClick={onNewJournal}><Plus size={17} aria-hidden="true" />New Journal</button></div><div className="home-journal-links">{journals.slice(0, 5).map(item => <button key={item.id} onClick={() => onJournal(item.id)}><BookOpen size={18} aria-hidden="true" />{item.name}</button>)}</div></section>
  </section>;
}
