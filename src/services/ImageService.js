// src/services/imageService.js

import imagesData from '../data/images.json';

/**
 * Servicio para gestionar imágenes del sistema
 */
export class ImageService {
    
    /**
     * Obtiene la información de una imagen por su ID
     * @param {string} imageId - ID de la imagen
     * @returns {Object|null} - Datos de la imagen o null si no existe
     */
    static getImageById(imageId) {
        return imagesData.images[imageId] || null;
    }

    /**
     * Obtiene las imágenes de una galería específica
     * @param {string} galleryId - ID de la galería
     * @returns {Array} - Array de objetos con datos de imágenes
     */
    static getGalleryImages(galleryId) {
        const gallery = imagesData.galleries[galleryId];
        if (!gallery) return [];

        return gallery.images.map(imageId => {
            const imageData = this.getImageById(imageId);
            return imageData ? { id: imageId, ...imageData } : null;
        }).filter(Boolean);
    }

    /**
     * Obtiene imágenes por categoría
     * @param {string} category - Categoría de imágenes
     * @returns {Array} - Array de imágenes de la categoría
     */
    static getImagesByCategory(category) {
        return Object.entries(imagesData.images)
            .filter(([_, image]) => image.category === category)
            .map(([id, image]) => ({ id, ...image }));
    }

    /**
     * Obtiene la URL de una imagen en el formato especificado
     * @param {string} imageId - ID de la imagen
     * @param {string} format - Formato deseado ('original', 'large', 'medium', 'thumbnail')
     * @returns {string|null} - URL de la imagen o null si no existe
     */
    static getImageUrl(imageId, format = 'large') {
        const image = this.getImageById(imageId);
        if (!image || !image.formats[format]) return null;
        
        return image.formats[format];
    }

    /**
     * Obtiene todas las galerías disponibles
     * @returns {Object} - Objeto con todas las galerías
     */
    static getGalleries() {
        return imagesData.galleries;
    }

    /**
     * Obtiene todas las categorías disponibles
     * @returns {Object} - Objeto con todas las categorías
     */
    static getCategories() {
        return imagesData.categories;
    }

    /**
     * Busca imágenes por tags
     * @param {Array} tags - Array de tags para buscar
     * @returns {Array} - Array de imágenes que contienen los tags
     */
    static searchByTags(tags) {
        return Object.entries(imagesData.images)
            .filter(([_, image]) => 
                tags.some(tag => image.tags.includes(tag))
            )
            .map(([id, image]) => ({ id, ...image }));
    }

    /**
     * Obtiene configuración de una galería
     * @param {string} galleryId - ID de la galería
     * @returns {Object|null} - Configuración de la galería
     */
    static getGallerySettings(galleryId) {
        const gallery = imagesData.galleries[galleryId];
        return gallery ? gallery.settings : null;
    }
}

/**
 * Función para usar en componentes Astro para obtener imágenes con traducciones
 * @param {string} galleryId - ID de la galería
 * @param {Object} i18nInstance - Instancia del sistema i18n
 * @param {string} locale - Idioma actual
 * @returns {Array} - Array de imágenes con traducciones
 */
export function getGalleryWithTranslations(galleryId, i18nInstance, locale) {
    const images = ImageService.getGalleryImages(galleryId);
    
    return images.map(image => ({
        id: image.id,
        src: image.formats.large, // Formato por defecto
        alt: i18nInstance.getTranslation(`images.${image.id}.alt`, locale) || image.filename,
        caption: i18nInstance.getTranslation(`images.${image.id}.caption`, locale) || '',
        title: i18nInstance.getTranslation(`images.${image.id}.title`, locale) || '',
        formats: image.formats, // Todos los formatos disponibles
        tags: image.tags,
        dimensions: image.dimensions
    }));
}

/**
 * Función helper para responsive images
 * @param {string} imageId - ID de la imagen
 * @returns {Object} - Objeto con URLs y srcset para responsive
 */
export function getResponsiveImageData(imageId) {
    const image = ImageService.getImageById(imageId);
    if (!image) return null;

    return {
        src: image.formats.large,
        srcset: `
            ${image.formats.thumbnail} 300w,
            ${image.formats.medium} 768w,
            ${image.formats.large} 1200w,
            ${image.formats.original} 1920w
        `,
        sizes: "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
    };
}