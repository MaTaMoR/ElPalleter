import { useState, useCallback } from 'react';
import analyticsService from '../../../src/services/AnalyticsService.js';

/**
 * Hook para obtener datos de analytics para períodos personalizados
 * @returns {Object} { data, loading, error, fetchPeriod }
 */
export const useAnalyticsCustomPeriod = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchPeriod = useCallback(async (startDate, endDate) => {
    try {
      setLoading(true);
      setError(null);
      
      const startISO = startDate instanceof Date ? startDate.toISOString() : startDate;
      const endISO = endDate instanceof Date ? endDate.toISOString() : endDate;
      
      const analyticsData = await analyticsService.getCustomPeriodStats(startISO, endISO);
      setData(analyticsData);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching custom period analytics:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  return { data, loading, error, fetchPeriod };
};