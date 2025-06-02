"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Loader2, CheckCircle, XCircle, AlertCircle, RefreshCw, ArrowRight } from "lucide-react"
import { formatCurrency } from "@/lib/format-utils"
import { useRouter } from "next/navigation"

export enum PaymentStatus {
  PENDING = "pending",
  PROCESSING = "processing",
  CONFIRMED = "confirmed",
  FAILED = "failed",
  EXPIRED = "expired",
  REFUNDED = "refunded",
  CANCELED = "canceled"
}

interface PaymentDetails {
  id: string
  status: PaymentStatus
  method: string
  amount: number
  description: string
  createdAt: string
  updatedAt: string
  expiresAt?: string
  protocol: string
  metadata?: {
    type: string
    entityId: string
    modalityIds?: string[]
    categoryIds?: string[]
    genderIds?: string[]
    [key: string]: any
  }
}

interface PaymentStatusTrackerProps {
  paymentId: string
  initialStatus?: PaymentStatus
  onStatusChange?: (status: PaymentStatus) => void
  showActions?: boolean
  redirectOnConfirm?: boolean
  refreshInterval?: number // em milissegundos
}

export function PaymentStatusTracker({
  paymentId,
  initialStatus,
  onStatusChange,
  showActions = true,
  redirectOnConfirm = true,
  refreshInterval = 10000 // 10 segundos por padrão
}: PaymentStatusTrackerProps) {
  const router = useRouter()
  
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [payment, setPayment] = useState<PaymentDetails | null>(null)
  const [error, setError] = useState<string | null>(null)
  
  // Função para buscar o status do pagamento
  const fetchPaymentStatus = async (showRefreshing = true) => {
    if (showRefreshing) {
      setRefreshing(true)
    }
    
    try {
      // Em um ambiente real, faríamos uma chamada para a API
      // Simulando uma chamada com atraso
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Simulando dados de pagamento
      // Em um ambiente real, isso viria da API
      const mockPayment: PaymentDetails = {
        id: paymentId,
        status: initialStatus || getRandomStatus(),
        method: ["PIX", "BOLETO", "CREDIT_CARD"][Math.floor(Math.random() * 3)],
        amount: Math.floor(Math.random() * 20000) / 100 + 50, // Valor entre R$ 50 e R$ 250
        description: "Inscrição em evento",
        createdAt: new Date(Date.now() - 3600000).toISOString(), // 1 hora atrás
        updatedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 86400000).toISOString(), // 24 horas no futuro
        protocol: `PAY-${Math.floor(10000000 + Math.random() * 90000000)}`,
        metadata: {
          type: "EVENT",
          entityId: `event_${Math.floor(1000 + Math.random() * 9000)}`,
          modalityIds: ["mod_1", "mod_2"],
          categoryIds: ["cat_1"],
          genderIds: ["gen_1"]
        }
      }
      
      setPayment(mockPayment)
      
      // Notificar mudança de status se o callback estiver definido
      if (onStatusChange && mockPayment.status) {
        onStatusChange(mockPayment.status)
      }
      
      // Se o pagamento for confirmado e redirectOnConfirm for true, redirecionar
      if (mockPayment.status === PaymentStatus.CONFIRMED && redirectOnConfirm) {
        setTimeout(() => {
          router.push(`/pagamento/sucesso?type=${mockPayment.metadata?.type.toLowerCase()}&entityId=${mockPayment.metadata?.entityId}`)
        }, 2000)
      }
      
    } catch (err) {
      setError("Erro ao buscar status do pagamento. Tente novamente.")
      console.error("Erro ao buscar status do pagamento:", err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }
  
  // Função auxiliar para gerar um status aleatório para demonstração
  const getRandomStatus = (): PaymentStatus => {
    const statuses = [
      PaymentStatus.PENDING,
      PaymentStatus.PROCESSING,
      PaymentStatus.CONFIRMED,
      PaymentStatus.FAILED,
      PaymentStatus.EXPIRED
    ]
    return statuses[Math.floor(Math.random() * statuses.length)]
  }
  
  // Carregar status do pagamento ao montar o componente
  useEffect(() => {
    fetchPaymentStatus(false)
  }, [paymentId])
  
  // Configurar atualização automática do status
  useEffect(() => {
    if (!refreshInterval || refreshInterval <= 0) return
    
    // Não atualizar automaticamente se o pagamento já estiver em um estado final
    if (payment?.status && [
      PaymentStatus.CONFIRMED,
      PaymentStatus.FAILED,
      PaymentStatus.EXPIRED,
      PaymentStatus.REFUNDED,
      PaymentStatus.CANCELED
    ].includes(payment.status)) {
      return
    }
    
    const intervalId = setInterval(() => {
      fetchPaymentStatus(false)
    }, refreshInterval)
    
    return () => clearInterval(intervalId)
  }, [refreshInterval, payment?.status])
  
  // Função para lidar com a atualização manual do status
  const handleRefresh = () => {
    fetchPaymentStatus(true)
  }
  
  // Função para redirecionar para a página de detalhes do pagamento
  const handleViewDetails = () => {
    router.push(`/pagamentos/${paymentId}`)
  }
  
  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-gray-500">Carregando informações do pagamento...</p>
          </div>
        </CardContent>
      </Card>
    )
  }
  
  if (error || !payment) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center py-8">
            <XCircle className="h-10 w-10 text-red-500 mb-4" />
            <h3 className="text-lg font-medium text-red-700 mb-2">Erro ao carregar pagamento</h3>
            <p className="text-gray-500 mb-4">{error || "Não foi possível encontrar os detalhes do pagamento"}</p>
            <Button onClick={handleRefresh} variant="outline">
              <RefreshCw className="mr-2 h-4 w-4" />
              Tentar novamente
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Status do Pagamento</CardTitle>
        <CardDescription>
          Protocolo: {payment.protocol}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div className="flex items-center justify-center py-4">
          {renderStatusIcon(payment.status)}
          <div className="ml-4">
            <h3 className="text-lg font-medium">{getStatusLabel(payment.status)}</h3>
            <p className="text-sm text-gray-500">{getStatusDescription(payment.status)}</p>
          </div>
        </div>
        
        <Separator />
        
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-500">Método:</span>
            <span className="font-medium">{formatPaymentMethod(payment.method)}</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-gray-500">Valor:</span>
            <span className="font-medium">{formatCurrency(payment.amount)}</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-gray-500">Data:</span>
            <span className="font-medium">{formatDate(payment.createdAt)}</span>
          </div>
          
          {payment.expiresAt && payment.status === PaymentStatus.PENDING && (
            <div className="flex justify-between">
              <span className="text-gray-500">Expira em:</span>
              <span className="font-medium">{formatDate(payment.expiresAt)}</span>
            </div>
          )}
        </div>
        
        {payment.status === PaymentStatus.PENDING && (
          <div className="bg-yellow-50 p-4 rounded-md">
            <p className="text-sm text-yellow-700">
              Seu pagamento está pendente. Após a confirmação, você receberá uma notificação.
            </p>
          </div>
        )}
        
        {payment.status === PaymentStatus.CONFIRMED && (
          <div className="bg-green-50 p-4 rounded-md">
            <p className="text-sm text-green-700">
              Seu pagamento foi confirmado! Obrigado pela sua inscrição.
              {redirectOnConfirm && (
                <span className="block mt-2">
                  Redirecionando para a página de confirmação...
                </span>
              )}
            </p>
          </div>
        )}
        
        {payment.status === PaymentStatus.FAILED && (
          <div className="bg-red-50 p-4 rounded-md">
            <p className="text-sm text-red-700">
              Houve um problema com seu pagamento. Por favor, tente novamente ou entre em contato com o suporte.
            </p>
          </div>
        )}
      </CardContent>
      
      {showActions && (
        <CardFooter className="flex flex-col sm:flex-row gap-3">
          <Button 
            onClick={handleRefresh} 
            variant="outline" 
            className="w-full sm:w-auto"
            disabled={refreshing}
          >
            {refreshing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Atualizando...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Atualizar Status
              </>
            )}
          </Button>
          
          <Button 
            onClick={handleViewDetails} 
            variant="ghost" 
            className="w-full sm:w-auto"
          >
            Ver Detalhes
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </CardFooter>
      )}
    </Card>
  )
}

// Funções auxiliares para formatação e exibição

function renderStatusIcon(status: PaymentStatus) {
  switch (status) {
    case PaymentStatus.CONFIRMED:
      return <CheckCircle className="h-10 w-10 text-green-500" />
    case PaymentStatus.PENDING:
    case PaymentStatus.PROCESSING:
      return <Loader2 className="h-10 w-10 text-yellow-500 animate-spin" />
    case PaymentStatus.FAILED:
    case PaymentStatus.EXPIRED:
    case PaymentStatus.CANCELED:
      return <XCircle className="h-10 w-10 text-red-500" />
    case PaymentStatus.REFUNDED:
      return <AlertCircle className="h-10 w-10 text-blue-500" />
    default:
      return <AlertCircle className="h-10 w-10 text-gray-500" />
  }
}

function getStatusLabel(status: PaymentStatus): string {
  switch (status) {
    case PaymentStatus.PENDING:
      return "Pagamento Pendente"
    case PaymentStatus.PROCESSING:
      return "Processando Pagamento"
    case PaymentStatus.CONFIRMED:
      return "Pagamento Confirmado"
    case PaymentStatus.FAILED:
      return "Pagamento Falhou"
    case PaymentStatus.EXPIRED:
      return "Pagamento Expirado"
    case PaymentStatus.REFUNDED:
      return "Pagamento Reembolsado"
    case PaymentStatus.CANCELED:
      return "Pagamento Cancelado"
    default:
      return "Status Desconhecido"
  }
}

function getStatusDescription(status: PaymentStatus): string {
  switch (status) {
    case PaymentStatus.PENDING:
      return "Aguardando confirmação do pagamento"
    case PaymentStatus.PROCESSING:
      return "Seu pagamento está sendo processado"
    case PaymentStatus.CONFIRMED:
      return "Pagamento recebido com sucesso"
    case PaymentStatus.FAILED:
      return "Houve um problema ao processar seu pagamento"
    case PaymentStatus.EXPIRED:
      return "O prazo para pagamento expirou"
    case PaymentStatus.REFUNDED:
      return "O valor foi devolvido para sua conta"
    case PaymentStatus.CANCELED:
      return "O pagamento foi cancelado"
    default:
      return "Não foi possível determinar o status do pagamento"
  }
}

function formatPaymentMethod(method: string): string {
  switch (method.toUpperCase()) {
    case "PIX":
      return "PIX"
    case "BOLETO":
      return "Boleto Bancário"
    case "CREDIT_CARD":
      return "Cartão de Crédito"
    default:
      return method
  }
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}
