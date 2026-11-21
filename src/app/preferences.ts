import type { PlanId } from '../domain/offer';
import { preferenceKey, readAppMode } from './environment';
import { parseDemoAccess, type DemoAccess } from '../domain/trial';
export interface Preferences { showEvie: boolean; textSize: 'comfortable' | 'large'; guide: number; pixelOffer: 'pending' | 'dismissed'; plan: PlanId | null; onboarded: boolean; demoAccess: DemoAccess | null }
const key = preferenceKey(readAppMode());
export function readPreferences(): Preferences {
  let value: Partial<Preferences> = {};
  try { value = JSON.parse(localStorage.getItem(key) ?? '{}') as Partial<Preferences>; } catch { /* Defaults remain usable. */ }
  return {
    showEvie: value?.showEvie !== false,
    textSize: value?.textSize === 'large' ? 'large' : 'comfortable',
    guide: typeof value?.guide === 'number' && Number.isInteger(value.guide) && value.guide >= 0 && value.guide <= 3 ? value.guide : 0,
    pixelOffer: value?.pixelOffer === 'dismissed' ? 'dismissed' : 'pending',
    plan: value?.plan === 'weekly' || value?.plan === 'annual' ? value.plan : null,
    onboarded: value?.onboarded === true,
    demoAccess: readAppMode() === 'test' ? parseDemoAccess(value?.demoAccess) : null,
  };
}
export function savePreferences(value: Preferences) {
  try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch { return false; }
}
