
import { useState, useEffect } from 'react';
import analyticsService from '../../../src/services/AnalyticsService.js';

/**
 * Hook para monitorear el estado del servicio de analytics
 * @param {number} checkInterval - Intervalo de verificación en ms (default: 30 segundos)
 * @returns {Object} { health, isHealthy, lastCheck }
 */
export const useAnalyticsHealthCheck = (checkInterval = 30000) => {
  const [health, setHealth] = useState(null);
  const [lastCheck, setLastCheck] = useState(null);

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const healthData = await analyticsService.healthCheck();
        setHealth(healthData);
        setLastCheck(new Date().toISOString());
      } catch (error) {
        setHealth({
          status: 'unhealthy',
          error: error.message,
          service: 'AnalyticsService'
        });
        setLastCheck(new Date().toISOString());
      }
    };

    checkHealth();
    
    const interval = setInterval(checkHealth, checkInterval);
    return () => clearInterval(interval);
  }, [checkInterval]);

  const isHealthy = health?.status === 'healthy';

  return { health, isHealthy, lastCheck };
};