import './styles/global.css';
import './styles/responsive.css';

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import LoadingError from './components/system/LoadingError.jsx';
import LoadingSpinner from './components/system/LoadingSpinner.jsx';

import I18nService from '@services/I18nService.js';

// Create root once
const root = ReactDOM.createRoot(document.getElementById('root'));

/**
 * Initialize I18n with timeout protection
 * Returns a promise that rejects if init takes longer than the timeout
 */
const initI18nWithTimeout = (timeoutMs = 5000) => {
  return Promise.race([
    I18nService.init(),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Timeout: El servidor no responde después de 5 segundos')), timeoutMs)
    )
  ]);
};

/**
 * Render content based on state
 */
const render = (component) => {
  root.render(
    <React.StrictMode>
      {component}
    </React.StrictMode>
  );
};

/**
 * Retry initialization by reloading I18n completely
 */
const retryInit = async () => {
  // Show loading spinner
  render(<LoadingSpinner />);

  try {
    // Reload I18n (resets state and loads again)
    await Promise.race([
      I18nService.reload(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Timeout: El servidor no responde después de 15 segundos')), 15000)
      )
    ]);

    // Success - show the app
    render(<App />);
  } catch (error) {
    // Error - show error page with retry
    console.error('Failed to reload I18n:', error);
    render(
      <LoadingError
        error={error}
        onRetry={retryInit}
      />
    );
  }
};

/**
 * Initialize the application
 */
const initApp = async () => {
  // Show loading spinner
  render(<LoadingSpinner />);

  try {
    // Wait for I18n to initialize
    await initI18nWithTimeout();

    // Success - show the app
    render(<App />);
  } catch (error) {
    // Error - show error page with retry
    console.error('Failed to initialize I18n:', error);
    render(
      <LoadingError
        error={error}
        onRetry={retryInit}
      />
    );
  }
};

// Start the app
initApp();