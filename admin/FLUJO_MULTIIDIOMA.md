# 🌍 Flujo Completo del Sistema Multi-Idioma

## Caso de Uso Real: Crear y Traducir una Categoría

### 📋 Escenario
Un restaurante quiere añadir la categoría "Postres" a su carta y traducirla a inglés y catalán.

---

## 🎬 Acto 1: Creación en Español

### Frontend
```
┌─────────────────────────────────────────┐
│  Panel de Administración                │
│  [Selector de idioma: Español ▼]        │
│                                          │
│  Usuario hace clic en "Añadir Categoría"│
│  Escribe: "Postres"                      │
│  Hace clic en "Guardar"                  │
└─────────────────────────────────────────┘
```

### Request HTTP
```http
POST http://92.186.195.152:8080/carta/update?language=es
Content-Type: application/json

[
  {
    "id": null,                  ← NUEVO elemento
    "nameKey": "Postres",
    "orderIndex": 2,
    "createdAt": "2025-11-19T10:30:00Z",
    "updatedAt": "2025-11-19T10:30:00Z",
    "subcategories": []
  }
]
```

### Backend (Spring Boot)
```java
// 1. Detectar que id = null → Es NUEVO
if (category.getId() == null) {
    // 2. Generar ID
    String newId = "cat-3"; // O UUID, o auto-increment

    // 3. Crear entidad principal (sin textos)
    Category entity = new Category();
    entity.setId(newId);
    entity.setOrderIndex(2);
    categoryRepository.save(entity);

    // 4. Crear traducciones para TODOS los idiomas
    List<String> supportedLanguages = List.of("es", "en", "ca");

    for (String lang : supportedLanguages) {
        CategoryTranslation translation = new CategoryTranslation();
        translation.setCategory(entity);
        translation.setLanguage(lang);
        translation.setName("Postres"); // ← Mismo texto para todos inicialmente
        translationRepository.save(translation);
    }
}
```

### Base de Datos después de la creación
```
categories:
┌────────┬────────────┬─────────────────────┐
│   id   │ orderIndex │     createdAt       │
├────────┼────────────┼─────────────────────┤
│ cat-3  │     2      │ 2025-11-19 10:30:00 │
└────────┴────────────┴─────────────────────┘

category_translations:
┌────────────┬──────────┬─────────┐
│ categoryId │ language │  name   │
├────────────┼──────────┼─────────┤
│   cat-3    │    es    │ Postres │ ← Del request
│   cat-3    │    en    │ Postres │ ← Copiado
│   cat-3    │    ca    │ Postres │ ← Copiado
└────────────┴──────────┴─────────┘
```

### Response HTTP
```json
[
  {
    "id": "cat-3",              ← Ahora tiene ID real
    "nameKey": "Postres",
    "orderIndex": 2,
    "createdAt": "2025-11-19T10:30:00Z",
    "updatedAt": "2025-11-19T10:30:00Z",
    "subcategories": []
  }
]
```

---

## 🎬 Acto 2: Traducción a Inglés

### Frontend
```
┌─────────────────────────────────────────┐
│  Panel de Administración                │
│  [Selector de idioma: English ▼]        │ ← Usuario cambia idioma
│                                          │
│  Categorías:                             │
│  • Starters                              │
│  • Main Courses                          │
│  • Postres          ← Sin traducir aún  │
│                                          │
│  Usuario hace clic en "Editar"           │
│  Cambia "Postres" → "Desserts"           │
│  Hace clic en "Guardar"                  │
└─────────────────────────────────────────┘
```

### Request HTTP
```http
POST http://92.186.195.152:8080/carta/update?language=en
Content-Type: application/json

[
  {
    "id": "cat-3",               ← ID existente
    "nameKey": "Desserts",       ← Texto traducido
    "orderIndex": 2,
    "createdAt": "2025-11-19T10:30:00Z",
    "updatedAt": "2025-11-19T10:35:00Z",
    "subcategories": []
  }
]
```

### Backend (Spring Boot)
```java
// 1. Detectar que id existe → Es UPDATE
if (category.getId() != null) {
    // 2. NO tocar la entidad principal
    // 3. SOLO actualizar la traducción del idioma recibido

    String language = request.getParameter("language"); // "en"

    CategoryTranslation translation = translationRepository
        .findByCategoryIdAndLanguage("cat-3", "en");

    translation.setName("Desserts"); // ← Actualizar solo este idioma
    translationRepository.save(translation);

    // 4. NO tocar las traducciones de 'es' y 'ca'
}
```

### Base de Datos después de la traducción
```
categories: (SIN CAMBIOS)
┌────────┬────────────┬─────────────────────┐
│   id   │ orderIndex │     createdAt       │
├────────┼────────────┼─────────────────────┤
│ cat-3  │     2      │ 2025-11-19 10:30:00 │
└────────┴────────────┴─────────────────────┘

category_translations:
┌────────────┬──────────┬──────────┐
│ categoryId │ language │   name   │
├────────────┼──────────┼──────────┤
│   cat-3    │    es    │ Postres  │ ← Sin cambios
│   cat-3    │    en    │ Desserts │ ← ACTUALIZADO
│   cat-3    │    ca    │ Postres  │ ← Sin cambios
└────────────┴──────────┴──────────┘
```

---

## 🎬 Acto 3: Verificación en Catalán

### Frontend
```
┌─────────────────────────────────────────┐
│  Panel de Administración                │
│  [Selector de idioma: Català ▼]         │ ← Usuario cambia a catalán
│                                          │
│  Categories:                             │
│  • Entrants                              │
│  • Plats principals                      │
│  • Postres          ← Igual que español  │
│                                          │
│  (Usuario decide dejarlo igual)          │
└─────────────────────────────────────────┘
```

**Nota**: En catalán, "Postres" es correcto, así que no hay cambios.

---

## 🎬 Acto 4: Eliminación (Bonus)

### Frontend
```
┌─────────────────────────────────────────┐
│  [Selector de idioma: Español ▼]        │
│                                          │
│  Usuario elimina la categoría "Postres" │
│  Hace clic en "Guardar"                  │
└─────────────────────────────────────────┘
```

### Request HTTP
```http
POST http://92.186.195.152:8080/carta/update?language=es
Content-Type: application/json

[
  // La categoría cat-3 ya NO está en el array
]
```

### Backend (Spring Boot)
```java
// 1. Comparar IDs enviados vs IDs en BD
List<String> receivedIds = ["cat-1", "cat-2"]; // cat-3 falta
List<String> dbIds = ["cat-1", "cat-2", "cat-3"];

// 2. Detectar elementos eliminados
List<String> toDelete = dbIds - receivedIds; // ["cat-3"]

// 3. Eliminar entidad Y todas sus traducciones
for (String id : toDelete) {
    // Eliminar traducciones (o usar cascade)
    translationRepository.deleteByCategoryId(id);

    // Eliminar entidad
    categoryRepository.deleteById(id);
}
```

### Base de Datos después de la eliminación
```
categories:
┌────────┬────────────┐
│   id   │ orderIndex │
├────────┼────────────┤
│ cat-1  │     0      │
│ cat-2  │     1      │
└────────┴────────────┘

category_translations:
┌────────────┬──────────┬───────────────┐
│ categoryId │ language │     name      │
├────────────┼──────────┼───────────────┤
│   cat-1    │    es    │   Entrantes   │
│   cat-1    │    en    │   Starters    │
│   cat-1    │    ca    │   Entrants    │
│   cat-2    │    es    │ Platos Princ. │
│   cat-2    │    en    │ Main Courses  │
│   cat-2    │    ca    │ Plats princ.  │
└────────────┴──────────┴───────────────┘

// cat-3 y todas sus traducciones eliminadas ✓
```

---

## 📊 Resumen Visual

```
┌─────────────────────────────────────────────────────────────┐
│                    SISTEMA MULTI-IDIOMA                     │
└─────────────────────────────────────────────────────────────┘

Entidad (Category)           Traducciones (CategoryTranslation)
┌─────────────┐             ┌──────────────────────────────────┐
│ id: cat-3   │─────────────│ cat-3 | es | Postres             │
│ order: 2    │             │ cat-3 | en | Desserts            │
│ created: .. │             │ cat-3 | ca | Postres             │
└─────────────┘             └──────────────────────────────────┘
     ↑                                    ↑
     │                                    │
     └────────────────────────────────────┘
            Mismo ID, diferentes textos
```

### Reglas de Oro

1. **Una entidad** → **Múltiples traducciones**
2. **Crear nuevo** → Crear traducciones en TODOS los idiomas
3. **Editar existente** → Actualizar SOLO el idioma actual
4. **Eliminar** → Eliminar entidad Y todas sus traducciones

---

## 🔍 Caso Edge: ¿Qué pasa si falta un idioma?

Si la BD solo tiene traducciones para 'es' y 'en', pero no para 'ca':

```
category_translations:
┌────────────┬──────────┬──────────┐
│ categoryId │ language │   name   │
├────────────┼──────────┼──────────┤
│   cat-3    │    es    │ Postres  │
│   cat-3    │    en    │ Desserts │
└────────────┴──────────┴──────────┘
                         ↑ Falta 'ca'
```

### Opción 1: Backend retorna vacío
```http
GET /carta/translated-categories?language=ca

Response:
[
  {
    "id": "cat-3",
    "nameKey": "",          ← Vacío o null
    "orderIndex": 2
  }
]
```

### Opción 2: Backend retorna fallback (español)
```http
GET /carta/translated-categories?language=ca

Response:
[
  {
    "id": "cat-3",
    "nameKey": "Postres",   ← Fallback a 'es'
    "orderIndex": 2
  }
]
```

**Recomendación**: Usar Opción 1 (vacío) para que el usuario sepa que falta traducir.

---

## ✅ Checklist para el Backend

- [ ] Crear tablas con relaciones (Category ←→ CategoryTranslation)
- [ ] Endpoint POST /carta/update?language=X
- [ ] Al crear nuevo (id=null): Insertar en TODOS los idiomas
- [ ] Al editar (id!=null): Actualizar SOLO el idioma del request
- [ ] Al eliminar: Comparar enviado vs BD y borrar faltantes
- [ ] Usar cascade para eliminar traducciones automáticamente
- [ ] Endpoint GET /carta/translated-categories?language=X
- [ ] Retornar traducción del idioma solicitado
- [ ] Manejar caso cuando falta traducción
