import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { Plus, ArrowLeft, Check, X } from 'lucide-react';
import Button from '../../common/Button';
import MenuTextField from '../fields/MenuTextField';
import MenuPriceField from '../fields/MenuPriceField';
import MenuCheckbox from '../fields/MenuCheckbox';
import MenuCard from '../common/MenuCard';
import styles from './ItemView.module.css';
import cardStyles from '../common/MenuCard.module.css';

const ItemView = ({
  items,
  subcategoryName,
  subcategory,
  onAddItem,
  onUpdateItem,
  onUpdateSubcategory,
  onDeleteItem,
  onUndoDeleteItem,
  onBack,
  isEditing,
  errors = {},
  subcategoryError,
  autoEditItemId
}) => {
  const [editingItemId, setEditingItemId] = useState(null);
  const itemRefs = useRef({});

  const handleEdit = (itemId) => {
    setEditingItemId(itemId);
  };

  const handleCancelEdit = () => {
    setEditingItemId(null);
  };

  const handleSaveEdit = () => {
    setEditingItemId(null);
  };

  const handleFieldChange = (itemId, field, value) => {
    if (onUpdateItem) {
      onUpdateItem(itemId, { [field]: value });
    }
  };

  // Handle auto-edit and auto-scroll for newly created items
  useEffect(() => {
    if (autoEditItemId && isEditing) {
      setEditingItemId(autoEditItemId);
      // Scroll to the new item after a short delay to ensure it's rendered
      setTimeout(() => {
        const itemElement = itemRefs.current[autoEditItemId];
        if (itemElement) {
          itemElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
    }
  }, [autoEditItemId, isEditing]);

  return (
    <div className={styles.container}>
      {onBack && (
        <button onClick={onBack} className={styles.backButton}>
          <ArrowLeft size={18} />
          <span>Volver</span>
        </button>
      )}

      <div className={styles.pageTitle}>
        <h1 className={styles.pageTitleName}>{subcategoryName}</h1>
        {isEditing && (
          <Button
            variant="primary"
            icon={Plus}
            onClick={onAddItem}
            className={styles.addButtonHeader}
          >
            Añadir
          </Button>
        )}
      </div>

      {isEditing && subcategory && onUpdateSubcategory && (
        <div className={styles.subcategoryEditSection}>
          <MenuTextField
            label="Nombre de la subcategoría"
            value={subcategory.nameKey || ''}
            onChange={(value) => onUpdateSubcategory(subcategory.id, { nameKey: value })}
            required
            error={subcategoryError}
            helperText="Mínimo 3 caracteres"
          />
        </div>
      )}

      <div className={styles.itemsList}>
        {items.length === 0 ? (
          <div className={styles.emptyState}>
            <p>No hay items en esta subcategoría</p>
          </div>
        ) : (
          items.map((item) => {
            const isEditingItem = isEditing && editingItemId === item.id;
            const isDeleted = item._state === 'deleted';

            return (
              <div
                key={item.id}
                ref={(el) => { itemRefs.current[item.id] = el; }}
              >
                <MenuCard
                  title={item.nameKey || 'Sin nombre'}
                  content={
                    <div className={styles.itemContentArea}>
                      {item.descriptionKey && (
                        <p className={styles.itemDescription}>{item.descriptionKey}</p>
                      )}
                      <div className={styles.itemMeta}>
                        <span className={styles.itemPrice}>{item.price || '0.00'}€</span>
                        {item.available !== undefined && (
                          <span className={`${styles.availabilityBadge} ${item.available ? styles.available : styles.unavailable}`}>
                            {item.available ? '✓ Disponible' : '✗ No disponible'}
                          </span>
                        )}
                      </div>
                    </div>
                  }
                  editForm={
                    isEditingItem ? (
                      <div className={cardStyles.editForm}>
                        <div className={styles.fieldsGrid}>
                          <MenuTextField
                            label="Nombre del item"
                            value={item.nameKey || ''}
                            onChange={(value) => handleFieldChange(item.id, 'nameKey', value)}
                            required
                            error={errors[item.id]?.nameKey}
                            helperText="Mínimo 3 caracteres"
                          />
                          <MenuPriceField
                            label="Precio"
                            value={item.price || ''}
                            onChange={(value) => handleFieldChange(item.id, 'price', value)}
                            min={0}
                            required
                            error={errors[item.id]?.price}
                          />
                        </div>
                        <MenuTextField
                          label="Descripción"
                          value={item.descriptionKey || ''}
                          onChange={(value) => handleFieldChange(item.id, 'descriptionKey', value)}
                          multiline
                        />
                        <MenuCheckbox
                          label="Disponible"
                          checked={item.available !== false}
                          onChange={(checked) => handleFieldChange(item.id, 'available', checked)}
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
                  state={item._state === 'normal' ? null : item._state}
                  isDeleted={isDeleted}
                  onClick={null}
                  onEdit={() => handleEdit(item.id)}
                  onDelete={() => onDeleteItem(item.id)}
                  onUndo={() => onUndoDeleteItem(item.id)}
                  showArrow={false}
                  isEditing={isEditing}
                />
              </div>
            );
          })
        )}
      </div>

    </div>
  );
};

ItemView.propTypes = {
  items: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      nameKey: PropTypes.string,
      descriptionKey: PropTypes.string,
      price: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      available: PropTypes.bool,
      _state: PropTypes.oneOf(['normal', 'new', 'edited', 'deleted'])
    })
  ).isRequired,
  subcategoryName: PropTypes.string.isRequired,
  subcategory: PropTypes.object,
  onAddItem: PropTypes.func,
  onUpdateItem: PropTypes.func,
  onUpdateSubcategory: PropTypes.func,
  onDeleteItem: PropTypes.func,
  onUndoDeleteItem: PropTypes.func,
  onBack: PropTypes.func,
  isEditing: PropTypes.bool,
  errors: PropTypes.object,
  subcategoryError: PropTypes.string,
  autoEditItemId: PropTypes.string
};

export default ItemView;
