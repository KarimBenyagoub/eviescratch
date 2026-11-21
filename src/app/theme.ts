import type { VisualMode } from '../domain/model';
import { readAppMode } from './environment';

const preferenceKey = readAppMode() === 'test' ? 'eviescratch.demo.visual-mode' : 'eviescratch.visual-mode';

export function readVisualMode(): VisualMode {
  try {
    return localStorage.getItem(preferenceKey) === 'pixel' ? 'pixel' : 'normal';
  } catch {
    return 'normal';
  }
}

export function applyVisualMode(mode: VisualMode): void {
  document.documentElement.dataset.theme = mode;
  const canvas = getComputedStyle(document.documentElement).getPropertyValue('--canvas').trim();
  if (canvas) {
    document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')?.setAttribute('content', canvas);
  }
}

/** A refused preference write must not prevent switching the visible theme. */
export function saveVisualMode(mode: VisualMode): boolean {
  try {
    localStorage.setItem(preferenceKey, mode);
    return true;
  } catch {
    return false;
  }
}
