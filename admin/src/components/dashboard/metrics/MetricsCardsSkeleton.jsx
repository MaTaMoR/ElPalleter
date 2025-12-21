import React from 'react';
import MetricCardSkeleton from './MetricCardSkeleton';
import styles from './MetricsCards.module.css';

/**
 * Skeleton para MetricsCards - muestra 6 placeholders mientras cargan las métricas
 */
const MetricsCardsSkeleton = () => {
  return (
    <div className={styles.metricsGrid}>
      {[...Array(6)].map((_, index) => (
        <MetricCardSkeleton key={index} />
      ))}
    </div>
  );
};

export default MetricsCardsSkeleton;
