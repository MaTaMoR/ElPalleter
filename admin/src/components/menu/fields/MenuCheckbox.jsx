import React from 'react';
import PropTypes from 'prop-types';
import styles from './MenuCheckbox.module.css';

const MenuCheckbox = ({
  label,
  checked = false,
  onChange,
  disabled = false,
  helperText
}) => {
  const handleChange = (e) => {
    if (onChange) {
      onChange(e.target.checked);
    }
  };

  return (
    <div className={styles.fieldWrapper}>
      <label className={styles.checkboxLabel}>
        <input
          type="checkbox"
          checked={checked}
          onChange={handleChange}
          disabled={disabled}
          className={styles.checkbox}
        />
        <span className={styles.labelText}>{label}</span>
      </label>
      {helperText && (
        <span className={styles.helperText}>{helperText}</span>
      )}
    </div>
  );
};

MenuCheckbox.propTypes = {
  label: PropTypes.string.isRequired,
  checked: PropTypes.bool,
  onChange: PropTypes.func,
  disabled: PropTypes.bool,
  helperText: PropTypes.string
};

export default MenuCheckbox;
