import React from 'react';
import { Outlet } from 'react-router-dom';
import { Edit3, Save, X } from 'lucide-react';
import Button from '../../components/common/Button';
import LanguageSelector from '../../components/menu/utils/LanguageSelector';
import GlobalSearch from '../../components/menu/search/GlobalSearch';
import MenuBreadcrumbs from '../../components/menu/navigation/MenuBreadcrumbs';
import { useMenuEdit } from '../../contexts/MenuEditContext';
import styles from './MenuPage.module.css';

/**
 * Layout component for menu pages
 * This wraps all menu routes and includes the header
 */
const MenuLayout = () => {
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
    <div className={styles.viewContainer}>
      {/* Header with breadcrumbs and controls */}
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
                <div className={styles.buttonWrapper}>
                  <Button
                    variant="primary"
                    icon={Edit3}
                    onClick={handleToggleEditMode}
                  >
                    Editar
                  </Button>
                </div>
              </>
            ) : (
              <>
                {/* Save Button - En modo edición */}
                <div className={styles.buttonWrapper}>
                  <Button
                    variant="success"
                    icon={Save}
                    onClick={handleSave}
                    disabled={!menuState.hasRealChanges() || isSaving}
                  >
                    {isSaving ? 'Guardando...' : 'Guardar'}
                  </Button>
                </div>

                <div className={styles.controlDivider}></div>

                {/* Cancel Button - En modo edición */}
                <div className={styles.buttonWrapper}>
                  <Button
                    variant="danger"
                    icon={X}
                    onClick={handleCancel}
                    disabled={isSaving}
                  >
                    Cancelar
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Content area for routes */}
      <Outlet />
    </div>
  );
};

export default MenuLayout;
