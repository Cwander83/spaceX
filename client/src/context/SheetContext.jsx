import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { flushSync } from 'react-dom';
import { useNavigate } from 'react-router-dom';

const SheetContext = createContext(null);

function prefersReducedMotion() {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

export function SheetProvider({ children }) {
  const navigate = useNavigate();
  const [motionPaused, setMotionPaused] = useState(prefersReducedMotion);
  const [hoveredFlight, setHoveredFlight] = useState(null);
  const [lastInspectedFlight, setLastInspectedFlight] = useState(null);
  const [vtFlight, setVtFlight] = useState(null);

  const toggleMotion = useCallback(() => {
    setMotionPaused((prev) => !prev);
  }, []);

  const navigateSheet = useCallback(
    (event, to, { flightNumber = null, focusId = null } = {}) => {
      if (event) {
        if (
          event.defaultPrevented ||
          event.button !== 0 ||
          event.metaKey ||
          event.ctrlKey ||
          event.shiftKey ||
          event.altKey
        ) {
          return;
        }
        event.preventDefault();
      }

      if (flightNumber != null) {
        setLastInspectedFlight(flightNumber);
      }

      const focusTarget = (preventScroll) => {
        if (!focusId || typeof document === 'undefined') return;
        const el = document.getElementById(focusId);
        if (el) el.focus({ preventScroll });
      };

      if (
        typeof document === 'undefined' ||
        !document.startViewTransition ||
        motionPaused
      ) {
        navigate(to);
        requestAnimationFrame(() => focusTarget(false));
        return;
      }

      flushSync(() => {
        setVtFlight(flightNumber);
      });

      const transition = document.startViewTransition(() => {
        flushSync(() => {
          navigate(to);
        });
      });

      transition.finished.finally(() => {
        setVtFlight(null);
        focusTarget(true);
      });
    },
    [motionPaused, navigate]
  );

  const value = useMemo(
    () => ({
      motionPaused,
      toggleMotion,
      hoveredFlight,
      setHoveredFlight,
      lastInspectedFlight,
      setLastInspectedFlight,
      vtFlight,
      navigateSheet,
    }),
    [
      motionPaused,
      toggleMotion,
      hoveredFlight,
      lastInspectedFlight,
      vtFlight,
      navigateSheet,
    ]
  );

  return <SheetContext.Provider value={value}>{children}</SheetContext.Provider>;
}

export function useSheet() {
  const ctx = useContext(SheetContext);
  if (!ctx) {
    throw new Error('useSheet must be used inside SheetProvider');
  }
  return ctx;
}
