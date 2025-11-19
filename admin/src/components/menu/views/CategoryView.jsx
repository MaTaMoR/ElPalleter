import React, { useState } from 'react';
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

          return (
            <MenuCard
              key={category.id}
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
                        onClick={handleCancelEdit}
                        className={cardStyles.cancelEditButton}
                      >
                        <X size={18} />
                        <span>Cancelar</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveEdit}
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
