import React from 'react';
import { ChevronRight, Edit3, Trash2, Undo2 } from 'lucide-react';
import styles from './MenuCard.module.css';

/**
 * Unified card component for Category, Subcategory, and Item views
 * Ensures consistent styling and dimensions across all menu entities
 */
const MenuCard = ({
  title,
  content,
  state = null, // 'new', 'edited', or null
  isDeleted = false,
  onClick,
  onEdit,
  onDelete,
  onUndo,
  showArrow = true,
  isEditing = false,
  disabled = false,
  icon = null
}) => {
  // Build card class names based on state
  const cardClasses = [
    styles.card,
    state === 'new' && styles.new,
    state === 'edited' && styles.edited,
    isDeleted && styles.deleted
  ].filter(Boolean).join(' ');

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
