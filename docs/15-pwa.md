# PWA (Progressive Web App)

O FGC implementa recursos de PWA para melhorar a experiência do usuário, permitindo instalação na tela inicial, funcionamento offline e notificações push.

## Recursos Implementados

### 1. Instalação na Tela Inicial
- Manifesto Web com configurações completas
- Ícones em vários tamanhos
- Telas de splash personalizadas
- Atalhos para funcionalidades principais

### 2. Cache e Funcionamento Offline
- Estratégias de cache otimizadas por tipo de recurso:
  - `CacheFirst`: fontes e áudios
  - `StaleWhileRevalidate`: imagens, JS e CSS
  - `NetworkFirst`: APIs e dados dinâmicos
- Tempo de expiração configurado por tipo de conteúdo
- Limite de entradas no cache para evitar sobrecarga

### 3. Notificações Push
- Suporte a notificações push via Web Push API
- Solicitação de permissão integrada
- Configuração VAPID para segurança

### 4. Atualizações Automáticas
- Detecção de novas versões
- Notificação ao usuário
- Atualização com um clique

## Configuração

### Manifesto Web
O arquivo `public/manifest.json` contém as configurações do PWA:
- Nome e descrição do app
- Cores e tema
- Ícones e screenshots
- Atalhos e categorias

### Service Worker
Configurado via `next-pwa` no `next.config.js`:
- Cache strategies personalizadas
- Exclusões de cache
- Comportamento offline
- Gestão de atualizações

### Componente PWAManager
Localizado em `src/components/PWAManager.tsx`:
- Gerencia registro do Service Worker
- Controla atualizações
- Gerencia estado online/offline
- Implementa notificações push

## Uso em Desenvolvimento

O PWA é automaticamente desativado em ambiente de desenvolvimento para evitar problemas de cache. Para testar:

1. Faça build do projeto:
\`\`\`bash
npm run build
npm start
\`\`\`

2. Acesse via Chrome/Edge
3. Use DevTools > Application para:
   - Verificar registro do Service Worker
   - Inspecionar cache
   - Testar offline
   - Simular instalação

## Customização

### Ícones
Substitua os ícones em `public/icons/` mantendo as dimensões:
- 72x72
- 96x96
- 128x128
- 144x144
- 152x152
- 192x192
- 384x384
- 512x512

### Cores e Tema
Ajuste no `manifest.json`:
- `theme_color`: cor principal
- `background_color`: cor de fundo

### Cache
Modifique `runtimeCaching` em `next.config.js`:
- Padrões de URL
- Estratégias de cache
- Tempos de expiração

## Boas Práticas

1. **Performance**
   - Minimize o tamanho dos assets
   - Use imagens otimizadas
   - Configure cache apropriado

2. **Offline First**
   - Planeje funcionalidade offline
   - Cache dados importantes
   - Sincronize quando online

3. **Atualizações**
   - Versione adequadamente
   - Notifique mudanças importantes
   - Mantenha changelog

4. **Segurança**
   - Use HTTPS sempre
   - Implemente VAPID
   - Valide dados offline

## Troubleshooting

### Cache
Para limpar cache em desenvolvimento:
1. DevTools > Application > Storage
2. Clear Site Data

### Service Worker
Para resetar:
1. DevTools > Application > Service Workers
2. Unregister

### Notificações
- Verifique permissões do navegador
- Confirme VAPID keys
- Teste em produção
