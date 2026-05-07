module.exports = {
  apps: [
    {
      name: 'skm-backend',
      script: './backend/src/server.js',
      env: {
        NODE_ENV: 'production',
        PORT: 5000
      }
    }
  ]
}
