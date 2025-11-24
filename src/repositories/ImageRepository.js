
// src/repositories/ImageRepository.js

import { BaseRepository } from './BaseRepository.js';

/**
 * Repositorio para imágenes
 * Conecta con los endpoints /image del backend Spring Boot
 */
export class ImageRepository extends BaseRepository {

    /**
     * Obtiene el URL a una imagen
     * @param {string} imageId - ID de la imagen
     * @returns {string} URL de imagen
     */
    static getImageURL(imageId) {
        return this.getBaseUrl() + '/image/get/' + imageId;
    }

    /**
     * Sube una nueva imagen
     * POST /image/upload
     * @param {File} file - Archivo de imagen a subir
     * @param {string} token - Token de autenticación
     * @returns {Promise<Object>} Imagen subida
     */
    static async uploadImage(file, token) {
        if (!file) {
            throw new Error('Image file is required');
        }

        try {
            const formData = new FormData();
            formData.append('image', file);

            // Crear headers manualmente para FormData
            const headers = {};
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }
            // NO incluir Content-Type - el navegador lo agregará con el boundary correcto

            const response = await fetch(`${this.getBaseUrl()}/image/upload`, {
                method: 'POST',
                headers: headers,
                body: formData,
                // Sin timeout explícito para permitir archivos grandes
            });

            return this.handleResponse(response);
        } catch (error) {
            console.error('ImageRepository: Error uploading image:', error);
            throw error;
        }
    }

    /**
     * Obtiene los detalles de una imagen
     * GET /image/info/{name}
     * @param {string} name - Nombre de la imagen
     * @returns {Promise<Object>} Detalles de la imagen
     */
    static async getImageDetails(name) {
        if (!name) {
            throw new Error('Image name is required');
        }

        try {
            const response = await this.get(`/image/info/${name}`);
            return response;
        } catch (error) {
            console.error(`ImageRepository: Error getting image details for ${name}:`, error);
            throw error;
        }
    }

    /**
     * Obtiene los datos binarios de una imagen
     * GET /image/get/{name}
     * @param {string} name - Nombre de la imagen
     * @returns {Promise<Blob>} Datos de la imagen
     */
    static async getImage(name) {
        if (!name) {
            throw new Error('Image name is required');
        }

        try {
            const response = await fetch(`${this.getBaseUrl()}/image/get/${name}`);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            return await response.blob();
        } catch (error) {
            console.error(`ImageRepository: Error getting image ${name}:`, error);
            throw error;
        }
    }

    /**
     * Obtiene los límites de tamaño máximo de subida
     * GET /image/image-upload-settings
     * @returns {Promise<Object>} Límites de tamaño de subida
     */
    static async getImageUploadSettings() {
        try {
            const response = await this.get('/image/image-upload-settings');
            return response;
        } catch (error) {
            console.error('ImageRepository: Error getting image upload settings:', error);
            throw error;
        }
    }

    /**
     * Actualiza una imagen existente
     * PUT /image/update/{name}
     * @param {string} name - Nombre de la imagen a actualizar
     * @param {File} file - Archivo de imagen a subir
     * @param {string} token - Token de autenticación
     * @returns {Promise<Object>} Imagen actualizada
     */
    static async updateImage(name, file, token) {
        if (!name) {
            throw new Error('Image name is required');
        }

        if (!file) {
            throw new Error('Image file is required');
        }

        try {
            const formData = new FormData();
            formData.append('image', file);

            const response = await this.putFormData(`/image/update/${name}`, formData, {
                headers: this.getAuthHeaders(token)
            });
            return response;
        } catch (error) {
            console.error(`ImageRepository: Error updating image ${name}:`, error);
            throw error;
        }
    }
}