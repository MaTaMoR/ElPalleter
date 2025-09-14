import { useState, useEffect, useCallback } from 'react';
import analyticsService from '../../../src/services/AnalyticsService.js';

/**
 * Hook para obtener datos de analytics en el admin
 * @param {number} refreshInterval - Intervalo de refresco en ms (default: 5 minutos)
 * @returns {Object} { data, previousData, loading, refreshing, error, refresh, lastUpdated }
 */
export const useAnalyticsData = (refreshInterval = 300000) => {
  const [data, setData] = useState(null);
  const [previousData, setPreviousData] = useState(null);
  const [loading, setLoading] = useState(true); // Solo para carga inicial
  const [refreshing, setRefreshing] = useState(false); // Para recargas
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchData = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
        setError(null);
      } else {
        setLoading(true);
        setError(null);
      }

      // Obtener datos de esta semana (siempre)
      const currentWeekData = await analyticsService.getWeeklyStats();
      setData(currentWeekData);

      // Intentar obtener datos de la semana anterior (opcional)
      let previousWeekData = null;
      try {
        previousWeekData = await analyticsService.getPreviousWeekStats();
        setPreviousData(previousWeekData);
      } catch (prevError) {
        setPreviousData(null);
        console.warn('Failed to fetch previous week data:', prevError.message);
      }

      setLastUpdated(new Date().toISOString());

      // Solo limpiamos error después de éxito
      setError(null);
    } catch (err) {
      const errorMessage = err.message;
      setError(errorMessage);
      console.error('Error fetching analytics data:', err);
    } finally {
      if (isRefresh) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  }, []); // Sin dependencias innecesarias

  useEffect(() => {
    fetchData(false); // Carga inicial

    // Set up interval for auto-refresh
    if (refreshInterval > 0) {
      const interval = setInterval(() => fetchData(true), refreshInterval);
      return () => clearInterval(interval);
    }
  }, [fetchData, refreshInterval]);

  const refresh = useCallback(() => {
    fetchData(true); // Refresh manual
  }, [fetchData]);

  return { data, previousData, loading, refreshing, error, refresh, lastUpdated };
};