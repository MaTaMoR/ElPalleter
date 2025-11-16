import React from 'react';
import PropTypes from 'prop-types';
import MenuField from './MenuField';
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
  const handleChange = (e) => {
    if (!onChange) return;

    const inputValue = e.target.value;

    // Permitir vacío para poder borrar
    if (inputValue === '') {
      onChange('');
      return;
    }

    // Validar formato de número con hasta 2 decimales
    const numberRegex = /^\d+(\.\d{0,2})?$/;
    if (numberRegex.test(inputValue)) {
      const numValue = parseFloat(inputValue);
      if (numValue >= min && numValue <= max) {
        onChange(inputValue);
      }
    }
  };

  const handleBlur = () => {
    if (!onChange || !value) return;

    // Formatear el número a 2 decimales al perder foco
    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      onChange(numValue.toFixed(2));
    }
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
      <div className={styles.priceInputWrapper}>
        <input
          type="text"
          value={value || ''}
          onChange={handleChange}
          onBlur={handleBlur}
          readOnly={readOnly}
          placeholder="0.00"
          className={`${styles.input} ${readOnly ? styles.readOnly : ''}`}
          min={min}
          max={max}
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
