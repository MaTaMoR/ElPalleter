
import React from 'react';
import { RefreshCw, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { 
  formatDuration, 
  formatPercentage, 
  formatNumber, 
  calculateMobilePercentage,
  getMostViewedSection,
  calculateEngagementRate 
} from '@utils/analyticsUtils';

const WebMetricsSection = ({ analyticsData, loading, error, onRefresh, lastUpdated }) => {
  
  if (loading) {
    return (
      <div className="section">
        <div className="section-header">
          <h2 className="section-title">Métricas de la Web</h2>
          <div className="loading-spinner"></div>
        </div>
        <div className="metrics-grid">
          {[...Array(6)].map((_, index) => (
            <div key={index} className="metric-card loading">
              <div className="metric-skeleton"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="section">
        <div className="section-header">
          <h2 className="section-title">Métricas de la Web</h2>
          <button 
            className="refresh-button error"
            onClick={onRefresh}
            title="Reintentar"
          >
            <RefreshCw size={20} />
          </button>
        </div>
        <div className="error-message">
          <p>Error cargando métricas: {error}</p>
          <button onClick={onRefresh}>Reintentar</button>
        </div>
      </div>
    );
  }

  // Calcular métricas desde los datos del backend
  const totalVisits = analyticsData?.totalVisits || 0;
  const uniqueVisitors = analyticsData?.uniqueVisitors || 0;
  const avgDuration = analyticsData?.averageDuration || 0;
  const mobilePercentage = calculateMobilePercentage(analyticsData?.deviceStats, totalVisits);
  const engagementRate = calculateEngagementRate(analyticsData?.bounceRate);
  const topSection = getMostViewedSection(analyticsData?.sectionStats);

  const metrics = [
    {
      value: formatNumber(uniqueVisitors),
      label: 'Visitantes únicos',
      change: '+23% vs anterior', // TODO: Calcular con datos reales comparando períodos
      changeType: 'positive'
    },
    {
      value: formatNumber(totalVisits),
      label: 'Visitas totales',
      change: '+18% vs anterior',
      changeType: 'positive'
    },
    {
      value: formatDuration(avgDuration),
      label: 'Tiempo promedio',
      change: '+12% vs anterior',
      changeType: 'positive'
    },
    {
      value: formatPercentage(mobilePercentage),
      label: 'Tráfico móvil',
      change: '+2% vs anterior',
      changeType: 'neutral'
    },
    {
      value: formatPercentage(engagementRate),
      label: 'Tasa de engagement',
      change: '+0.8% vs anterior',
      changeType: 'positive'
    },
    {
      value: topSection.name,
      label: 'Sección más vista',
      change: `${formatPercentage(topSection.percentage)} del tráfico`,
      changeType: 'neutral'
    }
  ];

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

  return (
    <div className="section">
      <div className="section-header">
        <h2 className="section-title">Métricas de la Web</h2>
        <div className="section-actions">
          <span className="status-badge warning">Esta semana</span>
          <button 
            className="refresh-button"
            onClick={onRefresh}
            title="Actualizar datos"
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </div>
      
      <div className="metrics-grid">
        {metrics.map((metric, index) => (
          <div key={index} className="metric-card">
            <div className="metric-value">{metric.value}</div>
            <div className="metric-label">{metric.label}</div>
            <span className={`metric-change ${metric.changeType}`}>
              {getTrendIcon(metric.changeType)}
              {metric.change}
            </span>
          </div>
        ))}
      </div>
      
      {lastUpdated && (
        <div className="section-footer">
          <small className="text-muted">
            Última actualización: {new Date(lastUpdated).toLocaleString()}
          </small>
        </div>
      )}
    </div>
  );
};

export default WebMetricsSection;