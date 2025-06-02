// Mock para o módulo @/env.mjs usando CommonJS
module.exports = {
  env: {
    NODE_ENV: 'test',
    REDIS_URL: 'http://localhost:6379',
    REDIS_TOKEN: 'test-token',
    NEXTAUTH_SECRET: 'test-secret',
    NEXTAUTH_URL: 'http://localhost:3000',
    // Adicione outras variáveis de ambiente necessárias para os testes
  }
};
