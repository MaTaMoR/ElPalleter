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
    originalCategoriesMap,
    originalSubcategoriesMap,
    originalItemsMap,
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

  // Get the appropriate original map based on entity type
  const getOriginalMap = (entityType) => {
    const config = ENTITY_CONFIG[entityType];
    return {
      categoriesMap: originalCategoriesMap,
      subcategoriesMap: originalSubcategoriesMap,
      itemsMap: originalItemsMap
    }[config.mapKey];
  };

  /**
   * Generic ADD operation
   * Returns the new entity ID so views can handle navigation/editing
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

    // Track change for items
    if (entityType === 'item') {
      trackChange(hierarchicalId, 'create');
    }

    // Return the new entity ID so views can navigate/handle it
    return newEntityId;
  };

  /**
   * Generic UPDATE operation
   * Now accepts explicit parentId and categoryId parameters instead of relying on navigation state
   * - For subcategories: parentId should be the categoryId
   * - For items: parentId should be the subcategoryId, categoryId should be the categoryId
   */
  const handleUpdate = (entityType, entityId, updates, parentId = null, categoryId = null) => {
    let hierarchicalId;

    if (entityType === 'category') {
      hierarchicalId = buildHierarchicalId(entityId);
    } else if (entityType === 'subcategory') {
      // For subcategories, parentId is the categoryId
      if (!parentId) {
        console.error('❌ No parentId (categoryId) provided for subcategory update');
        return;
      }
      hierarchicalId = buildHierarchicalId(parentId, entityId);
    } else if (entityType === 'item') {
      // For items, we need both categoryId and parentId (subcategoryId)
      if (!categoryId || !parentId) {
        console.error('❌ Missing categoryId or parentId (subcategoryId) for item update');
        return;
      }
      hierarchicalId = buildHierarchicalId(categoryId, parentId, entityId);
    }

    const { map, setter } = getMapAndSetter(entityType);
    const entity = map.get(hierarchicalId);
    if (!entity) return;

    const isNew = entity._state === 'new';
    const hasContentNow = updates.nameKey && updates.nameKey.trim().length > 0;

    // Merge updates with current entity
    const updatedEntity = {
      ...entity,
      ...updates
    };

    // For existing entities, compare with original to detect real changes
    if (!isNew) {
      const originalMap = getOriginalMap(entityType);
      const originalEntity = originalMap.get(hierarchicalId);

      if (originalEntity) {
        // Define fields to compare based on entity type
        let fieldsToCompare = ['nameKey'];
        if (entityType === 'item') {
          fieldsToCompare = ['nameKey', 'descriptionKey', 'price', 'available'];
        }

        // Check if updated entity matches original
        const matchesOriginal = fieldsToCompare.every(field => {
          const originalValue = originalEntity[field];
          const updatedValue = updatedEntity[field];

          // Handle empty strings and undefined/null as equivalent for comparison
          const normalizedOriginal = (originalValue === undefined || originalValue === null) ? '' : originalValue;
          const normalizedUpdated = (updatedValue === undefined || updatedValue === null) ? '' : updatedValue;

          return normalizedOriginal === normalizedUpdated;
        });

        if (matchesOriginal) {
          // Values match original - revert to normal state
          setter(prev => {
            const newMap = new Map(prev);
            newMap.set(hierarchicalId, {
              ...updatedEntity,
              _state: 'normal'
            });
            return newMap;
          });
          untrackChange(hierarchicalId);
          return;
        }
      }
    }

    // If we get here, either it's new or has real changes
    setter(prev => {
      const newMap = new Map(prev);
      newMap.set(hierarchicalId, {
        ...updatedEntity,
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
   * Now accepts explicit parentId and categoryId parameters instead of relying on navigation state
   * - For subcategories: parentId should be the categoryId
   * - For items: parentId should be the subcategoryId, categoryId should be the categoryId
   */
  const handleUndoDelete = (entityType, entityId, parentId = null, categoryId = null) => {
    let hierarchicalId;

    if (entityType === 'category') {
      hierarchicalId = buildHierarchicalId(entityId);
    } else if (entityType === 'subcategory') {
      // For subcategories, parentId is the categoryId
      if (!parentId) {
        console.error('❌ No parentId (categoryId) provided for subcategory undo delete');
        return;
      }
      hierarchicalId = buildHierarchicalId(parentId, entityId);
    } else if (entityType === 'item') {
      // For items, we need both categoryId and parentId (subcategoryId)
      if (!categoryId || !parentId) {
        console.error('❌ Missing categoryId or parentId (subcategoryId) for item undo delete');
        return;
      }
      hierarchicalId = buildHierarchicalId(categoryId, parentId, entityId);
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
