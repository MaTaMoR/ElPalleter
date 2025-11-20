# Integración con Spring Boot

Guía completa para integrar el Build Webhook Service con tu backend Spring Boot.

## 📋 Tabla de Contenidos

1. [Configuración en Spring](#configuración-en-spring)
2. [Service Layer](#service-layer)
3. [Controller Layer](#controller-layer)
4. [Casos de Uso](#casos-de-uso)
5. [Manejo de Errores](#manejo-de-errores)

---

## 1. Configuración en Spring

### application.properties / application.yml

```yaml
# Configuración del Build Webhook
build-webhook:
  url: http://localhost:3002
  secret-token: ${BUILD_WEBHOOK_SECRET_TOKEN:your-secret-token-here}
  timeout: 120000  # 2 minutos en milisegundos
  enabled: true
```

**Variables de entorno:**
```bash
export BUILD_WEBHOOK_SECRET_TOKEN=tu-token-super-secreto-aqui
```

### Clase de Configuración

```java
package com.elpalleter.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Data
@Configuration
@ConfigurationProperties(prefix = "build-webhook")
public class BuildWebhookConfig {

    private String url = "http://localhost:3002";
    private String secretToken;
    private Long timeout = 120000L; // 2 minutos
    private boolean enabled = true;
}
```

---

## 2. Service Layer

### BuildWebhookService.java

```java
package com.elpalleter.service;

import com.elpalleter.config.BuildWebhookConfig;
import com.elpalleter.dto.BuildWebhookRequest;
import com.elpalleter.dto.BuildWebhookResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.ResourceAccessException;

import java.time.Duration;
import java.util.concurrent.CompletableFuture;

@Slf4j
@Service
@RequiredArgsConstructor
public class BuildWebhookService {

    private final BuildWebhookConfig config;
    private final RestTemplate restTemplate;

    /**
     * Ejecuta un rebuild de Astro de forma síncrona (espera a que termine)
     */
    public BuildWebhookResponse triggerRebuild(boolean buildAstro, boolean buildAdmin) {
        if (!config.isEnabled()) {
            log.warn("Build webhook está deshabilitado");
            return BuildWebhookResponse.disabled();
        }

        log.info("Triggering rebuild - Astro: {}, Admin: {}", buildAstro, buildAdmin);

        BuildWebhookRequest request = BuildWebhookRequest.builder()
                .buildAstro(buildAstro)
                .buildAdmin(buildAdmin)
                .async(false) // Síncrono
                .build();

        return sendRebuildRequest(request);
    }

    /**
     * Ejecuta un rebuild de Astro de forma asíncrona (no espera)
     */
    public BuildWebhookResponse triggerRebuildAsync(boolean buildAstro, boolean buildAdmin) {
        if (!config.isEnabled()) {
            log.warn("Build webhook está deshabilitado");
            return BuildWebhookResponse.disabled();
        }

        log.info("Triggering async rebuild - Astro: {}, Admin: {}", buildAstro, buildAdmin);

        BuildWebhookRequest request = BuildWebhookRequest.builder()
                .buildAstro(buildAstro)
                .buildAdmin(buildAdmin)
                .async(true) // Asíncrono
                .build();

        return sendRebuildRequest(request);
    }

    /**
     * Ejecuta un rebuild completo (Astro + Admin) de forma asíncrona
     * Útil para llamar después de actualizar contenido
     */
    public void triggerFullRebuildInBackground() {
        if (!config.isEnabled()) {
            log.warn("Build webhook está deshabilitado");
            return;
        }

        CompletableFuture.runAsync(() -> {
            try {
                log.info("Starting background rebuild...");
                triggerRebuildAsync(true, true);
                log.info("Background rebuild triggered successfully");
            } catch (Exception e) {
                log.error("Error triggering background rebuild", e);
            }
        });
    }

    /**
     * Verifica el estado del servicio webhook
     */
    public boolean isServiceHealthy() {
        if (!config.isEnabled()) {
            return false;
        }

        try {
            String healthUrl = config.getUrl() + "/health";
            ResponseEntity<String> response = restTemplate.getForEntity(healthUrl, String.class);
            return response.getStatusCode().is2xxSuccessful();
        } catch (Exception e) {
            log.error("Health check failed", e);
            return false;
        }
    }

    /**
     * Consulta el estado del último build
     */
    public BuildWebhookResponse getBuildStatus() {
        if (!config.isEnabled()) {
            return BuildWebhookResponse.disabled();
        }

        try {
            String statusUrl = config.getUrl() + "/build/status";
            HttpHeaders headers = createHeaders();
            HttpEntity<?> entity = new HttpEntity<>(headers);

            ResponseEntity<BuildWebhookResponse> response = restTemplate.exchange(
                    statusUrl,
                    HttpMethod.GET,
                    entity,
                    BuildWebhookResponse.class
            );

            return response.getBody();
        } catch (Exception e) {
            log.error("Error getting build status", e);
            throw new RuntimeException("Failed to get build status: " + e.getMessage(), e);
        }
    }

    private BuildWebhookResponse sendRebuildRequest(BuildWebhookRequest request) {
        try {
            String rebuildUrl = config.getUrl() + "/rebuild";
            HttpHeaders headers = createHeaders();
            HttpEntity<BuildWebhookRequest> entity = new HttpEntity<>(request, headers);

            log.debug("Sending rebuild request to: {}", rebuildUrl);

            ResponseEntity<BuildWebhookResponse> response = restTemplate.exchange(
                    rebuildUrl,
                    HttpMethod.POST,
                    entity,
                    BuildWebhookResponse.class
            );

            BuildWebhookResponse responseBody = response.getBody();
            log.info("Rebuild response: {}", responseBody);

            return responseBody;

        } catch (HttpClientErrorException e) {
            log.error("HTTP error triggering rebuild: {} - {}", e.getStatusCode(), e.getResponseBodyAsString());
            throw new RuntimeException("Failed to trigger rebuild: " + e.getMessage(), e);

        } catch (ResourceAccessException e) {
            log.error("Connection error - webhook service may be down", e);
            throw new RuntimeException("Build webhook service is not reachable", e);

        } catch (Exception e) {
            log.error("Unexpected error triggering rebuild", e);
            throw new RuntimeException("Unexpected error: " + e.getMessage(), e);
        }
    }

    private HttpHeaders createHeaders() {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(config.getSecretToken());
        return headers;
    }
}
```

### DTOs

#### BuildWebhookRequest.java

```java
package com.elpalleter.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BuildWebhookRequest {

    @Builder.Default
    private boolean buildAstro = true;

    @Builder.Default
    private boolean buildAdmin = true;

    @Builder.Default
    private boolean async = false;
}
```

#### BuildWebhookResponse.java

```java
package com.elpalleter.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BuildWebhookResponse {

    private boolean success;
    private String message;
    private String timestamp;

    @JsonProperty("startedAt")
    private String startedAt;

    @JsonProperty("statusEndpoint")
    private String statusEndpoint;

    private BuildDetails details;
    private String error;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BuildDetails {
        private boolean astroBuilt;
        private boolean adminBuilt;
    }

    public static BuildWebhookResponse disabled() {
        return BuildWebhookResponse.builder()
                .success(false)
                .message("Build webhook is disabled")
                .build();
    }
}
```

---

## 3. Controller Layer

### BuildWebhookController.java

```java
package com.elpalleter.controller;

import com.elpalleter.dto.BuildWebhookResponse;
import com.elpalleter.service.BuildWebhookService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/api/admin/build")
@RequiredArgsConstructor
@Tag(name = "Build Management", description = "Endpoints para gestionar builds de Astro")
@PreAuthorize("hasRole('ADMIN')") // Solo administradores
public class BuildWebhookController {

    private final BuildWebhookService buildWebhookService;

    @PostMapping("/trigger")
    @Operation(summary = "Ejecutar rebuild completo (síncrono)")
    public ResponseEntity<BuildWebhookResponse> triggerRebuild(
            @RequestParam(defaultValue = "true") boolean buildAstro,
            @RequestParam(defaultValue = "true") boolean buildAdmin
    ) {
        log.info("Manual rebuild triggered by admin - Astro: {}, Admin: {}", buildAstro, buildAdmin);
        BuildWebhookResponse response = buildWebhookService.triggerRebuild(buildAstro, buildAdmin);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/trigger/async")
    @Operation(summary = "Ejecutar rebuild completo (asíncrono)")
    public ResponseEntity<BuildWebhookResponse> triggerRebuildAsync(
            @RequestParam(defaultValue = "true") boolean buildAstro,
            @RequestParam(defaultValue = "true") boolean buildAdmin
    ) {
        log.info("Async rebuild triggered by admin - Astro: {}, Admin: {}", buildAstro, buildAdmin);
        BuildWebhookResponse response = buildWebhookService.triggerRebuildAsync(buildAstro, buildAdmin);
        return ResponseEntity.accepted().body(response);
    }

    @GetMapping("/status")
    @Operation(summary = "Consultar estado del último build")
    public ResponseEntity<BuildWebhookResponse> getBuildStatus() {
        BuildWebhookResponse response = buildWebhookService.getBuildStatus();
        return ResponseEntity.ok(response);
    }

    @GetMapping("/health")
    @Operation(summary = "Verificar si el servicio webhook está disponible")
    public ResponseEntity<Boolean> checkHealth() {
        boolean healthy = buildWebhookService.isServiceHealthy();
        return ResponseEntity.ok(healthy);
    }
}
```

---

## 4. Casos de Uso

### Caso 1: Rebuild después de actualizar el menú

```java
@Service
@RequiredArgsConstructor
public class CartaService {

    private final CartaRepository cartaRepository;
    private final BuildWebhookService buildWebhookService;

    @Transactional
    public CartaDTO updateMenu(CartaUpdateRequest request) {
        // 1. Actualizar menú en la base de datos
        Carta carta = cartaRepository.save(request.toEntity());

        // 2. Trigger rebuild asíncrono (no bloqueante)
        buildWebhookService.triggerFullRebuildInBackground();

        // 3. Retornar respuesta inmediata al usuario
        return CartaDTO.from(carta);
    }
}
```

### Caso 2: Rebuild después de subir imágenes

```java
@Service
@RequiredArgsConstructor
public class ImageService {

    private final ImageRepository imageRepository;
    private final BuildWebhookService buildWebhookService;

    public ImageDTO uploadImage(MultipartFile file, ImageUploadRequest request) {
        // 1. Guardar imagen
        Image image = saveImage(file, request);

        // 2. Si la imagen es para el frontend público, rebuild
        if (request.isPublic()) {
            buildWebhookService.triggerRebuildAsync(true, false); // Solo Astro
        }

        return ImageDTO.from(image);
    }
}
```

### Caso 3: Rebuild programado (Scheduled)

```java
@Configuration
@EnableScheduling
public class ScheduledBuildConfig {

    @Autowired
    private BuildWebhookService buildWebhookService;

    /**
     * Rebuild automático cada noche a las 3 AM
     */
    @Scheduled(cron = "0 0 3 * * *")
    public void scheduledRebuild() {
        log.info("Starting scheduled nightly rebuild...");
        buildWebhookService.triggerFullRebuildInBackground();
    }
}
```

### Caso 4: Rebuild manual desde endpoint admin

```java
// Petición desde frontend admin
fetch('http://localhost:8080/api/admin/build/trigger/async', {
    method: 'POST',
    headers: {
        'Authorization': 'Bearer ' + adminToken,
        'Content-Type': 'application/json'
    }
})
.then(response => response.json())
.then(data => {
    console.log('Rebuild iniciado:', data);
    // Mostrar notificación al usuario
    showNotification('Build iniciado correctamente');
});
```

---

## 5. Manejo de Errores

### Estrategia de Retry con Resilience4j

```java
@Configuration
public class Resilience4jConfig {

    @Bean
    public Retry buildWebhookRetry() {
        RetryConfig config = RetryConfig.custom()
                .maxAttempts(3)
                .waitDuration(Duration.ofSeconds(2))
                .retryExceptions(ResourceAccessException.class)
                .ignoreExceptions(HttpClientErrorException.Unauthorized.class)
                .build();

        return Retry.of("buildWebhook", config);
    }
}

// Uso en el servicio
@Service
public class BuildWebhookService {

    @Autowired
    private Retry buildWebhookRetry;

    public BuildWebhookResponse triggerRebuildWithRetry(boolean astro, boolean admin) {
        return Retry.decorateSupplier(
            buildWebhookRetry,
            () -> triggerRebuild(astro, admin)
        ).get();
    }
}
```

### Exception Handler Global

```java
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<ErrorResponse> handleBuildWebhookError(RuntimeException ex) {
        if (ex.getMessage().contains("Build webhook service is not reachable")) {
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                    .body(new ErrorResponse(
                            "Build service is temporarily unavailable",
                            "WEBHOOK_UNREACHABLE"
                    ));
        }

        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ErrorResponse(ex.getMessage(), "BUILD_ERROR"));
    }
}
```

---

## 📊 Diagrama de flujo

```
┌─────────────┐      POST /carta/update      ┌──────────────┐
│   Frontend  │ ──────────────────────────> │ Spring Boot  │
│   (Admin)   │                              │   Backend    │
└─────────────┘                              └──────┬───────┘
                                                    │
                                                    │ 1. Save to DB
                                                    │
                                                    ▼
                                             ┌──────────────┐
                                             │  Database    │
                                             └──────────────┘
                                                    │
                                                    │ 2. Trigger rebuild
                                                    │
                                                    ▼
                                             ┌──────────────┐
                                             │Build Webhook │
                                             │   Service    │
                                             │ (port 3002)  │
                                             └──────┬───────┘
                                                    │
                                                    │ 3. npm run build
                                                    │
                                                    ▼
                                             ┌──────────────┐
                                             │  Astro Build │
                                             │  Admin Build │
                                             └──────────────┘
                                                    │
                                                    │ 4. Generated files
                                                    │
                                                    ▼
                                             ┌──────────────┐
                                             │ /dist/       │
                                             │ /admin/dist/ │
                                             └──────────────┘
```

---

## ✅ Checklist de Implementación

- [ ] Copiar clases Java a tu proyecto Spring
- [ ] Añadir dependencias (RestTemplate, Lombok)
- [ ] Configurar `application.yml`
- [ ] Configurar variable de entorno `BUILD_WEBHOOK_SECRET_TOKEN`
- [ ] Iniciar el servicio webhook (`cd build-webhook && npm start`)
- [ ] Probar endpoint `/health`
- [ ] Integrar en tus servicios de negocio
- [ ] Configurar manejo de errores
- [ ] (Opcional) Añadir Resilience4j para retry
- [ ] (Opcional) Añadir build programado

---

## 🔗 Referencias

- [Spring RestTemplate](https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/web/client/RestTemplate.html)
- [Resilience4j Retry](https://resilience4j.readme.io/docs/retry)
- [Spring Boot Configuration Properties](https://docs.spring.io/spring-boot/docs/current/reference/html/features.html#features.external-config)
