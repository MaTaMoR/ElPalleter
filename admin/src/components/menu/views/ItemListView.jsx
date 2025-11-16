import React, { useState } from 'react';
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
  const { isEditing, menuState, entityOps, validationErrors } = useMenuEdit();
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

  if (!currentSubcategory || !currentCategory) {
    // Subcategory not found, navigate back to category
    const pathParts = location.pathname.split('/categories')[0];
    navigate(`${pathParts}/categories/${categoryId}`);
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

  return (
    <ItemView
      items={currentSubcategory.items || []}
      subcategoryName={currentSubcategory.nameKey || 'Sin nombre'}
      subcategory={currentSubcategory}
      onAddItem={isEditing ? handleAddItem : undefined}
      onUpdateItem={isEditing ? (id, updates) => entityOps.handleUpdate('item', id, updates, subcategoryId, categoryId) : undefined}
      onUpdateSubcategory={isEditing ? (id, updates) => entityOps.handleUpdate('subcategory', id, updates, categoryId) : undefined}
      onDeleteItem={isEditing ? (itemId) => entityOps.handleDelete('item', itemId, currentSubcategory.id, categoryId) : undefined}
      onUndoDeleteItem={isEditing ? (id) => entityOps.handleUndoDelete('item', id, subcategoryId, categoryId) : undefined}
      onBack={handleBack}
      isEditing={isEditing}
      errors={validationErrors}
      subcategoryError={validationErrors[currentCategory?.id]?.subcategories?.[currentSubcategory.id]?.nameKey}
      autoEditItemId={autoEditItemId}
    />
  );
};

export default ItemListView;
