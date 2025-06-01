import { getDatabase } from './database.js';

/**
 * Obtener idiomas activos
 * @returns {Promise<string[]>} Array de IDs de idiomas activos
 */
export async function getActiveLanguages() {
  try {
    const db = await getDatabase();
    const languages = db.prepare(`
      SELECT id FROM languages 
      WHERE is_active = true 
      ORDER BY is_default DESC, id
    `).all();
    
    return languages.map(lang => lang.id);
  } catch (error) {
    console.warn('No se pudieron cargar los idiomas de la base de datos, usando configuración por defecto');
    return ['es', 'en']; // Configuración por defecto
  }
}

/**
 * Obtener configuración completa de idiomas
 * @returns {Promise<Object[]>} Array de objetos de idioma
 */
export async function getLanguageConfig() {
  try {
    const db = await getDatabase();
    const languages = db.prepare(`
      SELECT 
        id,
        name,
        native_name as "nativeName",
        is_default as "isDefault",
        is_active as "isActive"
      FROM languages 
      ORDER BY is_default DESC, name
    `).all();
    
    return languages;
  } catch (error) {
    console.warn('Error cargando configuración de idiomas:', error);
    return [
      { id: 'es', name: 'Español', nativeName: 'Español', isDefault: true, isActive: true },
      { id: 'en', name: 'English', nativeName: 'English', isDefault: false, isActive: true }
    ];
  }
}
