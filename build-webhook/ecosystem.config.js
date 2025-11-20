// PM2 ecosystem file para despliegue en producción
// Uso: pm2 start ecosystem.config.js

module.exports = {
  apps: [
    {
      name: 'build-webhook',
      script: './server.js',
      instances: 1,
      exec_mode: 'fork',
      watch: false,

      // Variables de entorno (también puedes usar .env)
      env: {
        NODE_ENV: 'development',
        PORT: 3002
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3002
      },

      // Logs
      error_file: './logs/error.log',
      out_file: './logs/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,

      // Auto-restart
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      max_memory_restart: '500M',

      // Otros
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 10000
    }
  ]
};
