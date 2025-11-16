import React, { useState } from 'react';
import { Edit3, Eye, Save, X } from 'lucide-react';
import LanguageSelector from '../../components/menu/utils/LanguageSelector';
import Breadcrumbs from '../../components/menu/navigation/Breadcrumbs';
import CategoryView from '../../components/menu/views/CategoryView';
import SubcategoryView from '../../components/menu/views/SubcategoryView';
import ItemView from '../../components/menu/views/ItemView';
import ConfirmDialog from '../../components/menu/utils/ConfirmDialog';
import { useMenuData } from '../../hooks/useMenuData';
import { useMenuState } from '../../hooks/useMenuState';
import { useMenuNavigation } from '../../hooks/useMenuNavigation';
import { useMenuValidation } from '../../hooks/useMenuValidation';
import { useEntityOperations } from '../../hooks/useEntityOperations';
import { MenuService } from '../../services/MenuService';
import { unflattenMenuData, processMenuDataForBackend } from '../../utils/menuDataUtils';
import styles from './MenuPage.module.css';

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
  const [isSaving, setIsSaving] = useState(false);

  // Load data from backend
  const { data: backendData, loading, error, reload } = useMenuData(selectedLanguage);

  // Menu state management (Maps, change tracking)
  const menuState = useMenuState(backendData, loading, error, MOCK_MENU_DATA);

  // Navigation management
  const navigation = useMenuNavigation(menuState);

  // Validation
  const { validationErrors, validateMenuData, hasErrors } = useMenuValidation(
    menuState.categoriesMap,
    menuState.subcategoriesMap,
    menuState.itemsMap,
    menuState.childrenMap,
    isEditing
  );

  // Confirm dialog
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null,
    type: 'warning'
  });

  // Entity operations (unified CRUD)
  const entityOps = useEntityOperations(menuState, navigation, setConfirmDialog);

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
          setSelectedLanguage(language);
          setConfirmDialog({ ...confirmDialog, isOpen: false });
        }
      });
    } else {
      setSelectedLanguage(language);
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
          setConfirmDialog({ ...confirmDialog, isOpen: false });
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
          const nestedData = unflattenMenuData(
            menuState.categoriesMap,
            menuState.subcategoriesMap,
            menuState.itemsMap,
            menuState.childrenMap
          );
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

  if (error && menuState.categoriesMap.size === 0) {
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
                  <span className={menuState.hasRealChanges() ? styles.changesBadge : styles.editingBadge}>
                    {menuState.hasRealChanges() ? 'Cambios sin guardar' : 'Modo Edición'}
                  </span>
                </div>
                <div className={styles.editingActions}>
                  <button
                    type="button"
                    className={styles.cancelButton}
                    onClick={handleCancel}
                    disabled={!menuState.hasRealChanges() || isSaving}
                  >
                    <X size={18} strokeWidth={2.5} />
                    <span>Cancelar</span>
                  </button>
                  <button
                    type="button"
                    className={styles.saveButton}
                    onClick={handleSave}
                    disabled={!menuState.hasRealChanges() || isSaving}
                  >
                    <Save size={18} />
                    <span>{isSaving ? 'Guardando...' : 'Guardar'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          <Breadcrumbs
            currentLevel={navigation.currentLevel}
            categoryName={navigation.currentCategory?.nameKey}
            subcategoryName={navigation.currentSubcategory?.nameKey}
            onNavigateToCategories={navigation.handleNavigateToCategories}
            onNavigateToSubcategories={navigation.handleNavigateToSubcategories}
          />

          <div className={styles.viewContainer}>
            {navigation.currentLevel === 'categories' && (
              <CategoryView
                categories={navigation.getCategoriesForView()}
                onCategoryClick={navigation.handleCategoryClick}
                onAddCategory={isEditing ? () => entityOps.handleAdd('category') : undefined}
                onDeleteCategory={isEditing ? (id) => entityOps.handleDelete('category', id) : undefined}
                onUndoDeleteCategory={isEditing ? (id) => entityOps.handleUndoDelete('category', id) : undefined}
                subcategoryCounts={navigation.getSubcategoryCounts()}
                isEditing={isEditing}
              />
            )}

            {navigation.currentLevel === 'subcategories' && navigation.currentCategory && (
              <SubcategoryView
                subcategories={navigation.currentCategory.subcategories || []}
                categoryName={navigation.currentCategory.nameKey || 'Sin nombre'}
                category={navigation.currentCategory}
                onSubcategoryClick={navigation.handleSubcategoryClick}
                onAddSubcategory={isEditing ? () => entityOps.handleAdd('subcategory', navigation.currentCategory.id) : undefined}
                onDeleteSubcategory={isEditing ? (subId) => entityOps.handleDelete('subcategory', subId, navigation.currentCategory.id) : undefined}
                onUndoDeleteSubcategory={isEditing ? (id) => entityOps.handleUndoDelete('subcategory', id) : undefined}
                onUpdateCategory={isEditing ? (id, updates) => entityOps.handleUpdate('category', id, updates) : undefined}
                onBack={navigation.handleBackFromSubcategories}
                itemCounts={navigation.getItemCounts()}
                isEditing={isEditing}
                categoryError={validationErrors[navigation.currentCategory.id]?.nameKey}
              />
            )}

            {navigation.currentLevel === 'items' && navigation.currentSubcategory && (
              <ItemView
                items={navigation.currentSubcategory.items || []}
                subcategoryName={navigation.currentSubcategory.nameKey || 'Sin nombre'}
                subcategory={navigation.currentSubcategory}
                onAddItem={isEditing ? () => entityOps.handleAdd('item', navigation.currentSubcategory.id, navigation.currentCategory.id) : undefined}
                onUpdateItem={isEditing ? (id, updates) => entityOps.handleUpdate('item', id, updates) : undefined}
                onUpdateSubcategory={isEditing ? (id, updates) => entityOps.handleUpdate('subcategory', id, updates) : undefined}
                onDeleteItem={isEditing ? (itemId) => entityOps.handleDelete('item', itemId, navigation.currentSubcategory.id, navigation.currentCategory.id) : undefined}
                onUndoDeleteItem={isEditing ? (id) => entityOps.handleUndoDelete('item', id) : undefined}
                onBack={navigation.handleBackFromItems}
                isEditing={isEditing}
                errors={validationErrors}
                subcategoryError={validationErrors[navigation.currentCategory?.id]?.subcategories?.[navigation.currentSubcategory.id]?.nameKey}
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
