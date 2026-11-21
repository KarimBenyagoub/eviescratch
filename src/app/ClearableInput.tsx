import { useRef, type InputHTMLAttributes } from 'react';
import { X } from 'lucide-react';

export function ClearableInput({ onClear, clearLabel = 'Clear text', ...props }: InputHTMLAttributes<HTMLInputElement> & { onClear: () => void; clearLabel?: string }) {
  const ref = useRef<HTMLInputElement>(null);
  return <span className="clearable-input"><input {...props} ref={ref} />{props.value && !props.readOnly && !props.disabled ? <button type="button" aria-label={clearLabel} className="clear-field" onPointerDown={event => event.preventDefault()} onClick={event => { event.preventDefault(); onClear(); ref.current?.focus(); }}><X size={16} aria-hidden="true" /></button> : null}</span>;
}
