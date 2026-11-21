import 'fake-indexeddb/auto';
import Dexie from 'dexie';
import { afterEach, expect, it } from 'vitest';
import { NotesDatabase, openLibrary, readLibrary, commitNote } from '../../src/data/database';
import { deleteJournal, deleteShelf, saveJournal, saveShelf, undoChange, updateNoteMetadata } from '../../src/data/organization';
import { LibrarySearch } from '../../src/search/index';
import { newNote } from '../../src/domain/model';

const databases: NotesDatabase[] = [];
async function setup() {
  const db = new NotesDatabase(`organization-${crypto.randomUUID()}`);
  databases.push(db);
  const [note] = await openLibrary(db);
  return { db, note: note! };
}
afterEach(async () => { for (const db of databases.splice(0)) { db.close(); await Dexie.delete(db.name); } });

it('moves a Unicode note without changing its ID, body, tags, or creation date', async () => {
  const { db, note } = await setup();
  const journal = await saveJournal('思い出 🐈 — a very long Journal title', null, undefined, db);
  const rich = await commitNote({ ...note, title: 'café', tags: ['travel'], document: { schemaVersion: 1, content: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Keep this', marks: [{ type: 'bold' }] }] }] } } }, 0, db);
  const moved = await updateNoteMetadata(rich.id, rich.revision, { journalId: journal.id }, 'Moved', db);
  expect(moved.note).toMatchObject({ id: rich.id, document: rich.document, tags: rich.tags, createdAt: rich.createdAt, journalId: journal.id });
  await undoChange(moved.undo, db);
  const restored = await db.notes.get(note.id);
  expect(restored?.journalId).toBe(note.journalId);
  expect(restored?.revision).toBe(moved.note.revision + 1);
});

it('deleting a Shelf unfiles its Journals, keeps all notes, and can be undone', async () => {
  const { db } = await setup();
  const shelf = await saveShelf('Everyday', undefined, db);
  const journal = await saveJournal('Ideas', shelf.id, undefined, db);
  const ticket = await deleteShelf(shelf, db);
  expect((await db.journals.get(journal.id))?.shelfId).toBeNull();
  expect(await db.notes.count()).toBe(1);
  await undoChange(ticket, db);
  expect((await db.journals.get(journal.id))?.shelfId).toBe(shelf.id);
  expect((await db.shelves.get(shelf.id))?.deletedAt).toBeNull();
});

it('deleting the default Journal moves every note and chooses a valid replacement; Undo restores it', async () => {
  const { db, note } = await setup();
  const original = (await db.journals.get(note.journalId))!;
  const replacement = await saveJournal('New Inbox', null, undefined, db);
  const ticket = await deleteJournal(original, 'move', replacement.id, db);
  const library = await readLibrary(db);
  expect(library.defaultJournalId).toBe(replacement.id);
  expect(library.notes[0]?.journalId).toBe(replacement.id);
  expect(library.notes[0]?.deletedAt).toBeNull();
  await undoChange(ticket, db);
  expect((await readLibrary(db)).defaultJournalId).toBe(original.id);
  expect((await db.notes.get(note.id))?.journalId).toBe(original.id);
  expect((await db.journals.get(original.id))?.deletedAt).toBeNull();
});

it('Journal deletion with Trash keeps a valid recovery Journal and original content', async () => {
  const { db, note } = await setup();
  const original = (await db.journals.get(note.journalId))!;
  const target = await saveJournal('Recovery home', null, undefined, db);
  await deleteJournal(original, 'trash', target.id, db);
  const trashed = (await db.notes.get(note.id))!;
  expect(trashed.deletedAt).not.toBeNull();
  expect(trashed.document).toEqual(note.document);
  expect(trashed.journalId).toBe(target.id);
  const result = await updateNoteMetadata(trashed.id, trashed.revision, { deletedAt: null }, 'Restored', db);
  expect(result.note.deletedAt).toBeNull();
  expect(result.note.journalId).toBe(target.id);
});

it('refuses Journal self-moves and rolls back failed bulk deletion atomically', async () => {
  const { db, note } = await setup();
  const journal = (await db.journals.get(note.journalId))!;
  await expect(deleteJournal(journal, 'move', journal.id, db)).rejects.toThrow('different Journal');
  const target = await saveJournal('Target', null, undefined, db);
  db.pendingChanges.hook('updating', () => { throw new Error('Injected write failure'); });
  await expect(deleteJournal(journal, 'move', target.id, db)).rejects.toThrow();
  expect((await db.journals.get(journal.id))?.deletedAt).toBeNull();
  expect((await db.notes.get(note.id))?.journalId).toBe(journal.id);
  expect((await db.settings.get('defaultJournalId'))?.value).toBe(journal.id);
});

it('Undo cannot overwrite a subsequent edit or resurrect a stale revision', async () => {
  const { db, note } = await setup();
  const pinned = await updateNoteMetadata(note.id, note.revision, { pinned: true }, 'Pinned', db);
  const edited = await commitNote({ ...pinned.note, title: 'Later edit' }, pinned.note.revision, db);
  await expect(undoChange(pinned.undo, db)).rejects.toThrow();
  expect(await db.notes.get(note.id)).toEqual(edited);
});

it('search indexes body/title/tags, Unicode and diacritics, then replaces and removes old terms', () => {
  const index = new LibrarySearch();
  const note = { ...newNote(), title: 'Café 思い出 🐈', tags: ['travel'], document: { schemaVersion: 1 as const, content: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Ginger notebook' }] }] } } };
  index.update([note]);
  for (const term of ['cafe', '思い出', '🐈', 'travel', 'notebook']) expect(index.search(term)).toContain(note.id);
  index.update([{ ...note, title: 'New title', tags: ['home'], document: newNote().document }]);
  expect(index.search('travel')).not.toContain(note.id);
  expect(index.search('notebook')).not.toContain(note.id);
  expect(index.search('home')).toContain(note.id);
  index.update([], [note.id]);
  expect(index.search('home')).toEqual([]);
});

it('upgrades existing v2 notes without tags without changing identity/content', async () => {
  const db = new NotesDatabase(`organization-${crypto.randomUUID()}`);
  databases.push(db);
  const old = new Dexie(db.name);
  old.version(2).stores({ notes: '&id,journalId,updatedAt', journals: '&id', checkpoints: '&noteId', pendingChanges: '&noteId' });
  const current = newNote();
  const { tags: _tags, ...original } = current;
  await old.table('notes').add(original);
  await old.table('journals').add({ id: current.journalId, name: 'Inbox', shelfId: null, sortKey: '0', createdAt: current.createdAt, updatedAt: current.updatedAt, deletedAt: null, revision: 0 });
  old.close();
  const notes = await openLibrary(db);
  expect(notes[0]).toEqual({ ...original, tags: [] });
});
