import React from 'react';
import PropTypes from 'prop-types';
import Accordion from '../accordion/Accordion';
import MenuTextField from '../fields/MenuTextField';
import MenuPriceField from '../fields/MenuPriceField';
import MenuToggleField from '../fields/MenuToggleField';
import { CheckCircle2, XCircle } from 'lucide-react';
import styles from './ItemAccordion.module.css';

const ItemAccordion = ({
  item,
  isExpanded,
  onToggle,
  onUpdate,
  onDelete,
  onUndoDelete,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
  isEditing = false,
  errors = {},
  headerButton = null
}) => {
  const handleFieldChange = (field, value) => {
    if (onUpdate) {
      onUpdate(item.id, { [field]: value });
    }
  };

  // Render as card in read-only mode
  if (!isEditing) {
    return (
      <div className={`${styles.itemCard} ${item._state ? styles[item._state] : ''}`}>
        <div className={styles.cardHeader}>
          <div className={styles.cardTitle}>
            <h4 className={styles.itemName}>{item.nameKey || 'Sin nombre'}</h4>
            <span className={styles.itemPrice}>
              {item.price ? `${parseFloat(item.price).toFixed(2)}€` : 'N/A'}
            </span>
          </div>
          <div className={styles.availabilityBadge}>
            {item.available ? (
              <>
                <CheckCircle2 size={16} className={styles.availableIcon} />
                <span>Disponible</span>
              </>
            ) : (
              <>
                <XCircle size={16} className={styles.unavailableIcon} />
                <span>No disponible</span>
              </>
            )}
          </div>
        </div>

        {item.descriptionKey && (
          <p className={styles.cardDescription}>{item.descriptionKey}</p>
        )}
      </div>
    );
  }

  // Render as accordion in edit mode
  return (
    <div>
      <Accordion
        id={item.id}
        name={item.nameKey || 'Sin nombre'}
        level="item"
        isExpanded={isExpanded}
        onToggle={onToggle}
        onDelete={onDelete}
        onUndoDelete={onUndoDelete}
        onMoveUp={onMoveUp}
        onMoveDown={onMoveDown}
        canMoveUp={canMoveUp}
        canMoveDown={canMoveDown}
        state={item._state || 'normal'}
        isEditing={isEditing}
        headerButton={headerButton}
      >
      <div className={styles.content}>
        <div className={styles.fieldsGrid}>
          <MenuTextField
            label="Nombre del plato"
            value={item.nameKey}
            onChange={(value) => handleFieldChange('nameKey', value)}
            readOnly={!isEditing || item._state === 'deleted'}
            required
            error={errors.nameKey}
            helperText="Mínimo 3 caracteres"
          />

          <MenuTextField
            label="Descripción"
            value={item.descriptionKey}
            onChange={(value) => handleFieldChange('descriptionKey', value)}
            readOnly={!isEditing || item._state === 'deleted'}
            multiline
            error={errors.descriptionKey}
            helperText="Descripción detallada del plato"
          />

          <MenuPriceField
            label="Precio"
            value={item.price}
            onChange={(value) => handleFieldChange('price', value)}
            readOnly={!isEditing || item._state === 'deleted'}
            required
            error={errors.price}
            helperText="Precio en euros"
          />

          <MenuToggleField
            label="Disponible"
            value={item.available}
            onChange={(value) => handleFieldChange('available', value)}
            readOnly={!isEditing || item._state === 'deleted'}
            helperText="Marcar si el plato está disponible actualmente"
          />
        </div>
      </div>
    </Accordion>
    </div>
  );
};

ItemAccordion.propTypes = {
  item: PropTypes.shape({
    id: PropTypes.string.isRequired,
    nameKey: PropTypes.string,
    descriptionKey: PropTypes.string,
    price: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    available: PropTypes.bool,
    orderIndex: PropTypes.number,
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
  isEditing: PropTypes.bool,
  errors: PropTypes.object,
  headerButton: PropTypes.node
};

export default ItemAccordion;
