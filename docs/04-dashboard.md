# Dashboard

## Visão Geral

O Dashboard da Plataforma FGC é uma interface administrativa responsiva e intuitiva, projetada para oferecer uma experiência de usuário consistente em diferentes dispositivos.

## Componentes Principais

### Sidebar (`components/dashboard/Sidebar.tsx`)
- Menu de navegação principal
- Logo da FGC otimizada com Next.js Image
- Links para todas as seções com ícones
- Responsivo com overlay em mobile
- Indicador de seção ativa
- Botão "Visualizar Site" com link externo

### Header (`components/dashboard/Header.tsx`)
- Toggle do menu para mobile
- Perfil do usuário com dropdown
- Notificações
- Responsivo e adaptativo
- Interface limpa e moderna

## Layout

### Desktop
```
+----------------+------------------+
|                |     Header      |
|     Sidebar    +----------------+
|                |                |
|    (fixo)      |    Conteúdo    |
|                |                |
|                |  (scrollável)  |
|                |                |
+----------------+----------------+
```

### Mobile
```
+----------------------------------+
|              Header              |
+----------------------------------+
|                                  |
|            Conteúdo              |
|                                  |
|           (scrollável)           |
|                                  |
+----------------------------------+
|        Sidebar (overlay)         |
+----------------------------------+
```

## Estilização

### Cores
```css
--primary: #08285d;    /* Azul escuro */
--secondary: #7db0de;  /* Azul claro */
--accent: #9fafca;     /* Azul acinzentado */
--text: #ffffff;       /* Texto claro */
```

### Breakpoints
```css
sm: 640px   /* Mobile */
md: 768px   /* Tablet */
lg: 1024px  /* Desktop */
xl: 1280px  /* Large Desktop */
```

## Funcionalidades

### Navegação
- Links ativos com highlight
- Transições suaves
- Feedback visual nos hovers
- Menu móvel com overlay

### Responsividade
- Menu com overlay em mobile
- Layout adaptativo
- Imagens otimizadas com Next.js Image
- Interface touch-friendly
- Espaçamentos responsivos

### Cards
- Estatísticas com ícones
- Atividades recentes
- Layout em grid responsivo
- Hover effects

## Otimizações

### Imagens
```typescript
// Configuração da logo com Next.js Image
<Image
  src="/images/logo-fgc.png"
  alt="FGC Logo"
  fill
  priority // Otimiza LCP
  className="object-contain"
  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 256px"
/>
```

### Performance
- Imagens otimizadas com Next.js Image
- LCP (Largest Contentful Paint) otimizado
- Carregamento apropriado para diferentes dispositivos
- Preload inteligente de recursos

## Estados

### Sidebar
```typescript
interface SidebarProps {
  isOpen: boolean;      // Controla visibilidade em mobile
  onClose: () => void;  // Fecha o menu em mobile
}
```

### Header
```typescript
interface HeaderProps {
  onMenuClick: () => void;  // Abre o menu em mobile
}
```

## Próximas Implementações

1. **Tema**
   - Modo escuro
   - Temas personalizados
   - Preferências salvas

2. **Notificações**
   - Centro de notificações
   - Badges
   - Som e vibração

3. **Widgets**
   - Gráficos
   - Calendário
   - Lista de tarefas

4. **Performance**
   - Skeleton loading
   - Infinite scroll
   - Caching de dados
