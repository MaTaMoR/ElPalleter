# 📡 Guía de Integración Backend - Sistema de Carta

## 🎯 Objetivo

Este documento explica cómo ver los datos **reales** que se envían al backend cuando guardas la carta desde el panel de administración.

---

## 🔍 Cómo Ver los Datos Reales

### Paso 1: Abrir el Panel de Administración
1. Ejecuta el proyecto: `npm run dev` (desde `/admin`)
2. Ve a: `http://localhost:5173/admin/menu`

### Paso 2: Abrir la Consola del Navegador
- **Chrome/Edge**: F12 o Ctrl+Shift+I
- **Firefox**: F12 o Ctrl+Shift+K
- **Safari**: Cmd+Option+I

### Paso 3: Hacer Cambios en la Carta
1. Haz clic en el botón **"Editar"** (arriba a la derecha)
2. Realiza cambios:
   - Añade una nueva categoría, subcategoría o item
   - Edita un nombre o precio existente
   - Elimina un elemento
   - Reordena elementos arrastrándolos

### Paso 4: Guardar y Ver los Datos
1. Haz clic en **"Guardar"**
2. Confirma en el diálogo
3. **En la consola del navegador** verás algo como esto:

```
================================================================================
📤 DATOS QUE SE ENVÍAN AL BACKEND:
================================================================================
Idioma: es
URL: http://92.186.195.152:8080/carta/update?language=es
Método: POST
Headers: { Content-Type: 'application/json' }

Body (estructura completa):
[
  {
    "id": "cat-1",
    "nameKey": "Entrantes",
    "orderIndex": 0,
    ...
  }
]
================================================================================
📊 ESTADÍSTICAS:
- Total categorías: 3
- Total subcategorías: 4
- Total items: 12
================================================================================
```

### Paso 5: Copiar los Datos
- Haz clic derecho en el JSON mostrado en la consola
- Selecciona "Copy object" o copia manualmente el texto
- Pégalo en tu herramienta de desarrollo backend (Postman, IntelliJ, etc.)

---

## 📋 Estructura de Datos

### Archivo de Ejemplo
He creado un archivo de ejemplo con la estructura completa:
- **Ubicación**: `/admin/EJEMPLO_PAYLOAD_BACKEND.json`
- Contiene:
  - Estructura completa del payload
  - Notas sobre elementos nuevos (id = null)
  - Lógica sugerida para el backend
  - Respuesta esperada

### Campos Importantes

#### Categoría
```json
{
  "id": "cat-1",          // null si es nueva
  "nameKey": "Entrantes",
  "orderIndex": 0,
  "createdAt": "2024-01-15T10:00:00Z",
  "updatedAt": "2024-01-20T15:30:00Z",
  "subcategories": [...]
}
```

#### Subcategoría
```json
{
  "id": "sub-1",          // null si es nueva
  "nameKey": "Ensaladas",
  "orderIndex": 0,
  "createdAt": "2024-01-15T10:00:00Z",
  "updatedAt": "2024-01-20T15:30:00Z",
  "items": [...]
}
```

#### Item
```json
{
  "id": "item-1",                    // null si es nuevo
  "nameKey": "Ensalada César",
  "descriptionKey": "Lechuga, pollo...",
  "price": 8.5,                      // Siempre float, nunca string
  "available": true,                 // Boolean
  "orderIndex": 0,
  "createdAt": "2024-01-15T10:00:00Z",
  "updatedAt": "2024-01-20T15:30:00Z"
}
```

---

## 🎓 Reglas Importantes

### 1. Elementos Nuevos
- Cuando `id` es `null`, es un elemento que **NO existe en la base de datos**
- El backend debe hacer un `INSERT` y devolver el nuevo ID asignado

### 2. Elementos Existentes
- Cuando `id` tiene un valor (ej: `"cat-1"`), el elemento ya existe
- El backend debe hacer un `UPDATE`

### 3. Elementos Eliminados
- **NO se envían** en el payload
- El backend debe comparar lo que recibe vs lo que tiene en BD
- Hacer `DELETE` de lo que falta

### 4. Orden de Elementos
- El campo `orderIndex` define el orden (0, 1, 2...)
- Es importante mantener este orden en la BD

### 5. Idioma
- Se envía como query parameter: `?language=es`
- El frontend puede cambiar entre `es`, `en`, `ca`, etc.

---

## 🔧 Endpoint Requerido en Backend

### Request
```
POST http://92.186.195.152:8080/carta/update?language=es
Content-Type: application/json

[
  {
    "id": "cat-1",
    "nameKey": "Entrantes",
    ...
  }
]
```

### Response Esperada
```json
[
  {
    "id": "cat-1",           // IDs reales (sin nulls)
    "nameKey": "Entrantes",
    "orderIndex": 0,
    "createdAt": "2024-01-15T10:00:00Z",
    "updatedAt": "2024-11-19T12:00:00Z",  // Timestamp actualizado
    "subcategories": [...]
  }
]
```

---

## 🚀 Siguiente Paso

1. **Frontend** (este repo):
   - ✅ Ya está listo
   - ✅ Ya envía los datos correctamente
   - Solo necesita que el backend responda

2. **Backend** (otro repo):
   - Crear el endpoint `POST /carta/update`
   - Implementar la lógica CRUD (INSERT/UPDATE/DELETE)
   - Devolver la estructura actualizada

---

## 📞 Testing

### Con Postman/Insomnia
1. Copia el contenido de `EJEMPLO_PAYLOAD_BACKEND.json`
2. Crea una request POST a tu backend local
3. Pega el body
4. Verifica que la respuesta tenga la misma estructura pero con IDs reales

### Con el Frontend Real
1. Una vez que el backend esté listo
2. Simplemente usa el panel de administración
3. Los cambios se guardarán automáticamente

---

## ⚠️ Debugging

Si algo no funciona, revisa:
1. **Consola del navegador**: Verás errores HTTP o de red
2. **Network tab**: Verás la request/response completa
3. **Backend logs**: Verás qué está recibiendo el servidor

---

## 📝 Notas

- El archivo `admin/src/contexts/MenuEditContext.jsx` tiene el logging detallado (líneas 141-157)
- Puedes remover o comentar el logging una vez que la integración funcione
- La URL del backend se configura en `admin/src/services/MenuRepository.js:6`
