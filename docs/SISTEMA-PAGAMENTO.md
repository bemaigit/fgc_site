# Sistema de Pagamento - Documentação

Este documento descreve o fluxo de pagamento implementado para o sistema de inscrição em eventos, integrado com a estrutura de pagamento existente na plataforma.

## Visão Geral

O sistema de pagamento foi projetado para integrar-se perfeitamente ao fluxo de inscrição em eventos existente, permitindo que os participantes selecionem modalidades, categorias e gêneros, preencham seus dados pessoais e finalizem o processo com o pagamento da inscrição.

## Fluxo Completo

1. **Seleção do Evento**: O usuário seleciona um evento na página inicial
2. **Seleção de Modalidade, Categoria e Gênero**: Na página do evento, o usuário seleciona as opções disponíveis
3. **Visualização do Preço**: O componente MiniCheckout exibe o preço atual baseado no lote vigente
4. **Preenchimento de Dados**: O usuário preenche seus dados pessoais no formulário de inscrição
5. **Checkout**: O usuário é direcionado para a página de checkout onde escolhe o método de pagamento
6. **Processamento do Pagamento**: O sistema processa o pagamento com o gateway PagSeguro
7. **Confirmação**: Após o pagamento bem-sucedido, o usuário recebe um protocolo de confirmação

## Componentes Principais

### 1. Página de Inscrição (`/eventos/[id]/inscricao/page.tsx`)

- Coleta os dados pessoais do participante
- Armazena temporariamente os dados antes de prosseguir para o pagamento
- Redireciona para a página de checkout

### 2. Página de Checkout (`/eventos/[id]/checkout/page.tsx`)

- Exibe um resumo da inscrição (modalidade, categoria, gênero, preço)
- Oferece múltiplas opções de pagamento:
  - Cartão de Crédito (com opções de parcelamento)
  - PIX
  - Boleto
- Processa o pagamento e redireciona para a página específica do método de pagamento ou para a página de sucesso

### 3. Páginas Específicas de Pagamento

- **PIX** (`/eventos/[id]/pagamento/pix/page.tsx`): Exibe QR Code e código para pagamento
- **Boleto** (`/eventos/[id]/pagamento/boleto/page.tsx`): Exibe código de barras e opção para download do boleto
- **Cartão de Crédito** (`/eventos/[id]/pagamento/cartao/page.tsx`): Processa pagamento com cartão de crédito

### 4. Páginas de Resultado

- **Sucesso** (`/pagamento/sucesso/page.tsx`): Exibe confirmação de pagamento bem-sucedido
- **Pendente** (`/pagamento/pendente/page.tsx`): Exibe informações sobre pagamento em análise
- **Erro** (`/pagamento/erro/page.tsx`): Exibe mensagem de erro e opções para tentar novamente

## Integração com o Sistema Existente

O sistema de pagamento para eventos foi integrado com a estrutura de pagamento já existente na plataforma, que é utilizada também para outros tipos de transações como filiação de atletas e cadastro de clubes. Essa integração garante:

1. **Consistência de UX**: Mesma experiência de usuário em todos os fluxos de pagamento
2. **Reutilização de Código**: Aproveitamento das estruturas e tipos já definidos
3. **Centralização de Lógica**: Processamento de pagamentos em um único lugar
4. **Facilidade de Manutenção**: Alterações no sistema de pagamento afetam todos os fluxos de forma consistente

## Integração com Gateways de Pagamento

### PagSeguro

O sistema está integrado com o gateway de pagamento PagSeguro para processar transações. A integração inclui:

1. **API de Pagamentos** (`/api/payments/route.ts`): 
   - Cria transações de pagamento
   - Consulta status de transações existentes

2. **API de Gateway** (`/api/payments/gateway/`):
   - **Webhook** (`/webhook/route.ts`): Processa notificações assíncronas do PagSeguro
   - **PIX** (`/pix/route.ts`): Gera QR Codes e chaves PIX
   - **Boleto** (`/boleto/route.ts`): Gera boletos bancários
   - **Cartão de Crédito** (`/credit-card/route.ts`): Processa pagamentos com cartão

3. **Implementação do Gateway**:
   - `PagSeguroGateway` em `src/lib/payment/pagseguro.ts`
   - Suporte a múltiplos métodos de pagamento
   - Processamento de webhooks para atualização de status

4. **Fluxo de Pagamento**:
   - Criação de transação no PagSeguro
   - Redirecionamento para página específica do método de pagamento
   - Processamento da transação
   - Atualização de status via webhook
   - Confirmação da inscrição após pagamento aprovado

### Configuração

A configuração do gateway é armazenada no banco de dados na tabela `PaymentGatewayConfig` e inclui:

- Credenciais de acesso (token, appId, appKey)
- Modo sandbox para testes
- Configurações específicas por método de pagamento

### Tratamento de Status

O sistema processa os seguintes status de pagamento:

- **PAID**: Pagamento aprovado, inscrição confirmada
- **PENDING**: Pagamento pendente (aguardando compensação)
- **PROCESSING**: Pagamento em processamento (em análise)
- **FAILED**: Pagamento recusado
- **EXPIRED**: Pagamento expirado
- **CANCELED**: Pagamento cancelado
- **REFUNDED**: Pagamento estornado

## APIs Implementadas

### 1. API de Registro Temporário (`/api/events/[id]/register/temp/route.ts`)

- **Método**: POST
- **Função**: Armazena temporariamente os dados de inscrição antes do pagamento
- **Retorno**: ID temporário da inscrição

### 2. API de Detalhes da Inscrição (`/api/events/[id]/registration/[registrationId]/route.ts`)

- **Método**: GET
- **Função**: Busca os detalhes de uma inscrição temporária
- **Retorno**: Dados completos da inscrição, incluindo modalidade, categoria, gênero e preço

### 3. API de Pagamento (`/api/payments/route.ts`)

- **Método**: POST
- **Função**: Processa o pagamento para qualquer tipo de transação (eventos, filiações, etc.)
- **Retorno**: Detalhes do pagamento, incluindo protocolo e informações específicas do método escolhido

- **Método**: GET
- **Função**: Busca detalhes de um pagamento por ID ou protocolo
- **Retorno**: Informações completas do pagamento

## Tipos e Interfaces

O sistema utiliza os tipos definidos em `@/lib/payment/types.ts`:

- `PaymentMethod`: Enum com os métodos de pagamento suportados (PIX, BOLETO, CREDIT_CARD)
- `PaymentStatus`: Enum com os possíveis status de pagamento (PENDING, CONFIRMED, FAILED, etc.)
- `CreatePaymentInput`: Interface para os dados necessários para criar um pagamento
- `PaymentResult`: Interface para o resultado do processamento de pagamento

## Métodos de Pagamento

O sistema suporta os seguintes métodos de pagamento:

1. **Cartão de Crédito**
   - Opções de parcelamento: 1x, 2x, 3x, 6x, 12x
   - Validação básica dos dados do cartão
   - Redirecionamento para gateway de pagamento externo quando necessário

2. **PIX**
   - Pagamento instantâneo via QR Code
   - Confirmação automática após pagamento
   - Expiração do código após tempo determinado

3. **Boleto**
   - Vencimento em 3 dias úteis
   - Confirmação após compensação
   - Opção para download do PDF

## Armazenamento de Dados

Na implementação atual, os dados são armazenados temporariamente em memória (usando Maps). Em um ambiente de produção, estes dados seriam armazenados em um banco de dados com as seguintes tabelas:

1. **TempRegistrations**: Armazena inscrições temporárias antes do pagamento
2. **Registrations**: Armazena inscrições confirmadas após o pagamento
3. **Payments**: Armazena detalhes dos pagamentos processados

## Fluxo de Redirecionamento

O sistema implementa um fluxo de redirecionamento inteligente:

1. Após selecionar o método de pagamento na página de checkout:
   - Para PIX: Redireciona para `/eventos/[id]/pagamento/pix`
   - Para Boleto: Redireciona para `/eventos/[id]/pagamento/boleto`
   - Para Cartão: Processa diretamente ou redireciona para gateway externo

2. Após conclusão do pagamento:
   - Sucesso: Redireciona para `/pagamento/sucesso` com parâmetros relevantes
   - Erro: Redireciona para `/pagamento/erro` com detalhes do erro

## Próximos Passos

1. **Integração com Gateway Real**: Substituir a simulação por uma integração real com gateways de pagamento
2. **Sistema de Notificações**: Implementar envio de emails de confirmação
3. **Dashboard Financeiro**: Criar visualização de relatórios financeiros para organizadores
4. **Sistema de Reembolso**: Implementar funcionalidade de cancelamento e reembolso
5. **Descontos e Cupons**: Adicionar suporte a cupons de desconto e promoções

## Considerações de Segurança

- Todos os dados sensíveis de pagamento devem ser criptografados
- Em produção, utilizar HTTPS para todas as comunicações
- Implementar proteção contra fraudes e validação rigorosa dos dados
- Seguir as diretrizes de conformidade PCI DSS para processamento de cartões

## Conclusão

O sistema de pagamento implementado oferece uma solução completa e flexível para o processamento de inscrições em eventos, com múltiplas opções de pagamento e um fluxo intuitivo para os usuários. A arquitetura modular e a integração com o sistema existente permitem fácil expansão e manutenção.
