// src/repositories/ImageRepository.js

import { BaseRepository } from './BaseRepository.js';

/**
 * Repositorio para gallerias
 * Conecta con los endpoints /image del backend Spring Boot
 */
export class GalleryRepository extends BaseRepository {

    /**
     * Obtiene los idiomas disponibles
     * GET /i18n/languages
     * @returns {Promise<Object>} Array de códigos de idiomas disponibles
     */
    static async getGallery(name) {
        try {
            const response = await this.get('/gallery/' + name);
            return response || {};
        } catch (error) {
            console.error('GalleryRepository: Error getting gallery:', error);
            throw error;
        }
    }
}