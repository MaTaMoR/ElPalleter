import React from 'react';
import PropTypes from 'prop-types';
import { Plus, ChevronRight, Trash2, Undo2 } from 'lucide-react';
import styles from './CategoryView.module.css';

const CategoryView = ({
  categories,
  onCategoryClick,
  onAddCategory,
  onDeleteCategory,
  onUndoDeleteCategory,
  subcategoryCounts,
  isEditing
}) => {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Categorías</h2>
        {isEditing && (
          <button
            type="button"
            onClick={onAddCategory}
            className={styles.addButtonHeader}
          >
            <Plus size={18} />
            <span>Añadir</span>
          </button>
        )}
        <span className={styles.count}>{categories.length} categorías</span>
      </div>

      <div className={styles.grid}>
        {categories.map((category) => (
          <div
            key={category.id}
            className={`${styles.card} ${category._state ? styles[category._state] : ''}`}
          >
            <div className={styles.cardLayout}>
              <button
                onClick={() => onCategoryClick(category)}
                className={styles.cardContent}
                disabled={category._state === 'deleted'}
              >
                <div className={styles.cardInfo}>
                  <h3 className={styles.cardTitle}>{category.nameKey || 'Sin nombre'}</h3>
                  <p className={styles.cardSubtitle}>
                    {subcategoryCounts[category.id] || 0} subcategorías
                  </p>
                </div>
                <ChevronRight size={24} className={styles.cardIcon} />
              </button>

              {isEditing && (
                <div className={styles.cardActions}>
                  {category._state === 'deleted' ? (
                    <button
                      type="button"
                      onClick={() => onUndoDeleteCategory(category.id)}
                      className={`${styles.actionButton} ${styles.undoButton}`}
                      title="Deshacer eliminación"
                    >
                      <Undo2 size={18} />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onDeleteCategory(category.id)}
                      className={`${styles.actionButton} ${styles.deleteButton}`}
                      title="Eliminar categoría"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

CategoryView.propTypes = {
  categories: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      nameKey: PropTypes.string,
      _state: PropTypes.oneOf(['normal', 'new', 'edited', 'deleted'])
    })
  ).isRequired,
  onCategoryClick: PropTypes.func.isRequired,
  onAddCategory: PropTypes.func,
  onDeleteCategory: PropTypes.func,
  onUndoDeleteCategory: PropTypes.func,
  subcategoryCounts: PropTypes.object,
  isEditing: PropTypes.bool
};

export default CategoryView;
