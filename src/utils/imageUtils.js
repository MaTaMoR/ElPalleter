import { i18nCore } from '../i18n/core.js';

const TEMP_IMAGES_CONFIG = {
    galleries: {
        historia_slider: {
            name: "Historia Slider Principal",
            images: [
                {
                    id: "hist_001",
                    src: "/images/slider/slider-1.jpg",
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
    const { locale } = i18nCore.getI18nInfo(Astro);
    const gallery = TEMP_IMAGES_CONFIG.galleries[galleryId];
    
    if (!gallery) {
        logImageInfo(`Gallery "${galleryId}" not found`);
        return [];
    }
    
    return gallery.images.map(image => ({
        id: image.id,
        src: image.src,
        alt: getImageTranslation(`${image.id}.alt`, locale, `Imagen ${image.id}`),
        caption: getImageTranslation(`${image.id}.caption`, locale, ''),
        title: getImageTranslation(`${image.id}.title`, locale, ''),
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
    const { locale } = i18nCore.getI18nInfo(Astro);
    
    // Buscar en todas las galerías
    for (const [galleryId, gallery] of Object.entries(TEMP_IMAGES_CONFIG.galleries)) {
        const image = gallery.images.find(img => img.id === imageId);
        if (image) {
            return {
                id: image.id,
                src: image.src,
                alt: getImageTranslation(`${image.id}.alt`, locale, `Imagen ${image.id}`),
                caption: getImageTranslation(`${image.id}.caption`, locale, ''),
                title: getImageTranslation(`${image.id}.title`, locale, ''),
                category: image.category,
                tags: image.tags,
                galleryId
            };
        }
    }
    
    return null;
}

/**
 * Helper interno para obtener traducciones de imágenes
 * @param {string} key - Clave de traducción (relativa a images.)
 * @param {string} locale - Idioma
 * @param {string} fallback - Fallback
 * @returns {string} - Traducción
 */
function getImageTranslation(key, locale, fallback) {
    const fullKey = `images.${key}`;
    
    // Usar el core unificado directamente
    if (i18nCore.loaded) {
        const translation = i18nCore.getTranslation(fullKey, locale);
        if (translation && translation !== fullKey) {
            return translation;
        }
    }
    
    return fallback;
}

/**
 * Obtiene imágenes fallback con traducciones
 * @param {string} type - Tipo de fallback ('historia', 'carta', etc.)
 * @param {Object} Astro - Objeto Astro del componente
 * @returns {Array} - Array de imágenes fallback
 */
export function getFallbackImages(type, Astro) {
    const { locale } = i18nCore.getI18nInfo(Astro);
    
    const fallbacks = {
        historia: [
            {
                id: 'fallback_historia_1',
                src: '/images/placeholder-restaurant.jpg',
                alt: getImageTranslation('fallback.restaurant_alt', locale, 'El Palleter Restaurant'),
                caption: getImageTranslation('fallback.restaurant_caption', locale, 'Nuestro restaurante'),
                title: getImageTranslation('fallback.restaurant_title', locale, 'Restaurante El Palleter')
            }
        ],
        carta: [
            {
                id: 'fallback_carta_1',
                src: '/images/placeholder-food.jpg',
                alt: getImageTranslation('fallback.food_alt', locale, 'Comida de El Palleter'),
                caption: getImageTranslation('fallback.food_caption', locale, 'Nuestra comida'),
                title: getImageTranslation('fallback.food_title', locale, 'Especialidades culinarias')
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
    const { locale } = i18nCore.getI18nInfo(Astro);
    
    return staticImages.map((image, index) => ({
        id: `migrated_${index}`,
        src: image.src,
        alt: image.alt || getImageTranslation(`migrated_${index}.alt`, locale, `Imagen ${index + 1}`),
        caption: image.caption || getImageTranslation(`migrated_${index}.caption`, locale, ''),
        title: image.title || getImageTranslation(`migrated_${index}.title`, locale, ''),
        category: 'migrated',
        tags: []
    }));
}

/**
 * Helper para imágenes responsivas
 * @param {string} imageId - ID de la imagen
 * @param {Object} Astro - Objeto Astro del componente
 * @returns {Object|null} - Objeto con URLs y srcset para responsive
 */
export function getResponsiveImageData(imageId, Astro) {
    const image = getImageById(imageId, Astro);
    if (!image) return null;

    // Por ahora, usar la misma imagen para todos los tamaños
    // En el futuro, esto se conectará con el sistema de procesamiento de imágenes
    return {
        src: image.src,
        srcset: `
            ${image.src} 300w,
            ${image.src} 768w,
            ${image.src} 1200w,
            ${image.src} 1920w
        `,
        sizes: "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw",
        alt: image.alt,
        title: image.title
    };
}

/**
 * Función para usar en componentes Astro para obtener imágenes con traducciones
 * @param {string} galleryId - ID de la galería
 * @param {Object} Astro - Objeto Astro del componente
 * @returns {Array} - Array de imágenes con traducciones
 */
export function getGalleryWithTranslations(galleryId, Astro) {
    return getGalleryImages(galleryId, Astro);
}

/**
 * Busca imágenes por tags
 * @param {Array} tags - Array de tags para buscar
 * @param {Object} Astro - Objeto Astro del componente
 * @returns {Array} - Array de imágenes que contienen los tags
 */
export function searchImagesByTags(tags, Astro) {
    const { locale } = i18nCore.getI18nInfo(Astro);
    const results = [];
    
    // Buscar en todas las galerías
    for (const [galleryId, gallery] of Object.entries(TEMP_IMAGES_CONFIG.galleries)) {
        const matchingImages = gallery.images.filter(image => 
            tags.some(tag => image.tags.includes(tag))
        );
        
        matchingImages.forEach(image => {
            results.push({
                id: image.id,
                src: image.src,
                alt: getImageTranslation(`${image.id}.alt`, locale, `Imagen ${image.id}`),
                caption: getImageTranslation(`${image.id}.caption`, locale, ''),
                title: getImageTranslation(`${image.id}.title`, locale, ''),
                category: image.category,
                tags: image.tags,
                galleryId
            });
        });
    }
    
    return results;
}

/**
 * Obtiene estadísticas de imágenes
 * @returns {Object} - Estadísticas
 */
export function getImageStats() {
    const stats = {
        totalGalleries: Object.keys(TEMP_IMAGES_CONFIG.galleries).length,
        totalImages: 0,
        imagesByCategory: {},
        imagesByGallery: {}
    };
    
    for (const [galleryId, gallery] of Object.entries(TEMP_IMAGES_CONFIG.galleries)) {
        stats.totalImages += gallery.images.length;
        stats.imagesByGallery[galleryId] = gallery.images.length;
        
        gallery.images.forEach(image => {
            if (!stats.imagesByCategory[image.category]) {
                stats.imagesByCategory[image.category] = 0;
            }
            stats.imagesByCategory[image.category]++;
        });
    }
    
    return stats;
}

/**
 * Utilidad para logging de imágenes en desarrollo
 * @param {string} message - Mensaje
 * @param {Object} data - Datos adicionales
 */
export function logImageInfo(message, data = {}) {
    if (import.meta.env.DEV) {
        console.log(`[Images] ${message}`, data);
    }
}