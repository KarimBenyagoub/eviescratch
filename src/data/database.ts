import Dexie, { type Table } from 'dexie';
import { INBOX_ID, journalSchema, shelfSchema, attachmentSchema, MAX_ATTACHMENT_SIZE_BYTES, newNote, type Journal, type Note, type Shelf, type Attachment, type AttachmentData } from '../domain/model';
import { parseNote } from '../editor/schema';
import { databaseName, readAppMode } from '../app/environment';

export const DATABASE_NAME = databaseName(readAppMode());
export interface Checkpoint { noteId: string; note: Note }
export interface PendingChange { noteId: string; revision: number; updatedAt: string }

export class NotesDatabase extends Dexie {
  notes!: Table<Note, string>;
  journals!: Table<Journal, string>;
  checkpoints!: Table<Checkpoint, string>;
  pendingChanges!: Table<PendingChange, string>;
  shelves!: Table<Shelf, string>;
  settings!: Table<{ key: string; value: string }, string>;
  attachments!: Table<Attachment, string>;
  attachmentData!: Table<AttachmentData, string>;

  constructor(name = DATABASE_NAME) {
    super(name);
    this.version(1).stores({ notes: '&id,journalId,updatedAt', journals: '&id' });
    this.version(2).stores({ checkpoints: '&noteId', pendingChanges: '&noteId' })
      .upgrade(async transaction => {
        const notes = (await transaction.table('notes').toArray()).map(parseNote);
        (await transaction.table('journals').toArray()).forEach(value => journalSchema.parse(value));
        await transaction.table('pendingChanges').bulkPut(notes.map(note => ({
          noteId: note.id, revision: note.revision, updatedAt: note.updatedAt,
        })));
      });
    this.version(3).stores({ shelves: '&id', settings: '&key' }).upgrade(async transaction => {
      const notes = (await transaction.table('notes').toArray()).map(parseNote);
      await transaction.table('notes').bulkPut(notes);
      await transaction.table('settings').put({ key: 'defaultJournalId', value: INBOX_ID });
    });
    this.version(4).stores({
      attachments: '&id,noteId,createdAt,deletedAt',
      attachmentData: '&id',
    });
    this.on('versionchange', () => this.close());
  }
}
export class ConcurrentEditError extends Error {
  constructor() { super('This note changed in another tab. Download your draft, then reload to review the saved version.'); }
}
export const database = new NotesDatabase();
export function pending(note: Note): PendingChange {
  return { noteId: note.id, revision: note.revision, updatedAt: note.updatedAt };
}

/** Validate the small T01 library before allowing writes. Never silently reset it. */
export async function openLibrary(db = database): Promise<Note[]> {
  await db.open();
  return db.transaction('rw', db.notes, db.journals, db.shelves, db.settings, db.pendingChanges, async () => {
    const journals = (await db.journals.toArray()).map(value => journalSchema.parse(value));
    const notes = (await db.notes.toArray()).map(parseNote);
    const shelves = (await db.shelves.toArray()).map(value => shelfSchema.parse(value));
    for (const journal of journals.filter(item => !item.deletedAt)) {
      if (journal.shelfId && !shelves.some(shelf => shelf.id === journal.shelfId && !shelf.deletedAt)) throw new Error('A Journal references a missing Shelf.');
    }
    for (const note of notes) {
      if (!journals.some(journal => journal.id === note.journalId && !journal.deletedAt)) {
        throw new Error('A note references a missing Journal. Download a recovery snapshot before changing browser storage.');
      }
    }
    if (journals.length === 0) {
      const now = new Date().toISOString();
      await db.journals.add(journalSchema.parse({
        id: INBOX_ID, name: 'Inbox', shelfId: null, sortKey: '0',
        createdAt: now, updatedAt: now, revision: 0, deletedAt: null,
      }));
    }
    const defaultSetting = await db.settings.get('defaultJournalId');
    const defaultId = defaultSetting?.value ?? INBOX_ID;
    const defaultJournal = await db.journals.get(defaultId);
    if (!defaultJournal || defaultJournal.deletedAt) throw new Error('The default Journal is unavailable.');
    if (!defaultSetting) await db.settings.put({ key: 'defaultJournalId', value: defaultId });
    if (notes.length === 0) {
      const note = newNote(defaultId);
      await db.notes.add(note);
      await db.pendingChanges.put(pending(note));
      notes.push(note);
    }
    return notes
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt) || a.id.localeCompare(b.id));
  });
}
export async function createNote(db = database, journalId?: string): Promise<Note> {
  return db.transaction('rw', db.notes, db.journals, db.settings, db.pendingChanges, async () => {
    const defaultId = (await db.settings.get('defaultJournalId'))?.value ?? INBOX_ID;
    const note = newNote(journalId ?? defaultId);
    const journal = journalSchema.parse(await db.journals.get(note.journalId));
    if (journal.deletedAt) throw new Error('Inbox is unavailable. Reload before creating a note.');
    await db.notes.add(note);
    await db.pendingChanges.put(pending(note));
    return note;
  });
}
export async function commitNote(draft: Note, expectedRevision: number, db = database): Promise<Note> {
  const validated = parseNote(draft);
  return db.transaction('rw', db.notes, db.journals, db.checkpoints, db.pendingChanges, async () => {
    const previous = parseNote(await db.notes.get(validated.id));
    if (previous.revision !== expectedRevision || previous.deletedAt) throw new ConcurrentEditError();
    const journal = journalSchema.parse(await db.journals.get(validated.journalId));
    if (journal.deletedAt) throw new ConcurrentEditError();
    const committed = parseNote({ ...validated, revision: expectedRevision + 1, updatedAt: new Date().toISOString() });
    await db.checkpoints.put({ noteId: previous.id, note: previous });
    await db.notes.put(committed);
    await db.pendingChanges.put(pending(committed));
    return committed;
  });
}

export async function readLibrary(db = database) {
  return db.transaction('r', db.notes, db.journals, db.shelves, db.settings, db.attachments, async () => ({
    notes: (await db.notes.toArray()).map(parseNote),
    journals: (await db.journals.toArray()).map(value => journalSchema.parse(value)),
    shelves: (await db.shelves.toArray()).map(value => shelfSchema.parse(value)),
    attachments: (await db.attachments.toArray()).map(value => attachmentSchema.parse(value)),
    defaultJournalId: (await db.settings.get('defaultJournalId'))?.value ?? INBOX_ID,
  }));
}
export type Library = Awaited<ReturnType<typeof readLibrary>>;

export async function calculateChecksum(bytes: Uint8Array): Promise<string> {
  const hashBuffer = await crypto.subtle.digest('SHA-256', bytes as unknown as ArrayBuffer);
  return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function readAttachmentData(id: string, db = database): Promise<Uint8Array | undefined> {
  const record = await db.attachmentData.get(id);
  return record?.bytes;
}

export async function saveAttachment(
  noteId: string,
  file: { name: string; type?: string; size: number; arrayBuffer: () => Promise<ArrayBuffer> },
  db = database,
): Promise<Attachment> {
  if (file.size > MAX_ATTACHMENT_SIZE_BYTES) {
    throw new Error('File exceeds the 10 MB attachment limit.');
  }
  const note = await db.notes.get(noteId);
  if (!note || note.deletedAt) throw new Error('Cannot attach a file to a missing or trashed note.');

  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  const checksum = await calculateChecksum(bytes);
  const now = new Date().toISOString();
  const attachment: Attachment = attachmentSchema.parse({
    id: crypto.randomUUID(),
    noteId,
    filename: file.name.slice(0, 255) || 'attachment',
    mime: file.type?.slice(0, 128) || 'application/octet-stream',
    size: file.size,
    checksum,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
    location: 'device',
    transferState: 'local',
  });

  await db.transaction('rw', db.attachments, db.attachmentData, async () => {
    await db.attachments.put(attachment);
    await db.attachmentData.put({ id: attachment.id, bytes });
  });

  return attachment;
}

export async function deleteAttachment(id: string, db = database): Promise<void> {
  await db.transaction('rw', db.attachments, db.attachmentData, async () => {
    await db.attachments.delete(id);
    await db.attachmentData.delete(id);
  });
}

export async function deleteAttachments(ids: string[], db = database): Promise<void> {
  if (!ids.length) return;
  await db.transaction('rw', db.attachments, db.attachmentData, async () => {
    await db.attachments.bulkDelete(ids);
    await db.attachmentData.bulkDelete(ids);
  });
}
