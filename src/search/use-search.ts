import { useEffect, useRef, useState } from 'react';
import type { Note } from '../domain/model';

export function useSearch(notes: Note[], query: string) {
  const worker = useRef<Worker | null>(null);
  const previous = useRef(new Map<string, Note>());
  const request = useRef(0);
  const [result, setResult] = useState<{ ids: string[]; pending: boolean; error: boolean }>({ ids: [], pending: false, error: false });
  useEffect(() => {
    const instance = new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' });
    worker.current = instance;
    previous.current.clear();
    instance.onmessage = (event: MessageEvent<{ request: number; ids: string[]; error?: boolean }>) => {
      if (event.data.error) { setResult({ ids: [], pending: false, error: true }); return; }
      if (event.data.request === request.current) setResult({ ids: event.data.ids, pending: false, error: false });
    };
    instance.onerror = () => setResult({ ids: [], pending: false, error: true });
    return () => { instance.terminate(); worker.current = null; };
  }, []);
  useEffect(() => {
    const next = new Map(notes.map(note => [note.id, note]));
    worker.current?.postMessage({ type: 'update', notes: notes.filter(note => previous.current.get(note.id) !== note), removed: [...previous.current.keys()].filter(id => !next.has(id)) });
    previous.current = next;
    request.current++;
    setResult(current => ({ ...current, pending: !!query.trim() }));
    worker.current?.postMessage({ type: 'search', query, request: request.current });
  }, [notes, query]);
  return result;
}
