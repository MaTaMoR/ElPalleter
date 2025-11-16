import React, { useState, useEffect } from 'react';
import { Plus, Edit3, Eye, Save, X } from 'lucide-react';
import LanguageSelector from '../../components/menu/utils/LanguageSelector';
import Breadcrumbs from '../../components/menu/navigation/Breadcrumbs';
import CategoryView from '../../components/menu/views/CategoryView';
import SubcategoryView from '../../components/menu/views/SubcategoryView';
import ItemView from '../../components/menu/views/ItemView';
import ConfirmDialog from '../../components/menu/utils/ConfirmDialog';
import { useMenuData } from '../../hooks/useMenuData';
import { MenuService } from '../../services/MenuService';
import styles from './MenuPage.module.css';

// ============================================================================
// DATA STRUCTURE UTILITIES
// ============================================================================

/**
 * Builds a hierarchical ID from components
 */
const buildHierarchicalId = (categoryId, subcategoryId = null, itemId = null) => {
  if (itemId) return `${categoryId}.${subcategoryId}.${itemId}`;
  if (subcategoryId) return `${categoryId}.${subcategoryId}`;
  return categoryId;
};

/**
 * Parses a hierarchical ID into its components
 */
const parseHierarchicalId = (hierarchicalId) => {
  const parts = hierarchicalId.split('.');
  return {
    categoryId: parts[0] || null,
    subcategoryId: parts[1] || null,
    itemId: parts[2] || null,
    level: parts.length === 1 ? 'category' : parts.length === 2 ? 'subcategory' : 'item'
  };
};

/**
 * Converts nested menu data to flat Maps structure
 */
const flattenMenuData = (nestedData) => {
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
const unflattenMenuData = (categoriesMap, subcategoriesMap, itemsMap, childrenMap) => {
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
 * Gets all parent hierarchical IDs for a given hierarchical ID
 */
const getParentHierarchicalIds = (hierarchicalId) => {
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
const isDescendantOf = (childId, potentialParentId) => {
  return childId !== potentialParentId && childId.startsWith(potentialParentId + '.');
};

// ============================================================================
// MOCK DATA
// ============================================================================

const MOCK_MENU_DATA = [
  {
    id: 'cat-1',
    nameKey: 'Entrantes',
    orderIndex: 0,
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-20T15:30:00Z',
    subcategories: [
      {
        id: 'sub-1',
        nameKey: 'Ensaladas',
        orderIndex: 0,
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-20T15:30:00Z',
        items: [
          {
            id: 'item-1',
            nameKey: 'Ensalada César',
            descriptionKey: 'Lechuga, pollo, parmesano, crutones y salsa césar',
            price: 8.50,
            available: true,
            orderIndex: 0,
            createdAt: '2024-01-15T10:00:00Z',
            updatedAt: '2024-01-20T15:30:00Z'
          },
          {
            id: 'item-2',
            nameKey: 'Ensalada Mediterránea',
            descriptionKey: 'Lechuga, tomate, pepino, cebolla, aceitunas y queso feta',
            price: 7.50,
            available: true,
            orderIndex: 1,
            createdAt: '2024-01-15T10:00:00Z',
            updatedAt: '2024-01-20T15:30:00Z'
          }
        ]
      },
      {
        id: 'sub-2',
        nameKey: 'Tapas Frías',
        orderIndex: 1,
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-20T15:30:00Z',
        items: [
          {
            id: 'item-3',
            nameKey: 'Jamón Ibérico',
            descriptionKey: 'Jamón ibérico de bellota con pan con tomate',
            price: 12.00,
            available: true,
            orderIndex: 0,
            createdAt: '2024-01-15T10:00:00Z',
            updatedAt: '2024-01-20T15:30:00Z'
          }
        ]
      }
    ]
  },
  {
    id: 'cat-2',
    nameKey: 'Platos Principales',
    orderIndex: 1,
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-20T15:30:00Z',
    subcategories: [
      {
        id: 'sub-3',
        nameKey: 'Arroces',
        orderIndex: 0,
        createdAt: '2024-01-15T10:00:00:00Z',
        updatedAt: '2024-01-20T15:30:00Z',
        items: [
          {
            id: 'item-4',
            nameKey: 'Paella Valenciana',
            descriptionKey: 'Arroz con pollo, conejo y verduras de temporada',
            price: 15.00,
            available: true,
            orderIndex: 0,
            createdAt: '2024-01-15T10:00:00Z',
            updatedAt: '2024-01-20T15:30:00Z'
          },
          {
            id: 'item-5',
            nameKey: 'Arroz del Senyoret',
            descriptionKey: 'Arroz con marisco pelado',
            price: 18.00,
            available: false,
            orderIndex: 1,
            createdAt: '2024-01-15T10:00:00Z',
            updatedAt: '2024-01-20T15:30:00Z'
          }
        ]
      }
    ]
  }
];

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const MenuPage = () => {
  const [selectedLanguage, setSelectedLanguage] = useState('es');
  const [isEditing, setIsEditing] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  // Load data from backend
  const { data: backendData, loading, error, reload } = useMenuData(selectedLanguage);

  // Flat data structure using Maps
  const [categoriesMap, setCategoriesMap] = useState(new Map());
  const [subcategoriesMap, setSubcategoriesMap] = useState(new Map());
  const [itemsMap, setItemsMap] = useState(new Map());
  const [childrenMap, setChildrenMap] = useState(new Map());

  // Change tracking
  const [changeTracking, setChangeTracking] = useState(new Map());

  // Sync backend data with local state
  useEffect(() => {
    let dataToUse = null;

    if (backendData && backendData.length > 0) {
      dataToUse = backendData;
    } else if (!loading && !error) {
      dataToUse = MOCK_MENU_DATA;
    }

    if (dataToUse) {
      const flattened = flattenMenuData(dataToUse);
      setCategoriesMap(flattened.categoriesMap);
      setSubcategoriesMap(flattened.subcategoriesMap);
      setItemsMap(flattened.itemsMap);
      setChildrenMap(flattened.childrenMap);
      setChangeTracking(new Map());
    }
  }, [backendData, loading, error]);

  // Navigation state
  const [currentLevel, setCurrentLevel] = useState('categories');
  const [selectedCategoryHId, setSelectedCategoryHId] = useState(null);
  const [selectedSubcategoryHId, setSelectedSubcategoryHId] = useState(null);

  // ============================================================================
  // CHANGE TRACKING UTILITIES
  // ============================================================================

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

  // ============================================================================
  // VISUAL STATE ENRICHMENT
  // ============================================================================

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

  // ============================================================================
  // DATA RETRIEVAL FOR VIEWS
  // ============================================================================

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

  // ============================================================================
  // VALIDATION
  // ============================================================================

  const validateMenuData = () => {
    const errors = {};

    categoriesMap.forEach((category, categoryHId) => {
      const categoryErrors = {};

      if (!category.nameKey || category.nameKey.trim().length < 3) {
        categoryErrors.nameKey = 'El nombre debe tener al menos 3 caracteres';
      }

      const subcategoryHIds = childrenMap.get(categoryHId) || [];
      const subcategoriesErrors = {};

      subcategoryHIds.forEach(subcategoryHId => {
        const subcategory = subcategoriesMap.get(subcategoryHId);
        if (!subcategory) return;

        const subcategoryErrors = {};

        if (!subcategory.nameKey || subcategory.nameKey.trim().length < 3) {
          subcategoryErrors.nameKey = 'El nombre debe tener al menos 3 caracteres';
        }

        const itemHIds = childrenMap.get(subcategoryHId) || [];
        const itemsErrors = {};

        itemHIds.forEach(itemHId => {
          const item = itemsMap.get(itemHId);
          if (!item) return;

          const itemErrors = {};

          if (!item.nameKey || item.nameKey.trim().length < 3) {
            itemErrors.nameKey = 'El nombre debe tener al menos 3 caracteres';
          }

          if (item.price === undefined || item.price === null || item.price === '') {
            itemErrors.price = 'El precio es requerido';
          } else {
            const priceNum = parseFloat(item.price);
            if (isNaN(priceNum) || priceNum < 0) {
              itemErrors.price = 'El precio debe ser un número positivo';
            }
          }

          if (Object.keys(itemErrors).length > 0) {
            itemsErrors[item.id] = itemErrors;
          }
        });

        if (Object.keys(itemsErrors).length > 0) {
          subcategoryErrors.items = itemsErrors;
        }

        if (Object.keys(subcategoryErrors).length > 0) {
          subcategoriesErrors[subcategory.id] = subcategoryErrors;
        }
      });

      if (Object.keys(subcategoriesErrors).length > 0) {
        categoryErrors.subcategories = subcategoriesErrors;
      }

      if (Object.keys(categoryErrors).length > 0) {
        errors[category.id] = categoryErrors;
      }
    });

    return errors;
  };

  useEffect(() => {
    if (isEditing) {
      const errors = validateMenuData();
      setValidationErrors(errors);
    } else {
      setValidationErrors({});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoriesMap, subcategoriesMap, itemsMap, isEditing]);

  // ============================================================================
  // NAVIGATION
  // ============================================================================

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

  // ============================================================================
  // DIALOG STATE
  // ============================================================================

  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null,
    type: 'warning'
  });

  // ============================================================================
  // SAVE/CANCEL/EDIT MODE
  // ============================================================================

  const handleLanguageChange = (language) => {
    if (hasRealChanges()) {
      setConfirmDialog({
        isOpen: true,
        title: 'Cambios sin guardar',
        message: '¿Estás seguro de que quieres cambiar el idioma? Se perderán todos los cambios no guardados.',
        type: 'warning',
        onConfirm: () => {
          setSelectedLanguage(language);
          setConfirmDialog({ ...confirmDialog, isOpen: false });
        }
      });
    } else {
      setSelectedLanguage(language);
    }
  };

  const handleToggleEditMode = () => {
    if (isEditing && hasRealChanges()) {
      setConfirmDialog({
        isOpen: true,
        title: 'Salir del modo edición',
        message: 'Tienes cambios sin guardar. ¿Estás seguro de que quieres salir del modo edición?',
        type: 'warning',
        onConfirm: () => {
          setIsEditing(false);
          setConfirmDialog({ ...confirmDialog, isOpen: false });
          reload();
        }
      });
    } else {
      setIsEditing(!isEditing);
    }
  };

  const processMenuDataForBackend = (data) => {
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

  const handleSave = () => {
    const errors = validateMenuData();
    const hasErrors = Object.keys(errors).length > 0;

    if (hasErrors) {
      setConfirmDialog({
        isOpen: true,
        title: 'Errores de validación',
        message: 'No se puede guardar porque hay errores de validación en la carta.',
        type: 'danger',
        onConfirm: () => {
          setConfirmDialog({ ...confirmDialog, isOpen: false });
        }
      });
      return;
    }

    setConfirmDialog({
      isOpen: true,
      title: 'Guardar cambios',
      message: '¿Estás seguro de que quieres guardar todos los cambios en la carta?',
      type: 'info',
      onConfirm: async () => {
        setConfirmDialog({ ...confirmDialog, isOpen: false });
        setIsSaving(true);

        try {
          const nestedData = unflattenMenuData(categoriesMap, subcategoriesMap, itemsMap, childrenMap);
          const processedData = processMenuDataForBackend(nestedData);
          await MenuService.saveMenu(processedData, selectedLanguage);
          await reload();
          setIsEditing(false);
          setIsSaving(false);

          setConfirmDialog({
            isOpen: true,
            title: 'Guardado exitoso',
            message: 'Los cambios se han guardado correctamente en la carta.',
            type: 'info',
            onConfirm: () => {
              setConfirmDialog({ ...confirmDialog, isOpen: false });
            }
          });
        } catch (error) {
          console.error('Error al guardar:', error);
          setIsSaving(false);

          setConfirmDialog({
            isOpen: true,
            title: 'Error al guardar',
            message: `No se pudieron guardar los cambios: ${error.message || 'Error desconocido'}`,
            type: 'danger',
            onConfirm: () => {
              setConfirmDialog({ ...confirmDialog, isOpen: false });
            }
          });
        }
      }
    });
  };

  const handleCancel = () => {
    setConfirmDialog({
      isOpen: true,
      title: 'Cancelar cambios',
      message: '¿Estás seguro de que quieres cancelar? Se perderán todos los cambios realizados.',
      type: 'danger',
      onConfirm: () => {
        setIsEditing(false);
        setConfirmDialog({ ...confirmDialog, isOpen: false });
        reload();
      }
    });
  };

  // ============================================================================
  // CATEGORY CRUD OPERATIONS - O(1) access!
  // ============================================================================

  const handleAddCategory = () => {
    const newCategoryId = `temp-category-${Date.now()}`;
    const categoryHId = buildHierarchicalId(newCategoryId);

    const newCategory = {
      id: newCategoryId,
      nameKey: '',
      orderIndex: categoriesMap.size,
      _state: 'new'
    };

    setCategoriesMap(prev => new Map(prev).set(categoryHId, newCategory));
    setSelectedCategoryHId(categoryHId);
    setCurrentLevel('subcategories');
  };

  const handleUpdateCategory = (categoryId, updates) => {
    const categoryHId = buildHierarchicalId(categoryId);
    const category = categoriesMap.get(categoryHId);
    if (!category) return;

    const isNew = category._state === 'new';

    setCategoriesMap(prev => {
      const newMap = new Map(prev);
      newMap.set(categoryHId, {
        ...category,
        ...updates,
        _state: isNew ? 'new' : 'edited'
      });
      return newMap;
    });

    if (!isNew) {
      trackChange(categoryHId, 'edit');
    }
  };

  const handleDeleteCategory = (categoryId) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Eliminar categoría',
      message: '¿Estás seguro de que quieres eliminar esta categoría?',
      type: 'danger',
      onConfirm: () => {
        const categoryHId = buildHierarchicalId(categoryId);
        const category = categoriesMap.get(categoryHId);
        if (!category) return;

        const isNew = category._state === 'new';

        if (isNew) {
          // Remove completely if new
          setCategoriesMap(prev => {
            const newMap = new Map(prev);
            newMap.delete(categoryHId);
            return newMap;
          });
          setChildrenMap(prev => {
            const newMap = new Map(prev);
            newMap.delete(categoryHId);
            return newMap;
          });
        } else {
          // Mark as deleted
          setCategoriesMap(prev => {
            const newMap = new Map(prev);
            newMap.set(categoryHId, {
              ...category,
              _previousState: category._state,
              _state: 'deleted'
            });
            return newMap;
          });
          trackChange(categoryHId, 'delete');
        }

        setConfirmDialog({ ...confirmDialog, isOpen: false });
      }
    });
  };

  const handleUndoDeleteCategory = (categoryId) => {
    const categoryHId = buildHierarchicalId(categoryId);
    const category = categoriesMap.get(categoryHId);
    if (!category) return;

    setCategoriesMap(prev => {
      const newMap = new Map(prev);
      const previousState = category._previousState || 'normal';
      const updated = { ...category, _state: previousState };
      delete updated._previousState;
      newMap.set(categoryHId, updated);
      return newMap;
    });

    untrackChange(categoryHId);
  };

  const handleMoveCategoryUp = (categoryId) => {
    const categoryHId = buildHierarchicalId(categoryId);

    const categoryList = Array.from(categoriesMap.entries())
      .sort((a, b) => a[1].orderIndex - b[1].orderIndex);

    const index = categoryList.findIndex(([hId]) => hId === categoryHId);
    if (index <= 0) return;

    setCategoriesMap(prev => {
      const newMap = new Map(prev);

      const [currentHId, current] = categoryList[index];
      const [prevHId, previous] = categoryList[index - 1];

      newMap.set(currentHId, {
        ...current,
        orderIndex: previous.orderIndex,
        _state: current._state !== 'new' ? 'edited' : current._state
      });

      newMap.set(prevHId, {
        ...previous,
        orderIndex: current.orderIndex,
        _state: previous._state !== 'new' ? 'edited' : previous._state
      });

      return newMap;
    });
  };

  const handleMoveCategoryDown = (categoryId) => {
    const categoryHId = buildHierarchicalId(categoryId);

    const categoryList = Array.from(categoriesMap.entries())
      .sort((a, b) => a[1].orderIndex - b[1].orderIndex);

    const index = categoryList.findIndex(([hId]) => hId === categoryHId);
    if (index < 0 || index >= categoryList.length - 1) return;

    setCategoriesMap(prev => {
      const newMap = new Map(prev);

      const [currentHId, current] = categoryList[index];
      const [nextHId, next] = categoryList[index + 1];

      newMap.set(currentHId, {
        ...current,
        orderIndex: next.orderIndex,
        _state: current._state !== 'new' ? 'edited' : current._state
      });

      newMap.set(nextHId, {
        ...next,
        orderIndex: current.orderIndex,
        _state: next._state !== 'new' ? 'edited' : next._state
      });

      return newMap;
    });
  };

  // ============================================================================
  // SUBCATEGORY CRUD OPERATIONS - O(1) access!
  // ============================================================================

  const handleAddSubcategory = (categoryId) => {
    const categoryHId = buildHierarchicalId(categoryId);
    const subcategoryHIds = childrenMap.get(categoryHId) || [];

    const newSubcategoryId = `temp-subcategory-${Date.now()}`;
    const subcategoryHId = buildHierarchicalId(categoryId, newSubcategoryId);

    const newSubcategory = {
      id: newSubcategoryId,
      parentId: categoryId,
      nameKey: '',
      orderIndex: subcategoryHIds.length,
      _state: 'new'
    };

    setSubcategoriesMap(prev => new Map(prev).set(subcategoryHId, newSubcategory));
    setChildrenMap(prev => {
      const newMap = new Map(prev);
      newMap.set(categoryHId, [...subcategoryHIds, subcategoryHId]);
      return newMap;
    });

    setSelectedSubcategoryHId(subcategoryHId);
    setCurrentLevel('items');
  };

  const handleUpdateSubcategory = (subcategoryId, updates) => {
    const { categoryId } = parseHierarchicalId(selectedCategoryHId);
    const subcategoryHId = buildHierarchicalId(categoryId, subcategoryId);
    const subcategory = subcategoriesMap.get(subcategoryHId);
    if (!subcategory) return;

    const isNew = subcategory._state === 'new';
    const hasContentNow = updates.nameKey && updates.nameKey.trim().length > 0;

    setSubcategoriesMap(prev => {
      const newMap = new Map(prev);
      newMap.set(subcategoryHId, {
        ...subcategory,
        ...updates,
        _state: isNew ? 'new' : 'edited'
      });
      return newMap;
    });

    if (!isNew) {
      trackChange(subcategoryHId, 'edit');
    } else if (hasContentNow) {
      trackChange(subcategoryHId, 'create');
    }
  };

  const handleDeleteSubcategory = (categoryId, subcategoryId) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Eliminar subcategoría',
      message: '¿Estás seguro de que quieres eliminar esta subcategoría?',
      type: 'danger',
      onConfirm: () => {
        const categoryHId = buildHierarchicalId(categoryId);
        const subcategoryHId = buildHierarchicalId(categoryId, subcategoryId);
        const subcategory = subcategoriesMap.get(subcategoryHId);
        if (!subcategory) return;

        const isNew = subcategory._state === 'new';

        if (isNew) {
          setSubcategoriesMap(prev => {
            const newMap = new Map(prev);
            newMap.delete(subcategoryHId);
            return newMap;
          });
          setChildrenMap(prev => {
            const newMap = new Map(prev);
            const categoryChildren = newMap.get(categoryHId) || [];
            newMap.set(categoryHId, categoryChildren.filter(id => id !== subcategoryHId));
            newMap.delete(subcategoryHId);
            return newMap;
          });
          untrackChange(subcategoryHId);
        } else {
          setSubcategoriesMap(prev => {
            const newMap = new Map(prev);
            newMap.set(subcategoryHId, {
              ...subcategory,
              _previousState: subcategory._state,
              _state: 'deleted'
            });
            return newMap;
          });
          trackChange(subcategoryHId, 'delete');
        }

        setConfirmDialog({ ...confirmDialog, isOpen: false });
      }
    });
  };

  const handleUndoDeleteSubcategory = (subcategoryId) => {
    const { categoryId } = parseHierarchicalId(selectedCategoryHId);
    const subcategoryHId = buildHierarchicalId(categoryId, subcategoryId);
    const subcategory = subcategoriesMap.get(subcategoryHId);
    if (!subcategory) return;

    setSubcategoriesMap(prev => {
      const newMap = new Map(prev);
      const previousState = subcategory._previousState || 'normal';
      const updated = { ...subcategory, _state: previousState };
      delete updated._previousState;
      newMap.set(subcategoryHId, updated);
      return newMap;
    });

    untrackChange(subcategoryHId);
  };

  const handleMoveSubcategoryUp = (categoryId, subcategoryId) => {
    const categoryHId = buildHierarchicalId(categoryId);
    const subcategoryHIds = childrenMap.get(categoryHId) || [];
    const subcategoryHId = buildHierarchicalId(categoryId, subcategoryId);

    const index = subcategoryHIds.indexOf(subcategoryHId);
    if (index <= 0) return;

    setSubcategoriesMap(prev => {
      const newMap = new Map(prev);

      const current = newMap.get(subcategoryHIds[index]);
      const previous = newMap.get(subcategoryHIds[index - 1]);

      if (current && previous) {
        newMap.set(subcategoryHIds[index], {
          ...current,
          orderIndex: previous.orderIndex,
          _state: current._state !== 'new' ? 'edited' : current._state
        });

        newMap.set(subcategoryHIds[index - 1], {
          ...previous,
          orderIndex: current.orderIndex,
          _state: previous._state !== 'new' ? 'edited' : previous._state
        });
      }

      return newMap;
    });

    setChildrenMap(prev => {
      const newMap = new Map(prev);
      const newList = [...subcategoryHIds];
      [newList[index - 1], newList[index]] = [newList[index], newList[index - 1]];
      newMap.set(categoryHId, newList);
      return newMap;
    });
  };

  const handleMoveSubcategoryDown = (categoryId, subcategoryId) => {
    const categoryHId = buildHierarchicalId(categoryId);
    const subcategoryHIds = childrenMap.get(categoryHId) || [];
    const subcategoryHId = buildHierarchicalId(categoryId, subcategoryId);

    const index = subcategoryHIds.indexOf(subcategoryHId);
    if (index < 0 || index >= subcategoryHIds.length - 1) return;

    setSubcategoriesMap(prev => {
      const newMap = new Map(prev);

      const current = newMap.get(subcategoryHIds[index]);
      const next = newMap.get(subcategoryHIds[index + 1]);

      if (current && next) {
        newMap.set(subcategoryHIds[index], {
          ...current,
          orderIndex: next.orderIndex,
          _state: current._state !== 'new' ? 'edited' : current._state
        });

        newMap.set(subcategoryHIds[index + 1], {
          ...next,
          orderIndex: current.orderIndex,
          _state: next._state !== 'new' ? 'edited' : next._state
        });
      }

      return newMap;
    });

    setChildrenMap(prev => {
      const newMap = new Map(prev);
      const newList = [...subcategoryHIds];
      [newList[index], newList[index + 1]] = [newList[index + 1], newList[index]];
      newMap.set(categoryHId, newList);
      return newMap;
    });
  };

  // ============================================================================
  // ITEM CRUD OPERATIONS - O(1) access!
  // ============================================================================

  const handleAddItem = (subcategoryId) => {
    const { categoryId } = parseHierarchicalId(selectedSubcategoryHId);
    const subcategoryHId = buildHierarchicalId(categoryId, subcategoryId);
    const itemHIds = childrenMap.get(subcategoryHId) || [];

    const newItemId = `temp-item-${Date.now()}`;
    const itemHId = buildHierarchicalId(categoryId, subcategoryId, newItemId);

    const newItem = {
      id: newItemId,
      parentId: subcategoryId,
      categoryId: categoryId,
      nameKey: '',
      descriptionKey: '',
      price: '',
      available: true,
      orderIndex: itemHIds.length,
      _state: 'new'
    };

    setItemsMap(prev => new Map(prev).set(itemHId, newItem));
    setChildrenMap(prev => {
      const newMap = new Map(prev);
      newMap.set(subcategoryHId, [...itemHIds, itemHId]);
      return newMap;
    });

    trackChange(itemHId, 'create');
  };

  const handleUpdateItem = (itemId, updates) => {
    const { categoryId } = parseHierarchicalId(selectedSubcategoryHId);
    const subcategory = subcategoriesMap.get(selectedSubcategoryHId);
    if (!subcategory) return;

    const itemHId = buildHierarchicalId(categoryId, subcategory.id, itemId);
    const item = itemsMap.get(itemHId);
    if (!item) return;

    const isNew = item._state === 'new';
    const hasContentNow =
      (updates.nameKey && updates.nameKey.trim().length > 0) ||
      (updates.price !== undefined && updates.price !== null && updates.price !== '');

    setItemsMap(prev => {
      const newMap = new Map(prev);
      newMap.set(itemHId, {
        ...item,
        ...updates,
        _state: isNew ? 'new' : 'edited'
      });
      return newMap;
    });

    if (!isNew) {
      trackChange(itemHId, 'edit');
    } else if (hasContentNow) {
      trackChange(itemHId, 'create');
    }
  };

  const handleDeleteItem = (subcategoryId, itemId) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Eliminar item',
      message: '¿Estás seguro de que quieres eliminar este item?',
      type: 'danger',
      onConfirm: () => {
        const { categoryId } = parseHierarchicalId(selectedSubcategoryHId);
        const subcategoryHId = buildHierarchicalId(categoryId, subcategoryId);
        const itemHId = buildHierarchicalId(categoryId, subcategoryId, itemId);
        const item = itemsMap.get(itemHId);
        if (!item) return;

        const isNew = item._state === 'new';

        if (isNew) {
          setItemsMap(prev => {
            const newMap = new Map(prev);
            newMap.delete(itemHId);
            return newMap;
          });
          setChildrenMap(prev => {
            const newMap = new Map(prev);
            const subcategoryChildren = newMap.get(subcategoryHId) || [];
            newMap.set(subcategoryHId, subcategoryChildren.filter(id => id !== itemHId));
            return newMap;
          });
          untrackChange(itemHId);
        } else {
          setItemsMap(prev => {
            const newMap = new Map(prev);
            newMap.set(itemHId, {
              ...item,
              _previousState: item._state,
              _state: 'deleted'
            });
            return newMap;
          });
          trackChange(itemHId, 'delete');
        }

        setConfirmDialog({ ...confirmDialog, isOpen: false });
      }
    });
  };

  const handleUndoDeleteItem = (itemId) => {
    const { categoryId } = parseHierarchicalId(selectedSubcategoryHId);
    const subcategory = subcategoriesMap.get(selectedSubcategoryHId);
    if (!subcategory) return;

    const itemHId = buildHierarchicalId(categoryId, subcategory.id, itemId);
    const item = itemsMap.get(itemHId);
    if (!item) return;

    setItemsMap(prev => {
      const newMap = new Map(prev);
      const previousState = item._previousState || 'normal';
      const updated = { ...item, _state: previousState };
      delete updated._previousState;
      newMap.set(itemHId, updated);
      return newMap;
    });

    untrackChange(itemHId);
  };

  const handleMoveItemUp = (subcategoryId, itemId) => {
    const { categoryId } = parseHierarchicalId(selectedSubcategoryHId);
    const subcategoryHId = buildHierarchicalId(categoryId, subcategoryId);
    const itemHIds = childrenMap.get(subcategoryHId) || [];
    const itemHId = buildHierarchicalId(categoryId, subcategoryId, itemId);

    const index = itemHIds.indexOf(itemHId);
    if (index <= 0) return;

    setItemsMap(prev => {
      const newMap = new Map(prev);

      const current = newMap.get(itemHIds[index]);
      const previous = newMap.get(itemHIds[index - 1]);

      if (current && previous) {
        newMap.set(itemHIds[index], {
          ...current,
          orderIndex: previous.orderIndex,
          _state: current._state !== 'new' ? 'edited' : current._state
        });

        newMap.set(itemHIds[index - 1], {
          ...previous,
          orderIndex: current.orderIndex,
          _state: previous._state !== 'new' ? 'edited' : previous._state
        });
      }

      return newMap;
    });

    setChildrenMap(prev => {
      const newMap = new Map(prev);
      const newList = [...itemHIds];
      [newList[index - 1], newList[index]] = [newList[index], newList[index - 1]];
      newMap.set(subcategoryHId, newList);
      return newMap;
    });
  };

  const handleMoveItemDown = (subcategoryId, itemId) => {
    const { categoryId } = parseHierarchicalId(selectedSubcategoryHId);
    const subcategoryHId = buildHierarchicalId(categoryId, subcategoryId);
    const itemHIds = childrenMap.get(subcategoryHId) || [];
    const itemHId = buildHierarchicalId(categoryId, subcategoryId, itemId);

    const index = itemHIds.indexOf(itemHId);
    if (index < 0 || index >= itemHIds.length - 1) return;

    setItemsMap(prev => {
      const newMap = new Map(prev);

      const current = newMap.get(itemHIds[index]);
      const next = newMap.get(itemHIds[index + 1]);

      if (current && next) {
        newMap.set(itemHIds[index], {
          ...current,
          orderIndex: next.orderIndex,
          _state: current._state !== 'new' ? 'edited' : current._state
        });

        newMap.set(itemHIds[index + 1], {
          ...next,
          orderIndex: current.orderIndex,
          _state: next._state !== 'new' ? 'edited' : next._state
        });
      }

      return newMap;
    });

    setChildrenMap(prev => {
      const newMap = new Map(prev);
      const newList = [...itemHIds];
      [newList[index], newList[index + 1]] = [newList[index + 1], newList[index]];
      newMap.set(subcategoryHId, newList);
      return newMap;
    });
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  if (loading) {
    return (
      <div className={styles.menuPage}>
        <div className={styles.loadingContainer}>
          <div className={styles.loadingSpinner}></div>
          <p>Cargando carta...</p>
        </div>
      </div>
    );
  }

  if (error && categoriesMap.size === 0) {
    return (
      <div className={styles.menuPage}>
        <div className={styles.errorContainer}>
          <p className={styles.errorText}>Error al cargar la carta: {error}</p>
          <button
            type="button"
            className={styles.retryButton}
            onClick={reload}
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  const currentCategory = getCurrentCategoryData();
  const currentSubcategory = getCurrentSubcategoryData();

  return (
    <div className={styles.menuPage}>
      <div className={styles.content}>
        <div className={styles.categoriesContainer}>
          <div className={styles.header}>
            <div className={styles.headerTop}>
              <h1 className={styles.title}>Gestión de Carta</h1>
              <div className={styles.headerActions}>
                <LanguageSelector
                  selectedLanguage={selectedLanguage}
                  onChange={handleLanguageChange}
                  disabled={isEditing}
                />
                <button
                  type="button"
                  className={`${styles.editButton} ${isEditing ? styles.active : ''}`}
                  onClick={handleToggleEditMode}
                >
                  {isEditing ? (
                    <>
                      <Eye size={18} />
                      <span>Volver a visualización</span>
                    </>
                  ) : (
                    <>
                      <Edit3 size={18} />
                      <span>Editar</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {isEditing && (
              <div className={styles.editingBar}>
                <div className={styles.editingInfo}>
                  <span className={hasRealChanges() ? styles.changesBadge : styles.editingBadge}>
                    {hasRealChanges() ? 'Cambios sin guardar' : 'Modo Edición'}
                  </span>
                </div>
                <div className={styles.editingActions}>
                  <button
                    type="button"
                    className={styles.cancelButton}
                    onClick={handleCancel}
                    disabled={!hasRealChanges() || isSaving}
                  >
                    <X size={18} strokeWidth={2.5} />
                    <span>Cancelar</span>
                  </button>
                  <button
                    type="button"
                    className={styles.saveButton}
                    onClick={handleSave}
                    disabled={!hasRealChanges() || isSaving}
                  >
                    <Save size={18} />
                    <span>{isSaving ? 'Guardando...' : 'Guardar'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          <Breadcrumbs
            currentLevel={currentLevel}
            categoryName={currentCategory?.nameKey}
            subcategoryName={currentSubcategory?.nameKey}
            onNavigateToCategories={handleNavigateToCategories}
            onNavigateToSubcategories={handleNavigateToSubcategories}
          />

          <div className={styles.viewContainer}>
            {currentLevel === 'categories' && (
              <CategoryView
                categories={getCategoriesForView()}
                onCategoryClick={handleCategoryClick}
                onAddCategory={isEditing ? handleAddCategory : undefined}
                onDeleteCategory={isEditing ? handleDeleteCategory : undefined}
                onUndoDeleteCategory={isEditing ? handleUndoDeleteCategory : undefined}
                subcategoryCounts={getSubcategoryCounts()}
                isEditing={isEditing}
              />
            )}

            {currentLevel === 'subcategories' && currentCategory && (
              <SubcategoryView
                subcategories={currentCategory.subcategories || []}
                categoryName={currentCategory.nameKey || 'Sin nombre'}
                category={currentCategory}
                onSubcategoryClick={handleSubcategoryClick}
                onAddSubcategory={isEditing ? () => handleAddSubcategory(currentCategory.id) : undefined}
                onDeleteSubcategory={isEditing ? (subId) => handleDeleteSubcategory(currentCategory.id, subId) : undefined}
                onUndoDeleteSubcategory={isEditing ? handleUndoDeleteSubcategory : undefined}
                onUpdateCategory={isEditing ? handleUpdateCategory : undefined}
                onBack={handleBackFromSubcategories}
                itemCounts={getItemCounts()}
                isEditing={isEditing}
                categoryError={validationErrors[currentCategory.id]?.nameKey}
              />
            )}

            {currentLevel === 'items' && currentSubcategory && (
              <ItemView
                items={currentSubcategory.items || []}
                subcategoryName={currentSubcategory.nameKey || 'Sin nombre'}
                subcategory={currentSubcategory}
                onAddItem={isEditing ? () => handleAddItem(currentSubcategory.id) : undefined}
                onUpdateItem={isEditing ? handleUpdateItem : undefined}
                onUpdateSubcategory={isEditing ? handleUpdateSubcategory : undefined}
                onDeleteItem={isEditing ? (itemId) => handleDeleteItem(currentSubcategory.id, itemId) : undefined}
                onUndoDeleteItem={isEditing ? handleUndoDeleteItem : undefined}
                onBack={handleBackFromItems}
                isEditing={isEditing}
                errors={validationErrors}
                subcategoryError={validationErrors[currentCategory?.id]?.subcategories?.[currentSubcategory.id]?.nameKey}
              />
            )}
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        type={confirmDialog.type}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
        confirmText={confirmDialog.type === 'danger' ? 'Eliminar' : 'Confirmar'}
      />
    </div>
  );
};

export default MenuPage;