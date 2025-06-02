# Ambiente de Desenvolvimento

Este documento descreve a configuração do ambiente de desenvolvimento para o projeto FGC.

## Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto com as seguintes variáveis:

```env
# Database
DATABASE_URL="postgresql://fgc:fgc_password@localhost:5432/fgc_dev"
SHADOW_DATABASE_URL="postgresql://fgc:fgc_password@localhost:5433/fgc_shadow"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="seu-secret-aqui-32-caracteres"

# Storage (MinIO em desenvolvimento)
STORAGE_TYPE="minio" # ou "local"
MINIO_ENDPOINT="http://localhost:9000"
MINIO_ACCESS_KEY="fgc_admin"
MINIO_SECRET_KEY="fgc_password"
MINIO_BUCKET="fgc"
MINIO_REGION="us-east-1"

# Redis (Cache)
REDIS_URL="redis://localhost:6379"

# Email (Desenvolvimento)
SMTP_HOST="localhost"
SMTP_PORT="1025"
SMTP_USER=""
SMTP_PASS=""
EMAIL_FROM="noreply@fgc.org.br"

# Logs
LOG_LEVEL="debug"
```

## Docker para Desenvolvimento

O projeto usa Docker para prover os serviços necessários em desenvolvimento:

1. **PostgreSQL**: Banco de dados principal
   - Porta: 5432
   - Usuário: fgc
   - Senha: fgc_password
   - Banco: fgc_dev

2. **PostgreSQL Shadow**: Banco para migrations do Prisma
   - Porta: 5433
   - Usuário: fgc
   - Senha: fgc_password
   - Banco: fgc_shadow

3. **Redis**: Cache e filas
   - Porta: 6379

4. **MinIO**: Storage compatível com S3
   - Porta API: 9000
   - Porta Console: 9001
   - Usuário: fgc_admin
   - Senha: fgc_password

5. **MailHog**: Servidor SMTP para testes
   - Porta SMTP: 1025
   - Interface Web: 8025

### Iniciando o Ambiente

1. Inicie os containers:
```bash
docker-compose -f docker-compose.dev.yml up -d
```

2. Configure o banco de dados:
```bash
npx prisma migrate dev
npx prisma generate
```

3. Inicie o servidor:
```bash
npm run dev
```

## Scripts Disponíveis

- `npm run dev`: Desenvolvimento
- `npm run build`: Build de produção
- `npm run start`: Inicia build de produção
- `npm run test`: Roda testes
- `npm run test:watch`: Testes em watch mode
- `npm run test:coverage`: Cobertura de testes
- `npm run format`: Formata código
- `npm run lint`: Verifica linting
- `npm run typecheck`: Verifica tipos

## Ferramentas Recomendadas

### VS Code Extensions
- Prisma
- ESLint
- Prettier
- TailwindCSS
- GitLens
- Thunder Client

### Outras Ferramentas
- TablePlus/DBeaver (Banco de dados)
- Postman/Insomnia (API)
- Docker Desktop
- MinIO Console

## Boas Práticas

1. **Banco de Dados**
   - Use migrations para alterações
   - Mantenha índices atualizados
   - Teste queries complexas

2. **Código**
   - Siga padrões ESLint/Prettier
   - Escreva testes
   - Documente alterações

3. **Git**
   - Commits semânticos
   - PRs focados
   - Mantenha branch atualizada

4. **Performance**
   - Use cache quando possível
   - Otimize imagens
   - Monitore queries N+1

## Troubleshooting

### Banco de Dados
```bash
# Resetar banco
npx prisma migrate reset

# Visualizar banco
npx prisma studio
```

### Cache
```bash
# Limpar Redis
docker-compose -f docker-compose.dev.yml exec redis redis-cli FLUSHALL
```

### Storage
- Interface MinIO: http://localhost:9001
- Criar bucket: `fgc`
- Configurar política pública para assets
