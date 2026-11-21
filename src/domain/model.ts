import { z } from 'zod';
import type { JSONContent } from '@tiptap/core';
export type EntityId = string;
export type IsoTimestamp = string;
export type VisualMode = 'normal' | 'pixel';

export type LocalSaveState =
  | { status: 'saving' }
  | { status: 'saved'; committedAt: IsoTimestamp }
  | { status: 'failed'; message: string; conflict: boolean };

const timestamp = z.iso.datetime();
const entitySchema = z.object({
  id: z.uuid(), createdAt: timestamp, updatedAt: timestamp,
  revision: z.number().int().nonnegative(), deletedAt: timestamp.nullable(),
});
export const journalSchema = entitySchema.extend({
  name: z.string().min(1).max(200), shelfId: z.uuid().nullable(), sortKey: z.string(),
}).strict();
export const shelfSchema = entitySchema.extend({ name: z.string().min(1).max(200), sortKey: z.string() }).strict();
export const noteSchema = entitySchema.extend({
  journalId: z.uuid(), title: z.string().max(2000),
  document: z.object({
    schemaVersion: z.literal(1),
    content: z.custom<JSONContent>(value => !!value && typeof value === 'object' && !Array.isArray(value)),
  }).strict(),
  pinned: z.boolean(), archivedAt: timestamp.nullable(),
  tags: z.array(z.string().trim().min(1).max(80)).max(50).default([]),
}).strict();

export const MAX_ATTACHMENT_SIZE_BYTES = 10_000_000; // 10 MB per file limit

export const attachmentSchema = z.object({
  id: z.uuid(),
  noteId: z.uuid(),
  filename: z.string().min(1).max(255),
  mime: z.string().min(1).max(128),
  size: z.number().int().nonnegative().max(MAX_ATTACHMENT_SIZE_BYTES),
  checksum: z.string().min(1),
  createdAt: timestamp,
  updatedAt: timestamp,
  deletedAt: timestamp.nullable().default(null),
  location: z.enum(['device', 'cloud']).default('device'),
  transferState: z.enum(['local', 'pending', 'uploading', 'ready', 'failed']).default('local'),
}).strict();

export type Entity = z.infer<typeof entitySchema>;
export type Journal = z.infer<typeof journalSchema>;
export type Shelf = z.infer<typeof shelfSchema>;
export type Note = z.infer<typeof noteSchema>;
export type Attachment = z.infer<typeof attachmentSchema>;
export interface AttachmentData {
  id: string;
  bytes: Uint8Array;
}
export type NoteDocument = Note['document'];
export const INBOX_ID = '00000000-0000-4000-8000-000000000001';

export function newNote(journalId = INBOX_ID): Note {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(), journalId, title: '',
    document: { schemaVersion: 1, content: { type: 'doc', content: [{ type: 'paragraph' }] } },
    createdAt: now, updatedAt: now, revision: 0,
    pinned: false, archivedAt: null, deletedAt: null, tags: [],
  };
}
