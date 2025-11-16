import React from 'react';
import PropTypes from 'prop-types';
import { Plus, Edit3, Trash2 } from 'lucide-react';
import styles from './StateIndicator.module.css';

const STATE_CONFIG = {
  new: {
    icon: Plus,
    label: 'Nuevo',
    color: 'success'
  },
  edited: {
    icon: Edit3,
    label: 'Editado',
    color: 'warning'
  },
  deleted: {
    icon: Trash2,
    label: 'Eliminado',
    color: 'error'
  },
  normal: {
    icon: null,
    label: '',
    color: 'normal'
  }
};

const StateIndicator = ({ state = 'normal', size = 16, showLabel = false }) => {
  const config = STATE_CONFIG[state] || STATE_CONFIG.normal;
  const IconComponent = config.icon;

  if (state === 'normal' || !IconComponent) {
    return null;
  }

  return (
    <div className={`${styles.indicator} ${styles[config.color]}`}>
      <IconComponent size={size} className={styles.icon} />
      {showLabel && <span className={styles.label}>{config.label}</span>}
    </div>
  );
};

StateIndicator.propTypes = {
  state: PropTypes.oneOf(['normal', 'new', 'edited', 'deleted']),
  size: PropTypes.number,
  showLabel: PropTypes.bool
};

export default StateIndicator;
