# Logs e Monitoramento

## Visão Geral

O sistema de logs e monitoramento do FGC é estruturado em:

1. **Logs**
   - Aplicação
   - Acesso
   - Erros
   - Auditoria

2. **Métricas**
   - Performance
   - Uso
   - Erros
   - Cache

3. **Alertas**
   - Erros críticos
   - Performance
   - Segurança
   - Disponibilidade

4. **Dashboards**
   - Tempo real
   - Histórico
   - Análise
   - Reports

## Implementação

### Sistema de Logs

```typescript
// lib/logger.ts
import pino from 'pino'
import { logflarePinoVercel } from 'pino-logflare'

const { stream, send } = logflarePinoVercel({
  apiKey: process.env.LOGFLARE_API_KEY!,
  sourceToken: process.env.LOGFLARE_SOURCE_TOKEN!
})

export const logger = pino({
  browser: {
    transmit: {
      send: send
    }
  },
  level: process.env.LOG_LEVEL || 'info',
  base: {
    env: process.env.NODE_ENV,
    revision: process.env.VERCEL_GIT_COMMIT_SHA
  }
}, stream)

// Middleware de logs
export async function withLogs(
  handler: (req: Request) => Promise<Response>
) {
  return async function(req: Request) {
    const start = Date.now()
    const id = crypto.randomUUID()
    
    try {
      logger.info({
        id,
        method: req.method,
        url: req.url,
        headers: Object.fromEntries(req.headers)
      }, 'request_start')
      
      const response = await handler(req)
      
      logger.info({
        id,
        status: response.status,
        duration: Date.now() - start
      }, 'request_end')
      
      return response
    } catch (error) {
      logger.error({
        id,
        error: {
          message: error.message,
          stack: error.stack
        },
        duration: Date.now() - start
      }, 'request_error')
      
      throw error
    }
  }
}
```

### Métricas

```typescript
// lib/metrics.ts
import { Metrics } from '@opentelemetry/api'
import { PrometheusExporter } from '@opentelemetry/exporter-prometheus'
import { MeterProvider } from '@opentelemetry/sdk-metrics'

const exporter = new PrometheusExporter({
  port: 9464,
  endpoint: '/metrics'
})

const meterProvider = new MeterProvider()
meterProvider.addMetricReader(exporter)

export const metrics = meterProvider.getMeter('fgc')

// Métricas comuns
export const requestCounter = metrics.createCounter('http_requests_total', {
  description: 'Total de requisições HTTP'
})

export const requestDuration = metrics.createHistogram('http_request_duration_ms', {
  description: 'Duração das requisições HTTP em ms'
})

export const activeUsers = metrics.createUpDownCounter('active_users', {
  description: 'Usuários ativos no momento'
})

// Middleware de métricas
export async function withMetrics(
  handler: (req: Request) => Promise<Response>
) {
  return async function(req: Request) {
    const start = Date.now()
    const labels = {
      method: req.method,
      path: new URL(req.url).pathname
    }
    
    requestCounter.add(1, labels)
    
    try {
      const response = await handler(req)
      
      requestDuration.record(Date.now() - start, {
        ...labels,
        status: response.status
      })
      
      return response
    } catch (error) {
      requestDuration.record(Date.now() - start, {
        ...labels,
        status: 500
      })
      
      throw error
    }
  }
}
```

### Alertas

```typescript
// lib/alerts.ts
import { Slack } from '@slack/webhook'
import { redis } from '@/lib/redis'
import { logger } from '@/lib/logger'

const slack = new Slack({
  url: process.env.SLACK_WEBHOOK_URL!
})

interface Alert {
  id: string
  level: 'info' | 'warning' | 'error'
  title: string
  message: string
  metadata?: Record<string, any>
}

export async function sendAlert(alert: Alert) {
  try {
    // Previne alertas duplicados
    const key = `alert:${alert.id}`
    const exists = await redis.get(key)
    if (exists) return
    
    // Registra alerta
    await redis.set(key, '1', 'EX', 3600) // 1 hora
    
    // Log
    logger.warn(alert, 'alert_triggered')
    
    // Envia para Slack
    await slack.send({
      text: `[${alert.level.toUpperCase()}] ${alert.title}`,
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: alert.message
          }
        },
        {
          type: 'context',
          elements: [
            {
              type: 'mrkdwn',
              text: `*ID:* ${alert.id}\n*Env:* ${process.env.NODE_ENV}`
            }
          ]
        }
      ]
    })
  } catch (error) {
    logger.error({
      error,
      alert
    }, 'alert_error')
  }
}

// Alertas comuns
export async function errorRateAlert(
  errorRate: number,
  threshold: number = 0.05
) {
  if (errorRate > threshold) {
    await sendAlert({
      id: `error_rate_${Date.now()}`,
      level: 'error',
      title: 'Taxa de Erros Alta',
      message: `A taxa de erros está em ${(errorRate * 100).toFixed(2)}%`,
      metadata: { errorRate, threshold }
    })
  }
}

export async function performanceAlert(
  duration: number,
  threshold: number = 1000
) {
  if (duration > threshold) {
    await sendAlert({
      id: `performance_${Date.now()}`,
      level: 'warning',
      title: 'Performance Degradada',
      message: `Tempo de resposta médio: ${duration.toFixed(2)}ms`,
      metadata: { duration, threshold }
    })
  }
}
```

### Monitoramento em Tempo Real

```typescript
// app/api/metrics/route.ts
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { redis } from '@/lib/redis'
import { metrics } from '@/lib/metrics'

export async function GET() {
  const session = await getServerSession()
  if (!session?.user?.role === 'ADMIN') {
    return new Response('Não autorizado', { status: 401 })
  }
  
  // Métricas em tempo real
  const [
    activeUsers,
    errorRate,
    avgDuration,
    cacheHitRate
  ] = await Promise.all([
    redis.get('active_users'),
    calculateErrorRate(),
    calculateAvgDuration(),
    calculateCacheHitRate()
  ])
  
  return NextResponse.json({
    activeUsers: parseInt(activeUsers || '0'),
    errorRate,
    avgDuration,
    cacheHitRate,
    timestamp: new Date().toISOString()
  })
}

async function calculateErrorRate(): Promise<number> {
  const [errors, total] = await Promise.all([
    redis.get('error_count'),
    redis.get('request_count')
  ])
  
  return parseInt(errors || '0') / parseInt(total || '1')
}

async function calculateAvgDuration(): Promise<number> {
  const durations = await redis.lrange('request_durations', 0, -1)
  if (!durations.length) return 0
  
  const sum = durations.reduce((acc, dur) => acc + parseInt(dur), 0)
  return sum / durations.length
}

async function calculateCacheHitRate(): Promise<number> {
  const [hits, misses] = await Promise.all([
    redis.get('cache_hits'),
    redis.get('cache_misses')
  ])
  
  const total = parseInt(hits || '0') + parseInt(misses || '0')
  return total ? parseInt(hits || '0') / total : 0
}
```

### Dashboard

```typescript
// app/admin/metrics/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { Line, Bar } from 'react-chartjs-2'
import { useQuery } from '@tanstack/react-query'

export default function MetricsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['metrics'],
    queryFn: async () => {
      const res = await fetch('/api/metrics')
      return res.json()
    },
    refetchInterval: 5000 // 5 segundos
  })
  
  if (isLoading) return <div>Carregando...</div>
  
  return (
    <div className="grid grid-cols-2 gap-4">
      <Card title="Usuários Ativos">
        <div className="text-4xl font-bold">
          {data.activeUsers}
        </div>
      </Card>
      
      <Card title="Taxa de Erros">
        <div className="text-4xl font-bold text-red-600">
          {(data.errorRate * 100).toFixed(2)}%
        </div>
      </Card>
      
      <Card title="Tempo Médio de Resposta">
        <div className="text-4xl font-bold">
          {data.avgDuration.toFixed(2)}ms
        </div>
      </Card>
      
      <Card title="Cache Hit Rate">
        <div className="text-4xl font-bold text-green-600">
          {(data.cacheHitRate * 100).toFixed(2)}%
        </div>
      </Card>
      
      <div className="col-span-2">
        <Line
          data={chartData}
          options={chartOptions}
        />
      </div>
    </div>
  )
}

function Card({
  title,
  children
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="p-4 rounded-lg bg-white shadow-md">
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      {children}
    </div>
  )
}
```

## Boas Práticas

### 1. Logs

- Níveis apropriados
- Contexto suficiente
- Rotação de logs
- Sanitização de dados
- Retenção definida

### 2. Métricas

- Granularidade adequada
- Labels úteis
- Agregações corretas
- Storage otimizado
- Alertas relevantes

### 3. Alertas

- Thresholds apropriados
- Prevenção de ruído
- Escalação clara
- Documentação
- Playbooks

### 4. Dashboards

- Visualização clara
- Métricas úteis
- Performance
- Exportação
- Compartilhamento

## Checklist de Monitoramento

1. **Logs**
   - [ ] Estrutura definida
   - [ ] Níveis configurados
   - [ ] Rotação ativa
   - [ ] Busca funcional

2. **Métricas**
   - [ ] Coletores ativos
   - [ ] Storage configurado
   - [ ] Agregações definidas
   - [ ] Dashboards criados

3. **Alertas**
   - [ ] Regras definidas
   - [ ] Canais configurados
   - [ ] Escalação clara
   - [ ] Testes realizados

4. **Dashboards**
   - [ ] Métricas principais
   - [ ] Visualizações claras
   - [ ] Acessos configurados
   - [ ] Exports funcionais
