// src/pages/api/admin/images.js

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const imagesDataPath = path.join(__dirname, '../../../data/images.json');

/**
 * Genera un ID único para una nueva imagen
 */
function generateImageId(category = 'img') {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 4);
    return `${category}_${timestamp}_${random}`;
}

/**
 * Procesa y guarda una imagen en múltiples formatos
 */
async function processImageFormats(file, imageId) {
    // Aquí implementarías el procesamiento real con sharp o similar
    // Por ahora simulamos las rutas
    const baseUrl = '/uploads/images';
    
    return {
        original: `${baseUrl}/${imageId}_original.jpg`,
        large: `${baseUrl}/${imageId}_large.jpg`,
        medium: `${baseUrl}/${imageId}_medium.jpg`,
        thumbnail: `${baseUrl}/${imageId}_thumb.jpg`
    };
}

export async function POST({ request }) {
    try {
        const formData = await request.formData();
        const file = formData.get('image');
        const category = formData.get('category') || 'general';
        const tags = JSON.parse(formData.get('tags') || '[]');
        const altText = formData.get('altText') || '';
        const caption = formData.get('caption') || '';
        const title = formData.get('title') || '';

        if (!file) {
            return new Response(JSON.stringify({ error: 'No image provided' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Generar ID único
        const imageId = generateImageId(category.substring(0, 4));
        
        // Procesar imagen en múltiples formatos
        const formats = await processImageFormats(file, imageId);
        
        // Leer datos actuales
        const currentData = JSON.parse(await fs.readFile(imagesDataPath, 'utf8'));
        
        // Crear nueva entrada de imagen
        const newImage = {
            filename: file.name,
            uploadDate: new Date().toISOString(),
            category,
            tags,
            dimensions: {
                width: 1920, // Obtener de la imagen real
                height: 1080
            },
            formats
        };
        
        // Agregar nueva imagen
        currentData.images[imageId] = newImage;
        
        // Guardar datos actualizados
        await fs.writeFile(imagesDataPath, JSON.stringify(currentData, null, 2));

        return new Response(JSON.stringify({
            success: true,
            imageId,
            image: newImage
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Error uploading image:', error);
        return new Response(JSON.stringify({ error: 'Failed to upload image' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

export async function GET({ url }) {
    try {
        const searchParams = new URL(url).searchParams;
        const category = searchParams.get('category');
        const gallery = searchParams.get('gallery');
        
        const data = JSON.parse(await fs.readFile(imagesDataPath, 'utf8'));
        
        if (gallery) {
            // Devolver imágenes de una galería específica
            const galleryData = data.galleries[gallery];
            if (!galleryData) {
                return new Response(JSON.stringify({ error: 'Gallery not found' }), {
                    status: 404,
                    headers: { 'Content-Type': 'application/json' }
                });
            }
            
            const images = galleryData.images.map(imageId => ({
                id: imageId,
                ...data.images[imageId]
            }));
            
            return new Response(JSON.stringify({
                gallery: galleryData,
                images
            }), {
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        if (category) {
            // Filtrar por categoría
            const filteredImages = Object.entries(data.images)
                .filter(([_, image]) => image.category === category)
                .map(([id, image]) => ({ id, ...image }));
                
            return new Response(JSON.stringify(filteredImages), {
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        // Devolver todas las imágenes
        const allImages = Object.entries(data.images)
            .map(([id, image]) => ({ id, ...image }));
            
        return new Response(JSON.stringify({
            images: allImages,
            galleries: data.galleries,
            categories: data.categories
        }), {
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Error fetching images:', error);
        return new Response(JSON.stringify({ error: 'Failed to fetch images' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

export async function PUT({ request }) {
    try {
        const { imageId, updates } = await request.json();
        
        if (!imageId) {
            return new Response(JSON.stringify({ error: 'Image ID required' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const data = JSON.parse(await fs.readFile(imagesDataPath, 'utf8'));
        
        if (!data.images[imageId]) {
            return new Response(JSON.stringify({ error: 'Image not found' }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Actualizar imagen
        data.images[imageId] = { ...data.images[imageId], ...updates };
        
        await fs.writeFile(imagesDataPath, JSON.stringify(data, null, 2));

        return new Response(JSON.stringify({
            success: true,
            image: data.images[imageId]
        }), {
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Error updating image:', error);
        return new Response(JSON.stringify({ error: 'Failed to update image' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

export async function DELETE({ request }) {
    try {
        const { imageId } = await request.json();
        
        if (!imageId) {
            return new Response(JSON.stringify({ error: 'Image ID required' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const data = JSON.parse(await fs.readFile(imagesDataPath, 'utf8'));
        
        if (!data.images[imageId]) {
            return new Response(JSON.stringify({ error: 'Image not found' }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Eliminar imagen
        delete data.images[imageId];
        
        // Eliminar de galerías
        Object.keys(data.galleries).forEach(galleryId => {
            data.galleries[galleryId].images = data.galleries[galleryId].images
                .filter(id => id !== imageId);
        });
        
        await fs.writeFile(imagesDataPath, JSON.stringify(data, null, 2));

        return new Response(JSON.stringify({ success: true }), {
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Error deleting image:', error);
        return new Response(JSON.stringify({ error: 'Failed to delete image' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}