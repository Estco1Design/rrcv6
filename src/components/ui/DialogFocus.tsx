'use client';
import {useEffect, useRef} from 'react';
// Keeps keyboard focus in the active dialog and restores it after closing.
export function DialogFocus() {
 const marker = useRef<HTMLSpanElement>(null);
 useEffect(() => {
  const dialog = marker.current?.closest<HTMLElement>('[role="dialog"]'); if (!dialog) return;
  const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  const focusable = () => Array.from(dialog.querySelectorAll<HTMLElement>('button:not(:disabled), a[href], input:not(:disabled), textarea:not(:disabled), select:not(:disabled), [tabindex="0"]')).filter(e => e.getClientRects().length > 0);
  const frame = requestAnimationFrame(() => focusable()[0]?.focus({preventScroll: true}));
  const key = (e: KeyboardEvent) => {if (e.key !== 'Tab') return; const elements = focusable(); const first = elements[0]; const last = elements[elements.length - 1]; if (!first) {e.preventDefault();return;} if (e.shiftKey && (document.activeElement === first || !dialog.contains(document.activeElement))) {e.preventDefault();last.focus();} else if (!e.shiftKey && (document.activeElement === last || !dialog.contains(document.activeElement))) {e.preventDefault();first.focus();}};
  document.addEventListener('keydown', key);
  return () => {cancelAnimationFrame(frame);document.removeEventListener('keydown', key);if (previous?.isConnected) previous.focus({preventScroll: true});};
 }, []);
 return <span ref={marker} hidden/>;
}
