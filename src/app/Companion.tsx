import { useEffect, useRef, useState } from 'react';
import { EyeOff, X } from 'lucide-react';
import { EviePortrait } from './EviePortrait';
export function Companion({ onHide, awake, inline = false }: { onHide: () => void; awake: boolean; inline?: boolean }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const close = (event: PointerEvent) => { if (!ref.current?.contains(event.target as Node)) setOpen(false); };
    document.addEventListener('pointerdown', close);
    return () => document.removeEventListener('pointerdown', close);
  }, []);
  return <div className={`companion${inline ? ' companion-inline' : ''}${awake ? ' companion-awake' : ' companion-asleep'}`} ref={ref} onKeyDown={event => { if (event.key === 'Escape') setOpen(false); }}>
    {open && <div className="companion-popover" role="group" aria-label="Evie options"><button className="icon-button" aria-label="Close Evie options" onClick={() => setOpen(false)}><X size={16} aria-hidden="true" /></button><strong>A little cat company.</strong><p>I’ll stay out of your words’ way.</p><button className="secondary-button" onClick={onHide}><EyeOff size={16} aria-hidden="true" />Hide Evie</button><small>Bring her back in Settings.</small></div>}
    <button className="companion-cat" aria-label="Evie — companion options" aria-expanded={open} onClick={() => setOpen(value => !value)}><EviePortrait awake={awake} /></button>
  </div>;
}
