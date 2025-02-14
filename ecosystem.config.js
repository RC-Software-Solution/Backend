module.exports = {
  apps: [
    {
      name: 'user-service',
      script: 'apps/user-service/src/index.js',
    },
    {
      name: 'api-gateway',
      script: 'apps/api-gateway/index.js',
    },
  ],
};
