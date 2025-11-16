import { useState, useEffect } from 'react';

/**
 * Hook to handle menu data validation
 */
export const useMenuValidation = (categoriesMap, subcategoriesMap, itemsMap, childrenMap, isEditing) => {
  const [validationErrors, setValidationErrors] = useState({});

  const validateMenuData = () => {
    const errors = {};

    categoriesMap.forEach((category, categoryHId) => {
      const categoryErrors = {};

      if (!category.nameKey || category.nameKey.trim().length < 3) {
        categoryErrors.nameKey = 'El nombre debe tener al menos 3 caracteres';
      }

      const subcategoryHIds = childrenMap.get(categoryHId) || [];
      const subcategoriesErrors = {};

      subcategoryHIds.forEach(subcategoryHId => {
        const subcategory = subcategoriesMap.get(subcategoryHId);
        if (!subcategory) return;

        const subcategoryErrors = {};

        if (!subcategory.nameKey || subcategory.nameKey.trim().length < 3) {
          subcategoryErrors.nameKey = 'El nombre debe tener al menos 3 caracteres';
        }

        const itemHIds = childrenMap.get(subcategoryHId) || [];
        const itemsErrors = {};

        itemHIds.forEach(itemHId => {
          const item = itemsMap.get(itemHId);
          if (!item) return;

          const itemErrors = {};

          if (!item.nameKey || item.nameKey.trim().length < 3) {
            itemErrors.nameKey = 'El nombre debe tener al menos 3 caracteres';
          }

          if (item.price === undefined || item.price === null || item.price === '') {
            itemErrors.price = 'El precio es requerido';
          } else {
            const priceNum = parseFloat(item.price);
            if (isNaN(priceNum) || priceNum < 0) {
              itemErrors.price = 'El precio debe ser un número positivo';
            }
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
