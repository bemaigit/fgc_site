# FGC - Federação Gaúcha de Ciclismo

Sistema de gerenciamento e portal público da Federação Gaúcha de Ciclismo.

## Stack Tecnológica

- **Frontend**: Next.js 14 com App Router
- **Backend**: API Routes do Next.js
- **Banco de Dados**: PostgreSQL com Prisma ORM
- **Storage**: MinIO (compatível com S3)
- **Cache**: Redis
- **Autenticação**: NextAuth.js
- **Estilização**: TailwindCSS
- **Testes**: Jest + Testing Library
- **CI/CD**: GitHub Actions

## Pré-requisitos

- Node.js 18+
- Docker Desktop
- Git

## Configuração do Ambiente

1. Clone o repositório:
```bash
git clone https://github.com/BetoFoto/fgc-02.git
cd fgc-02
```

2. Instale as dependências:
```bash
npm install
```

3. Configure as variáveis de ambiente:
```bash
cp .env.example .env
```

4. Inicie os serviços Docker:
```bash
docker-compose -f docker-compose.dev.yml up -d
```

5. Configure o banco de dados:
```bash
npx prisma migrate dev
```

6. Inicie o servidor de desenvolvimento:
```bash
npm run dev
```

O sistema estará disponível em http://localhost:3000

## Estrutura do Projeto

```
src/
  ├── app/              # Rotas e páginas
  ├── components/       # Componentes React
  ├── lib/             # Bibliotecas e utilitários
  └── middleware.ts    # Middleware do Next.js
  
docs/                  # Documentação
prisma/               # Schema e migrations
public/               # Arquivos estáticos
```

## Scripts Disponíveis

- `npm run dev`: Desenvolvimento
- `npm run build`: Build de produção
- `npm run start`: Inicia build de produção
- `npm run test`: Roda testes
- `npm run lint`: Verifica linting
- `npm run format`: Formata código

## Documentação

A documentação completa está disponível na pasta `docs/`:

- [Arquitetura](docs/01-arquitetura.md)
- [Autenticação](docs/02-autenticacao.md)
- [Storage](docs/03-storage.md)
- [Dashboard](docs/04-dashboard.md)
- [Permissões](docs/05-permissoes.md)
- [Componentes](docs/06-componentes.md)
- [Testes](docs/07-testes.md)
- [Deploy](docs/08-deploy.md)

## Contribuindo

1. Crie uma branch para sua feature: `git checkout -b feat/nome-da-feature`
2. Faça commit das mudanças: `git commit -m "feat: descrição da feature"`
3. Faça push para a branch: `git push origin feat/nome-da-feature`
4. Abra um Pull Request

## Licença

Este projeto é privado e de propriedade da Federação Gaúcha de Ciclismo.
