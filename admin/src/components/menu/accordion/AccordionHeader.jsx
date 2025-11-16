import React from 'react';
import PropTypes from 'prop-types';
import { ChevronDown, ChevronUp, Trash2, ArrowUp, ArrowDown, Undo2 } from 'lucide-react';
import styles from './AccordionHeader.module.css';

const AccordionHeader = ({
  name,
  level,
  isExpanded,
  onToggle,
  onDelete,
  onUndoDelete,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
  showDelete,
  showMoveButtons,
  state,
  isEditing,
  headerButton
}) => {
  const handleHeaderClick = (e) => {
    // No expandir/colapsar si se hace clic en un botón de acción
    if (e.target.closest(`.${styles.actionButton}`)) {
      return;
    }
    onToggle();
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete();
    }
  };

  const handleUndoDelete = (e) => {
    e.stopPropagation();
    if (onUndoDelete) {
      onUndoDelete();
    }
  };

  const handleMoveUp = (e) => {
    e.stopPropagation();
    if (onMoveUp) {
      onMoveUp();
    }
  };

  const handleMoveDown = (e) => {
    e.stopPropagation();
    if (onMoveDown) {
      onMoveDown();
    }
  };

  return (
    <div
      className={`${styles.header} ${state ? styles[state] : ''} ${level === 'category' ? styles.categoryHeader : ''}`}
      onClick={handleHeaderClick}
    >
      <div className={styles.leftSection}>
        <span className={styles.name}>{name}</span>
      </div>

      <div className={styles.rightSection}>
        {isEditing && showMoveButtons && (
          <>
            <button
              type="button"
              className={`${styles.actionButton} ${styles.moveButton}`}
              onClick={handleMoveUp}
              disabled={!canMoveUp}
              title="Mover arriba"
              aria-label="Mover arriba"
            >
              <ArrowUp size={18} />
            </button>
            <button
              type="button"
              className={`${styles.actionButton} ${styles.moveButton}`}
              onClick={handleMoveDown}
              disabled={!canMoveDown}
              title="Mover abajo"
              aria-label="Mover abajo"
            >
              <ArrowDown size={18} />
            </button>
          </>
        )}

        {isEditing && showDelete && (
          state === 'deleted' ? (
            <button
              type="button"
              className={`${styles.actionButton} ${styles.undoButton}`}
              onClick={handleUndoDelete}
              title="Deshacer eliminación"
              aria-label="Deshacer eliminación"
            >
              <Undo2 size={18} />
            </button>
          ) : (
            <button
              type="button"
              className={`${styles.actionButton} ${styles.deleteButton}`}
              onClick={handleDelete}
              title="Eliminar"
              aria-label="Eliminar"
            >
              <Trash2 size={18} />
            </button>
          )
        )}

        {headerButton && isEditing ? (
          <div onClick={(e) => e.stopPropagation()}>
            {headerButton}
          </div>
        ) : (
          <button
            type="button"
            className={`${styles.actionButton} ${styles.expandButton}`}
            onClick={onToggle}
            aria-label={isExpanded ? 'Colapsar' : 'Expandir'}
          >
            {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
        )}
      </div>
    </div>
  );
};

AccordionHeader.propTypes = {
  name: PropTypes.string.isRequired,
  level: PropTypes.oneOf(['category', 'subcategory', 'item']),
  isExpanded: PropTypes.bool.isRequired,
  onToggle: PropTypes.func.isRequired,
  onDelete: PropTypes.func,
  onUndoDelete: PropTypes.func,
  onMoveUp: PropTypes.func,
  onMoveDown: PropTypes.func,
  canMoveUp: PropTypes.bool,
  canMoveDown: PropTypes.bool,
  showDelete: PropTypes.bool,
  showMoveButtons: PropTypes.bool,
  state: PropTypes.oneOf(['normal', 'new', 'edited', 'deleted']),
  isEditing: PropTypes.bool,
  headerButton: PropTypes.node
};

export default AccordionHeader;
