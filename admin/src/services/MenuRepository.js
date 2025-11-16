/**
 * MenuRepository - Adaptado de CartaRepository para el admin
 * Maneja las peticiones al backend para la gestión de la carta
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://92.186.195.152:8080';

export class MenuRepository {
  /**
   * Obtiene categorías traducidas del menú
   * GET /carta/translated-categories?language={language}
   */
  static async getTranslatedCategories(language = 'es') {
    try {
      const url = `${API_BASE_URL}/carta/translated-categories?language=${language}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data || [];
    } catch (error) {
      console.error('MenuRepository: Error getting translated categories:', error);
      throw error;
    }
  }

  /**
   * Guarda cambios en la carta
   * POST /carta/update
   */
  static async updateMenu(menuData, language = 'es') {
    try {
      const url = `${API_BASE_URL}/carta/update?language=${language}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(menuData)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('MenuRepository: Error updating menu:', error);
      throw error;
    }
  }

  /**
   * Health check del servicio
   */
  static async healthCheck() {
    try {
      await this.getTranslatedCategories('es');
      return {
        status: 'healthy',
        service: 'MenuRepository',
        lastCheck: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        service: 'MenuRepository',
        error: error.message,
        lastCheck: new Date().toISOString()
      };
    }
  }
}

export default MenuRepository;
