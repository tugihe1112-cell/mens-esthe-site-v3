import { reviewFormSignature } from './reviewTarget.js';

// All exit paths use this synchronous decision, including the one-second autosave window.
export function trySaveBeforeReviewLeave({ values, savedSignature, enabled = true, save }) {
  if (!enabled || reviewFormSignature(values) === savedSignature) return true;
  return save(values).success === true;
}

export function reviewLinkDestination(event, location) {
  if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return null;
  const anchor = event.target?.closest?.('a[href]');
  if (!anchor || anchor.hasAttribute('download') || (anchor.target && anchor.target !== '_self')) return null;
  const next = new URL(anchor.href, location.href);
  const current = new URL(location.href);
  if (next.origin !== current.origin || (next.pathname === current.pathname && next.search === current.search)) return null;
  return `${next.pathname}${next.search}${next.hash}`;
}

// beforePopState runs after the browser has moved its history position. Restore that
// position while the form remains mounted, then replay the exact move after a choice.
export function restoreReviewHistory(windowObject, previous, onRestored = () => {}) {
  const targetIndex = windowObject.navigation?.currentEntry?.index;
  const delta = Number.isInteger(previous.index) && Number.isInteger(targetIndex)
    ? previous.index - targetIndex : 1;
  let finish;
  const restored = new Promise((resolve) => { finish = resolve; });
  let timer;
  let historyRestored = false;
  const pending = {
    restored: false,
    restore(eventState) {
      historyRestored = eventState?.key === previous.state?.key && delta !== 0;
      if (!historyRestored) windowObject.history.replaceState(previous.state, '', previous.url);
      clearTimeout(timer);
      pending.restored = true;
      onRestored();
      finish();
    },
    async replay(beforeHistoryReplay, fallbackNavigation) {
      await restored;
      if (historyRestored) {
        beforeHistoryReplay();
        windowObject.history.go(-delta);
      } else {
        fallbackNavigation();
      }
    },
    dispose() { clearTimeout(timer); finish(); },
  };
  windowObject.history.go(delta);
  // Older engines don't expose history indices. If an unknown forward move cannot
  // be undone with go(1), retain the form at its original URL instead of losing it.
  timer = setTimeout(() => {
    windowObject.history.replaceState(previous.state, '', previous.url);
    pending.restored = true;
    onRestored();
    finish();
  }, 250);
  return pending;
}
