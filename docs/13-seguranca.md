# Segurança

## Visão Geral

A segurança do FGC é implementada em múltiplas camadas:

1. **Autenticação**
   - NextAuth.js
   - JWT Tokens
   - Refresh Tokens
   - Sessions

2. **Autorização**
   - RBAC (Role-Based Access Control)
   - Middleware
   - Políticas de acesso

3. **Proteção de Dados**
   - Criptografia
   - Sanitização
   - Validação
   - Backups

4. **Infraestrutura**
   - HTTPS/TLS
   - Headers seguros
   - Rate limiting
   - Firewall

## Implementação

### Autenticação

```typescript
// app/api/auth/[...nextauth]/route.ts
import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { JWT } from 'next-auth/jwt'

export const authOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Senha', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Credenciais inválidas')
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email }
        })

        if (!user || !await bcrypt.compare(credentials.password, user.password)) {
          throw new Error('Credenciais inválidas')
        }

        return user
      }
    })
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 dias
  },
  jwt: {
    secret: process.env.NEXTAUTH_SECRET,
    maxAge: 30 * 24 * 60 * 60 // 30 dias
  },
  callbacks: {
    async jwt({ token, user }: { token: JWT, user: any }) {
      if (user) {
        token.role = user.role
        token.id = user.id
      }
      return token
    },
    async session({ session, token }: { session: any, token: JWT }) {
      if (token) {
        session.user.role = token.role
        session.user.id = token.id
      }
      return session
    }
  },
  pages: {
    signIn: '/auth/login',
    error: '/auth/error',
    newUser: '/auth/register'
  }
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
```

### Middleware de Autorização

```typescript
// middleware.ts
import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const path = req.nextUrl.pathname

    // Rotas protegidas por papel
    if (path.startsWith('/admin') && token?.role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/auth/login', req.url))
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token
    }
  }
)

export const config = {
  matcher: [
    '/admin/:path*',
    '/api/admin/:path*',
    '/dashboard/:path*'
  ]
}
```

### Proteção de Dados

```typescript
// lib/encryption.ts
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto'

const algorithm = 'aes-256-gcm'
const keyLength = 32
const ivLength = 16
const authTagLength = 16

export function encrypt(text: string): string {
  const key = Buffer.from(process.env.ENCRYPTION_KEY!, 'hex')
  const iv = randomBytes(ivLength)
  const cipher = createCipheriv(algorithm, key, iv)
  
  let encrypted = cipher.update(text, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  
  const authTag = cipher.getAuthTag()
  
  // Formato: iv:authTag:encryptedData
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`
}

export function decrypt(encrypted: string): string {
  const [ivHex, authTagHex, data] = encrypted.split(':')
  const key = Buffer.from(process.env.ENCRYPTION_KEY!, 'hex')
  const iv = Buffer.from(ivHex, 'hex')
  const authTag = Buffer.from(authTagHex, 'hex')
  
  const decipher = createDecipheriv(algorithm, key, iv)
  decipher.setAuthTag(authTag)
  
  let decrypted = decipher.update(data, 'hex', 'utf8')
  decrypted += decipher.final('utf8')
  
  return decrypted
}
```

### Sanitização e Validação

```typescript
// lib/validation.ts
import { z } from 'zod'
import DOMPurify from 'isomorphic-dompurify'
import { marked } from 'marked'

// Schema de validação
export const newsSchema = z.object({
  title: z.string()
    .min(3, 'Título muito curto')
    .max(200, 'Título muito longo')
    .transform(v => DOMPurify.sanitize(v)),
    
  content: z.string()
    .min(10, 'Conteúdo muito curto')
    .transform(v => {
      // Sanitiza HTML/Markdown
      const html = marked(v)
      return DOMPurify.sanitize(html, {
        ALLOWED_TAGS: ['p', 'b', 'i', 'em', 'strong', 'a', 'ul', 'li'],
        ALLOWED_ATTR: ['href']
      })
    }),
    
  imageUrl: z.string()
    .url('URL inválida')
    .optional()
    .transform(v => v ? new URL(v).toString() : undefined)
})

// Middleware de validação
export async function validateBody<T>(
  schema: z.Schema<T>,
  req: Request
): Promise<T | Response> {
  try {
    const body = await req.json()
    return schema.parse(body)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new Response(
        JSON.stringify({ errors: error.errors }),
        { status: 400 }
      )
    }
    return new Response('Erro interno', { status: 500 })
  }
}
```

### Headers de Segurança

```typescript
// middleware.ts
import { NextResponse } from 'next/server'

export function middleware(req: Request) {
  const response = NextResponse.next()
  
  // Security headers
  const headers = response.headers
  
  // Previne clickjacking
  headers.set('X-Frame-Options', 'DENY')
  
  // Previne MIME sniffing
  headers.set('X-Content-Type-Options', 'nosniff')
  
  // XSS Protection
  headers.set('X-XSS-Protection', '1; mode=block')
  
  // Referrer Policy
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  
  // Content Security Policy
  headers.set('Content-Security-Policy', `
    default-src 'self';
    script-src 'self' 'unsafe-inline' 'unsafe-eval';
    style-src 'self' 'unsafe-inline';
    img-src 'self' data: https:;
    font-src 'self';
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    block-all-mixed-content;
    upgrade-insecure-requests;
  `.replace(/\s+/g, ' ').trim())
  
  return response
}
```

### Rate Limiting

```typescript
// lib/rate-limit.ts
import rateLimit from 'express-rate-limit'
import RedisStore from 'rate-limit-redis'
import { redis } from '@/lib/redis'

export const rateLimiter = rateLimit({
  store: new RedisStore({
    client: redis,
    prefix: 'rate-limit:'
  }),
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // limite por IP
  message: 'Muitas requisições, tente novamente mais tarde',
  standardHeaders: true,
  legacyHeaders: false
})

// Middleware de rate limit
export function withRateLimit(handler: any) {
  return async function(req: Request) {
    const ip = req.headers.get('x-forwarded-for') || 'unknown'
    const key = `rate-limit:${ip}`
    
    const current = await redis.incr(key)
    if (current === 1) {
      await redis.expire(key, 60) // 1 minuto
    }
    
    if (current > 100) {
      return new Response('Muitas requisições', { status: 429 })
    }
    
    return handler(req)
  }
}
```

### Backup Automatizado

```typescript
// scripts/backup.ts
import { exec } from 'child_process'
import { upload } from '@/lib/storage'
import { encrypt } from '@/lib/encryption'
import { notify } from '@/lib/notifications'

async function createBackup() {
  const date = new Date().toISOString().split('T')[0]
  const filename = `backup-${date}.sql`
  
  try {
    // Dump do banco
    await exec(`pg_dump ${process.env.DATABASE_URL} > ${filename}`)
    
    // Criptografa
    const data = await fs.readFile(filename, 'utf8')
    const encrypted = encrypt(data)
    
    // Upload para storage
    await upload(`backups/${filename}.enc`, encrypted)
    
    // Notifica sucesso
    await notify('backup_success', {
      date,
      size: encrypted.length
    })
  } catch (error) {
    // Notifica erro
    await notify('backup_error', {
      date,
      error: error.message
    })
  } finally {
    // Limpa arquivos temporários
    await fs.unlink(filename).catch(() => {})
  }
}

// Agenda backup diário
cron.schedule('0 0 * * *', createBackup)
```

## Boas Práticas

### 1. Senhas e Dados Sensíveis

- Nunca armazene senhas em texto puro
- Use bcrypt para hash de senhas
- Criptografe dados sensíveis
- Use variáveis de ambiente
- Rode auditoria de deps

### 2. API Security

- Valide todos os inputs
- Sanitize outputs
- Use HTTPS
- Implemente rate limiting
- Monitore endpoints

### 3. Autenticação

- Sessions seguras
- Tokens JWT
- 2FA quando possível
- Política de senhas forte
- Logout em todas sessões

### 4. Infraestrutura

- Firewall configurado
- Updates automáticos
- Backup regular
- Monitoramento
- Logs seguros

## Checklist de Segurança

1. **Autenticação**
   - [ ] NextAuth configurado
   - [ ] JWT seguro
   - [ ] Sessions protegidas
   - [ ] Refresh tokens

2. **Autorização**
   - [ ] RBAC implementado
   - [ ] Middleware ativo
   - [ ] Políticas definidas
   - [ ] Logs de acesso

3. **Dados**
   - [ ] Criptografia
   - [ ] Sanitização
   - [ ] Backups
   - [ ] Auditoria

4. **Infraestrutura**
   - [ ] HTTPS/TLS
   - [ ] Headers seguros
   - [ ] Rate limiting
   - [ ] Firewall
