// src/utils/imageUtils.js - Versión dinámica que lee configuración externa
import { i18nCore } from '../i18n/core.js';

// 🎯 CONFIGURACIÓN DINÁMICA: Lee desde archivo JSON
let IMAGES_CONFIG = null;
let configLoaded = false;

/**
 * Carga la configuración de imágenes desde archivo JSON
 * @returns {Promise<Object>} - Configuración de imágenes
 */
async function loadImagesConfig() {
    if (configLoaded && IMAGES_CONFIG) {
        return IMAGES_CONFIG;
    }

    try {
        // Server-side: cargar directamente desde archivo
        const fs = await import('fs');
        const path = await import('path');
        const configPath = path.resolve('src/utils/imageConfig.json');
        
        if (fs.existsSync(configPath)) {
            const configData = fs.readFileSync(configPath, 'utf8');
            IMAGES_CONFIG = JSON.parse(configData);
        } else {
            console.warn('📸 imageConfig.json no encontrado, usando configuración por defecto');
            IMAGES_CONFIG = getDefaultConfig();
        }
        
        configLoaded = true;
        logImageInfo('Configuración de imágenes cargada', { 
            galleries: Object.keys(IMAGES_CONFIG.galleries || {}).length 
        });
        
    } catch (error) {
        console.error('❌ Error cargando configuración de imágenes:', error);
        IMAGES_CONFIG = getDefaultConfig();
        configLoaded = true;
    }

    return IMAGES_CONFIG;
}

/**
 * Configuración por defecto para fallback
 * @returns {Object} - Configuración básica
 */
function getDefaultConfig() {
    return {
        galleries: {
            hero_backgrounds: {
                name: "Imágenes de Hero y Backgrounds",
                images: [
                    {
                        id: "hero_main",
                        category: "hero",
                        tags: ["restaurante", "principal", "hero"],
                        responsive: {
                            mobile: "/images/hero/hero-mobile-800w.jpg",
                            tablet: "/images/hero/hero-tablet-1200w.jpg",
                            desktop: "/images/hero/hero-desktop-1920w.jpg",
                            desktop_xl: "/images/hero/hero-xl-2560w.jpg"
                        },
                        src: "/images/hero/hero-desktop-1920w.jpg"
                    }
                ]
            },
            historia_slider: {
                name: "Historia Slider Principal", 
                images: [
                    {
                        id: "hist_001",
                        src: "/images/slider/slider-1.jpg",
                        category: "historia",
                        tags: ["restaurante", "exterior", "fachada"]
                    }
                ]
            }
        }
    };
}

/**
 * Obtiene las imágenes de una galería con traducciones integradas
 * @param {string} galleryId - ID de la galería
 * @param {Object} Astro - Objeto Astro del componente
 * @returns {Promise<Array>} - Array de imágenes con traducciones
 */
export async function getGalleryImages(galleryId, Astro) {
    const config = await loadImagesConfig();
    const { locale } = i18nCore.getI18nInfo(Astro);
    const gallery = config.galleries[galleryId];
    
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
        tags: image.tags || [],
        responsive: image.responsive || null
    }));
}

/**
 * Obtiene una imagen específica por ID con traducciones
 * @param {string} imageId - ID de la imagen
 * @param {Object} Astro - Objeto Astro del componente
 * @returns {Promise<Object|null>} - Datos de la imagen con traducciones
 */
export async function getImageById(imageId, Astro) {
    const config = await loadImagesConfig();
    const { locale } = i18nCore.getI18nInfo(Astro);
    
    // Buscar en todas las galerías
    for (const [galleryId, gallery] of Object.entries(config.galleries)) {
        const image = gallery.images.find(img => img.id === imageId);
        if (image) {
            return {
                id: image.id,
                src: image.src,
                alt: getImageTranslation(`${image.id}.alt`, locale, `Imagen ${image.id}`),
                caption: getImageTranslation(`${image.id}.caption`, locale, ''),
                title: getImageTranslation(`${image.id}.title`, locale, ''),
                category: image.category,
                tags: image.tags || [],
                galleryId,
                responsive: image.responsive || null
            };
        }
    }
    
    return null;
}

/**
 * Obtiene datos de imagen responsiva completos para backgrounds
 * @param {string} imageId - ID de la imagen
 * @param {Object} Astro - Objeto Astro del componente
 * @returns {Promise<Object|null>} - Datos completos de imagen responsiva
 */
export async function getResponsiveBackgroundImage(imageId, Astro) {
    const image = await getImageById(imageId, Astro);
    
    if (!image || !image.responsive) {
        logImageInfo(`Responsive image "${imageId}" not found or not configured`);
        return null;
    }

    return {
        id: image.id,
        category: image.category,
        tags: image.tags,
        
        // Metadatos con traducciones
        alt: image.alt,
        title: image.title,
        caption: image.caption,
        
        // URLs responsivas
        responsive: image.responsive,
        fallback: image.src,
        
        // CSS Background properties para diferentes breakpoints
        cssBackgrounds: {
            mobile: `url('${image.responsive.mobile}')`,
            tablet: `url('${image.responsive.tablet}')`, 
            desktop: `url('${image.responsive.desktop}')`,
            desktop_xl: `url('${image.responsive.desktop_xl}')`,
            fallback: `url('${image.src}')`
        },
        
        // Media queries CSS strings
        mediaQueries: {
            mobile: '(max-width: 767px)',
            tablet: '(min-width: 768px) and (max-width: 1023px)',
            desktop: '(min-width: 1024px) and (max-width: 1399px)', 
            desktop_xl: '(min-width: 1400px)'
        }
    };
}

/**
 * Genera CSS completo para background responsivo
 * @param {string} imageId - ID de la imagen
 * @param {Object} Astro - Objeto Astro del componente
 * @param {Object} options - Opciones adicionales de CSS
 * @returns {Promise<string>} - CSS string completo
 */
export async function generateResponsiveBackgroundCSS(imageId, Astro, options = {}) {
    const imageData = await getResponsiveBackgroundImage(imageId, Astro);
    if (!imageData) return '';
    
    const {
        size = 'cover',
        position = 'center center',
        repeat = 'no-repeat',
        attachment = 'scroll',
        className = '.hero-background'
    } = options;
    
    return `
        /* Fallback para todos los dispositivos */
        ${className} {
            background-image: ${imageData.cssBackgrounds.fallback};
            background-size: ${size};
            background-position: ${position};
            background-repeat: ${repeat};
            background-attachment: ${attachment};
        }
        
        /* Mobile optimizado */
        @media ${imageData.mediaQueries.mobile} {
            ${className} {
                background-image: ${imageData.cssBackgrounds.mobile};
            }
        }
        
        /* Tablet optimizado */
        @media ${imageData.mediaQueries.tablet} {
            ${className} {
                background-image: ${imageData.cssBackgrounds.tablet};
            }
        }
        
        /* Desktop optimizado */
        @media ${imageData.mediaQueries.desktop} {
            ${className} {
                background-image: ${imageData.cssBackgrounds.desktop};
            }
        }
        
        /* Desktop XL/4K optimizado */
        @media ${imageData.mediaQueries.desktop_xl} {
            ${className} {
                background-image: ${imageData.cssBackgrounds.desktop_xl};
            }
        }
    `.trim();
}

/**
 * Obtiene preload links para imágenes críticas
 * @param {string} imageId - ID de la imagen
 * @param {Object} Astro - Objeto Astro del componente
 * @returns {Promise<Array>} - Array de objetos con datos para <link rel="preload">
 */
export async function getImagePreloadData(imageId, Astro) {
    const imageData = await getResponsiveBackgroundImage(imageId, Astro);
    if (!imageData) return [];
    
    return [
        {
            href: imageData.responsive.mobile,
            media: imageData.mediaQueries.mobile,
            as: 'image'
        },
        {
            href: imageData.responsive.tablet, 
            media: imageData.mediaQueries.tablet,
            as: 'image'
        },
        {
            href: imageData.responsive.desktop,
            media: imageData.mediaQueries.desktop,
            as: 'image'
        },
        {
            href: imageData.responsive.desktop_xl,
            media: imageData.mediaQueries.desktop_xl,
            as: 'image'
        }
    ];
}

/**
 * Genera un srcset para imágenes <img> responsivas (no backgrounds)
 * @param {string} imageId - ID de la imagen
 * @param {Object} Astro - Objeto Astro del componente
 * @returns {Promise<Object|null>} - Datos para srcset
 */
export async function getResponsiveImageSrcSet(imageId, Astro) {
    const image = await getImageById(imageId, Astro);
    
    if (!image || !image.responsive) return null;
    
    return {
        src: image.responsive.desktop, // Imagen por defecto
        srcset: [
            `${image.responsive.mobile} 800w`,
            `${image.responsive.tablet} 1200w`, 
            `${image.responsive.desktop} 1920w`,
            `${image.responsive.desktop_xl} 2560w`
        ].join(', '),
        sizes: '(max-width: 767px) 100vw, (max-width: 1023px) 100vw, (max-width: 1399px) 100vw, 100vw',
        alt: image.alt,
        title: image.title,
    };
}

/**
 * Verifica si una imagen tiene configuración responsiva
 * @param {string} imageId - ID de la imagen
 * @returns {Promise<boolean>} - True si tiene configuración responsiva
 */
export async function hasResponsiveConfig(imageId) {
    const config = await loadImagesConfig();
    
    for (const gallery of Object.values(config.galleries)) {
        const image = gallery.images.find(img => img.id === imageId);
        if (image && image.responsive && typeof image.responsive === 'object') {
            return true;
        }
    }
    return false;
}

/**
 * Obtiene todas las imágenes hero disponibles
 * @param {Object} Astro - Objeto Astro del componente
 * @returns {Promise<Array>} - Array de imágenes hero con metadatos
 */
export async function getHeroImages(Astro) {
    return await getGalleryImages('hero_backgrounds', Astro);
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
 * @returns {Promise<boolean>} - True si tiene imágenes
 */
export async function hasGalleryImages(galleryId) {
    const config = await loadImagesConfig();
    const gallery = config.galleries[galleryId];
    return gallery && gallery.images && gallery.images.length > 0;
}

/**
 * Obtiene todas las galerías disponibles
 * @returns {Promise<Array>} - Array con información de galerías
 */
export async function getAvailableGalleries() {
    const config = await loadImagesConfig();
    return Object.entries(config.galleries).map(([id, gallery]) => ({
        id,
        name: gallery.name,
        imageCount: gallery.images.length
    }));
}

/**
 * Busca imágenes por tags
 * @param {Array} tags - Array de tags para buscar
 * @param {Object} Astro - Objeto Astro del componente
 * @returns {Promise<Array>} - Array de imágenes que contienen los tags
 */
export async function searchImagesByTags(tags, Astro) {
    const config = await loadImagesConfig();
    const { locale } = i18nCore.getI18nInfo(Astro);
    const results = [];
    
    // Buscar en todas las galerías
    for (const [galleryId, gallery] of Object.entries(config.galleries)) {
        const matchingImages = gallery.images.filter(image => 
            tags.some(tag => (image.tags || []).includes(tag))
        );
        
        matchingImages.forEach(image => {
            results.push({
                id: image.id,
                src: image.src,
                alt: getImageTranslation(`${image.id}.alt`, locale, `Imagen ${image.id}`),
                caption: getImageTranslation(`${image.id}.caption`, locale, ''),
                title: getImageTranslation(`${image.id}.title`, locale, ''),
                category: image.category,
                tags: image.tags || [],
                galleryId,
                responsive: image.responsive || null
            });
        });
    }
    
    return results;
}

/**
 * Obtiene estadísticas de imágenes
 * @returns {Promise<Object>} - Estadísticas
 */
export async function getImageStats() {
    const config = await loadImagesConfig();
    const stats = {
        totalGalleries: Object.keys(config.galleries).length,
        totalImages: 0,
        imagesByCategory: {},
        imagesByGallery: {},
        responsiveImages: 0
    };
    
    for (const [galleryId, gallery] of Object.entries(config.galleries)) {
        stats.totalImages += gallery.images.length;
        stats.imagesByGallery[galleryId] = gallery.images.length;
        
        gallery.images.forEach(image => {
            // Contar por categoría
            if (!stats.imagesByCategory[image.category]) {
                stats.imagesByCategory[image.category] = 0;
            }
            stats.imagesByCategory[image.category]++;
            
            // Contar imágenes responsivas
            if (image.responsive) {
                stats.responsiveImages++;
            }
        });
    }
    
    return stats;
}

/**
 * Recarga la configuración de imágenes (útil en desarrollo)
 * @returns {Promise<Object>} - Nueva configuración
 */
export async function reloadImagesConfig() {
    configLoaded = false;
    IMAGES_CONFIG = null;
    return await loadImagesConfig();
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
 * Utilidad para logging de imágenes en desarrollo
 * @param {string} message - Mensaje
 * @param {Object} data - Datos adicionales
 */
export function logImageInfo(message, data = {}) {
    if (import.meta.env.DEV) {
        console.log(`[Images] ${message}`, data);
    }
}

// 🎯 FUNCIONES DE UTILIDAD PARA DESARROLLO

/**
 * Debug: Muestra la configuración actual en consola
 * @returns {Promise<void>}
 */
export async function debugImageConfig() {
    const config = await loadImagesConfig();
    console.log('🔍 Configuración actual de imágenes:', config);
    
    const stats = await getImageStats();
    console.log('📊 Estadísticas:', stats);
}

/**
 * Migra imágenes del sistema hardcodeado al dinámico
 * @param {Object} oldConfig - Configuración antigua hardcodeada
 * @returns {Promise<void>}
 */
export async function migrateToJsonConfig(oldConfig) {
    if (typeof window !== 'undefined') {
        console.warn('⚠️ La migración solo funciona en server-side');
        return;
    }
    
    try {
        const fs = await import('fs');
        const path = await import('path');
        const configPath = path.resolve('src/utils/imageConfig.json');
        
        // Escribir la nueva configuración
        fs.writeFileSync(configPath, JSON.stringify(oldConfig, null, 2));
        
        console.log('✅ Configuración migrada a imageConfig.json');
        console.log('💡 Ahora puedes eliminar la configuración hardcodeada');
        
        // Recargar configuración
        await reloadImagesConfig();
        
    } catch (error) {
        console.error('❌ Error en migración:', error);
    }
}

// Helper para compatibilidad con código existente
export const migrateStaticImages = async (staticImages, Astro) => {
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
};

// Alias para mantener compatibilidad
export const getGalleryWithTranslations = getGalleryImages;
export const getResponsiveImageData = getResponsiveImageSrcSet;