import React from 'react';
import MetricsCardsSkeleton from './MetricsCardsSkeleton';
import ChartSkeleton from './ChartSkeleton';
import StatsSectionSkeleton from './StatsSectionSkeleton';
import styles from './WebMetricsSection.module.css';

const WebMetricsSectionSkeleton = () => {
  return (
    <>
      {/* Grid de métricas principales */}
      <MetricsCardsSkeleton />

      {/* Gráfico de visitas diarias */}
      <ChartSkeleton />

      {/* Estadísticas de dispositivos e idiomas */}
      <div className={styles.statsGrid}>
        <StatsSectionSkeleton />
        <StatsSectionSkeleton />
      </div>
    </>
  );
};

export default WebMetricsSectionSkeleton;
