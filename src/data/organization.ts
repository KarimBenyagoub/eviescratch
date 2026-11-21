import type { Entity, Journal, Note, Shelf } from '../domain/model';
import { journalSchema, shelfSchema } from '../domain/model';
import { parseNote } from '../editor/schema';
import { database, pending, ConcurrentEditError, type NotesDatabase } from './database';

type Entry<T> = { before: T; afterRevision: number };
export interface UndoChange {
  label: string;
  notes: Entry<Note>[];
  journals: Entry<Journal>[];
  shelves: Entry<Shelf>[];
  defaultJournal?: { before: string; after: string };
}
function undo(label: string): UndoChange { return { label, notes: [], journals: [], shelves: [] }; }
function revise<T extends Entity>(entity: T, changes: Partial<NoInfer<T>>): T {
  return { ...entity, ...changes, revision: changes.revision ?? entity.revision + 1, updatedAt: new Date().toISOString() };
}
function assertCurrent(entity: Entity | undefined, revision: number): asserts entity is Entity {
  if (!entity || entity.revision !== revision) throw new ConcurrentEditError();
}
async function activeJournal(id: string, db: NotesDatabase) {
  const journal = journalSchema.parse(await db.journals.get(id));
  if (journal.deletedAt) throw new Error('Choose an available Journal.');
  return journal;
}
async function putNote(previous: Note, next: Note, db: NotesDatabase) {
  const validated = parseNote(next);
  await activeJournal(validated.journalId, db);
  await db.checkpoints.put({ noteId: previous.id, note: previous });
  await db.notes.put(validated);
  await db.pendingChanges.put(pending(validated));
}
export async function updateNoteMetadata(id: string, revision: number, change: Partial<Pick<Note, 'journalId' | 'pinned' | 'archivedAt' | 'deletedAt'>>, label: string, db = database) {
  return db.transaction('rw', db.notes, db.journals, db.checkpoints, db.pendingChanges, async () => {
    const previous = parseNote(await db.notes.get(id));
    assertCurrent(previous, revision);
    const note = revise(previous, change);
    await putNote(previous, note, db);
    const ticket = undo(label);
    ticket.notes.push({ before: previous, afterRevision: note.revision });
    return { note, undo: ticket };
  });
}
export async function saveJournal(name: string, shelfId: string | null, current?: Journal, db = database) {
  return db.transaction('rw', db.journals, db.shelves, async () => {
    if (shelfId) {
      const shelf = shelfSchema.parse(await db.shelves.get(shelfId));
      if (shelf.deletedAt) throw new Error('Choose an available Shelf.');
    }
    if (current) assertCurrent(await db.journals.get(current.id), current.revision);
    const now = new Date().toISOString();
    const journal = journalSchema.parse(current ? revise(current, { name: name.trim(), shelfId }) : {
      id: crypto.randomUUID(), name: name.trim(), shelfId, sortKey: now,
      createdAt: now, updatedAt: now, deletedAt: null, revision: 0,
    });
    await db.journals.put(journal);
    return journal;
  });
}
export async function saveShelf(name: string, current?: Shelf, db = database) {
  return db.transaction('rw', db.shelves, async () => {
    if (current) assertCurrent(await db.shelves.get(current.id), current.revision);
    const now = new Date().toISOString();
    const shelf = shelfSchema.parse(current ? revise(current, { name: name.trim() }) : {
      id: crypto.randomUUID(), name: name.trim(), sortKey: now,
      createdAt: now, updatedAt: now, deletedAt: null, revision: 0,
    });
    await db.shelves.put(shelf);
    return shelf;
  });
}
export async function deleteShelf(shelf: Shelf, db = database) {
  return db.transaction('rw', db.shelves, db.journals, async () => {
    assertCurrent(await db.shelves.get(shelf.id), shelf.revision);
    const ticket = undo(`Deleted Shelf “${shelf.name}”. Its Journals were kept.`);
    const removed = revise(shelf, { deletedAt: new Date().toISOString() });
    await db.shelves.put(removed);
    ticket.shelves.push({ before: shelf, afterRevision: removed.revision });
    for (const journal of await db.journals.toArray()) {
      if (journal.shelfId !== shelf.id || journal.deletedAt) continue;
      const next = revise(journal, { shelfId: null });
      await db.journals.put(next);
      ticket.journals.push({ before: journal, afterRevision: next.revision });
    }
    return ticket;
  });
}
export async function deleteJournal(journal: Journal, disposition: 'move' | 'trash', targetId: string, db = database) {
  return db.transaction('rw', [db.journals, db.notes, db.settings, db.checkpoints, db.pendingChanges], async () => {
    assertCurrent(await db.journals.get(journal.id), journal.revision);
    if (journal.id === targetId) throw new Error('Choose a different Journal for these notes.');
    await activeJournal(targetId, db);
    const ticket = undo(`Deleted Journal “${journal.name}”.`);
    const defaultId = (await db.settings.get('defaultJournalId'))!.value;
    if (defaultId === journal.id) {
      await db.settings.put({ key: 'defaultJournalId', value: targetId });
      ticket.defaultJournal = { before: defaultId, after: targetId };
    }
    for (const previous of await db.notes.where('journalId').equals(journal.id).toArray()) {
      const next = revise(previous, { journalId: targetId, deletedAt: disposition === 'trash' ? previous.deletedAt ?? new Date().toISOString() : previous.deletedAt });
      await putNote(previous, next, db);
      ticket.notes.push({ before: previous, afterRevision: next.revision });
    }
    const removed = revise(journal, { deletedAt: new Date().toISOString() });
    await db.journals.put(removed);
    ticket.journals.push({ before: journal, afterRevision: removed.revision });
    return ticket;
  });
}
export async function undoChange(ticket: UndoChange, db = database) {
  return db.transaction('rw', [db.journals, db.shelves, db.notes, db.settings, db.checkpoints, db.pendingChanges], async () => {
    for (const entry of ticket.shelves) assertCurrent(await db.shelves.get(entry.before.id), entry.afterRevision);
    for (const entry of ticket.journals) assertCurrent(await db.journals.get(entry.before.id), entry.afterRevision);
    for (const entry of ticket.notes) assertCurrent(await db.notes.get(entry.before.id), entry.afterRevision);
    if (ticket.defaultJournal && (await db.settings.get('defaultJournalId'))?.value !== ticket.defaultJournal.after) throw new ConcurrentEditError();
    for (const entry of ticket.shelves) await db.shelves.put(revise(entry.before, { revision: entry.afterRevision + 1 }));
    for (const entry of ticket.journals) {
      if (entry.before.shelfId) {
        const shelf = await db.shelves.get(entry.before.shelfId);
        if (!shelf || shelf.deletedAt) throw new ConcurrentEditError();
      }
      await db.journals.put(revise(entry.before, { revision: entry.afterRevision + 1 }));
    }
    for (const entry of ticket.notes) {
      const current = parseNote(await db.notes.get(entry.before.id));
      await putNote(current, revise(entry.before, { revision: entry.afterRevision + 1 }), db);
    }
    if (ticket.defaultJournal) await db.settings.put({ key: 'defaultJournalId', value: ticket.defaultJournal.before });
  });
}
