import { X, PenLine, FolderInput, Search } from 'lucide-react';
import { TrialRemaining } from './TrialRemaining';
import type { DemoAccess } from '../domain/trial';
export function GettingStarted({ step, onAction, onSkip, onPlans, access }: { step: number; onAction: () => void; onSkip: () => void; onPlans: () => void; access: DemoAccess | null }) {
  if (step >= 3) return null;
  const content = [
    { title: 'Welcome to EvieScratch.', text: 'Start with one sentence. We’ll save it on this device as you write.', action: 'Start writing', icon: PenLine },
    { title: 'Your first thought, safely tucked away.', text: 'Keep it in Inbox, or give it a home in a Journal. Shelves can group your Journals later.', action: 'Choose a Journal', icon: FolderInput },
    { title: 'Find that thought again.', text: 'Search your note’s title, words, or tags. You can always see which part of your library you’re searching.', action: 'Try search', icon: Search },
  ][step]!;
  const Icon = content.icon;
  return <section className="getting-started" aria-label="Getting started"><button className="icon-button guide-close" aria-label="Dismiss getting-started tips" onClick={onSkip}><X size={17} aria-hidden="true" /></button><div><span className="guide-step">GETTING STARTED · {step + 1} OF 3 · OPTIONAL</span><h2>{content.title}</h2><p>{content.text}</p><div className="guide-actions"><button onClick={onAction}><Icon size={16} aria-hidden="true" />{content.action}</button><button onClick={onSkip}>Skip tips</button></div><button className="guide-offer" onClick={onPlans}>3 days free · $7.99/week or $299.88/year<TrialRemaining access={access} /></button></div></section>;
}
