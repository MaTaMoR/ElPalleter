import React from 'react';
import PropTypes from 'prop-types';
import MenuField from './MenuField';
import styles from './MenuToggleField.module.css';

const MenuToggleField = ({
  label,
  value,
  onChange,
  readOnly = false,
  required = false,
  helperText,
  onLabel = 'Sí',
  offLabel = 'No'
}) => {
  const handleToggle = () => {
    if (!readOnly && onChange) {
      onChange(!value);
    }
  };

  return (
    <MenuField
      label={label}
      value={value}
      readOnly={readOnly}
      required={required}
      helperText={helperText}
    >
      <div className={styles.toggleContainer}>
        <button
          type="button"
          className={`${styles.toggle} ${value ? styles.on : styles.off} ${readOnly ? styles.readOnly : ''}`}
          onClick={handleToggle}
          disabled={readOnly}
          aria-pressed={value}
          aria-label={label}
        >
          <span className={styles.toggleSwitch} />
        </button>
        <span className={styles.toggleLabel}>
          {value ? onLabel : offLabel}
        </span>
      </div>
    </MenuField>
  );
};

MenuToggleField.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.bool,
  onChange: PropTypes.func,
  readOnly: PropTypes.bool,
  required: PropTypes.bool,
  helperText: PropTypes.string,
  onLabel: PropTypes.string,
  offLabel: PropTypes.string
};

export default MenuToggleField;
