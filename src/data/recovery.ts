import { DATABASE_NAME } from './database';
export function downloadJson(value: unknown, filename: string) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(value, null, 2)], { type: 'application/json' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
}

/** Reads original stores even when migrations or current validation fail. */
export async function downloadRecovery() {
  const snapshot = await new Promise<unknown>((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME);
    request.onupgradeneeded = event => {
      if (event.oldVersion === 0) request.transaction?.abort();
    };
    request.onerror = () => reject(new Error('The browser could not read the original database. Keep this browser profile and retry.'));
    request.onblocked = () => reject(new Error('Close other EvieScratch tabs, then retry the recovery download.'));
    request.onsuccess = () => {
      const db = request.result;
      const stores = [...db.objectStoreNames];
      if (!stores.length) { db.close(); reject(new Error('No saved library is available in this browser.')); return; }
      const transaction = db.transaction(stores, 'readonly');
      const records: Record<string, unknown> = {};
      for (const name of stores) {
        const read = transaction.objectStore(name).getAll();
        read.onsuccess = () => { records[name] = read.result; };
      }
      transaction.oncomplete = () => {
        db.close();
        resolve({ format: 'eviescratch-recovery', version: 1, databaseVersion: db.version, createdAt: new Date().toISOString(), stores: records });
      };
      transaction.onabort = () => { db.close(); reject(new Error('The recovery read failed. Your saved library has not been changed.')); };
    };
  });
  downloadJson(snapshot, 'eviescratch-recovery.json');
}
