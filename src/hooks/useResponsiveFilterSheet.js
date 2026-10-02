import { useCallback, useEffect, useId, useRef, useState } from 'react';

const DESKTOP_QUERY = '(min-width: 1024px)';
const FOCUSABLE = 'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

// シートを開いている間だけDOMへ作用する。幅変更時はReactの更新を待たずロックを解除する。
export function activateFilterSheet({ panel, opener, onClose, document: doc, window: win }) {
  const desktop = win.matchMedia(DESKTOP_QUERY);
  if (desktop.matches || !panel) {
    onClose();
    return () => {};
  }

  const previousOverflow = doc.body.style.overflow;
  const returnTarget = opener || doc.activeElement;
  doc.body.style.overflow = 'hidden';
  const focusable = () => [...panel.querySelectorAll(FOCUSABLE)]
    .filter((element) => element.getClientRects().length > 0);
  const focus = (element) => element?.focus?.({ preventScroll: true });
  focus(focusable()[0] || panel);

  const onKeyDown = (event) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      onClose();
    } else if (event.key === 'Tab') {
      const elements = focusable();
      const first = elements[0];
      const last = elements.at(-1);
      if (!first) {
        event.preventDefault();
        focus(panel);
      } else if (!panel.contains(doc.activeElement)) {
        event.preventDefault();
        focus(event.shiftKey ? last : first);
      } else if (event.shiftKey && doc.activeElement === first) {
        event.preventDefault();
        focus(last);
      } else if (!event.shiftKey && doc.activeElement === last) {
        event.preventDefault();
        focus(first);
      }
    }
  };
  const onBoundaryChange = () => {
    if (!desktop.matches) return;
    doc.body.style.overflow = previousOverflow;
    onClose();
  };
  doc.addEventListener('keydown', onKeyDown);
  desktop.addEventListener('change', onBoundaryChange);

  return () => {
    doc.body.style.overflow = previousOverflow;
    doc.removeEventListener('keydown', onKeyDown);
    desktop.removeEventListener('change', onBoundaryChange);
    // PC幅では開くボタンが非表示になるので、表示中のタグ列へフォーカスを残す。
    if (desktop.matches) {
      if (panel.isConnected) focus(panel);
    } else if (returnTarget?.isConnected) {
      focus(returnTarget);
    }
  };
}

export function useResponsiveFilterSheet(pageKey) {
  const [isOpen, setIsOpen] = useState(false);
  const openerRef = useRef(null);
  const panelRef = useRef(null);
  const dialogId = `tag-filter-${useId()}`;
  const close = useCallback(() => setIsOpen(false), []);
  const open = useCallback(() => {
    if (!window.matchMedia(DESKTOP_QUERY).matches) setIsOpen(true);
  }, []);

  useEffect(() => { close(); }, [pageKey, close]);
  useEffect(() => {
    if (!isOpen) return undefined;
    return activateFilterSheet({
      panel: panelRef.current,
      opener: openerRef.current,
      onClose: close,
      document,
      window,
    });
  }, [isOpen, close]);

  return { isOpen, open, close, openerRef, panelRef, dialogId };
}
