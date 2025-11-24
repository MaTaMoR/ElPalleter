import React from 'react';
import PropTypes from 'prop-types';
import { X, AlertTriangle } from 'lucide-react';
import styles from './ConfirmDialog.module.css';

const ConfirmDialog = ({
  isOpen,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  onConfirm,
  onCancel,
  type = 'warning' // 'warning' | 'danger' | 'info'
}) => {
  if (!isOpen) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onCancel();
    }
  };

  return (
    <div className={styles.backdrop} onClick={handleBackdropClick}>
      <div className={styles.dialog} role="dialog" aria-modal="true" aria-labelledby="dialog-title">
        <button
          type="button"
          className={styles.closeButton}
          onClick={onCancel}
          aria-label="Cerrar"
        >
          <X size={20} />
        </button>

        <div className={`${styles.iconContainer} ${styles[type]}`}>
          <AlertTriangle size={32} />
        </div>

        <h2 id="dialog-title" className={styles.title}>{title}</h2>

        <p className={styles.message}>{message}</p>

        <div className={styles.actions}>
          <button
            type="button"
            className={styles.cancelButton}
            onClick={onCancel}
          >
            {cancelText}
          </button>
          <button
            type="button"
            className={`${styles.confirmButton} ${styles[type]}`}
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

ConfirmDialog.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  title: PropTypes.string.isRequired,
  message: PropTypes.string.isRequired,
  confirmText: PropTypes.string,
  cancelText: PropTypes.string,
  onConfirm: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  type: PropTypes.oneOf(['warning', 'danger', 'info'])
};

export default ConfirmDialog;
