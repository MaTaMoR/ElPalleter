import React, { useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import MenuField from './MenuField';
import styles from './MenuTextField.module.css';

const MenuTextField = ({
  label,
  value,
  onChange,
  onBlur,
  error,
  readOnly = false,
  required = false,
  multiline = false,
  placeholder = '',
  helperText,
  minLength = 3,
  maxLength = null,
  autoResize = false
}) => {
  const textareaRef = useRef(null);

  // Auto-resize textarea based on content
  useEffect(() => {
    if (autoResize && multiline && textareaRef.current) {
      const textarea = textareaRef.current;
      // Reset height to auto to get the correct scrollHeight
      textarea.style.height = 'auto';
      // Set height to scrollHeight to fit content
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, [value, autoResize, multiline]);

  const handleChange = (e) => {
    if (onChange) {
      onChange(e.target.value);
    }
  };

  const handleBlur = (e) => {
    if (onBlur) {
      onBlur(e.target.value);
    }
  };

  const inputProps = {
    value: value || '',
    onChange: handleChange,
    onBlur: handleBlur,
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
          ref={textareaRef}
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
  onBlur: PropTypes.func,
  error: PropTypes.string,
  readOnly: PropTypes.bool,
  required: PropTypes.bool,
  multiline: PropTypes.bool,
  placeholder: PropTypes.string,
  helperText: PropTypes.string,
  minLength: PropTypes.number,
  maxLength: PropTypes.number,
  autoResize: PropTypes.bool
};

export default MenuTextField;
