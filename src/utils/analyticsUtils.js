import { I18nService } from '../services/I18nService.js';

/**
 * Obtiene el nombre del idioma desde I18nService
 * @param {string} languageCode - Código del idioma (es, en, val)
 * @returns {string} Nombre del idioma en su idioma nativo
 */
export const getLanguageName = (languageCode) => {
  if (!languageCode) return 'Desconocido';
  
  // Obtener el idioma desde I18nService
  const language = I18nService.getLanguage(languageCode);
  
  if (language) {
    return language.nativeName || language.name;
  }
  
  // Fallback si no se encuentra
  const fallbackNames = {
    'es': 'Español',
    'en': 'English',
    'val': 'Valencià'
  };
  
  return fallbackNames[languageCode] || languageCode.toUpperCase();
};

/**
 * Obtiene la URL de la bandera desde I18nService
 * @param {string} languageCode - Código del idioma
 * @returns {string|null} URL de la imagen de la bandera
 */
export const getLanguageFlagUrl = (languageCode) => {
  if (!languageCode) return null;
  
  // Obtener el idioma desde I18nService
  const language = I18nService.getLanguage(languageCode);
  
  if (language && language.flag && language.flag.value) {
    return language.flag.value;
  }
  
  return null;
};

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

/**
 * Obtiene el nombre traducido del dispositivo
 * @param {string} deviceType - Tipo de dispositivo (DESKTOP, MOBILE, TABLET, UNKNOWN)
 * @returns {string} Nombre del dispositivo en español
 */
export const getDeviceName = (deviceType) => {
  const names = {
    'DESKTOP': 'Escritorio',
    'MOBILE': 'Móvil',
    'TABLET': 'Tablet',
    'UNKNOWN': 'Desconocido'
  };
  
  return names[deviceType?.toUpperCase()] || 'Desconocido';
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

/**
 * Calcula el porcentaje de cambio entre dos valores
 * @param {number} current - Valor actual
 * @param {number} previous - Valor anterior
 * @returns {Object} { percentage: number, isPositive: boolean, changeType: string, displayText: string, showChange: boolean }
 */
export const calculatePercentageChange = (current, previous) => {
  if (!previous || previous === 0) {
    return {
      percentage: 0,
      isPositive: false,
      changeType: 'neutral',
      displayText: '',
      showChange: false // No mostrar change si no hay datos anteriores
    };
  }

  const change = ((current - previous) / previous) * 100;
  const roundedChange = Math.round(change * 10) / 10; // Redondear a 1 decimal
  
  const isPositive = change > 0;
  const isNegative = change < 0;
  
  let changeType = 'neutral';
  if (Math.abs(change) > 0.1) { // Solo mostrar cambio si es mayor a 0.1%
    changeType = isPositive ? 'positive' : 'negative';
  }

  const sign = isPositive ? '+' : '';
  const displayText = Math.abs(roundedChange) < 0.1 
    ? 'Sin cambios' 
    : `${sign}${roundedChange}% vs anterior`;

  return {
    percentage: roundedChange,
    isPositive,
    isNegative,
    changeType,
    displayText,
    showChange: true
  };
};

/**
 * Calcula cambios para todas las métricas principales
 * @param {Object} currentData - Datos de la semana actual
 * @param {Object} previousData - Datos de la semana anterior
 * @returns {Object} Objeto con todos los cambios calculados
 */
export const calculateAllMetricChanges = (currentData, previousData) => {
  if (!currentData || !previousData) {
    // Devolver objetos que indican no mostrar change
    return {
      uniqueVisitors: { displayText: '', changeType: 'neutral', showChange: false },
      totalVisits: { displayText: '', changeType: 'neutral', showChange: false },
      averageDuration: { displayText: '', changeType: 'neutral', showChange: false },
      mobilePercentage: { displayText: '', changeType: 'neutral', showChange: false },
      engagementRate: { displayText: '', changeType: 'neutral', showChange: false },
      topSection: { displayText: '', changeType: 'neutral', showChange: false }
    };
  }

  return {
    uniqueVisitors: calculatePercentageChange(
      currentData.uniqueVisitors || 0,
      previousData.uniqueVisitors || 0
    ),
    totalVisits: calculatePercentageChange(
      currentData.totalVisits || 0,
      previousData.totalVisits || 0
    ),
    averageDuration: calculatePercentageChange(
      currentData.averageDuration || 0,
      previousData.averageDuration || 0
    ),
    // Para métricas calculadas, necesitamos calcular los valores para ambas semanas
    mobilePercentage: calculateMobilePercentageChange(currentData, previousData),
    engagementRate: calculateEngagementRateChange(currentData, previousData),
    topSection: calculateTopSectionChange(currentData, previousData)
  };
};

/**
 * Calcula el cambio en porcentaje móvil
 */
const calculateMobilePercentageChange = (currentData, previousData) => {
  const currentMobile = calculateMobilePercentage(currentData.deviceStats, currentData.totalVisits);
  const previousMobile = calculateMobilePercentage(previousData.deviceStats, previousData.totalVisits);
  
  // Para porcentajes, mostramos la diferencia en puntos porcentuales
  const change = currentMobile - previousMobile;
  const roundedChange = Math.round(change * 10) / 10;
  
  let changeType = 'neutral';
  if (Math.abs(change) > 0.5) { // Cambio significativo en puntos porcentuales
    changeType = change > 0 ? 'positive' : 'negative';
  }
  
  const sign = change > 0 ? '+' : '';
  const displayText = Math.abs(roundedChange) < 0.1 
    ? 'Sin cambios' 
    : `${sign}${roundedChange}pp vs anterior`;

  return { displayText, changeType, showChange: true };
};

/**
 * Calcula el cambio en tasa de engagement
 */
const calculateEngagementRateChange = (currentData, previousData) => {
  const currentRate = calculateEngagementRate(currentData.bounceRate);
  const previousRate = calculateEngagementRate(previousData.bounceRate);
  
  return calculatePercentageChange(currentRate, previousRate);
};

/**
 * Calcula el cambio en la sección más vista
 */
const calculateTopSectionChange = (currentData, previousData) => {
  const currentTop = getMostViewedSection(currentData.sectionStats);
  const previousTop = getMostViewedSection(previousData.sectionStats);
  
  if (currentTop.name === previousTop.name) {
    // Misma sección, mostrar cambio en porcentaje de tráfico
    const change = currentTop.percentage - previousTop.percentage;
    const roundedChange = Math.round(change * 10) / 10;
    
    const sign = change > 0 ? '+' : '';
    const displayText = Math.abs(roundedChange) < 0.1 
      ? `${currentTop.percentage.toFixed(1)}% del tráfico` 
      : `${currentTop.percentage.toFixed(1)}% (${sign}${roundedChange}pp)`;
    
    const changeType = Math.abs(change) > 0.5 ? (change > 0 ? 'positive' : 'negative') : 'neutral';
    
    return { displayText, changeType, showChange: true };
  } else {
    // Sección diferente
    return {
      displayText: `${currentTop.percentage.toFixed(1)}% (Nueva líder)`,
      changeType: 'positive',
      showChange: true
    };
  }
};