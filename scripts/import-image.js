#!/usr/bin/env node
// scripts/image-manager.js - Gestión automática de imágenes

const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');
const readline = require('readline');

class ImageManager {
    constructor() {
        this.configPath = 'src/data/image-config.json';
        this.publicDir = 'public/images';
        this.sizes = [
            { name: 'mobile', width: 800, suffix: 'mobile-800w' },
            { name: 'tablet', width: 1200, suffix: 'tablet-1200w' },
            { name: 'desktop', width: 1920, suffix: 'desktop-1920w' },
            { name: 'desktop_xl', width: 2560, suffix: 'xl-2560w' }
        ];
    }

    async addImage(imagePath, imageId, category = 'general') {
        console.log(`\n🎯 Procesando imagen: ${imageId}`);
        
        try {
            // 1. Crear directorios necesarios
            await this.ensureDirectories(category);
            
            // 2. Copiar imagen original
            const originalDest = path.join(this.publicDir, category, 'originals', `${imageId}-original.jpg`);
            await this.copyAndOptimize(imagePath, originalDest, { quality: 95 });
            console.log(`✅ Original guardada: ${originalDest}`);
            
            // 3. Generar versiones responsivas
            const versions = {};
            for (const size of this.sizes) {
                const filename = `${imageId}-${size.suffix}.jpg`;
                const outputPath = path.join(this.publicDir, category, filename);
                
                await sharp(imagePath)
                    .resize(size.width, null, { 
                        withoutEnlargement: true,
                        fit: 'cover'
                    })
                    .jpeg({ quality: 85, progressive: true })
                    .toFile(outputPath);
                
                versions[size.name] = `/images/${category}/${filename}`;
                console.log(`✅ ${size.name}: ${filename}`);
            }
            
            // 4. Actualizar configuración
            await this.updateConfig(imageId, category, versions);
            console.log(`✅ Configuración actualizada`);
            
            // 5. Generar código para copiar
            this.generateCode(imageId, category, versions);
            
            return versions;
            
        } catch (error) {
            console.error(`❌ Error procesando ${imageId}:`, error.message);
            throw error;
        }
    }

    async ensureDirectories(category) {
        const dirs = [
            path.join(this.publicDir, category),
            path.join(this.publicDir, category, 'originals')
        ];
        
        for (const dir of dirs) {
            await fs.mkdir(dir, { recursive: true });
        }
    }

    async copyAndOptimize(sourcePath, destPath, options = {}) {
        await sharp(sourcePath)
            .jpeg({ 
                quality: options.quality || 85, 
                progressive: true 
            })
            .toFile(destPath);
    }

    async updateConfig(imageId, category, versions) {
        let config = {};
        
        try {
            const configData = await fs.readFile(this.configPath, 'utf8');
            config = JSON.parse(configData);
        } catch (error) {
            // Archivo no existe, crear nuevo
            config = { galleries: {} };
        }
        
        // Inicializar categoría si no existe
        if (!config.galleries[category]) {
            config.galleries[category] = {
                name: this.capitalize(category),
                images: []
            };
        }
        
        // Buscar si la imagen ya existe
        const existingIndex = config.galleries[category].images
            .findIndex(img => img.id === imageId);
        
        const imageConfig = {
            id: imageId,
            category: category,
            tags: [],
            responsive: versions,
            src: versions.desktop || versions.tablet || Object.values(versions)[0]
        };
        
        if (existingIndex >= 0) {
            // Actualizar existente
            config.galleries[category].images[existingIndex] = imageConfig;
            console.log(`📝 Imagen actualizada: ${imageId}`);
        } else {
            // Agregar nueva
            config.galleries[category].images.push(imageConfig);
            console.log(`➕ Imagen agregada: ${imageId}`);
        }
        
        await fs.writeFile(this.configPath, JSON.stringify(config, null, 2));
    }

    generateCode(imageId, category, versions) {
        console.log(`\n📋 Código para usar en tu componente:\n`);
        
        // Para imageUtils.js
        console.log(`// Agregar a TEMP_IMAGES_CONFIG.galleries.${category}.images:`);
        console.log(`{`);
        console.log(`    id: "${imageId}",`);
        console.log(`    category: "${category}",`);
        console.log(`    tags: ["tag1", "tag2"],`);
        console.log(`    responsive: {`);
        for (const [key, path] of Object.entries(versions)) {
            console.log(`        ${key}: "${path}",`);
        }
        console.log(`    },`);
        console.log(`    src: "${versions.desktop || Object.values(versions)[0]}"`);
        console.log(`},\n`);
        
        // Para componente Astro
        console.log(`// En tu componente .astro:`);
        console.log(`const imageData = getResponsiveBackgroundImage('${imageId}', Astro);\n`);
    }

    capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    async listImages() {
        try {
            const configData = await fs.readFile(this.configPath, 'utf8');
            const config = JSON.parse(configData);
            
            console.log('\n📸 Imágenes configuradas:\n');
            
            for (const [categoryId, category] of Object.entries(config.galleries)) {
                console.log(`📁 ${category.name} (${categoryId}):`);
                
                for (const image of category.images) {
                    console.log(`  • ${image.id}`);
                    if (image.responsive) {
                        const sizes = Object.keys(image.responsive).join(', ');
                        console.log(`    Tamaños: ${sizes}`);
                    }
                }
                console.log('');
            }
            
        } catch (error) {
            console.log('❌ No hay configuración de imágenes aún');
        }
    }

    async removeImage(imageId) {
        try {
            const configData = await fs.readFile(this.configPath, 'utf8');
            const config = JSON.parse(configData);
            
            let found = false;
            
            for (const [categoryId, category] of Object.entries(config.galleries)) {
                const imageIndex = category.images.findIndex(img => img.id === imageId);
                
                if (imageIndex >= 0) {
                    const image = category.images[imageIndex];
                    
                    // Eliminar archivos físicos
                    if (image.responsive) {
                        for (const imagePath of Object.values(image.responsive)) {
                            const fullPath = path.join('public', imagePath);
                            try {
                                await fs.unlink(fullPath);
                                console.log(`🗑️  Eliminado: ${fullPath}`);
                            } catch (err) {
                                console.log(`⚠️  No se pudo eliminar: ${fullPath}`);
                            }
                        }
                    }
                    
                    // Eliminar de configuración
                    category.images.splice(imageIndex, 1);
                    found = true;
                    
                    console.log(`✅ Imagen eliminada: ${imageId}`);
                    break;
                }
            }
            
            if (found) {
                await fs.writeFile(this.configPath, JSON.stringify(config, null, 2));
            } else {
                console.log(`❌ Imagen no encontrada: ${imageId}`);
            }
            
        } catch (error) {
            console.error('❌ Error eliminando imagen:', error.message);
        }
    }
}

// CLI Interface
async function main() {
    const manager = new ImageManager();
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    function question(prompt) {
        return new Promise(resolve => rl.question(prompt, resolve));
    }

    console.log('\n🎨 Image Manager para El Palleter\n');
    console.log('1. Agregar nueva imagen');
    console.log('2. Listar imágenes');
    console.log('3. Eliminar imagen');
    console.log('4. Salir\n');

    const choice = await question('Selecciona una opción (1-4): ');

    try {
        switch (choice) {
            case '1':
                const imagePath = await question('Ruta de la imagen: ');
                const imageId = await question('ID de la imagen (ej: hero_main): ');
                const category = await question('Categoría (hero/historia/carta): ') || 'general';
                
                await manager.addImage(imagePath, imageId, category);
                break;
                
            case '2':
                await manager.listImages();
                break;
                
            case '3':
                const idToRemove = await question('ID de la imagen a eliminar: ');
                await manager.removeImage(idToRemove);
                break;
                
            case '4':
                console.log('👋 ¡Hasta luego!');
                break;
                
            default:
                console.log('❌ Opción no válida');
        }
    } catch (error) {
        console.error('❌ Error:', error.message);
    }

    rl.close();
}

// Ejecutar si es llamado directamente
if (require.main === module) {
    main().catch(console.error);
}

module.exports = ImageManager;

// Ejemplos de uso:
// node scripts/image-manager.js
// node scripts/image-manager.js add ./mi-imagen-4k.jpg hero_main hero
// node scripts/image-manager.js list
// node scripts/image-manager.js remove hero_main