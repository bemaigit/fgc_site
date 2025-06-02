# Guia de Deploy

## Visão Geral

O deploy do FGC é realizado em um servidor VPS (Contabo recomendado) utilizando Docker para containerização e Nginx como proxy reverso. O sistema é dividido em vários containers:

1. **App**: Aplicação Next.js
2. **Database**: PostgreSQL
3. **Storage**: MinIO
4. **Nginx**: Proxy reverso e SSL

## Requisitos

- VPS com no mínimo:
  - 4 vCPUs
  - 8GB RAM
  - 100GB SSD
- Docker e Docker Compose
- Domínio configurado
- Certificado SSL

## Estrutura de Diretórios

```
/opt/fgc/
├── docker/
│   ├── app/
│   │   └── Dockerfile
│   ├── nginx/
│   │   ├── Dockerfile
│   │   └── nginx.conf
│   └── docker-compose.yml
├── data/
│   ├── postgres/
│   ├── minio/
│   └── uploads/
└── .env
```

## Configuração

### Docker Compose

```yaml
# docker-compose.yml
version: '3.8'

services:
  app:
    build:
      context: ./app
      dockerfile: Dockerfile
    restart: always
    environment:
      - DATABASE_URL=postgresql://fgc:${DB_PASSWORD}@db:5432/fgc
      - NEXTAUTH_URL=https://fgc.example.com
      - NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
      - STORAGE_TYPE=minio
      - MINIO_ENDPOINT=storage.fgc.example.com
      - MINIO_ACCESS_KEY=${MINIO_ACCESS_KEY}
      - MINIO_SECRET_KEY=${MINIO_SECRET_KEY}
    depends_on:
      - db
      - minio

  db:
    image: postgres:15-alpine
    restart: always
    environment:
      - POSTGRES_USER=fgc
      - POSTGRES_PASSWORD=${DB_PASSWORD}
      - POSTGRES_DB=fgc
    volumes:
      - ./data/postgres:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  minio:
    image: minio/minio
    restart: always
    command: server /data --console-address ":9001"
    environment:
      - MINIO_ROOT_USER=${MINIO_ACCESS_KEY}
      - MINIO_ROOT_PASSWORD=${MINIO_SECRET_KEY}
    volumes:
      - ./data/minio:/data
    ports:
      - "9000:9000"
      - "9001:9001"

  nginx:
    build:
      context: ./nginx
      dockerfile: Dockerfile
    restart: always
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./data/certbot/conf:/etc/letsencrypt
      - ./data/certbot/www:/var/www/certbot
    depends_on:
      - app
      - minio
```

### Dockerfile App

```dockerfile
# docker/app/Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

# Instala dependências
COPY package*.json ./
RUN npm ci

# Copia código fonte
COPY . .

# Build da aplicação
RUN npm run build

# Imagem de produção
FROM node:18-alpine AS runner

WORKDIR /app

# Copia arquivos necessários
COPY --from=builder /app/next.config.js ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Expõe porta
EXPOSE 3000

# Inicia aplicação
CMD ["node", "server.js"]
```

### Nginx Config

```nginx
# docker/nginx/nginx.conf
events {
    worker_connections 1024;
}

http {
    # Configurações gerais
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;

    # MIME types
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # Logs
    access_log /var/log/nginx/access.log;
    error_log /var/log/nginx/error.log;

    # Gzip
    gzip on;
    gzip_disable "msie6";
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    # Cache
    proxy_cache_path /tmp/nginx_cache levels=1:2 keys_zone=my_cache:10m max_size=10g inactive=60m use_temp_path=off;

    # App
    server {
        listen 443 ssl http2;
        server_name fgc.example.com;

        # SSL
        ssl_certificate /etc/letsencrypt/live/fgc.example.com/fullchain.pem;
        ssl_certificate_key /etc/letsencrypt/live/fgc.example.com/privkey.pem;
        ssl_session_timeout 1d;
        ssl_session_cache shared:SSL:50m;
        ssl_session_tickets off;

        # HSTS
        add_header Strict-Transport-Security "max-age=31536000" always;

        # App
        location / {
            proxy_pass http://app:3000;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
            proxy_cache my_cache;
            proxy_cache_use_stale error timeout http_500 http_502 http_503 http_504;
            proxy_cache_valid 200 60m;
        }

        # Static files
        location /_next/static {
            proxy_pass http://app:3000;
            proxy_cache my_cache;
            proxy_cache_use_stale error timeout http_500 http_502 http_503 http_504;
            proxy_cache_valid 200 60m;
            add_header Cache-Control "public, max-age=31536000, immutable";
        }
    }

    # MinIO
    server {
        listen 443 ssl http2;
        server_name storage.fgc.example.com;

        # SSL (mesmo certificado)
        ssl_certificate /etc/letsencrypt/live/fgc.example.com/fullchain.pem;
        ssl_certificate_key /etc/letsencrypt/live/fgc.example.com/privkey.pem;

        # MinIO API
        location / {
            proxy_pass http://minio:9000;
            proxy_set_header Host $http_host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;

            # Para uploads grandes
            client_max_body_size 100M;
            proxy_connect_timeout 300;
            proxy_send_timeout 300;
            proxy_read_timeout 300;
        }
    }

    # Redirect HTTP to HTTPS
    server {
        listen 80;
        server_name fgc.example.com storage.fgc.example.com;
        return 301 https://$host$request_uri;
    }
}
```

## Scripts de Deploy

### Setup Inicial

```bash
#!/bin/bash
# setup.sh

# Atualiza sistema
apt update && apt upgrade -y

# Instala dependências
apt install -y \
    apt-transport-https \
    ca-certificates \
    curl \
    gnupg \
    lsb-release

# Instala Docker
curl -fsSL https://get.docker.com | sh

# Instala Docker Compose
curl -L "https://github.com/docker/compose/releases/download/v2.20.3/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Cria diretórios
mkdir -p /opt/fgc/{docker,data}
mkdir -p /opt/fgc/data/{postgres,minio,uploads}

# Configura permissões
chown -R 1000:1000 /opt/fgc/data
```

### Deploy

```bash
#!/bin/bash
# deploy.sh

# Variáveis
APP_DIR="/opt/fgc"
COMPOSE_FILE="$APP_DIR/docker/docker-compose.yml"

# Puxa alterações
cd $APP_DIR
git pull origin main

# Constrói e inicia containers
docker-compose -f $COMPOSE_FILE build
docker-compose -f $COMPOSE_FILE up -d

# Executa migrations
docker-compose -f $COMPOSE_FILE exec app npx prisma migrate deploy

# Limpa imagens antigas
docker image prune -f
```

### Backup

```bash
#!/bin/bash
# backup.sh

# Variáveis
BACKUP_DIR="/backups/fgc"
DATE=$(date +%Y%m%d_%H%M%S)

# Cria diretório de backup
mkdir -p $BACKUP_DIR/$DATE

# Backup do banco
docker-compose exec -T db pg_dump -U fgc fgc > $BACKUP_DIR/$DATE/database.sql

# Backup do MinIO
mc mirror minio/fgc-storage $BACKUP_DIR/$DATE/storage/

# Comprime backup
cd $BACKUP_DIR
tar -czf $DATE.tar.gz $DATE
rm -rf $DATE

# Mantém apenas últimos 7 backups
ls -t $BACKUP_DIR/*.tar.gz | tail -n +8 | xargs rm -f
```

## Monitoramento

### Prometheus e Grafana

```yaml
# docker-compose.monitoring.yml
version: '3.8'

services:
  prometheus:
    image: prom/prometheus
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
    ports:
      - "9090:9090"

  grafana:
    image: grafana/grafana
    depends_on:
      - prometheus
    ports:
      - "3000:3000"
    volumes:
      - ./data/grafana:/var/lib/grafana
```

### Alertas

```yaml
# alertmanager.yml
route:
  group_by: ['alertname']
  group_wait: 30s
  group_interval: 5m
  repeat_interval: 1h
  receiver: 'email'

receivers:
- name: 'email'
  email_configs:
  - to: 'admin@example.com'
    from: 'alertmanager@example.com'
    smarthost: 'smtp.example.com:587'
    auth_username: 'alertmanager@example.com'
    auth_password: 'password'
```

## Boas Práticas

1. **Segurança**
   - Firewall configurado
   - Atualizações automáticas
   - Backups regulares
   - Monitoramento ativo

2. **Performance**
   - Cache em múltiplas camadas
   - CDN para arquivos estáticos
   - Otimização de imagens
   - Compressão habilitada

3. **Manutenção**
   - Logs centralizados
   - Monitoramento de recursos
   - Alertas configurados
   - Documentação atualizada

4. **Escalabilidade**
   - Containers stateless
   - Volumes persistentes
   - Load balancing
   - Auto-scaling
