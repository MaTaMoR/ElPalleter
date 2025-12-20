import React from 'react';
import Skeleton from '../../common/Skeleton';
import styles from './MetricCard.module.css';

/**
 * Skeleton para MetricCard - muestra un placeholder mientras carga
 */
const MetricCardSkeleton = () => {
  return (
    <div className={styles.metricCard}>
      <div className={styles.cardContent}>
        <div className={styles.cardHeader}>
          <div className={styles.iconTitleWrapper}>
            <div className={styles.iconContainer}>
              <Skeleton variant="circle" width="20px" height="20px" />
            </div>
            <Skeleton variant="text" width="100px" height="1rem" />
          </div>

          <div className={styles.changeBadge}>
            <Skeleton variant="text" width="50px" height="1rem" />
          </div>
        </div>

        <div className={styles.cardValue}>
          <Skeleton variant="text" width="120px" height="2.5rem" />
        </div>

        <div className={styles.cardFooter}>
          <Skeleton variant="text" width="150px" height="0.875rem" />
        </div>
      </div>
    </div>
  );
};

export default MetricCardSkeleton;
