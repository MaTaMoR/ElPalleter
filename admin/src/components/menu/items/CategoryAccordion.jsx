import React from 'react';
import PropTypes from 'prop-types';
import { Plus } from 'lucide-react';
import Accordion from '../accordion/Accordion';
import MenuTextField from '../fields/MenuTextField';
import SubcategoryAccordion from './SubcategoryAccordion';
import styles from './CategoryAccordion.module.css';

const CategoryAccordion = ({
  category,
  isExpanded,
  onToggle,
  onUpdate,
  onDelete,
  onUndoDelete,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
  onAddSubcategory,
  onUpdateSubcategory,
  onDeleteSubcategory,
  onUndoDeleteSubcategory,
  onMoveSubcategoryUp,
  onMoveSubcategoryDown,
  onAddItem,
  onUpdateItem,
  onDeleteItem,
  onUndoDeleteItem,
  onMoveItemUp,
  onMoveItemDown,
  expandedSubcategories,
  expandedItems,
  onToggleSubcategory,
  onToggleItem,
  isEditing = false,
  errors = {}
}) => {
  const handleFieldChange = (field, value) => {
    if (onUpdate) {
      onUpdate(category.id, { [field]: value });
    }
  };

  const handleAddSubcategory = () => {
    if (onAddSubcategory && isEditing) {
      onAddSubcategory(category.id);
    }
  };

  return (
    <div>
      <Accordion
        id={category.id}
        name={category.nameKey || 'Sin nombre'}
        level="category"
        isExpanded={isExpanded}
        onToggle={onToggle}
        onDelete={onDelete}
        onUndoDelete={onUndoDelete}
        onMoveUp={onMoveUp}
        onMoveDown={onMoveDown}
        canMoveUp={canMoveUp}
        canMoveDown={canMoveDown}
        state={category._state || 'normal'}
        isEditing={isEditing}
        headerButton={null}
      >
      <>
        <div className={styles.content}>
          {isEditing && (
            <MenuTextField
              label="Nombre de la categoría"
              value={category.nameKey}
              onChange={(value) => handleFieldChange('nameKey', value)}
              readOnly={!isEditing || category._state === 'deleted'}
              required
              error={errors.nameKey}
              helperText="Mínimo 3 caracteres"
            />
          )}

          <div className={styles.subcategoriesSection}>
            {isEditing && (
              <div className={styles.subcategoriesHeader}>
                <h4 className={styles.subcategoriesTitle}>
                  Subcategorías
                </h4>
                {category._state !== 'deleted' && (
                  <button
                    type="button"
                    className={styles.addButton}
                    onClick={handleAddSubcategory}
                    title="Añadir subcategoría"
                  >
                    <Plus size={18} />
                  </button>
                )}
              </div>
            )}

            {category.subcategories && category.subcategories.length > 0 ? (
              <div className={styles.subcategoriesList}>
                {category.subcategories.map((subcategory, index) => (
                  <SubcategoryAccordion
                    key={subcategory.id}
                    subcategory={subcategory}
                    categoryId={category.id}
                    isExpanded={expandedSubcategories?.[subcategory.id]}
                    onToggle={() => onToggleSubcategory?.(subcategory.id)}
                    onUpdate={onUpdateSubcategory}
                    onDelete={() => onDeleteSubcategory?.(category.id, subcategory.id)}
                    onUndoDelete={() => onUndoDeleteSubcategory?.(subcategory.id)}
                    onMoveUp={() => onMoveSubcategoryUp?.(category.id, subcategory.id)}
                    onMoveDown={() => onMoveSubcategoryDown?.(category.id, subcategory.id)}
                    canMoveUp={index > 0}
                    canMoveDown={index < category.subcategories.length - 1}
                    onAddItem={onAddItem}
                    onUpdateItem={onUpdateItem}
                    onDeleteItem={onDeleteItem}
                    onUndoDeleteItem={onUndoDeleteItem}
                    onMoveItemUp={onMoveItemUp}
                    onMoveItemDown={onMoveItemDown}
                    expandedItems={expandedItems}
                    onToggleItem={onToggleItem}
                    isEditing={isEditing}
                    errors={errors.subcategories?.[subcategory.id] || {}}
                  />
                ))}
              </div>
            ) : (
              <div className={styles.emptyState}>
                <p>No hay subcategorías en esta categoría</p>
                {isEditing && category._state !== 'deleted' && (
                  <button
                    type="button"
                    className={styles.emptyAddButton}
                    onClick={handleAddSubcategory}
                  >
                    <Plus size={20} />
                    <span>Añadir primera subcategoría</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </>
    </Accordion>
    </div>
  );
};

CategoryAccordion.propTypes = {
  category: PropTypes.shape({
    id: PropTypes.string.isRequired,
    nameKey: PropTypes.string,
    orderIndex: PropTypes.number,
    subcategories: PropTypes.array,
    createdAt: PropTypes.string,
    updatedAt: PropTypes.string,
    _state: PropTypes.oneOf(['normal', 'new', 'edited', 'deleted'])
  }).isRequired,
  isExpanded: PropTypes.bool,
  onToggle: PropTypes.func,
  onUpdate: PropTypes.func,
  onDelete: PropTypes.func,
  onUndoDelete: PropTypes.func,
  onMoveUp: PropTypes.func,
  onMoveDown: PropTypes.func,
  canMoveUp: PropTypes.bool,
  canMoveDown: PropTypes.bool,
  onAddSubcategory: PropTypes.func,
  onUpdateSubcategory: PropTypes.func,
  onDeleteSubcategory: PropTypes.func,
  onUndoDeleteSubcategory: PropTypes.func,
  onMoveSubcategoryUp: PropTypes.func,
  onMoveSubcategoryDown: PropTypes.func,
  onAddItem: PropTypes.func,
  onUpdateItem: PropTypes.func,
  onDeleteItem: PropTypes.func,
  onUndoDeleteItem: PropTypes.func,
  onMoveItemUp: PropTypes.func,
  onMoveItemDown: PropTypes.func,
  expandedSubcategories: PropTypes.object,
  expandedItems: PropTypes.object,
  onToggleSubcategory: PropTypes.func,
  onToggleItem: PropTypes.func,
  isEditing: PropTypes.bool,
  errors: PropTypes.object
};

export default CategoryAccordion;
