import { zipSync, unzipSync, strToU8, strFromU8 } from 'fflate';
import { database, calculateChecksum, NotesDatabase, type Library } from './database';
import { journalSchema, shelfSchema, attachmentSchema, type Note, type Journal, type Shelf, type Attachment, INBOX_ID } from '../domain/model';
import { parseNote, noteText } from '../editor/schema';

export interface BackupManifest {
  format: 'eviescratch-native-backup';
  version: 1;
  app: 'EvieScratch';
  createdAt: string;
  counts: {
    notes: number;
    journals: number;
    shelves: number;
    attachments: number;
  };
  attachments: {
    id: string;
    filename: string;
    size: number;
    checksum: string;
  }[];
}

export interface RestoreSummary {
  notesCount: number;
  journalsCount: number;
  shelvesCount: number;
  attachmentsCount: number;
  totalBytes: number;
}

export function triggerBlobDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
}

function safeFilename(title: string, fallback = 'untitled'): string {
  const clean = title.trim().replace(/[\\/:*?"<>|]+/g, '-').replace(/\s+/g, ' ').slice(0, 80);
  return clean || fallback;
}

/** Exports exact native backup containing canonical JSON and all binary attachments. */
export async function exportNativeBackup(db: NotesDatabase = database): Promise<{ blob: Blob; filename: string }> {
  const notes = (await db.notes.toArray()).map(parseNote);
  const journals = (await db.journals.toArray()).map(value => journalSchema.parse(value));
  const shelves = (await db.shelves.toArray()).map(value => shelfSchema.parse(value));
  const attachments = (await db.attachments.toArray()).map(value => attachmentSchema.parse(value));
  const attachmentData = await db.attachmentData.toArray();

  const manifest: BackupManifest = {
    format: 'eviescratch-native-backup',
    version: 1,
    app: 'EvieScratch',
    createdAt: new Date().toISOString(),
    counts: {
      notes: notes.length,
      journals: journals.length,
      shelves: shelves.length,
      attachments: attachments.length,
    },
    attachments: attachments.map(att => ({
      id: att.id,
      filename: att.filename,
      size: att.size,
      checksum: att.checksum,
    })),
  };

  const zipEntries: Record<string, Uint8Array> = {
    'manifest.json': strToU8(JSON.stringify(manifest, null, 2)),
    'notes.json': strToU8(JSON.stringify(notes, null, 2)),
    'journals.json': strToU8(JSON.stringify(journals, null, 2)),
    'shelves.json': strToU8(JSON.stringify(shelves, null, 2)),
    'attachments.json': strToU8(JSON.stringify(attachments, null, 2)),
  };

  for (const item of attachmentData) {
    zipEntries[`files/${item.id}`] = item.bytes;
  }

  const zipped = zipSync(zipEntries, { level: 6 });
  const blob = new Blob([zipped as unknown as ArrayBuffer], { type: 'application/zip' });
  const dateStr = new Date().toISOString().slice(0, 10);
  const filename = `eviescratch-backup-${dateStr}.zip`;

  return { blob, filename };
}

/** Exports human-readable Markdown files grouped by Journal. */
export async function exportReadableMarkdown(library: Library): Promise<{ blob: Blob; filename: string }> {
  const journalsMap = new Map(library.journals.map(j => [j.id, j.name]));
  const activeNotes = library.notes.filter(note => !note.deletedAt);
  const zipEntries: Record<string, Uint8Array> = {};

  let indexContent = '# EvieScratch Notes Library\n\nExported on ' + new Date().toLocaleString() + '\n\n';

  const usedNames = new Set<string>();

  for (const note of activeNotes) {
    const journalName = journalsMap.get(note.journalId) ?? 'Inbox';
    let baseName = `${safeFilename(journalName)}/${safeFilename(note.title, 'untitled')}`;
    let finalPath = `${baseName}.md`;
    let counter = 1;
    while (usedNames.has(finalPath)) {
      finalPath = `${baseName}-${counter++}.md`;
    }
    usedNames.add(finalPath);

    const noteAttachments = library.attachments.filter(att => att.noteId === note.id && !att.deletedAt);

    let md = '---\n';
    md += `title: "${note.title.replace(/"/g, '\\"') || 'Untitled'}"\n`;
    md += `journal: "${journalName.replace(/"/g, '\\"')}"\n`;
    md += `created: ${note.createdAt}\n`;
    md += `updated: ${note.updatedAt}\n`;
    if (note.pinned) md += 'pinned: true\n';
    if (note.archivedAt) md += `archived: ${note.archivedAt}\n`;
    if (note.tags.length > 0) md += `tags: [${note.tags.map(t => `"${t}"`).join(', ')}]\n`;
    md += '---\n\n';

    if (note.title.trim()) {
      md += `# ${note.title.trim()}\n\n`;
    }

    const text = noteText(note);
    md += text ? `${text}\n\n` : '_Empty note_\n\n';

    if (noteAttachments.length > 0) {
      md += '## Attachments\n\n';
      for (const att of noteAttachments) {
        md += `- **${att.filename}** (${(att.size / 1024).toFixed(1)} KB) - Location: ${att.location}\n`;
      }
      md += '\n';
    }

    zipEntries[finalPath] = strToU8(md);
    indexContent += `- [${note.title.trim() || 'Untitled'}](${finalPath}) *(${journalName})*\n`;
  }

  zipEntries['index.md'] = strToU8(indexContent);

  const zipped = zipSync(zipEntries, { level: 6 });
  const blob = new Blob([zipped as unknown as ArrayBuffer], { type: 'application/zip' });
  const dateStr = new Date().toISOString().slice(0, 10);
  const filename = `eviescratch-markdown-${dateStr}.zip`;

  return { blob, filename };
}

/** Previews a native backup archive before restoring. */
export async function inspectNativeBackup(file: File | Blob): Promise<BackupManifest> {
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  const unzipped = unzipSync(bytes);

  const manifestBytes = unzipped['manifest.json'];
  if (!manifestBytes) throw new Error('Invalid archive: manifest.json is missing.');

  let manifest: BackupManifest;
  try {
    manifest = JSON.parse(strFromU8(manifestBytes));
  } catch {
    throw new Error('Invalid archive: manifest.json is corrupted.');
  }

  if (manifest.format !== 'eviescratch-native-backup' || manifest.version !== 1) {
    throw new Error('Unsupported backup format or version.');
  }

  return manifest;
}

/** Restores exact native backup into a clean profile. */
export async function restoreNativeBackup(
  file: File | Blob,
  options: { mode?: 'replace' | 'merge' } = { mode: 'replace' },
  db: NotesDatabase = database,
): Promise<RestoreSummary> {
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let unzipped: Record<string, Uint8Array>;
  try {
    unzipped = unzipSync(bytes);
  } catch {
    throw new Error('Could not open the zip archive. Ensure the file is not corrupted.');
  }

  const manifestBytes = unzipped['manifest.json'];
  if (!manifestBytes) throw new Error('Invalid archive: manifest.json is missing.');

  let manifest: BackupManifest;
  try {
    manifest = JSON.parse(strFromU8(manifestBytes));
  } catch {
    throw new Error('Invalid archive: manifest.json is corrupted.');
  }

  if (manifest.format !== 'eviescratch-native-backup' || manifest.version !== 1) {
    throw new Error('Unsupported backup format or version.');
  }

  const notesRaw = unzipped['notes.json'];
  const journalsRaw = unzipped['journals.json'];
  const shelvesRaw = unzipped['shelves.json'];
  const attachmentsRaw = unzipped['attachments.json'];

  if (!notesRaw || !journalsRaw) {
    throw new Error('Invalid archive: notes or journals are missing.');
  }

  const notes: Note[] = JSON.parse(strFromU8(notesRaw)).map(parseNote);
  const journals: Journal[] = JSON.parse(strFromU8(journalsRaw)).map((j: unknown) => journalSchema.parse(j));
  const shelves: Shelf[] = shelvesRaw ? JSON.parse(strFromU8(shelvesRaw)).map((s: unknown) => shelfSchema.parse(s)) : [];
  const attachments: Attachment[] = attachmentsRaw ? JSON.parse(strFromU8(attachmentsRaw)).map((a: unknown) => attachmentSchema.parse(a)) : [];

  const attachmentDataRecords: { id: string; bytes: Uint8Array }[] = [];
  for (const att of attachments) {
    const fileBytes = unzipped[`files/${att.id}`];
    if (!fileBytes) {
      throw new Error(`Archive is incomplete: file data for "${att.filename}" is missing.`);
    }
    const computedChecksum = await calculateChecksum(fileBytes);
    if (computedChecksum !== att.checksum) {
      throw new Error(`Archive integrity check failed: checksum mismatch for "${att.filename}".`);
    }
    attachmentDataRecords.push({ id: att.id, bytes: fileBytes });
  }

  // Atomically commit restored library into database
  await db.transaction('rw', [db.notes, db.journals, db.shelves, db.attachments, db.attachmentData, db.checkpoints, db.pendingChanges, db.settings], async () => {
    if (options.mode === 'replace') {
      await db.notes.clear();
      await db.journals.clear();
      await db.shelves.clear();
      await db.attachments.clear();
      await db.attachmentData.clear();
      await db.checkpoints.clear();
      await db.pendingChanges.clear();
    }

    if (shelves.length) await db.shelves.bulkPut(shelves);
    if (journals.length) await db.journals.bulkPut(journals);
    if (notes.length) await db.notes.bulkPut(notes);
    if (attachments.length) await db.attachments.bulkPut(attachments);
    if (attachmentDataRecords.length) await db.attachmentData.bulkPut(attachmentDataRecords);

    const defaultJournal = journals.find(j => j.id === INBOX_ID) ?? journals[0];
    if (defaultJournal) {
      await db.settings.put({ key: 'defaultJournalId', value: defaultJournal.id });
    }
  });

  return {
    notesCount: notes.length,
    journalsCount: journals.length,
    shelvesCount: shelves.length,
    attachmentsCount: attachments.length,
    totalBytes: bytes.length,
  };
}
