"use client"

import { useState, useEffect } from "react"
import { useToast } from "@/components/ui/use-toast"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"

interface PaymentMetrics {
  overview: {
    totalTransactions: number
    totalAmount: number
    successRate: number
  }
  byStatus: {
    pending: number
    processing: number
    paid: number
    failed: number
    refunded: number
    cancelled: number
  }
  byGateway: {
    [key: string]: {
      count: number
      amount: number
    }
  }
}

export function PaymentStats() {
  const [metrics, setMetrics] = useState<PaymentMetrics | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const response = await fetch("/api/payments/metrics")
        if (!response.ok) {
          if (response.status === 401) {
            toast({
              title: "Erro de autenticação",
              description: "Sua sessão expirou. Por favor, faça login novamente.",
              variant: "destructive"
            })
            window.location.href = "/login"
            return
          }
          throw new Error("Falha ao carregar métricas")
        }
        
        const data = await response.json()
        setMetrics(data)
      } catch (error) {
        console.error("Erro ao carregar métricas:", error)
        toast({
          title: "Erro",
          description: "Não foi possível carregar as métricas de pagamento",
          variant: "destructive"
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchMetrics()
  }, [toast])

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle><Skeleton className="h-4 w-[200px]" /></CardTitle>
            <div className="text-sm text-muted-foreground">
              <Skeleton className="h-4 w-[150px]" />
            </div>
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle><Skeleton className="h-4 w-[200px]" /></CardTitle>
            <div className="text-sm text-muted-foreground">
              <Skeleton className="h-4 w-[150px]" />
            </div>
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle><Skeleton className="h-4 w-[200px]" /></CardTitle>
            <div className="text-sm text-muted-foreground">
              <Skeleton className="h-4 w-[150px]" />
            </div>
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-full" />
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!metrics) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Sem dados disponíveis</CardTitle>
          <div className="text-sm text-muted-foreground">Nenhuma transação encontrada</div>
        </CardHeader>
      </Card>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {/* Visão Geral */}
      <Card>
        <CardHeader>
          <CardTitle>Visão Geral</CardTitle>
          <div className="text-sm text-muted-foreground">Métricas gerais de pagamentos</div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="text-sm font-medium">Total de Transações</div>
              <div className="text-2xl font-bold">{metrics.overview.totalTransactions}</div>
            </div>
            <div>
              <div className="text-sm font-medium">Valor Total</div>
              <div className="text-2xl font-bold">
                {new Intl.NumberFormat('pt-BR', { 
                  style: 'currency', 
                  currency: 'BRL' 
                }).format(metrics.overview.totalAmount)}
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm font-medium">
                <span>Taxa de Sucesso</span>
                <span>{Math.round(metrics.overview.successRate)}%</span>
              </div>
              <Progress value={metrics.overview.successRate} className="mt-2" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Status */}
      <Card>
        <CardHeader>
          <CardTitle>Status</CardTitle>
          <div className="text-sm text-muted-foreground">Distribuição por status</div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(metrics.byStatus).map(([status, count]) => (
              <div key={status}>
                <div className="flex justify-between text-sm font-medium">
                  <span className="capitalize">{status}</span>
                  <span>{count}</span>
                </div>
                <Progress 
                  value={(count / metrics.overview.totalTransactions) * 100} 
                  className="mt-2" 
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Por Gateway */}
      <Card>
        <CardHeader>
          <CardTitle>Por Gateway</CardTitle>
          <div className="text-sm text-muted-foreground">Distribuição por gateway</div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(metrics.byGateway).map(([gateway, data]) => (
              <div key={gateway}>
                <div className="flex justify-between text-sm font-medium">
                  <span>{gateway}</span>
                  <span>{data.count}</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  {new Intl.NumberFormat('pt-BR', { 
                    style: 'currency', 
                    currency: 'BRL' 
                  }).format(data.amount)}
                </div>
                <Progress 
                  value={(data.count / metrics.overview.totalTransactions) * 100} 
                  className="mt-2" 
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
