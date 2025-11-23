#!/usr/bin/env node

import { readFile, mkdir, writeFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

// Colores para logs
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Configuración de la API
const API_URL = process.env.VITE_API_URL || process.env.PUBLIC_API_URL || 'http://localhost:8080';
const OUTPUT_DIR = join(projectRoot, 'src', 'assets', 'downloaded-images');

// Función para obtener información de una galería
async function fetchGalleryInfo(galleryName) {
  try {
    const response = await fetch(`${API_URL}/gallery/${galleryName}`);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const gallery = await response.json();
    return gallery;
  } catch (error) {
    log(`✗ Error al obtener galería "${galleryName}": ${error.message}`, 'red');
    return null;
  }
}

// Función para descargar una imagen
async function downloadImage(imageName) {
  try {
    const response = await fetch(`${API_URL}/image/get/${imageName}`);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    // Obtener el tipo de contenido para determinar la extensión
    const contentType = response.headers.get('content-type') || 'image/jpeg';
    const extension = contentType.split('/')[1] || 'jpg';

    // Obtener el buffer de la imagen
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Guardar la imagen
    const filename = `${imageName}.${extension}`;
    const filepath = join(OUTPUT_DIR, filename);

    await writeFile(filepath, buffer);

    log(`  ✓ Descargada: ${imageName}`, 'green');
    return { name: imageName, filename, success: true };
  } catch (error) {
    log(`  ✗ Error descargando "${imageName}": ${error.message}`, 'red');
    return { name: imageName, success: false, error: error.message };
  }
}

// Función principal
async function main() {
  log('\n🖼️  Descargador de Imágenes para Astro Build\n', 'bright');
  log(`📡 API URL: ${API_URL}`, 'cyan');
  log(`📁 Directorio de salida: ${OUTPUT_DIR}\n`, 'cyan');

  // Crear directorio de salida si no existe
  if (!existsSync(OUTPUT_DIR)) {
    await mkdir(OUTPUT_DIR, { recursive: true });
    log('✓ Directorio de imágenes creado\n', 'green');
  }

  // Leer configuración
  const configPath = join(projectRoot, 'src', 'config', 'images.json');
  let config;

  try {
    const configContent = await readFile(configPath, 'utf-8');
    config = JSON.parse(configContent);
    log('✓ Configuración cargada\n', 'green');
  } catch (error) {
    log(`✗ Error al leer configuración: ${error.message}`, 'red');
    process.exit(1);
  }

  const results = {
    images: [],
    galleries: {},
    totalDownloaded: 0,
    totalFailed: 0,
  };

  // Descargar imágenes individuales
  if (config.images && config.images.length > 0) {
    log(`📥 Descargando ${config.images.length} imagen(es) individual(es)...`, 'blue');

    for (const imageName of config.images) {
      const result = await downloadImage(imageName);
      results.images.push(result);
      if (result.success) results.totalDownloaded++;
      else results.totalFailed++;
    }

    log('');
  }

  // Descargar imágenes de galerías
  if (config.galleries && config.galleries.length > 0) {
    log(`🖼️  Procesando ${config.galleries.length} galería(s)...`, 'blue');

    for (const galleryName of config.galleries) {
      log(`\n  📂 Galería: "${galleryName}"`, 'yellow');

      const gallery = await fetchGalleryInfo(galleryName);

      if (!gallery) {
        results.galleries[galleryName] = { success: false, images: [] };
        results.totalFailed++;
        continue;
      }

      log(`  ℹ️  Encontradas ${gallery.images?.length || 0} imagen(es)`, 'cyan');

      const galleryResults = [];

      if (gallery.images && gallery.images.length > 0) {
        // Ordenar por orden si existe
        const sortedImages = gallery.images.sort((a, b) => {
          const orderA = a.order !== undefined ? a.order : Infinity;
          const orderB = b.order !== undefined ? b.order : Infinity;
          return orderA - orderB;
        });

        for (const galleryImage of sortedImages) {
          const imageName = galleryImage.image.name;
          const result = await downloadImage(imageName);
          galleryResults.push(result);
          if (result.success) results.totalDownloaded++;
          else results.totalFailed++;
        }
      }

      results.galleries[galleryName] = {
        success: true,
        images: galleryResults,
      };
    }

    log('');
  }

  // Crear archivo de manifiesto con metadata
  const manifest = {
    generatedAt: new Date().toISOString(),
    apiUrl: API_URL,
    images: config.images,
    galleries: config.galleries,
    results,
  };

  const manifestPath = join(OUTPUT_DIR, 'manifest.json');
  await writeFile(manifestPath, JSON.stringify(manifest, null, 2));

  // Resumen final
  log('━'.repeat(50), 'cyan');
  log(`\n✨ Descarga completada\n`, 'bright');
  log(`✓ Imágenes descargadas: ${results.totalDownloaded}`, 'green');

  if (results.totalFailed > 0) {
    log(`✗ Fallos: ${results.totalFailed}`, 'red');
  }

  log(`\n📄 Manifiesto generado: ${manifestPath}`, 'cyan');
  log('');

  // Salir con código de error si hubo fallos
  if (results.totalFailed > 0) {
    log('⚠️  Algunas imágenes no pudieron descargarse', 'yellow');
    process.exit(0); // No fallar el build por imágenes faltantes
  }
}

// Ejecutar
main().catch(error => {
  log(`\n✗ Error fatal: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});
