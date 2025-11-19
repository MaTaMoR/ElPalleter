import React from 'react';
import { useMetricsData } from '../../hooks/useMetricsData';
import MetricsCards from './MetricsCards';
import DeviceStatsSection from './DeviceStatsSection';
import LanguageStatsSection from './LanguageStatsSection';
import DailyVisitsChart from './DailyVisitsChart';
import RefreshButton from '../refreshbutton/RefreshButton'; // ← Importar el componente original

import styles from './WebMetricsSection.module.css';

const WebMetricsSection = ({
  analyticsData,
  previousData,
  loading,
  refreshing,
  error,
  onRefresh,
  lastUpdated
}) => {
  const metricsData = useMetricsData(analyticsData, previousData, loading);

  // Estado inicial - Cargando primera vez
  if (!metricsData && loading) {
    return (
      <div className={styles.loadingState}>
        <div className={styles.spinner}></div>
        <p>Cargando métricas web...</p>
      </div>
    );
  }

  // Error sin datos previos
  if (!metricsData && error) {
    return (
      <div className={styles.errorState}>
        <span className={styles.errorIcon}>⚠️</span>
        <h3>Error al cargar las métricas</h3>
        <p>{error}</p>
        <button onClick={onRefresh} className={styles.retryButton}>
          Reintentar
        </button>
      </div>
    );
  }

  // Sin datos
  if (!metricsData) {
    return (
      <div className={styles.emptyState}>
        <span className={styles.emptyIcon}>📊</span>
        <h3>No hay datos disponibles</h3>
        <p>Las métricas aparecerán aquí cuando haya datos disponibles</p>
      </div>
    );
  }

  return (
    <div className={styles.metricsSection}>
      <div className={styles.sectionContainer}>
        {/* Header con refresh */}
        <div className={styles.sectionHeader}>
          <div>
            <h2>Métricas Web</h2>
            {lastUpdated && (
              <p className={styles.lastUpdated}>
                Última actualización: {new Date(lastUpdated).toLocaleString('es-ES')}
              </p>
            )}
          </div>
          <RefreshButton
            onClick={onRefresh}
            refreshing={refreshing}
          />
        </div>

        {/* Indicador de actualización */}
        {refreshing && (
          <div className={styles.refreshingBanner}>
            Actualizando datos...
          </div>
        )}

        {/* Grid de métricas principales */}
        <MetricsCards 
          metrics={metricsData.metrics} 
          changes={metricsData.changes} 
        />

        {/* Gráfico de visitas diarias */}
        <DailyVisitsChart 
          analyticsData={metricsData.displayData}
          previousData={metricsData.displayPrevious}
        />

        {/* Estadísticas de dispositivos e idiomas */}
        <div className={styles.statsGrid}>
          <DeviceStatsSection analyticsData={metricsData.displayData} />
          <LanguageStatsSection analyticsData={metricsData.displayData} />
        </div>
      </div>
    </div>
  );
};

export default WebMetricsSection;