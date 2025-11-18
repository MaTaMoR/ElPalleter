import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Plus, ChevronRight, Trash2, Undo2, ArrowLeft, Edit3, Check, X } from 'lucide-react';
import MenuTextField from '../fields/MenuTextField';
import styles from './SubcategoryView.module.css';

const SubcategoryView = ({
  subcategories,
  categoryName,
  category,
  onSubcategoryClick,
  onAddSubcategory,
  onDeleteSubcategory,
  onUndoDeleteSubcategory,
  onUpdateCategory,
  onUpdateSubcategory,
  onBack,
  itemCounts,
  isEditing,
  categoryError,
  subcategoryErrors = {}
}) => {
  const [editingSubcategoryId, setEditingSubcategoryId] = useState(null);

  const handleEdit = (subcategoryId) => {
    setEditingSubcategoryId(subcategoryId);
  };

  const handleCancelEdit = () => {
    setEditingSubcategoryId(null);
  };

  const handleSaveEdit = () => {
    setEditingSubcategoryId(null);
  };

  const handleFieldChange = (subcategoryId, field, value) => {
    if (onUpdateSubcategory) {
      onUpdateSubcategory(subcategoryId, { [field]: value });
    }
  };

  return (
    <div className={styles.container}>
      {onBack && (
        <button onClick={onBack} className={styles.backButton}>
          <ArrowLeft size={18} />
          <span>Volver</span>
        </button>
      )}

      <div className={styles.pageTitle}>
        <h1 className={styles.pageTitleName}>{categoryName}</h1>
      </div>

      {isEditing && category && onUpdateCategory && (
        <div className={styles.categoryEditSection}>
          <MenuTextField
            label="Nombre de la categoría"
            value={category.nameKey || ''}
            onChange={(value) => onUpdateCategory(category.id, { nameKey: value })}
            required
            error={categoryError}
            helperText="Mínimo 3 caracteres"
          />
        </div>
      )}

      <div className={styles.header}>
        <h2 className={styles.title}>Subcategorías</h2>
        {isEditing && (
          <button
            type="button"
            onClick={onAddSubcategory}
            className={styles.addButtonHeader}
          >
            <Plus size={18} />
            <span>Añadir</span>
          </button>
        )}
        <span className={styles.count}>{subcategories.length} subcategorías</span>
      </div>

      <div className={styles.grid}>
        {subcategories.map((subcategory) => {
          const isEditingSubcategory = isEditing && editingSubcategoryId === subcategory.id;
          const isDeleted = subcategory._state === 'deleted';

          return (
            <div
              key={subcategory.id}
              className={`${styles.card} ${subcategory._state ? styles[subcategory._state] : ''}`}
            >
              {isEditingSubcategory ? (
                // Modo edición
                <div className={styles.editForm}>
                  <MenuTextField
                    label="Nombre de la subcategoría"
                    value={subcategory.nameKey || ''}
                    onChange={(value) => handleFieldChange(subcategory.id, 'nameKey', value)}
                    required
                    error={subcategoryErrors[subcategory.id]?.nameKey}
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
                    onClick={() => onSubcategoryClick(subcategory)}
                    className={styles.cardContent}
                    disabled={isDeleted}
                  >
                    <div className={styles.cardInfo}>
                      <h3 className={styles.cardTitle}>{subcategory.nameKey || 'Sin nombre'}</h3>
                      <p className={styles.cardSubtitle}>
                        {itemCounts[subcategory.id] || 0} items
                      </p>
                    </div>
                  </button>

                  <div className={styles.cardActions}>
                    {isEditing && (
                      isDeleted ? (
                        <button
                          type="button"
                          onClick={() => onUndoDeleteSubcategory(subcategory.id)}
                          className={`${styles.actionButton} ${styles.undoButton}`}
                          title="Deshacer eliminación"
                        >
                          <Undo2 size={18} />
                        </button>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => handleEdit(subcategory.id)}
                            className={`${styles.actionButton} ${styles.editButton}`}
                            title="Editar subcategoría"
                          >
                            <Edit3 size={18} />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteSubcategory(subcategory.id)}
                            className={`${styles.actionButton} ${styles.deleteButton}`}
                            title="Eliminar subcategoría"
                          >
                            <Trash2 size={18} />
                          </button>
                        </>
                      )
                    )}
                    <button
                      onClick={() => onSubcategoryClick(subcategory)}
                      className={styles.arrowButton}
                      disabled={isDeleted}
                      title="Ver items"
                    >
                      <ChevronRight size={18} className={styles.cardIcon} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {subcategories.length === 0 && (
        <div className={styles.emptyState}>
          <p>No hay subcategorías en esta categoría</p>
        </div>
      )}
    </div>
  );
};

SubcategoryView.propTypes = {
  subcategories: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      nameKey: PropTypes.string,
      _state: PropTypes.oneOf(['normal', 'new', 'edited', 'deleted'])
    })
  ).isRequired,
  categoryName: PropTypes.string.isRequired,
  category: PropTypes.object,
  onSubcategoryClick: PropTypes.func.isRequired,
  onAddSubcategory: PropTypes.func,
  onDeleteSubcategory: PropTypes.func,
  onUndoDeleteSubcategory: PropTypes.func,
  onUpdateCategory: PropTypes.func,
  onUpdateSubcategory: PropTypes.func,
  onBack: PropTypes.func,
  itemCounts: PropTypes.object,
  isEditing: PropTypes.bool,
  categoryError: PropTypes.string,
  subcategoryErrors: PropTypes.object
};

export default SubcategoryView;
