/**
 * Configurações de Segurança
 * 
 * Este arquivo contém as configurações de segurança globais para a aplicação,
 * incluindo políticas de CORS, rate limiting, CSP e outras configurações de segurança.
 */

import { env } from "@/env.mjs"

// Configurações de CORS
export const corsConfig = {
  // Origens permitidas (use * para desenvolvimento, mas especifique em produção)
  origin: process.env.NODE_ENV === 'production' 
    ? [
        'https://fgciclismo.com.br',
        'https://www.fgciclismo.com.br',
      ] 
    : '*',
  
  // Métodos HTTP permitidos
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  
  // Cabeçalhos permitidos
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Requested-With',
    'Accept',
    'X-CSRF-Token'
  ],
  
  // Credenciais permitidas
  credentials: true,
  
  // Opções de pré-voo
  optionsSuccessStatus: 204,
  
  // Tempo de cache para pré-voo (em segundos)
  maxAge: 86400, // 24 horas
}

// Configurações de Rate Limiting
export const rateLimitConfig = {
  // Número máximo de requisições por janela de tempo
  max: 100, // Limite por IP por janela
  
  // Janela de tempo em milissegundos (15 minutos)
  windowMs: 15 * 60 * 1000,
  
  // Mensagem de erro quando o limite é excedido
  message: 'Muitas requisições deste IP. Tente novamente mais tarde.',
  
  // Cabeçalhos de taxa de limite
  standardHeaders: true, // Retorna informações de limite de taxa nos cabeçalhos `RateLimit-*`
  legacyHeaders: false, // Desativa os cabeçalhos `X-RateLimit-*`
  
  // Função para gerar chaves de identificação
  keyGenerator: (req: Request) => {
    // Use o IP do cliente como chave
    return (req.headers.get('x-forwarded-for') || '').split(',')[0] || 'unknown';
  },
  
  // Função para manipular quando o limite é excedido
  handler: (req: Request) => {
    return new Response(JSON.stringify({ 
      error: 'Muitas requisições. Tente novamente mais tarde.' 
    }), {
      status: 429,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// Configurações de CSP (Content Security Policy)
export const cspConfig = {
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: [
      "'self'",
      "'unsafe-inline'",
      "'unsafe-eval'",
      // Adicione domínios de terceiros confiáveis aqui
    ],
    styleSrc: [
      "'self'",
      "'unsafe-inline'",
      // Adicione domínios de terceiros confiáveis aqui
    ],
    imgSrc: [
      "'self'",
      'data:',
      'https:',
      'http:',
      // Adicione domínios de terceiros confiáveis aqui
    ],
    fontSrc: ["'self'"],
    connectSrc: [
      "'self'",
      env.NEXT_PUBLIC_API_URL || '',
      'https://api.mercadopago.com',
      'https://sandbox.api.mercadopago.com',
      'https://ws.sandbox.pagseguro.uol.com.br',
      // Adicione domínios de API adicionais aqui
    ],
    frameAncestors: ["'none'"],
    formAction: ["'self'"],
    baseUri: ["'self'"],
    objectSrc: ["'none'"],
    upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : [],
  },
  reportOnly: process.env.NODE_ENV !== 'production',
};

// Configurações de HSTS (HTTP Strict Transport Security)
export const hstsConfig = {
  maxAge: 63072000, // 2 anos em segundos
  includeSubDomains: true,
  preload: true,
};

// Configurações de cookies seguros
export const cookieConfig = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const, // ou 'strict' para mais segurança
  path: '/',
  maxAge: 60 * 60 * 24 * 7, // 1 semana
};

// Configurações de cabeçalhos de segurança
export const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
  'Strict-Transport-Security': `max-age=${hstsConfig.maxAge}${hstsConfig.includeSubDomains ? '; includeSubDomains' : ''}${hstsConfig.preload ? '; preload' : ''}`,
};

// Exportar configurações de segurança para uso em outros lugares
export const securityConfig = {
  cors: corsConfig,
  rateLimit: rateLimitConfig,
  csp: cspConfig,
  hsts: hstsConfig,
  cookies: cookieConfig,
  headers: securityHeaders,
};

export default securityConfig;
