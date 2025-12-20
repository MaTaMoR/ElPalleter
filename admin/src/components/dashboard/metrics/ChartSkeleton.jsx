import React from 'react';
import Skeleton from '../../common/Skeleton';
import styles from './DailyVisitsChart.module.css';

/**
 * Skeleton para el gráfico de visitas diarias
 */
const ChartSkeleton = () => {
  return (
    <div className={styles.chartSection}>
      <div className={styles.chartHeader}>
        <Skeleton variant="text" width="30%" height="1.5rem" />
      </div>
      <div className={styles.chartContainer}>
        <Skeleton variant="rectangular" width="100%" height="300px" />
      </div>
    </div>
  );
};

export default ChartSkeleton;
