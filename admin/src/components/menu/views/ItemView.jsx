import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Plus, Trash2, Undo2, ArrowLeft, Edit3, Check, X, Search } from 'lucide-react';
import MenuTextField from '../fields/MenuTextField';
import MenuNumberField from '../fields/MenuNumberField';
import MenuCheckbox from '../fields/MenuCheckbox';
import styles from './ItemView.module.css';

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
  subcategoryError
}) => {
  const [editingItemId, setEditingItemId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

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

  const getFilteredItems = () => {
    if (!searchTerm) return items;

    return items.filter(item =>
      (item.nameKey || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.descriptionKey || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const filteredItems = getFilteredItems();

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

      <div className={styles.header}>
        <h2 className={styles.title}>Items</h2>
        {isEditing && (
          <button
            type="button"
            onClick={onAddItem}
            className={styles.addButtonHeader}
          >
            <Plus size={18} />
            <span>Añadir</span>
          </button>
        )}
        <span className={styles.count}>
          {filteredItems.length} items
          {searchTerm && ' (filtrados)'}
        </span>
      </div>

      {items.length > 0 && (
        <div className={styles.searchBar}>
          <Search size={18} className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Buscar items..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className={styles.clearSearch}
              aria-label="Limpiar búsqueda"
            >
              <X size={16} />
            </button>
          )}
        </div>
      )}

      <div className={styles.itemsList}>
        {filteredItems.length === 0 ? (
          <div className={styles.emptyState}>
            <p>
              {searchTerm
                ? 'No se encontraron items con ese criterio'
                : 'No hay items en esta subcategoría'}
            </p>
          </div>
        ) : (
          filteredItems.map((item) => {
            const isEditingItem = isEditing && editingItemId === item.id;
            const isDeleted = item._state === 'deleted';

            return (
              <div
                key={item.id}
                className={`${styles.itemCard} ${item._state ? styles[item._state] : ''}`}
              >
                {isEditingItem ? (
                  // Modo edición
                  <div className={styles.editForm}>
                    <div className={styles.fieldsGrid}>
                      <MenuTextField
                        label="Nombre del item"
                        value={item.nameKey || ''}
                        onChange={(value) => handleFieldChange(item.id, 'nameKey', value)}
                        required
                        error={errors[item.id]?.nameKey}
                        helperText="Mínimo 3 caracteres"
                      />
                      <MenuNumberField
                        label="Precio (€)"
                        value={item.price || ''}
                        onChange={(value) => handleFieldChange(item.id, 'price', value)}
                        min={0}
                        step={0.01}
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
                  <div className={styles.itemContent}>
                    <div className={styles.itemInfo}>
                      <h3 className={styles.itemName}>{item.nameKey || 'Sin nombre'}</h3>
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

                    {isEditing && (
                      <div className={styles.itemActions}>
                        {isDeleted ? (
                          <button
                            type="button"
                            onClick={() => onUndoDeleteItem(item.id)}
                            className={`${styles.actionButton} ${styles.undoButton}`}
                            title="Deshacer eliminación"
                          >
                            <Undo2 size={18} />
                          </button>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => handleEdit(item.id)}
                              className={`${styles.actionButton} ${styles.editButton}`}
                              title="Editar item"
                            >
                              <Edit3 size={18} />
                            </button>
                            <button
                              type="button"
                              onClick={() => onDeleteItem(item.id)}
                              className={`${styles.actionButton} ${styles.deleteButton}`}
                              title="Eliminar item"
                            >
                              <Trash2 size={18} />
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                )}
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
  subcategoryError: PropTypes.string
};

export default ItemView;
