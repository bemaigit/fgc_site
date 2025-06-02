# Componente de Rankings

## Visão Geral
O componente de Rankings é responsável por gerenciar e exibir as classificações dos atletas em diferentes modalidades e categorias. Implementa um sistema similar ao ranking UCI com suporte a múltiplas modalidades.

## Estrutura de Diretórios

```
Rankings/
├── admin/                 # Componentes administrativos
│   ├── RankingManager.tsx # Gerenciamento principal
│   ├── CategoryManager.tsx # Gestão de categorias
│   ├── ModalityManager.tsx # Gestão de modalidades
│   └── CompetitionManager.tsx # Gestão de competições
├── component/            # Componentes de visualização
│   ├── UCIStyleRanking.tsx # Exibição estilo UCI
│   └── RankingTable.tsx    # Tabela genérica de rankings
├── config/              # Configurações e tipos
│   └── types.ts         # Definições de tipos TypeScript
└── database/           # Esquema e funções do banco
    └── schema.sql      # Estrutura do banco de dados
```

## Instalação

1. Certifique-se de ter as dependências instaladas:
```bash
npm install @mui/material @mui/icons-material @mui/lab
```

2. Configure o banco de dados executando o script em `database/schema.sql`

## Uso

### 1. Componente de Ranking Estilo UCI

```tsx
import { UCIStyleRanking } from './component/UCIStyleRanking';

function App() {
  return (
    <UCIStyleRanking
      modalities={modalidades}
      categories={categorias}
      onAthleteClick={handleAthleteClick}
    />
  );
}
```

### 2. Painel Administrativo

```tsx
import { RankingManager } from './admin/RankingManager';

function AdminPanel() {
  return (
    <RankingManager
      onAthleteAdd={handleAthleteAdd}
      onCategoryAdd={handleCategoryAdd}
      onPointsUpdate={handlePointsUpdate}
    />
  );
}
```

## Tipos Principais

```typescript
interface RankingData {
  athlete: {
    id: string;
    name: string;
    country: string;
    team?: string;
  };
  points: number;
  position: number;
  previousPosition?: number;
  medals: {
    gold: number;
    silver: number;
    bronze: number;
  };
}

interface Competition {
  id: string;
  name: string;
  date: string;
  modalityId: string;
  categoryIds: string[];
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'FINISHED' | 'CANCELLED';
  points?: {
    positions: Array<{
      position: number;
      points: number;
    }>;
  };
}
```

## Banco de Dados

O sistema utiliza PostgreSQL com as seguintes tabelas principais:
- `modalities`: Modalidades esportivas
- `categories`: Categorias de competição
- `athletes`: Dados dos atletas
- `competitions`: Competições
- `rankings`: Rankings calculados
- `competition_points`: Pontuação por competição

## Funcionalidades Automáticas

1. **Atualização de Rankings**
   - Recálculo automático após nova pontuação
   - Atualização de posições e estatísticas

2. **Gestão de Medalhas**
   - Contagem automática de medalhas
   - Histórico por temporada

## Customização

### Estilos
O componente utiliza o sistema de temas do Material-UI. Para customizar:

```typescript
import { createTheme, ThemeProvider } from '@mui/material';

const theme = createTheme({
  components: {
    MuiTableCell: {
      styleOverrides: {
        root: {
          padding: '8px 16px',
        },
      },
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <UCIStyleRanking />
    </ThemeProvider>
  );
}
```

### Sistema de Pontuação
Configure o sistema de pontuação no banco de dados:

```sql
UPDATE competitions
SET points_system = '{
  "positions": [
    {"position": 1, "points": 100},
    {"position": 2, "points": 80},
    {"position": 3, "points": 60}
  ],
  "bonusPoints": [
    {"criteria": "fastest_lap", "points": 10}
  ]
}'::jsonb
WHERE id = 'competition_id';
```

## Contribuindo

1. Faça um fork do projeto
2. Crie sua branch de feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## Licença
Este projeto está licenciado sob a Licença MIT - veja o arquivo LICENSE.md para detalhes
