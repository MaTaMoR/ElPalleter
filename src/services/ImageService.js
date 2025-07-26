import imagesData from '../data/images.json';
import galleriesData from '../data/galleries.json';

/**
 * Servicio para gestionar imágenes responsivas - Adaptado a estructura existente
 */
export class ImageService {
    
    /**
     * Obtiene la información básica de una imagen por su ID
     * @param {string} imageId - ID de la imagen
     * @returns {Object|null} - Datos de la imagen o null si no existe
     */
    static getImageById(imageId) {
        return imagesData.images[imageId] || null;
    }

    /**
     * MÉTODO PRINCIPAL: Genera datos para imágenes responsivas
     * @param {string} imageId - ID de la imagen
     * @returns {Object|null} - Datos listos para srcset
     */
    static getResponsiveImageData(imageId) {
        const image = this.getImageById(imageId);
        if (!image?.responsive) {
            console.warn(`Imagen '${imageId}' no encontrada o no tiene versiones responsive`);
            return null;
        }

        const { responsive, fallback } = image;
        
        return {
            src: fallback || responsive.desktop,
            srcset: `
                ${responsive.mobile} 800w,
                ${responsive.tablet} 1200w,
                ${responsive.desktop} 1920w,
                ${responsive.desktop_xl} 2560w
            `.trim().replace(/\s+/g, ' '),
            sizes: "(max-width: 768px) 100vw, (max-width: 1200px) 100vw, 100vw"
        };
    }

    /**
     * VALIDACIÓN: Verifica si una imagen existe y es válida
     * @param {string} imageId - ID de la imagen
     * @returns {boolean} - true si la imagen existe y es válida
     */
    static isValidImage(imageId) {
        const image = this.getImageById(imageId);
        return !!(image && image.responsive && image.fallback);
    }

    /**
     * GALERÍA: Obtiene info básica de una galería - SIN MAPEO RESPONSIVE
     * @param {string} galleryId - ID de la galería
     * @returns {Array} - Array de objetos básicos para componentes
     */
    static getGalleryImages(galleryId) {
        const gallery = galleriesData.galleries?.[galleryId];
        if (!gallery?.images) {
            console.warn(`Galería '${galleryId}' no encontrada`);
            return [];
        }

        return gallery.images
            .sort((a, b) => (a.order || 0) - (b.order || 0))
            .map((imageObj) => ({
                imageId: imageObj.image,
                name: imageObj.name || `Imagen ${imageObj.image}`,
                order: imageObj.order || 0
            }));
    }

    /**
     * DEBUG: Información básica de una imagen
     * @param {string} imageId - ID de la imagen
     * @returns {Object} - Información de debug
     */
    static getImageDebugInfo(imageId) {
        const image = this.getImageById(imageId);
        
        return {
            imageId,
            exists: !!image,
            hasResponsive: !!(image?.responsive),
            hasFallback: !!(image?.fallback),
            path: image?.path || 'N/A',
            isValid: this.isValidImage(imageId)
        };
    }

    /**
     * HELPER: Obtiene todas las galerías disponibles
     * @returns {Array} - Lista de IDs de galerías
     */
    static getAvailableGalleries() {
        return Object.keys(galleriesData.galleries || {});
    }
}

export default ImageService;