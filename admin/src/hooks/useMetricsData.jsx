import { useState, useEffect } from 'react';
import { 
  calculateMobilePercentage, 
  getMostViewedSection, 
  calculateEngagementRate,
  calculateAllMetricChanges 
} from '@utils/analyticsUtils';

export const useMetricsData = (analyticsData, previousData, loading) => {
  const [displayData, setDisplayData] = useState(null);
  const [displayPrevious, setDisplayPrevious] = useState(null);

  useEffect(() => {
    // Solo actualizar cuando hay datos y no está cargando
    if (analyticsData && !loading) {
      setDisplayData(analyticsData);
    }
    if (previousData && !loading) {
      setDisplayPrevious(previousData);
    }
  }, [analyticsData, previousData, loading]);

  // Si no hay datos para mostrar, retornar null
  if (!displayData) {
    return null;
  }

  // Calcular métricas derivadas
  const mobilePercentage = calculateMobilePercentage(
    displayData.deviceStats,
    displayData.totalVisits
  );

  const topSection = getMostViewedSection(displayData.sectionStats);
  const engagementRate = calculateEngagementRate(displayData.bounceRate);

  // Calcular todos los cambios
  const changes = calculateAllMetricChanges(displayData, displayPrevious);

  return {
    metrics: {
      uniqueVisitors: displayData.uniqueVisitors || 0,
      totalVisits: displayData.totalVisits || 0,
      averageDuration: displayData.averageDuration || 0,
      mobilePercentage,
      engagementRate,
      topSection: topSection.name,
      topSectionPercentage: topSection.percentage
    },
    changes,
    displayData,
    displayPrevious
  };
};