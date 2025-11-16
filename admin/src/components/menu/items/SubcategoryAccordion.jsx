import React from 'react';
import PropTypes from 'prop-types';
import { Plus } from 'lucide-react';
import Accordion from '../accordion/Accordion';
import MenuTextField from '../fields/MenuTextField';
import ItemAccordion from './ItemAccordion';
import styles from './SubcategoryAccordion.module.css';

const SubcategoryAccordion = ({
  subcategory,
  categoryId,
  isExpanded,
  onToggle,
  onUpdate,
  onDelete,
  onUndoDelete,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
  onAddItem,
  onUpdateItem,
  onDeleteItem,
  onUndoDeleteItem,
  onMoveItemUp,
  onMoveItemDown,
  expandedItems,
  onToggleItem,
  isEditing = false,
  errors = {},
  headerButton = null
}) => {
  const handleFieldChange = (field, value) => {
    if (onUpdate) {
      onUpdate(subcategory.id, { [field]: value });
    }
  };

  const handleAddItem = () => {
    if (onAddItem && isEditing) {
      onAddItem(subcategory.id);
    }
  };

  return (
    <div>
      <Accordion
        id={subcategory.id}
        name={subcategory.nameKey || 'Sin nombre'}
        level="subcategory"
        isExpanded={isExpanded}
        onToggle={onToggle}
        onDelete={onDelete}
        onUndoDelete={onUndoDelete}
        onMoveUp={onMoveUp}
        onMoveDown={onMoveDown}
        canMoveUp={canMoveUp}
        canMoveDown={canMoveDown}
        state={subcategory._state || 'normal'}
        isEditing={isEditing}
        headerButton={headerButton}
      >
      <>
        <div className={styles.content}>
          {isEditing && (
            <MenuTextField
              label="Nombre de la subcategoría"
              value={subcategory.nameKey}
              onChange={(value) => handleFieldChange('nameKey', value)}
              readOnly={!isEditing || subcategory._state === 'deleted'}
              required
              error={errors.nameKey}
              helperText="Mínimo 3 caracteres"
            />
          )}

          <div className={styles.itemsSection}>
            {isEditing && (
              <div className={styles.itemsHeader}>
                <h4 className={styles.itemsTitle}>
                  Items
                </h4>
                {subcategory._state !== 'deleted' && (
                  <button
                    type="button"
                    className={styles.addButton}
                    onClick={handleAddItem}
                    title="Añadir item"
                  >
                    <Plus size={18} />
                  </button>
                )}
              </div>
            )}

            {subcategory.items && subcategory.items.length > 0 ? (
              <div className={styles.itemsList}>
                {subcategory.items.map((item, index) => (
                  <ItemAccordion
                    key={item.id}
                    item={item}
                    isExpanded={expandedItems?.[item.id]}
                    onToggle={() => onToggleItem?.(item.id)}
                    onUpdate={onUpdateItem}
                    onDelete={() => onDeleteItem?.(subcategory.id, item.id)}
                    onUndoDelete={() => onUndoDeleteItem?.(item.id)}
                    onMoveUp={() => onMoveItemUp?.(subcategory.id, item.id)}
                    onMoveDown={() => onMoveItemDown?.(subcategory.id, item.id)}
                    canMoveUp={index > 0}
                    canMoveDown={index < subcategory.items.length - 1}
                    isEditing={isEditing}
                    errors={errors.items?.[item.id] || {}}
                  />
                ))}
              </div>
            ) : (
              <div className={styles.emptyState}>
                <p>No hay items en esta subcategoría</p>
                {isEditing && subcategory._state !== 'deleted' && (
                  <button
                    type="button"
                    className={styles.emptyAddButton}
                    onClick={handleAddItem}
                  >
                    <Plus size={20} />
                    <span>Añadir primer item</span>
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

SubcategoryAccordion.propTypes = {
  subcategory: PropTypes.shape({
    id: PropTypes.string.isRequired,
    nameKey: PropTypes.string,
    orderIndex: PropTypes.number,
    items: PropTypes.array,
    createdAt: PropTypes.string,
    updatedAt: PropTypes.string,
    _state: PropTypes.oneOf(['normal', 'new', 'edited', 'deleted'])
  }).isRequired,
  categoryId: PropTypes.string,
  isExpanded: PropTypes.bool,
  onToggle: PropTypes.func,
  onUpdate: PropTypes.func,
  onDelete: PropTypes.func,
  onUndoDelete: PropTypes.func,
  onMoveUp: PropTypes.func,
  onMoveDown: PropTypes.func,
  canMoveUp: PropTypes.bool,
  canMoveDown: PropTypes.bool,
  onAddItem: PropTypes.func,
  onUpdateItem: PropTypes.func,
  onDeleteItem: PropTypes.func,
  onUndoDeleteItem: PropTypes.func,
  onMoveItemUp: PropTypes.func,
  onMoveItemDown: PropTypes.func,
  expandedItems: PropTypes.object,
  onToggleItem: PropTypes.func,
  isEditing: PropTypes.bool,
  errors: PropTypes.object,
  headerButton: PropTypes.node
};

export default SubcategoryAccordion;
