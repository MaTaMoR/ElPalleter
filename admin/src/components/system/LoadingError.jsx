import React from 'react';
import PropTypes from 'prop-types';
import styles from './LoadingError.module.css';

/**
 * Component shown when I18n or critical systems fail to load
 */
const LoadingError = ({ error, onRetry }) => {
  const isTimeout = error?.message?.includes('timeout') || error?.message?.includes('Timeout');
  const isNetworkError = error?.message?.includes('fetch') || error?.message?.includes('Network');

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.iconContainer}>
          <svg
            className={styles.errorIcon}
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>

        <h1 className={styles.title}>
          Error al cargar la aplicación
        </h1>

        <p className={styles.message}>
          {isTimeout && 'El servidor no responde. Por favor, verifica tu conexión e inténtalo de nuevo.'}
          {isNetworkError && 'No se pudo conectar con el servidor. Verifica tu conexión a internet.'}
          {!isTimeout && !isNetworkError && 'Ha ocurrido un error al cargar los datos del sistema.'}
        </p>

        {error?.message && (
          <div className={styles.errorDetails}>
            <p className={styles.errorDetailsTitle}>Detalles técnicos:</p>
            <code className={styles.errorDetailsMessage}>{error.message}</code>
          </div>
        )}

        <div className={styles.actions}>
          <button
            className={styles.retryButton}
            onClick={onRetry}
            type="button"
          >
            <svg
              className={styles.retryIcon}
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Reintentar
          </button>

          <button
            className={styles.reloadButton}
            onClick={() => window.location.reload()}
            type="button"
          >
            Recargar página
          </button>
        </div>

        <div className={styles.footer}>
          <p>Si el problema persiste, contacta con soporte técnico.</p>
        </div>
      </div>
    </div>
  );
};

LoadingError.propTypes = {
  error: PropTypes.shape({
    message: PropTypes.string
  }),
  onRetry: PropTypes.func.isRequired
};

export default LoadingError;
