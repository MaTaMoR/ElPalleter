import { useEffect, useCallback, useRef } from 'react';
import { unstable_useBlocker as useBlocker } from 'react-router-dom';

/**
 * Hook to block navigation when there are unsaved changes
 * @param {boolean} shouldBlock - Whether to block navigation
 * @param {function} onBlock - Callback when navigation is blocked, receives a proceed callback
 */
export const useNavigationBlocker = (shouldBlock, onBlock) => {
  const proceedRef = useRef(null);
  const resetRef = useRef(null);

  // Use React Router's blocker
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) => {
      // Only block if shouldBlock is true and we're navigating away
      return shouldBlock && currentLocation.pathname !== nextLocation.pathname;
    }
  );

  // When blocker is triggered
  useEffect(() => {
    if (blocker.state === 'blocked') {
      // Store the proceed and reset functions
      proceedRef.current = blocker.proceed;
      resetRef.current = blocker.reset;

      // Call the onBlock callback with a proceed function
      onBlock(() => {
        if (proceedRef.current) {
          proceedRef.current();
          proceedRef.current = null;
          resetRef.current = null;
        }
      }, () => {
        if (resetRef.current) {
          resetRef.current();
          proceedRef.current = null;
          resetRef.current = null;
        }
      });
    }
  }, [blocker.state, blocker.proceed, blocker.reset, onBlock]);

  return blocker;
};
