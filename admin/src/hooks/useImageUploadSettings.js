import { useState, useEffect } from 'react';
import { ImageService } from '@services/ImageService';

/**
 * Hook para cargar la configuración de subida de imágenes desde el backend
 * Incluye validaciones, tamaños máximos y extensiones permitidas
 */
export const useImageUploadSettings = () => {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      const uploadSettings = await ImageService.getImageUploadSettings();
      setSettings(uploadSettings);
    } catch (err) {
      console.error('Error loading image upload settings:', err);
      setError(err.message || 'Error al cargar la configuración de subida');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  return {
    settings,
    loading,
    error,
    reload: loadSettings
  };
};

export default useImageUploadSettings;
