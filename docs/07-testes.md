# Estratégia de Testes

## Visão Geral

O sistema de testes do FGC é estruturado em múltiplas camadas para garantir a qualidade e confiabilidade do código:

1. **Testes Unitários**: Testam componentes e funções isoladamente
2. **Testes de Integração**: Verificam a interação entre componentes
3. **Testes End-to-End**: Simulam o uso real da aplicação
4. **Testes de API**: Validam endpoints e contratos

## Ferramentas

- **Jest**: Framework principal de testes
- **React Testing Library**: Testes de componentes React
- **Prisma Testing**: Testes de banco de dados
- **MSW (Mock Service Worker)**: Mock de requisições HTTP
- **Playwright**: Testes end-to-end
- **Zod**: Validação de tipos e schemas

## Configuração

### Jest

```typescript
// jest.config.js
const nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: './'
})

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    '^@/components/(.*)$': '<rootDir>/src/components/$1',
    '^@/lib/(.*)$': '<rootDir>/src/lib/$1'
  },
  testEnvironment: 'jest-environment-jsdom',
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{js,jsx,ts,tsx}'
  ]
}

module.exports = createJestConfig(customJestConfig)
```

### Setup de Testes

```typescript
// jest.setup.js
import '@testing-library/jest-dom'
import { server } from './src/mocks/server'

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())
```

## Exemplos de Testes

### Testes Unitários

```typescript
// lib/permissions.test.ts
import { checkPermission } from './permissions'
import { prisma } from './prisma'
import { getServerSession } from 'next-auth'

jest.mock('./prisma')
jest.mock('next-auth')

describe('checkPermission', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('retorna false se não houver sessão', async () => {
    ;(getServerSession as jest.Mock).mockResolvedValue(null)
    
    const result = await checkPermission('news', 'read')
    
    expect(result).toBe(false)
  })

  it('retorna true para super admin', async () => {
    ;(getServerSession as jest.Mock).mockResolvedValue({
      user: { id: '1', role: 'SUPER_ADMIN' }
    })
    
    const result = await checkPermission('news', 'read')
    
    expect(result).toBe(true)
  })

  it('verifica permissões específicas', async () => {
    ;(getServerSession as jest.Mock).mockResolvedValue({
      user: { id: '1', role: 'ADMIN' }
    })
    
    ;(prisma.permission.findUnique as jest.Mock).mockResolvedValue({
      actions: ['read', 'create']
    })
    
    const result = await checkPermission('news', 'read')
    
    expect(result).toBe(true)
    expect(prisma.permission.findUnique).toHaveBeenCalledWith({
      where: {
        userId_resource: {
          userId: '1',
          resource: 'news'
        }
      }
    })
  })
})
```

### Testes de Componentes

```typescript
// components/NewsCard.test.tsx
import { render, screen } from '@testing-library/react'
import { NewsCard } from './NewsCard'

describe('NewsCard', () => {
  const defaultProps = {
    title: 'Título da Notícia',
    content: 'Conteúdo da notícia',
    imageUrl: '/image.jpg',
    date: new Date('2024-01-01'),
    author: 'João Silva'
  }

  it('renderiza corretamente', () => {
    render(<NewsCard {...defaultProps} />)

    expect(screen.getByText(defaultProps.title)).toBeInTheDocument()
    expect(screen.getByText(defaultProps.content)).toBeInTheDocument()
    expect(screen.getByText(defaultProps.author)).toBeInTheDocument()
    expect(screen.getByAltText(defaultProps.title)).toHaveAttribute(
      'src',
      expect.stringContaining(defaultProps.imageUrl)
    )
  })

  it('formata a data corretamente', () => {
    render(<NewsCard {...defaultProps} />)
    
    expect(screen.getByText('01/01/2024')).toBeInTheDocument()
  })
})
```

### Testes de API

```typescript
// app/api/news/route.test.ts
import { GET, POST } from './route'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'

jest.mock('@/lib/prisma')
jest.mock('next-auth')

describe('API de Notícias', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /api/news', () => {
    it('retorna lista de notícias publicadas', async () => {
      const mockNews = [
        { id: '1', title: 'Notícia 1', published: true },
        { id: '2', title: 'Notícia 2', published: true }
      ]

      ;(prisma.news.findMany as jest.Mock).mockResolvedValue(mockNews)

      const response = await GET(new Request('http://localhost/api/news'))
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual(mockNews)
    })
  })

  describe('POST /api/news', () => {
    it('requer autenticação', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue(null)

      const response = await POST(
        new Request('http://localhost/api/news', {
          method: 'POST',
          body: JSON.stringify({ title: 'Nova Notícia' })
        })
      )

      expect(response.status).toBe(401)
    })

    it('cria nova notícia', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue({
        user: { id: '1', role: 'ADMIN' }
      })

      const mockNews = {
        id: '1',
        title: 'Nova Notícia',
        content: 'Conteúdo'
      }

      ;(prisma.news.create as jest.Mock).mockResolvedValue(mockNews)

      const response = await POST(
        new Request('http://localhost/api/news', {
          method: 'POST',
          body: JSON.stringify(mockNews)
        })
      )

      expect(response.status).toBe(201)
      expect(await response.json()).toEqual(mockNews)
    })
  })
})
```

### Testes End-to-End

```typescript
// e2e/news.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Fluxo de Notícias', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('lista notícias na página inicial', async ({ page }) => {
    await expect(page.getByTestId('news-section')).toBeVisible()
    await expect(page.getByTestId('news-card')).toHaveCount(3)
  })

  test('cria nova notícia no dashboard', async ({ page }) => {
    // Login
    await page.goto('/auth/login')
    await page.fill('[name="email"]', 'admin@example.com')
    await page.fill('[name="password"]', 'password')
    await page.click('button[type="submit"]')

    // Navegação
    await page.goto('/dashboard/news/new')
    
    // Preenchimento do formulário
    await page.fill('[name="title"]', 'Nova Notícia')
    await page.fill('[name="content"]', 'Conteúdo da notícia')
    await page.setInputFiles('[name="image"]', 'test-image.jpg')
    await page.check('[name="published"]')
    await page.click('button[type="submit"]')

    // Verificação
    await expect(page.getByText('Notícia criada com sucesso')).toBeVisible()
    await page.goto('/')
    await expect(page.getByText('Nova Notícia')).toBeVisible()
  })
})
```

## Mocks

### Handlers de API

```typescript
// mocks/handlers.ts
import { rest } from 'msw'

export const handlers = [
  rest.get('/api/news', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json([
        {
          id: '1',
          title: 'Notícia 1',
          content: 'Conteúdo 1',
          published: true
        }
      ])
    )
  }),

  rest.post('/api/news', async (req, res, ctx) => {
    const body = await req.json()
    return res(
      ctx.status(201),
      ctx.json({
        id: '2',
        ...body
      })
    )
  })
]
```

### Mocks de Prisma

```typescript
// mocks/prisma.ts
export const prismaMock = {
  news: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn()
  },
  user: {
    findUnique: jest.fn()
  },
  permission: {
    findUnique: jest.fn()
  }
}

jest.mock('@/lib/prisma', () => ({
  prisma: prismaMock
}))
```

## Scripts de Teste

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:e2e": "playwright test",
    "test:ci": "jest --ci --coverage && playwright test"
  }
}
```

## Boas Práticas

1. **Organização**
   - Testes próximos ao código
   - Nomes descritivos
   - Arrange-Act-Assert pattern
   - Testes isolados

2. **Mocks e Stubs**
   - Mock apenas o necessário
   - Dados realistas
   - Reset entre testes
   - Tipagem correta

3. **Cobertura**
   - Mínimo de 80% de cobertura
   - Foco em código crítico
   - Testes significativos
   - Evitar testes frágeis

4. **CI/CD**
   - Testes automatizados
   - Ambiente isolado
   - Relatórios de cobertura
   - Testes de regressão
