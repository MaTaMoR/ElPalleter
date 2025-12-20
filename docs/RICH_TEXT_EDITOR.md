# Sistema de Editor de Texto Rico

Este documento describe el sistema de edición de texto rico implementado en ElPalleter usando TipTap.

## Descripción General

El sistema permite editar contenido con formato rico (bold, italic, underline, colores, tamaños, alineación, listas, etc.) desde el panel de administración y mostrarlo en el frontend público.

## Componentes Creados

### 1. RichTextEditor (Admin)
**Ubicación:** `/admin/src/components/common/RichTextEditor.jsx`

Editor completo con toolbar que incluye:
- **Formato de texto:** Bold, Italic, Underline
- **Tamaños:** Normal, H1, H2, H3
- **Listas:** Bullet list, Ordered list
- **Alineación:** Left, Center, Right, Justify
- **Colores:** 12 colores predefinidos
- **Deshacer/Rehacer:** Undo/Redo

**Props:**
```jsx
<RichTextEditor
  value={string}          // Contenido HTML inicial
  onChange={function}     // Callback que recibe { json, html }
  placeholder={string}    // Texto placeholder (opcional)
  disabled={boolean}      // Deshabilitar edición (opcional)
/>
```

**Ejemplo de uso:**
```jsx
import RichTextEditor from './components/common/RichTextEditor';

function MyComponent() {
  const [content, setContent] = useState('');

  const handleChange = ({ html, json }) => {
    setContent(html);
    // También puedes guardar json si lo necesitas
  };

  return (
    <RichTextEditor
      value={content}
      onChange={handleChange}
      placeholder="Escribe aquí..."
    />
  );
}
```

### 2. RichTextViewer (Admin/Frontend)
**Ubicación:** `/admin/src/components/common/RichTextViewer.jsx`

Visor de contenido rico (solo lectura) para React:

**Props:**
```jsx
<RichTextViewer
  content={string|object}  // Contenido HTML o JSON de TipTap
  className={string}       // Clase CSS adicional (opcional)
/>
```

**Ejemplo de uso:**
```jsx
import RichTextViewer from './components/common/RichTextViewer';

function MyComponent() {
  const content = '<p>Contenido con <strong>formato</strong></p>';

  return <RichTextViewer content={content} />;
}
```

### 3. RichTextContent (Astro)
**Ubicación:** `/src/components/i18n/RichTextContent.astro`

Componente para mostrar contenido rico en páginas Astro:

**Props:**
```astro
---
import RichTextContent from '@/components/i18n/RichTextContent.astro';

const content = '<p>Contenido con <strong>formato</strong></p>';
---

<RichTextContent content={content} className="my-custom-class" />
```

### 4. RichContentForm (Admin)
**Ubicación:** `/admin/src/components/settings/RichContentForm.jsx`

Formulario completo para editar contenido rico con soporte multiidioma:

**Props:**
```jsx
<RichContentForm
  id={string}                    // ID único del formulario
  contentKey={string}            // Clave del contenido en rich-content.json
  title={string}                 // Título del formulario
  onHasChangesChange={function}  // Callback para notificar cambios
  isEditing={boolean}            // Modo edición activo/inactivo
  ref={ref}                      // Ref para métodos save() y cancel()
/>
```

**Métodos expuestos vía ref:**
- `save()`: Guarda los cambios (retorna una Promise)
- `cancel()`: Cancela los cambios y restaura el contenido original

### 5. ContentPage (Admin)
**Ubicación:** `/admin/src/pages/content/ContentPage.jsx`

Página completa de administración que integra el RichContentForm con:
- Modo edición/visualización
- Botones Guardar/Cancelar
- Confirmación de cambios
- Toasts de notificación
- Overlay de guardado

**Acceso:** `/admin/content`

## Estructura de Datos

### Formato en rich-content.json
```json
{
  "historia_content": {
    "es": {
      "html": "<h2>Título</h2><p>Contenido en <strong style=\"color: #FF0000\">español</strong></p>"
    },
    "en": {
      "html": "<h2>Title</h2><p>Content in <strong style=\"color: #FF0000\">English</strong></p>"
    },
    "val": {
      "html": "<h2>Títol</h2><p>Contingut en <strong style=\"color: #FF0000\">valencià</strong></p>"
    }
  }
}
```

**Estructura:**
- Cada sección de contenido tiene una clave (ej: `historia_content`)
- Cada clave contiene un objeto con los idiomas soportados
- Cada idioma tiene un objeto con la propiedad `html` que contiene el HTML generado por TipTap

## Tecnologías Utilizadas

### TipTap
Editor de texto rico basado en ProseMirror.

**Dependencias instaladas:**
```json
{
  "@tiptap/react": "^latest",
  "@tiptap/pm": "^latest",
  "@tiptap/starter-kit": "^latest",
  "@tiptap/extension-color": "^latest",
  "@tiptap/extension-text-style": "^latest",
  "@tiptap/extension-underline": "^latest",
  "@tiptap/extension-text-align": "^latest"
}
```

**Extensiones configuradas:**
- `StarterKit`: Funcionalidad básica (headings, paragraphs, bold, italic, lists, undo/redo)
- `Underline`: Texto subrayado
- `TextAlign`: Alineación de texto
- `TextStyle`: Estilos de texto personalizados
- `Color`: Color de texto

## Integración con el Backend

### Guardar contenido
El método `save()` del RichContentForm debe ser actualizado para enviar los datos al backend.

**Implementación sugerida:**
```jsx
save: async () => {
  // Construir el payload
  const payload = {
    key: contentKey,
    content: content
  };

  // Llamar al servicio/API
  const response = await fetch('/api/rich-content', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error('Error al guardar el contenido');
  }

  // Actualizar el contenido original
  setOriginalContent(JSON.parse(JSON.stringify(content)));
}
```

### Cargar contenido
Actualmente el componente carga el contenido desde `/data/rich-content.json`. Para cargar desde el backend:

```jsx
const loadContent = async () => {
  try {
    setIsLoading(true);
    setError(null);

    // Llamar al backend
    const response = await fetch(`/api/rich-content/${contentKey}`);
    if (!response.ok) {
      throw new Error('Error al cargar el contenido');
    }

    const data = await response.json();
    setContent(data);
    setOriginalContent(JSON.parse(JSON.stringify(data)));
  } catch (err) {
    console.error('Error loading content:', err);
    setError(err.message);
  } finally {
    setIsLoading(false);
  }
};
```

## Uso en el Frontend Público

### En páginas Astro
```astro
---
import RichTextContent from '@/components/i18n/RichTextContent.astro';

// Cargar el contenido (desde API o archivo estático)
import richContent from '@/data/rich-content.json';

const lang = 'es';
const content = richContent.historia_content[lang].html;
---

<section class="historia">
  <RichTextContent content={content} />
</section>
```

### En componentes React (en Astro)
```jsx
import RichTextViewer from '@/components/common/RichTextViewer';

function HistoriaSection({ lang }) {
  const [content, setContent] = useState('');

  useEffect(() => {
    // Cargar contenido
    fetch('/data/rich-content.json')
      .then(res => res.json())
      .then(data => {
        setContent(data.historia_content[lang].html);
      });
  }, [lang]);

  return (
    <section className="historia">
      <RichTextViewer content={content} />
    </section>
  );
}
```

## Estilos

Los componentes incluyen estilos CSS Module que pueden ser personalizados:

### Variables CSS disponibles
```css
--border-color: #e5e7eb;
--bg-secondary: #f9fafb;
--text-primary: #374151;
--text-secondary: #9ca3af;
--text-placeholder: #9ca3af;
--primary-color: #3b82f6;
--hover-bg: #e5e7eb;
--danger-color: #ef4444;
--warning-bg: #fef3c7;
--warning-border: #fbbf24;
--warning-text: #92400e;
```

### Personalizar estilos del contenido
Para personalizar los estilos del contenido visualizado, puedes sobrescribir las clases globales en tu CSS:

```css
.rich-text-content h1 {
  font-size: 3em;
  color: #custom-color;
}

.rich-text-content p {
  line-height: 2;
  font-family: 'Custom Font', serif;
}
```

## Añadir más tipos de contenido

Para añadir más secciones editables:

1. **Agregar al rich-content.json:**
```json
{
  "nueva_seccion": {
    "es": { "html": "" },
    "en": { "html": "" },
    "val": { "html": "" }
  }
}
```

2. **Agregar al ContentPage.jsx:**
```jsx
const nuevaSeccionRef = useRef(null);

// En childrenHasChanges:
const [childrenHasChanges, setChildrenHasChanges] = useState({
  historia: false,
  nuevaSeccion: false
});

// En el JSX:
<RichContentForm
  id="nuevaSeccion"
  contentKey="nueva_seccion"
  title="Nueva Sección"
  ref={nuevaSeccionRef}
  onHasChangesChange={handleChildHasChangesChange}
  isEditing={isEditing}
/>
```

## Próximos Pasos / Mejoras Futuras

1. **Integración completa con el backend:**
   - Crear endpoints en el backend para guardar/cargar contenido
   - Implementar autenticación y autorización
   - Validación de datos en el servidor

2. **Funcionalidades adicionales del editor:**
   - Insertar imágenes
   - Insertar enlaces
   - Más opciones de formato (strikethrough, code, blockquote)
   - Custom font families
   - Font size numérico (no solo headings)

3. **Mejoras de UX:**
   - Preview side-by-side (editor + vista previa)
   - Auto-save
   - Historial de versiones
   - Búsqueda y reemplazo

4. **Optimización:**
   - Lazy loading del editor
   - Code splitting
   - Caché de contenido

## Solución de Problemas

### El editor no muestra el contenido
- Verifica que el formato HTML sea válido
- Asegúrate de que las extensiones de TipTap estén correctamente configuradas

### Los estilos no se aplican
- Verifica que los CSS modules estén importados
- Asegúrate de que las variables CSS estén definidas en tu tema global

### Error al guardar
- Verifica la conexión con el backend
- Revisa los logs del navegador para más detalles
- Asegúrate de que el token de autenticación sea válido

## Soporte

Para más información sobre TipTap:
- Documentación oficial: https://tiptap.dev/
- Ejemplos: https://tiptap.dev/examples
- API Reference: https://tiptap.dev/api

## Licencia

Este código es parte del proyecto ElPalleter.
