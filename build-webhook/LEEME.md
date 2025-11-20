# 🔨 Build Webhook Service - Guía Rápida

Servicio para ejecutar rebuilds de Astro desde tu backend Spring.

## 🚀 Inicio Rápido

### 1. Las dependencias ya están instaladas

```bash
# Ya ejecutado:
# npm install
```

### 2. El archivo `.env` ya está configurado

El token de seguridad ya ha sido generado: `7909a2a15fa072142b6f1e46816ce78043a917cdc3ebb8d208c880688b238a47`

**IMPORTANTE**: Debes configurar este **mismo token** en tu backend Spring.

### 3. Iniciar el servicio

```bash
# Opción 1: Desarrollo (desde build-webhook/)
npm run dev

# Opción 2: Desde la raíz del proyecto
npm run dev:webhook
```

El servicio estará disponible en: **http://localhost:3002**

### 4. Probar que funciona

```bash
# Test rápido
curl http://localhost:3002/health

# Test completo (ejecutar desde build-webhook/)
./test-webhook.sh 7909a2a15fa072142b6f1e46816ce78043a917cdc3ebb8d208c880688b238a47
```

## 📡 Endpoints Disponibles

| Método | Endpoint | Autenticación | Descripción |
|--------|----------|---------------|-------------|
| GET | `/health` | ❌ No | Verifica que el servicio está activo |
| GET | `/build/status` | ✅ Sí | Estado del último build |
| POST | `/rebuild` | ✅ Sí | Ejecutar rebuild (síncrono o asíncrono) |
| POST | `/rebuild/force` | ✅ Sí | Forzar rebuild ignorando builds en progreso |

## 🔧 Configuración en Spring Boot

### 1. Añade la configuración en `application.yml`:

```yaml
build-webhook:
  url: http://localhost:3002
  secret-token: 7909a2a15fa072142b6f1e46816ce78043a917cdc3ebb8d208c880688b238a47
  timeout: 120000
  enabled: true
```

### 2. Copia las clases Java

Consulta el archivo `SPRING_INTEGRATION.md` para ver todas las clases que necesitas copiar a tu proyecto Spring.

### 3. Ejemplo de uso básico

```java
@Autowired
private BuildWebhookService buildWebhookService;

public void afterUpdateMenu() {
    // Trigger rebuild asíncrono después de actualizar el menú
    buildWebhookService.triggerFullRebuildInBackground();
}
```

## 🎯 Casos de Uso Principales

### 1. Rebuild después de actualizar contenido

```java
@Service
public class CartaService {

    @Autowired
    private BuildWebhookService buildWebhookService;

    public void updateMenu(MenuData data) {
        // 1. Guardar en base de datos
        menuRepository.save(data);

        // 2. Trigger rebuild en background
        buildWebhookService.triggerFullRebuildInBackground();
    }
}
```

### 2. Rebuild programado nocturno

```java
@Scheduled(cron = "0 0 3 * * *") // 3 AM cada día
public void nightlyRebuild() {
    buildWebhookService.triggerFullRebuildInBackground();
}
```

### 3. Rebuild manual desde admin panel

```java
@PostMapping("/api/admin/rebuild")
@PreAuthorize("hasRole('ADMIN')")
public ResponseEntity<?> manualRebuild() {
    return ResponseEntity.ok(
        buildWebhookService.triggerRebuild(true, true)
    );
}
```

## 📊 Ejemplo de Petición HTTP

### Desde cURL:

```bash
curl -X POST http://localhost:3002/rebuild \
  -H "Authorization: Bearer 7909a2a15fa072142b6f1e46816ce78043a917cdc3ebb8d208c880688b238a47" \
  -H "Content-Type: application/json" \
  -d '{
    "buildAstro": true,
    "buildAdmin": true,
    "async": true
  }'
```

### Desde JavaScript (Admin Panel):

```javascript
const response = await fetch('http://localhost:3002/rebuild', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer 7909a2a15fa072142b6f1e46816ce78043a917cdc3ebb8d208c880688b238a47',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    buildAstro: true,
    buildAdmin: true,
    async: true
  })
});

const result = await response.json();
console.log('Rebuild triggered:', result);
```

## ⚙️ Opciones del Rebuild

```javascript
{
  "buildAstro": true,   // Construir aplicación Astro (frontend público)
  "buildAdmin": true,   // Construir panel de admin React
  "async": true         // true = respuesta inmediata, false = espera a que termine
}
```

**Recomendación**: Usa `async: true` en producción para no bloquear las peticiones.

## 🔒 Seguridad

- ✅ Autenticación mediante Bearer token
- ✅ CORS configurado para solo aceptar desde tu backend
- ✅ Token debe ser el mismo en Spring y en este servicio
- ✅ Logs detallados de cada petición

## 🐛 Troubleshooting

### Error: "Token de autenticación requerido"
→ Asegúrate de enviar el header: `Authorization: Bearer YOUR_TOKEN`

### Error: "No permitido por CORS"
→ Añade la URL de tu backend en `ALLOWED_ORIGINS` en el archivo `.env`

### Error: "Ya hay un build en progreso"
→ Espera a que termine o usa `/rebuild/force`

### El servicio no inicia
→ Verifica que el puerto 3002 no esté en uso: `lsof -i :3002`

## 📚 Documentación Completa

- `README.md` - Documentación completa del servicio webhook
- `SPRING_INTEGRATION.md` - Guía completa de integración con Spring Boot
- `test-webhook.sh` - Script de pruebas automatizadas

## 🚀 Despliegue en Producción

### Con PM2:

```bash
npm install -g pm2
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup
```

### Logs:

```bash
# Ver logs en tiempo real
pm2 logs build-webhook

# Ver estado
pm2 status
```

## 📞 Soporte

Si tienes problemas:

1. Verifica que el servicio está corriendo: `curl http://localhost:3002/health`
2. Revisa los logs en la consola donde ejecutaste `npm run dev`
3. Consulta la documentación completa en `README.md` y `SPRING_INTEGRATION.md`

---

**✨ ¡Listo!** Ahora puedes ejecutar rebuilds de Astro desde tu backend Spring.
