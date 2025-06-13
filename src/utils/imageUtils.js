// src/utils/imageUtils.js
// Utilidades para integración de imágenes con el sistema i18n existente

import { i18nConfig } from '../i18n/config.js';
import { getI18nInfo, safeTranslation } from './astro-i18n-utils.js';

await i18nConfig.loadTranslations();

/**
 * Configuración temporal de imágenes hasta implementar el sistema completo
 * Esta será reemplazada por el sistema dinámico más adelante
 */
const TEMP_IMAGES_CONFIG = {
    galleries: {
        historia_slider: {
            name: "Historia Slider Principal",
            images: [
                {
                    id: "hist_001",
                    src: "/images/slider/slider-1.jpg", // Usa tus imágenes actuales
                    category: "historia",
                    tags: ["restaurante", "exterior", "fachada"]
                },
                {
                    id: "hist_002", 
                    src: "/images/slider/slider-2.jpg",
                    category: "historia",
                    tags: ["comida", "hamburguesa", "especialidad"]
                },
                {
                    id: "hist_003",
                    src: "/images/slider/slider-3.jpg", 
                    category: "historia",
                    tags: ["parrilla", "cocina", "carnes"]
                },
                {
                    id: "hist_004",
                    src: "/images/slider/slider-4.jpg",
                    category: "historia", 
                    tags: ["postres", "dulces", "comida"]
                }
            ]
        }
    }
};

/**
 * Obtiene las imágenes de una galería con traducciones integradas
 * @param {string} galleryId - ID de la galería
 * @param {Object} Astro - Objeto Astro del componente
 * @returns {Array} - Array de imágenes con traducciones
 */
export function getGalleryImages(galleryId, Astro) {
    const { locale, i18n } = getI18nInfo(Astro);
    const gallery = TEMP_IMAGES_CONFIG.galleries[galleryId];
    
    if (!gallery) {
        console.warn(`[Images] Gallery "${galleryId}" not found`);
        return [];
    }
    
    return gallery.images.map(image => ({
        id: image.id,
        src: image.src,
        alt: safeTranslation(`images.${image.id}.alt`, Astro, `Imagen ${image.id}`),
        caption: safeTranslation(`images.${image.id}.caption`, Astro, ''),
        title: safeTranslation(`images.${image.id}.title`, Astro, ''),
        category: image.category,
        tags: image.tags
    }));
}

/**
 * Obtiene una imagen específica por ID con traducciones
 * @param {string} imageId - ID de la imagen
 * @param {Object} Astro - Objeto Astro del componente
 * @returns {Object|null} - Datos de la imagen con traducciones
 */
export function getImageById(imageId, Astro) {
    const { locale, i18n } = getI18nInfo(Astro);
    
    // Buscar en todas las galerías
    for (const [galleryId, gallery] of Object.entries(TEMP_IMAGES_CONFIG.galleries)) {
        const image = gallery.images.find(img => img.id === imageId);
        if (image) {
            return {
                id: image.id,
                src: image.src,
                alt: safeTranslation(`images.${image.id}.alt`, Astro, `Imagen ${image.id}`),
                caption: safeTranslation(`images.${image.id}.caption`, Astro, ''),
                title: safeTranslation(`images.${image.id}.title`, Astro, ''),
                category: image.category,
                tags: image.tags,
                galleryId
            };
        }
    }
    
    return null;
}

/**
 * Obtiene imágenes fallback con traducciones cuando no hay contenido dinámico
 * @param {string} type - Tipo de fallback ('historia', 'carta', etc.)
 * @param {Object} Astro - Objeto Astro del componente
 * @returns {Array} - Array de imágenes fallback
 */
export function getFallbackImages(type, Astro) {
    const fallbacks = {
        historia: [
            {
                id: 'fallback_historia_1',
                src: '/images/placeholder-restaurant.jpg',
                alt: safeTranslation('images.fallback.restaurant_alt', Astro, 'El Palleter Restaurant'),
                caption: safeTranslation('images.fallback.restaurant_caption', Astro, 'Nuestro restaurante'),
                title: safeTranslation('images.fallback.restaurant_title', Astro, 'Restaurante El Palleter')
            }
        ],
        carta: [
            {
                id: 'fallback_carta_1',
                src: '/images/placeholder-food.jpg',
                alt: safeTranslation('images.fallback.food_alt', Astro, 'Comida de El Palleter'),
                caption: safeTranslation('images.fallback.food_caption', Astro, 'Nuestra comida'),
                title: safeTranslation('images.fallback.food_title', Astro, 'Especialidades culinarias')
            }
        ]
    };
    
    return fallbacks[type] || [];
}

/**
 * Verifica si una galería tiene imágenes disponibles
 * @param {string} galleryId - ID de la galería
 * @returns {boolean} - True si tiene imágenes
 */
export function hasGalleryImages(galleryId) {
    const gallery = TEMP_IMAGES_CONFIG.galleries[galleryId];
    return gallery && gallery.images && gallery.images.length > 0;
}

/**
 * Obtiene todas las galerías disponibles
 * @returns {Array} - Array con información de galerías
 */
export function getAvailableGalleries() {
    return Object.entries(TEMP_IMAGES_CONFIG.galleries).map(([id, gallery]) => ({
        id,
        name: gallery.name,
        imageCount: gallery.images.length
    }));
}

/**
 * Helper para migración: mapea imágenes estáticas a la nueva estructura
 * @param {Array} staticImages - Array de imágenes estáticas actuales
 * @param {Object} Astro - Objeto Astro del componente
 * @returns {Array} - Array en el nuevo formato
 */
export function migrateStaticImages(staticImages, Astro) {
    return staticImages.map((image, index) => ({
        id: `migrated_${index}`,
        src: image.src,
        alt: image.alt || safeTranslation(`images.migrated_${index}.alt`, Astro, `Imagen ${index + 1}`),
        caption: image.caption || safeTranslation(`images.migrated_${index}.caption`, Astro, ''),
        title: image.title || safeTranslation(`images.migrated_${index}.title`, Astro, ''),
        category: 'migrated',
        tags: []
    }));
}

/**
 * Utildad para logging de imágenes en desarrollo
 * @param {string} message - Mensaje
 * @param {Object} data - Datos adicionales
 */
export function logImageInfo(message, data = {}) {
    if (import.meta.env.DEV) {
        console.log(`[Images] ${message}`, data);
    }
}