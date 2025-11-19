import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useMenuState } from '../hooks/useMenuState';
import { useMenuNavigation } from '../hooks/useMenuNavigation';
import { useMenuValidation } from '../hooks/useMenuValidation';
import { useEntityOperations } from '../hooks/useEntityOperations';
import { useNavigationBlocker } from '../hooks/useNavigationBlocker';
import { unflattenMenuData, processMenuDataForBackend, buildHierarchicalId } from '../utils/menuDataUtils';
import { CartaService } from '@services/CartaService';
import ToastContainer from '../components/common/ToastContainer';

const MenuEditContext = createContext(null);

/**
 * Hook to access the menu edit context
 */
export const useMenuEdit = () => {
  const context = useContext(MenuEditContext);
  if (!context) {
    throw new Error('useMenuEdit must be used within MenuEditProvider');
  }
  return context;
};

/**
 * Provider that manages all menu editing state and operations
 */
export const MenuEditProvider = ({
  children,
  backendData,
  loading,
  error,
  reload,
  selectedLanguage,
  onLanguageChange
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Toast notifications state
  const [toasts, setToasts] = useState([]);

  // Confirm dialog state (for warnings/errors that need user decision)
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null,
    type: 'warning'
  });

  // Menu state management (Maps, change tracking)
  const menuState = useMenuState(backendData, loading, error);

  // Navigation management (now URL-based)
  const navigation = useMenuNavigation(menuState);

  // Validation
  const { validationErrors, validateMenuData, hasErrors } = useMenuValidation(
    menuState.categoriesMap,
    menuState.subcategoriesMap,
    menuState.itemsMap,
    menuState.childrenMap,
    isEditing
  );

  // Entity operations (unified CRUD)
  const getNavigation = () => navigation;
  const entityOps = useEntityOperations(menuState, getNavigation, setConfirmDialog);

  // ============================================================================
  // NAVIGATION BLOCKER
  // ============================================================================

  // Helper to get errors for current route
  const getCurrentRouteErrors = useCallback((pathname) => {
    // Parse the current route to extract IDs
    // Routes can be:
    // /admin/menu/categories -> no specific entity
    // /admin/menu/categories/:categoryId -> category
    // /admin/menu/categories/:categoryId/:subcategoryId -> subcategory (and its items)

    const match = pathname.match(/\/admin\/menu\/categories(?:\/([^/]+))?(?:\/([^/]+))?/);
    if (!match) return null;

    const [, categoryId, subcategoryId] = match;

    // If no categoryId, we're at the root - no validation needed
    if (!categoryId) return null;

    const categoryErrors = validationErrors[categoryId];
    if (!categoryErrors) return null;

    // If we're viewing a subcategory/items view
    if (subcategoryId) {
      const subcategoryErrors = categoryErrors.subcategories?.[subcategoryId];
      if (subcategoryErrors) {
        return {
          type: 'subcategory',
          categoryId,
          subcategoryId,
          errors: subcategoryErrors
        };
      }
    }

    // If we're viewing a category (subcategories list)
    if (categoryErrors.nameKey || categoryErrors.subcategories) {
      return {
        type: 'category',
        categoryId,
        errors: categoryErrors
      };
    }

    return null;
  }, [validationErrors]);

  // Helper to revert invalid changes in current route
  const revertInvalidChanges = useCallback((routeInfo) => {
    if (!routeInfo) return;

    const { type, categoryId, subcategoryId } = routeInfo;

    // Helper to revert an entity to its original state or delete if new
    const revertEntity = (entityType, entityId, parentId = null, grandParentId = null) => {
      let hierarchicalId;
      let map, setter, originalMap;

      if (entityType === 'category') {
        hierarchicalId = buildHierarchicalId(entityId);
        map = menuState.categoriesMap;
        setter = menuState.setCategoriesMap;
        originalMap = menuState.originalCategoriesMap;
      } else if (entityType === 'subcategory') {
        hierarchicalId = buildHierarchicalId(parentId, entityId);
        map = menuState.subcategoriesMap;
        setter = menuState.setSubcategoriesMap;
        originalMap = menuState.originalSubcategoriesMap;
      } else if (entityType === 'item') {
        hierarchicalId = buildHierarchicalId(grandParentId, parentId, entityId);
        map = menuState.itemsMap;
        setter = menuState.setItemsMap;
        originalMap = menuState.originalItemsMap;
      }

      const entity = map.get(hierarchicalId);
      if (!entity) return;

      // If it's new, check if it has children before deleting
      if (entity._state === 'new') {
        // Check if this entity has children
        const hasChildren = (menuState.childrenMap.get(hierarchicalId) || []).length > 0;

        // For categories and subcategories with children, preserve them by resetting nameKey
        if (hasChildren && (entityType === 'category' || entityType === 'subcategory')) {
          // Reset the invalid nameKey to empty string
          // This keeps the entity and its children, but validation will fail (empty < 3 chars)
          setter(prev => {
            const newMap = new Map(prev);
            newMap.set(hierarchicalId, {
              ...entity,
              nameKey: '', // Empty string will fail validation
              _state: 'new' // Keep as new
            });
            return newMap;
          });
          // Note: We don't untrack the change, it should still be tracked
        } else {
          // No children (or is an item), delete it completely
          setter(prev => {
            const newMap = new Map(prev);
            newMap.delete(hierarchicalId);
            return newMap;
          });

          // Update childrenMap
          if (entityType !== 'category') {
            const parentHId = entityType === 'subcategory'
              ? buildHierarchicalId(parentId)
              : buildHierarchicalId(grandParentId, parentId);

            menuState.setChildrenMap(prev => {
              const newMap = new Map(prev);
              const children = newMap.get(parentHId) || [];
              newMap.set(parentHId, children.filter(id => id !== hierarchicalId));
              return newMap;
            });
          }

          menuState.untrackChange(hierarchicalId);
        }
      }
      // If it's edited, revert to original values
      else if (entity._state === 'edited') {
        const original = originalMap.get(hierarchicalId);
        if (original) {
          setter(prev => {
            const newMap = new Map(prev);
            newMap.set(hierarchicalId, {
              ...original,
              _state: 'normal'
            });
            return newMap;
          });
          menuState.untrackChange(hierarchicalId);
        }
      }
    };

    // Revert based on route type
    if (type === 'subcategory') {
      const subcategoryErrors = routeInfo.errors;

      // Revert subcategory name if has error
      if (subcategoryErrors.nameKey) {
        revertEntity('subcategory', subcategoryId, categoryId);
      }

      // Revert all items with errors
      if (subcategoryErrors.items) {
        Object.keys(subcategoryErrors.items).forEach(itemId => {
          revertEntity('item', itemId, subcategoryId, categoryId);
        });
      }
    } else if (type === 'category') {
      const categoryErrors = routeInfo.errors;

      // Revert category name if has error
      if (categoryErrors.nameKey) {
        revertEntity('category', categoryId);
      }

      // Revert all subcategories with errors
      if (categoryErrors.subcategories) {
        Object.keys(categoryErrors.subcategories).forEach(subId => {
          const subErrors = categoryErrors.subcategories[subId];

          if (subErrors.nameKey) {
            revertEntity('subcategory', subId, categoryId);
          }

          // Revert all items in this subcategory with errors
          if (subErrors.items) {
            Object.keys(subErrors.items).forEach(itemId => {
              revertEntity('item', itemId, subId, categoryId);
            });
          }
        });
      }
    }
  }, [menuState, validationErrors]);

  // Block navigation when there are validation errors OR unsaved changes
  const handleNavigationBlock = useCallback((proceedCallback, cancelCallback, currentPathname) => {
    // First check if current route has validation errors
    const currentRouteErrors = getCurrentRouteErrors(currentPathname);

    if (currentRouteErrors) {
      // Current route has validation errors - show specific dialog
      setConfirmDialog({
        isOpen: true,
        title: 'Cambios inválidos',
        message: 'La página actual tiene errores de validación. Si sales, se perderán estos cambios inválidos.\n\n¿Deseas descartar los cambios inválidos y continuar?',
        type: 'danger',
        onConfirm: () => {
          setConfirmDialog(prev => ({ ...prev, isOpen: false }));
          // Revert invalid changes
          revertInvalidChanges(currentRouteErrors);
          // Proceed with navigation after a tiny delay to let state update
          setTimeout(() => {
            if (proceedCallback) {
              proceedCallback();
            }
          }, 50);
        },
        onCancel: () => {
          setConfirmDialog(prev => ({ ...prev, isOpen: false }));
          // Cancel navigation
          if (cancelCallback) {
            cancelCallback();
          }
        }
      });
    } else {
      // No validation errors, just unsaved changes - show normal dialog
      setConfirmDialog({
        isOpen: true,
        title: 'Cambios sin guardar',
        message: '¿Estás seguro de que quieres salir? Se perderán todos los cambios no guardados.',
        type: 'warning',
        onConfirm: () => {
          setConfirmDialog(prev => ({ ...prev, isOpen: false }));
          // Proceed with navigation
          if (proceedCallback) {
            proceedCallback();
          }
        },
        onCancel: () => {
          setConfirmDialog(prev => ({ ...prev, isOpen: false }));
          // Cancel navigation
          if (cancelCallback) {
            cancelCallback();
          }
        }
      });
    }
  }, [getCurrentRouteErrors, revertInvalidChanges]);

  // Use navigation blocker when there are real changes or in editing mode
  useNavigationBlocker(isEditing && menuState.hasRealChanges(), handleNavigationBlock, getCurrentRouteErrors);

  // ============================================================================
  // TOAST HELPERS
  // ============================================================================

  const showToast = useCallback((message, type = 'success', duration = 3000) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type, duration }]);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleLanguageChange = (language) => {
    if (menuState.hasRealChanges()) {
      setConfirmDialog({
        isOpen: true,
        title: 'Cambios sin guardar',
        message: '¿Estás seguro de que quieres cambiar el idioma? Se perderán todos los cambios no guardados.',
        type: 'warning',
        onConfirm: () => {
          onLanguageChange(language);
          setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        }
      });
    } else {
      onLanguageChange(language);
    }
  };

  const handleToggleEditMode = () => {
    if (isEditing && menuState.hasRealChanges()) {
      setConfirmDialog({
        isOpen: true,
        title: 'Salir del modo edición',
        message: 'Tienes cambios sin guardar. ¿Estás seguro de que quieres salir del modo edición?',
        type: 'warning',
        onConfirm: () => {
          setIsEditing(false);
          setConfirmDialog(prev => ({ ...prev, isOpen: false }));
          reload();
        }
      });
    } else {
      setIsEditing(!isEditing);
    }
  };

  const handleSave = () => {
    const errors = validateMenuData();
    const hasValidationErrors = Object.keys(errors).length > 0;

    if (hasValidationErrors) {
      setConfirmDialog({
        isOpen: true,
        title: 'Errores de validación',
        message: 'No se puede guardar porque hay errores de validación en la carta.',
        type: 'danger',
        onConfirm: () => {
          setConfirmDialog(prev => ({ ...prev, isOpen: false }));
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
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        setIsSaving(true);

        try {
          const nestedData = unflattenMenuData(
            menuState.categoriesMap,
            menuState.subcategoriesMap,
            menuState.itemsMap,
            menuState.childrenMap
          );
          const processedData = processMenuDataForBackend(nestedData);

          // DEBUG: Mostrar datos que se enviarán al backend
          console.log('='.repeat(80));
          console.log('📤 DATOS QUE SE ENVÍAN AL BACKEND:');
          console.log('='.repeat(80));
          console.log('Idioma:', selectedLanguage);
          console.log('URL:', `${import.meta.env.VITE_API_URL || 'http://92.186.195.152:8080'}/carta/update?language=${selectedLanguage}`);
          console.log('Método:', 'POST');
          console.log('Headers:', { 'Content-Type': 'application/json' });
          console.log('\nBody (estructura completa):');
          console.log(JSON.stringify(processedData, null, 2));
          console.log('='.repeat(80));
          console.log('📊 ESTADÍSTICAS:');
          console.log(`- Total categorías: ${processedData.length}`);
          console.log(`- Total subcategorías: ${processedData.reduce((acc, cat) => acc + (cat.subcategories?.length || 0), 0)}`);
          console.log(`- Total items: ${processedData.reduce((acc, cat) =>
            acc + (cat.subcategories?.reduce((subAcc, sub) => subAcc + (sub.items?.length || 0), 0) || 0), 0)}`);
          console.log('='.repeat(80));

          await CartaService.saveMenu(processedData, selectedLanguage);
          await reload();
          setIsEditing(false);
          setIsSaving(false);

          // Show success toast
          showToast('Los cambios se han guardado correctamente', 'success', 4000);
        } catch (error) {
          console.error('Error al guardar:', error);
          setIsSaving(false);

          setConfirmDialog({
            isOpen: true,
            title: 'Error al guardar',
            message: `No se pudieron guardar los cambios: ${error.message || 'Error desconocido'}`,
            type: 'danger',
            onConfirm: () => {
              setConfirmDialog(prev => ({ ...prev, isOpen: false }));
            }
          });
        }
      }
    });
  };

  const handleCancel = () => {
    // Si no hay cambios, salir directamente del modo edición
    if (!menuState.hasRealChanges()) {
      setIsEditing(false);
      return;
    }

    // Si hay cambios, mostrar confirmación
    setConfirmDialog({
      isOpen: true,
      title: 'Cancelar cambios',
      message: '¿Estás seguro de que quieres cancelar? Se perderán todos los cambios realizados.',
      type: 'danger',
      onConfirm: () => {
        setIsEditing(false);
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        reload();
      }
    });
  };

  // Prevent page unload with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (menuState.hasRealChanges()) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [menuState]);

  // Context value
  const value = {
    // State
    isEditing,
    isSaving,
    loading,
    error,
    selectedLanguage,

    // Menu state
    menuState,

    // Navigation
    navigation,

    // Validation
    validationErrors,
    validateMenuData,
    hasErrors,

    // Entity operations
    entityOps,

    // Handlers
    handleLanguageChange,
    handleToggleEditMode,
    handleSave,
    handleCancel,

    // Dialog
    confirmDialog,
    setConfirmDialog,

    // Toasts
    toasts,
    showToast,
    removeToast,

    // Reload
    reload
  };

  return (
    <MenuEditContext.Provider value={value}>
      {children}
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </MenuEditContext.Provider>
  );
};

MenuEditProvider.propTypes = {
  children: PropTypes.node.isRequired,
  backendData: PropTypes.array,
  loading: PropTypes.bool.isRequired,
  error: PropTypes.string,
  reload: PropTypes.func.isRequired,
  selectedLanguage: PropTypes.string.isRequired,
  onLanguageChange: PropTypes.func.isRequired
};
