/**
 * Generic validation utilities
 * Reusable across different modules (menu, contact, etc.)
 */

/**
 * Validates a text field based on configuration
 * @param {string} value - The value to validate
 * @param {Object} fieldConfig - Configuration object with validation rules
 * @returns {string|null} Error message or null if valid
 */
export const validateTextField = (value, fieldConfig) => {
  if (!value || value.trim().length === 0) {
    if (fieldConfig.required) {
      return fieldConfig.errorMessages.required;
    }
    return null;
  }

  const trimmedValue = value.trim();

  if (trimmedValue.length < fieldConfig.minLength) {
    return formatErrorMessage(fieldConfig.errorMessages.minLength, fieldConfig);
  }

  if (fieldConfig.maxLength && trimmedValue.length > fieldConfig.maxLength) {
    return formatErrorMessage(fieldConfig.errorMessages.maxLength, fieldConfig);
  }

  return null;
};

/**
 * Validates a price/number field based on configuration
 * @param {number|string} value - The value to validate
 * @param {Object} fieldConfig - Configuration object with validation rules
 * @returns {string|null} Error message or null if valid
 */
export const validatePriceField = (value, fieldConfig) => {
  if (value === undefined || value === null || value === '') {
    if (fieldConfig.required) {
      return fieldConfig.errorMessages.required;
    }
    return null;
  }

  const priceNum = parseFloat(value);

  if (isNaN(priceNum)) {
    return fieldConfig.errorMessages.invalid;
  }

  if (priceNum < fieldConfig.min) {
    return formatErrorMessage(fieldConfig.errorMessages.min, fieldConfig);
  }

  if (fieldConfig.max && priceNum > fieldConfig.max) {
    return formatErrorMessage(fieldConfig.errorMessages.max, fieldConfig);
  }

  return null;
};

/**
 * Validates an email field
 * @param {string} value - The email to validate
 * @param {Object} fieldConfig - Configuration object with validation rules
 * @returns {string|null} Error message or null if valid
 */
export const validateEmailField = (value, fieldConfig) => {
  if (!value || value.trim().length === 0) {
    if (fieldConfig.required) {
      return fieldConfig.errorMessages.required;
    }
    return null;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(value.trim())) {
    return fieldConfig.errorMessages.invalid;
  }

  return null;
};

/**
 * Validates a phone number field
 * @param {string} value - The phone number to validate
 * @param {Object} fieldConfig - Configuration object with validation rules
 * @returns {string|null} Error message or null if valid
 */
export const validatePhoneField = (value, fieldConfig) => {
  if (!value || value.trim().length === 0) {
    if (fieldConfig.required) {
      return fieldConfig.errorMessages.required;
    }
    return null;
  }

  // Accept international format: +XX XXX XXX XXX or variations with spaces/dashes
  const phoneRegex = /^\+?[\d\s\-()]+$/;
  if (!phoneRegex.test(value.trim())) {
    return fieldConfig.errorMessages.invalid;
  }

  const digitsOnly = value.replace(/\D/g, '');
  if (digitsOnly.length < fieldConfig.minLength) {
    return formatErrorMessage(fieldConfig.errorMessages.minLength, fieldConfig);
  }

  return null;
};

/**
 * Validates a URL field
 * @param {string} value - The URL to validate
 * @param {Object} fieldConfig - Configuration object with validation rules
 * @returns {string|null} Error message or null if valid
 */
export const validateUrlField = (value, fieldConfig) => {
  if (!value || value.trim().length === 0) {
    if (fieldConfig.required) {
      return fieldConfig.errorMessages.required;
    }
    return null;
  }

  try {
    new URL(value);
    return null;
  } catch (error) {
    return fieldConfig.errorMessages.invalid;
  }
};

/**
 * Validates a postal code field
 * @param {string} value - The postal code to validate
 * @param {Object} fieldConfig - Configuration object with validation rules
 * @returns {string|null} Error message or null if valid
 */
export const validatePostalCodeField = (value, fieldConfig) => {
  if (!value || value.trim().length === 0) {
    if (fieldConfig.required) {
      return fieldConfig.errorMessages.required;
    }
    return null;
  }

  const trimmedValue = value.trim();
  const postalCodeRegex = /^\d{5}$/; // 5 digits for Spanish postal codes

  if (!postalCodeRegex.test(trimmedValue)) {
    return fieldConfig.errorMessages.invalid;
  }

  return null;
};

/**
 * Validates a time field in HH:MM format
 * @param {string} value - The time to validate
 * @param {Object} fieldConfig - Configuration object with validation rules
 * @returns {string|null} Error message or null if valid
 */
export const validateTimeField = (value, fieldConfig) => {
  if (!value || value.trim().length === 0) {
    if (fieldConfig.required) {
      return fieldConfig.errorMessages.required;
    }
    return null;
  }

  const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
  if (!timeRegex.test(value.trim())) {
    return fieldConfig.errorMessages.invalid;
  }

  return null;
};

/**
 * Helper function to format error messages with dynamic values
 * @param {string} message - The error message template
 * @param {Object} config - Configuration object with values to replace
 * @returns {string} Formatted error message
 */
export const formatErrorMessage = (message, config) => {
  return message
    .replace('{minLength}', config.minLength)
    .replace('{maxLength}', config.maxLength)
    .replace('{min}', config.min)
    .replace('{max}', config.max);
};
