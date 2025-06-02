# Arquitetura de Componentes

## Visão Geral

Cada componente do sistema é dividido em três camadas distintas:

```
+-------------------+
|   1. Database    |    Schema e Models (Prisma)
+-------------------+
         ↕
+-------------------+
|   2. Dashboard    |    Componente de Administração
+-------------------+
         ↕
+-------------------+
|    3. Frontend    |    Componente Público (Home)
+-------------------+
```

## Exemplo Prático: Componente de Notícias

### 1. Camada de Banco de Dados

```prisma
// schema.prisma
model News {
  id          String    @id @default(cuid())
  title       String
  content     String    @db.Text
  imageUrl    String?
  published   Boolean   @default(false)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  createdBy   String
  author      User      @relation(fields: [createdBy], references: [id])
  categories  NewsToCategories[]
}

model NewsCategory {
  id        String    @id @default(cuid())
  name      String    @unique
  createdAt DateTime  @default(now())
  news      NewsToCategories[]
}

model NewsToCategories {
  newsId      String
  categoryId  String
  news        News          @relation(fields: [newsId], references: [id], onDelete: Cascade)
  category    NewsCategory  @relation(fields: [categoryId], references: [id], onDelete: Cascade)

  @@id([newsId, categoryId])
}
```

### 2. Componente do Dashboard (Administração)

```typescript
// src/components/dashboard/news/NewsEditor.tsx
'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useSession } from 'next-auth/react'

const newsSchema = z.object({
  title: z.string().min(3, 'Título muito curto'),
  content: z.string().min(10, 'Conteúdo muito curto'),
  published: z.boolean(),
  categoryIds: z.array(z.string())
})

type NewsFormData = z.infer<typeof newsSchema>

interface NewsEditorProps {
  initialData?: NewsFormData
}

export function NewsEditor({ initialData }: NewsEditorProps) {
  const { data: session } = useSession()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [image, setImage] = useState<File | null>(null)

  const { register, handleSubmit, formState: { errors } } = useForm<NewsFormData>({
    resolver: zodResolver(newsSchema),
    defaultValues: initialData
  })

  const onSubmit = async (data: NewsFormData) => {
    if (!session?.user) return
    setIsSubmitting(true)

    try {
      // Upload da imagem
      let imageUrl = initialData?.imageUrl
      if (image) {
        const formData = new FormData()
        formData.append('file', image)
        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        })
        const { url } = await uploadRes.json()
        imageUrl = url
      }

      // Salvar notícia
      const response = await fetch('/api/news', {
        method: initialData ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          imageUrl,
          createdBy: session.user.id
        })
      })

      if (!response.ok) throw new Error('Erro ao salvar notícia')

      // Redirecionar ou mostrar sucesso
    } catch (error) {
      console.error('Erro:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <input
          type="text"
          {...register('title')}
          className="w-full p-2 border rounded"
          placeholder="Título da notícia"
        />
        {errors.title && (
          <p className="text-red-500 text-sm">{errors.title.message}</p>
        )}
      </div>

      <div>
        <textarea
          {...register('content')}
          className="w-full p-2 border rounded"
          placeholder="Conteúdo"
          rows={5}
        />
        {errors.content && (
          <p className="text-red-500 text-sm">{errors.content.message}</p>
        )}
      </div>

      <div>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setImage(e.target.files?.[0] || null)}
          className="w-full p-2 border rounded"
        />
      </div>

      <div className="flex items-center">
        <label className="flex items-center space-x-2">
          <input type="checkbox" {...register('published')} />
          <span>Publicar notícia</span>
        </label>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="px-4 py-2 bg-[#008F4C] text-white rounded disabled:opacity-50"
      >
        {isSubmitting ? 'Salvando...' : 'Salvar'}
      </button>
    </form>
  )
}
```

### 3. Componente do Frontend (Home)

```typescript
// src/components/home/NewsSection.tsx
import { prisma } from '@/lib/prisma'

async function getNews({ limit = 3, category }: { limit?: number, category?: string }) {
  return await prisma.news.findMany({
    where: {
      published: true,
      ...(category && {
        categories: {
          some: {
            category: {
              name: category
            }
          }
        }
      })
    },
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
    take: limit
  })
}

export async function NewsSection({ 
  limit = 3, 
  category 
}: { 
  limit?: number
  category?: string 
}) {
  const news = await getNews({ limit, category })

  return (
    <section className="py-12">
      <div className="container mx-auto">
        <h2 className="text-3xl font-bold mb-8">Últimas Notícias</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {news.map((item) => (
            <NewsCard
              key={item.id}
              title={item.title}
              content={item.content}
              imageUrl={item.imageUrl}
              date={item.createdAt}
              author={item.author.name}
              categories={item.categories.map(c => c.category.name)}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
```

## Fluxo de Dados

1. **Criação/Edição (Dashboard → Database)**
   ```
   Editor → Validação (Zod) → API Route → Prisma → Banco de Dados
   ```

2. **Exibição (Database → Frontend)**
   ```
   Banco de Dados → Prisma → Server Component → Cliente
   ```

## Benefícios desta Arquitetura

1. **Separação de Responsabilidades**
   - Schema bem definido no Prisma
   - Validação com Zod
   - Componentes React isolados
   - API Routes para operações

2. **Manutenibilidade**
   - Fácil modificar cada camada
   - Componentes reutilizáveis
   - Código organizado
   - Tipagem forte com TypeScript

3. **Performance**
   - Server Components para dados estáticos
   - Cache automático do Next.js
   - Queries otimizadas do Prisma
   - Validação client-side

4. **Segurança**
   - Validação em múltiplas camadas
   - Autenticação via NextAuth
   - Proteção de rotas
   - Sanitização de dados

## Boas Práticas

1. **Organização de Código**
   - Componentes em pastas por contexto
   - Separação de lógica e apresentação
   - Hooks personalizados para lógica comum
   - Types e interfaces bem definidos

2. **Validação**
   - Schema Zod para forms
   - Validação no servidor
   - Feedback visual de erros
   - Tipagem forte

3. **Estado**
   - Server Components quando possível
   - React Hook Form para forms
   - Context API quando necessário
   - Loading states

4. **Estilização**
   - Tailwind CSS para consistência
   - Classes utilitárias
   - Responsividade
   - Temas consistentes
