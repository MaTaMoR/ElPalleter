import { ImageRepository } from '../repositories/ImageRepository';
import { GalleryRepository } from '../repositories/GalleryRepository';

/**
 * Servicio para gestionar imágenes y galerías
 */
export class ImageService {

    /**
     * Obtiene el URL de una imagen por su ID
     * @param {string} imageId - ID de la imagen
     * @returns {string} URL de la imagen
     */
    static getImageURL(imageId) {
        return ImageRepository.getImageURL(imageId);
    }

    /**
     * Sube una nueva imagen
     * @param {File} file - Archivo de imagen a subir
     * @param {string} token - Token de autenticación
     * @returns {Promise<Object>} Imagen subida
     */
    static async uploadImage(file, token) {
        try {
            const uploadedImage = await ImageRepository.uploadImage(file, token);
            return uploadedImage;
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
            const imageDetails = await ImageRepository.getImageDetails(name);
            return imageDetails;
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
            const imageBlob = await ImageRepository.getImage(name);
            return imageBlob;
        } catch (error) {
            console.error(`ImageService: Error getting image ${name}:`, error);
            throw error;
        }
    }

    /**
     * Obtiene los límites de tamaño máximo de subida
     * @returns {Promise<Object>} Límites de tamaño de subida
     */
    static async getMaxUploadSize() {
        try {
            const maxSize = await ImageRepository.getMaxUploadSize();
            return maxSize;
        } catch (error) {
            console.error('ImageService: Error getting max upload size:', error);
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
    static async updateImage(name, file, token) {
        try {
            const updatedImage = await ImageRepository.updateImage(name, file, token);
            return updatedImage;
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
            const gallery = await GalleryRepository.getGallery(name);
            return gallery;
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
     * Elimina una imagen de una galería
     * @param {string} galleryName - Nombre de la galería
     * @param {number} imageId - ID de la imagen
     * @param {string} token - Token de autenticación
     * @returns {Promise<void>}
     */
    static async removeImageFromGallery(galleryName, imageId, token) {
        try {
            await GalleryRepository.removeImageFromGallery(galleryName, imageId, token);
        } catch (error) {
            console.error(`ImageService: Error removing image ${imageId} from gallery ${galleryName}:`, error);
            throw error;
        }
    }

    /**
     * Actualiza el orden de una imagen en una galería
     * @param {string} galleryName - Nombre de la galería
     * @param {number} imageId - ID de la imagen
     * @param {number} order - Nuevo orden de la imagen
     * @param {string} token - Token de autenticación
     * @returns {Promise<void>}
     */
    static async updateImageOrder(galleryName, imageId, order, token) {
        try {
            await GalleryRepository.updateImageOrder(galleryName, imageId, order, token);
        } catch (error) {
            console.error(`ImageService: Error updating image ${imageId} order in gallery ${galleryName}:`, error);
            throw error;
        }
    }
}

export default ImageService;