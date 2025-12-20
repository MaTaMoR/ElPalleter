import { useState, useEffect } from 'react';

/**
 * Calcula el cambio porcentual entre dos valores
 */
const calculatePercentageChange = (current, previous) => {
  if (!previous || previous === 0) return 0;
  return ((current - previous) / previous) * 100;
};

/**
 * Determina el tipo de cambio basado en el porcentaje
 */
const getChangeType = (percentage) => {
  if (percentage > 5) return 'positive';
  if (percentage < -5) return 'negative';
  if (percentage === 0) return 'neutral';
  return 'average';
};

/**
 * Formatea el cambio para mostrar
 */
const formatChange = (change) => {
  if (change > 0) return `+${change}`;
  return change.toString();
};

/**
 * Hook para procesar datos de redes sociales y calcular métricas
 */
export const useSocialMediaMetrics = (currentData, previousData, loading) => {
  const [displayData, setDisplayData] = useState(null);
  const [displayPrevious, setDisplayPrevious] = useState(null);

  useEffect(() => {
    if (currentData && !loading) {
      setDisplayData(currentData);
    }
    if (previousData && !loading) {
      setDisplayPrevious(previousData);
    }
  }, [currentData, previousData, loading]);

  if (!displayData) {
    return null;
  }

  const platforms = displayData.platforms || {};
  const prevPlatforms = displayPrevious?.platforms || {};

  // Procesar cada plataforma
  const processedPlatforms = Object.keys(platforms).map(platformKey => {
    const current = platforms[platformKey];
    const previous = prevPlatforms[platformKey];

    let platformMetrics = {
      key: platformKey,
      platform: current.platform,
      type: current.type
    };

    if (current.type === 'reviews') {
      // Google Business o Tripadvisor
      const currentReviews = current.totalReviews;
      const previousReviews = previous?.totalReviews || currentReviews;
      const reviewsChange = currentReviews - previousReviews;
      const percentage = calculatePercentageChange(currentReviews, previousReviews);

      platformMetrics = {
        ...platformMetrics,
        mainStat: current.rating,
        label: `${current.totalReviews} reseñas`,
        change: formatChange(reviewsChange),
        changeLabel: 'este mes',
        growthRate: `${percentage >= 0 ? '+' : ''}${percentage.toFixed(2)}%`,
        changeType: getChangeType(percentage),
        showStar: true
      };
    } else if (current.type === 'followers') {
      // Instagram
      const currentFollowers = current.totalFollowers;
      const previousFollowers = previous?.totalFollowers || currentFollowers;
      const followersChange = currentFollowers - previousFollowers;
      const percentage = calculatePercentageChange(currentFollowers, previousFollowers);

      platformMetrics = {
        ...platformMetrics,
        mainStat: current.totalFollowers.toLocaleString('es-ES'),
        label: 'seguidores',
        change: formatChange(followersChange),
        changeLabel: 'este mes',
        growthRate: `${percentage >= 0 ? '+' : ''}${percentage.toFixed(2)}%`,
        changeType: getChangeType(percentage),
        showStar: false
      };
    } else if (current.type === 'likes') {
      // Facebook
      const currentLikes = current.totalLikes;
      const previousLikes = previous?.totalLikes || currentLikes;
      const likesChange = currentLikes - previousLikes;
      const percentage = calculatePercentageChange(currentLikes, previousLikes);

      platformMetrics = {
        ...platformMetrics,
        mainStat: current.totalLikes.toLocaleString('es-ES'),
        label: 'me gusta',
        change: formatChange(likesChange),
        changeLabel: 'este mes',
        growthRate: `${percentage >= 0 ? '+' : ''}${percentage.toFixed(2)}%`,
        changeType: getChangeType(percentage),
        showStar: false
      };
    }

    return platformMetrics;
  });

  return {
    platforms: processedPlatforms,
    displayData,
    displayPrevious
  };
};
