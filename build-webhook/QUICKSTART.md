# ⚡ Quick Start - 5 minutos

## 1️⃣ Iniciar el servicio webhook (AHORA)

```bash
cd build-webhook
npm run dev
```

Deberías ver:
```
🚀 Build Webhook Service iniciado
📍 Puerto: 3002
🔒 Autenticación: Habilitada
```

## 2️⃣ Probar que funciona

En otra terminal:

```bash
curl http://localhost:3002/health
```

Deberías ver:
```json
{
  "status": "ok",
  "service": "build-webhook",
  "version": "1.0.0"
}
```

## 3️⃣ Configurar tu backend Spring

### Añade a `application.yml`:

```yaml
build-webhook:
  url: http://localhost:3002
  secret-token: 7909a2a15fa072142b6f1e46816ce78043a917cdc3ebb8d208c880688b238a47
```

### Copia estas clases a tu proyecto Spring:

1. **BuildWebhookConfig.java** - Configuración
2. **BuildWebhookService.java** - Servicio principal
3. **BuildWebhookRequest.java** - DTO request
4. **BuildWebhookResponse.java** - DTO response
5. **BuildWebhookController.java** - Endpoints REST (opcional)

📄 Todas las clases están documentadas en `SPRING_INTEGRATION.md`

## 4️⃣ Usar en tu código Spring

```java
@Service
public class CartaService {

    @Autowired
    private BuildWebhookService buildWebhookService;

    public void updateMenu(MenuData data) {
        // 1. Guardar cambios
        menuRepository.save(data);

        // 2. Rebuild automático en background
        buildWebhookService.triggerFullRebuildInBackground();
    }
}
```

## ✅ ¡Listo!

Ahora cada vez que actualices contenido desde Spring, se ejecutará automáticamente un rebuild de Astro.

---

## 🔥 Comandos Útiles

```bash
# Desde la raíz del proyecto
npm run dev              # Inicia TODO (Astro + Admin + Webhook)
npm run dev:webhook      # Solo el webhook

# Desde build-webhook/
npm run dev              # Iniciar servicio
./test-webhook.sh TOKEN  # Ejecutar tests
```

## 📚 Más Info

- `LEEME.md` - Guía en español
- `README.md` - Documentación completa
- `SPRING_INTEGRATION.md` - Integración Spring (COMPLETA)
