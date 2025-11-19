import { useState, useEffect } from 'react';
import { CartaService } from '@services/CartaService';

/**
 * Hook para cargar datos de la carta desde el backend
 * Usa CartaService en lugar de MenuService (evita duplicación)
 */
export const useMenuData = (language = 'es') => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const categories = await CartaService.getCategories(language);
      setData(categories);
    } catch (err) {
      console.error('Error loading menu data:', err);
      setError(err.message || 'Error al cargar la carta');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [language]);

  return {
    data,
    loading,
    error,
    reload: loadData
  };
};

export default useMenuData;
