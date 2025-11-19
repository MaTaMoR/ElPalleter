import { useEffect, useContext } from 'react';
import { UNSAFE_NavigationContext as NavigationContext, useLocation } from 'react-router-dom';

/**
 * Hook to block navigation when there are unsaved changes
 *
 * Note: Uses UNSAFE_NavigationContext because the app uses BrowserRouter.
 * useBlocker requires a "data router" (createBrowserRouter), which would require
 * a major refactor of the routing setup. UNSAFE_NavigationContext is perfectly
 * safe to use - it's only marked "UNSAFE" because React Router doesn't guarantee
 * the internal API won't change in future versions.
 *
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

    // Store original navigation methods
    const push = navigator.push;
    const replace = navigator.replace;

    // Override push to intercept navigation
    navigator.push = (...args) => {
      const [to] = args;
      const nextPath = typeof to === 'string' ? to : to.pathname;

      // Only block if navigating to a different path
      if (nextPath !== location.pathname) {
        onBlock(
          () => push.apply(navigator, args), // proceed callback
          () => {} // cancel callback (do nothing)
        );
      } else {
        push.apply(navigator, args);
      }
    };

    // Override replace to intercept navigation
    navigator.replace = (...args) => {
      const [to] = args;
      const nextPath = typeof to === 'string' ? to : to.pathname;

      // Only block if navigating to a different path
      if (nextPath !== location.pathname) {
        onBlock(
          () => replace.apply(navigator, args), // proceed callback
          () => {} // cancel callback (do nothing)
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
