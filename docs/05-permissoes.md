# Sistema de Permissões e Segurança

## Níveis de Usuário

### 1. Super Administrador (super_admin)
- Acesso total ao sistema
- Pode criar/modificar outros administradores
- Gerencia todas as configurações
- Não possui restrições de acesso

### 2. Usuário Privilegiado (admin)
- Acesso ao dashboard
- Permissões específicas por recurso
- Pode ser limitado por seção
- Atribuído pelo super_admin

### 3. Usuário Comum (user)
- Acesso à área pública
- Acesso a formulários específicos
- Visualização de conteúdo permitido
- Sem acesso ao dashboard

## Estrutura do Banco de Dados (Prisma Schema)

```prisma
// schema.prisma

enum UserRole {
  SUPER_ADMIN
  ADMIN
  USER
}

model User {
  id            String      @id @default(cuid())
  name          String
  email         String      @unique
  password      String
  role          UserRole    @default(USER)
  permissions   Permission[]
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt
}

model Permission {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  resource  String   // Nome do recurso (ex: 'events', 'news')
  actions   String[] // Array de ações permitidas ['create', 'read', 'update', 'delete']
  createdAt DateTime @default(now())
  createdBy String?

  @@unique([userId, resource])
}

model Resource {
  id          String   @id @default(cuid())
  name        String   @unique
  description String?
  isPublic    Boolean  @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

## Sistema de Permissões

### Verificação de Permissões (utils)
```typescript
// lib/permissions.ts
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

export async function checkPermission(
  resource: string,
  action: 'create' | 'read' | 'update' | 'delete'
) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return false

  // Super admin sempre tem permissão
  if (session.user.role === 'SUPER_ADMIN') return true

  // Verifica permissões específicas
  const permission = await prisma.permission.findUnique({
    where: {
      userId_resource: {
        userId: session.user.id,
        resource
      }
    }
  })

  return permission?.actions.includes(action) ?? false
}
```

### Middleware de Proteção (Next.js)

```typescript
// middleware.ts
import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  async function middleware(req) {
    const token = req.nextauth.token
    
    // Verifica se é uma rota do dashboard
    if (req.nextUrl.pathname.startsWith('/dashboard')) {
      if (!token) {
        return NextResponse.redirect(new URL('/auth/login', req.url))
      }

      // Verifica se o usuário tem permissão para acessar o dashboard
      if (token.role === 'USER') {
        return NextResponse.redirect(new URL('/', req.url))
      }
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
  matcher: ['/dashboard/:path*']
}
```

### API de Permissões

```typescript
// app/api/permissions/route.ts
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
    return new Response('Não autorizado', { status: 401 })
  }

  const { userId, resource, actions } = await req.json()

  const permission = await prisma.permission.upsert({
    where: {
      userId_resource: {
        userId,
        resource
      }
    },
    update: {
      actions
    },
    create: {
      userId,
      resource,
      actions,
      createdBy: session.user.id
    }
  })

  return NextResponse.json(permission)
}
```

### Hook de Permissões (Client-side)

```typescript
// hooks/usePermission.ts
import { useSession } from 'next-auth/react'
import { useState, useEffect } from 'react'

export function usePermission(resource: string, action: string) {
  const { data: session } = useSession()
  const [hasPermission, setHasPermission] = useState(false)

  useEffect(() => {
    if (!session?.user) {
      setHasPermission(false)
      return
    }

    // Super admin sempre tem permissão
    if (session.user.role === 'SUPER_ADMIN') {
      setHasPermission(true)
      return
    }

    // Verifica permissões no backend
    fetch(`/api/permissions/check?resource=${resource}&action=${action}`)
      .then(res => res.json())
      .then(data => setHasPermission(data.hasPermission))
  }, [session, resource, action])

  return hasPermission
}
```

## Componentes de Autorização

### Proteção de Componentes
```typescript
// components/auth/ProtectedComponent.tsx
import { usePermission } from '@/hooks/usePermission'

interface ProtectedComponentProps {
  resource: string
  action: string
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function ProtectedComponent({
  resource,
  action,
  children,
  fallback = null
}: ProtectedComponentProps) {
  const hasPermission = usePermission(resource, action)

  if (!hasPermission) return fallback

  return <>{children}</>
}
```

### Uso em Componentes
```tsx
<ProtectedComponent
  resource="news"
  action="create"
  fallback={<p>Sem permissão para criar notícias</p>}
>
  <CreateNewsForm />
</ProtectedComponent>
```

## Estratégia de Implementação

1. **Configuração Inicial**
   - Setup do Prisma Schema
   - Migrations iniciais
   - Configuração do NextAuth

2. **Middleware e Proteções**
   - Implementação do middleware
   - Funções de verificação de permissão
   - Hooks de autorização

3. **Interface Administrativa**
   - Gerenciamento de usuários
   - Atribuição de permissões
   - Logs de atividade

4. **Testes e Validação**
   - Testes unitários
   - Testes de integração
   - Validação de segurança
