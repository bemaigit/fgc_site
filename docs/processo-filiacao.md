# Processo de Filiação FGC

Este documento descreve o fluxo completo do processo de filiação na Federação Goiana de Ciclismo, desde o cadastro inicial até a confirmação do pagamento.

## Visão Geral do Processo

### 1. Início - Página Inicial
- O usuário encontra a seção "Filie-se" na página inicial
- Ao clicar no botão de filiação, o sistema verifica se o usuário está logado
- Se não estiver logado, exibe um diálogo solicitando login
- Se estiver logado, redireciona para o formulário de filiação

### 2. Formulário de Cadastro (/filiacao/formulario)
O formulário é dividido em etapas para melhor organização:

#### 2.1 Dados Pessoais
- Nome completo
- CPF
- Data de nascimento
- Gênero
- Email
- Telefone

#### 2.2 Endereço
- CEP (com auto-preenchimento)
- Rua
- Número
- Complemento
- Bairro
- Cidade
- Estado

#### 2.3 Dados Esportivos
- Modalidade principal
- Categoria
- Clube (se houver)
- Experiência prévia

#### 2.4 Documentação
- Upload de documento de identidade
- Upload de atestado médico
- Foto para carteirinha

### 3. Revisão e Pagamento (/filiacao/pagamento/[id])
- Exibe resumo dos dados preenchidos
- Mostra o valor da filiação
- Oferece opções de pagamento:
  - Cartão de crédito
  - PIX
  - Boleto bancário
- Integração com múltiplos gateways:
  - PagSeguro
  - Mercado Pago
  - Asaas
  - PagHiper

### 4. Processamento do Pagamento
- Sistema aguarda confirmação do gateway
- Envia notificações sobre o status:
  - Email de confirmação de pedido
  - WhatsApp com instruções (se PIX ou boleto)
  - Email/WhatsApp quando pagamento é confirmado

### 5. Página de Sucesso (/filiacao/sucesso)
- Exibe mensagem de confirmação
- Mostra número de protocolo
- Fornece instruções sobre próximos passos
- Oferece opção para download do comprovante
- Link para acompanhar status da filiação

### 6. Página de Erro (/filiacao/erro)
- Em caso de falha no pagamento
- Exibe mensagem explicativa
- Oferece opções para:
  - Tentar novamente
  - Escolher outro método de pagamento
  - Contatar suporte

## Sistema de Notificações

O sistema envia notificações em momentos chave:
1. Confirmação de cadastro
2. Instruções de pagamento
3. Confirmação de pagamento
4. Aprovação da filiação
5. Lembretes (se pagamento pendente)

## Observações Técnicas

### Responsividade e UX
- Todo o processo é responsivo (funciona em desktop e mobile)
- Dados são salvos a cada etapa
- Usuário pode retomar processo de onde parou

### Integrações
- Sistema de retry automático para pagamentos
- Validações em tempo real dos dados
- Integração com API dos Correios para CEP
- Suporte a múltiplos métodos de pagamento

### Segurança
- Dados sensíveis são criptografados
- Validação de documentos
- Proteção contra fraudes
- Conformidade com LGPD

## Rotas da Aplicação

```
/filiacao
├── /formulario
├── /pagamento
│   └── /[id]
├── /sucesso
└── /erro
```

## Templates de Notificação

### Email
- Confirmação de cadastro
- Instruções de pagamento
- Confirmação de pagamento
- Aprovação da filiação

### WhatsApp
- Confirmação de cadastro
- Instruções de pagamento (PIX/Boleto)
- Confirmação de pagamento
- Lembretes de pagamento pendente
