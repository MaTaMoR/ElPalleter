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

    // Helper to check if navigation is leaving the current page section
    const isLeavingPage = (nextPath) => {
      // Extract pathname from string or object
      const nextPathname = typeof nextPath === 'string'
        ? nextPath.split('?')[0]  // Remove query params if present
        : nextPath.pathname;

      // Get base route (e.g., /admin/menu from /admin/menu/categories/cat-1)
      // This finds the common parent route that contains all sub-routes
      const getCurrentBase = (path) => {
        const segments = path.split('/').filter(Boolean);
        // For /admin/menu/categories/... we want /admin/menu
        // Take first 2 segments for admin routes
        return '/' + segments.slice(0, 2).join('/');
      };

      const currentBase = getCurrentBase(location.pathname);
      const nextBase = getCurrentBase(nextPathname);

      // Only block if navigating to a DIFFERENT base section
      // Allow all navigation within the same section (e.g., /admin/menu/*)
      return currentBase !== nextBase;
    };

    // Override push to intercept navigation
    navigator.push = (...args) => {
      const [to] = args;

      // Only block if actually leaving the page
      if (isLeavingPage(to)) {
        onBlock(
          () => push.apply(navigator, args), // proceed callback
          () => {} // cancel callback (do nothing)
        );
      } else {
        // Allow internal navigation (same page, different query params)
        push.apply(navigator, args);
      }
    };

    // Override replace to intercept navigation
    navigator.replace = (...args) => {
      const [to] = args;

      // Only block if actually leaving the page
      if (isLeavingPage(to)) {
        onBlock(
          () => replace.apply(navigator, args), // proceed callback
          () => {} // cancel callback (do nothing)
        );
      } else {
        // Allow internal navigation (same page, different query params)
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
