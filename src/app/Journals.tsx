import { useState, type FormEvent, type ReactNode } from 'react';
import { BookOpen, Layers, MoreHorizontal, Plus, Search } from 'lucide-react';
import type { Journal, Shelf } from '../domain/model';
import type { Library } from '../data/database';
import { HelpTip } from './HelpTip';
import { Dialog } from './Dialog';
import { ClearableInput } from './ClearableInput';

export function Journals({ library, companion, onOpen, onNewJournal, onEditJournal, onNewShelf, onEditShelf }: {
  library: Library; companion: ReactNode; onOpen: (id: string, kind: 'journal' | 'shelf') => void;
  onNewJournal: (shelfId?: string) => void; onEditJournal: (journal: Journal) => void;
  onNewShelf: () => void; onEditShelf: (shelf: Shelf) => void;
}) {
  const [query, setQuery] = useState('');
  const journals = library.journals.filter(item => !item.deletedAt);
  const shelves = library.shelves.filter(item => !item.deletedAt);
  const count = (id: string) => library.notes.filter(note => note.journalId === id && !note.deletedAt).length;
  const matches = (journal: Journal) => journal.name.toLocaleLowerCase().includes(query.toLocaleLowerCase());
  function row(journal: Journal) {
    return <div className="journal-row" key={journal.id}><button className="journal-open" onClick={() => onOpen(journal.id, 'journal')}><span className="journal-book"><BookOpen size={23} aria-hidden="true" /></span><span><strong>{journal.name}</strong><small>{count(journal.id)} {count(journal.id) === 1 ? 'note' : 'notes'}{journal.id === library.defaultJournalId ? ' · Default Journal' : ''}</small></span></button><button className="icon-button" aria-label={`Manage Journal ${journal.name}`} onClick={() => onEditJournal(journal)}><MoreHorizontal size={20} aria-hidden="true" /></button></div>;
  }
  return <section className="journal-directory" aria-labelledby="journals-heading"><div className="directory-header"><div className="directory-intro"><div><p className="eyebrow">A HOME FOR EVERY THOUGHT</p><div className="help-row"><h1 id="journals-heading">Your Journals</h1><HelpTip label="Journals and Shelves">Every note belongs to a Journal. Shelves optionally group Journals. Use the three dots beside a Journal or Shelf to rename or manage it. File a note from its note options.</HelpTip></div><p>Notes belong in Journals. Shelves keep related Journals together.</p></div>{companion}</div><div className="directory-actions"><button className="secondary-button" onClick={onNewShelf}><Layers size={18} aria-hidden="true" />New Shelf</button><button className="primary-button" onClick={() => onNewJournal()}><Plus size={19} aria-hidden="true" />New Journal</button></div></div>
    <label className="search-field directory-search"><Search size={18} aria-hidden="true" /><ClearableInput onClear={() => setQuery('')} aria-label="Find a Journal" placeholder="Find a Journal…" value={query} onChange={event => setQuery(event.target.value)} /></label>
    <section className="shelf-group"><h2>Journals without a Shelf</h2>{journals.filter(journal => !journal.shelfId && matches(journal)).map(row)}{!journals.some(journal => !journal.shelfId && matches(journal)) && <p className="empty-small">No matching Journals here.</p>}</section>
    {shelves.map(shelf => <section className="shelf-group" key={shelf.id}><div className="shelf-heading"><button onClick={() => onOpen(shelf.id, 'shelf')}><Layers size={19} aria-hidden="true" /><h2>{shelf.name}</h2></button><div><button className="icon-button" aria-label={`Add Journal to ${shelf.name}`} onClick={() => onNewJournal(shelf.id)}><Plus size={18} aria-hidden="true" /></button><button className="icon-button" aria-label={`Manage Shelf ${shelf.name}`} onClick={() => onEditShelf(shelf)}><MoreHorizontal size={20} aria-hidden="true" /></button></div></div>{journals.filter(journal => journal.shelfId === shelf.id && matches(journal)).map(row)}{!journals.some(journal => journal.shelfId === shelf.id && matches(journal)) && <p className="empty-small">Add a Journal to this Shelf when you’re ready.</p>}</section>)}
  </section>;
}

export function JournalForm({ current, shelfId, shelves, busy, error, onSave, onDelete, onClose }: {
  current?: Journal; shelfId?: string; shelves: Shelf[]; busy: boolean; error: string;
  onSave: (name: string, shelfId: string | null) => void; onDelete: () => void; onClose: () => void;
}) {
  const [name, setName] = useState(current?.name ?? '');
  const [shelf, setShelf] = useState(current?.shelfId ?? shelfId ?? '');
  function submit(event: FormEvent) { event.preventDefault(); onSave(name.trim(), shelf || null); }
  return <Dialog title={current ? 'Manage Journal' : 'New Journal'} onClose={onClose}><form onSubmit={submit} className="dialog-form"><p className="muted">A Journal is a home for related notes. Add a Shelf only if you need one.</p><label className="field-label">Journal name<ClearableInput aria-label="Journal name" clearLabel="Clear Journal name" onClear={() => setName('')} autoFocus required maxLength={200} value={name} placeholder="e.g. Little ideas" onChange={event => setName(event.target.value)} /></label><label className="field-label">Shelf<select aria-label="Shelf" value={shelf} onChange={event => setShelf(event.target.value)}><option value="">No Shelf</option>{shelves.filter(item => !item.deletedAt).map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>{error && <p role="alert" className="form-error">{error}</p>}<div className="dialog-actions">{current && <button type="button" className="text-danger" disabled={busy} onClick={onDelete}>Delete Journal</button>}<button type="button" className="secondary-button" onClick={onClose}>Cancel</button><button className="primary-button" disabled={busy || !name.trim()}>{current ? 'Save Journal' : 'Create Journal'}</button></div></form></Dialog>;
}

export function ShelfForm({ current, busy, error, onSave, onDelete, onClose }: {
  current?: Shelf; busy: boolean; error: string; onSave: (name: string) => void; onDelete: () => void; onClose: () => void;
}) {
  const [name, setName] = useState(current?.name ?? '');
  return <Dialog title={current ? 'Manage Shelf' : 'New Shelf'} onClose={onClose}><form className="dialog-form" onSubmit={event => { event.preventDefault(); onSave(name.trim()); }}><p className="muted">A Shelf groups Journals. Your notes stay inside their Journals.</p><label className="field-label">Shelf name<ClearableInput aria-label="Shelf name" clearLabel="Clear Shelf name" onClear={() => setName('')} autoFocus required maxLength={200} value={name} placeholder="e.g. Everyday life" onChange={event => setName(event.target.value)} /></label>{error && <p role="alert" className="form-error">{error}</p>}<div className="dialog-actions">{current && <button type="button" className="text-danger" disabled={busy} onClick={onDelete}>Delete Shelf</button>}<button type="button" className="secondary-button" onClick={onClose}>Cancel</button><button className="primary-button" disabled={busy || !name.trim()}>{current ? 'Save Shelf' : 'Create Shelf'}</button></div></form></Dialog>;
}

export function DeleteJournal({ journal, library, busy, error, onConfirm, onClose }: {
  journal: Journal; library: Library; busy: boolean; error: string; onConfirm: (mode: 'move' | 'trash', targetId: string) => void; onClose: () => void;
}) {
  const alternatives = library.journals.filter(item => !item.deletedAt && item.id !== journal.id);
  const [mode, setMode] = useState<'move' | 'trash'>('move');
  const [target, setTarget] = useState(alternatives.find(item => item.id === library.defaultJournalId)?.id ?? alternatives[0]?.id ?? '');
  return <Dialog title={`Delete “${journal.name}”?`} onClose={onClose}><form className="dialog-form" onSubmit={event => { event.preventDefault(); onConfirm(mode, target); }}><p>Choose what happens to its notes. You can undo this change.</p><label className="radio-row"><input type="radio" name="disposition" checked={mode === 'move'} onChange={() => setMode('move')} />Move notes into another Journal</label><label className="radio-row"><input type="radio" name="disposition" checked={mode === 'trash'} onChange={() => setMode('trash')} />Put notes in the litter box</label><label className="field-label">{mode === 'move' ? 'Destination Journal' : 'Journal for notes if restored'}<select aria-label={mode === 'move' ? 'Destination Journal' : 'Journal for notes if restored'} required value={target} onChange={event => setTarget(event.target.value)}>{alternatives.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>{journal.id === library.defaultJournalId && <p className="small muted">This is your default Journal. The selected Journal will become the new default.</p>}{!alternatives.length && <p className="form-error">Create another Journal first so your notes always have a home.</p>}{error && <p className="form-error" role="alert">{error}</p>}<div className="dialog-actions"><button type="button" className="secondary-button" onClick={onClose}>Cancel</button><button className="danger-button" disabled={busy || !target}>Delete Journal</button></div></form></Dialog>;
}

export function MoveNote({ journals, shelves, currentId, busy, error, onMove, onCreate, onClose }: {
  journals: Journal[]; shelves: Shelf[]; currentId: string; busy: boolean; error: string;
  onMove: (id: string) => void; onCreate: (name: string) => void; onClose: () => void;
}) {
  const [query, setQuery] = useState('');
  return <Dialog title="Move note" onClose={onClose}><p className="muted">Choose a Journal. Your note and its formatting stay together.</p><label className="search-field move-search"><Search size={18} aria-hidden="true" /><ClearableInput onClear={() => setQuery('')} autoFocus aria-label="Find destination Journal" value={query} onChange={event => setQuery(event.target.value)} placeholder="Find or create a Journal…" maxLength={200} /></label><div className="move-destinations">{journals.filter(item => !item.deletedAt && item.name.toLocaleLowerCase().includes(query.toLocaleLowerCase())).map(item => <button className="move-destination" key={item.id} disabled={busy || item.id === currentId} onClick={() => onMove(item.id)}><BookOpen size={20} aria-hidden="true" /><span><strong>{item.name}</strong><small>{item.id === currentId ? 'Current Journal' : shelves.find(shelf => shelf.id === item.shelfId)?.name ?? 'No Shelf'}</small></span></button>)}</div>{query.trim() && !journals.some(item => !item.deletedAt && item.name.toLocaleLowerCase() === query.trim().toLocaleLowerCase()) && <button className="secondary-button" disabled={busy} onClick={() => onCreate(query.trim())}><Plus size={18} aria-hidden="true" />Create “{query.trim()}” and move</button>}{error && <p className="form-error" role="alert">{error}</p>}</Dialog>;
}
