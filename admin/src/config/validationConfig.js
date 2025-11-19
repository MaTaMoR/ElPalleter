/**
 * Centralized validation configuration for menu entities
 * Edit these values to change validation requirements across the application
 *
 * NOTE: This file now uses the generic validation utilities from validationUtils.js
 * The actual validation functions are imported in useMenuValidation.js
 */

/**
 * Locale configuration for number formatting
 * Set to 'es-ES' for European Spanish (uses comma as decimal separator)
 * Set to 'en-US' for US English (uses period as decimal separator)
 */
export const LOCALE_CONFIG = {
  locale: 'es-ES', // Change to 'en-US' for US format
  decimalSeparator: ',', // ',' for Europe, '.' for US
  thousandsSeparator: '.', // '.' for Europe, ',' for US
};

/**
 * Menu validation configuration
 * Uses generic validators from validationUtils.js:
 * - validateTextField() for nameKey fields
 * - validatePriceField() for price fields
 */
export const VALIDATION_CONFIG = {
  category: {
    nameKey: {
      required: true,
      minLength: 3,
      maxLength: 100,
      errorMessages: {
        required: 'El nombre es requerido',
        minLength: 'El nombre debe tener al menos {minLength} caracteres',
        maxLength: 'El nombre no puede tener más de {maxLength} caracteres'
      }
    }
  },
  subcategory: {
    nameKey: {
      required: true,
      minLength: 3,
      maxLength: 100,
      errorMessages: {
        required: 'El nombre es requerido',
        minLength: 'El nombre debe tener al menos {minLength} caracteres',
        maxLength: 'El nombre no puede tener más de {maxLength} caracteres'
      }
    }
  },
  item: {
    nameKey: {
      required: true,
      minLength: 3,
      maxLength: 100,
      errorMessages: {
        required: 'El nombre es requerido',
        minLength: 'El nombre debe tener al menos {minLength} caracteres',
        maxLength: 'El nombre no puede tener más de {maxLength} caracteres'
      }
    },
    descriptionKey: {
      required: false,
      minLength: 0,
      maxLength: 500,
      errorMessages: {
        required: 'La descripción es requerida',
        minLength: 'La descripción debe tener al menos {minLength} caracteres',
        maxLength: 'La descripción no puede tener más de {maxLength} caracteres'
      }
    },
    price: {
      required: true,
      min: 0.01, // Changed from 0 to 0.01 - price must be > 0
      max: 9999.99,
      errorMessages: {
        required: 'El precio es requerido',
        min: 'El precio debe ser mayor que {min}€',
        max: 'El precio no puede ser mayor que {max}€',
        invalid: 'El precio debe ser un número válido'
      }
    }
  }
};

/**
 * Helper function to format error messages with dynamic values
 * NOTE: This function is now available in validationUtils.js
 * Kept here for backward compatibility
 */
import { formatErrorMessage as formatErrorMessageUtil } from '../utils/validationUtils';
export const formatErrorMessage = formatErrorMessageUtil;
