# Sistema de Optimización de Imágenes

Este documento describe cómo funciona el sistema automático de optimización de imágenes para el frontend de Astro.

## 📋 Descripción General

El sistema descarga imágenes del backend Spring Boot durante el proceso de build y las optimiza automáticamente usando las capacidades nativas de Astro. Esto permite:

- ✅ Generación automática de múltiples tamaños (responsive images)
- ✅ Conversión a formatos modernos (WebP)
- ✅ Optimización de rendimiento sin carga adicional en el servidor
- ✅ Imágenes estáticas servidas eficientemente

## 🔧 Componentes del Sistema

### 1. Configuración de Imágenes
**Archivo:** `src/config/images.json`

Define qué imágenes necesita el sitio:

```json
{
  "images": [
    "hero-main.jpg"
  ],
  "galleries": [
    "historia"
  ]
}
```

- **`images`**: Array de nombres de imágenes individuales
- **`galleries`**: Array de nombres de galerías (se descargan todas las imágenes de cada galería)

### 2. Script de Descarga
**Archivo:** `scripts/download-images.js`

Script ejecutado automáticamente durante el build que:

1. Lee la configuración de `images.json`
2. Para cada imagen individual: descarga desde `/image/get/{name}`
3. Para cada galería:
   - Obtiene información de la galería desde `/gallery/{name}`
   - Descarga cada imagen de la galería
4. Guarda todas las imágenes en `src/assets/downloaded-images/`
5. Genera un archivo `manifest.json` con metadata

**Ejecución manual:**
```bash
npm run download-images
```

### 3. Componente ResponsiveImage
**Archivo:** `src/components/public/ResponsiveImage.astro`

Componente optimizado que:

- Usa `<Image>` de Astro para optimización automática
- Carga imágenes desde `src/assets/downloaded-images/`
- Genera múltiples tamaños: 400w, 800w, 1200w, 1600w, 2000w
- Convierte automáticamente a WebP
- Mantiene efectos de loading (shimmer) y fallback UI

**Props:**
```typescript
interface Props {
    imageId: string;           // Nombre de la imagen (sin extensión)
    alt?: string;              // Texto alternativo
    className?: string;        // Clases CSS adicionales
    loading?: 'eager' | 'lazy'; // Estrategia de carga
    sizes?: string;            // Atributo sizes para responsive
    objectFit?: string;        // CSS object-fit
    objectPosition?: string;   // CSS object-position
    showFallback?: boolean;    // Mostrar UI de fallback si no se encuentra
    fallbackText?: string;     // Texto personalizado de fallback
    fallbackIcon?: string;     // Icono de fallback
    priority?: boolean;        // Carga prioritaria (eager)
}
```

## 🚀 Flujo de Trabajo

### Durante el Desarrollo
1. Asegúrate de que el backend Spring Boot esté corriendo
2. Ejecuta `npm run dev` normalmente
3. Las imágenes se cargarán dinámicamente (sin optimización)

### Durante el Build
1. Se ejecuta `npm run build:astro`
2. El script de descarga se ejecuta automáticamente
3. Las imágenes se descargan del backend
4. Astro optimiza y genera múltiples versiones
5. El sitio estático se genera con las imágenes optimizadas

### Rebuild desde Webhook
Cuando el backend activa un rebuild:
1. El webhook inicia el proceso de build
2. Las imágenes se descargan nuevamente del backend
3. Se reconstruye el sitio con las imágenes actualizadas

## 📁 Estructura de Archivos

```
project/
├── src/
│   ├── assets/
│   │   └── downloaded-images/     # Imágenes descargadas (git-ignored)
│   │       ├── hero-main.jpg
│   │       ├── imagen-historia-1.jpg
│   │       └── manifest.json      # Metadata de descarga
│   ├── components/
│   │   └── public/
│   │       └── ResponsiveImage.astro
│   └── config/
│       └── images.json            # Configuración de imágenes
└── scripts/
    └── download-images.js         # Script de descarga
```

## ⚙️ Configuración

### Variables de Entorno
El script de descarga usa las siguientes variables para conectarse al backend:

- `VITE_API_URL`: URL de la API (desarrollo y build)
- `PUBLIC_API_URL`: URL alternativa de la API
- Por defecto: `http://localhost:8080`

### Añadir Nuevas Imágenes

Para añadir nuevas imágenes al sistema:

1. **Imagen Individual:**
   ```json
   {
     "images": [
       "hero-main.jpg",
       "nueva-imagen.jpg"  // ← Añadir aquí
     ],
     "galleries": ["historia"]
   }
   ```

2. **Galería Completa:**
   ```json
   {
     "images": ["hero-main.jpg"],
     "galleries": [
       "historia",
       "nueva-galeria"  // ← Añadir aquí
     ]
   }
   ```

3. Ejecuta el build y las nuevas imágenes se descargarán automáticamente

### Personalizar Tamaños de Imagen

Edita `ResponsiveImage.astro` línea 101:

```astro
widths={[400, 800, 1200, 1600, 2000]}  // Personaliza estos valores
```

### Cambiar Formato de Salida

Edita `ResponsiveImage.astro` línea 103:

```astro
format="webp"  // Opciones: "webp", "avif", "png", "jpg"
```

## 🔍 Debugging

### Ver qué imágenes se están cargando

En modo desarrollo, revisa la consola del navegador. Verás logs como:

```
ResponsiveImage [hero-main]: {
  found: true,
  path: "/src/assets/downloaded-images/hero-main.jpg",
  availableImages: 5
}
```

### Si una imagen no se encuentra

1. Verifica que esté en `images.json`
2. Ejecuta `npm run download-images` manualmente
3. Revisa el archivo `src/assets/downloaded-images/manifest.json`
4. Verifica que el backend esté corriendo y sirviendo la imagen

### Si el build falla

1. Asegúrate de que el backend esté accesible en la URL configurada
2. Verifica los logs del script de descarga
3. Ejecuta `npm run download-images` por separado para diagnosticar

## 📊 Ventajas del Sistema

1. **Rendimiento:** Imágenes optimizadas y en múltiples tamaños
2. **Formatos Modernos:** WebP/AVIF automático con fallbacks
3. **Sin Servidor:** Cero procesamiento en runtime
4. **CDN-Friendly:** Todo estático y cacheable
5. **Experiencia de Usuario:** Loading states y fallbacks elegantes
6. **Flexibilidad:** El admin puede subir cualquier tamaño sin preocupaciones

## 🛠️ Mantenimiento

### Limpiar Imágenes Descargadas

```bash
rm -rf src/assets/downloaded-images/
```

Las imágenes se volverán a descargar en el próximo build.

### Actualizar Imágenes Sin Rebuild Completo

```bash
npm run download-images
```

Esto solo descarga las imágenes sin reconstruir todo el sitio.
