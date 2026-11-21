import Dexie from 'dexie';
import { database } from './database';
import { databaseName, preferenceKey, readAppMode } from '../app/environment';

/** This function cannot delete the normal library, even if invoked in normal mode. */
export async function resetDemo() {
  if (readAppMode() !== 'test' || database.name !== databaseName('test')) throw new Error('Demo reset is only available in Test mode.');
  localStorage.removeItem(preferenceKey('test'));
  localStorage.removeItem('eviescratch.demo.visual-mode');
  database.close();
  await Dexie.delete(databaseName('test'));
}
