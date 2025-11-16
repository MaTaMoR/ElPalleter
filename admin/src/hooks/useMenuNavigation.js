import { useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { buildHierarchicalId, unflattenMenuData } from '../utils/menuDataUtils';

/**
 * Hook to manage menu navigation and view data
 * Now using React Router params instead of internal state
 */
export const useMenuNavigation = (menuState) => {
  const {
    categoriesMap,
    subcategoriesMap,
    itemsMap,
    childrenMap,
    enrichWithVisualState
  } = menuState;

  // Get current selection from URL params instead of internal state
  const { categoryId, subcategoryId } = useParams();

  // Build hierarchical IDs from params
  const selectedCategoryHId = categoryId ? buildHierarchicalId(categoryId) : null;
  const selectedSubcategoryHId = (categoryId && subcategoryId)
    ? buildHierarchicalId(categoryId, subcategoryId)
    : null;

  // These are needed for backwards compatibility with entity operations
  // But they should eventually be removed as we transition fully to URL-based navigation
  const [tempCategoryHId, setTempCategoryHId] = useState(null);
  const [tempSubcategoryHId, setTempSubcategoryHId] = useState(null);
  const [tempCurrentLevel, setTempCurrentLevel] = useState('categories');

  // Use URL params if available, fallback to temp state
  const effectiveCategoryHId = selectedCategoryHId || tempCategoryHId;
  const effectiveSubcategoryHId = selectedSubcategoryHId || tempSubcategoryHId;

  // Data retrieval for views
  const getCategoriesForView = () => {
    const { enrichedCategories } = enrichWithVisualState();
    return unflattenMenuData(enrichedCategories, new Map(), new Map(), childrenMap);
  };

  const getCurrentCategoryData = () => {
    if (!effectiveCategoryHId) return null;
    const { enrichedCategories, enrichedSubcategories, enrichedItems } = enrichWithVisualState();

    const category = enrichedCategories.get(effectiveCategoryHId);
    if (!category) return null;

    const subcategoryHIds = childrenMap.get(effectiveCategoryHId) || [];
    const subcategories = subcategoryHIds.map(hId => {
      const sub = enrichedSubcategories.get(hId);
      const itemHIds = childrenMap.get(hId) || [];
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

  const getCurrentSubcategoryData = () => {
    if (!effectiveSubcategoryHId) return null;
    const { enrichedSubcategories, enrichedItems } = enrichWithVisualState();

    const subcategory = enrichedSubcategories.get(effectiveSubcategoryHId);
    if (!subcategory) return null;

    const itemHIds = childrenMap.get(effectiveSubcategoryHId) || [];
    const items = itemHIds.map(hId => enrichedItems.get(hId)).filter(Boolean);

    return {
      ...subcategory,
      items
    };
  };

  const getSubcategoryCounts = () => {
    const counts = {};
    categoriesMap.forEach((category, categoryHId) => {
      const subcategoryHIds = childrenMap.get(categoryHId) || [];
      counts[category.id] = subcategoryHIds.length;
    });
    return counts;
  };

  const getItemCounts = () => {
    const counts = {};
    if (!effectiveCategoryHId) return counts;

    const subcategoryHIds = childrenMap.get(effectiveCategoryHId) || [];
    subcategoryHIds.forEach(subcategoryHId => {
      const subcategory = subcategoriesMap.get(subcategoryHId);
      if (subcategory) {
        const itemHIds = childrenMap.get(subcategoryHId) || [];
        counts[subcategory.id] = itemHIds.length;
      }
    });
    return counts;
  };

  const currentCategory = useMemo(() => getCurrentCategoryData(), [
    effectiveCategoryHId,
    categoriesMap,
    subcategoriesMap,
    itemsMap,
    childrenMap
  ]);

  const currentSubcategory = useMemo(() => getCurrentSubcategoryData(), [
    effectiveSubcategoryHId,
    subcategoriesMap,
    itemsMap,
    childrenMap
  ]);

  return {
    // URL-based state (primary)
    selectedCategoryHId: effectiveCategoryHId,
    selectedSubcategoryHId: effectiveSubcategoryHId,

    // Temporary setters for backwards compatibility
    // These will be used during transition period
    setSelectedCategoryHId: setTempCategoryHId,
    setSelectedSubcategoryHId: setTempSubcategoryHId,
    setCurrentLevel: setTempCurrentLevel,

    // Data for views
    getCategoriesForView,
    getCurrentCategoryData,
    getCurrentSubcategoryData,
    getSubcategoryCounts,
    getItemCounts,
    currentCategory,
    currentSubcategory
  };
};
