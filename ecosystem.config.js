module.exports = {
  apps: [{
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
  }]
};
