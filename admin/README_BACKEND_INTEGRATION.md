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

## 🌍 Sistema Multi-Idioma (MUY IMPORTANTE)

### Concepto Fundamental
La carta debe tener la **MISMA ESTRUCTURA** en todos los idiomas, pero los **TEXTOS** son específicos de cada idioma.

### Ejemplo de Flujo Completo

#### Paso 1: Usuario crea categoría en español
```
Usuario selecciona: language = 'es'
Usuario crea categoría: "Postres"
Frontend envía: POST /carta/update?language=es
{
  "id": null,
  "nameKey": "Postres",
  "orderIndex": 2
}
```

#### Paso 2: Backend crea en TODOS los idiomas
```sql
-- Crear entidad
INSERT INTO categories (id, orderIndex) VALUES ('cat-3', 2);

-- Crear traducciones para TODOS los idiomas
INSERT INTO category_translations VALUES ('cat-3', 'es', 'Postres');
INSERT INTO category_translations VALUES ('cat-3', 'en', 'Postres'); -- Mismo texto inicialmente
INSERT INTO category_translations VALUES ('cat-3', 'ca', 'Postres'); -- Mismo texto inicialmente
```

**Nota**: El texto inicial ("Postres") se copia a todos los idiomas. Luego el usuario lo traducirá.

#### Paso 3: Usuario traduce a inglés
```
Usuario cambia selector a: language = 'en'
Usuario ve la categoría con nombre: "Postres" (aún sin traducir)
Usuario edita y cambia el nombre a: "Desserts"
Frontend envía: POST /carta/update?language=en
{
  "id": "cat-3",
  "nameKey": "Desserts",
  "orderIndex": 2
}
```

#### Paso 4: Backend actualiza SOLO el idioma inglés
```sql
-- NO tocar la entidad
-- SOLO actualizar la traducción del idioma especificado
UPDATE category_translations
SET name = 'Desserts'
WHERE categoryId = 'cat-3' AND language = 'en';
```

#### Paso 5: Usuario traduce a catalán
```
Usuario cambia selector a: language = 'ca'
Usuario ve la categoría con nombre: "Postres" (aún sin traducir)
Usuario edita y cambia el nombre a: "Postres" (igual en catalán)
Frontend envía: POST /carta/update?language=ca
{
  "id": "cat-3",
  "nameKey": "Postres",
  "orderIndex": 2
}
```

### Resultado Final en Base de Datos

**Tabla: categories**
| id    | orderIndex | createdAt           | updatedAt           |
|-------|------------|---------------------|---------------------|
| cat-3 | 2          | 2025-11-19 10:00:00 | 2025-11-19 10:00:00 |

**Tabla: category_translations**
| categoryId | language | name     |
|------------|----------|----------|
| cat-3      | es       | Postres  |
| cat-3      | en       | Desserts |
| cat-3      | ca       | Postres  |

### Campos Afectados por Traducciones

| Entidad      | Campos traducibles          |
|--------------|-----------------------------|
| Categoría    | `nameKey`                   |
| Subcategoría | `nameKey`                   |
| Item         | `nameKey`, `descriptionKey` |

### Campos NO Afectados (Iguales en todos los idiomas)

- `id`
- `orderIndex`
- `price`
- `available`
- `createdAt`
- `updatedAt`

### Lógica de Eliminación Multi-Idioma

Cuando eliminas un elemento, se eliminan TODAS sus traducciones:

```sql
-- Usuario elimina la categoría "Postres" (desde cualquier idioma)
-- Backend detecta que cat-3 ya no está en el payload

-- Eliminar la entidad
DELETE FROM categories WHERE id = 'cat-3';

-- Eliminar TODAS las traducciones (en cascada o manualmente)
DELETE FROM category_translations WHERE categoryId = 'cat-3';
```

### Modelo Sugerido para Spring Boot

```java
@Entity
@Table(name = "categories")
public class Category {
    @Id
    private String id;
    private Integer orderIndex;

    @OneToMany(mappedBy = "category", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<CategoryTranslation> translations;
}

@Entity
@Table(name = "category_translations")
public class CategoryTranslation {
    @Id
    @GeneratedValue
    private Long id;

    @ManyToOne
    @JoinColumn(name = "category_id")
    private Category category;

    private String language; // 'es', 'en', 'ca'
    private String name;
}
```

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
