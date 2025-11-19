import React from 'react';
import { ChevronRight, Edit3, Trash2, Undo2, AlertCircle, ChevronUp, ChevronDown } from 'lucide-react';
import styles from './MenuCard.module.css';

/**
 * Unified card component for Category, Subcategory, and Item views
 * Ensures consistent styling and dimensions across all menu entities
 * Supports both view and edit modes
 */
const MenuCard = ({
  title,
  content,
  editForm = null, // Optional: JSX for edit mode form
  state = null, // 'new', 'edited', or null
  isDeleted = false,
  onClick,
  onEdit,
  onDelete,
  onUndo,
  onMoveUp,
  onMoveDown,
  canMoveUp = true,
  canMoveDown = true,
  showArrow = true,
  isEditing = false,
  disabled = false,
  icon = null,
  hasValidationErrors = false // Show warning icon if true
}) => {
  // Build card class names based on state
  const cardClasses = [
    styles.card,
    state === 'new' && styles.new,
    state === 'edited' && styles.edited,
    isDeleted && styles.deleted
  ].filter(Boolean).join(' ');

  // If editForm is provided, render edit mode
  if (editForm) {
    return (
      <div className={cardClasses}>
        {editForm}
      </div>
    );
  }

  // Otherwise, render view mode
  return (
    <div className={cardClasses}>
      <div className={styles.cardLayout}>
        <button
          type="button"
          className={styles.cardButton}
          onClick={onClick}
          disabled={disabled || isDeleted}
        >
          <div className={styles.cardInfo}>
            <h3 className={styles.cardTitle}>{title}</h3>
            {content && <div className={styles.cardContentArea}>{content}</div>}
          </div>
          {icon && <div className={styles.cardIcon}>{icon}</div>}
        </button>

        <div className={styles.cardActions}>
          {hasValidationErrors && (
            <div className={styles.warningIcon} title="Hay errores de validación">
              <AlertCircle size={20} />
            </div>
          )}
          {isEditing && !isDeleted && (onMoveUp || onMoveDown) && (
            <div className={styles.moveButtonsContainer}>
              {onMoveUp && (
                <button
                  type="button"
                  className={`${styles.actionButton} ${styles.moveButton}`}
                  onClick={onMoveUp}
                  disabled={!canMoveUp}
                  title="Mover arriba"
                >
                  <ChevronUp size={18} />
                </button>
              )}
              {onMoveDown && (
                <button
                  type="button"
                  className={`${styles.actionButton} ${styles.moveButton}`}
                  onClick={onMoveDown}
                  disabled={!canMoveDown}
                  title="Mover abajo"
                >
                  <ChevronDown size={18} />
                </button>
              )}
            </div>
          )}
          {isEditing && (
            isDeleted ? (
              <button
                type="button"
                className={`${styles.actionButton} ${styles.undoButton}`}
                onClick={onUndo}
                title="Deshacer eliminación"
              >
                <Undo2 size={18} />
              </button>
            ) : (
              <>
                <button
                  type="button"
                  className={`${styles.actionButton} ${styles.editButton}`}
                  onClick={onEdit}
                  title="Editar"
                >
                  <Edit3 size={18} />
                </button>
                <button
                  type="button"
                  className={`${styles.actionButton} ${styles.deleteButton}`}
                  onClick={onDelete}
                  title="Eliminar"
                >
                  <Trash2 size={18} />
                </button>
              </>
            )
          )}
          {showArrow && (
            <button
              type="button"
              className={styles.arrowButton}
              onClick={onClick}
              disabled={disabled || isDeleted}
              title="Ver detalles"
            >
              <ChevronRight size={18} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default MenuCard;
