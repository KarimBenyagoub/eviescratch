import 'fake-indexeddb/auto';
import Dexie from 'dexie';
import { afterEach, describe, expect, it } from 'vitest';
import { NotesDatabase, openLibrary, saveAttachment, deleteAttachment, deleteAttachments, readAttachmentData } from '../../src/data/database';
import { getStorageHealth, formatBytes } from '../../src/data/storage';
import { MAX_ATTACHMENT_SIZE_BYTES } from '../../src/domain/model';

const databases: Dexie[] = [];
function testDatabase() {
  const db = new NotesDatabase(`eviescratch-test-storage-${crypto.randomUUID()}`);
  databases.push(db);
  return db;
}
afterEach(async () => {
  for (const db of databases.splice(0)) {
    db.close();
    await Dexie.delete(db.name);
  }
});

function mockFile(name: string, content: string, type = 'text/plain') {
  const encoder = new TextEncoder();
  const bytes = encoder.encode(content);
  return {
    name,
    type,
    size: bytes.length,
    arrayBuffer: async () => bytes.buffer as ArrayBuffer,
  };
}

describe('T03 Storage & Attachments', () => {
  it('formats bytes correctly into human-readable units', () => {
    expect(formatBytes(0)).toBe('0 B');
    expect(formatBytes(512)).toBe('512 B');
    expect(formatBytes(1024)).toBe('1.0 KB');
    expect(formatBytes(1024 * 1024 * 2.5)).toBe('2.5 MB');
    expect(formatBytes(1024 * 1024 * 1024 * 3.75)).toBe('3.8 GB');
  });

  it('saves an attachment with SHA-256 checksum and location on device', async () => {
    const db = testDatabase();
    const [note] = await openLibrary(db);
    expect(note).toBeDefined();

    const file = mockFile('cat-photo.png', 'binary-cat-data-12345', 'image/png');
    const attachment = await saveAttachment(note!.id, file, db);

    expect(attachment.id).toBeDefined();
    expect(attachment.noteId).toBe(note!.id);
    expect(attachment.filename).toBe('cat-photo.png');
    expect(attachment.mime).toBe('image/png');
    expect(attachment.size).toBe(file.size);
    expect(attachment.checksum).toMatch(/^[a-f0-9]{64}$/);
    expect(attachment.location).toBe('device');
    expect(attachment.transferState).toBe('local');

    // Verify stored binary data
    const bytes = await readAttachmentData(attachment.id, db);
    expect(bytes).toBeDefined();
    const decoded = new TextDecoder().decode(bytes);
    expect(decoded).toBe('binary-cat-data-12345');
  });

  it('rejects files exceeding the 10 MB attachment limit', async () => {
    const db = testDatabase();
    const [note] = await openLibrary(db);

    const oversizedFile = {
      name: 'large-video.mp4',
      type: 'video/mp4',
      size: MAX_ATTACHMENT_SIZE_BYTES + 1,
      arrayBuffer: async () => new ArrayBuffer(0),
    };

    await expect(saveAttachment(note!.id, oversizedFile, db)).rejects.toThrow('10 MB');
  });

  it('rejects attaching to a nonexistent note', async () => {
    const db = testDatabase();
    await openLibrary(db);

    const file = mockFile('test.txt', 'hello');
    await expect(saveAttachment(crypto.randomUUID(), file, db)).rejects.toThrow('missing or trashed note');
  });

  it('deletes a single attachment metadata and binary data', async () => {
    const db = testDatabase();
    const [note] = await openLibrary(db);

    const file = mockFile('note-scan.pdf', 'pdf-content', 'application/pdf');
    const attachment = await saveAttachment(note!.id, file, db);

    expect(await db.attachments.count()).toBe(1);
    expect(await db.attachmentData.count()).toBe(1);

    await deleteAttachment(attachment.id, db);

    expect(await db.attachments.count()).toBe(0);
    expect(await db.attachmentData.count()).toBe(0);
  });

  it('batch deletes multiple selected attachments', async () => {
    const db = testDatabase();
    const [note] = await openLibrary(db);

    const f1 = await saveAttachment(note!.id, mockFile('f1.txt', 'one'), db);
    const f2 = await saveAttachment(note!.id, mockFile('f2.txt', 'two'), db);
    const f3 = await saveAttachment(note!.id, mockFile('f3.txt', 'three'), db);

    expect(await db.attachments.count()).toBe(3);

    // Delete f1 and f3
    await deleteAttachments([f1.id, f3.id], db);

    expect(await db.attachments.count()).toBe(1);
    expect(await db.attachments.get(f2.id)).toBeDefined();
    expect(await db.attachmentData.get(f1.id)).toBeUndefined();
    expect(await db.attachmentData.get(f3.id)).toBeUndefined();
    expect(await db.attachmentData.get(f2.id)).toBeDefined();
  });

  it('calculates accurate storage health and location breakdown', async () => {
    const db = testDatabase();
    const [note] = await openLibrary(db);

    await saveAttachment(note!.id, mockFile('f1.txt', '12345'), db);
    await saveAttachment(note!.id, mockFile('f2.txt', '67890'), db);

    const notes = await db.notes.toArray();
    const attachments = await db.attachments.toArray();
    const journals = await db.journals.toArray();
    const shelves = await db.shelves.toArray();

    const health = await getStorageHealth({
      notes,
      attachments,
      journals,
      shelves,
      defaultJournalId: '',
    });

    expect(health.notesCount).toBe(notes.length);
    expect(health.attachmentsCount).toBe(2);
    expect(health.attachmentsTotalBytes).toBe(10);
    expect(health.location).toBe('device');
    expect(health.cloudStatus).toBe('not-connected');
  });
});
