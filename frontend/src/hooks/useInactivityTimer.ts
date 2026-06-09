import { useEffect, useRef, useState, useCallback } from 'react';

const ACTIVITY_EVENTS = ['mousemove', 'keydown', 'click', 'touchstart', 'scroll'] as const;
const WARN_BEFORE_MS  = 60_000; // show warning 60 s before expiry

/**
 * Tracks user inactivity and calls onExpire() when the timeout is reached.
 * Returns warningVisible (true for the last 60 s) and remainingSeconds.
 *
 * @param timeoutMinutes  0 = disabled
 * @param onExpire        called when the session should expire
 */
export function useInactivityTimer(
  timeoutMinutes: number,
  onExpire: () => void,
) {
  const [warningVisible, setWarningVisible]   = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(60);

  // Keep onExpire stable so the effect doesn't restart when the function identity changes
  const onExpireRef = useRef(onExpire);
  useEffect(() => { onExpireRef.current = onExpire; }, [onExpire]);

  const expireTimer = useRef<ReturnType<typeof setTimeout>  | null>(null);
  const warnTimer   = useRef<ReturnType<typeof setTimeout>  | null>(null);
  const countTimer  = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearAll = useCallback(() => {
    if (expireTimer.current) clearTimeout(expireTimer.current);
    if (warnTimer.current)   clearTimeout(warnTimer.current);
    if (countTimer.current)  clearInterval(countTimer.current);
    expireTimer.current = null;
    warnTimer.current   = null;
    countTimer.current  = null;
  }, []);

  const reset = useCallback(() => {
    if (!timeoutMinutes || timeoutMinutes <= 0) return;
    clearAll();
    setWarningVisible(false);

    const totalMs = timeoutMinutes * 60_000;
    const warnAt  = totalMs - WARN_BEFORE_MS;

    if (warnAt > 0) {
      warnTimer.current = setTimeout(() => {
        setWarningVisible(true);
        setRemainingSeconds(60);
        // countdown tick
        countTimer.current = setInterval(() => {
          setRemainingSeconds(s => {
            if (s <= 1) { clearInterval(countTimer.current!); return 0; }
            return s - 1;
          });
        }, 1_000);
      }, warnAt);
    } else {
      // timeout < 1 min — just show warning immediately when started
      setWarningVisible(true);
    }

    expireTimer.current = setTimeout(() => {
      setWarningVisible(false);
      onExpireRef.current();
    }, totalMs);
  }, [timeoutMinutes, clearAll]);

  useEffect(() => {
    if (!timeoutMinutes || timeoutMinutes <= 0) {
      clearAll();
      setWarningVisible(false);
      return;
    }

    ACTIVITY_EVENTS.forEach(e => window.addEventListener(e, reset, { passive: true }));
    reset(); // start on mount

    return () => {
      clearAll();
      ACTIVITY_EVENTS.forEach(e => window.removeEventListener(e, reset));
    };
  }, [timeoutMinutes, reset, clearAll]);

  return { warningVisible, remainingSeconds };
}
