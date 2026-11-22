import { useEffect, useState } from 'react';
import { BookOpen, Check, Layers, PenLine } from 'lucide-react';
import { subscriptionOffer, type PlanId } from '../domain/offer';
import type { CheckoutIntent, DemoAccess } from '../domain/trial';
import type { AppMode } from './environment';
import { ClearableInput } from './ClearableInput';
import { IntroScene } from './IntroScene';
import { EviePortrait } from './EviePortrait';
import { TrialRemaining } from './TrialRemaining';

export function Onboarding({ mode, showIntro = true, ready, error, access, onFinish, onReset }: {
  mode: AppMode; showIntro?: boolean; ready: boolean; error: string; access: DemoAccess | null;
  onFinish: (plan: PlanId | null, journalName: string, intent: CheckoutIntent | 'explore') => Promise<void>; onReset: () => void;
}) {
  const [intro, setIntro] = useState(showIntro);
  const [playing, setPlaying] = useState(false);
  const [step, setStep] = useState(0);
  const [plan, setPlan] = useState<PlanId | null>(null);
  const [journal, setJournal] = useState('');
  const [working, setWorking] = useState(false);
  useEffect(() => {
    if (!showIntro) return;
    let active = true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let preloadDeadline: ReturnType<typeof setTimeout> | undefined;
    const introImg = new Image();
    introImg.src = '/images/evie-intro.webp';
    const poses = Promise.all([
      introImg.decode().catch(() => undefined),
      ...['rest', 'lookdown', 'lift', 'scratch'].map(pose => {
        const image = new Image(); image.src = `/images/evie-intro-${pose}.webp`;
        return image.decode().catch(() => undefined);
      }),
    ]);
    // A missing image must never leave onboarding stuck behind the splash.
    void Promise.race([poses, new Promise(resolve => { preloadDeadline = setTimeout(resolve, 700); })]).then(() => {
      clearTimeout(preloadDeadline);
      if (!active) return;
      setPlaying(true);
      timer = setTimeout(() => setIntro(false), 3500); // Exactly 3.5 seconds total splash screen time
    });
    return () => { active = false; clearTimeout(timer); clearTimeout(preloadDeadline); };
  }, [showIntro]);
  async function finish(intent: CheckoutIntent | 'explore') {
    if (!ready || working || (intent !== 'explore' && !plan)) return;
    setWorking(true);
    try { await onFinish(intent === 'explore' ? null : plan, intent === 'explore' ? '' : journal.trim(), intent); }
    finally { setWorking(false); }
  }
  return <div className="onboarding-shell">
    <div className="onboarding-content" inert={intro} aria-hidden={intro}>
      {mode === 'test' && <div className="test-mode-banner"><strong>TEST MODE</strong><span>Demo data · No real charges</span><button onClick={onReset}>Hard reset demo</button></div>}
      <header className="onboarding-header"><button className="brand brand-button" onClick={onReset} aria-label="EvieScratch logo — welcome and demo reset"><span className="brand-mark"><BookOpen size={22} aria-hidden="true" /></span><span>EvieScratch<span className="brand-dot">.</span></span></button><button className="text-button" disabled={!ready || working} onClick={() => void finish('explore')}>Skip for now</button></header>
      <main className="onboarding-page" key={step}>
        <div className="onboarding-progress" aria-label={`Getting started, step ${step + 1} of 3`}>{[0, 1, 2].map(value => <span key={value} data-active={value <= step} />)}</div>
        {step === 0 && <><EviePortrait className="onboarding-evie" /><p className="eyebrow">A CALMER PLACE FOR YOUR THOUGHTS</p><h1>Welcome to EvieScratch.</h1><p className="onboarding-lede">Take notes: Ideas, plans, everyday little things. Give them a quiet place to land, with Evie beside you.</p><div className="onboarding-promises"><span><PenLine size={19} aria-hidden="true" />Write without the clutter</span><span><BookOpen size={19} aria-hidden="true" />Keep related notes together</span><span><Check size={19} aria-hidden="true" />Know when your words are saved</span></div><button className="primary-button onboarding-next" onClick={() => setStep(1)}>Let’s begin</button><p className="onboarding-offer-line">3 days free · Then $7.99/week or $299.88/year<TrialRemaining access={access} /></p></>}
        {step === 1 && <><p className="eyebrow">A LITTLE ORDER, YOUR WAY</p><h1>Every thought can find a home.</h1><p className="onboarding-lede">Notes go in Journals. Shelves group your Journals. Inbox is ready whenever you just want to write.</p><div className="onboarding-hierarchy"><span><Layers size={23} aria-hidden="true" />Shelf<small>Everyday life</small></span><span><BookOpen size={23} aria-hidden="true" />Journal<small>Little ideas</small></span><span><PenLine size={23} aria-hidden="true" />Note<small>A thought worth keeping</small></span></div><label className="field-label">Name your first Journal <small>Optional — Inbox is already waiting</small><ClearableInput aria-label="Name your first Journal" clearLabel="Clear Journal name" autoFocus value={journal} maxLength={200} placeholder="e.g. Little ideas" onChange={event => setJournal(event.target.value)} onClear={() => setJournal('')} /></label><div className="onboarding-buttons"><button className="secondary-button" onClick={() => setStep(0)}>Back</button><button className="primary-button" onClick={() => setStep(2)}>Continue</button></div></>}
        {step === 2 && <><p className="eyebrow">YOUR PLAN, UPFRONT</p><h1>3 days to make yourself at home.</h1><p className="onboarding-lede">Choose weekly or yearly. Start with three days free, or buy now and skip the trial.</p><div className="plan-options" role="radiogroup" aria-label="Onboarding subscription plan">{(Object.entries(subscriptionOffer.plans) as [PlanId, typeof subscriptionOffer.plans[PlanId]][]).map(([id, offer]) => <label className={`plan-card ${plan === id ? 'selected' : ''}`} key={id}><span className="plan-label"><strong>{offer.label}</strong><input type="radio" name="onboarding-plan" checked={plan === id} onChange={() => setPlan(id)} /></span><span className="plan-price"><span>USD {offer.cadence}</span> <strong>{offer.display}</strong></span><span>After 3 days free</span></label>)}</div>
          <div className="local-billing-notice small-notice"><small>{mode === 'test' ? '(testmode - no real charges)' : 'Checkout is not connected yet'}</small></div>
          <div className="visually-hidden" aria-hidden="true">{plan && <p className="renewal-terms">Start Free Trial: 3 days free, then {subscriptionOffer.plans[plan].display} USD {subscriptionOffer.plans[plan].cadence}.</p>}</div>
          <div className="onboarding-buttons checkout-buttons"><button className="text-button" onClick={() => setStep(1)}>Back</button><button className="secondary-button" disabled={!ready || working || !plan} onClick={() => void finish('purchase')}>Buy Now</button><button className="primary-button" disabled={!ready || working || !plan} onClick={() => void finish('trial')}>{working ? 'Getting your space ready…' : 'Start Free Trial'}</button></div></>}
        {error && <p className="form-error" role="alert">{error}</p>}
      </main>
    </div>
    {intro && <IntroScene playing={playing} />}
  </div>;
}
