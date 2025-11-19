import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useMenuEdit } from '../../../contexts/MenuEditContext';
import { unflattenMenuData } from '../../../utils/menuDataUtils';
import CategoryView from './CategoryView';

/**
 * Category list view - reads from context and uses React Router for navigation
 */
const CategoryListView = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isEditing, menuState, entityOps, validationErrors, showToast } = useMenuEdit();

  // Get categories for view
  const getCategoriesForView = () => {
    const { enrichedCategories } = menuState.enrichWithVisualState();
    return unflattenMenuData(enrichedCategories, new Map(), new Map(), menuState.childrenMap);
  };

  const getSubcategoryCounts = () => {
    const counts = {};
    menuState.categoriesMap.forEach((category, categoryHId) => {
      const subcategoryHIds = menuState.childrenMap.get(categoryHId) || [];
      counts[category.id] = subcategoryHIds.length;
    });
    return counts;
  };

  // Navigation handler
  const handleCategoryClick = (category) => {
    const pathParts = location.pathname.split('/categories')[0];
    navigate(`${pathParts}/categories/${category.id}`);
  };

  // Add category handler - navigate to new category after creation
  const handleAddCategory = () => {
    const newCategoryId = entityOps.handleAdd('category');
    if (newCategoryId) {
      const pathParts = location.pathname.split('/categories')[0];
      navigate(`${pathParts}/categories/${newCategoryId}`);
    }
  };

  // Handle validation error - show toast with error messages
  const handleValidationError = (errorMessages) => {
    // Mostrar un toast por cada error (máximo 2 para no saturar la pantalla)
    errorMessages.slice(0, 2).forEach((error, index) => {
      setTimeout(() => {
        showToast(error, 'error', 4000);
      }, index * 150); // Pequeño delay entre toasts para que se vean bien
    });
  };

  return (
    <CategoryView
      categories={getCategoriesForView()}
      onCategoryClick={handleCategoryClick}
      onAddCategory={isEditing ? handleAddCategory : undefined}
      onDeleteCategory={isEditing ? (id) => entityOps.handleDelete('category', id) : undefined}
      onUndoDeleteCategory={isEditing ? (id) => entityOps.handleUndoDelete('category', id) : undefined}
      onUpdateCategory={isEditing ? (id, updates) => entityOps.handleUpdate('category', id, updates) : undefined}
      onMoveCategory={isEditing ? (id, direction) => entityOps.handleMove('category', id, direction) : undefined}
      onCancelEditCategory={isEditing ? (id) => entityOps.handleCancelEdit('category', id) : undefined}
      subcategoryCounts={getSubcategoryCounts()}
      isEditing={isEditing}
      categoryErrors={validationErrors}
      onValidationError={handleValidationError}
    />
  );
};

export default CategoryListView;
