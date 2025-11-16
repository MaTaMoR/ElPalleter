import React from 'react';
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

  return (
    <ItemView
      items={currentSubcategory.items || []}
      subcategoryName={currentSubcategory.nameKey || 'Sin nombre'}
      subcategory={currentSubcategory}
      onAddItem={isEditing ? () => entityOps.handleAdd('item', currentSubcategory.id, categoryId) : undefined}
      onUpdateItem={isEditing ? (id, updates) => entityOps.handleUpdate('item', id, updates) : undefined}
      onUpdateSubcategory={isEditing ? (id, updates) => entityOps.handleUpdate('subcategory', id, updates) : undefined}
      onDeleteItem={isEditing ? (itemId) => entityOps.handleDelete('item', itemId, currentSubcategory.id, categoryId) : undefined}
      onUndoDeleteItem={isEditing ? (id) => entityOps.handleUndoDelete('item', id) : undefined}
      onBack={handleBack}
      isEditing={isEditing}
      errors={validationErrors}
      subcategoryError={validationErrors[currentCategory?.id]?.subcategories?.[currentSubcategory.id]?.nameKey}
    />
  );
};

export default ItemListView;
