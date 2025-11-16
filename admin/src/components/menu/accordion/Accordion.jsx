import React, { useState } from 'react';
import PropTypes from 'prop-types';
import AccordionHeader from './AccordionHeader';
import AccordionContent from './AccordionContent';
import styles from './Accordion.module.css';

const Accordion = ({
  id,
  name,
  level = 'item', // 'category' | 'subcategory' | 'item'
  isExpanded: controlledExpanded,
  onToggle,
  onDelete,
  onUndoDelete,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
  showDelete = true,
  showMoveButtons = true,
  state = 'normal', // 'normal' | 'new' | 'edited' | 'deleted'
  isEditing = false,
  headerButton = null,
  children
}) => {
  const [internalExpanded, setInternalExpanded] = useState(false);

  // Usar expansión controlada si se proporciona, sino usar estado interno
  const isExpanded = controlledExpanded !== undefined ? controlledExpanded : internalExpanded;

  const handleToggle = () => {
    // No permitir expandir si está marcado como eliminado
    if (state === 'deleted') return;

    if (onToggle) {
      onToggle(id);
    } else {
      setInternalExpanded(!internalExpanded);
    }
  };

  return (
    <div
      className={`${styles.accordion} ${styles[state]} ${isExpanded ? styles.expanded : ''}`}
      data-accordion-id={id}
      data-level={level}
    >
      <AccordionHeader
        name={name}
        level={level}
        isExpanded={isExpanded}
        onToggle={handleToggle}
        onDelete={onDelete}
        onUndoDelete={onUndoDelete}
        onMoveUp={onMoveUp}
        onMoveDown={onMoveDown}
        canMoveUp={canMoveUp}
        canMoveDown={canMoveDown}
        showDelete={showDelete}
        showMoveButtons={showMoveButtons}
        state={state}
        isEditing={isEditing}
        headerButton={headerButton}
      />

      <AccordionContent isExpanded={isExpanded}>
        {children}
      </AccordionContent>
    </div>
  );
};

Accordion.propTypes = {
  id: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  level: PropTypes.oneOf(['category', 'subcategory', 'item']),
  isExpanded: PropTypes.bool,
  onToggle: PropTypes.func,
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
  headerButton: PropTypes.node,
  children: PropTypes.node
};

export default Accordion;
