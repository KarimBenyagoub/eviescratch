import 'fake-indexeddb/auto';
import Dexie from 'dexie';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ConcurrentEditError, NotesDatabase, commitNote, openLibrary } from '../../src/data/database';
import { SaveSession } from '../../src/data/save-session';
import { INBOX_ID, newNote, type Note } from '../../src/domain/model';
import { parseNote } from '../../src/editor/schema';

const databases: Dexie[] = [];
function testDatabase() {
  const db = new NotesDatabase(`eviescratch-test-${crypto.randomUUID()}`);
  databases.push(db);
  return db;
}
afterEach(async () => { for (const db of databases.splice(0)) { db.close(); await Dexie.delete(db.name); } });

describe('local data integrity', () => {
  it('creates exactly one Inbox and initial note, and reopens committed Unicode', async () => {
    const db = testDatabase();
    const [note] = await openLibrary(db);
    expect(note).toBeDefined();
    const saved = await commitNote({ ...note!, title: '思い出 · café 🐈' }, 0, db);
    db.close();
    expect(await openLibrary(db)).toEqual([saved]);
    expect(await db.journals.count()).toBe(1);
    expect((await db.journals.get(INBOX_ID))?.name).toBe('Inbox');
  });

  it('commits the previous checkpoint, note, and pending change together', async () => {
    const db = testDatabase();
    const [original] = await openLibrary(db);
    const saved = await commitNote({ ...original!, title: 'One thought' }, 0, db);
    expect(saved.revision).toBe(1);
    expect((await db.checkpoints.get(saved.id))?.note).toEqual(original);
    expect((await db.pendingChanges.get(saved.id))?.revision).toBe(1);
  });

  it('rolls back the entire transaction when a later write fails', async () => {
    const db = testDatabase();
    const [original] = await openLibrary(db);
    db.pendingChanges.hook('updating', () => { throw new DOMException('Injected full storage', 'QuotaExceededError'); });
    await expect(commitNote({ ...original!, title: 'Must not commit' }, 0, db)).rejects.toThrow();
    expect(await db.notes.get(original!.id)).toEqual(original);
    expect(await db.checkpoints.get(original!.id)).toBeUndefined();
    expect((await db.pendingChanges.get(original!.id))?.revision).toBe(0);
  });

  it('rejects a stale tab instead of overwriting the newer committed note', async () => {
    const db = testDatabase();
    const [original] = await openLibrary(db);
    const newer = await commitNote({ ...original!, title: 'Other tab' }, 0, db);
    await expect(commitNote({ ...original!, title: 'Stale tab' }, 0, db)).rejects.toBeInstanceOf(ConcurrentEditError);
    expect(await db.notes.get(original!.id)).toEqual(newer);
  });

  it('refuses corrupted records and orphaned notes without deleting them', async () => {
    const db = testDatabase();
    const [original] = await openLibrary(db);
    await db.notes.put({ ...original!, journalId: crypto.randomUUID() });
    await expect(openLibrary(db)).rejects.toThrow('missing Journal');
    expect(await db.notes.count()).toBe(1);
    await db.notes.put({ ...original!, document: { schemaVersion: 1, content: { type: 'script' } } });
    await expect(openLibrary(db)).rejects.toThrow();
    expect((await db.notes.get(original!.id))?.document.content.type).toBe('script');
  });

  it('migrates valid v1 data with its IDs, formatting, and a pending record preserved', async () => {
    const db = testDatabase();
    const old = new Dexie(db.name);
    old.version(1).stores({ notes: '&id,journalId,updatedAt', journals: '&id' });
    const note = newNote();
    await old.table('journals').add({ id: INBOX_ID, name: 'Inbox', shelfId: null, sortKey: '0', createdAt: note.createdAt, updatedAt: note.updatedAt, revision: 0, deletedAt: null });
    await old.table('notes').add(note);
    old.close();
    expect(await openLibrary(db)).toEqual([note]);
    expect((await db.pendingChanges.get(note.id))?.revision).toBe(0);
  });

  it('aborts an invalid v1 migration and preserves the original database version and bytes', async () => {
    const db = testDatabase();
    const old = new Dexie(db.name);
    old.version(1).stores({ notes: '&id,journalId,updatedAt', journals: '&id' });
    const invalid = { id: 'invalid-record', title: 'Do not erase' };
    await old.table('notes').add(invalid);
    old.close();
    await expect(openLibrary(db)).rejects.toThrow();
    const raw = new Dexie(db.name);
    await raw.open();
    expect(raw.verno).toBe(1);
    expect(await raw.table('notes').toArray()).toEqual([invalid]);
    raw.close();
  });

  it('rejects unsupported editor nodes, marks, and schema versions', () => {
    const note = newNote();
    expect(() => parseNote({ ...note, document: { schemaVersion: 2, content: { type: 'doc' } } })).toThrow();
    expect(() => parseNote({ ...note, document: { schemaVersion: 1, content: { type: 'doc', content: [{ type: 'image', attrs: { src: 'https://example.com/track' } }] } } })).toThrow();
    expect(() => parseNote({ ...note, document: { schemaVersion: 1, content: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'unsafe', marks: [{ type: 'link', attrs: { href: 'javascript:alert(1)' } }] }] }] } } })).toThrow();
  });
});

describe('save queue', () => {
  it('keeps Saving while newer edits wait behind an in-flight write', async () => {
    const original = newNote();
    let completeFirst!: (note: Note) => void;
    const writer = vi.fn().mockImplementationOnce(() => new Promise<Note>(resolve => { completeFirst = resolve; }))
      .mockImplementation(async (note: Note, revision: number) => ({ ...note, revision: revision + 1 }));
    const onCommit = vi.fn();
    const session = new SaveSession(original, onCommit, writer);
    const states: string[] = [];
    session.subscribe(() => { states.push(session.getSnapshot().status); });
    session.edit({ title: 'First edit' });
    const saving = session.flush();
    session.edit({ title: 'Latest edit' });
    expect(session.getSnapshot().status).toBe('saving');
    completeFirst({ ...original, title: 'First edit', revision: 1 });
    expect(await saving).toBe(true);
    expect(writer).toHaveBeenCalledTimes(2);
    expect(writer.mock.calls[1]?.[1]).toBe(1);
    expect(onCommit.mock.calls[1]?.[0].title).toBe('Latest edit');
    expect(states.filter(state => state === 'saved')).toHaveLength(1);
    expect(session.dirty).toBe(false);
  });

  it('keeps a failed draft dirty and retryable without a fake Saved state', async () => {
    const writer = vi.fn().mockRejectedValueOnce(new Error('Full storage'))
      .mockImplementation(async (note: Note, revision: number) => ({ ...note, revision: revision + 1 }));
    const session = new SaveSession(newNote(), vi.fn(), writer);
    session.edit({ title: 'Keep this draft' });
    expect(await session.flush()).toBe(false);
    expect(session.getSnapshot().status).toBe('failed');
    expect(session.dirty).toBe(true);
    expect(session.draft.title).toBe('Keep this draft');
    expect(await session.flush()).toBe(true);
    expect(session.getSnapshot().status).toBe('saved');
  });
});
