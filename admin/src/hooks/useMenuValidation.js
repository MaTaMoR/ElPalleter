import { useState, useEffect } from 'react';
import { VALIDATION_CONFIG, formatErrorMessage } from '../config/validationConfig';

/**
 * Helper function to validate a text field
 */
const validateTextField = (value, fieldConfig) => {
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
 * Helper function to validate a price field
 */
const validatePriceField = (value, fieldConfig) => {
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
 * Hook to handle menu data validation
 */
export const useMenuValidation = (categoriesMap, subcategoriesMap, itemsMap, childrenMap, isEditing) => {
  const [validationErrors, setValidationErrors] = useState({});

  const validateMenuData = () => {
    const errors = {};

    categoriesMap.forEach((category, categoryHId) => {
      const categoryErrors = {};

      // Validate category name
      const nameError = validateTextField(category.nameKey, VALIDATION_CONFIG.category.nameKey);
      if (nameError) {
        categoryErrors.nameKey = nameError;
      }

      const subcategoryHIds = childrenMap.get(categoryHId) || [];
      const subcategoriesErrors = {};

      subcategoryHIds.forEach(subcategoryHId => {
        const subcategory = subcategoriesMap.get(subcategoryHId);
        if (!subcategory) return;

        const subcategoryErrors = {};

        // Validate subcategory name
        const subNameError = validateTextField(subcategory.nameKey, VALIDATION_CONFIG.subcategory.nameKey);
        if (subNameError) {
          subcategoryErrors.nameKey = subNameError;
        }

        const itemHIds = childrenMap.get(subcategoryHId) || [];
        const itemsErrors = {};

        itemHIds.forEach(itemHId => {
          const item = itemsMap.get(itemHId);
          if (!item) return;

          const itemErrors = {};

          // Validate item name
          const itemNameError = validateTextField(item.nameKey, VALIDATION_CONFIG.item.nameKey);
          if (itemNameError) {
            itemErrors.nameKey = itemNameError;
          }

          // Validate item description (if configured as required)
          const itemDescError = validateTextField(item.descriptionKey, VALIDATION_CONFIG.item.descriptionKey);
          if (itemDescError) {
            itemErrors.descriptionKey = itemDescError;
          }

          // Validate item price
          const priceError = validatePriceField(item.price, VALIDATION_CONFIG.item.price);
          if (priceError) {
            itemErrors.price = priceError;
          }

          if (Object.keys(itemErrors).length > 0) {
            itemsErrors[item.id] = itemErrors;
          }
        });

        if (Object.keys(itemsErrors).length > 0) {
          subcategoryErrors.items = itemsErrors;
        }

        if (Object.keys(subcategoryErrors).length > 0) {
          subcategoriesErrors[subcategory.id] = subcategoryErrors;
        }
      });

      if (Object.keys(subcategoriesErrors).length > 0) {
        categoryErrors.subcategories = subcategoriesErrors;
      }

      if (Object.keys(categoryErrors).length > 0) {
        errors[category.id] = categoryErrors;
      }
    });

    return errors;
  };

  useEffect(() => {
    if (isEditing) {
      const errors = validateMenuData();
      setValidationErrors(errors);
    } else {
      setValidationErrors({});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoriesMap, subcategoriesMap, itemsMap, isEditing]);

  const hasErrors = () => Object.keys(validationErrors).length > 0;

  return {
    validationErrors,
    validateMenuData,
    hasErrors
  };
};
