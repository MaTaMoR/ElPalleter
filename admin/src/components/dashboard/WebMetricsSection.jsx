import React, { useMemo } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import RefreshButton from '../refreshbutton/RefreshButton';
import DeviceStatsSection from './DeviceStatsSection';
import LanguageStatsSection from './LanguageStatsSection';
import styles from './WebMetricsSection.module.css'; // ← Cambio aquí
import { 
  formatDuration, 
  formatPercentage, 
  formatNumber, 
  formatTimeAgo,
  calculateMobilePercentage,
  getMostViewedSection,
  calculateEngagementRate,
  calculateAllMetricChanges
} from '@utils/analyticsUtils';

const getBadgeText = (refreshing, lastUpdated) => {
  const baseText = 'Esta semana';
  if (refreshing) return `${baseText} (actualizando...)`;
  if (lastUpdated) return `${baseText} (${formatTimeAgo(lastUpdated)})`;
  return baseText;
};

const getTrendIcon = (changeType) => {
  switch (changeType) {
    case 'positive':
      return <TrendingUp size={14} />;
    case 'negative':
      return <TrendingDown size={14} />;
    default:
      return <Minus size={14} />;
  }
};

const WebMetricsSection = ({ analyticsData, previousData, loading, refreshing, error, onRefresh, lastUpdated }) => {

  const processedData = useMemo(() => {
    if (!analyticsData) return null;

    const totalVisits = analyticsData.totalVisits || 0;
    const uniqueVisitors = analyticsData.uniqueVisitors || 0;
    const avgDuration = analyticsData.averageDuration || 0;
    const mobilePercentage = calculateMobilePercentage(analyticsData.deviceStats, totalVisits);
    const engagementRate = calculateEngagementRate(analyticsData.bounceRate);
    const topSection = getMostViewedSection(analyticsData.sectionStats);

    const changes = calculateAllMetricChanges(analyticsData, previousData);

    return [
      {
        value: formatNumber(uniqueVisitors),
        label: 'Visitantes únicos',
        change: changes.uniqueVisitors.displayText,
        changeType: changes.uniqueVisitors.changeType
      },
      {
        value: formatNumber(totalVisits),
        label: 'Visitas totales',
        change: changes.totalVisits.displayText,
        changeType: changes.totalVisits.changeType
      },
      {
        value: formatDuration(avgDuration),
        label: 'Tiempo promedio',
        change: changes.averageDuration.displayText,
        changeType: changes.averageDuration.changeType
      },
      {
        value: formatPercentage(mobilePercentage),
        label: 'Tráfico móvil',
        change: changes.mobilePercentage.displayText,
        changeType: changes.mobilePercentage.changeType
      },
      {
        value: formatPercentage(engagementRate),
        label: 'Tasa de engagement',
        change: changes.engagementRate.displayText,
        changeType: changes.engagementRate.changeType
      },
      {
        value: topSection.name,
        label: 'Sección más vista',
        change: changes.topSection.displayText,
        changeType: changes.topSection.changeType
      }
    ];
  }, [analyticsData, previousData]);

  const content = useMemo(() => {
    if (loading) {
      return (
        <div className={styles.metricsContent}>
          <div className={styles.metricsGrid}>
            {[...Array(6)].map((_, index) => (
              <div key={index} className={`${styles.metricCard} ${styles.loading}`}>
                <div className={styles.metricSkeleton}></div>
              </div>
            ))}
          </div>
          <div className={styles.deviceStatsContainer}>
            <div className={styles.deviceStatsSkeleton}></div>
          </div>
        </div>
      );
    }

    if (loading === false && error && !processedData && !refreshing) {
      return (
        <div className={styles.errorMessage}>
          <p>Error cargando métricas: {error}</p>
          <button onClick={onRefresh}>Reintentar</button>
        </div>
      );
    }

    if (!processedData) {
      return (
        <div className={styles.noDataMessage}>
          <p>No hay datos de métricas disponibles</p>
          <button onClick={onRefresh} disabled={refreshing}>
            {refreshing ? 'Cargando...' : 'Cargar datos'}
          </button>
        </div>
      );
    }

    return (
      <>
        {error && (
          <div className={styles.errorBanner}>
            <p>⚠️ Hubo un problema al actualizar. Mostrando datos anteriores.</p>
          </div>
        )}
        
        <div className={styles.metricsContent}>
          <div className={styles.metricsGrid}>
            {processedData.map((metric, index) => (
              <div key={index} className={styles.metricCard}>
                <div className={styles.metricValue}>{metric.value}</div>
                <div className={styles.metricLabel}>{metric.label}</div>
                {metric.showChange && (
                  <span className={`${styles.metricChange} ${styles[metric.changeType]}`}>
                    {getTrendIcon(metric.changeType)}
                    {metric.change}
                  </span>
                )}
              </div>
            ))}
          </div>
          
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
          <div className={styles.deviceStatsContainer}>
            <DeviceStatsSection analyticsData={analyticsData} />
          </div>
          
          <div className={styles.deviceStatsContainer}>
            <LanguageStatsSection analyticsData={analyticsData} />
          </div>
        </div>
        </div>
      </>
    );
  }, [loading, error, processedData, refreshing, onRefresh, analyticsData]);

  return (
    <div className={`${styles.section} ${refreshing ? styles.refreshing : ''}`}>
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>Métricas de la Web</h2>
        <div className={styles.sectionActions}>
          <span className={`${styles.statusBadge} ${styles.warning} ${refreshing ? styles.updating : ''}`}>
            {getBadgeText(refreshing, lastUpdated)}
          </span>
          <RefreshButton
            refreshing={refreshing}
            error={!!error && !processedData}
            onClick={onRefresh}
          />
        </div>
      </div>
      
      {content}
    </div>
  );
};

export default WebMetricsSection;