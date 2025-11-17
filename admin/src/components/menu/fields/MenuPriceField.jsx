import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import MenuField from './MenuField';
import { LOCALE_CONFIG } from '../../../config/validationConfig';
import styles from './MenuPriceField.module.css';

const MenuPriceField = ({
  label,
  value,
  onChange,
  error,
  readOnly = false,
  required = false,
  helperText,
  min = 0,
  max = 9999.99,
  currency = '€'
}) => {
  const [displayValue, setDisplayValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  // Update display value when external value changes or focus state changes
  useEffect(() => {
    // If we're focused, don't update display value from external changes
    // This allows the user to edit freely
    if (isFocused) {
      return;
    }

    if (value === '' || value === null || value === undefined) {
      setDisplayValue('');
      return;
    }

    const numValue = parseFloat(String(value));
    if (isNaN(numValue)) {
      setDisplayValue('');
      return;
    }

    // When not focused, show formatted with thousands separator and 2 decimals
    const formatted = numValue.toLocaleString(LOCALE_CONFIG.locale, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
    setDisplayValue(formatted);
  }, [value, isFocused]);

  const handleFocus = (e) => {
    setIsFocused(true);

    // When focusing, convert formatted display to simple editable format
    if (value !== '' && value !== null && value !== undefined) {
      const numValue = parseFloat(String(value));
      if (!isNaN(numValue)) {
        // Show simple format without thousands separator for editing
        // Just the number with comma as decimal separator
        const simpleFormat = String(numValue).replace('.', LOCALE_CONFIG.decimalSeparator);
        setDisplayValue(simpleFormat);
      }
    }

    // Select all text on focus for easy replacement
    e.target.select();
  };

  const handleChange = (e) => {
    if (!onChange) return;

    let inputValue = e.target.value;

    // Permitir vacío para poder borrar
    if (inputValue === '') {
      onChange('');
      setDisplayValue('');
      return;
    }

    // Remove thousands separators if user somehow types them
    inputValue = inputValue.replace(new RegExp(`\\${LOCALE_CONFIG.thousandsSeparator}`, 'g'), '');

    // Block period (.) - only allow comma (,) as decimal separator
    if (inputValue.includes('.')) {
      return; // Don't update if user tries to type period
    }

    // Only allow digits and comma
    if (!/^[\d,]*$/.test(inputValue)) {
      return;
    }

    // Ensure only one comma
    const commaParts = inputValue.split(',');
    if (commaParts.length > 2) {
      return;
    }

    // Validate decimal places (max 2)
    if (commaParts.length === 2 && commaParts[1].length > 2) {
      return;
    }

    // Convert comma to period for internal value
    const normalizedValue = inputValue.replace(',', '.');

    // Validate it's a valid number
    const numValue = parseFloat(normalizedValue);
    if (!isNaN(numValue)) {
      if (numValue >= min && numValue <= max) {
        // Store with period internally (for Java backend)
        onChange(normalizedValue);
        // Update display with what user typed (allows free editing)
        setDisplayValue(inputValue);
      }
    } else if (inputValue === '0' || inputValue === '0,' || normalizedValue.endsWith('.')) {
      // Allow partial inputs like "0," or "1," while typing
      onChange(normalizedValue);
      setDisplayValue(inputValue);
    }
  };

  const handleBlur = () => {
    setIsFocused(false);

    if (!value || value === '') {
      setDisplayValue('');
      return;
    }

    // Format the number when losing focus
    const numValue = parseFloat(String(value));
    if (!isNaN(numValue)) {
      // Store with period (standard format for backend) and ensure 2 decimals
      const formatted = numValue.toFixed(2);
      onChange(formatted);

      // Display will be updated by the useEffect
      // which will show it with locale formatting (thousands separator + comma)
    }
  };

  // Get placeholder with locale decimal separator
  const placeholder = `0${LOCALE_CONFIG.decimalSeparator}00`;

  return (
    <MenuField
      label={label}
      value={value}
      error={error}
      readOnly={readOnly}
      required={required}
      helperText={helperText}
    >
      <div className={styles.priceInputWrapper}>
        <input
          type="text"
          value={displayValue}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          readOnly={readOnly}
          placeholder={placeholder}
          className={`${styles.input} ${readOnly ? styles.readOnly : ''}`}
          inputMode="decimal"
        />
        <span className={styles.currency}>{currency}</span>
      </div>
    </MenuField>
  );
};

MenuPriceField.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onChange: PropTypes.func,
  error: PropTypes.string,
  readOnly: PropTypes.bool,
  required: PropTypes.bool,
  helperText: PropTypes.string,
  min: PropTypes.number,
  max: PropTypes.number,
  currency: PropTypes.string
};

export default MenuPriceField;
