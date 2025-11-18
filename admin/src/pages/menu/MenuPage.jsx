import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Edit3, Eye, Save, X } from 'lucide-react';
import LanguageSelector from '../../components/menu/utils/LanguageSelector';
import GlobalSearch from '../../components/menu/search/GlobalSearch';
import MenuBreadcrumbs from '../../components/menu/navigation/MenuBreadcrumbs';
import MenuLayout from './MenuLayout';
import CategoryListView from '../../components/menu/views/CategoryListView';
import SubcategoryListView from '../../components/menu/views/SubcategoryListView';
import ItemListView from '../../components/menu/views/ItemListView';
import ConfirmDialog from '../../components/menu/utils/ConfirmDialog';
import { useMenuData } from '../../hooks/useMenuData';
import { MenuEditProvider, useMenuEdit } from '../../contexts/MenuEditContext';
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
// MENU HEADER COMPONENT
// ============================================================================

const MenuHeader = () => {
  const {
    isEditing,
    isSaving,
    selectedLanguage,
    menuState,
    handleLanguageChange,
    handleToggleEditMode,
    handleSave,
    handleCancel
  } = useMenuEdit();

  return (
    <div className={styles.header}>
      <div className={styles.headerTop}>
        {/* Breadcrumbs Section */}
        <div className={styles.breadcrumbsWrapper}>
          <MenuBreadcrumbs />
        </div>

        {/* Controls Group */}
        <div className={styles.controlsGroup}>
          {/* Search */}
          <div className={styles.searchWrapper}>
            <GlobalSearch
              categoriesMap={menuState.categoriesMap}
              subcategoriesMap={menuState.subcategoriesMap}
              itemsMap={menuState.itemsMap}
              childrenMap={menuState.childrenMap}
            />
          </div>

          <div className={styles.controlDivider}></div>

          {/* Conditional controls based on edit mode */}
          {!isEditing ? (
            <>
              {/* Language Selector - Solo en modo visualización */}
              <div className={styles.languageWrapper}>
                <LanguageSelector
                  selectedLanguage={selectedLanguage}
                  onChange={handleLanguageChange}
                  disabled={false}
                />
              </div>

              <div className={styles.controlDivider}></div>

              {/* Edit Button */}
              <button
                type="button"
                className={`${styles.headerButton} ${styles.headerButtonPrimary}`}
                onClick={handleToggleEditMode}
              >
                <Edit3 size={18} />
                <span>Editar</span>
              </button>
            </>
          ) : (
            <>
              {/* Save Button - En modo edición */}
              <button
                type="button"
                className={`${styles.headerButton} ${styles.headerButtonSuccess}`}
                onClick={handleSave}
                disabled={!menuState.hasRealChanges() || isSaving}
              >
                <Save size={18} />
                <span>{isSaving ? 'Guardando...' : 'Guardar'}</span>
              </button>

              <div className={styles.controlDivider}></div>

              {/* Cancel Button - En modo edición */}
              <button
                type="button"
                className={`${styles.headerButton} ${styles.headerButtonDanger}`}
                onClick={handleCancel}
                disabled={isSaving}
              >
                <X size={18} />
                <span>Cancelar</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// MENU CONTENT COMPONENT
// ============================================================================

const MenuContent = () => {
  const { loading, error, menuState, reload, confirmDialog, setConfirmDialog } = useMenuEdit();

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}></div>
        <p>Cargando carta...</p>
      </div>
    );
  }

  if (error && menuState.categoriesMap.size === 0) {
    return (
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
    );
  }

  return (
    <>
      <div className={styles.content}>
        <div className={styles.categoriesContainer}>
          <MenuHeader />

          <Routes>
            <Route path="/" element={<MenuLayout />}>
              <Route index element={<Navigate to="categories" replace />} />
              <Route path="categories" element={<CategoryListView />} />
              <Route path="categories/:categoryId" element={<SubcategoryListView />} />
              <Route path="categories/:categoryId/:subcategoryId" element={<ItemListView />} />
            </Route>
          </Routes>
        </div>
      </div>

      {confirmDialog.onConfirm && (
        <ConfirmDialog
          isOpen={confirmDialog.isOpen}
          title={confirmDialog.title}
          message={confirmDialog.message}
          type={confirmDialog.type}
          onConfirm={confirmDialog.onConfirm}
          onCancel={confirmDialog.onCancel || (() => setConfirmDialog(prev => ({ ...prev, isOpen: false })))}
          confirmText={confirmDialog.type === 'danger' ? 'Eliminar' : 'Confirmar'}
        />
      )}
    </>
  );
};

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================

const MenuPage = () => {
  const [selectedLanguage, setSelectedLanguage] = useState('es');

  // Load data from backend
  const { data: backendData, loading, error, reload } = useMenuData(selectedLanguage);

  return (
    <MenuEditProvider
      backendData={backendData}
      loading={loading}
      error={error}
      reload={reload}
      mockData={MOCK_MENU_DATA}
      selectedLanguage={selectedLanguage}
      onLanguageChange={setSelectedLanguage}
    >
      <div className={styles.menuPage}>
        <MenuContent />
      </div>
    </MenuEditProvider>
  );
};

export default MenuPage;
