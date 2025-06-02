/**
 * Middleware de Segurança
 * 
 * Este middleware aplica várias camadas de segurança à aplicação, incluindo:
 * - CORS
 * - Rate Limiting
 * - Headers de Segurança
 * - CSP (Content Security Policy)
 * - HSTS (HTTP Strict Transport Security)
 */

import { NextResponse } from 'next/server'
import { NextRequest } from 'next/server'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { env } from '@/env.mjs'
import { securityConfig } from './config'

// Tipos estendidos para incluir a propriedade ip
interface ExtendedNextRequest extends NextRequest {
  ip?: string;
}

// Inicializar o cliente Redis para rate limiting
// Em ambiente de desenvolvimento, usamos um mock de Redis para evitar erro de conexão
let redis: any;
let ratelimit: any;

// Verificar se estamos em ambiente de produção (onde o Upstash Redis é usado)
if (env.NODE_ENV === 'production') {
  redis = new Redis({
    url: env.REDIS_URL,
    token: env.REDIS_TOKEN,
  });
  
  // Configurar o rate limiter usando Redis
  ratelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(
      securityConfig.rateLimit.max,
      `${securityConfig.rateLimit.windowMs}ms`
    ),
    analytics: true,
    prefix: '@upstash/ratelimit',
  });
} else {
  // Em desenvolvimento, criar um mock do Redis e do rate limiter
  redis = {
    get: async () => null,
    set: async () => 'OK',
    eval: async () => 1,
  };
  
  ratelimit = {
    limit: async () => ({
      success: true,
      limit: securityConfig.rateLimit.max,
      remaining: securityConfig.rateLimit.max - 1,
      reset: Math.floor(Date.now() / 1000) + securityConfig.rateLimit.windowMs / 1000,
    }),
  };
}

// Tipo para os cabeçalhos de rate limit
type RateLimitHeaders = {
  'X-RateLimit-Limit': string;
  'X-RateLimit-Remaining': string;
  'X-RateLimit-Reset': string;
};

/**
 * Middleware de segurança principal
 */
export async function securityMiddleware(request: ExtendedNextRequest) {
  const response = NextResponse.next()
  
  // 1. Aplicar CORS
  const corsResponse = applyCorsHeaders(request, response)
  
  // Se for uma resposta de pré-voo CORS, retorná-la imediatamente
  if (corsResponse) {
    return corsResponse
  }
  
  // 2. Aplicar Rate Limiting
  if (env.NODE_ENV === 'production') {
    const rateLimitResult = await applyRateLimit(request)
    
    // Se for uma resposta de erro (limite excedido), retorná-la
    if (rateLimitResult instanceof Response) {
      return rateLimitResult
    }
    
    // Se houver cabeçalhos de rate limit, adicioná-los à resposta
    if (rateLimitResult) {
      const headers = rateLimitResult as Record<string, string>
      Object.entries(headers).forEach(([key, value]) => {
        response.headers.set(key, value)
      })
    }
  }
  
  // 3. Aplicar Headers de Segurança
  applySecurityHeaders(response)
  
  // 4. Aplicar CSP
  applyCspHeader(response)
  
  // 5. Aplicar HSTS
  applyHstsHeader(response)
  
  return response
}

/**
 * Aplica os cabeçalhos CORS à resposta
 * @returns Resposta de pré-voo se for uma requisição OPTIONS, caso contrário, void
 */
function applyCorsHeaders(request: NextRequest, response: NextResponse): Response | void {
  const { origin, methods, allowedHeaders, credentials, maxAge } = securityConfig.cors
  
  // Definir cabeçalhos CORS
  const requestOrigin = request.headers.get('origin')
  
  // Verificar se a origem da requisição está na lista de origens permitidas
  if (origin === '*' || (Array.isArray(origin) && origin.includes(requestOrigin || ''))) {
    response.headers.set('Access-Control-Allow-Origin', requestOrigin || '*')
  }
  
  response.headers.set('Access-Control-Allow-Methods', methods.join(', '))
  response.headers.set('Access-Control-Allow-Headers', allowedHeaders.join(', '))
  response.headers.set('Access-Control-Allow-Credentials', credentials.toString())
  response.headers.set('Access-Control-Max-Age', maxAge.toString())
  
  // Para requisições OPTIONS, retornar imediatamente
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: Object.fromEntries(response.headers.entries()),
    })
  }
  
  // Para outros métodos, não retornar nada (void)
}

/**
 * Aplica o rate limiting à requisição
 */
async function applyRateLimit(request: ExtendedNextRequest): Promise<Response | RateLimitHeaders | null> {
  try {
    // Obter o IP do cliente de forma segura, verificando múltiplos cabeçalhos
    const forwardedFor = request.headers.get('x-forwarded-for')
    const realIp = request.headers.get('x-real-ip')
    const ip = (forwardedFor || realIp || request.ip || 'unknown').split(',')[0].trim()
    const { success, limit, reset, remaining } = await ratelimit.limit(ip)
    
    // Criar uma resposta de erro se o limite for excedido
    if (!success) {
      const errorResponse = new NextResponse(
        JSON.stringify({ error: securityConfig.rateLimit.message }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'X-RateLimit-Limit': limit.toString(),
            'X-RateLimit-Remaining': remaining.toString(),
            'X-RateLimit-Reset': reset.toString(),
            'Access-Control-Allow-Origin': securityConfig.cors.origin === '*' ? '*' : request.headers.get('origin') || '*',
            'Access-Control-Allow-Methods': securityConfig.cors.methods.join(', '),
            'Access-Control-Allow-Headers': securityConfig.cors.allowedHeaders.join(', '),
            'Access-Control-Allow-Credentials': securityConfig.cors.credentials.toString(),
          }
        }
      )
      
      // Adicionar cabeçalho Retry-After
      const resetTime = new Date(reset * 1000)
      const now = new Date()
      const retryAfter = Math.ceil((resetTime.getTime() - now.getTime()) / 1000)
      errorResponse.headers.set('Retry-After', retryAfter.toString())
      
      return errorResponse
    }
    
    // Se a requisição for bem-sucedida, retornar os cabeçalhos de rate limit
    // em um objeto que será usado para adicionar os cabeçalhos à resposta principal
    return {
      'X-RateLimit-Limit': limit.toString(),
      'X-RateLimit-Remaining': remaining.toString(),
      'X-RateLimit-Reset': reset.toString(),
    }
  } catch (error) {
    console.error('Erro ao aplicar rate limit:', error)
    // Em caso de erro, permitir a requisição para evitar negação de serviço
    return null
  }
}

/**
 * Aplica os cabeçalhos de segurança à resposta
 */
function applySecurityHeaders(response: NextResponse) {
  Object.entries(securityConfig.headers).forEach(([key, value]) => {
    response.headers.set(key, value)
  })
}

/**
 * Aplica o cabeçalho CSP à resposta
 */
function applyCspHeader(response: NextResponse) {
  const { directives } = securityConfig.csp
  
  // Construir a string de diretivas CSP
  const cspDirectives = Object.entries(directives)
    .map(([key, value]) => {
      if (Array.isArray(value)) {
        return `${key} ${value.join(' ')}`
      }
      return `${key} ${value}`
    })
    .join('; ')
  
  // Adicionar o cabeçalho CSP
  const headerName = securityConfig.csp.reportOnly 
    ? 'Content-Security-Policy-Report-Only' 
    : 'Content-Security-Policy'
  
  response.headers.set(headerName, cspDirectives)
}

/**
 * Aplica o cabeçalho HSTS à resposta
 */
function applyHstsHeader(response: NextResponse) {
  if (process.env.NODE_ENV === 'production') {
    const { maxAge, includeSubDomains, preload } = securityConfig.hsts
    let hstsValue = `max-age=${maxAge}`
    
    if (includeSubDomains) hstsValue += '; includeSubDomains'
    if (preload) hstsValue += '; preload'
    
    response.headers.set('Strict-Transport-Security', hstsValue)
  }
}

export default securityMiddleware
