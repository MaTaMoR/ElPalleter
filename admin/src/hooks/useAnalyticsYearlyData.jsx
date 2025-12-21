import { useState, useEffect, useCallback } from 'react';
import analyticsService from '@services/AnalyticsService.js';

/**
 * Hook para obtener datos de visitas por mes del último año.
 * @returns {Object} { yearlyData, loading, error, refetch }
 */
export const useAnalyticsYearlyData = () => {
  const [yearlyData, setYearlyData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // TODO: TEMPORAL - Delay de 2s para ver el skeleton loading
      await new Promise(resolve => setTimeout(resolve, 2000));

      const data = await analyticsService.getYearlyStats();
      setYearlyData(data);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching yearly analytics data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refetch = () => {
    fetchData();
  };

  return { yearlyData, loading, error, refetch };
};
