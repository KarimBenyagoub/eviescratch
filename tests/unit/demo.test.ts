import 'fake-indexeddb/auto';
import Dexie from 'dexie';
import { afterEach, expect, it, vi } from 'vitest';
import { database, NotesDatabase, openLibrary } from '../../src/data/database';
import { resetDemo } from '../../src/data/demo';
import { databaseName, preferenceKey } from '../../src/app/environment';

const values = new Map<string, string>();
function storage(mode: 'normal' | 'test') {
  values.clear(); values.set('eviescratch.app-mode', mode);
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => { values.set(key, value); },
    removeItem: (key: string) => { values.delete(key); },
  });
}
afterEach(async () => {
  database.close();
  await Dexie.delete(databaseName('test'));
  await Dexie.delete(databaseName('normal'));
  vi.unstubAllGlobals();
});

it('reset deletes only the demo database and its preferences; normal records/preferences survive', async () => {
  storage('test');
  const normal = new NotesDatabase(databaseName('normal'));
  const normalNotes = await openLibrary(normal);
  const original = normalNotes[0]!;
  values.set(preferenceKey('normal'), 'normal preferences');
  values.set(preferenceKey('test'), 'demo preferences');
  await openLibrary(database);
  await resetDemo();
  expect(await Dexie.exists(databaseName('test'))).toBe(false);
  expect(await normal.notes.get(original.id)).toEqual(original);
  expect(values.get(preferenceKey('normal'))).toBe('normal preferences');
  expect(values.has(preferenceKey('test'))).toBe(false);
  normal.close();
});

it('the reset guard refuses to operate from Normal mode', async () => {
  storage('normal');
  await expect(resetDemo()).rejects.toThrow('only available in Test mode');
});
