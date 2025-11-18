import React from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { useMenuEdit } from '../../../contexts/MenuEditContext';
import { buildHierarchicalId } from '../../../utils/menuDataUtils';
import styles from './MenuBreadcrumbs.module.css';

/**
 * Breadcrumbs component that derives navigation from URL params
 */
const MenuBreadcrumbs = () => {
  const { categoryId, subcategoryId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { menuState } = useMenuEdit();

  // Get category and subcategory names from state
  const getCategoryName = () => {
    if (!categoryId) return null;
    const categoryHId = buildHierarchicalId(categoryId);
    const category = menuState.categoriesMap.get(categoryHId);
    return category?.nameKey || 'Sin nombre';
  };

  const getSubcategoryName = () => {
    if (!categoryId || !subcategoryId) return null;
    const subcategoryHId = buildHierarchicalId(categoryId, subcategoryId);
    const subcategory = menuState.subcategoriesMap.get(subcategoryHId);
    return subcategory?.nameKey || 'Sin nombre';
  };

  const categoryName = getCategoryName();
  const subcategoryName = getSubcategoryName();

  // Determine current level from URL
  const getCurrentLevel = () => {
    if (subcategoryId) return 'items';
    if (categoryId) return 'subcategories';
    return 'categories';
  };

  const currentLevel = getCurrentLevel();

  // Navigation handlers
  const handleNavigateToCategories = () => {
    // Get base path (everything before /categories)
    const pathParts = location.pathname.split('/categories')[0];
    navigate(`${pathParts}/categories`);
  };

  const handleNavigateToSubcategories = () => {
    if (categoryId) {
      const pathParts = location.pathname.split('/categories')[0];
      navigate(`${pathParts}/categories/${categoryId}`);
    }
  };

  return (
    <div className={styles.breadcrumbs}>
      <button
        type="button"
        className={`${styles.breadcrumb} ${currentLevel === 'categories' ? styles.active : ''}`}
        onClick={handleNavigateToCategories}
      >
        <Home size={20} />
        <span>Inicio</span>
      </button>

      {categoryName && (
        <>
          <ChevronRight size={20} className={styles.separator} />
          <button
            type="button"
            className={`${styles.breadcrumb} ${currentLevel === 'subcategories' ? styles.active : ''}`}
            onClick={handleNavigateToSubcategories}
          >
            <span>{categoryName}</span>
          </button>
        </>
      )}

      {subcategoryName && (
        <>
          <ChevronRight size={20} className={styles.separator} />
          <span className={`${styles.breadcrumb} ${styles.active}`}>
            {subcategoryName}
          </span>
        </>
      )}
    </div>
  );
};

export default MenuBreadcrumbs;
