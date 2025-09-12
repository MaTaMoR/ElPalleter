import { ImageRepository } from '../repositories/ImageRepository';
import { GalleryRepository } from '../repositories/GalleryRepository';

/**
 * Servicio para gestionar imágenes responsivas - Adaptado a estructura existente
 */
export class ImageService {
    
    /**
     * Obtiene el URL de una imagen por su ID
     * @param {string} imageId - URL de la imagen
     * @returns {Object|null} - Datos de la imagen o null si no existe
     */
    static getImageURL(imageId) {
        return ImageRepository.getImageURL(imageId);
    }

    /**
     * GALERÍA: Obtiene info básica de una galería - SIN MAPEO RESPONSIVE
     * @param {string} galleryName - ID de la galería
     * @returns {Array} - Array de objetos básicos para componentes
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
}

export default ImageService;