import { useEffect, useRef } from 'react';
import { useBlocker } from 'react-router-dom';

/**
 * Hook to block navigation when there are unsaved changes
 * Uses React Router's official useBlocker API (v6.4+)
 *
 * @param {boolean} shouldBlock - Whether to block navigation
 * @param {function} onBlock - Callback when navigation is blocked (proceed, cancel)
 */
export const useNavigationBlocker = (shouldBlock, onBlock) => {
  const proceedRef = useRef(null);
  const resetRef = useRef(null);

  // Use React Router's official blocker API
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) => {
      // Only block if shouldBlock is true and we're navigating to a different path
      return shouldBlock && currentLocation.pathname !== nextLocation.pathname;
    }
  );

  // When navigation is blocked, show confirmation dialog
  useEffect(() => {
    if (blocker.state === 'blocked') {
      // Store the proceed and reset functions
      proceedRef.current = blocker.proceed;
      resetRef.current = blocker.reset;

      // Call the onBlock callback with proceed and cancel functions
      onBlock(
        () => {
          // User confirmed - proceed with navigation
          if (proceedRef.current) {
            proceedRef.current();
            proceedRef.current = null;
            resetRef.current = null;
          }
        },
        () => {
          // User cancelled - stay on current page
          if (resetRef.current) {
            resetRef.current();
            proceedRef.current = null;
            resetRef.current = null;
          }
        }
      );
    }
  }, [blocker.state, blocker.proceed, blocker.reset, onBlock]);

  return blocker;
};
