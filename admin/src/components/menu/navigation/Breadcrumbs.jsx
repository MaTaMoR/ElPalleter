import React from 'react';
import PropTypes from 'prop-types';
import { Home, ChevronRight } from 'lucide-react';
import styles from './Breadcrumbs.module.css';

const Breadcrumbs = ({
  currentLevel,
  categoryName,
  subcategoryName,
  onNavigateToCategories,
  onNavigateToSubcategories
}) => {
  return (
    <div className={styles.breadcrumbs}>
      <button
        onClick={onNavigateToCategories}
        className={`${styles.breadcrumbButton} ${currentLevel === 'categories' ? styles.active : ''}`}
        aria-label="Ir a categorías"
      >
        <Home size={16} />
        <span>Categorías</span>
      </button>

      {categoryName && (
        <>
          <ChevronRight size={16} className={styles.separator} />
          <button
            onClick={onNavigateToSubcategories}
            className={`${styles.breadcrumbButton} ${currentLevel === 'subcategories' ? styles.active : ''}`}
            disabled={currentLevel === 'categories'}
          >
            {categoryName}
          </button>
        </>
      )}

      {subcategoryName && (
        <>
          <ChevronRight size={16} className={styles.separator} />
          <span className={`${styles.breadcrumbText} ${styles.active}`}>
            {subcategoryName}
          </span>
        </>
      )}
    </div>
  );
};

Breadcrumbs.propTypes = {
  currentLevel: PropTypes.oneOf(['categories', 'subcategories', 'items']).isRequired,
  categoryName: PropTypes.string,
  subcategoryName: PropTypes.string,
  onNavigateToCategories: PropTypes.func.isRequired,
  onNavigateToSubcategories: PropTypes.func
};

export default Breadcrumbs;
