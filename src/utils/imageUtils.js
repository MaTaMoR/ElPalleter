// src/utils/imageUtils.js - Arquitectura simplificada: Imágenes individuales + Galería Historia
import { i18nCore } from '../i18n/core.js';

// 🎯 CONFIGURACIONES SEPARADAS
let IMAGES_CONFIG = null;
let GALLERIES_CONFIG = null;
let configsLoaded = false;

/**
 * Carga las configuraciones de imágenes y galerías
 * @returns {Promise<{images: Object, galleries: Object}>}
 */
async function loadConfigs() {
    if (configsLoaded && IMAGES_CONFIG && GALLERIES_CONFIG) {
        return { images: IMAGES_CONFIG, galleries: GALLERIES_CONFIG };
    }

    try {
        const fs = await import('fs');
        const path = await import('path');
        
        // Cargar images.json
        const imagesPath = path.resolve('src/data/images.json');
        const galleriesPath = path.resolve('src/data/galleries.json');
        
        if (fs.existsSync(imagesPath)) {
            const imagesData = fs.readFileSync(imagesPath, 'utf8');
            IMAGES_CONFIG = JSON.parse(imagesData);
        } else {
            console.warn('📸 images.json no encontrado, usando configuración por defecto');
            IMAGES_CONFIG = getDefaultImagesConfig();
        }
        
        if (fs.existsSync(galleriesPath)) {
            const galleriesData = fs.readFileSync(galleriesPath, 'utf8');
            GALLERIES_CONFIG = JSON.parse(galleriesData);
        } else {
            console.warn('🖼️ galleries.json no encontrado, usando configuración por defecto');
            GALLERIES_CONFIG = getDefaultGalleriesConfig();
        }
        
        configsLoaded = true;
        logImageInfo('Configuraciones cargadas', { 
            images: Object.keys(IMAGES_CONFIG.images || {}).length,
            galleries: Object.keys(GALLERIES_CONFIG.galleries || {}).length
        });
        
    } catch (error) {
        console.error('❌ Error cargando configuraciones:', error);
        IMAGES_CONFIG = getDefaultImagesConfig();
        GALLERIES_CONFIG = getDefaultGalleriesConfig();
        configsLoaded = true;
    }

    return { images: IMAGES_CONFIG, galleries: GALLERIES_CONFIG };
}

/**
 * Configuración por defecto de imágenes
 */
function getDefaultImagesConfig() {
    return {
        images: {
            hero_main: {
                id: "hero_main",
                path: "/images/hero_main",
                responsive: {
                    mobile: "/images/hero_main/hero_main-mobile-800w.jpg",
                    tablet: "/images/hero_main/hero_main-tablet-1200w.jpg", 
                    desktop: "/images/hero_main/hero_main-desktop-1920w.jpg",
                    desktop_xl: "/images/hero_main/hero_main-xl-2560w.jpg"
                },
                fallback: "/images/hero_main/hero_main-desktop-1920w.jpg"
            }
        }
    };
}

/**
 * Configuración por defecto de galerías
 */
function getDefaultGalleriesConfig() {
    return {
        galleries: {
            historia: {
                images: []
            }
        }
    };
}

/**
 * Obtiene una imagen individual por ID
 * @param {string} imageId - ID de la imagen
 * @param {Object} Astro - Objeto Astro del componente
 * @returns {Promise<Object|null>} - Datos de la imagen
 */
export async function getImageById(imageId, Astro) {
    const { images } = await loadConfigs();
    const image = images.images[imageId];
    
    if (!image) {
        logImageInfo(`Imagen "${imageId}" no encontrada`);
        return null;
    }
    
    // Estructura simplificada - sin category ni tags
    return {
        id: image.id,
        path: image.path,
        responsive: image.responsive,
        fallback: image.fallback,
        
        // Para compatibilidad con componentes existentes
        src: image.fallback,
        alt: `${image.id}`, // Sin traducción para imágenes individuales
        caption: '', // Sin traducción
        title: '' // Sin traducción
    };
}

/**
 * Obtiene las imágenes de la galería historia con sus traducciones
 * @param {string} galleryId - ID de la galería (solo 'historia' por ahora)
 * @param {Object} Astro - Objeto Astro del componente
 * @returns {Promise<Array>} - Array de imágenes con traducciones
 */
export async function getGalleryImages(galleryId, Astro) {
    const { images, galleries } = await loadConfigs();
    const { locale } = i18nCore.getI18nInfo(Astro);
    const gallery = galleries.galleries[galleryId];
    
    // 🔍 Debug mejorado
    if (import.meta.env.DEV) {
        console.log(`🔍 [getGalleryImages] Buscando galería: "${galleryId}"`);
        console.log(`📁 Galerías disponibles:`, Object.keys(galleries.galleries));
        console.log(`📸 Galería encontrada:`, !!gallery);
        if (gallery) {
            console.log(`🖼️ Referencias en galería:`, gallery.images?.length || 0);
        }
    }
    
    if (!gallery) {
        logImageInfo(`Galería "${galleryId}" no encontrada. Galerías disponibles:`, Object.keys(galleries.galleries));
        return [];
    }
    
    if (!gallery.images || !Array.isArray(gallery.images)) {
        logImageInfo(`Galería "${galleryId}" no tiene imágenes`);
        return [];
    }
    
    // Construir array de imágenes con datos completos
    const galleryImages = [];
    
    for (const galleryItem of gallery.images) {
        const imageData = images.images[galleryItem.image];
        
        if (!imageData) {
            console.warn(`⚠️ Imagen "${galleryItem.image}" referenciada en galería "${galleryId}" no encontrada`);
            continue;
        }
        
        // Combinar datos de imagen + galería + traducción del name
        const imageName = getGalleryTranslation(galleryItem.name, locale, `Imagen ${imageData.id}`);
        
        galleryImages.push({
            id: imageData.id,
            path: imageData.path,
            responsive: imageData.responsive,
            
            // Para compatibilidad con ImageSlider existente
            src: imageData.fallback,
            alt: imageName,
            caption: '', // Sin caption - solo name
            title: imageName, // Usar el mismo name como title
            
            // Metadatos de galería
            galleryOrder: galleryItem.order || 0,
            galleryName: galleryItem.name
        });
    }
    
    // Ordenar por orden especificado en galería
    galleryImages.sort((a, b) => a.galleryOrder - b.galleryOrder);
    
    if (import.meta.env.DEV) {
        console.log(`✅ Galería "${galleryId}" cargada con ${galleryImages.length} imágenes`);
    }
    
    return galleryImages;
}

/**
 * Obtiene datos de imagen responsiva para backgrounds (principalmente para hero)
 * @param {string} imageId - ID de la imagen
 * @param {Object} Astro - Objeto Astro del componente
 * @returns {Promise<Object|null>} - Datos responsivos completos
 */
export async function getResponsiveBackgroundImage(imageId, Astro) {
    const image = await getImageById(imageId, Astro);
    
    if (!image || !image.responsive) {
        logImageInfo(`Imagen responsiva "${imageId}" no encontrada o no configurada`);
        return null;
    }

    return {
        id: image.id,
        
        // URLs responsivas
        responsive: image.responsive,
        fallback: image.fallback,
        
        // CSS Background properties para diferentes breakpoints
        cssBackgrounds: {
            mobile: `url('${image.responsive.mobile}')`,
            tablet: `url('${image.responsive.tablet}')`, 
            desktop: `url('${image.responsive.desktop}')`,
            desktop_xl: `url('${image.responsive.desktop_xl}')`,
            fallback: `url('${image.fallback}')`
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
 * Obtiene todas las imágenes disponibles
 * @returns {Promise<Array>} - Array de todas las imágenes
 */
export async function getAllImages() {
    const { images } = await loadConfigs();
    return Object.values(images.images);
}

/**
 * Verifica si una imagen existe
 * @param {string} imageId - ID de la imagen
 * @returns {Promise<boolean>} - True si existe
 */
export async function imageExists(imageId) {
    const { images } = await loadConfigs();
    return !!images.images[imageId];
}

/**
 * Verifica si la galería historia existe y tiene imágenes
 * @returns {Promise<boolean>} - True si existe y tiene imágenes
 */
export async function hasHistoriaGallery() {
    const { galleries } = await loadConfigs();
    const historia = galleries.galleries.historia;
    return historia && historia.images && historia.images.length > 0;
}

/**
 * Obtiene estadísticas del sistema
 * @returns {Promise<Object>} - Estadísticas
 */
export async function getImageStats() {
    const { images, galleries } = await loadConfigs();
    
    const stats = {
        totalImages: Object.keys(images.images).length,
        historiaImages: 0
    };
    
    // Contar imágenes en historia
    const historia = galleries.galleries.historia;
    if (historia && historia.images) {
        stats.historiaImages = historia.images.length;
    }
    
    return stats;
}

/**
 * Funciones de compatibilidad con API anterior
 */

// Obtiene preload links para imágenes críticas (principalmente hero)
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

// Genera srcset para imágenes <img> responsivas
export async function getResponsiveImageSrcSet(imageId, Astro) {
    const image = await getImageById(imageId, Astro);
    
    if (!image || !image.responsive) return null;
    
    return {
        src: image.responsive.desktop,
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
 * Recarga las configuraciones (útil en desarrollo)
 */
export async function reloadConfigs() {
    configsLoaded = false;
    IMAGES_CONFIG = null;
    GALLERIES_CONFIG = null;
    return await loadConfigs();
}

/**
 * Helper para traducciones de galerías
 * @param {string} key - Clave de traducción
 * @param {string} locale - Idioma
 * @param {string} fallback - Fallback
 * @returns {string} - Traducción
 */
function getGalleryTranslation(key, locale, fallback) {
    // Las claves ya vienen con el prefijo completo (galleries.historia.imagen-1)
    if (i18nCore.loaded) {
        const translation = i18nCore.getTranslation(key, locale);
        if (translation && translation !== key) {
            return translation;
        }
    }
    
    return fallback;
}

/**
 * Utilidad para logging
 */
export function logImageInfo(message, data = {}) {
    if (import.meta.env.DEV) {
        console.log(`[Images] ${message}`, data);
    }
}

/**
 * Debug: Muestra configuraciones actuales
 */
export async function debugConfigs() {
    const { images, galleries } = await loadConfigs();
    console.log('🔍 Configuración de imágenes:', images);
    console.log('🔍 Configuración de galerías:', galleries);
    
    const stats = await getImageStats();
    console.log('📊 Estadísticas:', stats);
}

// Aliases para compatibilidad con código existente
export const getGalleryWithTranslations = getGalleryImages;
export const hasGalleryImages = hasHistoriaGallery;