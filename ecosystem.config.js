module.exports = {
  apps: [
    {
      name: 'comunicar-backend',
      script: 'server.js',
      cwd: './backend',
      env: { NODE_ENV: 'production', PORT: 3001 },
      restart_delay: 2000,
      max_restarts: 5,
    },
    {
      name: 'comunicar-frontend',
      script: './start-frontend.js',
      restart_delay: 3000,
      max_restarts: 5,
    },
  ],
};
