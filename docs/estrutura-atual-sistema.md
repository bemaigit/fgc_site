# Estrutura Atual do Sistema FGC

Este documento apresenta um mapeamento completo da estrutura atual do sistema da Federação Goiana de Ciclismo (FGC), incluindo todas as páginas, APIs e hooks personalizados. Esta visão abrangente é essencial para entender a complexidade do sistema e identificar possíveis pontos de atenção durante o processo de build para produção.

## Páginas Principais

### Páginas Públicas
1. **Página Inicial** - `/`
2. **Atletas** - `/atletas/[id]`
3. **Eventos** - `/eventos`, `/eventos/[id]`
4. **Notícias** - `/noticias`, `/noticias/[id]`
5. **Calendário** - `/calendario`
6. **Galeria** - `/galeria`
7. **Rankings** - `/rankings`
8. **Campeões Goianos** - `/champions`
9. **Filiação** - `/filiacao`
   - `/filiacao/formulario`
   - `/filiacao/clube`
   - `/filiacao/pagamento/[id]`
   - `/filiacao/pix/[id]`
   - `/filiacao/boleto/[id]`
   - `/filiacao/sucesso`
   - `/filiacao/erro`
10. **Documentos Legais** - `/legal`

### Autenticação
1. **Login** - `/auth/login`
2. **Registro** - `/auth/register`
3. **Recuperação de Senha** - `/auth/forgot-password`
4. **Redefinição de Senha** - `/auth/reset-password`
5. **Verificação de Email** - `/auth/verify-email`
6. **Erro de Autenticação** - `/auth/error`

### Dashboard Administrativo
1. **Dashboard Principal** - `/dashboard`
2. **Meu Perfil** - `/dashboard/meu-perfil`
3. **Gerenciamento de Eventos** - `/dashboard/eventos`
   - `/dashboard/eventos/novo`
   - `/dashboard/eventos/editar/[id]`
   - `/dashboard/eventos/categorias`
   - `/dashboard/eventos/modalidades`
   - `/dashboard/eventos/configuracoes`
4. **Gerenciamento de Notícias** - `/dashboard/noticias`
5. **Gerenciamento de Campeões** - `/dashboard/champions`
6. **Gerenciamento de Rankings** - `/dashboard/rankings`
7. **Gerenciamento de Atletas** - `/dashboard/atletas`
8. **Gerenciamento de Clubes** - `/dashboard/clubes`
9. **Gerenciamento de Documentos** - `/dashboard/documentos`
10. **Gerenciamento de Galeria** - `/dashboard/galeria`
11. **Gerenciamento de Cabeçalho/Rodapé** - `/dashboard/header`, `/dashboard/footer`
12. **Gerenciamento de Pagamentos** - `/dashboard/payments`
13. **Gerenciamento de Usuários** - `/dashboard/users`
14. **Configurações** - `/dashboard/configuracoes`
15. **Notificações** - `/dashboard/notificacoes`

## APIs

### Autenticação e Usuários
1. `/api/auth/[...nextauth]` - Autenticação NextAuth
2. `/api/auth/register` - Registro de usuários
3. `/api/auth/check` - Verificação de autenticação
4. `/api/auth/password-reset` - Solicitação de redefinição de senha
5. `/api/auth/reset-password` - Redefinição de senha
6. `/api/auth/verify-email` - Verificação de email
7. `/api/auth/verify-token` - Verificação de token
8. `/api/user` - Gerenciamento de usuários
9. `/api/user/image` - Gerenciamento de imagens de usuários

### Atletas e Clubes
1. `/api/athletes` - Gerenciamento de atletas
2. `/api/athletes/me` - Dados do atleta atual
3. `/api/athletes/[id]` - Operações específicas de atletas
4. `/api/athletes/[id]/upload-image` - Upload de imagem de atleta
5. `/api/athlete-profiles` - Perfis de atletas
6. `/api/athlete-gallery` - Galeria de atletas
7. `/api/clubs` - Gerenciamento de clubes
8. `/api/athletes-banner` - Banner de atletas

### Eventos e Inscrições
1. `/api/events` - Gerenciamento de eventos
2. `/api/events/[id]` - Operações específicas de eventos
3. `/api/events/image` - Imagens de eventos
4. `/api/events/categories` - Categorias de eventos
5. `/api/events/categories-by-modality-gender` - Categorias por modalidade e gênero
6. `/api/events/modalities` - Modalidades de eventos
7. `/api/event-categories` - Categorias de eventos
8. `/api/event-modalities` - Modalidades de eventos
9. `/api/registrations` - Inscrições em eventos
10. `/api/registrations/[id]` - Detalhes de inscrição
11. `/api/registrations/details/[protocol]` - Detalhes por protocolo

### Pagamentos
1. `/api/payments` - Gerenciamento de pagamentos
2. `/api/payments/[id]` - Detalhes de pagamento
3. `/api/payments/card` - Pagamentos com cartão
4. `/api/payments/pix` - Pagamentos PIX
5. `/api/payments/gateway` - Configuração de gateways
6. `/api/payments/gateway/[id]` - Gateway específico
7. `/api/payments/transactions` - Transações de pagamento

### Filiação
1. `/api/filiacao/submit` - Submissão de filiação
2. `/api/filiacao/[id]/payment` - Pagamento de filiação
3. `/api/filiacao/[id]/card-payment` - Pagamento com cartão
4. `/api/filiacao/banner` - Banner de filiação
5. `/api/filiation-categories` - Categorias de filiação

### Rankings e Campeões
1. `/api/rankings` - Rankings
2. `/api/rankings/[id]` - Ranking específico
3. `/api/ranking-entries` - Entradas de ranking
4. `/api/ranking-configurations` - Configurações de ranking
5. `/api/champions` - Campeões
6. `/api/championships` - Campeonatos
7. `/api/champion-categories` - Categorias de campeões
8. `/api/champion-modalities` - Modalidades de campeões
9. `/api/champion-setup` - Configuração de campeões

### Conteúdo
1. `/api/news` - Notícias
2. `/api/news/image` - Imagens de notícias
3. `/api/gallery` - Galeria
4. `/api/gallery/image` - Imagens da galeria
5. `/api/calendar` - Calendário
6. `/api/calendar/image` - Imagens do calendário
7. `/api/calendar-event` - Eventos do calendário
8. `/api/documents` - Documentos
9. `/api/modalities` - Modalidades
10. `/api/categories` - Categorias
11. `/api/banner` - Banners
12. `/api/small-banners` - Banners pequenos
13. `/api/indicators` - Indicadores
14. `/api/partners` - Parceiros
15. `/api/sponsors` - Patrocinadores

### Layout e Configuração
1. `/api/header` - Configuração do cabeçalho
2. `/api/footer` - Configuração do rodapé
3. `/api/setup` - Configuração geral
4. `/api/public` - Informações públicas
5. `/api/admin` - Configurações administrativas

### Outros
1. `/api/upload` - Upload de arquivos
2. `/api/storage` - Gerenciamento de armazenamento
3. `/api/proxy` - Proxy para recursos externos
4. `/api/notifications` - Sistema de notificações
5. `/api/webhooks/whatsapp` - Webhook do WhatsApp
6. `/api/whatsapp` - Integração com WhatsApp
7. `/api/health` - Verificação de saúde do sistema

## Hooks Personalizados

### Hooks de Autenticação
1. `useAuth` - Gerenciamento de autenticação

### Hooks de Atletas e Clubes
1. `useAthletes` - Dados de atletas
2. `useAthleteImageUpload` - Upload de imagens de atletas
3. `useAthleteModalitiesAndCategories` - Modalidades e categorias de atletas

### Hooks de Eventos
1. `useEventsList` - Lista de eventos
2. `useEventCategories` - Categorias de eventos
3. `useEventModalities` - Modalidades de eventos
4. `useEventGenders` - Gêneros de eventos
5. `useEventTopResults` - Resultados de eventos

### Hooks de Rankings e Campeões
1. `useRankings` - Rankings
2. `useRankingEntries` - Entradas de ranking
3. `useRankingConfigurations` - Configurações de ranking
4. `useRankingFilters` - Filtros de ranking
5. `useRankingModalitiesAndCategories` - Modalidades e categorias de ranking
6. `useChampionModalitiesAndCategories` - Modalidades e categorias de campeões

### Hooks de Dados
1. `useModalities` - Modalidades
2. `useCategories` - Categorias
3. `useLocalStorage` - Armazenamento local

### Hooks de Localização
1. `useLocation` (pasta com vários hooks relacionados)

### Hooks de UI
1. `useDebounce` - Debounce para inputs
2. `useDebug` - Funcionalidades de debug

### Hooks de Calendário
1. Diversos hooks na pasta `/hooks/calendar`

## Integrações Externas

1. **Gateways de Pagamento**
   - Mercado Pago
   - PagSeguro

2. **Armazenamento**
   - MinIO (compatível com S3)

3. **Notificações**
   - WhatsApp via Evolution API
   - Email

4. **Geolocalização**
   - Serviços de CEP para preenchimento automático de endereços

## Possíveis Pontos de Atenção para Build

1. **NextAuth e Autenticação**
   - Configuração correta do handler no App Router
   - Tratamento de verificação de email
   - Middleware de proteção de rotas

2. **Componentes Cliente vs. Servidor**
   - Uso correto de 'use client' em componentes que utilizam hooks do React
   - Tratamento adequado de useSearchParams e outros hooks específicos do cliente

3. **Prisma Client**
   - Instanciação única do cliente para evitar problemas de múltiplas conexões
   - Tratamento correto de relações entre tabelas

4. **Rotas Dinâmicas**
   - Implementação correta de parâmetros em páginas e APIs
   - Uso correto de React.use() para Next.js 14+

5. **Imagens e Mídia**
   - Padrão de proxy para imagens implementado em várias partes do sistema
   - Necessidade de configurar corretamente next.config.js para domínios externos

6. **Integrações Externas**
   - Configuração adequada de credenciais para diferentes ambientes
   - Tratamento de erros nas integrações de pagamento

Este documento representa a estrutura atual do sistema FGC em 26 de maio de 2025, e deve ser atualizado conforme o sistema evolui.
