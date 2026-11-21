import { useEffect, useRef } from 'react';
import { MoreHorizontal, Pin } from 'lucide-react';
import type { Note } from '../domain/model';
import { plainText } from '../search/index';
const date = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' });

export function NoteCard({ note, journalName, selected = false, disabled = false, onOpen, onOptions }: {
  note: Note; journalName?: string | undefined; selected?: boolean; disabled?: boolean; onOpen: () => void; onOptions: () => void;
}) {
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const pressed = useRef(false);
  const origin = useRef({ x: 0, y: 0 });
  useEffect(() => () => clearTimeout(timer.current), []);
  function cancel() { clearTimeout(timer.current); }
  return <article className={`note-card ${selected ? 'is-selected' : ''}`} onContextMenu={event => { event.preventDefault(); cancel(); onOptions(); }}>
    <button className="note-row" disabled={disabled} aria-current={selected ? 'true' : undefined}
      onPointerDown={event => { if (event.button !== 0 || disabled) return; pressed.current = false; origin.current = { x: event.clientX, y: event.clientY }; timer.current = setTimeout(() => { pressed.current = true; onOptions(); }, 500); }}
      onPointerMove={event => { if (Math.hypot(event.clientX - origin.current.x, event.clientY - origin.current.y) > 9) cancel(); }}
      onPointerUp={cancel} onPointerCancel={cancel} onPointerLeave={cancel}
      onKeyDown={event => { if (event.key === 'ContextMenu' || (event.shiftKey && event.key === 'F10')) { event.preventDefault(); onOptions(); } }}
      onClick={() => { cancel(); if (pressed.current) { pressed.current = false; return; } onOpen(); }}>
      <span className="note-row-title">{note.pinned && <Pin size={13} aria-label="Pinned" />}{note.title.trim() || 'Untitled note'}</span>
      <span className="note-row-preview">{plainText(note.document.content).trim().slice(0, 180) || 'A fresh page, just for you.'}</span>
      <span className="row-meta"><time dateTime={note.updatedAt}>{date.format(new Date(note.updatedAt))}</time><span>{journalName}</span></span>
      {note.tags.length > 0 && <span className="row-tags">{note.tags.slice(0, 3).map(tag => `#${tag}`).join(' ')}</span>}
    </button><button className="note-card-options icon-button" disabled={disabled} aria-label={`Options for ${note.title.trim() || 'Untitled note'}`} onClick={onOptions}><MoreHorizontal size={18} aria-hidden="true" /></button>
  </article>;
}
