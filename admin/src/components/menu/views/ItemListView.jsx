import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useMenuEdit } from '../../../contexts/MenuEditContext';
import { buildHierarchicalId } from '../../../utils/menuDataUtils';
import ItemView from './ItemView';

/**
 * Item list view - reads from context and uses React Router for navigation
 */
const ItemListView = () => {
  const { categoryId, subcategoryId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { isEditing, menuState, entityOps, validationErrors, showToast } = useMenuEdit();
  const [autoEditItemId, setAutoEditItemId] = useState(null);

  // Get current subcategory and category data
  const getCurrentSubcategoryData = () => {
    if (!categoryId || !subcategoryId) return null;

    const subcategoryHId = buildHierarchicalId(categoryId, subcategoryId);
    const { enrichedSubcategories, enrichedItems } = menuState.enrichWithVisualState();

    const subcategory = enrichedSubcategories.get(subcategoryHId);
    if (!subcategory) return null;

    const itemHIds = menuState.childrenMap.get(subcategoryHId) || [];
    const items = itemHIds.map(hId => enrichedItems.get(hId)).filter(Boolean);

    return {
      ...subcategory,
      items
    };
  };

  const getCurrentCategoryData = () => {
    if (!categoryId) return null;

    const categoryHId = buildHierarchicalId(categoryId);
    const { enrichedCategories } = menuState.enrichWithVisualState();
    return enrichedCategories.get(categoryHId);
  };

  const currentSubcategory = getCurrentSubcategoryData();
  const currentCategory = getCurrentCategoryData();

  // Redirect if category or subcategory doesn't exist (e.g., after canceling changes)
  useEffect(() => {
    const pathParts = location.pathname.split('/categories')[0];

    if (!currentCategory) {
      // Category doesn't exist, go back to categories list
      navigate(`${pathParts}/categories`, { replace: true });
    } else if (!currentSubcategory) {
      // Category exists but subcategory doesn't, go back to that category
      navigate(`${pathParts}/categories/${categoryId}`, { replace: true });
    }
  }, [currentCategory, currentSubcategory, categoryId, navigate, location.pathname]);

  if (!currentSubcategory || !currentCategory) {
    return null;
  }

  // Navigation handler
  const handleBack = () => {
    const pathParts = location.pathname.split('/categories')[0];
    navigate(`${pathParts}/categories/${categoryId}`);
  };

  // Add item handler - auto-scroll and open in edit mode
  const handleAddItem = () => {
    const newItemId = entityOps.handleAdd('item', currentSubcategory.id, categoryId);
    if (newItemId) {
      setAutoEditItemId(newItemId);
      // Clear after a short delay to allow re-triggering if needed
      setTimeout(() => setAutoEditItemId(null), 100);
    }
  };

  // Extract item errors for current subcategory
  const getItemErrors = () => {
    return validationErrors[currentCategory?.id]?.subcategories?.[currentSubcategory.id]?.items || {};
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
    <ItemView
      items={currentSubcategory.items || []}
      subcategoryName={currentSubcategory.nameKey || 'Sin nombre'}
      subcategory={currentSubcategory}
      onAddItem={isEditing ? handleAddItem : undefined}
      onUpdateItem={isEditing ? (id, updates) => entityOps.handleUpdate('item', id, updates, subcategoryId, categoryId) : undefined}
      onUpdateSubcategory={isEditing ? (id, updates) => entityOps.handleUpdate('subcategory', id, updates, categoryId) : undefined}
      onMoveItem={isEditing ? (id, direction) => entityOps.handleMove('item', id, direction, subcategoryId, categoryId) : undefined}
      onDeleteItem={isEditing ? (itemId) => entityOps.handleDelete('item', itemId, currentSubcategory.id, categoryId) : undefined}
      onUndoDeleteItem={isEditing ? (id) => entityOps.handleUndoDelete('item', id, subcategoryId, categoryId) : undefined}
      onCancelEditItem={isEditing ? (id) => entityOps.handleCancelEdit('item', id, subcategoryId, categoryId) : undefined}
      onDeleteSubcategory={isEditing ? (id) => entityOps.handleDelete('subcategory', id, categoryId) : undefined}
      onUndoDeleteSubcategory={isEditing ? (id) => entityOps.handleUndoDelete('subcategory', id, categoryId) : undefined}
      onBack={handleBack}
      isEditing={isEditing}
      errors={getItemErrors()}
      subcategoryError={validationErrors[currentCategory?.id]?.subcategories?.[currentSubcategory.id]?.nameKey}
      autoEditItemId={autoEditItemId}
      onValidationError={handleValidationError}
    />
  );
};

export default ItemListView;
