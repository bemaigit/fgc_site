# Guia de Migração do Supabase

## Visão Geral

Este guia descreve o processo de migração do Supabase para a nova stack tecnológica:

- **Autenticação**: Supabase Auth → NextAuth.js
- **Banco de Dados**: Supabase → PostgreSQL + Prisma
- **Storage**: Supabase Storage → MinIO
- **Realtime**: Supabase Realtime → Server-Sent Events (SSE)

## Etapas de Migração

### 1. Preparação

1. **Backup dos Dados**
   ```bash
   # Exporta banco do Supabase
   supabase db dump -f backup.sql

   # Exporta arquivos do Storage
   supabase storage download --bucket=public
   ```

2. **Setup do Novo Ambiente**
   ```bash
   # Instala dependências
   npm install next-auth @prisma/client @aws-sdk/client-s3

   # Inicializa Prisma
   npx prisma init
   ```

### 2. Migração do Banco de Dados

#### Schema do Prisma

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// Usuários e Autenticação
model User {
  id            String      @id @default(cuid())
  name          String?
  email         String      @unique
  emailVerified DateTime?
  image         String?
  password      String
  role          UserRole    @default(USER)
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt
  accounts      Account[]
  sessions      Session[]
  news          News[]
  permissions   Permission[]
}

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

// Permissões
enum UserRole {
  SUPER_ADMIN
  ADMIN
  USER
}

model Permission {
  id        String   @id @default(cuid())
  userId    String
  resource  String
  actions   String[]
  createdAt DateTime @default(now())
  createdBy String?
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, resource])
}

// Notícias
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

#### Script de Migração

```typescript
// scripts/migrate.ts
import { PrismaClient } from '@prisma/client'
import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

async function migrateUsers() {
  // Busca usuários do Supabase
  const { data: users } = await supabase
    .from('profiles')
    .select('*')

  // Migra cada usuário
  for (const user of users) {
    const { data: authUser } = await supabase.auth.admin.getUserById(user.id)
    
    await prisma.user.create({
      data: {
        id: user.id,
        email: authUser?.email!,
        name: user.username,
        password: await bcrypt.hash(process.env.DEFAULT_PASSWORD!, 10),
        role: user.role.toUpperCase(),
        createdAt: user.created_at,
        updatedAt: user.updated_at
      }
    })
  }
}

async function migrateNews() {
  // Busca notícias do Supabase
  const { data: news } = await supabase
    .from('news')
    .select(`
      *,
      news_categories (
        name
      )
    `)

  // Migra cada notícia
  for (const item of news) {
    // Cria ou busca categorias
    const categories = await Promise.all(
      item.news_categories.map(async (cat: any) => {
        return await prisma.newsCategory.upsert({
          where: { name: cat.name },
          update: {},
          create: { name: cat.name }
        })
      })
    )

    // Cria notícia
    await prisma.news.create({
      data: {
        title: item.title,
        content: item.content,
        imageUrl: item.image_url,
        published: item.published,
        createdBy: item.created_by,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
        categories: {
          create: categories.map(cat => ({
            category: {
              connect: { id: cat.id }
            }
          }))
        }
      }
    })
  }
}

async function migratePermissions() {
  // Busca permissões do Supabase
  const { data: permissions } = await supabase
    .from('permissions')
    .select('*')

  // Migra cada permissão
  for (const perm of permissions) {
    await prisma.permission.create({
      data: {
        userId: perm.profile_id,
        resource: perm.resource,
        actions: perm.actions,
        createdAt: perm.created_at,
        createdBy: perm.created_by
      }
    })
  }
}
```

### 3. Migração do Storage

```typescript
// scripts/migrate-storage.ts
import { createClient } from '@supabase/supabase-js'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import fs from 'fs/promises'
import path from 'path'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

const s3Client = new S3Client({
  endpoint: process.env.MINIO_ENDPOINT,
  region: 'us-east-1',
  credentials: {
    accessKeyId: process.env.MINIO_ACCESS_KEY!,
    secretAccessKey: process.env.MINIO_SECRET_KEY!
  }
})

async function migrateStorage() {
  // Lista todos os arquivos do bucket
  const { data: files } = await supabase
    .storage
    .from('public')
    .list()

  // Migra cada arquivo
  for (const file of files) {
    // Download do Supabase
    const { data } = await supabase
      .storage
      .from('public')
      .download(file.name)

    if (!data) continue

    // Upload para MinIO
    await s3Client.send(
      new PutObjectCommand({
        Bucket: process.env.MINIO_BUCKET,
        Key: file.name,
        Body: Buffer.from(await data.arrayBuffer()),
        ContentType: file.metadata.mimetype
      })
    )
  }
}
```

### 4. Migração da Autenticação

```typescript
// app/api/auth/[...nextauth]/route.ts
import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

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
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.role = token.role
        session.user.id = token.id
      }
      return session
    }
  },
  pages: {
    signIn: '/auth/login',
    error: '/auth/error'
  }
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
```

### 5. Script de Migração Principal

```typescript
// scripts/run-migration.ts
import { migrateUsers } from './migrate-users'
import { migrateNews } from './migrate-news'
import { migratePermissions } from './migrate-permissions'
import { migrateStorage } from './migrate-storage'

async function runMigration() {
  try {
    console.log('Iniciando migração...')

    console.log('Migrando usuários...')
    await migrateUsers()

    console.log('Migrando notícias...')
    await migrateNews()

    console.log('Migrando permissões...')
    await migratePermissions()

    console.log('Migrando arquivos...')
    await migrateStorage()

    console.log('Migração concluída com sucesso!')
  } catch (error) {
    console.error('Erro na migração:', error)
    process.exit(1)
  }
}

runMigration()
```

## Checklist de Migração

1. **Preparação**
   - [ ] Backup completo do Supabase
   - [ ] Ambiente de staging configurado
   - [ ] Dependências instaladas
   - [ ] Variáveis de ambiente configuradas

2. **Migração**
   - [ ] Schema do Prisma criado
   - [ ] Migrations geradas
   - [ ] Dados migrados
   - [ ] Arquivos transferidos
   - [ ] Autenticação configurada

3. **Validação**
   - [ ] Testes automatizados
   - [ ] Verificação manual
   - [ ] Logs de erro
   - [ ] Backup de rollback

4. **Pós-migração**
   - [ ] Limpeza de dados antigos
   - [ ] Documentação atualizada
   - [ ] Monitoramento configurado
   - [ ] Equipe treinada

## Boas Práticas

1. **Segurança**
   - Backup antes da migração
   - Validação de dados
   - Testes em staging
   - Plano de rollback

2. **Performance**
   - Migração em lotes
   - Índices otimizados
   - Cache configurado
   - Monitoramento

3. **Manutenção**
   - Logs detalhados
   - Scripts idempotentes
   - Documentação clara
   - Suporte pós-migração

4. **Validação**
   - Testes automatizados
   - Verificação manual
   - Integridade dos dados
   - Performance comparativa
