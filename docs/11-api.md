# API e Endpoints

## Visão Geral

A API do FGC é construída usando Next.js API Routes com o App Router, seguindo os princípios REST e utilizando TypeScript para type safety.

## Estrutura de API

```
app/api/
├── auth/
│   └── [...nextauth]/
│       └── route.ts
├── news/
│   ├── route.ts
│   └── [id]/
│       └── route.ts
├── upload/
│   └── route.ts
└── users/
    ├── route.ts
    └── [id]/
        └── route.ts
```

## Endpoints

### Autenticação

```typescript
// POST /api/auth/login
interface LoginRequest {
  email: string
  password: string
}

interface LoginResponse {
  token: string
  user: {
    id: string
    name: string
    email: string
    role: string
  }
}

// POST /api/auth/register
interface RegisterRequest {
  name: string
  email: string
  password: string
}

// POST /api/auth/forgot-password
interface ForgotPasswordRequest {
  email: string
}

// POST /api/auth/reset-password
interface ResetPasswordRequest {
  token: string
  password: string
}
```

### Notícias

```typescript
// GET /api/news
interface GetNewsQuery {
  page?: number
  limit?: number
  category?: string
  search?: string
}

interface GetNewsResponse {
  data: News[]
  total: number
  page: number
  totalPages: number
}

// POST /api/news
interface CreateNewsRequest {
  title: string
  content: string
  imageUrl?: string
  published: boolean
  categoryIds: string[]
}

// PUT /api/news/[id]
interface UpdateNewsRequest {
  title?: string
  content?: string
  imageUrl?: string
  published?: boolean
  categoryIds?: string[]
}

// DELETE /api/news/[id]
// Não requer body
```

### Upload

```typescript
// POST /api/upload
// Multipart form data
interface UploadResponse {
  url: string
  size: number
  type: string
}
```

### Usuários

```typescript
// GET /api/users
interface GetUsersQuery {
  page?: number
  limit?: number
  role?: string
  search?: string
}

// POST /api/users
interface CreateUserRequest {
  name: string
  email: string
  password: string
  role: string
}

// PUT /api/users/[id]
interface UpdateUserRequest {
  name?: string
  email?: string
  role?: string
}
```

## Middlewares

### Autenticação

```typescript
// middleware/auth.ts
import { getToken } from 'next-auth/jwt'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function authMiddleware(req: NextRequest) {
  const token = await getToken({ req })
  
  if (!token) {
    return new NextResponse('Não autorizado', { status: 401 })
  }

  return NextResponse.next()
}
```

### Validação

```typescript
// middleware/validate.ts
import { z } from 'zod'
import { NextResponse } from 'next/server'

export function validateBody<T>(schema: z.Schema<T>) {
  return async (req: Request) => {
    try {
      const body = await req.json()
      const validated = schema.parse(body)
      return validated
    } catch (error) {
      if (error instanceof z.ZodError) {
        return new NextResponse('Dados inválidos', { 
          status: 400,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ errors: error.errors })
        })
      }
      return new NextResponse('Erro interno', { status: 500 })
    }
  }
}
```

## Handlers

### Exemplo de Handler Completo

```typescript
// app/api/news/route.ts
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]/route'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { validateBody } from '@/middleware/validate'

const newsSchema = z.object({
  title: z.string().min(3, 'Título muito curto'),
  content: z.string().min(10, 'Conteúdo muito curto'),
  imageUrl: z.string().url().optional(),
  published: z.boolean(),
  categoryIds: z.array(z.string())
})

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '10')
  const category = searchParams.get('category')
  const search = searchParams.get('search')

  const where = {
    published: true,
    ...(category && {
      categories: {
        some: {
          category: {
            name: category
          }
        }
      }
    }),
    ...(search && {
      OR: [
        { title: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } }
      ]
    })
  }

  const [news, total] = await Promise.all([
    prisma.news.findMany({
      where,
      include: {
        categories: {
          include: {
            category: true
          }
        },
        author: {
          select: {
            name: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip: (page - 1) * limit,
      take: limit
    }),
    prisma.news.count({ where })
  ])

  return NextResponse.json({
    data: news,
    total,
    page,
    totalPages: Math.ceil(total / limit)
  })
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return new Response('Não autorizado', { status: 401 })
  }

  const validated = await validateBody(newsSchema)(req)
  if (validated instanceof NextResponse) return validated

  try {
    const news = await prisma.news.create({
      data: {
        ...validated,
        createdBy: session.user.id,
        categories: {
          create: validated.categoryIds.map(id => ({
            category: { connect: { id } }
          }))
        }
      },
      include: {
        categories: {
          include: {
            category: true
          }
        }
      }
    })

    return NextResponse.json(news, { status: 201 })
  } catch (error) {
    console.error('Erro ao criar notícia:', error)
    return new Response('Erro interno', { status: 500 })
  }
}
```

## Boas Práticas

1. **Validação**
   - Schemas Zod para validação
   - Tipos TypeScript
   - Sanitização de input
   - Validação de permissões

2. **Respostas**
   - Status codes corretos
   - Mensagens de erro claras
   - Formato consistente
   - Paginação quando necessário

3. **Segurança**
   - Autenticação
   - Rate limiting
   - CORS configurado
   - Headers seguros

4. **Performance**
   - Cache quando possível
   - Queries otimizadas
   - Bulk operations
   - Compression
