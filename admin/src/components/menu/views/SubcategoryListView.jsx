import React from 'react';
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
  const { isEditing, menuState, entityOps, validationErrors } = useMenuEdit();

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

  if (!currentCategory) {
    // Category not found, navigate back
    navigate(location.pathname.split('/categories')[0] + '/categories');
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

  return (
    <SubcategoryView
      subcategories={currentCategory.subcategories || []}
      categoryName={currentCategory.nameKey || 'Sin nombre'}
      category={currentCategory}
      onSubcategoryClick={handleSubcategoryClick}
      onAddSubcategory={isEditing ? () => entityOps.handleAdd('subcategory', currentCategory.id) : undefined}
      onDeleteSubcategory={isEditing ? (subId) => entityOps.handleDelete('subcategory', subId, currentCategory.id) : undefined}
      onUndoDeleteSubcategory={isEditing ? (id) => entityOps.handleUndoDelete('subcategory', id) : undefined}
      onUpdateCategory={isEditing ? (id, updates) => entityOps.handleUpdate('category', id, updates) : undefined}
      onBack={handleBack}
      itemCounts={getItemCounts()}
      isEditing={isEditing}
      categoryError={validationErrors[currentCategory.id]?.nameKey}
    />
  );
};

export default SubcategoryListView;
