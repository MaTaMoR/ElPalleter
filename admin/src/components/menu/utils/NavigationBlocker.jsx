import { useEffect } from 'react';
import { useBlocker } from 'react-router-dom';

/**
 * Component that blocks navigation when there are unsaved changes
 * Uses React Router's useBlocker hook to intercept navigation attempts
 */
const NavigationBlocker = ({ when, onBlock }) => {
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      when && currentLocation.pathname !== nextLocation.pathname
  );

  useEffect(() => {
    if (blocker.state === 'blocked') {
      // Call the callback to show confirmation dialog
      onBlock({
        proceed: () => blocker.proceed(),
        reset: () => blocker.reset()
      });
    }
  }, [blocker, onBlock]);

  return null;
};

export default NavigationBlocker;
