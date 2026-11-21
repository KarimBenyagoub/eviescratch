import 'fake-indexeddb/auto';
import Dexie from 'dexie';
import { afterEach, describe, expect, it } from 'vitest';
import { NotesDatabase, openLibrary, saveAttachment, commitNote, readAttachmentData } from '../../src/data/database';
import { saveJournal, saveShelf } from '../../src/data/organization';
import { exportNativeBackup, exportReadableMarkdown, inspectNativeBackup, restoreNativeBackup } from '../../src/data/backup';
import { unzipSync, strFromU8, strToU8, zipSync } from 'fflate';

const databases: Dexie[] = [];
function testDatabase() {
  const db = new NotesDatabase(`eviescratch-test-backup-${crypto.randomUUID()}`);
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

describe('T03 Backup, Export and Exact Restore', () => {
  it('exports native backup zip and restores it into a clean profile with matching checksums', async () => {
    const sourceDb = testDatabase();
    const [initialNote] = await openLibrary(sourceDb);

    // Create a shelf and journal
    const shelf = await saveShelf('Projects Shelf', undefined, sourceDb);
    const journal = await saveJournal('Evie Research', shelf.id, undefined, sourceDb);

    // Create a detailed note with tags and content
    const updatedNote = await commitNote({
      ...initialNote!,
      journalId: journal.id,
      title: 'Cat Care & Notes',
      tags: ['cats', 'notes'],
      pinned: true,
    }, initialNote!.revision, sourceDb);

    // Add an attachment
    const attachment = await saveAttachment(
      updatedNote.id,
      mockFile('cat-recipe.txt', 'Tuna and catnip recipe content'),
      sourceDb,
    );

    // Export backup
    const { blob, filename } = await exportNativeBackup(sourceDb);
    expect(filename).toMatch(/^eviescratch-backup-\d{4}-\d{2}-\d{2}\.zip$/);
    expect(blob.size).toBeGreaterThan(0);

    // Inspect backup archive
    const manifest = await inspectNativeBackup(blob);
    expect(manifest.format).toBe('eviescratch-native-backup');
    expect(manifest.version).toBe(1);
    expect(manifest.counts.notes).toBe(1);
    expect(manifest.counts.journals).toBe(2); // Inbox + Evie Research
    expect(manifest.counts.shelves).toBe(1);
    expect(manifest.counts.attachments).toBe(1);
    expect(manifest.attachments[0]?.checksum).toBe(attachment.checksum);

    // Restore into a fresh/empty target database
    const targetDb = testDatabase();
    const summary = await restoreNativeBackup(blob, { mode: 'replace' }, targetDb);

    expect(summary.notesCount).toBe(1);
    expect(summary.journalsCount).toBe(2);
    expect(summary.shelvesCount).toBe(1);
    expect(summary.attachmentsCount).toBe(1);

    // Verify restored records in targetDb match original exactly
    const restoredNotes = await targetDb.notes.toArray();
    expect(restoredNotes.length).toBe(1);
    expect(restoredNotes[0]?.title).toBe('Cat Care & Notes');
    expect(restoredNotes[0]?.tags).toEqual(['cats', 'notes']);
    expect(restoredNotes[0]?.pinned).toBe(true);
    expect(restoredNotes[0]?.journalId).toBe(journal.id);

    const restoredShelves = await targetDb.shelves.toArray();
    expect(restoredShelves.length).toBe(1);
    expect(restoredShelves[0]?.name).toBe('Projects Shelf');

    const restoredAttachments = await targetDb.attachments.toArray();
    expect(restoredAttachments.length).toBe(1);
    expect(restoredAttachments[0]?.filename).toBe('cat-recipe.txt');
    expect(restoredAttachments[0]?.checksum).toBe(attachment.checksum);

    // Verify binary bytes survived intact
    const restoredBytes = await readAttachmentData(attachment.id, targetDb);
    expect(restoredBytes).toBeDefined();
    const content = new TextDecoder().decode(restoredBytes);
    expect(content).toBe('Tuna and catnip recipe content');
  });

  it('rejects a corrupted backup archive where an attachment checksum does not match', async () => {
    const sourceDb = testDatabase();
    const [note] = await openLibrary(sourceDb);
    await saveAttachment(note!.id, mockFile('original.txt', 'correct data'), sourceDb);

    const { blob } = await exportNativeBackup(sourceDb);
    const buffer = await blob.arrayBuffer();
    const unzipped = unzipSync(new Uint8Array(buffer));

    // Tamper with the binary file
    const fileKeys = Object.keys(unzipped).filter(k => k.startsWith('files/'));
    expect(fileKeys.length).toBe(1);
    unzipped[fileKeys[0]!] = strToU8('tampered corrupted content');

    // Re-zip the tampered entries
    const corruptedZip = zipSync(unzipped);
    const corruptedBlob = new Blob([corruptedZip as unknown as ArrayBuffer], { type: 'application/zip' });

    const targetDb = testDatabase();
    await openLibrary(targetDb);
    const originalTargetCount = await targetDb.notes.count();

    // Restoration must reject due to checksum mismatch
    await expect(restoreNativeBackup(corruptedBlob, { mode: 'replace' }, targetDb))
      .rejects.toThrow('checksum mismatch');

    // Ensure database was not modified or corrupted
    expect(await targetDb.notes.count()).toBe(originalTargetCount);
  });

  it('rejects an invalid archive missing manifest.json', async () => {
    const invalidZip = zipSync({ 'random.txt': strToU8('nothing here') });
    const invalidBlob = new Blob([invalidZip as unknown as ArrayBuffer], { type: 'application/zip' });

    const targetDb = testDatabase();
    await expect(restoreNativeBackup(invalidBlob, { mode: 'replace' }, targetDb))
      .rejects.toThrow('manifest.json is missing');
  });

  it('exports human-readable Markdown archive with frontmatter and index.md', async () => {
    const db = testDatabase();
    const [note] = await openLibrary(db);
    await commitNote({
      ...note!,
      title: 'Meeting with Emily',
      tags: ['work', 'design'],
      pinned: true,
    }, note!.revision, db);

    await saveAttachment(note!.id, mockFile('notes.txt', 'Meeting notes content'), db);

    const library = {
      notes: await db.notes.toArray(),
      journals: await db.journals.toArray(),
      shelves: await db.shelves.toArray(),
      attachments: await db.attachments.toArray(),
      defaultJournalId: '',
    };

    const { blob, filename } = await exportReadableMarkdown(library);
    expect(filename).toMatch(/^eviescratch-markdown-\d{4}-\d{2}-\d{2}\.zip$/);

    const unzipped = unzipSync(new Uint8Array(await blob.arrayBuffer()));
    expect(unzipped['index.md']).toBeDefined();
    const indexMd = strFromU8(unzipped['index.md']!);
    expect(indexMd).toContain('Meeting with Emily');

    // Find the note markdown file
    const noteFile = Object.keys(unzipped).find(k => k.endsWith('.md') && k !== 'index.md');
    expect(noteFile).toBeDefined();
    const noteMd = strFromU8(unzipped[noteFile!]!);
    expect(noteMd).toContain('title: "Meeting with Emily"');
    expect(noteMd).toContain('tags: ["work", "design"]');
    expect(noteMd).toContain('pinned: true');
    expect(noteMd).toContain('notes.txt');
  });
});
