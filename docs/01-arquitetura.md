# Arquitetura da Plataforma FGC

## Visão Geral da Arquitetura

A Plataforma FGC foi construída seguindo uma arquitetura moderna e escalável, utilizando as seguintes tecnologias e padrões:

### Frontend
- **Framework**: Next.js 14 com App Router
- **Renderização**: Server-Side Rendering (SSR) e Static Site Generation (SSG)
- **Estilização**: Tailwind CSS para design responsivo
- **Estado**: React Hooks e Context API
- **PWA**: Progressive Web App com next-pwa
  - Service Worker para cache e offline
  - Manifest para instalação
  - Otimizações de performance

### Backend
- **Framework**: Next.js App Router (API Routes)
- **Banco de Dados**: 
  - Desenvolvimento: SQLite
  - Produção: PostgreSQL
- **ORM**: Prisma
- **Autenticação**: NextAuth.js
- **Storage**: 
  - Desenvolvimento: Local Storage
  - Produção: MinIO (S3 Compatible)

## Estrutura de Diretórios

```
src/
├── app/                    # Rotas e páginas
│   ├── api/               # API Routes
│   │   ├── auth/         # Endpoints de autenticação
│   │   └── [recursos]/   # Outros endpoints
│   ├── auth/              # Sistema de autenticação
│   │   ├── login/
│   │   ├── register/
│   │   └── forgot-password/
│   ├── dashboard/         # Área administrativa
│   │   ├── layout.tsx     # Layout compartilhado
│   │   └── [seções]/      # Subpáginas do dashboard
│   └── layout.tsx         # Layout global
├── components/            # Componentes React
│   ├── auth/             # Componentes de autenticação
│   ├── dashboard/        # Componentes do dashboard
│   └── shared/           # Componentes compartilhados
├── lib/                  # Configurações e utilitários
│   ├── prisma.ts        # Cliente do Prisma
│   ├── auth.ts          # Configuração NextAuth
│   └── storage/         # Abstração de storage
│       ├── index.ts     # Interface comum
│       ├── local.ts     # Implementação local
│       └── minio.ts     # Implementação MinIO
└── prisma/              # Schemas e migrations
    ├── schema.prisma    # Modelo de dados
    └── migrations/      # Histórico de migrations
```

## Módulos do Sistema

### 1. Header_Geral
- Componentes: Logo, menus de navegação, botões (cadastrar, logar, sair)
- Acesso especial: Configurações (apenas Super ADM)
- Permissão: Visualização pública

### 2. Banner Principal
- Carrossel de imagens rotativas com links
- Permissão: Visualização pública

### 3. Indicadores
- 4 blocos de informações dinâmicas
- Permissão: Visualização pública

### 4. Filia-se
- Formulário completo de cadastro de atleta
- Campos: Nome completo, CPF (com validação), Data de nascimento, Endereço completo (auto-preenchimento via CEP), telefone, email (com validação), modalidade (múltipla escolha), categoria (única escolha)
- Integração com gateways de pagamento
- Permissão: Visualização pública, formulário apenas para usuários logados
- Complexidade: Alta (integração com gateways de pagamento)

### 4.1 Cadastro de Clube/Anuidade
- Formulário para clubes
- Campos: Nome do responsável, Nome do clube, CNPJ (com validação)
- Integração com gateways de pagamento
- Permissão: Visualização pública, formulário apenas para usuários logados
- Complexidade: Alta (integração com gateways de pagamento)

### 5. Eventos
- Cadastro de eventos com imagens/textos
- Informações: data, horário, taxa de inscrição (ou gratuito)
- Sistema de inscrição com formulário e pagamento
- Geração de protocolo
- Permissão: Visualização pública, inscrição apenas para usuários logados
- Complexidade: Alta (integração com gateways de pagamento)

### 5.1 Notícias
- Sistema de blog com imagens/textos
- Blocos com imagem, título e subtítulo
- Página detalhada por notícia
- Permissão: Visualização pública

### 6. Rankings
- Tabela dinâmica de pontuação do Rankings Goiano
- Colunas: nome do atleta, cidade, avatar, equipe
- Filtros: modalidade, categoria, gênero
- Permissão: Visualização pública

### 7. Campeões Goianos
- Tabela dinâmica de campeões
- Colunas: nome do atleta, cidade, avatar, equipe
- Filtros: modalidade, categoria, gênero
- Permissão: Visualização pública

### 8. Banner Menor
- 2 blocos com links de redirecionamento
- Permissão: Visualização pública

### 9. Documentos
- Repositório de documentos públicos
- Permissão: Visualização pública, download apenas para usuários logados

### 10. Parceiros
- Blocos de logomarcas com links
- Permissão: Visualização pública

### 11. Footer
- Similar ao header, adaptado para padrões de footer
- Permissão: Visualização pública

## Integrações

### Gateways de Pagamento
O sistema está preparado para integrar com os seguintes gateways:
- PagSeguro
- Mercado Pago
- Asaas
- PagHiper

### Serviços Externos
- API de CEP para auto-preenchimento de endereços

## Dashboard de Administração

### Acesso e Permissões
- Acesso restrito ao Super ADM ou usuários com permissões especiais
- Gerenciamento completo de todos os módulos
- Interface separada do site principal

### Funcionalidades
- Gestão de conteúdo de todos os módulos
- Configurações do sistema
- Gerenciamento de usuários e permissões
- Relatórios e estatísticas

## Padrões e Práticas

### Componentização
- Componentes pequenos e reutilizáveis
- Separação clara de responsabilidades
- Props tipadas com TypeScript
- Uso de composição sobre herança

### Estado e Dados
- Hooks personalizados para lógica reutilizável
- Context API para estado global
- Prisma para persistência
- Cache e otimização de queries

### Estilização
- Tailwind CSS para todo o styling
- Sistema de cores consistente
- Classes utilitárias
- Responsividade mobile-first

### Performance
- Imagens otimizadas com Next/Image
- Code splitting automático
- Prefetch de rotas
- Caching adequado

## Fluxo de Dados

1. **Autenticação**
   ```
   Cliente -> Next.js -> NextAuth -> Database
   ```

2. **Requisições de Dados**
   ```
   Cliente -> Next.js -> API Routes -> Prisma -> PostgreSQL/SQLite
   ```

3. **Upload de Arquivos**
   ```
   Cliente -> Next.js -> Storage Provider -> Local/MinIO
   ```

## Segurança

### Autenticação
- NextAuth.js
- Tokens JWT
- Refresh tokens
- Proteção contra CSRF
- Validação de sessão

### Autorização
- Middleware de proteção
- Sistema de roles e permissões
- Validação em múltiplas camadas
- Prisma middleware para filtros

### Dados
- Validação com Zod
- Sanitização de entrada/saída
- Criptografia em trânsito
- Backup automatizado

## Microsserviços Futuros

A plataforma está preparada para integrar diversos microsserviços:

1. **Sistema de Eventos**
   - Gestão de inscrições
   - Pagamentos
   - Cronometragem
   - Resultados

2. **Gestão de Atletas**
   - Cadastro
   - Licenças
   - Rankings
   - Histórico

3. **Comunicação**
   - Notificações
   - Newsletters
   - Chat interno
   - Avisos

4. **Financeiro**
   - Pagamentos
   - Relatórios
   - Prestação de contas
   - Faturamento

## Considerações de Escalabilidade

- Arquitetura preparada para crescimento
- Separação clara de concerns
- Cache estratégico
- Otimização de performance
- Monitoramento e logs

## Ambiente de Produção

### Infraestrutura
- VPS (Contabo recomendado)
- Docker para containerização
- Nginx para proxy reverso
- MinIO para storage
- PostgreSQL para banco de dados

### Deployment
- Docker Compose
- CI/CD automatizado
- Backup diário
- Monitoramento de recursos
- SSL/TLS com Let's Encrypt
