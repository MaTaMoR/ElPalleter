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
     * POST /gallery/{galleryName}/image/{imageId}
     * @param {string} galleryName - Nombre de la galería
     * @param {number} imageId - ID de la imagen
     * @param {number} order - Orden de la imagen en la galería
     * @param {string} token - Token de autenticación
     * @returns {Promise<void>}
     */
    static async addImageToGallery(galleryName, imageId, order, token) {
        if (!galleryName) {
            throw new Error('Gallery name is required');
        }

        if (!imageId) {
            throw new Error('Image ID is required');
        }

        if (order === null || order === undefined) {
            throw new Error('Order is required');
        }

        try {
            await this.post(
                `/gallery/${galleryName}/image/${imageId}`,
                { order },
                { headers: this.getAuthHeaders(token) }
            );
        } catch (error) {
            console.error(`GalleryRepository: Error adding image ${imageId} to gallery ${galleryName}:`, error);
            throw error;
        }
    }

    /**
     * Elimina una imagen de una galería
     * DELETE /gallery/{galleryName}/image/{imageId}
     * @param {string} galleryName - Nombre de la galería
     * @param {number} imageId - ID de la imagen
     * @param {string} token - Token de autenticación
     * @returns {Promise<void>}
     */
    static async removeImageFromGallery(galleryName, imageId, token) {
        if (!galleryName) {
            throw new Error('Gallery name is required');
        }

        if (!imageId) {
            throw new Error('Image ID is required');
        }

        try {
            await this.delete(`/gallery/${galleryName}/image/${imageId}`, {
                headers: this.getAuthHeaders(token)
            });
        } catch (error) {
            console.error(`GalleryRepository: Error removing image ${imageId} from gallery ${galleryName}:`, error);
            throw error;
        }
    }

    /**
     * Actualiza el orden de una imagen en una galería
     * PATCH /gallery/{galleryName}/image/{imageId}/order
     * @param {string} galleryName - Nombre de la galería
     * @param {number} imageId - ID de la imagen
     * @param {number} order - Nuevo orden de la imagen
     * @param {string} token - Token de autenticación
     * @returns {Promise<void>}
     */
    static async updateImageOrder(galleryName, imageId, order, token) {
        if (!galleryName) {
            throw new Error('Gallery name is required');
        }

        if (!imageId) {
            throw new Error('Image ID is required');
        }

        if (order === null || order === undefined) {
            throw new Error('Order is required');
        }

        try {
            await this.patch(
                `/gallery/${galleryName}/image/${imageId}/order`,
                { order },
                { headers: this.getAuthHeaders(token) }
            );
        } catch (error) {
            console.error(`GalleryRepository: Error updating image ${imageId} order in gallery ${galleryName}:`, error);
            throw error;
        }
    }
}