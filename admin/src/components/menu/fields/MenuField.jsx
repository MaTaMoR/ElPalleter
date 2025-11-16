import React from 'react';
import PropTypes from 'prop-types';
import styles from './MenuField.module.css';

const MenuField = ({
  label,
  value,
  error,
  readOnly = false,
  required = false,
  children,
  helperText
}) => {
  return (
    <div className={`${styles.fieldContainer} ${error ? styles.hasError : ''}`}>
      <label className={styles.label}>
        {label}
        {required && <span className={styles.required}>*</span>}
      </label>

      <div className={styles.inputWrapper}>
        {children}
      </div>

      {helperText && !error && !readOnly && (
        <span className={styles.helperText}>{helperText}</span>
      )}

      {error && !readOnly && (
        <span className={styles.errorText}>{error}</span>
      )}
    </div>
  );
};

MenuField.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.any,
  error: PropTypes.string,
  readOnly: PropTypes.bool,
  required: PropTypes.bool,
  children: PropTypes.node.isRequired,
  helperText: PropTypes.string
};

export default MenuField;
