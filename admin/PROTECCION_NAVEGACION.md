# 🛡️ Protección de Navegación - Cambios Sin Guardar

## ¿Qué hace?

Protege el trabajo del usuario mostrando un aviso de confirmación cuando intenta salir de la página de edición de la carta con cambios sin guardar.

---

## 🎯 Escenarios Protegidos

### 1. Navegación Interna (NUEVO)
Cuando el usuario está editando la carta e intenta:
- Ir al Dashboard
- Ir a Usuarios
- Ir a Configuración
- Hacer clic en el logo
- Usar el navegador para ir a otra ruta interna

**Resultado**: Se muestra un diálogo de confirmación antes de permitir la navegación.

### 2. Cerrar Pestaña / Recargar (YA EXISTÍA)
Cuando el usuario:
- Cierra la pestaña del navegador
- Recarga la página (F5 / Ctrl+R)
- Intenta cerrar la ventana

**Resultado**: El navegador muestra su aviso nativo preguntando si quiere salir.

---

## 🧪 Cómo Probar

### Prueba 1: Navegación a otra sección
1. Abre el panel: `http://localhost:5173/admin/menu`
2. Haz clic en **"Editar"**
3. Haz algún cambio (añade categoría, edita nombre, etc.)
4. **NO** hagas clic en "Guardar"
5. Intenta hacer clic en "Dashboard" en el menú lateral

**Esperado**:
```
┌─────────────────────────────────────────┐
│ ⚠️  Cambios sin guardar                 │
│                                          │
│ ¿Estás seguro de que quieres salir?     │
│ Se perderán todos los cambios no        │
│ guardados.                               │
│                                          │
│  [Cancelar]  [Confirmar]                │
└─────────────────────────────────────────┘
```

- Si haces clic en **"Cancelar"**: Te quedas en la página de edición
- Si haces clic en **"Confirmar"**: Navegas al Dashboard (cambios perdidos)

### Prueba 2: Sin cambios, navegación libre
1. Abre el panel: `http://localhost:5173/admin/menu`
2. **SIN** hacer cambios, haz clic en "Dashboard"

**Esperado**: Navegas directamente sin aviso (no hay cambios que perder)

### Prueba 3: Cambios guardados
1. Abre el panel: `http://localhost:5173/admin/menu`
2. Haz clic en **"Editar"**
3. Haz algún cambio
4. Haz clic en **"Guardar"** y confirma
5. Después de guardar, haz clic en "Dashboard"

**Esperado**: Navegas directamente sin aviso (cambios guardados)

### Prueba 4: Cancelar cambios
1. Abre el panel: `http://localhost:5173/admin/menu`
2. Haz clic en **"Editar"**
3. Haz algún cambio
4. Haz clic en **"Cancelar"** y confirma
5. Después de cancelar, haz clic en "Dashboard"

**Esperado**: Navegas directamente sin aviso (cambios cancelados)

### Prueba 5: Cerrar pestaña
1. Abre el panel: `http://localhost:5173/admin/menu`
2. Haz clic en **"Editar"**
3. Haz algún cambio
4. Intenta cerrar la pestaña del navegador

**Esperado**: El navegador muestra su aviso nativo preguntando si quieres salir

---

## 🔧 Cómo Funciona (Técnico)

### Hook: `useNavigationBlocker`
```javascript
// Ubicación: admin/src/hooks/useNavigationBlocker.js
// Usa React Router's unstable_useBlocker
```

**Funcionamiento**:
1. Detecta cuando el usuario intenta navegar a otra ruta
2. Comprueba si `shouldBlock` es `true` (hay cambios sin guardar)
3. Si es `true`, bloquea la navegación y llama a `onBlock`
4. `onBlock` muestra el diálogo de confirmación
5. Si el usuario confirma, llama a `proceed()` y permite la navegación
6. Si el usuario cancela, llama a `reset()` y permanece en la página

### Integración en `MenuEditContext`
```javascript
// Ubicación: admin/src/contexts/MenuEditContext.jsx

// Solo bloquea si hay cambios reales
useNavigationBlocker(menuState.hasRealChanges(), handleNavigationBlock);
```

### Lógica de Detección de Cambios
El sistema considera que hay "cambios reales" cuando:
- Se ha creado una nueva categoría/subcategoría/item
- Se ha editado el nombre, descripción o precio de un elemento
- Se ha eliminado un elemento
- Se ha reordenado la estructura

**NO** considera cambios cuando:
- Solo se expande/colapsa una categoría (visual)
- Se navega entre categorías (visual)
- Se hace búsqueda (visual)

---

## ⚠️ Notas Importantes

### 1. React Router Experimental
Usamos `unstable_useBlocker` de React Router v6.26.1, que es experimental pero funcional.
- **Pros**: API oficial de React Router
- **Contras**: Puede cambiar en futuras versiones
- **Alternativa**: Si da problemas, podemos usar un enfoque custom

### 2. Doble Protección
Tienes dos capas de protección:
1. **Navegación interna** (React Router): Diálogo custom controlado
2. **Cerrar pestaña** (beforeunload): Aviso nativo del navegador

### 3. No Protege
Este sistema **NO** protege contra:
- Cerrar el navegador completamente
- Apagar el ordenador
- Pérdida de conexión a internet (pero los cambios están en memoria)

---

## 🐛 Troubleshooting

### Problema: El aviso no aparece
**Posibles causas**:
1. No hay cambios reales (solo visuales)
2. Ya se guardaron los cambios
3. Ya se cancelaron los cambios

**Solución**: Verifica que realmente haya cambios sin guardar

### Problema: El aviso aparece cuando no debería
**Posibles causas**:
1. El sistema de detección de cambios tiene un bug

**Solución**: Revisa `menuState.hasRealChanges()` en la consola

### Problema: Error en consola sobre "unstable_useBlocker"
**Posibles causas**:
1. Versión de React Router incompatible

**Solución**:
```bash
cd admin
npm list react-router-dom
# Debería ser v6.26.1 o superior
```

---

## ✅ Checklist de Pruebas

- [ ] Navegar con cambios muestra diálogo
- [ ] Confirmar en diálogo permite navegación
- [ ] Cancelar en diálogo mantiene en página
- [ ] Navegar sin cambios NO muestra diálogo
- [ ] Cerrar pestaña con cambios muestra aviso nativo
- [ ] Guardar cambios libera la protección
- [ ] Cancelar cambios libera la protección
- [ ] Hacer clic en logo con cambios muestra diálogo
- [ ] Cambiar idioma con cambios muestra diálogo
