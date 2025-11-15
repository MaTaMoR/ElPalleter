import React from 'react';

import styles from './MetricCard.module.css';

const MetricCard = ({ 
  title, 
  value, 
  formatter = (v) => v,
  change,
  icon 
}) => {
  return (
    <div className={styles.metricCard}>
      <div className={styles.cardHeader}>
        {icon && <span className={styles.cardIcon}>{icon}</span>}
        <span className={styles.cardTitle}>{title}</span>
      </div>
      
      <div className={styles.cardValue}>
        {formatter(value)}
      </div>
      
      {change?.showChange && (
        <div className={`${styles.cardChange} ${styles[change.changeType]}`}>
          {change.displayText}
        </div>
      )}
    </div>
  );
};

export default MetricCard;