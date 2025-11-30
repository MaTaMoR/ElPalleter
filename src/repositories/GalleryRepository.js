import { BaseRepository } from './BaseRepository.js';

/**
 * Repositorio para galerías
 * Conecta con los endpoints /gallery del backend Spring Boot
 */
export class GalleryRepository extends BaseRepository {

    /**
     * Obtiene la información de una galería
     * GET /gallery/{name}
     * @param {string} name - Nombre de la galería
     * @returns {Promise<Object>} Información de la galería
     */
    static async getGallery(name) {
        if (!name) {
            throw new Error('Gallery name is required');
        }

        try {
            return await this.get('/gallery/' + name);
        } catch (error) {
            console.error(`GalleryRepository: Error getting gallery ${name}:`, error);
            throw error;
        }
    }

    /**
     * Actualiza/guarda cambios en la carta
     * POST /gallery/update/{name}
     * REQUIERE AUTENTICACIÓN
     * @param {Array} menuData - Array de categorías con subcategorías e items
     * @param {string} language - Código de idioma
     * @param {string} token - Token de autenticación (opcional, se obtiene de AuthService)
     * @returns {Promise<Object>} Respuesta del backend
     */
    static async updateMenu(name, gallery, token) {
        try {
            // POST usa el endpoint directamente, agregamos params a la URL
            const endpoint = `/gallery/update/${name}}`;

            return await this.post(endpoint, gallery, { 
                headers: this.getAuthHeaders(token)
            });
        } catch (error) {
            console.error('CartaRepository: Error updating menu:', error);
            throw error;
        }
    }
}