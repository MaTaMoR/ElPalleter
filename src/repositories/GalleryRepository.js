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
     * Actualiza una galería completa
     * POST /gallery/update/{name}
     * REQUIERE AUTENTICACIÓN
     * @param {string} name - Nombre de la galería
     * @param {Object} gallery - Contenido completo de la galería
     * @param {string} token - Token de autenticación (opcional, se obtiene de AuthService)
     * @returns {Promise<Object>} Respuesta del backend
     */
    static async updateGallery(name, gallery, token) {
        try {
            const endpoint = `/gallery/update/${name}`;

            return await this.post(endpoint, gallery, {
                headers: this.getAuthHeaders(token)
            });
        } catch (error) {
            console.error('GalleryRepository: Error updating gallery:', error);
            throw error;
        }
    }
}