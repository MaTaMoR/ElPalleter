import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useMenuState } from '../hooks/useMenuState';
import { useMenuNavigation } from '../hooks/useMenuNavigation';
import { useMenuValidation } from '../hooks/useMenuValidation';
import { useEntityOperations } from '../hooks/useEntityOperations';
import { useNavigationBlocker } from '../hooks/useNavigationBlocker';
import { unflattenMenuData, processMenuDataForBackend } from '../utils/menuDataUtils';
import { MenuService } from '../services/MenuService';

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

  // Confirm dialog state
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

  // Block navigation when there are unsaved changes
  const handleNavigationBlock = useCallback((proceedCallback, cancelCallback) => {
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
  }, []);

  // Use navigation blocker only when there are real changes
  useNavigationBlocker(menuState.hasRealChanges(), handleNavigationBlock);

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
              setConfirmDialog(prev => ({ ...prev, isOpen: false }));
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

    // Reload
    reload
  };

  return (
    <MenuEditContext.Provider value={value}>
      {children}
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
