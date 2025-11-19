
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

    /**
     * Actualiza una imagen existente
     * PUT /image/update/{name}
     * @param {string} name - Nombre de la imagen a actualizar
     * @param {File} file - Archivo de imagen a subir
     * @returns {Promise<Object>} Imagen actualizada
     */
    static async updateImage(name, file) {
        if (!name) {
            throw new Error('Image name is required');
        }

        if (!file) {
            throw new Error('Image file is required');
        }

        try {
            const formData = new FormData();
            formData.append('image', file);

            const response = await this.putFormData(`/image/update/${name}`, formData);
            return response;
        } catch (error) {
            console.error(`ImageRepository: Error updating image ${name}:`, error);
            throw error;
        }
    }
}