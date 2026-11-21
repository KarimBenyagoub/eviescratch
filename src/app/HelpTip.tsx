import { useId, useRef } from 'react';
import { CircleHelp } from 'lucide-react';

/** Native popovers stay above dialogs and dismiss on Escape or an outside tap. */
export function HelpTip({ label, children }: { label: string; children: string }) {
  const id = useId();
  const tip = useRef<HTMLSpanElement>(null);
  return <span className="help-tip"><button type="button" className="help-tip-button" aria-label={`Help: ${label}`} aria-controls={id} aria-describedby={id} aria-haspopup="true" popoverTarget={id} onClick={event => {
    const rect = event.currentTarget.getBoundingClientRect();
    const element = tip.current!;
    const width = Math.min(280, window.innerWidth - 32);
    element.style.width = `${width}px`;
    element.style.left = `${Math.max(16, Math.min(rect.right - width, window.innerWidth - width - 16))}px`;
    element.style.top = `${Math.min(rect.bottom + 8, window.innerHeight / 2)}px`;
  }}><CircleHelp size={17} aria-hidden="true" /></button><span ref={tip} id={id} popover="auto" role="tooltip" className="help-tip-content">{children}</span></span>;
}
