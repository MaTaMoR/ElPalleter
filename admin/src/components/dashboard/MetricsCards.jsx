import React from 'react';
import MetricCard from './MetricCard';
import { formatDuration, formatPercentage } from '@utils/analyticsUtils';

import styles from './MetricsCards.module.css';

const MetricsCards = ({ metrics, changes }) => {
  return (
    <div className={styles.metricsGrid}>
      <MetricCard
        title="Visitantes Únicos"
        value={metrics.uniqueVisitors}
        change={changes.uniqueVisitors}
        icon="👥"
      />

      <MetricCard
        title="Visitas Totales"
        value={metrics.totalVisits}
        change={changes.totalVisits}
        icon="📊"
      />

      <MetricCard
        title="Duración Media"
        value={metrics.averageDuration}
        formatter={formatDuration}
        change={changes.averageDuration}
        icon="⏱️"
      />

      <MetricCard
        title="Tráfico Móvil"
        value={metrics.mobilePercentage}
        formatter={formatPercentage}
        change={changes.mobilePercentage}
        icon="📱"
      />

      <MetricCard
        title="Engagement"
        value={metrics.engagementRate}
        formatter={formatPercentage}
        change={changes.engagementRate}
        icon="🎯"
      />

      <MetricCard
        title="Sección Top"
        value={metrics.topSection}
        change={changes.topSection}
        icon="⭐"
      />
    </div>
  );
};

export default MetricsCards;