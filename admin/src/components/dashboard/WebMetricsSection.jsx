import React, { useMemo } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import RefreshButton from '../refreshbutton/RefreshButton';
import { 
  formatDuration, 
  formatPercentage, 
  formatNumber, 
  formatTimeAgo,
  calculateMobilePercentage,
  getMostViewedSection,
  calculateEngagementRate ,
  calculateAllMetricChanges
} from '@utils/analyticsUtils';

// Crear texto del badge con actualización
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

    // Calcular todos los cambios dinámicamente
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

  // Memo 2: Renderizar contenido basado en estado + datos procesados
  const content = useMemo(() => {
    // Estado de carga inicial
    if (loading) {
      return (
        <div className="metrics-grid">
          {[...Array(6)].map((_, index) => (
            <div key={index} className="metric-card loading">
              <div className="metric-skeleton"></div>
            </div>
          ))}
        </div>
      );
    }

    // Estado de error completo (solo si no hay datos anteriores)
    if (loading === false && error && !processedData && !refreshing) {
      return (
        <div className="error-message">
          <p>Error cargando métricas: {error}</p>
          <button onClick={onRefresh}>Reintentar</button>
        </div>
      );
    }

    // Estado sin datos
    if (!processedData) {
      return (
        <div className="no-data-message">
          <p>No hay datos de métricas disponibles</p>
          <button onClick={onRefresh} disabled={refreshing}>
            {refreshing ? 'Cargando...' : 'Cargar datos'}
          </button>
        </div>
      );
    }

    // Estado con datos - renderizar métricas
    return (
      <>
        {/* Banner de error sutil si hay error pero tenemos datos */}
        {error && (
          <div className="error-banner">
            <p>⚠️ Hubo un problema al actualizar. Mostrando datos anteriores.</p>
          </div>
        )}
        
        <div className="metrics-grid">
          {processedData.map((metric, index) => (
            <div key={index} className="metric-card">
              <div className="metric-value">{metric.value}</div>
              <div className="metric-label">{metric.label}</div>
              {metric.showChange && (
                <span className={`metric-change ${metric.changeType}`}>
                  {getTrendIcon(metric.changeType)}
                  {metric.change}
                </span>
              )}
            </div>
          ))}
        </div>
      </>
    );
  }, [loading, error, processedData, refreshing, onRefresh]);

  return (
    <div className={`section ${refreshing ? 'refreshing' : ''}`}>
      {/* Header fijo - siempre presente */}
      <div className="section-header">
        <h2 className="section-title">Métricas de la Web</h2>
        <div className="section-actions">
          <span className={`status-badge warning ${refreshing ? 'updating' : ''}`}>
            {getBadgeText(refreshing, lastUpdated)}
          </span>
          <RefreshButton
            refreshing={refreshing}
            error={!!error && !processedData}
            onClick={onRefresh}
          />
        </div>
      </div>
      
      {/* Contenido dinámico */}
      {content}
    </div>
  );
};

export default WebMetricsSection;