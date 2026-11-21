import MiniSearch from 'minisearch';
import type { JSONContent } from '@tiptap/core';
import type { Note } from '../domain/model';

export function plainText(node: JSONContent): string {
  if (node.text) return node.text;
  return (node.content ?? []).map(plainText).join(['doc', 'bulletList', 'orderedList', 'taskList'].includes(node.type ?? '') ? '\n' : ' ');
}
const normalize = (term: string) => term.normalize('NFKD').replace(/\p{M}/gu, '').toLocaleLowerCase();
interface SearchDocument { id: string; title: string; body: string; tags: string }

export class LibrarySearch {
  private index = new MiniSearch<SearchDocument>({ fields: ['title', 'body', 'tags'], processTerm: normalize });
  private documents = new Map<string, SearchDocument>();
  update(notes: Note[], removed: string[] = []) {
    for (const id of removed) { if (this.index.has(id)) this.index.discard(id); this.documents.delete(id); }
    for (const note of notes) {
      const document = { id: note.id, title: note.title, body: plainText(note.document.content), tags: note.tags.join(' ') };
      this.documents.set(note.id, document);
      if (this.index.has(note.id)) this.index.replace(document); else this.index.add(document);
    }
  }
  search(query: string): string[] {
    if (!query.trim()) return [];
    if (!/[\p{L}\p{N}]/u.test(query)) {
      const term = normalize(query.trim());
      return [...this.documents.values()].filter(doc => normalize(`${doc.title} ${doc.body} ${doc.tags}`).includes(term)).map(doc => doc.id);
    }
    return this.index.search(query, { prefix: true, combineWith: 'AND', boost: { title: 3, tags: 2 } }).map(result => String(result.id));
  }
}
