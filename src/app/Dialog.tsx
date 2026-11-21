import { useContext, useEffect, useRef, type ReactNode } from 'react';
import { Menu, X } from 'lucide-react';
import { AppNavigation } from './AppNavigation';

export function Dialog({ title, onClose, children, wide = false }: { title: string; onClose: () => void; children: ReactNode; wide?: boolean }) {
  const ref = useRef<HTMLDialogElement>(null);
  const openNavigation = useContext(AppNavigation);
  useEffect(() => {
    const dialog = ref.current!;
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const selection = window.getSelection();
    const range = previous?.isContentEditable && selection?.rangeCount ? selection.getRangeAt(0).cloneRange() : null;
    const textSelection = previous instanceof HTMLTextAreaElement ? [previous.selectionStart, previous.selectionEnd] as const : null;
    dialog.showModal();
    return () => {
      dialog.close();
      if (!previous?.isConnected) return;
      previous.focus({ preventScroll: true });
      if (range?.commonAncestorContainer.isConnected) {
        selection?.removeAllRanges(); selection?.addRange(range);
      }
      if (textSelection && previous instanceof HTMLTextAreaElement) previous.setSelectionRange(...textSelection);
    };
  }, []);
  return <dialog ref={ref} className={`app-dialog ${wide ? 'dialog-wide' : ''}`} aria-labelledby="dialog-title" onCancel={event => { event.preventDefault(); onClose(); }} onClick={event => { if (event.target === event.currentTarget) onClose(); }}>
    <div className="dialog-heading"><h2 id="dialog-title">{title}</h2><div className="dialog-heading-actions"><button type="button" className="icon-button" aria-label="Close dialog" onClick={onClose}><X size={20} aria-hidden="true" /></button>{openNavigation && title !== 'Your library' && <button type="button" className="icon-button" aria-label="Open app menu" aria-haspopup="dialog" onClick={openNavigation}><Menu size={21} aria-hidden="true" /></button>}</div></div>
    {children}
  </dialog>;
}
