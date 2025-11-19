import React from 'react';
import PropTypes from 'prop-types';
import Toast from './Toast';
import styles from './ToastContainer.module.css';

/**
 * Container for toast notifications
 * Manages multiple toasts and their positioning
 */
const ToastContainer = ({ toasts, onClose }) => {
  if (!toasts || toasts.length === 0) {
    return null;
  }

  return (
    <div className={styles.container}>
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          onClose={() => onClose(toast.id)}
        />
      ))}
    </div>
  );
};

ToastContainer.propTypes = {
  toasts: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      message: PropTypes.string.isRequired,
      type: PropTypes.oneOf(['success', 'error', 'info']),
      duration: PropTypes.number
    })
  ),
  onClose: PropTypes.func.isRequired
};

export default ToastContainer;
