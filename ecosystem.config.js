module.exports = {
  apps: [{
    name:        'comunicar',
    script:      './backend/server.js',
    cwd:         '/opt/comunicar',
    instances:   1,
    autorestart: true,
    watch:       false,
    max_memory_restart: '256M',
    env_production: {
      NODE_ENV: 'production',
      PORT:     3001,
    },
    // Logs
    out_file:   '/opt/comunicar/logs/out.log',
    error_file: '/opt/comunicar/logs/err.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
  }],
};
