// Configuração PM2 para Hostinger
// PM2 é o gerenciador de processos recomendado para Node.js em produção

module.exports = {
  apps: [
    {
      name: 'food-nutrition-api',
      script: 'dist/main.js',
      instances: 'max', // Usa todos os CPUs disponíveis
      exec_mode: 'cluster', // Modo cluster para melhor performance
      autorestart: true,
      watch: false,
      max_memory_restart: '500M', // Reinicia se usar mais de 500MB
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      // Logs
      error_file: './logs/error.log',
      out_file: './logs/out.log',
      log_file: './logs/combined.log',
      time: true,
      // Graceful shutdown
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 10000,
    },
  ],
};
