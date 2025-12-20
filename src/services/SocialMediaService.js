/**
 * Servicio para gestionar datos de redes sociales (MOCK)
 * Este servicio simula datos de diferentes plataformas de redes sociales
 */

// Fecha de inicio de los datos (primer mes con datos)
const START_YEAR = 2024;
const START_MONTH = 3; // Marzo (1-12)

/**
 * Verifica si una fecha (año/mes) es válida según la fecha de inicio
 */
const isValidDate = (year, month) => {
  if (year < START_YEAR) return false;
  if (year === START_YEAR && month < START_MONTH) return false;
  return true;
};

/**
 * Calcula los meses desde el inicio
 */
const getMonthsSinceStart = (year, month) => {
  return (year - START_YEAR) * 12 + (month - START_MONTH);
};

/**
 * Genera datos mock para una plataforma específica en un mes dado
 */
const generateMonthlyPlatformData = (platform, year, month) => {
  // Validar que la fecha sea válida
  if (!isValidDate(year, month)) {
    return null;
  }

  // Calcular meses desde el inicio para variación realista
  const monthsSinceStart = getMonthsSinceStart(year, month);

  // Datos base por plataforma
  const platformData = {
    'google-business': {
      name: 'Google Business',
      type: 'reviews',
      baseRating: 4.5,
      baseReviews: 54,
      growthRate: 0.08 // 8% mensual promedio
    },
    'instagram': {
      name: 'Instagram',
      type: 'followers',
      baseFollowers: 890,
      baseEngagement: 3.2,
      growthRate: 0.06 // 6% mensual promedio
    },
    'facebook': {
      name: 'Facebook',
      type: 'likes',
      baseLikes: 720,
      baseEngagement: 2.8,
      growthRate: 0.04 // 4% mensual promedio
    },
    'tripadvisor': {
      name: 'Tripadvisor',
      type: 'reviews',
      baseRating: 4.7,
      baseReviews: 38,
      growthRate: 0.12 // 12% mensual promedio
    }
  };

  const config = platformData[platform];
  if (!config) return null;

  // Añadir variación aleatoria pero consistente basada en el mes
  const seed = year * 12 + month;
  const random = (Math.sin(seed) + 1) / 2; // Valor entre 0 y 1 consistente por mes

  if (config.type === 'reviews') {
    // Para plataformas de reseñas
    const reviewsGrowth = Math.floor(config.baseReviews * Math.pow(1 + config.growthRate, monthsSinceStart));
    const totalReviews = config.baseReviews + reviewsGrowth - config.baseReviews;
    // Para el primer mes, usar un valor base razonable
    const monthlyNewReviews = monthsSinceStart === 0
      ? Math.floor(config.baseReviews * 0.1) // 10% del total como nuevas reseñas del primer mes
      : Math.max(1, Math.floor((reviewsGrowth - config.baseReviews) / monthsSinceStart * (0.8 + random * 0.4)));

    return {
      platform: config.name,
      rating: Math.min(5, config.baseRating + (random - 0.5) * 0.2).toFixed(1),
      totalReviews,
      newReviews: monthlyNewReviews,
      type: 'reviews'
    };
  } else if (config.type === 'followers') {
    // Para Instagram (seguidores)
    const followersGrowth = Math.floor(config.baseFollowers * Math.pow(1 + config.growthRate, monthsSinceStart));
    const totalFollowers = followersGrowth;
    // Para el primer mes, usar un valor base razonable
    const monthlyNewFollowers = monthsSinceStart === 0
      ? Math.floor(config.baseFollowers * 0.05) // 5% del total como nuevos seguidores del primer mes
      : Math.max(10, Math.floor((followersGrowth - config.baseFollowers) / monthsSinceStart * (0.8 + random * 0.4)));

    return {
      platform: config.name,
      totalFollowers,
      newFollowers: monthlyNewFollowers,
      engagementRate: (config.baseEngagement + (random - 0.5) * 0.5).toFixed(2),
      type: 'followers'
    };
  } else if (config.type === 'likes') {
    // Para Facebook (me gusta)
    const likesGrowth = Math.floor(config.baseLikes * Math.pow(1 + config.growthRate, monthsSinceStart));
    const totalLikes = likesGrowth;
    // Para el primer mes, usar un valor base razonable
    const monthlyNewLikes = monthsSinceStart === 0
      ? Math.floor(config.baseLikes * 0.04) // 4% del total como nuevos likes del primer mes
      : Math.max(5, Math.floor((likesGrowth - config.baseLikes) / monthsSinceStart * (0.8 + random * 0.4)));

    return {
      platform: config.name,
      totalLikes,
      newLikes: monthlyNewLikes,
      engagementRate: (config.baseEngagement + (random - 0.5) * 0.5).toFixed(2),
      type: 'likes'
    };
  }

  return null;
};

export class SocialMediaService {
  /**
   * Obtiene la fecha de inicio de los datos de redes sociales
   * @returns {Promise<string>} Fecha en formato "YYYY-MM"
   */
  static async getStartDate() {
    const month = String(START_MONTH).padStart(2, '0');
    return `${START_YEAR}-${month}`;
  }

  /**
   * Obtiene estadísticas de todas las plataformas para un mes específico
   * @param {number} year - Año
   * @param {number} month - Mes (1-12)
   * @returns {Promise<Object>} Datos de todas las plataformas
   */
  static async getMonthlyStats(year, month) {
    const platforms = ['google-business', 'instagram', 'facebook', 'tripadvisor'];
    const data = {};

    for (const platform of platforms) {
      const platformData = generateMonthlyPlatformData(platform, year, month);
      if (platformData) {
        data[platform] = platformData;
      }
    }

    return {
      year,
      month,
      platforms: data
    };
  }
}

export default SocialMediaService;
