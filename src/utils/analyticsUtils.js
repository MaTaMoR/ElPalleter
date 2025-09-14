
/**
 * Utilidades para formatear y procesar datos de analytics
 */

export const formatDuration = (seconds) => {
  if (!seconds || seconds === 0) return '0:00';
  
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

export const formatPercentage = (value, decimals = 1) => {
  if (value === null || value === undefined) return '0%';
  return `${Number(value).toFixed(decimals)}%`;
};

export const formatNumber = (number) => {
  if (!number || number === 0) return '0';
  
  if (number >= 1000000) {
    return (number / 1000000).toFixed(1) + 'M';
  }
  if (number >= 1000) {
    return (number / 1000).toFixed(1) + 'k';
  }
  return number.toString();
};

export const getDeviceIcon = (deviceType) => {
  switch (deviceType?.toLowerCase()) {
    case 'mobile':
      return '📱';
    case 'tablet':
      return '📟';
    case 'desktop':
      return '🖥️';
    default:
      return '❓';
  }
};

export const getLanguageFlag = (languageCode) => {
  switch (languageCode?.toLowerCase()) {
    case 'es':
      return '🇪🇸';
    case 'en':
      return '🇬🇧';
    case 'val':
      return '🏴';
    default:
      return '🌐';
  }
};

export const calculateMobilePercentage = (deviceStats, totalVisits) => {
  if (!deviceStats || !totalVisits || totalVisits === 0) return 0;
  const mobileCount = deviceStats.MOBILE || 0;
  return (mobileCount / totalVisits) * 100;
};

export const getMostViewedSection = (sectionStats) => {
  if (!sectionStats || sectionStats.length === 0) {
    return { name: 'Ninguna', percentage: 0 };
  }
  
  const topSection = sectionStats[0];
  return {
    name: topSection.sectionName || 'Desconocida',
    percentage: topSection.percentage || 0
  };
};

export const calculateEngagementRate = (bounceRate) => {
  if (bounceRate === null || bounceRate === undefined) return 0;
  return 100 - bounceRate;
};

export const formatTimeAgo = (dateString) => {
  if (!dateString) return 'Nunca';
  
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now - date;
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  
  if (diffMinutes < 1) return 'Ahora mismo';
  if (diffMinutes < 60) return `Hace ${diffMinutes} min`;
  
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `Hace ${diffHours}h`;
  
  const diffDays = Math.floor(diffHours / 24);
  return `Hace ${diffDays} días`;
};