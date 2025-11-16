import React from 'react';
import PropTypes from 'prop-types';
import MenuField from './MenuField';
import styles from './MenuTextField.module.css';

const MenuTextField = ({
  label,
  value,
  onChange,
  error,
  readOnly = false,
  required = false,
  multiline = false,
  placeholder = '',
  helperText,
  minLength = 3,
  maxLength = null
}) => {
  const handleChange = (e) => {
    if (onChange) {
      onChange(e.target.value);
    }
  };

  const inputProps = {
    value: value || '',
    onChange: handleChange,
    readOnly,
    placeholder,
    className: `${styles.input} ${readOnly ? styles.readOnly : ''}`,
    minLength,
    maxLength
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
      {multiline ? (
        <textarea
          {...inputProps}
          rows={1}
          className={`${styles.textarea} ${readOnly ? styles.readOnly : ''}`}
        />
      ) : (
        <input
          type="text"
          {...inputProps}
        />
      )}
    </MenuField>
  );
};

MenuTextField.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.string,
  onChange: PropTypes.func,
  error: PropTypes.string,
  readOnly: PropTypes.bool,
  required: PropTypes.bool,
  multiline: PropTypes.bool,
  placeholder: PropTypes.string,
  helperText: PropTypes.string,
  minLength: PropTypes.number,
  maxLength: PropTypes.number
};

export default MenuTextField;
