import { buildHierarchicalId, parseHierarchicalId } from '../utils/menuDataUtils';

/**
 * Generic entity type configuration
 */
const ENTITY_CONFIG = {
  category: {
    mapKey: 'categoriesMap',
    setMapKey: 'setCategoriesMap',
    childrenType: 'subcategory',
    tempIdPrefix: 'temp-category-',
    buildHId: (id) => buildHierarchicalId(id),
    getDefaultEntity: (id, orderIndex) => ({
      id,
      nameKey: '',
      orderIndex,
      _state: 'new'
    })
  },
  subcategory: {
    mapKey: 'subcategoriesMap',
    setMapKey: 'setSubcategoriesMap',
    childrenType: 'item',
    tempIdPrefix: 'temp-subcategory-',
    buildHId: (id, parentId) => buildHierarchicalId(parentId, id),
    getDefaultEntity: (id, orderIndex, parentId) => ({
      id,
      parentId,
      nameKey: '',
      orderIndex,
      _state: 'new'
    })
  },
  item: {
    mapKey: 'itemsMap',
    setMapKey: 'setItemsMap',
    tempIdPrefix: 'temp-item-',
    buildHId: (id, parentId, categoryId) => buildHierarchicalId(categoryId, parentId, id),
    getDefaultEntity: (id, orderIndex, parentId, categoryId) => ({
      id,
      parentId,
      categoryId,
      nameKey: '',
      descriptionKey: '',
      price: '',
      available: true,
      orderIndex,
      _state: 'new'
    })
  }
};

/**
 * Unified hook for entity CRUD operations (Category, Subcategory, Item)
 * This eliminates the need for separate handlers for each entity type
 */
export const useEntityOperations = (menuState, getNavigation, setConfirmDialog) => {
  const {
    categoriesMap,
    subcategoriesMap,
    itemsMap,
    childrenMap,
    setCategoriesMap,
    setSubcategoriesMap,
    setItemsMap,
    setChildrenMap,
    trackChange,
    untrackChange
  } = menuState;

  // Get the appropriate map and setter based on entity type
  const getMapAndSetter = (entityType) => {
    const config = ENTITY_CONFIG[entityType];
    const map = {
      categoriesMap,
      subcategoriesMap,
      itemsMap
    }[config.mapKey];

    const setter = {
      setCategoriesMap,
      setSubcategoriesMap,
      setItemsMap
    }[config.setMapKey];

    return { map, setter };
  };

  /**
   * Generic ADD operation
   */
  const handleAdd = (entityType, parentId = null, categoryId = null) => {
    const config = ENTITY_CONFIG[entityType];
    const newEntityId = `${config.tempIdPrefix}${Date.now()}`;

    let hierarchicalId, parentHId, orderIndex;

    if (entityType === 'category') {
      hierarchicalId = config.buildHId(newEntityId);
      orderIndex = categoriesMap.size;
    } else if (entityType === 'subcategory') {
      parentHId = buildHierarchicalId(parentId);
      hierarchicalId = config.buildHId(newEntityId, parentId);
      const existingChildren = childrenMap.get(parentHId) || [];
      orderIndex = existingChildren.length;
    } else if (entityType === 'item') {
      parentHId = buildHierarchicalId(categoryId, parentId);
      hierarchicalId = config.buildHId(newEntityId, parentId, categoryId);
      const existingChildren = childrenMap.get(parentHId) || [];
      orderIndex = existingChildren.length;
    }

    const newEntity = config.getDefaultEntity(newEntityId, orderIndex, parentId, categoryId);
    const { setter } = getMapAndSetter(entityType);

    setter(prev => new Map(prev).set(hierarchicalId, newEntity));

    // Update children map if has parent
    if (parentHId) {
      setChildrenMap(prev => {
        const newMap = new Map(prev);
        const existingChildren = newMap.get(parentHId) || [];
        newMap.set(parentHId, [...existingChildren, hierarchicalId]);
        return newMap;
      });
    }

    // Handle navigation after add
    const navigation = getNavigation();
    if (entityType === 'category' && navigation) {
      navigation.setSelectedCategoryHId(hierarchicalId);
      navigation.setCurrentLevel('subcategories');
    } else if (entityType === 'subcategory' && navigation) {
      navigation.setSelectedSubcategoryHId(hierarchicalId);
      navigation.setCurrentLevel('items');
    } else if (entityType === 'item') {
      trackChange(hierarchicalId, 'create');
    }
  };

  /**
   * Generic UPDATE operation
   */
  const handleUpdate = (entityType, entityId, updates, parentId = null, categoryId = null) => {
    let hierarchicalId;
    const navigation = getNavigation();

    if (entityType === 'category') {
      hierarchicalId = buildHierarchicalId(entityId);
    } else if (entityType === 'subcategory') {
      const selectedCategoryHId = navigation?.selectedCategoryHId;
      if (!selectedCategoryHId) return;
      const { categoryId: catId } = parseHierarchicalId(selectedCategoryHId);
      hierarchicalId = buildHierarchicalId(catId, entityId);
    } else if (entityType === 'item') {
      const selectedSubcategoryHId = navigation?.selectedSubcategoryHId;
      if (!selectedSubcategoryHId) return;
      const { categoryId: catId } = parseHierarchicalId(selectedSubcategoryHId);
      const subcategory = subcategoriesMap.get(selectedSubcategoryHId);
      if (!subcategory) return;
      hierarchicalId = buildHierarchicalId(catId, subcategory.id, entityId);
    }

    const { map, setter } = getMapAndSetter(entityType);
    const entity = map.get(hierarchicalId);
    if (!entity) return;

    const isNew = entity._state === 'new';
    const hasContentNow = updates.nameKey && updates.nameKey.trim().length > 0;

    setter(prev => {
      const newMap = new Map(prev);
      newMap.set(hierarchicalId, {
        ...entity,
        ...updates,
        _state: isNew ? 'new' : 'edited'
      });
      return newMap;
    });

    if (!isNew) {
      trackChange(hierarchicalId, 'edit');
    } else if (hasContentNow && entityType !== 'category') {
      trackChange(hierarchicalId, 'create');
    }
  };

  /**
   * Generic DELETE operation
   */
  const handleDelete = (entityType, entityId, parentId = null, categoryId = null) => {
    setConfirmDialog({
      isOpen: true,
      title: `Eliminar ${entityType === 'category' ? 'categoría' : entityType === 'subcategory' ? 'subcategoría' : 'item'}`,
      message: `¿Estás seguro de que quieres eliminar ${entityType === 'category' ? 'esta categoría' : entityType === 'subcategory' ? 'esta subcategoría' : 'este item'}?`,
      type: 'danger',
      onConfirm: () => {
        let hierarchicalId, parentHId;

        if (entityType === 'category') {
          hierarchicalId = buildHierarchicalId(entityId);
        } else if (entityType === 'subcategory') {
          parentHId = buildHierarchicalId(parentId);
          hierarchicalId = buildHierarchicalId(parentId, entityId);
        } else if (entityType === 'item') {
          parentHId = buildHierarchicalId(categoryId, parentId);
          hierarchicalId = buildHierarchicalId(categoryId, parentId, entityId);
        }

        const { map, setter } = getMapAndSetter(entityType);
        const entity = map.get(hierarchicalId);
        if (!entity) return;

        const isNew = entity._state === 'new';

        if (isNew) {
          // Remove completely if new
          setter(prev => {
            const newMap = new Map(prev);
            newMap.delete(hierarchicalId);
            return newMap;
          });

          // Update children map
          if (parentHId) {
            setChildrenMap(prev => {
              const newMap = new Map(prev);
              const children = newMap.get(parentHId) || [];
              newMap.set(parentHId, children.filter(id => id !== hierarchicalId));
              return newMap;
            });
          } else {
            setChildrenMap(prev => {
              const newMap = new Map(prev);
              newMap.delete(hierarchicalId);
              return newMap;
            });
          }

          untrackChange(hierarchicalId);
        } else {
          // Mark as deleted
          setter(prev => {
            const newMap = new Map(prev);
            newMap.set(hierarchicalId, {
              ...entity,
              _previousState: entity._state,
              _state: 'deleted'
            });
            return newMap;
          });
          trackChange(hierarchicalId, 'delete');
        }

        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  /**
   * Generic UNDO DELETE operation
   */
  const handleUndoDelete = (entityType, entityId, parentId = null, categoryId = null) => {
    let hierarchicalId;
    const navigation = getNavigation();

    if (entityType === 'category') {
      hierarchicalId = buildHierarchicalId(entityId);
    } else if (entityType === 'subcategory') {
      const selectedCategoryHId = navigation?.selectedCategoryHId;
      if (!selectedCategoryHId) return;
      const { categoryId: catId } = parseHierarchicalId(selectedCategoryHId);
      hierarchicalId = buildHierarchicalId(catId, entityId);
    } else if (entityType === 'item') {
      const selectedSubcategoryHId = navigation?.selectedSubcategoryHId;
      if (!selectedSubcategoryHId) return;
      const { categoryId: catId } = parseHierarchicalId(selectedSubcategoryHId);
      const subcategory = subcategoriesMap.get(selectedSubcategoryHId);
      if (!subcategory) return;
      hierarchicalId = buildHierarchicalId(catId, subcategory.id, entityId);
    }

    const { map, setter } = getMapAndSetter(entityType);
    const entity = map.get(hierarchicalId);
    if (!entity) return;

    setter(prev => {
      const newMap = new Map(prev);
      const previousState = entity._previousState || 'normal';
      const updated = { ...entity, _state: previousState };
      delete updated._previousState;
      newMap.set(hierarchicalId, updated);
      return newMap;
    });

    untrackChange(hierarchicalId);
  };

  /**
   * Generic MOVE operation (up/down)
   */
  const handleMove = (entityType, entityId, direction, parentId = null, categoryId = null) => {
    let hierarchicalId, itemsList;

    if (entityType === 'category') {
      hierarchicalId = buildHierarchicalId(entityId);
      itemsList = Array.from(categoriesMap.entries())
        .sort((a, b) => a[1].orderIndex - b[1].orderIndex);
    } else if (entityType === 'subcategory') {
      const categoryHId = buildHierarchicalId(parentId);
      hierarchicalId = buildHierarchicalId(parentId, entityId);
      const subcategoryHIds = childrenMap.get(categoryHId) || [];
      itemsList = subcategoryHIds;
    } else if (entityType === 'item') {
      const subcategoryHId = buildHierarchicalId(categoryId, parentId);
      hierarchicalId = buildHierarchicalId(categoryId, parentId, entityId);
      const itemHIds = childrenMap.get(subcategoryHId) || [];
      itemsList = itemHIds;
    }

    let index;
    if (entityType === 'category') {
      index = itemsList.findIndex(([hId]) => hId === hierarchicalId);
    } else {
      index = itemsList.indexOf(hierarchicalId);
    }

    const targetIndex = direction === 'up' ? index - 1 : index + 1;

    if (targetIndex < 0 || targetIndex >= itemsList.length) return;

    const { map, setter } = getMapAndSetter(entityType);

    if (entityType === 'category') {
      const [currentHId, current] = itemsList[index];
      const [targetHId, target] = itemsList[targetIndex];

      setter(prev => {
        const newMap = new Map(prev);
        newMap.set(currentHId, {
          ...current,
          orderIndex: target.orderIndex,
          _state: current._state !== 'new' ? 'edited' : current._state
        });
        newMap.set(targetHId, {
          ...target,
          orderIndex: current.orderIndex,
          _state: target._state !== 'new' ? 'edited' : target._state
        });
        return newMap;
      });
    } else {
      const currentHId = itemsList[index];
      const targetHId = itemsList[targetIndex];
      const current = map.get(currentHId);
      const target = map.get(targetHId);

      if (!current || !target) return;

      setter(prev => {
        const newMap = new Map(prev);
        newMap.set(currentHId, {
          ...current,
          orderIndex: target.orderIndex,
          _state: current._state !== 'new' ? 'edited' : current._state
        });
        newMap.set(targetHId, {
          ...target,
          orderIndex: current.orderIndex,
          _state: target._state !== 'new' ? 'edited' : target._state
        });
        return newMap;
      });

      // Update children order
      if (entityType === 'subcategory' || entityType === 'item') {
        const parentHId = entityType === 'subcategory'
          ? buildHierarchicalId(parentId)
          : buildHierarchicalId(categoryId, parentId);

        setChildrenMap(prev => {
          const newMap = new Map(prev);
          const newList = [...itemsList];
          [newList[index], newList[targetIndex]] = [newList[targetIndex], newList[index]];
          newMap.set(parentHId, newList);
          return newMap;
        });
      }
    }
  };

  return {
    handleAdd,
    handleUpdate,
    handleDelete,
    handleUndoDelete,
    handleMove
  };
};
