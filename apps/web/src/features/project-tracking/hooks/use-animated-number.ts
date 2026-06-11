import { useEffect, useRef, useState } from 'react';

const DEFAULT_DURATION = 700;

/** ease-out-quad — smooth start, calm finish. */
function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

/**
 * Returns a numeric value that smoothly transitions to `target` over `duration` ms
 * via requestAnimationFrame. Cancels and restarts on subsequent target changes.
 */
export function useAnimatedNumber(
  target: number,
  duration = DEFAULT_DURATION,
): number {
  const [value, setValue] = useState(0);
  const startRef = useRef<number | null>(null);
  const fromRef = useRef(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    if (
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      setValue(target);
      return undefined;
    }

    fromRef.current = value;
    startRef.current = null;
    const startValue = fromRef.current;
    const delta = target - startValue;

    const tick = (now: number) => {
      if (startRef.current === null) startRef.current = now;
      const elapsed = now - startRef.current;
      const t = Math.min(1, elapsed / duration);
      const next = startValue + delta * easeOutCubic(t);
      setValue(next);
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
    // We intentionally do NOT include `value` in deps to avoid restarting mid-animation.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, duration]);

  return value;
}
