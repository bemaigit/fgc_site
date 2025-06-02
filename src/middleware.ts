import { NextResponse } from "next/server"
import { NextRequest } from "next/server"
import { withAuth } from "next-auth/middleware"
import { securityMiddleware } from "@/lib/security"

// Configuração básica de rate limiting (simplificada para compatibilidade)
class SimpleRateLimit {
  private static instance: SimpleRateLimit
  private requests: Map<string, {count: number, resetAt: number}>
  
  private constructor() {
    this.requests = new Map()
    // Limpar requisições antigas a cada minuto
    setInterval(() => {
      const now = Date.now()
      // Usando forEach para maior compatibilidade
      this.requests.forEach((value, key) => {
        if (value.resetAt < now) {
          this.requests.delete(key)
        }
      })
    }, 60000)
  }

  public static getInstance(): SimpleRateLimit {
    if (!SimpleRateLimit.instance) {
      SimpleRateLimit.instance = new SimpleRateLimit()
    }
    return SimpleRateLimit.instance
  }

  public check(ip: string, limit: number, windowMs: number): { success: boolean } {
    const key = `rate:${ip}`
    const now = Date.now()
    const resetAt = now + windowMs

    if (!this.requests.has(key)) {
      this.requests.set(key, { count: 1, resetAt })
      return { success: true }
    }

    const record = this.requests.get(key)!
    
    if (now > record.resetAt) {
      record.count = 1
      record.resetAt = resetAt
      return { success: true }
    }

    if (record.count >= limit) {
      return { success: false }
    }

    record.count += 1
    return { success: true }
  }
}

// Inicializar o rate limiter
const rateLimiter = SimpleRateLimit.getInstance()

// Lista de user agents suspeitos
const SUSPICIOUS_USER_AGENTS = [
  'nmap', 'sqlmap', 'nikto', 'metasploit', 'burp', 'owasp', 'acunetix',
  'wpscan', 'dirbuster', 'hydra', 'nessus', 'openvas', 'w3af', 'zap',
  'skipfish', 'sqlsus', 'sqlninja', 'havij', 'bbqsql', 'jsql',
  'sqlpowerinjector', 'webshag', 'wafw00f', 'xsser'
]

// Função para verificar se o user agent é suspeito
function isSuspiciousUserAgent(userAgent: string | null): boolean {
  if (!userAgent) return false
  return SUSPICIOUS_USER_AGENTS.some(ua => 
    userAgent.toLowerCase().includes(ua.toLowerCase())
  )
}

// Lista de IPs permitidos para rotas administrativas
const ALLOWED_ADMIN_IPS = process.env.ALLOWED_ADMIN_IPS?.split(',').map(ip => ip.trim()).filter(Boolean) || []

// Função para verificar se o IP está na lista de permitidos
function isAllowedIP(ip: string | null): boolean {
  if (!ip) return false
  return ALLOWED_ADMIN_IPS.includes(ip)
}

// Função para obter o IP do cliente
function getClientIP(req: NextRequest): string {
  return (
    req.headers.get('x-real-ip') || 
    req.headers.get('x-forwarded-for')?.split(',')[0] || 
    '127.0.0.1'
  )
}

// Função customizada para determinar a autorização baseada na rota
async function isAuthorized(req: NextRequest, token: any) {
  const path = req.nextUrl.pathname
  const ip = getClientIP(req)
  
  // Bloquear user agents suspeitos
  const userAgent = req.headers.get('user-agent')
  if (isSuspiciousUserAgent(userAgent)) {
    console.warn(`[SECURITY] User agent suspeito bloqueado: ${userAgent}`)
    return false
  }

  // Aplicar rate limiting para todas as rotas da API
  if (path.startsWith('/api/')) {
    const result = rateLimiter.check(ip, 100, 60000) // 100 requisições por minuto
    
    // Adicionar cabeçalhos de rate limit na resposta
    const response = NextResponse.next()
    response.headers.set('X-RateLimit-Limit', '100')
    
    if (!result.success) {
      console.warn(`[RATE LIMIT] Muitas requisições de ${ip} para ${path}`)
      return false
    }
  }
  
  // Rotas públicas que não requerem autenticação
  const publicPaths = [
    '/', // Página inicial
    '/atletas',
    '/eventos', 
    '/noticias',
    '/calendario',
    '/galeria',
    '/rankings',
    '/champions',
    '/api/auth',
    '/api/webhooks/whatsapp', // Webhook do WhatsApp
    '/auth',
    '/_next',
    '/favicon.ico',
    '/images',
    '/storage',
    '/api/health'
  ]
  
  if (publicPaths.some(p => path.startsWith(p))) {
    return true
  }
  
  // Verificar autenticação para rotas protegidas
  if (!token) {
    return false
  }
  
  // Verificar se o email foi verificado
  if (token.email_verified === false) {
    console.warn(`[AUTH] Acesso negado: email não verificado para ${token.email}`)
    return false
  }
  
  // Rotas de perfil do usuário
  if (path === '/dashboard/meu-perfil' || path.startsWith('/dashboard/meu-perfil/')) {
    return true
  }
  
  // Rotas administrativas
  if (path.startsWith('/dashboard/admin') || path.startsWith('/api/admin')) {
    // Verificar se o IP está na lista de permitidos para rotas administrativas
    if (!isAllowedIP(ip)) {
      console.warn(`[AUTH] Acesso negado ao painel administrativo para o IP: ${ip}`)
      return false
    }
    
    // Apenas SUPER_ADMIN tem acesso total ao painel administrativo
    if (token.role !== 'SUPER_ADMIN') {
      console.warn(`[AUTH] Acesso negado ao painel administrativo para ${token.email}`)
      return false
    }
  }
  
  // Para outras rotas do dashboard, apenas ADMIN e SUPER_ADMIN têm acesso
  return token.role === 'SUPER_ADMIN' || token.role === 'ADMIN'
}

// Middleware principal
export default withAuth(
  async function middleware(req) {
    // Aplicar o middleware de segurança
    const securityResponse = await securityMiddleware(req)
    
    // Se o middleware de segurança retornar uma resposta, retorná-la
    if (securityResponse) {
      return securityResponse
    }
    
    // Continuar com o processamento normal
    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: async ({ token, req }) => {
        try {
          // Verificar se req é do tipo NextRequest
          const nextReq = req as unknown as NextRequest
          return await isAuthorized(nextReq, token)
        } catch (error) {
          console.error('[MIDDLEWARE ERROR]', error)
          return false
        }
      }
    },
    pages: {
      signIn: '/auth/login',
      error: '/auth/error'
    }
  }
)

// Protege apenas as rotas do dashboard, APIs e páginas administrativas
export const config = {
  matcher: [
    // Proteger apenas rotas específicas, não todas as rotas
    '/dashboard/:path*',
    '/api/:path*',
    '/admin/:path*'
  ]
}