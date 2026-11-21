import { LibrarySearch } from './index';
import type { Note } from '../domain/model';
const index = new LibrarySearch();
type Message = { type: 'update'; notes: Note[]; removed: string[] } | { type: 'search'; query: string; request: number };
self.onmessage = (event: MessageEvent<Message>) => {
  try {
    const message = event.data;
    if (message.type === 'update') index.update(message.notes, message.removed);
    else self.postMessage({ request: message.request, ids: index.search(message.query) });
  } catch { self.postMessage({ error: true }); }
};
