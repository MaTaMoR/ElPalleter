import './styles/global.css';
import './styles/responsive.css';

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import LoadingError from './components/system/LoadingError.jsx';

import I18nService from '@services/I18nService.js';

/**
 * Initialize I18n with timeout protection
 * Returns a promise that rejects if init takes longer than the timeout
 */
const initI18nWithTimeout = (timeoutMs = 15000) => {
  return Promise.race([
    I18nService.init(),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Timeout: El servidor no responde después de 15 segundos')), timeoutMs)
    )
  ]);
};

/**
 * Render the app or error page based on I18n initialization result
 */
const renderApp = (error = null) => {
  const root = ReactDOM.createRoot(document.getElementById('root'));

  if (error) {
    // Show error page with retry option
    root.render(
      <React.StrictMode>
        <LoadingError
          error={error}
          onRetry={() => {
            // Clear the root and try again
            root.unmount();
            initApp();
          }}
        />
      </React.StrictMode>
    );
  } else {
    // Show normal app
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  }
};

/**
 * Initialize the application
 */
const initApp = async () => {
  try {
    await initI18nWithTimeout();
    renderApp();
  } catch (error) {
    console.error('Failed to initialize I18n:', error);
    renderApp(error);
  }
};

// Start the app
initApp();