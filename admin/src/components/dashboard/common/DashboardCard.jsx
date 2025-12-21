import React from 'react';
import styles from './DashboardCard.module.css';

const DashboardCard = ({
  children,
  changeType = 'neutral',
  className = ''
}) => {
  return (
    <div className={`${styles.card} ${styles[changeType]} ${className}`}>
      {children}
    </div>
  );
};

export default DashboardCard;
