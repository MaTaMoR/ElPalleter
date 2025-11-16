/**
 * Utilities for menu data transformation and hierarchical ID management
 */

/**
 * Builds a hierarchical ID from components
 */
export const buildHierarchicalId = (categoryId, subcategoryId = null, itemId = null) => {
  if (itemId) return `${categoryId}.${subcategoryId}.${itemId}`;
  if (subcategoryId) return `${categoryId}.${subcategoryId}`;
  return categoryId;
};

/**
 * Parses a hierarchical ID into its components
 */
export const parseHierarchicalId = (hierarchicalId) => {
  if (!hierarchicalId) return { categoryId: null, subcategoryId: null, itemId: null, level: null };

  const parts = hierarchicalId.split('.');
  return {
    categoryId: parts[0] || null,
    subcategoryId: parts[1] || null,
    itemId: parts[2] || null,
    level: parts.length === 1 ? 'category' : parts.length === 2 ? 'subcategory' : 'item'
  };
};

/**
 * Gets all parent hierarchical IDs for a given hierarchical ID
 */
export const getParentHierarchicalIds = (hierarchicalId) => {
  const parts = hierarchicalId.split('.');
  const parents = [];

  for (let i = 1; i < parts.length; i++) {
    parents.push(parts.slice(0, i).join('.'));
  }

  return parents;
};

/**
 * Checks if a hierarchical ID is a descendant of another
 */
export const isDescendantOf = (childId, potentialParentId) => {
  return childId !== potentialParentId && childId.startsWith(potentialParentId + '.');
};

/**
 * Converts nested menu data to flat Maps structure
 */
export const flattenMenuData = (nestedData) => {
  const categoriesMap = new Map();
  const subcategoriesMap = new Map();
  const itemsMap = new Map();
  const childrenMap = new Map();

  nestedData.forEach((category) => {
    const categoryId = category.id;
    const categoryHId = buildHierarchicalId(categoryId);

    // Store category
    categoriesMap.set(categoryHId, {
      id: category.id,
      nameKey: category.nameKey,
      orderIndex: category.orderIndex,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
      _state: category._state || 'normal',
      _previousState: category._previousState
    });

    // Track category's subcategories
    const subcategoryIds = [];

    (category.subcategories || []).forEach((subcategory) => {
      const subcategoryId = subcategory.id;
      const subcategoryHId = buildHierarchicalId(categoryId, subcategoryId);

      subcategoryIds.push(subcategoryHId);

      // Store subcategory
      subcategoriesMap.set(subcategoryHId, {
        id: subcategory.id,
        parentId: categoryId,
        nameKey: subcategory.nameKey,
        orderIndex: subcategory.orderIndex,
        createdAt: subcategory.createdAt,
        updatedAt: subcategory.updatedAt,
        _state: subcategory._state || 'normal',
        _previousState: subcategory._previousState
      });

      // Track subcategory's items
      const itemIds = [];

      (subcategory.items || []).forEach((item) => {
        const itemId = item.id;
        const itemHId = buildHierarchicalId(categoryId, subcategoryId, itemId);

        itemIds.push(itemHId);

        // Store item
        itemsMap.set(itemHId, {
          id: item.id,
          parentId: subcategoryId,
          categoryId: categoryId,
          nameKey: item.nameKey,
          descriptionKey: item.descriptionKey,
          price: item.price,
          available: item.available !== undefined ? item.available : true,
          orderIndex: item.orderIndex,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,
          _state: item._state || 'normal',
          _previousState: item._previousState
        });
      });

      if (itemIds.length > 0) {
        childrenMap.set(subcategoryHId, itemIds);
      }
    });

    if (subcategoryIds.length > 0) {
      childrenMap.set(categoryHId, subcategoryIds);
    }
  });

  return { categoriesMap, subcategoriesMap, itemsMap, childrenMap };
};

/**
 * Converts flat Maps structure back to nested array for backend/rendering
 */
export const unflattenMenuData = (categoriesMap, subcategoriesMap, itemsMap, childrenMap) => {
  const categories = [];

  // Get all root categories sorted by orderIndex
  const categoryEntries = Array.from(categoriesMap.entries())
    .sort((a, b) => a[1].orderIndex - b[1].orderIndex);

  categoryEntries.forEach(([categoryHId, category]) => {
    const subcategoryHIds = childrenMap.get(categoryHId) || [];
    const subcategories = [];

    subcategoryHIds.forEach((subcategoryHId) => {
      const subcategory = subcategoriesMap.get(subcategoryHId);
      if (!subcategory) return;

      const itemHIds = childrenMap.get(subcategoryHId) || [];
      const items = [];

      itemHIds.forEach((itemHId) => {
        const item = itemsMap.get(itemHId);
        if (!item) return;

        items.push({
          id: item.id,
          nameKey: item.nameKey,
          descriptionKey: item.descriptionKey,
          price: item.price,
          available: item.available,
          orderIndex: item.orderIndex,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,
          _state: item._state,
          _previousState: item._previousState
        });
      });

      subcategories.push({
        id: subcategory.id,
        nameKey: subcategory.nameKey,
        orderIndex: subcategory.orderIndex,
        createdAt: subcategory.createdAt,
        updatedAt: subcategory.updatedAt,
        items: items,
        _state: subcategory._state,
        _previousState: subcategory._previousState
      });
    });

    categories.push({
      id: category.id,
      nameKey: category.nameKey,
      orderIndex: category.orderIndex,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
      subcategories: subcategories,
      _state: category._state,
      _previousState: category._previousState
    });
  });

  return categories;
};

/**
 * Processes menu data for backend by removing temporary IDs and deleted items
 */
export const processMenuDataForBackend = (data) => {
  return data
    .filter(category => category._state !== 'deleted')
    .map(category => {
      const cleanCategory = {
        id: category.id?.startsWith('temp-') ? null : category.id,
        nameKey: category.nameKey,
        orderIndex: category.orderIndex,
        createdAt: category.createdAt,
        updatedAt: category.updatedAt
      };

      if (category.subcategories && category.subcategories.length > 0) {
        cleanCategory.subcategories = category.subcategories
          .filter(subcategory => subcategory._state !== 'deleted')
          .map(subcategory => {
            const cleanSubcategory = {
              id: subcategory.id?.startsWith('temp-') ? null : subcategory.id,
              nameKey: subcategory.nameKey,
              orderIndex: subcategory.orderIndex,
              createdAt: subcategory.createdAt,
              updatedAt: subcategory.updatedAt
            };

            if (subcategory.items && subcategory.items.length > 0) {
              cleanSubcategory.items = subcategory.items
                .filter(item => item._state !== 'deleted')
                .map(item => ({
                  id: item.id?.startsWith('temp-') ? null : item.id,
                  nameKey: item.nameKey,
                  descriptionKey: item.descriptionKey,
                  price: parseFloat(item.price),
                  available: item.available !== undefined ? item.available : true,
                  orderIndex: item.orderIndex,
                  createdAt: item.createdAt,
                  updatedAt: item.updatedAt
                }));
            }

            return cleanSubcategory;
          });
      }

      return cleanCategory;
    });
};
