/**
 * Centralized validation configuration for menu entities
 * Edit these values to change validation requirements across the application
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
 */
export const formatErrorMessage = (message, config) => {
  return message
    .replace('{minLength}', config.minLength)
    .replace('{maxLength}', config.maxLength)
    .replace('{min}', config.min)
    .replace('{max}', config.max);
};
