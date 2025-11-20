import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import PageContainer from '../../components/common/PageContainer';
import Button from '../../components/common/Button';
import SavingOverlay from '../../components/common/SavingOverlay';
import MenuLayout from './MenuLayout';
import CategoryListView from '../../components/menu/views/CategoryListView';
import SubcategoryListView from '../../components/menu/views/SubcategoryListView';
import ItemListView from '../../components/menu/views/ItemListView';
import ConfirmDialog from '../../components/menu/utils/ConfirmDialog';
import { useMenuData } from '../../hooks/useMenuData';
import { MenuEditProvider, useMenuEdit } from '../../contexts/MenuEditContext';
import styles from './MenuPage.module.css';

// ============================================================================
// MENU CONTENT COMPONENT
// ============================================================================

const MenuContent = () => {
  const { loading, error, menuState, reload, confirmDialog, setConfirmDialog, isSaving } = useMenuEdit();

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
        <Button
          variant="primary"
          onClick={reload}
          className={styles.retryButton}
        >
          Reintentar
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className={styles.content}>
        <div className={styles.categoriesContainer}>
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

      {/* Saving Overlay */}
      <SavingOverlay isVisible={isSaving} />
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
      selectedLanguage={selectedLanguage}
      onLanguageChange={setSelectedLanguage}
    >
      <PageContainer>
        <div className={styles.menuPage}>
          <MenuContent />
        </div>
      </PageContainer>
    </MenuEditProvider>
  );
};

export default MenuPage;
