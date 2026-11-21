import { getSchema } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import { TaskList, TaskItem } from '@tiptap/extension-list';
import { noteSchema, type Note } from '../domain/model';

export function editorExtensions() {
  return [
    StarterKit.configure({ link: false, heading: { levels: [2, 3] } }),
    TaskList,
    TaskItem.configure({ nested: true }),
  ];
}
const schema = getSchema(editorExtensions());

/** Validate persisted/imported JSON against the same schema used by the editor. */
export function parseNote(value: unknown): Note {
  const note = noteSchema.parse(value);
  if (JSON.stringify(note.document.content).length > 2_000_000) {
    throw new Error('This prototype supports note documents up to 2 MB.');
  }
  const doc = schema.nodeFromJSON(note.document.content);
  if (doc.type.name !== 'doc') throw new Error('The note document has no valid root.');
  doc.check();
  return note;
}
export function noteText(note: Note): string {
  const doc = schema.nodeFromJSON(note.document.content);
  return doc.textBetween(0, doc.content.size, '\n');
}
