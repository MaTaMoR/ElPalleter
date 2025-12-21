import { useState, useEffect, useCallback } from 'react';
import { SocialMediaService } from '@services/SocialMediaService.js';

/**
 * Hook para obtener datos de redes sociales mensuales y del mes anterior.
 * @param {number} year - Año a consultar.
 * @param {number} month - Mes a consultar (1-12).
 * @returns {Object} { currentMonthData, previousMonthData, loading, error, refetch }
 */
export const useSocialMediaMonthlyData = (year, month) => {
  const [currentMonthData, setCurrentMonthData] = useState(null);
  const [previousMonthData, setPreviousMonthData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    if (!year || !month) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    // Delay para ver el skeleton
    await new Promise(resolve => setTimeout(resolve, 500));

    try {
      // 1. Fetch data for the selected month
      const currentData = await SocialMediaService.getMonthlyStats(year, month);
      setCurrentMonthData(currentData);

      // 2. Calculate previous month and fetch its data
      const previousDate = new Date(year, month - 1, 1);
      previousDate.setMonth(previousDate.getMonth() - 1);
      const prevYear = previousDate.getFullYear();
      const prevMonth = previousDate.getMonth() + 1;

      try {
        const previousData = await SocialMediaService.getMonthlyStats(prevYear, prevMonth);
        setPreviousMonthData(previousData);
      } catch (prevError) {
        setPreviousMonthData(null);
        console.warn(`No data found for previous month: ${prevYear}-${prevMonth}`);
      }

    } catch (err) {
      setError(err.message);
      console.error('Error fetching social media data:', err);
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
 * Hook para obtener la fecha de inicio de los datos de redes sociales.
 * @returns {Object} { startDate, loading, error }
 */
export const useSocialMediaStartDate = () => {
  const [startDate, setStartDate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStartDate = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await SocialMediaService.getStartDate(); // "YYYY-MM"
        if (data) {
          const [year, month] = data.split('-').map(Number);
          setStartDate({ year, month });
        } else {
          setStartDate(null);
        }
      } catch (err) {
        setError(err.message);
        console.error('Error fetching social media start date:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStartDate();
  }, []);

  return { startDate, loading, error };
};
