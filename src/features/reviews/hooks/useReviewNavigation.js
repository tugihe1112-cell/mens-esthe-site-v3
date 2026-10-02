import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import { reviewFormSignature } from '../reviewTarget.js';
import { trySaveBeforeReviewLeave, reviewLinkDestination, restoreReviewHistory } from '../reviewNavigation.js';

export function useReviewNavigation({ getValues, savedSignatureRef, enabled, save }) {
  const router = useRouter();
  const latest = useRef({ getValues, enabled, save, router });
  latest.current = { getValues, enabled, save, router };
  const pendingRef = useRef(null);
  const restoringRef = useRef(null);
  const allowPopRef = useRef(false);
  const [leaveRequested, setLeaveRequested] = useState(false);

  const tryLeave = useCallback((proceed) => {
    const current = latest.current;
    const allowed = trySaveBeforeReviewLeave({
      values: current.getValues(), savedSignature: savedSignatureRef.current,
      enabled: current.enabled(), save: current.save,
    });
    if (allowed) return true;
    pendingRef.current = proceed;
    setLeaveRequested(true);
    return false;
  }, [savedSignatureRef]);

  const requestNavigation = useCallback((proceed) => {
    if (tryLeave(proceed)) proceed();
  }, [tryLeave]);
  const stay = useCallback(() => { pendingRef.current = null; setLeaveRequested(false); }, []);
  const discardAndLeave = useCallback(() => {
    const proceed = pendingRef.current;
    pendingRef.current = null;
    setLeaveRequested(false);
    proceed?.();
  }, []);

  useEffect(() => {
    const snapshot = () => ({ url: window.location.href, state: window.history.state, index: window.navigation?.currentEntry?.index });
    let previous = snapshot();
    const updateHistory = () => { previous = snapshot(); };
    const onClick = (event) => {
      const destination = reviewLinkDestination(event, window.location);
      if (!destination) return;
      const proceed = () => latest.current.router.push(destination);
      if (tryLeave(proceed)) return;
      event.preventDefault();
      event.stopImmediatePropagation();
    };
    const onBeforeUnload = (event) => {
      const current = latest.current;
      if (!current.enabled() || reviewFormSignature(current.getValues()) === savedSignatureRef.current) return;
      // A successful final synchronous save also makes closing/reloading safe.
      if (current.save(current.getValues()).success) return;
      event.preventDefault();
      event.returnValue = '';
    };
    router.beforePopState((state) => {
      if (restoringRef.current?.restored) restoringRef.current = null;
      if (restoringRef.current) {
        restoringRef.current.restore(state);
        restoringRef.current = null;
        return false;
      }
      if (allowPopRef.current) { allowPopRef.current = false; return true; }
      let restoration;
      const proceed = () => restoration.replay(
        () => { allowPopRef.current = true; },
        () => latest.current.router.replace(state.url, state.as, state.options),
      );
      if (tryLeave(() => { void proceed(); })) return true;
      restoration = restoreReviewHistory(window, previous, () => { restoringRef.current = null; });
      restoringRef.current = restoration;
      return false;
    });
    document.addEventListener('click', onClick, true);
    window.addEventListener('beforeunload', onBeforeUnload);
    router.events.on('routeChangeComplete', updateHistory);
    router.events.on('hashChangeComplete', updateHistory);
    return () => {
      document.removeEventListener('click', onClick, true);
      window.removeEventListener('beforeunload', onBeforeUnload);
      router.events.off('routeChangeComplete', updateHistory);
      router.events.off('hashChangeComplete', updateHistory);
      restoringRef.current?.dispose();
      restoringRef.current = null;
      router.beforePopState(() => true);
    };
  }, [router, savedSignatureRef, tryLeave]);

  return { leaveRequested, requestNavigation, stay, discardAndLeave };
}
