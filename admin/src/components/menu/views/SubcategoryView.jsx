import React, { useState, useRef } from 'react';
import PropTypes from 'prop-types';
import { Plus, ArrowLeft, Check, X } from 'lucide-react';
import Button from '../../common/Button';
import MenuTextField from '../fields/MenuTextField';
import MenuCard from '../common/MenuCard';
import MenuBadge from '../common/MenuBadge';
import styles from './SubcategoryView.module.css';
import cardStyles from '../common/MenuCard.module.css';

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
  onCancelEditSubcategory,
  onBack,
  itemCounts,
  isEditing,
  categoryError,
  subcategoryErrors = {},
  onValidationError
}) => {
  const [editingSubcategoryId, setEditingSubcategoryId] = useState(null);
  const [shakingSubcategoryId, setShakingSubcategoryId] = useState(null);
  const [shakingCategoryField, setShakingCategoryField] = useState(false);
  const subcategoryRefs = useRef({});

  const handleEdit = (subcategoryId) => {
    setEditingSubcategoryId(subcategoryId);
  };

  const handleCancelEdit = (subcategoryId) => {
    // Revert changes before closing
    if (onCancelEditSubcategory) {
      onCancelEditSubcategory(subcategoryId);
    }
    setEditingSubcategoryId(null);
  };

  const handleSaveEdit = (subcategoryId) => {
    // Verificar si la subcategoría tiene errores de validación
    const errors = subcategoryErrors[subcategoryId];
    const hasErrors = errors && Object.values(errors).some(error => error);

    if (hasErrors) {
      // Disparar animación de vibración
      setShakingSubcategoryId(subcategoryId);

      // Remover la clase de vibración después de la animación
      setTimeout(() => {
        setShakingSubcategoryId(null);
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
    setEditingSubcategoryId(null);
  };

  const handleFieldChange = (subcategoryId, field, value) => {
    if (onUpdateSubcategory) {
      onUpdateSubcategory(subcategoryId, { [field]: value });
    }
  };

  const handleAddSubcategoryClick = () => {
    // Verificar si la categoría padre tiene errores
    if (categoryError) {
      // Disparar animación de vibración en el campo de categoría
      setShakingCategoryField(true);

      // Remover la clase de vibración después de la animación
      setTimeout(() => {
        setShakingCategoryField(false);
      }, 500);

      // Mostrar toast con el error
      if (onValidationError) {
        onValidationError(['No puedes añadir subcategorías hasta que corrijas el nombre de la categoría']);
      }

      return; // No permitir añadir
    }

    // Si no hay errores, ejecutar la acción normal
    if (onAddSubcategory) {
      onAddSubcategory();
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
        {isEditing && (
          <Button
            variant="primary"
            icon={Plus}
            onClick={handleAddSubcategoryClick}
          >
            Añadir
          </Button>
        )}
      </div>

      {isEditing && category && onUpdateCategory && (
        <div className={`${styles.categoryEditSection} ${shakingCategoryField ? styles.fieldShake : ''}`}>
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

      <div className={styles.grid}>
        {subcategories.map((subcategory) => {
          const isEditingSubcategory = isEditing && editingSubcategoryId === subcategory.id;
          const isDeleted = subcategory._state === 'deleted';
          const isShaking = shakingSubcategoryId === subcategory.id;

          return (
            <div
              key={subcategory.id}
              ref={(el) => { subcategoryRefs.current[subcategory.id] = el; }}
              className={isShaking ? styles.subcategoryShake : ''}
            >
              <MenuCard
              title={subcategory.nameKey || 'Sin nombre'}
              content={
                <MenuBadge
                  count={itemCounts[subcategory.id] || 0}
                  label="items"
                />
              }
              editForm={
                isEditingSubcategory ? (
                  <div className={cardStyles.editForm}>
                    <MenuTextField
                      label="Nombre de la subcategoría"
                      value={subcategory.nameKey || ''}
                      onChange={(value) => handleFieldChange(subcategory.id, 'nameKey', value)}
                      required
                      error={subcategoryErrors[subcategory.id]?.nameKey}
                      helperText="Mínimo 3 caracteres"
                    />
                    <div className={cardStyles.editActions}>
                      <button
                        type="button"
                        onClick={() => handleCancelEdit(subcategory.id)}
                        className={cardStyles.cancelEditButton}
                      >
                        <X size={18} />
                        <span>Cancelar</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSaveEdit(subcategory.id)}
                        className={cardStyles.saveEditButton}
                      >
                        <Check size={18} />
                        <span>Guardar</span>
                      </button>
                    </div>
                  </div>
                ) : null
              }
              state={subcategory._state === 'normal' ? null : subcategory._state}
              isDeleted={isDeleted}
              onClick={() => onSubcategoryClick(subcategory)}
              onEdit={() => handleEdit(subcategory.id)}
              onDelete={() => onDeleteSubcategory(subcategory.id)}
              onUndo={() => onUndoDeleteSubcategory(subcategory.id)}
              showArrow={true}
              isEditing={isEditing}
            />
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
  onCancelEditSubcategory: PropTypes.func,
  onBack: PropTypes.func,
  itemCounts: PropTypes.object,
  isEditing: PropTypes.bool,
  categoryError: PropTypes.string,
  subcategoryErrors: PropTypes.object,
  onValidationError: PropTypes.func
};

export default SubcategoryView;
