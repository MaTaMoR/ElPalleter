import { useEffect, useContext, useCallback } from 'react';
import { UNSAFE_NavigationContext as NavigationContext, useLocation } from 'react-router-dom';

/**
 * Hook to block navigation when there are unsaved changes
 * @param {boolean} shouldBlock - Whether to block navigation
 * @param {function} onBlock - Callback when navigation is blocked (proceed, cancel)
 */
export const useNavigationBlocker = (shouldBlock, onBlock) => {
  const navigator = useContext(NavigationContext).navigator;
  const location = useLocation();

  useEffect(() => {
    if (!shouldBlock) {
      return;
    }

    // Store original methods
    const push = navigator.push;
    const replace = navigator.replace;

    // Override push
    navigator.push = (...args) => {
      const [to] = args;

      // Get the path from 'to' (can be string or object)
      const nextPath = typeof to === 'string' ? to : to.pathname;

      // Only block if navigating to a different path
      if (nextPath !== location.pathname) {
        // Call onBlock with proceed and cancel callbacks
        onBlock(
          () => push.apply(navigator, args), // proceed
          () => {} // cancel (do nothing)
        );
      } else {
        push.apply(navigator, args);
      }
    };

    // Override replace
    navigator.replace = (...args) => {
      const [to] = args;

      // Get the path from 'to' (can be string or object)
      const nextPath = typeof to === 'string' ? to : to.pathname;

      // Only block if navigating to a different path
      if (nextPath !== location.pathname) {
        // Call onBlock with proceed and cancel callbacks
        onBlock(
          () => replace.apply(navigator, args), // proceed
          () => {} // cancel (do nothing)
        );
      } else {
        replace.apply(navigator, args);
      }
    };

    // Cleanup: restore original methods
    return () => {
      navigator.push = push;
      navigator.replace = replace;
    };
  }, [shouldBlock, navigator, location.pathname, onBlock]);
};
