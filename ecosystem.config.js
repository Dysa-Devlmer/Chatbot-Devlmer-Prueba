module.exports = {
  apps: [
    // 1. Ollama - Servicio de IA (debe iniciar primero)
    {
      name: 'ollama',
      script: 'ollama',
      args: 'serve',
      interpreter: 'none',
      autorestart: true,
      watch: false,
      max_restarts: 5,
      min_uptime: '10s',
      restart_delay: 2000,
      error_file: './logs/ollama-error.log',
      out_file: './logs/ollama-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss'
    },
    // 2. Next.js - Servidor principal del chatbot
    {
      name: 'pithy-chatbot',
      script: 'node_modules\\next\\dist\\bin\\next',
      args: 'start -p 7847',
      cwd: 'E:\\prueba',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env_production: {
        NODE_ENV: 'production',
        PORT: 7847
      },
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      max_restarts: 10,
      min_uptime: '10s',
      restart_delay: 4000
    },
    // 3. Ngrok - Tunel publico para webhooks de WhatsApp
    {
      name: 'ngrok-tunnel',
      script: 'E:\\prueba\\ngrok.exe',
      args: 'http 7847',
      interpreter: 'none',
      autorestart: true,
      watch: false,
      max_restarts: 5,
      min_uptime: '5s',
      restart_delay: 3000,
      error_file: './logs/ngrok-error.log',
      out_file: './logs/ngrok-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss'
    }
  ]
};
