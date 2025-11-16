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

// Datos mock para testing (fallback)
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
        createdAt: '2024-01-15T10:00:00Z',
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

const MenuPage = () => {
  const [selectedLanguage, setSelectedLanguage] = useState('es');
  const [isEditing, setIsEditing] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  // Cargar datos del backend
  const { data: backendData, loading, error, reload } = useMenuData(selectedLanguage);
  const [menuData, setMenuData] = useState([]);

  // Sistema de tracking de cambios - Mucho más simple
  // Map donde la key es el ID del elemento y el value es el tipo de cambio
  const [changeTracking, setChangeTracking] = useState(new Map());

  // Sincronizar datos del backend con el estado local
  useEffect(() => {
    if (backendData && backendData.length > 0) {
      setMenuData(backendData);
      setChangeTracking(new Map()); // Limpiar cambios al cargar nuevos datos
    } else if (!loading && !error) {
      // Si no hay datos del backend, usar mock
      setMenuData(MOCK_MENU_DATA);
      setChangeTracking(new Map()); // Limpiar cambios al cargar mock
    }
  }, [backendData, loading, error]);

  // Estado para navegación por niveles
  const [currentLevel, setCurrentLevel] = useState('categories');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState(null);

  // Funciones para gestionar el tracking de cambios
  const trackChange = (id, type) => {
    setChangeTracking(prev => {
      const newMap = new Map(prev);
      newMap.set(id, type);
      return newMap;
    });
  };

  const untrackChange = (id) => {
    setChangeTracking(prev => {
      const newMap = new Map(prev);
      newMap.delete(id);
      return newMap;
    });
  };

  const hasRealChanges = () => {
    return changeTracking.size > 0;
  };

  // Función auxiliar para construir el ID jerárquico de un elemento
  const buildHierarchicalId = (categoryId, subcategoryId = null, itemId = null) => {
    if (itemId) {
      return `${categoryId}.${subcategoryId}.${itemId}`;
    }
    if (subcategoryId) {
      return `${categoryId}.${subcategoryId}`;
    }
    return categoryId;
  };

  // Función auxiliar para verificar si hay cambios en hijos (usando IDs jerárquicos)
  const hasChildChanges = (hierarchicalId) => {
    for (const [changeId] of changeTracking) {
      // Si el changeId empieza con hierarchicalId pero no es igual, es un hijo
      if (changeId !== hierarchicalId && changeId.startsWith(hierarchicalId + '.')) {
        return true;
      }
    }
    return false;
  };

  // Función para enriquecer los datos del menú con el estado visual basado en el tracking
  const enrichMenuDataWithVisualState = (data) => {
    return data.map(category => {
      const categoryHierarchicalId = buildHierarchicalId(category.id);

      // Primero procesar subcategorías e items
      const enrichedSubcategories = (category.subcategories || []).map(subcategory => {
        const subcategoryHierarchicalId = buildHierarchicalId(category.id, subcategory.id);

        // Procesar items - calcular su estado visual
        const enrichedItems = (subcategory.items || []).map(item => {
          const itemHierarchicalId = buildHierarchicalId(category.id, subcategory.id, item.id);

          let itemState = 'normal';
          if (item._state === 'new') {
            itemState = 'new';
          } else if (changeTracking.has(itemHierarchicalId)) {
            const changeType = changeTracking.get(itemHierarchicalId);
            if (changeType === 'delete') itemState = 'deleted';
            else if (changeType === 'edit' || changeType === 'create') itemState = 'edited';
          }

          return {
            ...item,
            _state: itemState
          };
        });

        // Calcular estado de la subcategoría
        let subcategoryState = 'normal';

        if (subcategory._state === 'new') {
          subcategoryState = 'new';
        } else if (changeTracking.has(subcategoryHierarchicalId)) {
          const changeType = changeTracking.get(subcategoryHierarchicalId);
          if (changeType === 'delete') {
            subcategoryState = 'deleted';
          } else if (changeType === 'edit' || changeType === 'create') {
            subcategoryState = 'edited';
          } 
        } else if (hasChildChanges(subcategoryHierarchicalId)) {
          // Si tiene items con cambios
          subcategoryState = 'edited';
        }

        return {
          ...subcategory,
          _state: subcategoryState,
          items: enrichedItems
        };
      });

      // Calcular estado de la categoría
      let categoryState = 'normal';

      if (category._state === 'new') {
        categoryState = 'new';
      } else if (changeTracking.has(categoryHierarchicalId)) {
        const changeType = changeTracking.get(categoryHierarchicalId);
        if (changeType === 'delete') {
          categoryState = 'deleted';
        } else if (changeType === 'edit' || changeType === 'create') {
          categoryState = 'edited';
        }
      } else if (hasChildChanges(categoryHierarchicalId)) {
        // Si tiene subcategorías o items con cambios
        categoryState = 'edited';
      }

      return {
        ...category,
        _state: categoryState,
        subcategories: enrichedSubcategories
      };
    });
  };

  // Estado para diálogos de confirmación
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null,
    type: 'warning'
  });

  // Función para procesar datos antes de enviar al backend
  const processMenuDataForBackend = (data) => {
    return data
      .filter(category => category._state !== 'deleted') // Eliminar categorías marcadas para borrar
      .map(category => {
        const cleanCategory = {
          // Si es un ID temporal (nuevo), enviar null para que el backend asigne un ID real
          id: category.id?.startsWith('temp-') ? null : category.id,
          nameKey: category.nameKey,
          orderIndex: category.orderIndex,
          createdAt: category.createdAt,
          updatedAt: category.updatedAt
        };

        // Procesar subcategorías
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

              // Procesar items
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

  // Función de validación
  const validateMenuData = (data) => {
    const errors = {};

    data.forEach(category => {
      const categoryErrors = {};

      // Validar nombre de categoría
      if (!category.nameKey || category.nameKey.trim().length < 3) {
        categoryErrors.nameKey = 'El nombre debe tener al menos 3 caracteres';
      }

      // Validar subcategorías
      if (category.subcategories) {
        const subcategoriesErrors = {};
        category.subcategories.forEach(subcategory => {
          const subcategoryErrors = {};

          // Validar nombre de subcategoría
          if (!subcategory.nameKey || subcategory.nameKey.trim().length < 3) {
            subcategoryErrors.nameKey = 'El nombre debe tener al menos 3 caracteres';
          }

          // Validar items
          if (subcategory.items) {
            const itemsErrors = {};
            subcategory.items.forEach(item => {
              const itemErrors = {};

              // Validar nombre del item
              if (!item.nameKey || item.nameKey.trim().length < 3) {
                itemErrors.nameKey = 'El nombre debe tener al menos 3 caracteres';
              }

              // Validar precio
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
          }

          if (Object.keys(subcategoryErrors).length > 0) {
            subcategoriesErrors[subcategory.id] = subcategoryErrors;
          }
        });

        if (Object.keys(subcategoriesErrors).length > 0) {
          categoryErrors.subcategories = subcategoriesErrors;
        }
      }

      if (Object.keys(categoryErrors).length > 0) {
        errors[category.id] = categoryErrors;
      }
    });

    return errors;
  };

  // Validar datos cada vez que cambian en modo edición
  useEffect(() => {
    if (isEditing && menuData.length > 0) {
      const errors = validateMenuData(menuData);
      setValidationErrors(errors);
    } else {
      setValidationErrors({});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [menuData, isEditing]);

  // Funciones de navegación
  const handleNavigateToCategories = () => {
    setCurrentLevel('categories');
    setSelectedCategory(null);
    setSelectedSubcategory(null);
  };

  const handleNavigateToSubcategories = () => {
    if (selectedCategory) {
      setCurrentLevel('subcategories');
      setSelectedSubcategory(null);
    }
  };

  const handleCategoryClick = (category) => {
    setSelectedCategory(category);
    setCurrentLevel('subcategories');
  };

  const handleSubcategoryClick = (subcategory) => {
    setSelectedSubcategory(subcategory);
    setCurrentLevel('items');
  };

  const handleBackFromSubcategories = () => {
    setCurrentLevel('categories');
    setSelectedCategory(null);
  };

  const handleBackFromItems = () => {
    setCurrentLevel('subcategories');
    setSelectedSubcategory(null);
  };

  // Obtener datos filtrados según la navegación actual
  const getCurrentCategory = () => {
    if (!selectedCategory) return null;
    return menuData.find(cat => cat.id === selectedCategory.id);
  };

  const getCurrentSubcategories = () => {
    const category = getCurrentCategory();
    return category?.subcategories || [];
  };

  const getCurrentSubcategory = () => {
    if (!selectedSubcategory) return null;
    const subcategories = getCurrentSubcategories();
    return subcategories.find(sub => sub.id === selectedSubcategory.id);
  };

  const getCurrentItems = () => {
    const subcategory = getCurrentSubcategory();
    return subcategory?.items || [];
  };

  // Contar subcategorías e items para mostrar en las vistas
  const getSubcategoryCounts = () => {
    const counts = {};
    menuData.forEach(category => {
      counts[category.id] = category.subcategories?.length || 0;
    });
    return counts;
  };

  const getItemCounts = () => {
    const counts = {};
    const subcategories = getCurrentSubcategories();
    subcategories.forEach(subcategory => {
      counts[subcategory.id] = subcategory.items?.length || 0;
    });
    return counts;
  };

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
          reload(); // Recargar datos originales desde el backend
        }
      });
    } else {
      setIsEditing(!isEditing);
    }
  };

  const handleSave = () => {
    // Validar antes de guardar
    const errors = validateMenuData(menuData);
    const hasErrors = Object.keys(errors).length > 0;

    if (hasErrors) {
      setConfirmDialog({
        isOpen: true,
        title: 'Errores de validación',
        message: 'No se puede guardar porque hay errores de validación en la carta. Por favor, corrígelos antes de continuar.',
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
          // Procesar datos para el backend
          const processedData = processMenuDataForBackend(menuData);

          // Enviar datos al backend
          await MenuService.saveMenu(processedData, selectedLanguage);

          // Recargar datos desde el backend
          await reload();

          setIsEditing(false);
          setIsSaving(false);

          // Mostrar mensaje de éxito
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

          // Mostrar mensaje de error
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
        reload(); // Recargar datos originales desde el backend
      }
    });
  };

  const handleAddCategory = () => {
    const newCategory = {
      id: `temp-category-${Date.now()}`,
      nameKey: '',
      subcategories: [],
      orderIndex: menuData.length,
      _state: 'new'
    };

    setMenuData(prevData => [...prevData, newCategory]);

    // Navegar automáticamente a la nueva categoría
    setSelectedCategory(newCategory);
    setCurrentLevel('subcategories');

    // No marcar cambios hasta que se edite el elemento nuevo
  };

  const handleUpdateCategory = (categoryId, updates) => {
    setMenuData(prevData => {
      return prevData.map(category => {
        if (category.id !== categoryId) return category;

        const isNew = category._state === 'new';

        // Si no es nuevo, registrar el cambio
        if (!isNew) {
          const hierarchicalId = buildHierarchicalId(categoryId);
          trackChange(hierarchicalId, 'edit');
        }

        return {
          ...category,
          ...updates,
          _state: isNew ? 'new' : 'edited'
        };
      });
    });
  };

  const handleDeleteCategory = (categoryId) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Eliminar categoría',
      message: '¿Estás seguro de que quieres eliminar esta categoría? Esta acción no se aplicará hasta que guardes los cambios.',
      type: 'danger',
      onConfirm: () => {
        const category = menuData.find(c => c.id === categoryId);
        const isNewCategory = category && category._state === 'new';

        setMenuData(prevData => {
          return prevData.filter(category => {
            // Si la categoría es nueva, eliminarla completamente
            if (category.id === categoryId && category._state === 'new') {
              return false;
            }
            return true;
          }).map(category => {
            // Para categorías existentes, marcarlas como eliminadas
            if (category.id !== categoryId) return category;
            return {
              ...category,
              _previousState: category._state,
              _state: 'deleted'
            };
          });
        });

        // Registrar el cambio si no era nueva
        if (!isNewCategory) {
          const hierarchicalId = buildHierarchicalId(categoryId);
          trackChange(hierarchicalId, 'delete');
        }

        setConfirmDialog({ ...confirmDialog, isOpen: false });
      }
    });
  };

  const handleUndoDeleteCategory = (categoryId) => {
    setMenuData(prevData => {
      return prevData.map(category => {
        if (category.id !== categoryId) return category;
        const previousState = category._previousState || 'normal';
        const updatedCategory = {
          ...category,
          _state: previousState
        };
        delete updatedCategory._previousState;
        return updatedCategory;
      });
    });

    // Quitar el cambio del tracking
    const hierarchicalId = buildHierarchicalId(categoryId);
    untrackChange(hierarchicalId);
  };

  const handleMoveCategoryUp = (categoryId) => {
    setMenuData(prevData => {
      const index = prevData.findIndex(cat => cat.id === categoryId);
      if (index <= 0) return prevData; // Ya está en la primera posición

      const newData = [...prevData];
      // Intercambiar con el elemento anterior
      [newData[index - 1], newData[index]] = [newData[index], newData[index - 1]];

      // Actualizar orderIndex y marcar solo los elementos movidos como editados
      return newData.map((item, idx) => {
        const wasMoved = idx === index - 1 || idx === index;
        return {
          ...item,
          orderIndex: idx,
          _state: wasMoved && item._state !== 'new' ? 'edited' : item._state
        };
      });
    });
  };

  const handleMoveCategoryDown = (categoryId) => {
    setMenuData(prevData => {
      const index = prevData.findIndex(cat => cat.id === categoryId);
      if (index < 0 || index >= prevData.length - 1) return prevData; // Ya está en la última posición

      const newData = [...prevData];
      // Intercambiar con el elemento siguiente
      [newData[index], newData[index + 1]] = [newData[index + 1], newData[index]];

      // Actualizar orderIndex y marcar solo los elementos movidos como editados
      return newData.map((item, idx) => {
        const wasMoved = idx === index || idx === index + 1;
        return {
          ...item,
          orderIndex: idx,
          _state: wasMoved && item._state !== 'new' ? 'edited' : item._state
        };
      });
    });
  };

  // Handlers para subcategorías
  const handleAddSubcategory = (categoryId) => {
    const newSubcategoryId = `temp-subcategory-${Date.now()}`;
    let newSubcategory = null;

    setMenuData(prevData => {
      return prevData.map(category => {
        if (category.id !== categoryId) return category;

        newSubcategory = {
          id: newSubcategoryId,
          nameKey: '',
          items: [],
          orderIndex: (category.subcategories || []).length,
          _state: 'new'
        };

        // Registrar el cambio con ID jerárquico
        const hierarchicalId = buildHierarchicalId(category.id, newSubcategoryId);
        trackChange(hierarchicalId, 'create');

        const updatedSubcategories = [...(category.subcategories || []), newSubcategory];

        return {
          ...category,
          subcategories: updatedSubcategories
        };
      });
    });

    // Navegar automáticamente a la nueva subcategoría
    if (newSubcategory) {
      setSelectedSubcategory(newSubcategory);
      setCurrentLevel('items');
    }

    // No marcar cambios al añadir una subcategoría temporal
  };

  const handleUpdateSubcategory = (subcategoryId, updates) => {
    setMenuData(prevData => {
      return prevData.map(category => {
        let subcategoryFound = false;
        let isSubcategoryNew = false;
        let hasContentNow = false;

        const updatedSubcategories = (category.subcategories || []).map(subcategory => {
          if (subcategory.id !== subcategoryId) return subcategory;

          subcategoryFound = true;
          isSubcategoryNew = subcategory._state === 'new';
          const updatedSubcategory = {
            ...subcategory,
            ...updates,
            _state: isSubcategoryNew ? 'new' : 'edited'
          };

          // Verificar si tiene contenido significativo ahora
          hasContentNow = updatedSubcategory.nameKey && updatedSubcategory.nameKey.trim().length > 0;

          return updatedSubcategory;
        });

        if (!subcategoryFound) return category;

        // Registrar cambios en el tracking con ID jerárquico
        const hierarchicalId = buildHierarchicalId(category.id, subcategoryId);
        if (!isSubcategoryNew) {
          // Subcategoría existente fue editada
          trackChange(hierarchicalId, 'edit');
        } else if (hasContentNow) {
          // Nueva subcategoría con contenido - registrar como creación
          trackChange(hierarchicalId, 'create');
        }

        return {
          ...category,
          subcategories: updatedSubcategories,
          _state: category._state
        };
      });
    });
  };

  const handleDeleteSubcategory = (categoryId, subcategoryId) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Eliminar subcategoría',
      message: '¿Estás seguro de que quieres eliminar esta subcategoría?',
      type: 'danger',
      onConfirm: () => {
        const category = menuData.find(c => c.id === categoryId);
        const subcategory = category?.subcategories?.find(s => s.id === subcategoryId);
        const isNewSubcategory = subcategory?._state === 'new';

        setMenuData(prevData => {
          return prevData.map(category => {
            if (category.id !== categoryId) return category;

            const updatedSubcategories = (category.subcategories || []).filter(subcategory => {
              // Si la subcategoría es nueva, eliminarla completamente
              if (subcategory.id === subcategoryId && subcategory._state === 'new') {
                return false;
              }
              return true;
            }).map(subcategory => {
              // Para subcategorías existentes, marcarlas como eliminadas
              if (subcategory.id !== subcategoryId) return subcategory;
              return {
                ...subcategory,
                _previousState: subcategory._state,
                _state: 'deleted'
              };
            });

            return {
              ...category,
              subcategories: updatedSubcategories
            };
          });
        });

        // Registrar el cambio con ID jerárquico
        const hierarchicalId = buildHierarchicalId(categoryId, subcategoryId);
        if (!isNewSubcategory) {
          trackChange(hierarchicalId, 'delete');
        } else {
          // Si era nueva y la borramos, quitar su tracking de 'create' si existe
          untrackChange(hierarchicalId);
        }

        setConfirmDialog({ ...confirmDialog, isOpen: false });
      }
    });
  };

  const handleUndoDeleteSubcategory = (subcategoryId) => {
    let categoryId = null;

    // Encontrar el categoryId
    menuData.forEach(category => {
      if ((category.subcategories || []).some(sub => sub.id === subcategoryId)) {
        categoryId = category.id;
      }
    });

    setMenuData(prevData => {
      return prevData.map(category => {
        const updatedSubcategories = (category.subcategories || []).map(subcategory => {
          if (subcategory.id !== subcategoryId) return subcategory;
          const previousState = subcategory._previousState || 'normal';
          const updatedSubcategory = {
            ...subcategory,
            _state: previousState
          };
          delete updatedSubcategory._previousState;
          return updatedSubcategory;
        });

        return {
          ...category,
          subcategories: updatedSubcategories
        };
      });
    });

    // Quitar el cambio del tracking con ID jerárquico
    if (categoryId) {
      const hierarchicalId = buildHierarchicalId(categoryId, subcategoryId);
      untrackChange(hierarchicalId);
    }
  };

  const handleMoveSubcategoryUp = (categoryId, subcategoryId) => {
    setMenuData(prevData => {
      return prevData.map(category => {
        if (category.id !== categoryId) return category;

        const subcategories = category.subcategories || [];
        const index = subcategories.findIndex(sub => sub.id === subcategoryId);
        if (index <= 0) return category; // Ya está en la primera posición

        const newSubcategories = [...subcategories];
        // Intercambiar con el elemento anterior
        [newSubcategories[index - 1], newSubcategories[index]] = [newSubcategories[index], newSubcategories[index - 1]];

        // Actualizar orderIndex y marcar solo los elementos movidos como editados
        return {
          ...category,
          subcategories: newSubcategories.map((item, idx) => {
            const wasMoved = idx === index - 1 || idx === index;
            return {
              ...item,
              orderIndex: idx,
              _state: wasMoved && item._state !== 'new' ? 'edited' : item._state
            };
          })
        };
      });
    });
  };

  const handleMoveSubcategoryDown = (categoryId, subcategoryId) => {
    setMenuData(prevData => {
      return prevData.map(category => {
        if (category.id !== categoryId) return category;

        const subcategories = category.subcategories || [];
        const index = subcategories.findIndex(sub => sub.id === subcategoryId);
        if (index < 0 || index >= subcategories.length - 1) return category; // Ya está en la última posición

        const newSubcategories = [...subcategories];
        // Intercambiar con el elemento siguiente
        [newSubcategories[index], newSubcategories[index + 1]] = [newSubcategories[index + 1], newSubcategories[index]];

        // Actualizar orderIndex y marcar solo los elementos movidos como editados
        return {
          ...category,
          subcategories: newSubcategories.map((item, idx) => {
            const wasMoved = idx === index || idx === index + 1;
            return {
              ...item,
              orderIndex: idx,
              _state: wasMoved && item._state !== 'new' ? 'edited' : item._state
            };
          })
        };
      });
    });
  };

  // Handlers para items
  const handleAddItem = (subcategoryId) => {
    const newItemId = `temp-item-${Date.now()}`;

    setMenuData(prevData => {
      return prevData.map(category => {
        const updatedSubcategories = (category.subcategories || []).map(subcategory => {
          if (subcategory.id !== subcategoryId) return subcategory;

          const newItem = {
            id: newItemId,
            nameKey: '',
            descriptionKey: '',
            price: '',
            available: true,
            orderIndex: (subcategory.items || []).length,
            _state: 'new'
          };

          const updatedItems = [...(subcategory.items || []), newItem];

          return {
            ...subcategory,
            items: updatedItems
          };
        });

        // Registrar el cambio con ID jerárquico
        const hierarchicalId = buildHierarchicalId(category.id, subcategoryId, newItemId);
        trackChange(hierarchicalId, 'create');

        console.log('track create: ' + hierarchicalId);

        const hasChanges = updatedSubcategories.some((sub, idx) =>
          sub !== (category.subcategories || [])[idx]
        );

        return hasChanges ? {
          ...category,
          subcategories: updatedSubcategories
        } : category;
      });
    });
  };

  const handleUpdateItem = (itemId, updates) => {
    setMenuData(prevData => {
      return prevData.map(category => {
        let itemFound = false;
        let isItemNew = false;
        let hasContentNow = false;
        let foundSubcategoryId = null;

        const updatedSubcategories = (category.subcategories || []).map(subcategory => {
          const updatedItems = (subcategory.items || []).map(item => {
            if (item.id !== itemId) return item;

            itemFound = true;
            foundSubcategoryId = subcategory.id;
            isItemNew = item._state === 'new';
            const updatedItem = {
              ...item,
              ...updates,
              _state: isItemNew ? 'new' : 'edited'
            };

            // Verificar si tiene contenido significativo ahora
            hasContentNow = (
              (updatedItem.nameKey && updatedItem.nameKey.trim().length > 0) ||
              (updatedItem.price !== undefined && updatedItem.price !== null && updatedItem.price !== '')
            );

            return updatedItem;
          });

          return {
            ...subcategory,
            items: updatedItems
          };
        });

        if (!itemFound) return category;

        // Registrar cambios en el tracking con ID jerárquico
        const hierarchicalId = buildHierarchicalId(category.id, foundSubcategoryId, itemId);
        if (!isItemNew) {
          // Item existente fue editado
          trackChange(hierarchicalId, 'edit');
        } else if (hasContentNow) {
          // Nuevo item con contenido - registrar como creación
          trackChange(hierarchicalId, 'create');
        }

        return {
          ...category,
          subcategories: updatedSubcategories
        };
      });
    });
  };

  const handleDeleteItem = (subcategoryId, itemId) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Eliminar item',
      message: '¿Estás seguro de que quieres eliminar este item?',
      type: 'danger',
      onConfirm: () => {
        let isNewItem = false;
        let categoryId = null;

        // Encontrar el item para ver si es nuevo y el categoryId
        menuData.forEach(category => {
          (category.subcategories || []).forEach(subcategory => {
            if (subcategory.id === subcategoryId) {
              categoryId = category.id;
              const item = (subcategory.items || []).find(i => i.id === itemId);
              if (item && item._state === 'new') {
                isNewItem = true;
              }
            }
          });
        });

        setMenuData(prevData => {
          return prevData.map(category => {
            const updatedSubcategories = (category.subcategories || []).map(subcategory => {
              if (subcategory.id !== subcategoryId) return subcategory;

              const updatedItems = (subcategory.items || []).filter(item => {
                // Si el item es nuevo, eliminarlo completamente
                if (item.id === itemId && item._state === 'new') {
                  return false;
                }
                return true;
              }).map(item => {
                // Para items existentes, marcarlos como eliminados
                if (item.id !== itemId) return item;
                return {
                  ...item,
                  _previousState: item._state,
                  _state: 'deleted'
                };
              });

              return {
                ...subcategory,
                items: updatedItems
              };
            });

            return {
              ...category,
              subcategories: updatedSubcategories
            };
          });
        });

        // Registrar el cambio con ID jerárquico
        if (categoryId) {
          const hierarchicalId = buildHierarchicalId(categoryId, subcategoryId, itemId);
          if (!isNewItem) {
            trackChange(hierarchicalId, 'delete');
          } else {
            // Si era nuevo y lo borramos, quitar su tracking de 'create' si existe
            untrackChange(hierarchicalId);
          }
        }

        setConfirmDialog({ ...confirmDialog, isOpen: false });
      }
    });
  };

  const handleUndoDeleteItem = (itemId) => {
    let categoryId = null;
    let subcategoryId = null;

    // Encontrar el categoryId y subcategoryId
    menuData.forEach(category => {
      (category.subcategories || []).forEach(subcategory => {
        if ((subcategory.items || []).some(item => item.id === itemId)) {
          categoryId = category.id;
          subcategoryId = subcategory.id;
        }
      });
    });

    setMenuData(prevData => {
      return prevData.map(category => {
        const updatedSubcategories = (category.subcategories || []).map(subcategory => {
          const updatedItems = (subcategory.items || []).map(item => {
            if (item.id !== itemId) return item;
            const previousState = item._previousState || 'normal';
            const updatedItem = {
              ...item,
              _state: previousState
            };
            delete updatedItem._previousState;
            return updatedItem;
          });

          return {
            ...subcategory,
            items: updatedItems
          };
        });

        return {
          ...category,
          subcategories: updatedSubcategories
        };
      });
    });

    // Quitar el cambio del tracking con ID jerárquico
    if (categoryId && subcategoryId) {
      const hierarchicalId = buildHierarchicalId(categoryId, subcategoryId, itemId);
      untrackChange(hierarchicalId);
    }
  };

  const handleMoveItemUp = (subcategoryId, itemId) => {
    setMenuData(prevData => {
      return prevData.map(category => {
        const updatedSubcategories = (category.subcategories || []).map(subcategory => {
          if (subcategory.id !== subcategoryId) return subcategory;

          const items = subcategory.items || [];
          const index = items.findIndex(item => item.id === itemId);
          if (index <= 0) return subcategory; // Ya está en la primera posición

          const newItems = [...items];
          // Intercambiar con el elemento anterior
          [newItems[index - 1], newItems[index]] = [newItems[index], newItems[index - 1]];

          // Actualizar orderIndex y marcar solo los elementos movidos como editados
          return {
            ...subcategory,
            items: newItems.map((item, idx) => {
              const wasMoved = idx === index - 1 || idx === index;
              return {
                ...item,
                orderIndex: idx,
                _state: wasMoved && item._state !== 'new' ? 'edited' : item._state
              };
            })
          };
        });

        // Solo actualizar si hubo cambios
        const hasChanges = updatedSubcategories.some((sub, idx) =>
          sub !== (category.subcategories || [])[idx]
        );

        return hasChanges ? {
          ...category,
          subcategories: updatedSubcategories
        } : category;
      });
    });
  };

  const handleMoveItemDown = (subcategoryId, itemId) => {
    setMenuData(prevData => {
      return prevData.map(category => {
        const updatedSubcategories = (category.subcategories || []).map(subcategory => {
          if (subcategory.id !== subcategoryId) return subcategory;

          const items = subcategory.items || [];
          const index = items.findIndex(item => item.id === itemId);
          if (index < 0 || index >= items.length - 1) return subcategory; // Ya está en la última posición

          const newItems = [...items];
          // Intercambiar con el elemento siguiente
          [newItems[index], newItems[index + 1]] = [newItems[index + 1], newItems[index]];

          // Actualizar orderIndex y marcar solo los elementos movidos como editados
          return {
            ...subcategory,
            items: newItems.map((item, idx) => {
              const wasMoved = idx === index || idx === index + 1;
              return {
                ...item,
                orderIndex: idx,
                _state: wasMoved && item._state !== 'new' ? 'edited' : item._state
              };
            })
          };
        });

        // Solo actualizar si hubo cambios
        const hasChanges = updatedSubcategories.some((sub, idx) =>
          sub !== (category.subcategories || [])[idx]
        );

        return hasChanges ? {
          ...category,
          subcategories: updatedSubcategories
        } : category;
      });
    });
  };


  // Mostrar loading
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

  // Mostrar error
  if (error && !menuData.length) {
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

          {/* Breadcrumbs de navegación */}
          <Breadcrumbs
            currentLevel={currentLevel}
            categoryName={selectedCategory?.nameKey}
            subcategoryName={selectedSubcategory?.nameKey}
            onNavigateToCategories={handleNavigateToCategories}
            onNavigateToSubcategories={handleNavigateToSubcategories}
          />

          {/* Vista según nivel actual */}
          <div className={styles.viewContainer}>
            {currentLevel === 'categories' && (
              <CategoryView
                categories={enrichMenuDataWithVisualState(menuData)}
                onCategoryClick={handleCategoryClick}
                onAddCategory={isEditing ? handleAddCategory : undefined}
                onDeleteCategory={isEditing ? handleDeleteCategory : undefined}
                onUndoDeleteCategory={isEditing ? handleUndoDeleteCategory : undefined}
                subcategoryCounts={getSubcategoryCounts()}
                isEditing={isEditing}
              />
            )}

            {currentLevel === 'subcategories' && selectedCategory && (
              <SubcategoryView
                subcategories={enrichMenuDataWithVisualState(menuData).find(c => c.id === selectedCategory.id)?.subcategories || []}
                categoryName={selectedCategory.nameKey || 'Sin nombre'}
                category={enrichMenuDataWithVisualState(menuData).find(c => c.id === selectedCategory.id)}
                onSubcategoryClick={handleSubcategoryClick}
                onAddSubcategory={isEditing ? () => handleAddSubcategory(selectedCategory.id) : undefined}
                onDeleteSubcategory={isEditing ? (subId) => handleDeleteSubcategory(selectedCategory.id, subId) : undefined}
                onUndoDeleteSubcategory={isEditing ? handleUndoDeleteSubcategory : undefined}
                onUpdateCategory={isEditing ? handleUpdateCategory : undefined}
                onBack={handleBackFromSubcategories}
                itemCounts={getItemCounts()}
                isEditing={isEditing}
                categoryError={validationErrors[selectedCategory.id]?.nameKey}
              />
            )}

            {currentLevel === 'items' && selectedSubcategory && (
              <ItemView
                items={enrichMenuDataWithVisualState(menuData)
                  .flatMap(c => c.subcategories || [])
                  .find(s => s.id === selectedSubcategory.id)?.items || []}
                subcategoryName={selectedSubcategory.nameKey || 'Sin nombre'}
                subcategory={enrichMenuDataWithVisualState(menuData)
                  .flatMap(c => c.subcategories || [])
                  .find(s => s.id === selectedSubcategory.id)}
                onAddItem={isEditing ? () => handleAddItem(selectedSubcategory.id) : undefined}
                onUpdateItem={isEditing ? handleUpdateItem : undefined}
                onUpdateSubcategory={isEditing ? handleUpdateSubcategory : undefined}
                onDeleteItem={isEditing ? (itemId) => handleDeleteItem(selectedSubcategory.id, itemId) : undefined}
                onUndoDeleteItem={isEditing ? handleUndoDeleteItem : undefined}
                onBack={handleBackFromItems}
                isEditing={isEditing}
                errors={validationErrors}
                subcategoryError={validationErrors[getCurrentCategory()?.id]?.subcategories?.[selectedSubcategory.id]?.nameKey}
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
