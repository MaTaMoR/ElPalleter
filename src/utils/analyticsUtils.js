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
export const getLanguageFlag = (languageCode) => {
  if (!languageCode) return null;
  
  // Obtener el idioma desde I18nService
  const language = I18nService.getLanguage(languageCode);
  
  if (language && language.flag && language.flag.name) {
    return language.flag;
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

export const CHANGE_TYPE = {
  POSITIVE: 'positive',
  NEGATIVE: 'negative',
  AVERAGE: 'average',
  NEUTRAL: 'neutral'
}

/**
 * Calcula el porcentaje de cambio entre dos valores
 * @param {number} current - Valor actual
 * @param {number} previous - Valor anterior
 * @returns {Object} { percentage: number, isPositive: boolean, changeType: string, displayText: string, showChange: boolean }
 */
export const calculatePercentageChange = (current, previous) => {
  // Comprobar si previous no existe (null o undefined), no si es 0
  if (previous === null || previous === undefined) {
    return {
      percentage: 0,
      isPositive: false,
      changeType: CHANGE_TYPE.NEUTRAL,
      displayText: '',
      showChange: false // No mostrar change si no hay datos anteriores
    };
  }

  // Si previous es 0, cualquier valor actual es un incremento infinito
  // En este caso mostramos el cambio como un valor muy alto o simplemente como "nuevo"
  let change;
  if (previous === 0) {
    // Si current también es 0, no hay cambio
    if (current === 0) {
      change = 0;
    } else {
      // Si pasamos de 0 a algo, es un incremento del 100% (o podríamos usar un valor alto)
      change = 100;
    }
  } else {
    change = ((current - previous) / previous) * 100;
  }

  const roundedChange = Math.round(change * 10) / 10; // Redondear a 1 decimal

  const isPositive = change > 0;
  const isNegative = change < 0;

  let changeType = CHANGE_TYPE.NEUTRAL;
  if (Math.abs(change) > 5) {
    if (Math.abs(change) > 15) {
      changeType = isPositive ? CHANGE_TYPE.POSITIVE : CHANGE_TYPE.NEGATIVE;
    } else {
      changeType = CHANGE_TYPE.AVERAGE;
    }
  }

  const sign = isPositive ? '+' : '';
  const changeText = Math.abs(change) > 1 ? `${sign}${roundedChange}%` : 'N/A';

  return {
    percentage: roundedChange,
    isPositive,
    isNegative,
    changeType,
    displayText: changeText,
    showChange: true
  };
};

/**
 * Calcula cambios para todas las métricas principales
 * @param {Object} currentData - Datos del periodo actual
 * @param {Object} previousData - Datos del periodo anterior
 * @returns {Object} Objeto con todos los cambios calculados
 */
export const calculateAllMetricChanges = (currentData, previousData) => {
  const defaultChange = { displayText: '', changeType: 'neutral', showChange: false };

  if (!currentData || !previousData) {
    return {
      uniqueVisitors: defaultChange,
      totalVisits: defaultChange,
      averageDuration: defaultChange,
      mobilePercentage: defaultChange,
      engagementRate: defaultChange,
      topSection: defaultChange
    };
  }

  console.log('P: ' + JSON.stringify(previousData));
  console.log('C: ' + JSON.stringify(currentData));

  const currentMobile = calculateMobilePercentage(currentData.deviceStats, currentData.totalVisits);
  const previousMobile = calculateMobilePercentage(previousData.deviceStats, previousData.totalVisits);

  const currentEngagement = calculateEngagementRate(currentData.bounceRate);
  const previousEngagement = calculateEngagementRate(previousData.bounceRate);

  const currentTopSection = getMostViewedSection(currentData.sectionStats);
  const previousTopSection = getMostViewedSection(previousData.sectionStats);

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
    mobilePercentage: calculatePercentageChange(currentMobile, previousMobile),
    engagementRate: calculatePercentageChange(currentEngagement, previousEngagement),
    topSection: calculatePercentageChange(currentTopSection.percentage, previousTopSection.percentage)
  };
};