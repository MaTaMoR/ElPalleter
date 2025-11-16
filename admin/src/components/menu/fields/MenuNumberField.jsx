import React from 'react';
import PropTypes from 'prop-types';
import MenuField from './MenuField';
import styles from './MenuNumberField.module.css';

const MenuNumberField = ({
  label,
  value,
  onChange,
  readOnly = false,
  required = false,
  error = null,
  helperText,
  min,
  max,
  step = 0.01,
  placeholder
}) => {
  const handleChange = (e) => {
    if (onChange && !readOnly) {
      onChange(e.target.value);
    }
  };

  const inputProps = {
    value: value || '',
    onChange: handleChange,
    readOnly,
    min,
    max,
    step,
    placeholder,
    className: `${styles.input} ${readOnly ? styles.readOnly : ''}`
  };

  return (
    <MenuField
      label={label}
      value={value}
      error={error}
      readOnly={readOnly}
      required={required}
      helperText={helperText}
    >
      <input
        type="number"
        {...inputProps}
      />
    </MenuField>
  );
};

MenuNumberField.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onChange: PropTypes.func,
  readOnly: PropTypes.bool,
  required: PropTypes.bool,
  error: PropTypes.string,
  helperText: PropTypes.string,
  min: PropTypes.number,
  max: PropTypes.number,
  step: PropTypes.number,
  placeholder: PropTypes.string
};

export default MenuNumberField;
