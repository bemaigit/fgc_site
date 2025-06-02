# Guia de Desenvolvimento

## Visão Geral

Este guia descreve as práticas e padrões de desenvolvimento do projeto FGC, incluindo:

1. **Setup do Ambiente**
2. **Padrões de Código**
3. **Fluxo de Trabalho**
4. **Boas Práticas**

## Setup do Ambiente

### Requisitos

- Node.js 18+
- PostgreSQL 15+ (ou SQLite para desenvolvimento)
- Docker (opcional)
- VS Code (recomendado)

### Instalação

```bash
# Clone o repositório
git clone https://github.com/seu-usuario/fgc.git
cd fgc

# Instale as dependências
npm install

# Configure as variáveis de ambiente
cp .env.example .env

# Execute as migrations
npx prisma migrate dev

# Inicie o servidor de desenvolvimento
npm run dev
```

### Variáveis de Ambiente

```env
# Banco de Dados
DATABASE_URL="postgresql://user:password@localhost:5432/fgc"
SHADOW_DATABASE_URL="postgresql://user:password@localhost:5432/fgc_shadow"

# Autenticação
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="seu-secret-aqui"

# Storage
STORAGE_TYPE="local"
LOCAL_STORAGE_PATH="./public/uploads"

# Email (opcional)
SMTP_HOST="smtp.example.com"
SMTP_PORT="587"
SMTP_USER="seu-email@example.com"
SMTP_PASS="sua-senha"
```

## Estrutura do Projeto

```
fgc/
├── src/
│   ├── app/                 # App Router e Pages
│   ├── components/          # Componentes React
│   ├── lib/                 # Utilitários e configurações
│   ├── hooks/              # React Hooks
│   └── types/              # TypeScript types
├── prisma/                 # Schema e migrations
├── public/                 # Arquivos estáticos
├── docs/                   # Documentação
└── tests/                  # Testes
```

### Organização de Componentes

```typescript
// Exemplo de estrutura de componentes

// components/common/        # Componentes reutilizáveis
Button.tsx
Input.tsx
Card.tsx

// components/layout/        # Componentes de layout
Header.tsx
Footer.tsx
Sidebar.tsx

// components/dashboard/     # Componentes do dashboard
news/
  NewsEditor.tsx
  NewsList.tsx
  NewsFilters.tsx

// components/home/         # Componentes da home
NewsSection.tsx
EventsSection.tsx
HeroSection.tsx
```

## Padrões de Código

### TypeScript

```typescript
// types/news.ts
export interface News {
  id: string
  title: string
  content: string
  imageUrl?: string
  published: boolean
  createdAt: Date
  updatedAt: Date
  createdBy: string
  categories: NewsCategory[]
}

export interface NewsCategory {
  id: string
  name: string
}

// Enums
export enum NewsStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ARCHIVED = 'archived'
}

// Types utilitários
export type NewsWithoutContent = Omit<News, 'content'>
export type NewsInput = Omit<News, 'id' | 'createdAt' | 'updatedAt'>
```

### React Components

```typescript
// components/news/NewsCard.tsx
import { type News } from '@/types/news'
import { formatDate } from '@/lib/utils'
import Image from 'next/image'

interface NewsCardProps {
  news: News
  onEdit?: (id: string) => void
  className?: string
}

export function NewsCard({ 
  news, 
  onEdit,
  className = ''
}: NewsCardProps) {
  return (
    <article className={`rounded-lg shadow-md ${className}`}>
      {news.imageUrl && (
        <div className="relative h-48">
          <Image
            src={news.imageUrl}
            alt={news.title}
            fill
            className="object-cover rounded-t-lg"
          />
        </div>
      )}

      <div className="p-4">
        <h3 className="text-xl font-bold">{news.title}</h3>
        <p className="mt-2 text-gray-600 line-clamp-3">{news.content}</p>
        
        <div className="mt-4 flex items-center justify-between">
          <time className="text-sm text-gray-500">
            {formatDate(news.createdAt)}
          </time>
          
          {onEdit && (
            <button
              onClick={() => onEdit(news.id)}
              className="text-sm text-blue-600 hover:underline"
            >
              Editar
            </button>
          )}
        </div>
      </div>
    </article>
  )
}
```

### Hooks Personalizados

```typescript
// hooks/useNews.ts
import { useState } from 'react'
import { type News, type NewsInput } from '@/types/news'

interface UseNewsResult {
  news: News[]
  loading: boolean
  error: Error | null
  createNews: (data: NewsInput) => Promise<News>
  updateNews: (id: string, data: Partial<NewsInput>) => Promise<News>
  deleteNews: (id: string) => Promise<void>
}

export function useNews(): UseNewsResult {
  const [news, setNews] = useState<News[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const createNews = async (data: NewsInput): Promise<News> => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/news', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (!response.ok) throw new Error('Erro ao criar notícia')

      const newNews = await response.json()
      setNews(prev => [...prev, newNews])
      return newNews
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erro desconhecido'))
      throw err
    } finally {
      setLoading(false)
    }
  }

  // ... outros métodos

  return {
    news,
    loading,
    error,
    createNews,
    updateNews,
    deleteNews
  }
}
```

### API Routes

```typescript
// app/api/news/route.ts
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]/route'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const newsSchema = z.object({
  title: z.string().min(3, 'Título muito curto'),
  content: z.string().min(10, 'Conteúdo muito curto'),
  imageUrl: z.string().url().optional(),
  published: z.boolean(),
  categoryIds: z.array(z.string())
})

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return new Response('Não autorizado', { status: 401 })
    }

    const body = await req.json()
    const validatedData = newsSchema.parse(body)

    const news = await prisma.news.create({
      data: {
        ...validatedData,
        createdBy: session.user.id,
        categories: {
          create: validatedData.categoryIds.map(id => ({
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
    if (error instanceof z.ZodError) {
      return new Response('Dados inválidos', { status: 400 })
    }
    return new Response('Erro interno', { status: 500 })
  }
}
```

## Fluxo de Trabalho

### Git

```bash
# Crie uma branch para sua feature
git checkout -b feature/nome-da-feature

# Faça commits pequenos e descritivos
git add .
git commit -m "feat: adiciona componente de edição de notícias"

# Mantenha sua branch atualizada
git fetch origin
git rebase origin/main

# Push e Pull Request
git push origin feature/nome-da-feature
```

### Commits

Seguimos o padrão Conventional Commits:

- `feat`: Nova funcionalidade
- `fix`: Correção de bug
- `docs`: Documentação
- `style`: Formatação
- `refactor`: Refatoração
- `test`: Testes
- `chore`: Tarefas de manutenção

### Code Review

1. **Antes do PR**
   - Testes passando
   - Lint sem erros
   - Tipos corretos
   - Documentação atualizada

2. **Durante o Review**
   - Código limpo
   - Boas práticas
   - Performance
   - Segurança

## Boas Práticas

### 1. Código

- Use TypeScript
- Componentes pequenos e focados
- Props tipadas
- Error boundaries
- Lazy loading

### 2. Performance

- Otimização de imagens
- Code splitting
- Memoização
- Cache eficiente
- Bundle size

### 3. Segurança

- Validação de input
- Sanitização de dados
- CSRF tokens
- Rate limiting
- Logs seguros

### 4. Acessibilidade

- Semântica HTML
- ARIA labels
- Contraste de cores
- Navegação por teclado
- Screen readers

## VS Code

### Extensões Recomendadas

```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "prisma.prisma",
    "bradlc.vscode-tailwindcss",
    "formulahendry.auto-rename-tag",
    "streetsidesoftware.code-spell-checker",
    "streetsidesoftware.code-spell-checker-portuguese-brazilian"
  ]
}
```

### Configurações

```json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true
}
```

## Scripts NPM

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "test": "jest",
    "test:watch": "jest --watch",
    "prisma:studio": "prisma studio",
    "prisma:migrate": "prisma migrate dev",
    "prisma:generate": "prisma generate"
  }
}
```

## Recursos

1. **Documentação**
   - [Next.js](https://nextjs.org/docs)
   - [Prisma](https://www.prisma.io/docs)
   - [NextAuth.js](https://next-auth.js.org)
   - [TailwindCSS](https://tailwindcss.com/docs)

2. **Design**
   - [Figma](https://www.figma.com)
   - [Tailwind UI](https://tailwindui.com)
   - [Heroicons](https://heroicons.com)

3. **Ferramentas**
   - [Vercel](https://vercel.com)
   - [GitHub](https://github.com)
   - [VS Code](https://code.visualstudio.com)
# Estrutura de Hooks

## Visão Geral

A estrutura de hooks será dividida em três categorias principais:

1. **Hooks Base (Core)**
2. **Hooks de Dados (Data)**
3. **Hooks de UI**

## Estrutura de Arquivos

```
src/
└── hooks/
    ├── core/
    │   ├── useSupabase.ts
    │   ├── useAuth.ts
    │   └── usePermissions.ts
    ├── data/
    │   ├── useQuery.ts
    │   ├── useMutation.ts
    │   └── useRealtime.ts
    └── ui/
        ├── useToast.ts
        ├── useModal.ts
        └── useForm.ts
```

## 1. Hooks Base (Core)

### useSupabase
```typescript
// src/hooks/core/useSupabase.ts
import { createClient } from '@supabase/supabase-js'
import { useMemo } from 'react'

export function useSupabase() {
  const supabase = useMemo(() => createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ), [])

  return supabase
}
```

### useAuth
```typescript
// src/hooks/core/useAuth.ts
import { useEffect, useState } from 'react'
import { useSupabase } from './useSupabase'

export function useAuth() {
  const supabase = useSupabase()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null)
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [supabase])

  return { user, loading }
}
```

## 2. Hooks de Dados (Data)

### useQuery
```typescript
// src/hooks/data/useQuery.ts
import { useEffect, useState } from 'react'
import { useSupabase } from '../core/useSupabase'

interface QueryOptions {
  table: string
  select?: string
  filters?: Record<string, any>
  orderBy?: { column: string; ascending?: boolean }
  limit?: number
}

export function useQuery<T>({ 
  table, 
  select = '*', 
  filters,
  orderBy,
  limit 
}: QueryOptions) {
  const supabase = useSupabase()
  const [data, setData] = useState<T[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        let query = supabase
          .from(table)
          .select(select)

        // Aplicar filtros
        if (filters) {
          Object.entries(filters).forEach(([key, value]) => {
            query = query.eq(key, value)
          })
        }

        // Ordenação
        if (orderBy) {
          query = query.order(orderBy.column, {
            ascending: orderBy.ascending ?? true
          })
        }

        // Limite
        if (limit) {
          query = query.limit(limit)
        }

        const { data, error } = await query

        if (error) throw error
        setData(data)
      } catch (e) {
        setError(e as Error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [table, select, JSON.stringify(filters), JSON.stringify(orderBy), limit])

  return { data, loading, error }
}
```

### useMutation
```typescript
// src/hooks/data/useMutation.ts
import { useState } from 'react'
import { useSupabase } from '../core/useSupabase'

interface MutationOptions {
  table: string
  onSuccess?: (data: any) => void
  onError?: (error: Error) => void
}

export function useMutation({ 
  table, 
  onSuccess, 
  onError 
}: MutationOptions) {
  const supabase = useSupabase()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const insert = async (data: any) => {
    setLoading(true)
    try {
      const { data: result, error } = await supabase
        .from(table)
        .insert(data)
        .select()

      if (error) throw error
      onSuccess?.(result)
      return result
    } catch (e) {
      setError(e as Error)
      onError?.(e as Error)
      throw e
    } finally {
      setLoading(false)
    }
  }

  const update = async (id: string, data: any) => {
    setLoading(true)
    try {
      const { data: result, error } = await supabase
        .from(table)
        .update(data)
        .eq('id', id)
        .select()

      if (error) throw error
      onSuccess?.(result)
      return result
    } catch (e) {
      setError(e as Error)
      onError?.(e as Error)
      throw e
    } finally {
      setLoading(false)
    }
  }

  const remove = async (id: string) => {
    setLoading(true)
    try {
      const { data: result, error } = await supabase
        .from(table)
        .delete()
        .eq('id', id)
        .select()

      if (error) throw error
      onSuccess?.(result)
      return result
    } catch (e) {
      setError(e as Error)
      onError?.(e as Error)
      throw e
    } finally {
      setLoading(false)
    }
  }

  return {
    insert,
    update,
    remove,
    loading,
    error
  }
}
```

### useRealtime
```typescript
// src/hooks/data/useRealtime.ts
import { useEffect, useState } from 'react'
import { useSupabase } from '../core/useSupabase'

interface RealtimeOptions {
  table: string
  event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*'
  callback?: (payload: any) => void
}

export function useRealtime({ 
  table, 
  event = '*', 
  callback 
}: RealtimeOptions) {
  const supabase = useSupabase()
  const [subscription, setSubscription] = useState<any>(null)

  useEffect(() => {
    const subscription = supabase
      .channel(`public:${table}`)
      .on(
        'postgres_changes',
        { event, schema: 'public', table },
        (payload) => {
          callback?.(payload)
        }
      )
      .subscribe()

    setSubscription(subscription)

    return () => {
      subscription.unsubscribe()
    }
  }, [table, event, callback])

  return subscription
}
```

## Exemplo de Uso

### Componente de Notícias
```typescript
// Exemplo de como usar os hooks em um componente

// Hook personalizado para notícias
function useNews() {
  // Query para listar notícias
  const { data: news, loading } = useQuery({
    table: 'news',
    select: '*, categories(*)',
    orderBy: { column: 'created_at', ascending: false },
    limit: 10
  })

  // Mutation para gerenciar notícias
  const { insert, update, remove } = useMutation({
    table: 'news',
    onSuccess: () => {
      // Atualizar cache ou estado
    }
  })

  // Realtime para atualizações
  useRealtime({
    table: 'news',
    callback: (payload) => {
      // Atualizar interface quando houver mudanças
    }
  })

  return {
    news,
    loading,
    createNews: insert,
    updateNews: update,
    deleteNews: remove
  }
}

// Componente que usa o hook
function NewsManager() {
  const { news, loading, createNews, updateNews, deleteNews } = useNews()

  if (loading) return <div>Carregando...</div>

  return (
    <div>
      {news?.map((item) => (
        <NewsCard 
          key={item.id}
          data={item}
          onEdit={(data) => updateNews(item.id, data)}
          onDelete={() => deleteNews(item.id)}
        />
      ))}
    </div>
  )
}
```

## Benefícios desta Estrutura

1. **Reutilização de Código**
   - Hooks base podem ser usados em qualquer componente
   - Lógica comum centralizada
   - Redução de duplicação

2. **Separação de Responsabilidades**
   - Hooks de dados separados da UI
   - Lógica de negócio isolada
   - Fácil manutenção

3. **Performance**
   - Memoização quando necessário
   - Cache automático
   - Atualizações otimizadas

4. **Tipagem**
   - TypeScript para segurança
   - Autocompletion
   - Detecção de erros

## Próximos Passos

1. **Cache**
   - Implementar sistema de cache
   - Invalidação inteligente
   - Otimização de queries

2. **Error Handling**
   - Sistema de retry
   - Feedback ao usuário
   - Logging

3. **Testes**
   - Testes unitários
   - Testes de integração
   - Mocks
