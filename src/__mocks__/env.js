// Mock para o módulo @/env.mjs usando CommonJS
const env = {
  NODE_ENV: 'test',
  REDIS_URL: 'http://localhost:6379',
  REDIS_TOKEN: 'test-token',
  NEXTAUTH_SECRET: 'test-secret',
  NEXTAUTH_URL: 'http://localhost:3000',
};

module.exports = { env };
