import React, { useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useMenuEdit } from '../../../contexts/MenuEditContext';
import { buildHierarchicalId } from '../../../utils/menuDataUtils';
import SubcategoryView from './SubcategoryView';

/**
 * Subcategory list view - reads from context and uses React Router for navigation
 */
const SubcategoryListView = () => {
  const { categoryId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { isEditing, menuState, entityOps, validationErrors, showToast } = useMenuEdit();

  // Get current category data
  const getCurrentCategoryData = () => {
    if (!categoryId) return null;

    const categoryHId = buildHierarchicalId(categoryId);
    const { enrichedCategories, enrichedSubcategories, enrichedItems } = menuState.enrichWithVisualState();

    const category = enrichedCategories.get(categoryHId);
    if (!category) return null;

    const subcategoryHIds = menuState.childrenMap.get(categoryHId) || [];
    const subcategories = subcategoryHIds.map(hId => {
      const sub = enrichedSubcategories.get(hId);
      const itemHIds = menuState.childrenMap.get(hId) || [];
      const items = itemHIds.map(itemHId => enrichedItems.get(itemHId)).filter(Boolean);

      return {
        ...sub,
        items
      };
    }).filter(Boolean);

    return {
      ...category,
      subcategories
    };
  };

  const getItemCounts = () => {
    const counts = {};
    if (!categoryId) return counts;

    const categoryHId = buildHierarchicalId(categoryId);
    const subcategoryHIds = menuState.childrenMap.get(categoryHId) || [];
    subcategoryHIds.forEach(subcategoryHId => {
      const subcategory = menuState.subcategoriesMap.get(subcategoryHId);
      if (subcategory) {
        const itemHIds = menuState.childrenMap.get(subcategoryHId) || [];
        counts[subcategory.id] = itemHIds.length;
      }
    });
    return counts;
  };

  const currentCategory = getCurrentCategoryData();

  // Redirect if category doesn't exist (e.g., after canceling changes)
  useEffect(() => {
    if (!currentCategory) {
      const pathParts = location.pathname.split('/categories')[0];
      navigate(`${pathParts}/categories`, { replace: true });
    }
  }, [currentCategory, navigate, location.pathname]);

  if (!currentCategory) {
    return null;
  }

  // Navigation handlers
  const handleSubcategoryClick = (subcategory) => {
    const pathParts = location.pathname.split('/categories')[0];
    navigate(`${pathParts}/categories/${categoryId}/${subcategory.id}`);
  };

  const handleBack = () => {
    const pathParts = location.pathname.split('/categories')[0];
    navigate(`${pathParts}/categories`);
  };

  // Add subcategory handler - navigate to new subcategory after creation
  const handleAddSubcategory = () => {
    const newSubcategoryId = entityOps.handleAdd('subcategory', currentCategory.id);
    if (newSubcategoryId) {
      const pathParts = location.pathname.split('/categories')[0];
      navigate(`${pathParts}/categories/${categoryId}/${newSubcategoryId}`);
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
    <SubcategoryView
      subcategories={currentCategory.subcategories || []}
      categoryName={currentCategory.nameKey || 'Sin nombre'}
      category={currentCategory}
      onSubcategoryClick={handleSubcategoryClick}
      onAddSubcategory={isEditing ? handleAddSubcategory : undefined}
      onDeleteSubcategory={isEditing ? (subId) => entityOps.handleDelete('subcategory', subId, currentCategory.id) : undefined}
      onUndoDeleteSubcategory={isEditing ? (id) => entityOps.handleUndoDelete('subcategory', id, categoryId) : undefined}
      onUpdateCategory={isEditing ? (id, updates) => entityOps.handleUpdate('category', id, updates) : undefined}
      onUpdateSubcategory={isEditing ? (id, updates) => entityOps.handleUpdate('subcategory', id, updates, categoryId) : undefined}
      onMoveSubcategory={isEditing ? (id, direction) => entityOps.handleMove('subcategory', id, direction, categoryId) : undefined}
      onCancelEditSubcategory={isEditing ? (id) => entityOps.handleCancelEdit('subcategory', id, categoryId) : undefined}
      onDeleteCategory={isEditing ? (id, onConfirmed) => entityOps.handleDelete('category', id, null, null, onConfirmed) : undefined}
      onBack={handleBack}
      itemCounts={getItemCounts()}
      isEditing={isEditing}
      categoryError={validationErrors[currentCategory.id]?.nameKey}
      subcategoryErrors={validationErrors[currentCategory.id]?.subcategories || {}}
      onValidationError={handleValidationError}
    />
  );
};

export default SubcategoryListView;
