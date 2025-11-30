import { ImageRepository } from '../repositories/ImageRepository';
import { GalleryRepository } from '../repositories/GalleryRepository';
import { AuthService } from './AuthService';

/**
 * Servicio para gestionar imágenes y galerías
 */
export class ImageService {

    /**
     * Obtiene el URL de una imagen por su ID
     * @param {string} name - ID de la imagen
     * @returns {string} URL de la imagen
     */
    static getImageURL(name) {
        return ImageRepository.getImageURL(name);
    }

    /**
     * Sube una nueva imagen
     * @param {File} file - Archivo de imagen a subir
     * @param {string} token - Token de autenticación
     * @returns {Promise<Object>} Imagen subida
     */
    static async uploadImage(name, file) {
        try {
            return await ImageRepository.uploadImage(name, file, AuthService.getToken());
        } catch (error) {
            console.error('ImageService: Error uploading image:', error);
            throw error;
        }
    }

    /**
     * Obtiene los detalles de una imagen
     * @param {string} name - Nombre de la imagen
     * @returns {Promise<Object>} Detalles de la imagen
     */
    static async getImageDetails(name) {
        try {
            return await ImageRepository.getImageDetails(name);
        } catch (error) {
            console.error(`ImageService: Error getting image details for ${name}:`, error);
            throw error;
        }
    }

    /**
     * Obtiene los datos binarios de una imagen
     * @param {string} name - Nombre de la imagen
     * @returns {Promise<Blob>} Datos de la imagen
     */
    static async getImage(name) {
        try {
            return await ImageRepository.getImage(name);
        } catch (error) {
            console.error(`ImageService: Error getting image ${name}:`, error);
            throw error;
        }
    }

    /**
     * Obtiene los límites de tamaño máximo de subida
     * @returns {Promise<Object>} Límites de tamaño de subida
     */
    static async getImageUploadSettings() {
        try {
            return await ImageRepository.getImageUploadSettings();
        } catch (error) {
            console.error('ImageService: Error getting image upload settings:', error);
            throw error;
        }
    }

    /**
     * Actualiza una imagen existente
     * @param {string} name - Nombre de la imagen a actualizar
     * @param {File} file - Archivo de imagen a subir
     * @param {string} token - Token de autenticación
     * @returns {Promise<Object>} Imagen actualizada
     */
    static async updateImage(name, file) {
        try {
            return await ImageRepository.updateImage(name, file, AuthService.getToken());
        } catch (error) {
            console.error(`ImageService: Error updating image ${name}:`, error);
            throw error;
        }
    }

    /**
     * Obtiene la información de una galería
     * @param {string} name - Nombre de la galería
     * @returns {Promise<Object>} Información de la galería
     */
    static async getGallery(name) {
        try {
            return await GalleryRepository.getGallery(name);
        } catch (error) {
            console.error(`ImageService: Error getting gallery ${name}:`, error);
            throw error;
        }
    }

    /**
     * Obtiene las imágenes de una galería - SIN MAPEO RESPONSIVE
     * @param {string} galleryName - Nombre de la galería
     * @returns {Promise<Array>} Array de objetos básicos para componentes
     */
    static async getGalleryImages(galleryName) {
        const gallery = await GalleryRepository.getGallery(galleryName);
        if (!gallery?.images) {
            console.warn(`Galería '${galleryName}' no encontrada`);
            return [];
        }

        return gallery.images
            .map(galleryImage => ({
                id: galleryImage.image.id,
                name: galleryImage.image.name,
                order: galleryImage.imageOrder
            }))
            .sort((a, b) => (a.order || 0) - (b.order || 0));
    }

    /**
     * Actualiza contenido de la galeria
     * @param {string} name - Nombre de la galería
     * @param {string} gallery - Contenido de la galeria
     * @returns {Promise<void>}
     */
    static async updateGallery(name, gallery) {
        try {
            await GalleryRepository.updateGallery(name, gallery, AuthService.getToken());
        } catch (error) {
            console.error(`ImageService: Error updating gallery '${name}':`, error);
            throw error;
        }
    }
}

export default ImageService;