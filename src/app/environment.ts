export type AppMode = 'test' | 'normal';
const modeKey = 'eviescratch.app-mode';
export function readAppMode(): AppMode {
  try {
    const stored = localStorage.getItem(modeKey);
    if (stored === 'normal' || stored === 'test') return stored;
  } catch { /* A blocked preference must not prevent startup. */ }
  return import.meta.env.PROD ? 'normal' : 'test';
}
export function storeAppMode(mode: AppMode) {
  localStorage.setItem(modeKey, mode);
}
export function databaseName(mode: AppMode) { return mode === 'test' ? 'eviescratch-demo' : 'eviescratch'; }
export function preferenceKey(mode: AppMode) { return mode === 'test' ? 'eviescratch.demo.preferences' : 'eviescratch.preferences'; }
