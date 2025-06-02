# Cache e Performance

## Visão Geral

O sistema de cache do FGC é implementado em múltiplas camadas para otimizar a performance:

1. **Cache do Next.js**
   - Static Site Generation (SSG)
   - Incremental Static Regeneration (ISR)
   - Server-Side Rendering (SSR) com cache

2. **Cache do Nginx**
   - Arquivos estáticos
   - Respostas de API
   - Configurações otimizadas

3. **Cache do Banco de Dados**
   - Queries otimizadas
   - Índices
   - Connection pooling

4. **Cache do Cliente**
   - React Query
   - Service Worker
   - LocalStorage/SessionStorage

## Implementação

### Next.js Cache

```typescript
// app/page.tsx
import { getNews } from '@/lib/news'

// Página com revalidação a cada hora
export const revalidate = 3600

export default async function Home() {
  // Dados em cache
  const news = await getNews()
  
  return (
    <main>
      <NewsSection news={news} />
    </main>
  )
}

// app/news/[id]/page.tsx
import { getNewsById } from '@/lib/news'

// Gera páginas estáticas na build
export async function generateStaticParams() {
  const news = await getNews()
  return news.map(item => ({ id: item.id }))
}

export default async function NewsPage({ params }: { params: { id: string } }) {
  const news = await getNewsById(params.id)
  
  return (
    <article>
      <NewsDetail news={news} />
    </article>
  )
}
```

### React Query

```typescript
// hooks/useNews.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

export function useNews() {
  const queryClient = useQueryClient()

  const newsQuery = useQuery({
    queryKey: ['news'],
    queryFn: async () => {
      const res = await fetch('/api/news')
      return res.json()
    },
    staleTime: 1000 * 60 * 5, // 5 minutos
    cacheTime: 1000 * 60 * 30 // 30 minutos
  })

  const createNews = useMutation({
    mutationFn: async (data: NewsInput) => {
      const res = await fetch('/api/news', {
        method: 'POST',
        body: JSON.stringify(data)
      })
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['news'] })
    }
  })

  return {
    news: newsQuery.data,
    isLoading: newsQuery.isLoading,
    error: newsQuery.error,
    createNews
  }
}
```

### Service Worker

```typescript
// public/sw.js
const CACHE_NAME = 'fgc-cache-v1'
const STATIC_ASSETS = [
  '/',
  '/offline.html',
  '/styles.css',
  '/logo.png'
]

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(STATIC_ASSETS))
  )
})

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
      .catch(() => caches.match('/offline.html'))
  )
})

// Limpa caches antigos
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.map(key => {
        if (key !== CACHE_NAME) {
          return caches.delete(key)
        }
      })
    ))
  )
})
```

### Nginx Cache

```nginx
# Cache de proxy
proxy_cache_path /tmp/nginx_cache 
                 levels=1:2 
                 keys_zone=my_cache:10m 
                 max_size=10g 
                 inactive=60m 
                 use_temp_path=off;

# Configurações de cache
location / {
    proxy_cache my_cache;
    proxy_cache_use_stale error timeout http_500 http_502 http_503 http_504;
    proxy_cache_valid 200 60m;
    proxy_cache_valid 404 1m;
    
    # Headers de cache
    add_header X-Cache-Status $upstream_cache_status;
    
    proxy_pass http://app:3000;
}

# Cache de arquivos estáticos
location /static {
    expires 1y;
    add_header Cache-Control "public, no-transform";
}

# Cache de imagens
location ~* \.(jpg|jpeg|png|gif|ico|webp)$ {
    expires 1M;
    add_header Cache-Control "public, no-transform";
}
```

### Otimização de Banco de Dados

```typescript
// lib/prisma.ts
import { PrismaClient } from '@prisma/client'

const prismaClientSingleton = () => {
  return new PrismaClient({
    log: ['query', 'error', 'warn'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL
      }
    }
  }).$extends({
    result: {
      news: {
        // Cache de campos computados
        excerpt: {
          needs: { content: true },
          compute(news) {
            return news.content.slice(0, 150) + '...'
          }
        }
      }
    },
    query: {
      news: {
        // Middleware para cache
        async findMany({ args, query }) {
          const cacheKey = JSON.stringify(args)
          const cached = await redis.get(cacheKey)
          
          if (cached) {
            return JSON.parse(cached)
          }
          
          const result = await query(args)
          await redis.set(cacheKey, JSON.stringify(result), 'EX', 300)
          
          return result
        }
      }
    }
  })
}

export const prisma = prismaClientSingleton()
```

## Otimizações de Performance

### 1. Imagens

```typescript
// next.config.js
module.exports = {
  images: {
    domains: ['storage.fgc.example.com'],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  }
}

// components/OptimizedImage.tsx
import Image from 'next/image'

export function OptimizedImage({ src, alt, ...props }) {
  return (
    <div className="relative aspect-video">
      <Image
        src={src}
        alt={alt}
        fill
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        className="object-cover"
        loading="lazy"
        {...props}
      />
    </div>
  )
}
```

### 2. Bundle Size

```typescript
// Componente com lazy loading
import dynamic from 'next/dynamic'

const RichTextEditor = dynamic(
  () => import('@/components/RichTextEditor'),
  {
    loading: () => <div>Carregando editor...</div>,
    ssr: false
  }
)

// Redução de bundle
import { pick } from 'lodash-es/pick'
import dayjs from 'dayjs/esm'
import ptBr from 'dayjs/esm/locale/pt-br'
```

### 3. API Performance

```typescript
// Batch operations
export async function POST(req: Request) {
  const items = await req.json()
  
  // Processa em lotes de 100
  const batchSize = 100
  const batches = chunk(items, batchSize)
  
  const results = await Promise.all(
    batches.map(batch =>
      prisma.$transaction(
        batch.map(item =>
          prisma.news.create({ data: item })
        )
      )
    )
  )
  
  return NextResponse.json(results.flat())
}

// Queries otimizadas
const news = await prisma.news.findMany({
  select: {
    id: true,
    title: true,
    // Seleciona apenas campos necessários
  },
  where: {
    published: true,
    // Usa índices
  },
  orderBy: {
    createdAt: 'desc'
  },
  take: 10
})
```

## Monitoramento

### 1. Métricas de Cache

```typescript
// lib/monitoring.ts
import { metrics } from '@/lib/metrics'

export async function trackCacheMetrics() {
  // Cache hits/misses
  metrics.gauge('cache.hits', await redis.get('cache_hits'))
  metrics.gauge('cache.misses', await redis.get('cache_misses'))
  
  // Tamanho do cache
  metrics.gauge('cache.size', await redis.dbsize())
  
  // Latência
  metrics.histogram('cache.latency', latencyMs)
}
```

### 2. Performance Web Vitals

```typescript
// app/layout.tsx
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'

export default function RootLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body>
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
```

## Boas Práticas

1. **Estratégia de Cache**
   - Cache em camadas
   - Invalidação controlada
   - TTL apropriado
   - Fallback gracioso

2. **Otimização de Assets**
   - Compressão de imagens
   - Minificação de JS/CSS
   - Code splitting
   - Tree shaking

3. **Monitoramento**
   - Métricas de cache
   - Web vitals
   - Alertas
   - Logs de performance

4. **Manutenção**
   - Limpeza periódica
   - Atualização de deps
   - Testes de performance
   - Documentação
