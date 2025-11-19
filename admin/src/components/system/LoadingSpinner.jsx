import React from 'react';
import styles from './LoadingSpinner.module.css';

/**
 * Loading spinner shown during I18n initialization
 */
const LoadingSpinner = () => {
  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.spinnerContainer}>
          <div className={styles.spinner}>
            <div className={styles.spinnerRing}></div>
            <div className={styles.spinnerRing}></div>
            <div className={styles.spinnerRing}></div>
          </div>
        </div>

        <h2 className={styles.title}>Cargando aplicación</h2>
        <p className={styles.subtitle}>Inicializando sistema...</p>

        <div className={styles.progressBar}>
          <div className={styles.progressFill}></div>
        </div>
      </div>
    </div>
  );
};

export default LoadingSpinner;
