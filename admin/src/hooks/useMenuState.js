import { useState, useEffect } from 'react';
import { flattenMenuData, isDescendantOf } from '../utils/menuDataUtils';

/**
 * Hook to manage menu state using flat Maps structure
 */
export const useMenuState = (backendData, loading, error, mockData) => {
  // Flat data structure using Maps
  const [categoriesMap, setCategoriesMap] = useState(new Map());
  const [subcategoriesMap, setSubcategoriesMap] = useState(new Map());
  const [itemsMap, setItemsMap] = useState(new Map());
  const [childrenMap, setChildrenMap] = useState(new Map());

  // Original data (for comparison to detect real changes)
  const [originalCategoriesMap, setOriginalCategoriesMap] = useState(new Map());
  const [originalSubcategoriesMap, setOriginalSubcategoriesMap] = useState(new Map());
  const [originalItemsMap, setOriginalItemsMap] = useState(new Map());

  // Change tracking
  const [changeTracking, setChangeTracking] = useState(new Map());

  // Sync backend data with local state
  useEffect(() => {
    let dataToUse = null;

    if (backendData && backendData.length > 0) {
      dataToUse = backendData;
    } else if (!loading && !error) {
      dataToUse = mockData;
    }

    if (dataToUse) {
      const flattened = flattenMenuData(dataToUse);
      setCategoriesMap(flattened.categoriesMap);
      setSubcategoriesMap(flattened.subcategoriesMap);
      setItemsMap(flattened.itemsMap);
      setChildrenMap(flattened.childrenMap);

      // Save original values for comparison
      setOriginalCategoriesMap(new Map(flattened.categoriesMap));
      setOriginalSubcategoriesMap(new Map(flattened.subcategoriesMap));
      setOriginalItemsMap(new Map(flattened.itemsMap));

      setChangeTracking(new Map());
    }
  }, [backendData, loading, error, mockData]);

  // Change tracking utilities
  const trackChange = (hierarchicalId, type) => {
    setChangeTracking(prev => {
      const newMap = new Map(prev);
      newMap.set(hierarchicalId, type);
      return newMap;
    });
  };

  const untrackChange = (hierarchicalId) => {
    setChangeTracking(prev => {
      const newMap = new Map(prev);
      newMap.delete(hierarchicalId);
      return newMap;
    });
  };

  const hasRealChanges = () => changeTracking.size > 0;

  const hasChildChanges = (hierarchicalId) => {
    for (const [changeId] of changeTracking) {
      if (isDescendantOf(changeId, hierarchicalId)) {
        return true;
      }
    }
    return false;
  };

  // Visual state calculation
  const calculateVisualState = (hierarchicalId, currentState) => {
    if (currentState === 'new') return 'new';

    if (changeTracking.has(hierarchicalId)) {
      const changeType = changeTracking.get(hierarchicalId);
      if (changeType === 'delete') return 'deleted';
      if (changeType === 'edit' || changeType === 'create') return 'edited';
    }

    if (hasChildChanges(hierarchicalId)) return 'edited';

    return 'normal';
  };

  const enrichWithVisualState = () => {
    const enrichedCategories = new Map();
    const enrichedSubcategories = new Map();
    const enrichedItems = new Map();

    // Enrich items
    itemsMap.forEach((item, itemHId) => {
      enrichedItems.set(itemHId, {
        ...item,
        _state: calculateVisualState(itemHId, item._state)
      });
    });

    // Enrich subcategories
    subcategoriesMap.forEach((subcategory, subcategoryHId) => {
      enrichedSubcategories.set(subcategoryHId, {
        ...subcategory,
        _state: calculateVisualState(subcategoryHId, subcategory._state)
      });
    });

    // Enrich categories
    categoriesMap.forEach((category, categoryHId) => {
      enrichedCategories.set(categoryHId, {
        ...category,
        _state: calculateVisualState(categoryHId, category._state)
      });
    });

    return { enrichedCategories, enrichedSubcategories, enrichedItems };
  };

  return {
    // Maps
    categoriesMap,
    subcategoriesMap,
    itemsMap,
    childrenMap,
    setCategoriesMap,
    setSubcategoriesMap,
    setItemsMap,
    setChildrenMap,
    // Original maps (for change detection)
    originalCategoriesMap,
    originalSubcategoriesMap,
    originalItemsMap,
    // Change tracking
    changeTracking,
    trackChange,
    untrackChange,
    hasRealChanges,
    hasChildChanges,
    // Visual state
    enrichWithVisualState
  };
};
