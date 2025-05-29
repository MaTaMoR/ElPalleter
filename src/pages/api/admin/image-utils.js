import sharp from 'sharp';

export async function optimizeImage(buffer, options = {}) {
  const {
    width = 1920,
    height = 1080,
    quality = 80,
    format = 'webp'
  } = options;

  try {
    const optimized = await sharp(buffer)
      .resize(width, height, {
        fit: 'cover',
        position: 'center'
      })
      .toFormat(format, { quality })
      .toBuffer();

    return optimized;
  } catch (error) {
    console.error('Image optimization error:', error);
    return buffer; // Devolver original si falla la optimización
  }
}

export function generateImageSizes(buffer) {
  return Promise.all([
    // Desktop
    sharp(buffer).resize(1920, 1080).webp({ quality: 80 }).toBuffer(),
    // Tablet
    sharp(buffer).resize(1024, 768).webp({ quality: 75 }).toBuffer(),
    // Mobile
    sharp(buffer).resize(768, 576).webp({ quality: 70 }).toBuffer(),
    // Thumbnail
    sharp(buffer).resize(300, 200).webp({ quality: 60 }).toBuffer()
  ]);
}

// Función para limpiar archivos huérfanos
export async function cleanupOrphanedFiles() {
  try {
    const { data: orphanedFiles } = await supabase
      .from('media_files')
      .select('*')
      .lt('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)); // Más de 30 días

    // Aquí podrías agregar lógica adicional para verificar si las imágenes
    // están siendo utilizadas en el contenido antes de eliminarlas

    return orphanedFiles?.length || 0;
  } catch (error) {
    console.error('Cleanup error:', error);
    return 0;
  }
}