/**
 * MenuService - Servicio para gestión de la carta en el admin
 * Adaptado de CartaService
 */

import { MenuRepository } from './MenuRepository';

export class MenuService {
  /**
   * Obtiene las categorías del menú traducidas
   */
  static async getCategories(language = 'es') {
    try {
      return await MenuRepository.getTranslatedCategories(language);
    } catch (error) {
      console.error('MenuService: Error getting categories:', error);
      throw error;
    }
  }

  /**
   * Guarda cambios en la carta
   */
  static async saveMenu(menuData, language = 'es') {
    try {
      return await MenuRepository.updateMenu(menuData, language);
    } catch (error) {
      console.error('MenuService: Error saving menu:', error);
      throw error;
    }
  }

  /**
   * Verifica si el servicio está disponible
   */
  static async healthCheck() {
    try {
      return await MenuRepository.healthCheck();
    } catch (error) {
      return {
        status: 'unhealthy',
        service: 'MenuService',
        error: error.message,
        lastCheck: new Date().toISOString()
      };
    }
  }
}

export default MenuService;
