import { useState } from 'react';
import { Check } from 'lucide-react';
import { Dialog } from './Dialog';
import { subscriptionOffer, type PlanId } from '../domain/offer';
import type { CheckoutIntent, DemoAccess } from '../domain/trial';
import type { AppMode } from './environment';
import { TrialRemaining } from './TrialRemaining';

export function Plans({ selected, appMode, access, onChoose, onClose }: {
  selected: PlanId | null; appMode: AppMode; access: DemoAccess | null;
  onChoose: (plan: PlanId, intent: CheckoutIntent) => Promise<void>; onClose: () => void;
}) {
  const [plan, setPlan] = useState<PlanId | null>(selected);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function choose(intent: CheckoutIntent) {
    if (!plan || busy) return;
    setBusy(true); setError('');
    try { await onChoose(plan, intent); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Checkout is unavailable.'); }
    finally { setBusy(false); }
  }
  return <Dialog title="Choose your plan" onClose={onClose} wide>
    <div className="plan-intro"><span className="offer-label">3 DAYS FREE</span><TrialRemaining access={access} /><h3>A quieter home for your notes.</h3><p>Start with three days free, or choose Buy Now to begin your selected plan immediately.</p></div>
    <div className="plan-options" role="radiogroup" aria-label="Subscription plan">{(Object.entries(subscriptionOffer.plans) as [PlanId, typeof subscriptionOffer.plans[PlanId]][]).map(([id, offer]) => <label key={id} className={`plan-card ${plan === id ? 'selected' : ''}`}><span className="plan-label"><strong>{offer.label}</strong><input type="radio" name="plan" value={id} checked={plan === id} onChange={() => setPlan(id)} /></span><span className="plan-price"><span>{offer.display}</span><small>USD {offer.cadence}</small></span><span>After 3 days free</span><span className="plan-benefit"><Check size={16} aria-hidden="true" />The same full feature offer</span></label>)}</div>
    {plan && <><p className="renewal-terms">Start Free Trial: 3 days free, then {subscriptionOffer.plans[plan].display} USD {subscriptionOffer.plans[plan].cadence}, charged automatically. Renews {plan === 'weekly' ? 'weekly' : 'yearly'} until canceled. Cancel before the trial ends to avoid the first charge.</p><p className="purchase-terms">Buy Now: {subscriptionOffer.plans[plan].display} USD immediately, then {subscriptionOffer.plans[plan].display} USD {subscriptionOffer.plans[plan].cadence}. Renews automatically until canceled. No free trial.</p></>}
    <div className="local-billing-notice"><strong>{appMode === 'test' ? 'Test mode — no real charges' : 'Checkout is not connected yet'}</strong><p>{appMode === 'test' ? 'Trial and purchase actions here are simulations for testing.' : 'No trial or payment will start without secure checkout.'}</p></div>
    {error && <p className="form-error" role="alert">{error}</p>}
    <div className="dialog-actions checkout-buttons"><button className="text-button" onClick={onClose}>Keep exploring</button><button className="secondary-button" disabled={!plan || busy} onClick={() => void choose('purchase')}>Buy Now</button><button className="primary-button" disabled={!plan || busy} onClick={() => void choose('trial')}>Start Free Trial</button></div>
  </Dialog>;
}
