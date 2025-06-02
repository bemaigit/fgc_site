// Mock para o módulo @/env.mjs
const env = {
  // Configurações básicas
  NODE_ENV: 'test',
  
  // Configurações do Redis
  REDIS_URL: 'http://localhost:6379',
  REDIS_TOKEN: 'test-token',
  
  // Configurações de autenticação
  NEXTAUTH_SECRET: 'test-secret',
  NEXTAUTH_URL: 'http://localhost:3000',
  
  // Configurações da API
  NEXT_PUBLIC_API_URL: 'http://localhost:3000/api',
  
  // Configurações de ambiente
  NEXT_PUBLIC_SITE_URL: 'http://localhost:3000',
  
  // Configurações do Mercado Pago (se aplicável)
  MERCADOPAGO_ACCESS_TOKEN: 'test-mp-token',
  
  // Outras variáveis de ambiente necessárias
  DATABASE_URL: 'postgresql://user:password@localhost:5432/testdb',
  
  // Configurações de email
  SMTP_HOST: 'smtp.example.com',
  SMTP_PORT: 587,
  SMTP_USER: 'user@example.com',
  SMTP_PASSWORD: 'password',
  EMAIL_FROM: 'noreply@example.com',
  
  // Configurações de segurança
  JWT_SECRET: 'test-jwt-secret',
  
  // Configurações de CORS
  CORS_ORIGIN: 'http://localhost:3000',
  
  // Configurações de rate limiting
  RATE_LIMIT_WINDOW_MS: '900000', // 15 minutos em milissegundos
  RATE_LIMIT_MAX: '100',
  
  // Configurações de CSP
  CSP_REPORT_ONLY: 'true',
  
  // Configurações de HSTS
  HSTS_MAX_AGE: '63072000', // 2 anos em segundos
  HSTS_INCLUDE_SUB_DOMAINS: 'true',
  HSTS_PRELOAD: 'true',
};

// Exporta como módulo ES6
export { env };

// Também exporta como CommonJS para compatibilidade
module.exports = { env };
