// admin/src/hooks/useAnalyticsData.js

import { useState, useEffect, useCallback } from 'react';
import analyticsService from '../../../src/services/AnalyticsService.js';

/**
 * Hook para obtener datos de analytics en el admin
 * @param {number} refreshInterval - Intervalo de refresco en ms (default: 5 minutos)
 * @returns {Object} { data, loading, error, refresh, lastUpdated }
 */
export const useAnalyticsData = (refreshInterval = 300000) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const analyticsData = await analyticsService.getWeeklyStats();
      setData(analyticsData);
      setLastUpdated(new Date().toISOString());
    } catch (err) {
      setError(err.message);
      console.error('Error fetching analytics data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    
    // Set up interval for auto-refresh
    if (refreshInterval > 0) {
      const interval = setInterval(fetchData, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [fetchData, refreshInterval]);

  const refresh = useCallback(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refresh, lastUpdated };
};



// admin/src/hooks/useAnalyticsHealthCheck.js
