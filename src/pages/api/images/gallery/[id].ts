import type { APIRoute } from 'astro';

// Mapeo temporal de IDs a rutas de imágenes
// Esto eventualmente se conectará a tu base de datos
const imageMap: Record<string, string> = {
  '1': '/images/gallery/paella-valenciana.jpg',
  '2': '/images/gallery/restaurant-interior.jpg', 
  '3': '/images/gallery/arroz-negro.jpg',
  '4': '/images/gallery/terrace-view.jpg',
  '5': '/images/gallery/chef-cooking.jpg'
};

// Configuración de imágenes con metadatos
const imageMetadata: Record<string, {
  path: string;
  width: number;
  height: number;
  format: string;
  alt: string;
  lastModified: string;
}> = {
  '1': {
    path: '/images/gallery/paella-valenciana.jpg',
    width: 1200,
    height: 800,
    format: 'image/jpeg',
    alt: 'Paella Valenciana',
    lastModified: '2024-01-15T10:00:00Z'
  },
  '2': {
    path: '/images/gallery/restaurant-interior.jpg',
    width: 1200,
    height: 800,
    format: 'image/jpeg', 
    alt: 'Interior del restaurante',
    lastModified: '2024-01-15T10:00:00Z'
  },
  '3': {
    path: '/images/gallery/arroz-negro.jpg',
    width: 1200,
    height: 800,
    format: 'image/jpeg',
    alt: 'Arroz Negro',
    lastModified: '2024-01-15T10:00:00Z'
  },
  '4': {
    path: '/images/gallery/terrace-view.jpg', 
    width: 1200,
    height: 800,
    format: 'image/jpeg',
    alt: 'Vista de la terraza',
    lastModified: '2024-01-15T10:00:00Z'
  },
  '5': {
    path: '/images/gallery/chef-cooking.jpg',
    width: 1200,
    height: 800, 
    format: 'image/jpeg',
    alt: 'Chef cocinando',
    lastModified: '2024-01-15T10:00:00Z'
  }
};

export const GET: APIRoute = async ({ params, request }) => {
  const { id } = params;
  
  if (!id || !imageMap[id]) {
    return new Response('Image not found', { 
      status: 404,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  const url = new URL(request.url);
  const format = url.searchParams.get('format'); // Para conversión de formato
  const width = url.searchParams.get('width'); // Para redimensionado
  const quality = url.searchParams.get('quality'); // Para compresión

  try {
    // Obtener metadatos de la imagen
    const metadata = imageMetadata[id];
    
    if (!metadata) {
      return new Response('Image metadata not found', { status: 404 });
    }

    // En un entorno real, aquí cargarías la imagen desde el filesystem o base de datos
    // y aplicarías las transformaciones solicitadas (resize, format, quality)
    
    // Por ahora, redirigimos a la imagen estática
    const imagePath = metadata.path;
    
    // Headers para caching y metadatos
    const headers = new Headers({
      'Content-Type': metadata.format,
      'Cache-Control': 'public, max-age=31536000', // 1 año
      'Last-Modified': metadata.lastModified,
      'X-Image-Width': metadata.width.toString(),
      'X-Image-Height': metadata.height.toString()
    });

    // Si se solicitan parámetros de transformación, incluir información
    if (width || quality || format) {
      headers.set('X-Transform-Requested', 'true');
      if (width) headers.set('X-Requested-Width', width);
      if (quality) headers.set('X-Requested-Quality', quality);
      if (format) headers.set('X-Requested-Format', format);
    }
    
    // En desarrollo, redirigir a la imagen estática
    // En producción, aquí servirías la imagen procesada
    return Response.redirect(new URL(imagePath, request.url), 302);
    
  } catch (error) {
    console.error('Error serving image:', error);
    return new Response('Internal server error', { 
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
};

// Endpoint adicional para obtener metadatos sin la imagen
export const HEAD: APIRoute = async ({ params }) => {
  const { id } = params;
  
  if (!id || !imageMetadata[id]) {
    return new Response(null, { status: 404 });
  }

  const metadata = imageMetadata[id];
  
  return new Response(null, {
    status: 200,
    headers: {
      'Content-Type': metadata.format,
      'Content-Length': '0', // En producción, calcular el tamaño real
      'Last-Modified': metadata.lastModified,
      'X-Image-Width': metadata.width.toString(),
      'X-Image-Height': metadata.height.toString()
    }
  });
};