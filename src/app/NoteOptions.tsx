import { Archive, BookOpen, Download, Layers, Pin, RotateCcw, Trash2 } from 'lucide-react';
import { HelpTip } from './HelpTip';
import { Dialog } from './Dialog';
import type { Note } from '../domain/model';
export function NoteOptions({ note, busy, onShelf, onJournal, onLitter, onPin, onArchive, onRestore, onDownload, onClose }: {
  note: Note; busy: boolean; onShelf: () => void; onJournal: () => void; onLitter: () => void; onPin: () => void;
  onArchive: () => void; onRestore: () => void; onDownload: () => void; onClose: () => void;
}) {
  return <Dialog title="Note options" onClose={onClose}><div className="help-row"><p className="options-note-name">{note.title.trim() || 'Untitled note'}</p><HelpTip label="Note actions">Pin keeps a note close on Home. Archive keeps it out of active notes. The litter box lets you restore removed notes. Download note draft exports JSON; complete backup and restore are still being built.</HelpTip></div><div className="complete-note-options">{note.deletedAt ? <button disabled={busy} onClick={onRestore}><RotateCcw size={20} aria-hidden="true" />Restore note</button> : <>
    <button disabled={busy} onClick={onShelf}><Layers size={20} aria-hidden="true" /><span>Move to Shelf<small>Choose a Journal on a Shelf</small></span></button>
    <button disabled={busy} onClick={onJournal}><BookOpen size={20} aria-hidden="true" />Move to Journal</button>
    <button className="pin-option" aria-pressed={note.pinned} disabled={busy} onClick={onPin}><Pin fill={note.pinned ? 'currentColor' : 'none'} size={20} aria-hidden="true" />{note.pinned ? 'Unpin note' : 'Pin note'}</button>
    <button disabled={busy} onClick={onArchive}><Archive size={20} aria-hidden="true" />{note.archivedAt ? 'Unarchive note' : 'Archive note'}</button>
    <button disabled={busy} className="text-danger" onClick={onLitter}><Trash2 size={20} aria-hidden="true" /><span>Move to litter box<small>You can restore it later</small></span></button>
  </>}<button onClick={onDownload}><Download size={20} aria-hidden="true" />Download note draft</button></div></Dialog>;
}
