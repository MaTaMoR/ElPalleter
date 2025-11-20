import express from 'express';
import cors from 'cors';
import { exec } from 'child_process';
import { promisify } from 'util';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cargar variables de entorno
dotenv.config();

const app = express();
const execAsync = promisify(exec);

// Configuración
const PORT = process.env.PORT || 3002;
const WEBHOOK_SECRET_TOKEN = process.env.WEBHOOK_SECRET_TOKEN;
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 'http://localhost:8080').split(',');

// Validar que existe el token de seguridad
if (!WEBHOOK_SECRET_TOKEN || WEBHOOK_SECRET_TOKEN === 'your-secret-token-here') {
  console.error('❌ ERROR: WEBHOOK_SECRET_TOKEN no está configurado en .env');
  console.error('Por favor, copia .env.example a .env y configura un token seguro');
  process.exit(1);
}

// Middleware
app.use(cors({
  origin: function (origin, callback) {
    // Permitir peticiones sin origin (como curl, postman) en desarrollo
    if (!origin && process.env.NODE_ENV === 'development') {
      return callback(null, true);
    }

    if (ALLOWED_ORIGINS.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('No permitido por CORS'));
    }
  },
  credentials: true
}));

app.use(express.json());

// Logger middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  next();
});

// Middleware de autenticación
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Token de autenticación requerido. Usa: Authorization: Bearer YOUR_TOKEN'
    });
  }

  if (token !== WEBHOOK_SECRET_TOKEN) {
    return res.status(403).json({
      success: false,
      error: 'Token de autenticación inválido'
    });
  }

  next();
};

// Estado del último build
let lastBuildStatus = {
  inProgress: false,
  lastExecution: null,
  lastResult: null,
  lastError: null
};

// Health check endpoint (sin autenticación)
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'build-webhook',
    version: '1.0.0',
    buildInProgress: lastBuildStatus.inProgress,
    lastBuild: lastBuildStatus.lastExecution
  });
});

// Endpoint para obtener el estado del último build
app.get('/build/status', authenticateToken, (req, res) => {
  res.json({
    success: true,
    status: lastBuildStatus
  });
});

// Endpoint principal para ejecutar el rebuild
app.post('/rebuild', authenticateToken, async (req, res) => {
  // Verificar si ya hay un build en progreso
  if (lastBuildStatus.inProgress) {
    return res.status(409).json({
      success: false,
      error: 'Ya hay un build en progreso',
      startedAt: lastBuildStatus.lastExecution
    });
  }

  // Opciones del rebuild
  const {
    buildAdmin = true,    // Construir también el admin
    buildAstro = true,    // Construir Astro
    async = false         // Ejecutar en modo asíncrono
  } = req.body;

  console.log('\n🔨 Iniciando rebuild...');
  console.log(`  - Build Astro: ${buildAstro}`);
  console.log(`  - Build Admin: ${buildAdmin}`);
  console.log(`  - Modo: ${async ? 'asíncrono' : 'síncrono'}`);

  // Actualizar estado
  lastBuildStatus.inProgress = true;
  lastBuildStatus.lastExecution = new Date().toISOString();
  lastBuildStatus.lastError = null;

  // Función para ejecutar el build
  const executeBuild = async () => {
    try {
      const projectRoot = path.resolve(__dirname, '..');
      let commands = [];

      // Construir los comandos según las opciones
      if (buildAstro) {
        commands.push('npm run build:astro');
      }
      if (buildAdmin) {
        commands.push('npm run build:admin');
      }

      const command = commands.join(' && ');

      console.log(`📦 Ejecutando: ${command}`);
      console.log(`📁 En directorio: ${projectRoot}`);

      const { stdout, stderr } = await execAsync(command, {
        cwd: projectRoot,
        env: { ...process.env, FORCE_COLOR: '0' },
        maxBuffer: 10 * 1024 * 1024 // 10MB buffer
      });

      // Build exitoso
      lastBuildStatus.inProgress = false;
      lastBuildStatus.lastResult = {
        success: true,
        timestamp: new Date().toISOString(),
        stdout: stdout.substring(0, 5000), // Limitar tamaño
        stderr: stderr.substring(0, 1000)
      };

      console.log('✅ Rebuild completado exitosamente');

      return {
        success: true,
        message: 'Rebuild completado exitosamente',
        timestamp: lastBuildStatus.lastResult.timestamp,
        details: {
          astroBuilt: buildAstro,
          adminBuilt: buildAdmin
        }
      };

    } catch (error) {
      // Build falló
      lastBuildStatus.inProgress = false;
      lastBuildStatus.lastError = {
        timestamp: new Date().toISOString(),
        message: error.message,
        stdout: error.stdout?.substring(0, 5000) || '',
        stderr: error.stderr?.substring(0, 1000) || ''
      };

      console.error('❌ Error en rebuild:', error.message);

      throw error;
    }
  };

  // Si es asíncrono, ejecutar en background y responder inmediatamente
  if (async) {
    executeBuild().catch(error => {
      console.error('Error en build asíncrono:', error);
    });

    return res.status(202).json({
      success: true,
      message: 'Rebuild iniciado en modo asíncrono',
      startedAt: lastBuildStatus.lastExecution,
      statusEndpoint: '/build/status'
    });
  }

  // Si es síncrono, esperar a que termine
  try {
    const result = await executeBuild();
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error ejecutando el rebuild',
      message: error.message,
      details: lastBuildStatus.lastError
    });
  }
});

// Endpoint para forzar rebuild (útil para testing, ignora builds en progreso)
app.post('/rebuild/force', authenticateToken, async (req, res) => {
  console.warn('⚠️  REBUILD FORZADO - Ignorando builds en progreso');

  // Resetear estado
  lastBuildStatus.inProgress = false;

  // Redirigir al endpoint normal
  req.body.async = req.body.async || false;
  return app._router.handle(
    { ...req, url: '/rebuild', path: '/rebuild' },
    res
  );
});

// Manejador de errores global
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(500).json({
    success: false,
    error: err.message
  });
});

// Manejador 404
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint no encontrado',
    availableEndpoints: [
      'GET /health',
      'GET /build/status',
      'POST /rebuild',
      'POST /rebuild/force'
    ]
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log('\n🚀 Build Webhook Service iniciado');
  console.log(`📍 Puerto: ${PORT}`);
  console.log(`🔒 Autenticación: Habilitada`);
  console.log(`🌍 CORS permitido desde: ${ALLOWED_ORIGINS.join(', ')}`);
  console.log(`\n📋 Endpoints disponibles:`);
  console.log(`   GET  http://localhost:${PORT}/health`);
  console.log(`   GET  http://localhost:${PORT}/build/status`);
  console.log(`   POST http://localhost:${PORT}/rebuild`);
  console.log(`   POST http://localhost:${PORT}/rebuild/force`);
  console.log('\n💡 Ejemplo de uso desde Spring:');
  console.log(`   POST http://localhost:${PORT}/rebuild`);
  console.log(`   Header: Authorization: Bearer ${WEBHOOK_SECRET_TOKEN.substring(0, 20)}...`);
  console.log(`   Body: { "buildAdmin": true, "buildAstro": true, "async": false }\n`);
});

// Manejo de señales de terminación
process.on('SIGTERM', () => {
  console.log('SIGTERM recibido, cerrando servidor...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\nSIGINT recibido, cerrando servidor...');
  process.exit(0);
});
