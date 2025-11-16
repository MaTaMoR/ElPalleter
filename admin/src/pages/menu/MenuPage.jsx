import React, { useState, useEffect } from 'react';
import { Plus, Edit3, Eye, Save, X } from 'lucide-react';
import LanguageSelector from '../../components/menu/utils/LanguageSelector';
import CategoryAccordion from '../../components/menu/items/CategoryAccordion';
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
  const [hasChanges, setHasChanges] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  // Cargar datos del backend
  const { data: backendData, loading, error, reload } = useMenuData(selectedLanguage);
  const [menuData, setMenuData] = useState([]);

  // Sincronizar datos del backend con el estado local
  useEffect(() => {
    if (backendData && backendData.length > 0) {
      setMenuData(backendData);
    } else if (!loading && !error) {
      // Si no hay datos del backend, usar mock
      setMenuData(MOCK_MENU_DATA);
    }
  }, [backendData, loading, error]);

  // Estado para controlar qué acordeones están expandidos
  const [expandedCategories, setExpandedCategories] = useState({});
  const [expandedSubcategories, setExpandedSubcategories] = useState({});
  const [expandedItems, setExpandedItems] = useState({});

  // Expandir solo la primera categoría en modo visualización (solo al iniciar)
  useEffect(() => {
    if (!isEditing && menuData.length > 0 && Object.keys(expandedCategories).length === 0) {
      const firstCategory = menuData[0];
      const expandedCats = {};
      const expandedSubs = {};
      const expandedItms = {};

      // Expandir solo la primera categoría
      expandedCats[firstCategory.id] = true;

      // Expandir todas sus subcategorías e items
      if (firstCategory.subcategories) {
        firstCategory.subcategories.forEach(subcategory => {
          expandedSubs[subcategory.id] = true;

          if (subcategory.items) {
            subcategory.items.forEach(item => {
              expandedItms[item.id] = true;
            });
          }
        });
      }

      setExpandedCategories(expandedCats);
      setExpandedSubcategories(expandedSubs);
      setExpandedItems(expandedItms);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [menuData]);

  // Cerrar subcategorías e items al entrar en modo edición
  useEffect(() => {
    if (isEditing) {
      setExpandedSubcategories({});
      setExpandedItems({});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditing]);

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

  const handleToggleCategory = (categoryId) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }));
  };

  const handleToggleSubcategory = (subcategoryId) => {
    setExpandedSubcategories(prev => ({
      ...prev,
      [subcategoryId]: !prev[subcategoryId]
    }));
  };

  const handleToggleItem = (itemId) => {
    setExpandedItems(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  };

  const handleLanguageChange = (language) => {
    if (hasChanges) {
      setConfirmDialog({
        isOpen: true,
        title: 'Cambios sin guardar',
        message: '¿Estás seguro de que quieres cambiar el idioma? Se perderán todos los cambios no guardados.',
        type: 'warning',
        onConfirm: () => {
          setSelectedLanguage(language);
          setHasChanges(false);
          setConfirmDialog({ ...confirmDialog, isOpen: false });
        }
      });
    } else {
      setSelectedLanguage(language);
    }
  };

  const handleToggleEditMode = () => {
    if (isEditing && hasChanges) {
      setConfirmDialog({
        isOpen: true,
        title: 'Salir del modo edición',
        message: 'Tienes cambios sin guardar. ¿Estás seguro de que quieres salir del modo edición?',
        type: 'warning',
        onConfirm: () => {
          setIsEditing(false);
          setHasChanges(false);
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

          setHasChanges(false);
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
        setHasChanges(false);
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

    // Expandir automáticamente la nueva categoría
    setExpandedCategories(prev => ({
      ...prev,
      [newCategory.id]: true
    }));

    // Hacer scroll al nuevo elemento
    setTimeout(() => {
      const element = document.querySelector(`[data-accordion-id="${newCategory.id}"]`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);

    setHasChanges(true);
  };

  const handleUpdateCategory = (categoryId, updates) => {
    setMenuData(prevData => {
      return prevData.map(category => {
        if (category.id !== categoryId) return category;
        return {
          ...category,
          ...updates,
          _state: category._state === 'new' ? 'new' : 'edited'
        };
      });
    });
    setHasChanges(true);
  };

  const handleDeleteCategory = (categoryId) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Eliminar categoría',
      message: '¿Estás seguro de que quieres eliminar esta categoría? Esta acción no se aplicará hasta que guardes los cambios.',
      type: 'danger',
      onConfirm: () => {
        setMenuData(prevData => {
          return prevData.map(category => {
            if (category.id !== categoryId) return category;
            return {
              ...category,
              _previousState: category._state, // Guardar estado anterior
              _state: 'deleted'
            };
          });
        });
        // Cerrar el acordeón al marcar como eliminado
        setExpandedCategories(prev => ({
          ...prev,
          [categoryId]: false
        }));
        setHasChanges(true);
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
    setHasChanges(true);
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
    setHasChanges(true);
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
    setHasChanges(true);
  };

  // Handlers para subcategorías
  const handleAddSubcategory = (categoryId) => {
    const newSubcategoryId = `temp-subcategory-${Date.now()}`;

    setMenuData(prevData => {
      return prevData.map(category => {
        if (category.id !== categoryId) return category;

        const newSubcategory = {
          id: newSubcategoryId,
          nameKey: '',
          items: [],
          orderIndex: (category.subcategories || []).length,
          _state: 'new'
        };

        const updatedSubcategories = [...(category.subcategories || []), newSubcategory];

        // Expandir automáticamente la nueva subcategoría
        setExpandedSubcategories(prev => ({
          ...prev,
          [newSubcategory.id]: true
        }));

        return {
          ...category,
          subcategories: updatedSubcategories,
          _state: category._state === 'new' ? 'new' : 'edited'
        };
      });
    });

    // Hacer scroll al nuevo elemento
    setTimeout(() => {
      const element = document.querySelector(`[data-accordion-id="${newSubcategoryId}"]`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);

    setHasChanges(true);
  };

  const handleUpdateSubcategory = (subcategoryId, updates) => {
    setMenuData(prevData => {
      return prevData.map(category => {
        const updatedSubcategories = (category.subcategories || []).map(subcategory => {
          if (subcategory.id !== subcategoryId) return subcategory;
          return {
            ...subcategory,
            ...updates,
            _state: subcategory._state === 'new' ? 'new' : 'edited'
          };
        });

        // Solo marcar la categoría como editada si alguna subcategoría cambió
        const hasChanges = updatedSubcategories.some((sub, idx) =>
          sub !== (category.subcategories || [])[idx]
        );

        return hasChanges ? {
          ...category,
          subcategories: updatedSubcategories,
          _state: category._state === 'new' ? 'new' : 'edited'
        } : category;
      });
    });
    setHasChanges(true);
  };

  const handleDeleteSubcategory = (categoryId, subcategoryId) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Eliminar subcategoría',
      message: '¿Estás seguro de que quieres eliminar esta subcategoría?',
      type: 'danger',
      onConfirm: () => {
        setMenuData(prevData => {
          return prevData.map(category => {
            if (category.id !== categoryId) return category;

            const updatedSubcategories = (category.subcategories || []).map(subcategory => {
              if (subcategory.id !== subcategoryId) return subcategory;
              return {
                ...subcategory,
                _previousState: subcategory._state, // Guardar estado anterior
                _state: 'deleted'
              };
            });

            return {
              ...category,
              subcategories: updatedSubcategories
            };
          });
        });
        // Cerrar el acordeón al marcar como eliminado
        setExpandedSubcategories(prev => ({
          ...prev,
          [subcategoryId]: false
        }));
        setHasChanges(true);
        setConfirmDialog({ ...confirmDialog, isOpen: false });
      }
    });
  };

  const handleUndoDeleteSubcategory = (subcategoryId) => {
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
    setHasChanges(true);
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
    setHasChanges(true);
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
    setHasChanges(true);
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

          // Expandir automáticamente el nuevo item
          setExpandedItems(prev => ({
            ...prev,
            [newItem.id]: true
          }));

          return {
            ...subcategory,
            items: updatedItems,
            _state: subcategory._state === 'new' ? 'new' : 'edited'
          };
        });

        const hasChanges = updatedSubcategories.some((sub, idx) =>
          sub !== (category.subcategories || [])[idx]
        );

        return hasChanges ? {
          ...category,
          subcategories: updatedSubcategories,
          _state: category._state === 'new' ? 'new' : 'edited'
        } : category;
      });
    });

    // Hacer scroll al nuevo elemento
    setTimeout(() => {
      const element = document.querySelector(`[data-accordion-id="${newItemId}"]`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);

    setHasChanges(true);
  };

  const handleUpdateItem = (itemId, updates) => {
    setMenuData(prevData => {
      return prevData.map(category => {
        const updatedSubcategories = (category.subcategories || []).map(subcategory => {
          const updatedItems = (subcategory.items || []).map(item => {
            if (item.id !== itemId) return item;
            return {
              ...item,
              ...updates,
              _state: item._state === 'new' ? 'new' : 'edited'
            };
          });

          // Solo marcar la subcategoría como editada si algún item cambió
          const hasChanges = updatedItems.some((itm, idx) =>
            itm !== (subcategory.items || [])[idx]
          );

          return hasChanges ? {
            ...subcategory,
            items: updatedItems,
            _state: subcategory._state === 'new' ? 'new' : 'edited'
          } : subcategory;
        });

        // Solo marcar la categoría como editada si alguna subcategoría cambió
        const hasChanges = updatedSubcategories.some((sub, idx) =>
          sub !== (category.subcategories || [])[idx]
        );

        return hasChanges ? {
          ...category,
          subcategories: updatedSubcategories,
          _state: category._state === 'new' ? 'new' : 'edited'
        } : category;
      });
    });
    setHasChanges(true);
  };

  const handleDeleteItem = (subcategoryId, itemId) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Eliminar plato',
      message: '¿Estás seguro de que quieres eliminar este plato?',
      type: 'danger',
      onConfirm: () => {
        setMenuData(prevData => {
          return prevData.map(category => {
            const updatedSubcategories = (category.subcategories || []).map(subcategory => {
              if (subcategory.id !== subcategoryId) return subcategory;

              const updatedItems = (subcategory.items || []).map(item => {
                if (item.id !== itemId) return item;
                return {
                  ...item,
                  _previousState: item._state, // Guardar estado anterior
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
        // Cerrar el acordeón al marcar como eliminado
        setExpandedItems(prev => ({
          ...prev,
          [itemId]: false
        }));
        setHasChanges(true);
        setConfirmDialog({ ...confirmDialog, isOpen: false });
      }
    });
  };

  const handleUndoDeleteItem = (itemId) => {
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
    setHasChanges(true);
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
    setHasChanges(true);
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
    setHasChanges(true);
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
                  <span className={hasChanges ? styles.changesBadge : styles.editingBadge}>
                    {hasChanges ? 'Cambios sin guardar' : 'Modo Edición'}
                  </span>
                </div>
                <div className={styles.editingActions}>
                  <button
                    type="button"
                    className={styles.cancelButton}
                    onClick={handleCancel}
                    disabled={!hasChanges || isSaving}
                  >
                    <X size={18} strokeWidth={2.5} />
                    <span>Cancelar</span>
                  </button>
                  <button
                    type="button"
                    className={styles.saveButton}
                    onClick={handleSave}
                    disabled={!hasChanges || isSaving}
                  >
                    <Save size={18} />
                    <span>{isSaving ? 'Guardando...' : 'Guardar'}</span>
                  </button>
                  <button
                    type="button"
                    className={styles.addCategoryButton}
                    onClick={handleAddCategory}
                    disabled={isSaving}
                  >
                    <Plus size={20} />
                    <span>Añadir Categoría</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className={styles.categoriesList}>
          {menuData.length > 0 ? (
            <>
              {menuData.map((category, index) => (
                <CategoryAccordion
                  key={category.id}
                  category={category}
                  isExpanded={expandedCategories[category.id]}
                  onToggle={() => handleToggleCategory(category.id)}
                  onUpdate={handleUpdateCategory}
                  onDelete={() => handleDeleteCategory(category.id)}
                  onUndoDelete={() => handleUndoDeleteCategory(category.id)}
                  onMoveUp={() => handleMoveCategoryUp(category.id)}
                  onMoveDown={() => handleMoveCategoryDown(category.id)}
                  canMoveUp={index > 0}
                  canMoveDown={index < menuData.length - 1}
                  onAddSubcategory={handleAddSubcategory}
                  onUpdateSubcategory={handleUpdateSubcategory}
                  onDeleteSubcategory={handleDeleteSubcategory}
                  onUndoDeleteSubcategory={handleUndoDeleteSubcategory}
                  onMoveSubcategoryUp={handleMoveSubcategoryUp}
                  onMoveSubcategoryDown={handleMoveSubcategoryDown}
                  onAddItem={handleAddItem}
                  onUpdateItem={handleUpdateItem}
                  onDeleteItem={handleDeleteItem}
                  onUndoDeleteItem={handleUndoDeleteItem}
                  onMoveItemUp={handleMoveItemUp}
                  onMoveItemDown={handleMoveItemDown}
                  expandedSubcategories={expandedSubcategories}
                  expandedItems={expandedItems}
                  onToggleSubcategory={handleToggleSubcategory}
                  onToggleItem={handleToggleItem}
                  isEditing={isEditing}
                  errors={validationErrors[category.id] || {}}
                />
              ))}
            </>
          ) : (
            <div className={styles.emptyState}>
              <p>No hay categorías en la carta</p>
              {isEditing && (
                <button
                  type="button"
                  className={styles.emptyAddButton}
                  onClick={handleAddCategory}
                >
                  <Plus size={24} />
                  <span>Añadir primera categoría</span>
                </button>
              )}
            </div>
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
