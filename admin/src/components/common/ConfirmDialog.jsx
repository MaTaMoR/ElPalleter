import React, { useEffect } from 'react';
import ReactDOM from 'react-dom';
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
  // Disable body scroll when dialog is open
  useEffect(() => {
    if (isOpen) {
      // Save current overflow value
      const originalOverflow = document.body.style.overflow;
      // Disable scroll
      document.body.style.overflow = 'hidden';

      // Restore scroll on cleanup
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onCancel();
    }
  };

  const dialogContent = (
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

  // Render the dialog in a portal attached to document.body
  return ReactDOM.createPortal(dialogContent, document.body);
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
