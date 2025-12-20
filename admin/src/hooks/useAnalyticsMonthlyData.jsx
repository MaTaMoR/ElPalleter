import { useState, useEffect, useCallback } from 'react';
import { AnalyticsService } from '@services/AnalyticsService.js';

/**
 * Hook para obtener datos de analíticas mensuales y del mes anterior.
 * @param {number} year - Año a consultar.
 * @param {number} month - Mes a consultar (1-12).
 * @returns {Object} { currentMonthData, previousMonthData, loading, error, refetch }
 */
export const useAnalyticsMonthlyData = (year, month) => {
  const [currentMonthData, setCurrentMonthData] = useState(null);
  const [previousMonthData, setPreviousMonthData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    if (!year || !month) {
      // No hacer nada si no hay año o mes
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    await new Promise(request => setTimeout(request, 1500))

    try {
      // 1. Fetch data for the selected month
      const currentData = await AnalyticsService.getMonthlyStats(year, month);
      setCurrentMonthData(currentData);

      // 2. Calculate previous month and fetch its data
      const previousDate = new Date(year, month - 1, 1);
      previousDate.setMonth(previousDate.getMonth() - 1);
      const prevYear = previousDate.getFullYear();
      const prevMonth = previousDate.getMonth() + 1;

      try {
        const previousData = await AnalyticsService.getMonthlyStats(prevYear, prevMonth);
        setPreviousMonthData(previousData);
      } catch (prevError) {
        // Si no hay datos del mes anterior, no es un error fatal
        setPreviousMonthData(null);
        console.warn(`No data found for previous month: ${prevYear}-${prevMonth}`);
      }

    } catch (err) {
      setError(err.message);
      console.error('Error fetching monthly analytics data:', err);
    } finally {
      setLoading(false);
    }
  }, [year, month]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refetch = () => {
    fetchData();
  };

  return { currentMonthData, previousMonthData, loading, error, refetch };
};

/**
 * Hook para obtener la fecha de inicio de las analíticas.
 * @returns {Object} { startDate, loading, error }
 */
export const useAnalyticsStartDate = () => {
    const [startDate, setStartDate] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchStartDate = async () => {
            setLoading(true);
            setError(null);
            try {
                const data = await AnalyticsService.getStartDate(); // "YYYY-MM"
                if (data) {
                    const [year, month] = data.split('-').map(Number);
                    setStartDate({ year, month });
                } else {
                    setStartDate(null);
                }
            } catch (err) {
                setError(err.message);
                console.error('Error fetching analytics start date:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchStartDate();
    }, []);

    return { startDate, loading, error };
};
