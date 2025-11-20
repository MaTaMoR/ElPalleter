# Build Webhook Service

Servicio webhook para ejecutar rebuilds de Astro desde el backend Spring.

## 🚀 Instalación

```bash
cd build-webhook
npm install
```

## ⚙️ Configuración

1. Copia el archivo de ejemplo de variables de entorno:
```bash
cp .env.example .env
```

2. Edita `.env` y configura:
```env
PORT=3002
WEBHOOK_SECRET_TOKEN=tu-token-super-secreto-aqui
NODE_ENV=development
ALLOWED_ORIGINS=http://localhost:8080,http://92.186.195.152:8080
```

**IMPORTANTE**: El `WEBHOOK_SECRET_TOKEN` debe ser el mismo que uses en tu backend Spring para autenticar las peticiones.

### Generar un token seguro

Puedes generar un token seguro con:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## 🏃 Ejecución

### Desarrollo
```bash
npm run dev
```

### Producción
```bash
npm start
```

## 📡 API Endpoints

### 1. Health Check
Verifica que el servicio está activo (no requiere autenticación).

```http
GET /health
```

**Respuesta:**
```json
{
  "status": "ok",
  "service": "build-webhook",
  "version": "1.0.0",
  "buildInProgress": false,
  "lastBuild": "2025-11-20T10:30:00.000Z"
}
```

### 2. Estado del último build
Consulta el estado del último build ejecutado.

```http
GET /build/status
Authorization: Bearer YOUR_TOKEN
```

**Respuesta:**
```json
{
  "success": true,
  "status": {
    "inProgress": false,
    "lastExecution": "2025-11-20T10:30:00.000Z",
    "lastResult": {
      "success": true,
      "timestamp": "2025-11-20T10:30:45.000Z",
      "stdout": "...",
      "stderr": ""
    },
    "lastError": null
  }
}
```

### 3. Ejecutar Rebuild (Principal)
Ejecuta un rebuild de Astro y/o Admin.

```http
POST /rebuild
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "buildAdmin": true,
  "buildAstro": true,
  "async": false
}
```

**Parámetros del body:**
- `buildAdmin` (boolean, default: true): Construir la aplicación Admin React
- `buildAstro` (boolean, default: true): Construir la aplicación Astro
- `async` (boolean, default: false):
  - `false`: Espera a que termine el build (puede tardar ~30-60 segundos)
  - `true`: Inicia el build en background y responde inmediatamente

**Respuesta síncrona (async: false):**
```json
{
  "success": true,
  "message": "Rebuild completado exitosamente",
  "timestamp": "2025-11-20T10:31:00.000Z",
  "details": {
    "astroBuilt": true,
    "adminBuilt": true
  }
}
```

**Respuesta asíncrona (async: true):**
```json
{
  "success": true,
  "message": "Rebuild iniciado en modo asíncrono",
  "startedAt": "2025-11-20T10:30:00.000Z",
  "statusEndpoint": "/build/status"
}
```

### 4. Rebuild Forzado
Igual que `/rebuild` pero ignora si hay un build en progreso.

```http
POST /rebuild/force
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "buildAdmin": true,
  "buildAstro": true,
  "async": false
}
```

## 🔒 Seguridad

- Todas las peticiones (excepto `/health`) requieren autenticación mediante Bearer token
- CORS configurado para solo aceptar peticiones desde los orígenes permitidos
- El token debe enviarse en el header `Authorization: Bearer YOUR_TOKEN`

## 🧪 Testing con cURL

```bash
# Health check
curl http://localhost:3002/health

# Rebuild síncrono (espera a que termine)
curl -X POST http://localhost:3002/rebuild \
  -H "Authorization: Bearer tu-token-secreto-aqui" \
  -H "Content-Type: application/json" \
  -d '{"buildAdmin": true, "buildAstro": true, "async": false}'

# Rebuild asíncrono (responde inmediatamente)
curl -X POST http://localhost:3002/rebuild \
  -H "Authorization: Bearer tu-token-secreto-aqui" \
  -H "Content-Type: application/json" \
  -d '{"buildAdmin": true, "buildAstro": true, "async": true}'

# Consultar estado
curl http://localhost:3002/build/status \
  -H "Authorization: Bearer tu-token-secreto-aqui"
```

## 📊 Códigos de respuesta HTTP

- `200 OK`: Operación exitosa
- `202 Accepted`: Build iniciado en modo asíncrono
- `401 Unauthorized`: Token no proporcionado
- `403 Forbidden`: Token inválido
- `409 Conflict`: Ya hay un build en progreso
- `500 Internal Server Error`: Error ejecutando el build

## 🔄 Integración con Spring Boot

Ver archivo `SPRING_INTEGRATION.md` para ejemplos completos de integración.

## 📝 Logs

El servicio muestra logs detallados en consola:

```
🚀 Build Webhook Service iniciado
📍 Puerto: 3002
🔒 Autenticación: Habilitada
🌍 CORS permitido desde: http://localhost:8080

[2025-11-20T10:30:00.000Z] POST /rebuild
🔨 Iniciando rebuild...
  - Build Astro: true
  - Build Admin: true
  - Modo: síncrono
📦 Ejecutando: npm run build:astro && npm run build:admin
✅ Rebuild completado exitosamente
```

## 🛠️ Troubleshooting

### Error: "Token de autenticación requerido"
Asegúrate de enviar el header `Authorization: Bearer YOUR_TOKEN`

### Error: "Ya hay un build en progreso"
Espera a que termine el build actual o usa el endpoint `/rebuild/force`

### Error: "No permitido por CORS"
Añade el origen de tu backend Spring en `ALLOWED_ORIGINS` en el archivo `.env`

### Build falla silenciosamente
Consulta `/build/status` para ver los logs de error del último build

## 📦 Archivos generados

Los builds se generan en:
- **Astro**: `/dist/` (raíz del proyecto)
- **Admin**: `/admin/dist/`

## 🚀 Despliegue en producción

1. Configura `NODE_ENV=production` en `.env`
2. Usa un process manager como PM2:
```bash
npm install -g pm2
pm2 start server.js --name build-webhook
pm2 save
pm2 startup
```

3. Configura nginx como proxy reverso (opcional):
```nginx
location /build-webhook/ {
    proxy_pass http://localhost:3002/;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
}
```
