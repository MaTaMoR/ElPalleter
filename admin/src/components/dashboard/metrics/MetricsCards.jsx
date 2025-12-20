import React from 'react';
import MetricCard from './MetricCard';
import { formatDuration, formatPercentage } from '@utils/analyticsUtils';
import { Users, MousePointerClick, Clock, Smartphone, TrendingUp, Star } from 'lucide-react';
import styles from './MetricsCards.module.css';

const MetricsCards = ({ metrics, changes }) => {
  return (
    <div className={styles.metricsGrid}>
      <MetricCard
        title="Visitas Únicas"
        value={metrics.uniqueVisitors}
        change={changes.uniqueVisitors}
        icon={Users}
      />
      <MetricCard
        title="Visitas Totales"
        value={metrics.totalVisits}
        change={changes.totalVisits}
        icon={MousePointerClick}
      />
      <MetricCard
        title="Duración Media"
        value={metrics.averageDuration}
        formatter={formatDuration}
        change={changes.averageDuration}
        icon={Clock}
      />
      <MetricCard
        title="Tráfico Móvil"
        value={metrics.mobilePercentage}
        formatter={formatPercentage}
        change={changes.mobilePercentage}
        icon={Smartphone}
      />
      <MetricCard
        title="Engagement"
        value={metrics.engagementRate}
        formatter={formatPercentage}
        change={changes.engagementRate}
        icon={TrendingUp}
      />
      <MetricCard
        title="Sección Top"
        value={metrics.topSection}
        change={changes.topSection}
        icon={Star}
      />
    </div>
  );
};

export default MetricsCards;