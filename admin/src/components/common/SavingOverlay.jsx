import React from 'react';
import PropTypes from 'prop-types';
import styles from './SavingOverlay.module.css';

/**
 * Full-screen overlay with spinner shown during save operations
 */
const SavingOverlay = ({ isVisible = false, message = 'Guardando...' }) => {
  if (!isVisible) return null;

  return (
    <div className={styles.savingOverlay}>
      <div className={styles.savingContent}>
        <div className={styles.savingSpinner}></div>
        <p className={styles.savingText}>{message}</p>
      </div>
    </div>
  );
};

SavingOverlay.propTypes = {
  isVisible: PropTypes.bool,
  message: PropTypes.string
};

export default SavingOverlay;
