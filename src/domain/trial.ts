import type { PlanId } from './offer';
import { subscriptionOffer } from './offer';

export type CheckoutIntent = 'trial' | 'purchase';
export type DemoAccess = { kind: 'trial'; plan: PlanId; startedAt: string; endsAt: string } | { kind: 'paid'; plan: PlanId; purchasedAt: string };
const day = 86_400_000;

/** Local timestamps are strictly for the explicitly marked demo; never a live entitlement. */
export function createDemoAccess(plan: PlanId, intent: CheckoutIntent, now = Date.now()): DemoAccess {
  return intent === 'trial'
    ? { kind: 'trial', plan, startedAt: new Date(now).toISOString(), endsAt: new Date(now + subscriptionOffer.trialDays * day).toISOString() }
    : { kind: 'paid', plan, purchasedAt: new Date(now).toISOString() };
}
export function remainingTrialDays(access: DemoAccess | null, now = Date.now()): number | null {
  if (access?.kind !== 'trial') return null;
  return Math.min(subscriptionOffer.trialDays, Math.max(0, Math.ceil((Date.parse(access.endsAt) - now) / day)));
}
export function trialCaption(access: DemoAccess | null, now = Date.now()): string {
  if (!access) return '(Trial not started)';
  if (access.kind === 'paid') return `(${access.plan === 'weekly' ? 'Weekly' : 'Annual'} plan active)`;
  const days = remainingTrialDays(access, now)!;
  return `(${days} ${days === 1 ? 'day' : 'days'} remaining)`;
}
export function parseDemoAccess(value: unknown): DemoAccess | null {
  if (!value || typeof value !== 'object') return null;
  const access = value as Partial<DemoAccess> & { startedAt?: unknown; endsAt?: unknown; purchasedAt?: unknown };
  if (access.plan !== 'weekly' && access.plan !== 'annual') return null;
  if (access.kind === 'trial' && typeof access.startedAt === 'string' && typeof access.endsAt === 'string' && Number.isFinite(Date.parse(access.startedAt)) && Number.isFinite(Date.parse(access.endsAt)) && Date.parse(access.endsAt) > Date.parse(access.startedAt)) return { kind: 'trial', plan: access.plan, startedAt: access.startedAt, endsAt: access.endsAt };
  if (access.kind === 'paid' && typeof access.purchasedAt === 'string' && Number.isFinite(Date.parse(access.purchasedAt))) return { kind: 'paid', plan: access.plan, purchasedAt: access.purchasedAt };
  return null;
}
