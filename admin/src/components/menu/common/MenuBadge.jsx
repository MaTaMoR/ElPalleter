import React from 'react';
import styles from './MenuBadge.module.css';

/**
 * Badge component for displaying counts with labels
 * Used in category and subcategory cards
 */
const MenuBadge = ({ icon: Icon, count, label }) => {
  return (
    <span className={styles.badge}>
      {Icon && <Icon size={14} />}
      <span>{count} {label}</span>
    </span>
  );
};

export default MenuBadge;
