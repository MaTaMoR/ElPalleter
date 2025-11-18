import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Plus, ChevronRight, Trash2, Undo2, Edit3, Check, X } from 'lucide-react';
import MenuTextField from '../fields/MenuTextField';
import styles from './CategoryView.module.css';

const CategoryView = ({
  categories,
  onCategoryClick,
  onAddCategory,
  onDeleteCategory,
  onUndoDeleteCategory,
  onUpdateCategory,
  subcategoryCounts,
  isEditing,
  categoryErrors = {}
}) => {
  const [editingCategoryId, setEditingCategoryId] = useState(null);

  const handleEdit = (categoryId) => {
    setEditingCategoryId(categoryId);
  };

  const handleCancelEdit = () => {
    setEditingCategoryId(null);
  };

  const handleSaveEdit = () => {
    setEditingCategoryId(null);
  };

  const handleFieldChange = (categoryId, field, value) => {
    if (onUpdateCategory) {
      onUpdateCategory(categoryId, { [field]: value });
    }
  };

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
        {categories.map((category) => {
          const isEditingCategory = isEditing && editingCategoryId === category.id;
          const isDeleted = category._state === 'deleted';

          return (
            <div
              key={category.id}
              className={`${styles.card} ${category._state ? styles[category._state] : ''}`}
            >
              {isEditingCategory ? (
                // Modo edición
                <div className={styles.editForm}>
                  <MenuTextField
                    label="Nombre de la categoría"
                    value={category.nameKey || ''}
                    onChange={(value) => handleFieldChange(category.id, 'nameKey', value)}
                    required
                    error={categoryErrors[category.id]?.nameKey}
                    helperText="Mínimo 3 caracteres"
                  />
                  <div className={styles.editActions}>
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      className={styles.cancelEditButton}
                    >
                      <X size={18} />
                      <span>Cancelar</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveEdit}
                      className={styles.saveEditButton}
                    >
                      <Check size={18} />
                      <span>Guardar</span>
                    </button>
                  </div>
                </div>
              ) : (
                // Modo vista
                <div className={styles.cardLayout}>
                  <button
                    onClick={() => onCategoryClick(category)}
                    className={styles.cardContent}
                    disabled={isDeleted}
                  >
                    <div className={styles.cardInfo}>
                      <h3 className={styles.cardTitle}>{category.nameKey || 'Sin nombre'}</h3>
                      <p className={styles.cardSubtitle}>
                        {subcategoryCounts[category.id] || 0} subcategorías
                      </p>
                    </div>
                  </button>

                  <div className={styles.cardActions}>
                    {isEditing && (
                      isDeleted ? (
                        <button
                          type="button"
                          onClick={() => onUndoDeleteCategory(category.id)}
                          className={`${styles.actionButton} ${styles.undoButton}`}
                          title="Deshacer eliminación"
                        >
                          <Undo2 size={18} />
                        </button>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => handleEdit(category.id)}
                            className={`${styles.actionButton} ${styles.editButton}`}
                            title="Editar categoría"
                          >
                            <Edit3 size={18} />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteCategory(category.id)}
                            className={`${styles.actionButton} ${styles.deleteButton}`}
                            title="Eliminar categoría"
                          >
                            <Trash2 size={18} />
                          </button>
                        </>
                      )
                    )}
                    <button
                      onClick={() => onCategoryClick(category)}
                      className={styles.arrowButton}
                      disabled={isDeleted}
                      title="Ver subcategorías"
                    >
                      <ChevronRight size={24} className={styles.cardIcon} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
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
  onUpdateCategory: PropTypes.func,
  subcategoryCounts: PropTypes.object,
  isEditing: PropTypes.bool,
  categoryErrors: PropTypes.object
};

export default CategoryView;
