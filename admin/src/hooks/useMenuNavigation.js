import { useState, useMemo } from 'react';
import { buildHierarchicalId, parseHierarchicalId, unflattenMenuData } from '../utils/menuDataUtils';

/**
 * Hook to manage menu navigation and view data
 */
export const useMenuNavigation = (menuState) => {
  const {
    categoriesMap,
    subcategoriesMap,
    itemsMap,
    childrenMap,
    enrichWithVisualState
  } = menuState;

  const [currentLevel, setCurrentLevel] = useState('categories');
  const [selectedCategoryHId, setSelectedCategoryHId] = useState(null);
  const [selectedSubcategoryHId, setSelectedSubcategoryHId] = useState(null);

  // Navigation handlers
  const handleNavigateToCategories = () => {
    setCurrentLevel('categories');
    setSelectedCategoryHId(null);
    setSelectedSubcategoryHId(null);
  };

  const handleNavigateToSubcategories = () => {
    if (selectedCategoryHId) {
      setCurrentLevel('subcategories');
      setSelectedSubcategoryHId(null);
    }
  };

  const handleCategoryClick = (category) => {
    const categoryHId = buildHierarchicalId(category.id);
    setSelectedCategoryHId(categoryHId);
    setCurrentLevel('subcategories');
  };

  const handleSubcategoryClick = (subcategory) => {
    const { categoryId } = parseHierarchicalId(selectedCategoryHId);
    const subcategoryHId = buildHierarchicalId(categoryId, subcategory.id);
    setSelectedSubcategoryHId(subcategoryHId);
    setCurrentLevel('items');
  };

  const handleBackFromSubcategories = () => {
    setCurrentLevel('categories');
    setSelectedCategoryHId(null);
  };

  const handleBackFromItems = () => {
    setCurrentLevel('subcategories');
    setSelectedSubcategoryHId(null);
  };

  // Data retrieval for views
  const getCategoriesForView = () => {
    const { enrichedCategories } = enrichWithVisualState();
    return unflattenMenuData(enrichedCategories, new Map(), new Map(), childrenMap);
  };

  const getCurrentCategoryData = () => {
    if (!selectedCategoryHId) return null;
    const { enrichedCategories, enrichedSubcategories, enrichedItems } = enrichWithVisualState();

    const category = enrichedCategories.get(selectedCategoryHId);
    if (!category) return null;

    const subcategoryHIds = childrenMap.get(selectedCategoryHId) || [];
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
    if (!selectedSubcategoryHId) return null;
    const { enrichedSubcategories, enrichedItems } = enrichWithVisualState();

    const subcategory = enrichedSubcategories.get(selectedSubcategoryHId);
    if (!subcategory) return null;

    const itemHIds = childrenMap.get(selectedSubcategoryHId) || [];
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
    if (!selectedCategoryHId) return counts;

    const subcategoryHIds = childrenMap.get(selectedCategoryHId) || [];
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
    selectedCategoryHId,
    categoriesMap,
    subcategoriesMap,
    itemsMap,
    childrenMap
  ]);

  const currentSubcategory = useMemo(() => getCurrentSubcategoryData(), [
    selectedSubcategoryHId,
    subcategoriesMap,
    itemsMap,
    childrenMap
  ]);

  return {
    // State
    currentLevel,
    selectedCategoryHId,
    selectedSubcategoryHId,
    setSelectedCategoryHId,
    setCurrentLevel,
    // Navigation handlers
    handleNavigateToCategories,
    handleNavigateToSubcategories,
    handleCategoryClick,
    handleSubcategoryClick,
    handleBackFromSubcategories,
    handleBackFromItems,
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
