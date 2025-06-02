# Checklist do Formulário de Eventos

Este documento serve como um guia de implementação e acompanhamento para o desenvolvimento do formulário de criação e edição de eventos.

## Legenda
- [ ] Tarefa pendente
- [x] Tarefa concluída
- [!] Tarefa com problemas/bloqueios

## 1. Estrutura Geral do Formulário

- [x] Implementar sistema de salvamento parcial por aba
- [x] Adicionar indicadores visuais mais claros de abas preenchidas/validadas
- [x] Implementar navegação não-linear entre abas
- [x] Adicionar botões "Salvar e continuar" e "Salvar e sair" em cada aba
- [x] Criar componente de resumo do evento com status de preenchimento
- [x] Implementar sistema de feedback visual para erros e sucessos
- [x] Adicionar confirmação antes de sair com alterações não salvas

## 2. Persistência de Dados (Zustand)

- [x] Refatorar o store para evitar dependências circulares
- [x] Implementar salvamento automático periódico
- [x] Adicionar sistema de versionamento para recuperação de dados
- [x] Melhorar a integração com localStorage para persistência
- [ ] Implementar sincronização com o servidor para eventos em edição
- [ ] Criar mecanismo de limpeza de dados após criação bem-sucedida
- [ ] Adicionar logs detalhados para facilitar debugging

## 3. Informações Básicas

- [x] Esclarecer a relação entre o campo "status" e o switch "published"
- [x] Implementar componente de status unificado no topo do formulário
- [x] Implementar validação em tempo real com feedback visual
- [x] Adicionar tooltips explicativos para campos complexos
- [x] Melhorar a validação de datas
- [ ] Adicionar campo para URL personalizada do evento
- [ ] Implementar campo para tags/palavras-chave do evento

## 4. Localização

- [x] Implementar visualização de mapa para confirmação visual
- [x] Adicionar autocompletar para endereços
- [x] Melhorar a validação com feedback imediato
- [x] Implementar cache para estados e cidades já carregados
- [x] Adicionar opção para usar localização atual
- [x] Implementar validação de CEP com formatação automática
- [x] Adicionar campo para instruções de acesso ao local

## 5. Upload de Imagens e Regulamentos

- [x] Implementar barra de progresso durante o upload
- [x] Adicionar sistema de retry para uploads interrompidos
- [x] Implementar verificação de integridade após o upload
- [x] Melhorar o feedback em caso de falha
- [ ] Adicionar opção de recorte de imagem
- [x] Implementar validação de tamanho e formato de arquivo
- [ ] Adicionar preview em diferentes formatos (mobile, desktop)
- [ ] Implementar compressão de imagens no cliente antes do upload

## 6. Modalidades, Categorias e Gêneros

- [x] Implementar seleção múltipla de modalidades, categorias e gêneros
- [x] Resolver problemas de loops infinitos em certas condições
- [x] Otimizar a interface para grandes quantidades de opções
- [x] Implementar pesquisa e filtro para facilitar a seleção
- [ ] Adicionar opção para criar novas modalidades/categorias
- [x] Melhorar o feedback visual para seleções múltiplas
- [x] Implementar grupos de modalidades relacionadas
- [ ] Adicionar validação contextual
- [x] Otimizar a busca de categorias para evitar chamadas desnecessárias à API

## 7. Preços e Lotes

- [ ] Implementar validação de datas entre lotes
- [ ] Adicionar visualização do fluxo de inscrição do ponto de vista do usuário
- [ ] Implementar sistema de descontos e cupons
- [ ] Adicionar opção para definir preços diferentes por modalidade/categoria
- [x] Implementar integração com provedores de pagamento
- [x] Adicionar opção para pagamento parcelado
- [ ] Implementar sistema de reembolso e cancelamento
- [ ] Criar visualização de relatório financeiro estimado
- [x] Criar fluxo de checkout para pagamento

## 8. Sistema de Pagamento

- [x] Implementar página de checkout
- [x] Criar API para armazenamento temporário de inscrições
- [x] Implementar múltiplos métodos de pagamento (cartão, PIX, boleto)
- [x] Adicionar suporte a parcelamento no cartão de crédito
- [ ] Implementar geração de comprovantes de pagamento
- [ ] Adicionar sistema de notificações por email após pagamento
- [ ] Implementar dashboard financeiro para organizadores
- [ ] Criar relatórios de inscrições e pagamentos

## 9. Testes e Validação

- [ ] Implementar testes automatizados para cada componente
- [ ] Criar testes de integração para o fluxo completo
- [ ] Adicionar validação de acessibilidade
- [ ] Implementar testes de usabilidade com usuários reais
- [ ] Criar testes de performance para uploads e carregamentos
- [ ] Implementar testes de compatibilidade cross-browser
- [ ] Adicionar testes de responsividade para diferentes dispositivos

## Prioridades de Implementação

### Prioridade Alta (Resolver primeiro)
1. ~~Corrigir loops infinitos e problemas de dependência~~ ✅ Concluído
2. ~~Implementar salvamento parcial por seção~~ ✅ Concluído
3. ~~Melhorar o sistema de upload com barras de progresso~~ ✅ Concluído
4. ~~Esclarecer a relação entre status e publicação~~ ✅ Concluído
5. ~~Melhorar a interface de seleção de modalidades/categorias~~ ✅ Concluído
6. ~~Implementar visualização de mapa para localização~~ ✅ Concluído
7. ~~Implementar salvamento automático periódico~~ ✅ Concluído
8. ~~Implementar cache para estados e cidades~~ ✅ Concluído
9. ~~Adicionar sistema de versionamento para recuperação de dados~~ ✅ Concluído
10. ~~Implementar validação de CEP com formatação automática~~ ✅ Concluído
11. ~~Adicionar campo para instruções de acesso ao local~~ ✅ Concluído

### Prioridade Média
1. Implementar visualização de mapa para localização
2. Adicionar sistema de versionamento para recuperação de dados
3. Adicionar opção de recorte de imagem
4. Implementar salvamento automático periódico

### Prioridade Baixa (Implementar depois)
1. Integração com provedores de pagamento
2. Sistema de descontos e cupons
3. Opção para criar novas modalidades/categorias
4. Relatórios financeiros estimados

## Registro de Progresso

### Data: 12/03/2025
- Análise completa do estado atual do formulário
- Criação do checklist de tarefas
- Implementação da seleção múltipla de modalidades, categorias e gêneros
- Resolução dos problemas de loops infinitos e dependências circulares
- Implementação do sistema de salvamento parcial por seção com:
  - Detecção de alterações não salvas
  - Confirmação antes de sair de uma aba com alterações pendentes
  - Botões de navegação entre abas
  - Feedback visual sobre o status de salvamento
- Melhoria do sistema de upload de arquivos com:
  - Barras de progresso durante o upload
  - Sistema de retry para uploads interrompidos
  - Validação de tamanho e formato de arquivo
  - Feedback visual em caso de falha
  - Notificações toast para sucesso e erro
- Implementação de componente de status unificado:
  - Esclarecimento da relação entre status e visibilidade
  - Interface visual mais clara com indicadores de status
  - Sincronização automática entre status e publicação
  - Tooltips explicativos sobre cada estado
- Melhoria da interface de seleção de modalidades, categorias e gêneros:
  - Implementação de pesquisa e filtros para facilitar a seleção
  - Agrupamento visual de categorias por modalidade
  - Adição de contador de itens selecionados
  - Melhoria do feedback visual para seleções múltiplas
  - Otimização da interface para grandes quantidades de opções
- Implementação de validação em tempo real com feedback visual:
  - Adição de indicadores de validação para cada campo
  - Feedback visual imediato sobre erros de validação
  - Tooltips explicativos sobre requisitos de cada campo
  - Melhor validação de datas relacionadas
  - Descrições de ajuda para campos complexos

Estado atual:

O formulário está dividido em 6 abas: Informações Básicas, Localização, Modalidade, Imagens, Regulamento e Preços
Cada aba tem seu próprio componente editor e validação
A navegação é feita através de um componente TabsList que mostra indicadores visuais de validação
O EventTabEditor é o componente principal que coordena as abas
Problemas identificados:

Não há mecanismo para salvar parcialmente cada seção de forma independente
A navegação entre abas não é otimizada para edições parciais
Não há feedback claro sobre quais abas já foram preenchidas/salvas
2. Persistência de Dados entre Abas
Estado atual:

Utiliza Zustand com middleware persist para armazenar dados entre navegações
O store useNewEventStore gerencia todos os dados do evento
Cada componente editor acessa e atualiza sua parte específica do store
Problemas identificados:

Há problemas de dependências circulares que causam loops infinitos
A sincronização entre o estado do formulário e o Zustand não é consistente
Não há mecanismo de rascunho automático ou recuperação em caso de falhas
3. Status do Evento (Rascunho, Publicado, Cancelado)
Estado atual:

O status é gerenciado na aba de Informações Básicas
Existem três opções: Rascunho, Publicado e Cancelado
Há também um switch separado para "Publicado" que parece redundante
Problemas identificados:

A relação entre o campo "status" e o switch "published" não é clara
Não há regras de transição entre estados ou validações associadas
Não há indicação visual do status atual no cabeçalho do formulário
4. Sistema de Localização
Estado atual:

Implementa seleção em cascata de estado e cidade
Usa hooks useStates e useCities para buscar dados
Inclui campos para endereço detalhado e CEP
Problemas identificados:

Não há visualização de mapa para confirmação visual
Não há autocompletar para endereços
A validação é básica e não oferece feedback imediato
5. Upload de Imagens e Regulamentos (MinIO)
Estado atual:

Usa react-dropzone para upload de arquivos
Faz upload para o endpoint /api/upload com FormData
Implementa preview de imagens e link para visualizar regulamento
Problemas identificados:

Não há barra de progresso durante o upload
Não há sistema de retry para uploads interrompidos
Não há verificação de integridade após o upload
Não há feedback claro em caso de falha
6. Seleção de Modalidades, Categorias e Gêneros
Estado atual:

Implementamos seleção múltipla de modalidades, categorias e gêneros
Busca modalidades da API e categorias com base nas modalidades selecionadas
Usa checkboxes para seleção múltipla
Problemas identificados:

Ainda pode haver problemas de loops infinitos em certas condições
A interface não é otimizada para grandes quantidades de opções
Não há pesquisa ou filtro para facilitar a seleção
7. Preços e Lotes
Estado atual:

Permite configurar lotes com preços, datas e limites de inscrições
Integra com o campo "isFree" da aba de informações básicas
Usa um componente PricingTierList para gerenciar os lotes
Problemas identificados:

Não há integração com provedores de pagamento
A validação de datas entre lotes não é clara
Não há visualização do fluxo de inscrição do ponto de vista do usuário
Recomendações para Implementação
Com base nesta análise, sugiro abordarmos os problemas na seguinte ordem:

1. Corrigir problemas fundamentais:
Resolver definitivamente os loops infinitos em todos os componentes
Melhorar a persistência de dados entre abas
Implementar salvamento parcial por seção
2. Melhorar a experiência de usuário:
Adicionar indicadores claros de progresso e status
Implementar feedback visual imediato para validações
Melhorar o sistema de upload com barras de progresso e retry
3. Implementar funcionalidades avançadas:
Integrar visualização de mapa para localização
Adicionar sistema de preview do evento
Preparar a integração com provedores de pagamento
Próximos Passos Concretos
Refatorar o sistema de persistência:
Revisar todas as dependências do Zustand para evitar loops
Implementar um sistema de salvamento automático por seção
Melhorar o sistema de status:
Criar um componente de controle de status unificado
Implementar regras claras de transição entre estados
Otimizar o upload de arquivos:
Implementar barra de progresso
Adicionar sistema de retry para uploads falhos
Melhorar o feedback visual
