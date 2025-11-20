// src/repositories/GalleryRepository.js

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
            const response = await this.get('/gallery/' + name);
            return response || {};
        } catch (error) {
            console.error(`GalleryRepository: Error getting gallery ${name}:`, error);
            throw error;
        }
    }

    /**
     * Añade una imagen a una galería
     * POST /gallery/{galleryName}/image/{imageName}
     * @param {string} galleryName - Nombre de la galería
     * @param {string} imageName - Nombre de la imagen
     * @param {number} order - Orden de la imagen en la galería (opcional)
     * @param {string} token - Token de autenticación
     * @returns {Promise<void>}
     */
    static async addImageToGallery(galleryName, imageName, order, token) {
        if (!galleryName) {
            throw new Error('Gallery name is required');
        }

        if (!imageName) {
            throw new Error('Image name is required');
        }

        try {
            const body = (order !== null && order !== undefined) ? { order } : undefined;
            await this.post(
                `/gallery/${galleryName}/image/${imageName}`,
                body,
                { headers: this.getAuthHeaders(token) }
            );
        } catch (error) {
            console.error(`GalleryRepository: Error adding image ${imageName} to gallery ${galleryName}:`, error);
            throw error;
        }
    }

    /**
     * Elimina una imagen de una galería
     * DELETE /gallery/{galleryName}/image/{imageName}
     * @param {string} galleryName - Nombre de la galería
     * @param {string} imageName - Nombre de la imagen
     * @param {string} token - Token de autenticación
     * @returns {Promise<void>}
     */
    static async removeImageFromGallery(galleryName, imageName, token) {
        if (!galleryName) {
            throw new Error('Gallery name is required');
        }

        if (!imageName) {
            throw new Error('Image name is required');
        }

        try {
            await this.delete(`/gallery/${galleryName}/image/${imageName}`, {
                headers: this.getAuthHeaders(token)
            });
        } catch (error) {
            console.error(`GalleryRepository: Error removing image ${imageName} from gallery ${galleryName}:`, error);
            throw error;
        }
    }

    /**
     * Actualiza el orden de una imagen en una galería
     * PATCH /gallery/{galleryName}/image/{imageName}/order
     * @param {string} galleryName - Nombre de la galería
     * @param {string} imageName - Nombre de la imagen
     * @param {number} order - Nuevo orden de la imagen
     * @param {string} token - Token de autenticación
     * @returns {Promise<void>}
     */
    static async updateImageOrder(galleryName, imageName, order, token) {
        if (!galleryName) {
            throw new Error('Gallery name is required');
        }

        if (!imageName) {
            throw new Error('Image name is required');
        }

        if (order === null || order === undefined) {
            throw new Error('Order is required');
        }

        try {
            await this.patch(
                `/gallery/${galleryName}/image/${imageName}/order`,
                { order },
                { headers: this.getAuthHeaders(token) }
            );
        } catch (error) {
            console.error(`GalleryRepository: Error updating image ${imageName} order in gallery ${galleryName}:`, error);
            throw error;
        }
    }
}