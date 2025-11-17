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

  // Convert internal value (always with period) to display value
  useEffect(() => {
    if (value === '' || value === null || value === undefined) {
      setDisplayValue('');
      return;
    }

    const numValue = parseFloat(String(value));
    if (isNaN(numValue)) {
      setDisplayValue('');
      return;
    }

    // When not focused, show formatted with thousands separator
    if (!isFocused) {
      // Format with locale (thousands separator and comma for decimals)
      const formatted = numValue.toLocaleString(LOCALE_CONFIG.locale, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });
      setDisplayValue(formatted);
    } else {
      // When focused, show simple format without thousands separator
      const formatted = numValue.toFixed(2).replace('.', LOCALE_CONFIG.decimalSeparator);
      setDisplayValue(formatted);
    }
  }, [value, isFocused]);

  const handleFocus = () => {
    setIsFocused(true);
    // When focusing, show simple format for editing
    if (value !== '' && value !== null && value !== undefined) {
      const numValue = parseFloat(String(value));
      if (!isNaN(numValue)) {
        const formatted = numValue.toFixed(2).replace('.', LOCALE_CONFIG.decimalSeparator);
        setDisplayValue(formatted);
      }
    }
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
        // Update display with comma
        setDisplayValue(inputValue);
      }
    } else if (inputValue === '0' || inputValue === '0,' || normalizedValue.endsWith('.')) {
      // Allow partial inputs like "0," or "1."
      onChange(normalizedValue);
      setDisplayValue(inputValue);
    }
  };

  const handleBlur = () => {
    setIsFocused(false);

    if (!onChange || !value) return;

    // Formatear el número a 2 decimales al perder foco
    const numValue = parseFloat(String(value));
    if (!isNaN(numValue)) {
      // Store with period (standard format for backend)
      const formatted = numValue.toFixed(2);
      onChange(formatted);
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
