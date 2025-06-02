FROM node:18-slim AS deps
WORKDIR /app

# Instalar dependências do sistema necessárias
RUN apt-get update && apt-get install -y --no-install-recommends \
    openssl libssl-dev \
    && rm -rf /var/lib/apt/lists/*

# Instalar dependências
COPY package.json package-lock.json ./
RUN npm ci

# Configurar Prisma
COPY prisma ./prisma/
RUN npx prisma generate

# Builder: estágio para construir a aplicação
FROM node:18-slim AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Definir variáveis de ambiente para build
ENV NEXT_TELEMETRY_DISABLED=1
ENV SKIP_ENV_VALIDATION=true
ENV NODE_ENV=production
# Desabilitar pré-renderização estática durante o build
ENV NEXT_SKIP_INITIAL_FETCH=true

# Construir a aplicação
RUN npm run build

# Runner: estágio final para executar a aplicação
FROM node:18-slim AS runner
WORKDIR /app

# Instalar dependências para o Prisma
RUN apt-get update && apt-get install -y --no-install-recommends \
    openssl libssl-dev \
    && rm -rf /var/lib/apt/lists/*

# Definir variáveis de ambiente para produção
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Criar usuário não-root para melhor segurança
RUN groupadd --system --gid 1001 nodejs
RUN useradd --system --uid 1001 --gid nodejs nextjs

# Copiar arquivos necessários
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.js ./
COPY --from=builder /app/package.json ./package.json

# Copiar o build e o Prisma Client
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Definir usuário
USER nextjs

# Expor porta
EXPOSE 3000

# Comando para iniciar a aplicação
CMD ["node", "server.js"]
