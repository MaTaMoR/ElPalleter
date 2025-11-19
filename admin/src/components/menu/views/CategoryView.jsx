import React, { useState, useRef } from 'react';
import PropTypes from 'prop-types';
import { Plus, Check, X } from 'lucide-react';
import Button from '../../common/Button';
import MenuTextField from '../fields/MenuTextField';
import MenuCard from '../common/MenuCard';
import MenuBadge from '../common/MenuBadge';
import styles from './CategoryView.module.css';
import cardStyles from '../common/MenuCard.module.css';

const CategoryView = ({
  categories,
  onCategoryClick,
  onAddCategory,
  onDeleteCategory,
  onUndoDeleteCategory,
  onUpdateCategory,
  onCancelEditCategory,
  subcategoryCounts,
  isEditing,
  categoryErrors = {},
  onValidationError
}) => {
  const [editingCategoryId, setEditingCategoryId] = useState(null);
  const [shakingCategoryId, setShakingCategoryId] = useState(null);
  const categoryRefs = useRef({});

  const handleEdit = (categoryId) => {
    setEditingCategoryId(categoryId);
  };

  const handleCancelEdit = (categoryId) => {
    // Revert changes before closing
    if (onCancelEditCategory) {
      onCancelEditCategory(categoryId);
    }
    setEditingCategoryId(null);
  };

  const handleSaveEdit = (categoryId) => {
    // Verificar si la categoría tiene errores de validación
    const errors = categoryErrors[categoryId];
    const hasErrors = errors && Object.values(errors).some(error => error);

    if (hasErrors) {
      // Disparar animación de vibración
      setShakingCategoryId(categoryId);

      // Remover la clase de vibración después de la animación
      setTimeout(() => {
        setShakingCategoryId(null);
      }, 500);

      // Llamar al callback de error si existe (para mostrar toast/mensaje)
      if (onValidationError) {
        const errorMessages = Object.entries(errors)
          .filter(([, error]) => error)
          .map(([field, error]) => error);
        onValidationError(errorMessages);
      }

      return; // No cerrar el formulario si hay errores
    }

    // Si no hay errores, cerrar el formulario
    setEditingCategoryId(null);
  };

  const handleFieldChange = (categoryId, field, value) => {
    if (onUpdateCategory) {
      onUpdateCategory(categoryId, { [field]: value });
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.pageTitle}>
        <h1 className={styles.pageTitleName}>Categorías</h1>
        {isEditing && (
          <Button
            variant="primary"
            icon={Plus}
            onClick={onAddCategory}
          >
            Añadir
          </Button>
        )}
      </div>

      <div className={styles.grid}>
        {categories.map((category) => {
          const isEditingCategory = isEditing && editingCategoryId === category.id;
          const isDeleted = category._state === 'deleted';
          const isShaking = shakingCategoryId === category.id;

          return (
            <div
              key={category.id}
              ref={(el) => { categoryRefs.current[category.id] = el; }}
              className={isShaking ? styles.categoryShake : ''}
            >
              <MenuCard
              title={category.nameKey || 'Sin nombre'}
              content={
                <MenuBadge
                  count={subcategoryCounts[category.id] || 0}
                  label="subcategorías"
                />
              }
              editForm={
                isEditingCategory ? (
                  <div className={cardStyles.editForm}>
                    <MenuTextField
                      label="Nombre de la categoría"
                      value={category.nameKey || ''}
                      onChange={(value) => handleFieldChange(category.id, 'nameKey', value)}
                      required
                      error={categoryErrors[category.id]?.nameKey}
                      helperText="Mínimo 3 caracteres"
                    />
                    <div className={cardStyles.editActions}>
                      <button
                        type="button"
                        onClick={() => handleCancelEdit(category.id)}
                        className={cardStyles.cancelEditButton}
                      >
                        <X size={18} />
                        <span>Cancelar</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSaveEdit(category.id)}
                        className={cardStyles.saveEditButton}
                      >
                        <Check size={18} />
                        <span>Guardar</span>
                      </button>
                    </div>
                  </div>
                ) : null
              }
              state={category._state === 'normal' ? null : category._state}
              isDeleted={isDeleted}
              onClick={() => onCategoryClick(category)}
              onEdit={() => handleEdit(category.id)}
              onDelete={() => onDeleteCategory(category.id)}
              onUndo={() => onUndoDeleteCategory(category.id)}
              showArrow={true}
              isEditing={isEditing}
            />
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
  onCancelEditCategory: PropTypes.func,
  subcategoryCounts: PropTypes.object,
  isEditing: PropTypes.bool,
  categoryErrors: PropTypes.object,
  onValidationError: PropTypes.func
};

export default CategoryView;
