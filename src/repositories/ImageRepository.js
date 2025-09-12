
// src/repositories/ImageRepository.js

import { BaseRepository } from './BaseRepository.js';

/**
 * Repositorio para gallerias
 * Conecta con los endpoints /image del backend Spring Boot
 */
export class ImageRepository extends BaseRepository {

    /**
     * Obtiene el URL a una imagen
     * @returns {Promise<Object>} URL de imagen
     */
    static getImageURL(imageId) {
        return this.getBaseUrl() + '/image/get/' + imageId;
    }
}