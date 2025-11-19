import React from 'react';
import PropTypes from 'prop-types';
import styles from './BadgeToggle.module.css';

/**
 * Toggleable badge component
 * A clickable badge that toggles between active and inactive states
 */
const BadgeToggle = ({
  label,
  checked = false,
  onChange,
  disabled = false,
  className = ''
}) => {
  const handleClick = () => {
    if (!disabled && onChange) {
      onChange(!checked);
    }
  };

  return (
    <label className={`${styles.badgeToggle} ${checked ? styles.checked : ''} ${disabled ? styles.disabled : ''} ${className}`}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange && onChange(e.target.checked)}
        disabled={disabled}
        className={styles.input}
      />
      <span className={styles.label}>{label}</span>
    </label>
  );
};

BadgeToggle.propTypes = {
  label: PropTypes.string.isRequired,
  checked: PropTypes.bool,
  onChange: PropTypes.func,
  disabled: PropTypes.bool,
  className: PropTypes.string
};

export default BadgeToggle;
