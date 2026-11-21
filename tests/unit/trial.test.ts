import { afterEach, expect, it, vi } from 'vitest';
import { createDemoAccess, parseDemoAccess, remainingTrialDays, trialCaption } from '../../src/domain/trial';

const start = Date.parse('2026-11-21T10:00:00.000Z');
const day = 86_400_000;
afterEach(() => { vi.unstubAllGlobals(); vi.resetModules(); });

it('a Test trial lasts exactly three days; Buy Now creates no trial dates', () => {
  expect(createDemoAccess('weekly', 'trial', start)).toEqual({ kind: 'trial', plan: 'weekly', startedAt: '2026-11-21T10:00:00.000Z', endsAt: '2026-11-24T10:00:00.000Z' });
  expect(createDemoAccess('annual', 'purchase', start)).toEqual({ kind: 'paid', plan: 'annual', purchasedAt: '2026-11-21T10:00:00.000Z' });
});

it('remaining days round up, respect day boundaries and stop at zero without fabricating a trial', () => {
  const access = createDemoAccess('annual', 'trial', start);
  expect(remainingTrialDays(null, start)).toBeNull();
  expect(trialCaption(null, start)).toBe('(Trial not started)');
  expect(remainingTrialDays(access, start - day)).toBe(3);
  expect(remainingTrialDays(access, start + day - 1)).toBe(3);
  expect(remainingTrialDays(access, start + day)).toBe(2);
  expect(trialCaption(access, start + 2 * day)).toBe('(1 day remaining)');
  expect(remainingTrialDays(access, start + 3 * day)).toBe(0);
  expect(remainingTrialDays(access, start + 4 * day)).toBe(0);
  expect(remainingTrialDays(createDemoAccess('weekly', 'purchase', start), start)).toBeNull();
});

it('malformed demo preferences cannot invent an unknown plan or invalid trial dates', () => {
  expect(parseDemoAccess({ kind: 'paid', plan: 'lifetime', purchasedAt: new Date(start).toISOString() })).toBeNull();
  expect(parseDemoAccess({ kind: 'trial', plan: 'weekly', startedAt: 'invalid', endsAt: 'invalid' })).toBeNull();
  expect(parseDemoAccess({ kind: 'trial', plan: 'weekly', startedAt: new Date(start).toISOString(), endsAt: new Date(start - 1).toISOString() })).toBeNull();
  expect(parseDemoAccess(createDemoAccess('annual', 'trial', start))).toEqual(createDemoAccess('annual', 'trial', start));
});

it('Normal preferences discard even valid simulated paid access', async () => {
  const normal = JSON.stringify({ onboarded: true, demoAccess: createDemoAccess('annual', 'purchase', start) });
  vi.stubGlobal('localStorage', { getItem: (key: string) => key === 'eviescratch.app-mode' ? 'normal' : key === 'eviescratch.preferences' ? normal : null });
  const { readPreferences } = await import('../../src/app/preferences');
  expect(readPreferences()).toMatchObject({ onboarded: true, demoAccess: null });
});
