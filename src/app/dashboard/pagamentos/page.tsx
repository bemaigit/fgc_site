"use client"

import { useState, useEffect } from "react"
import { Container } from "@/components/ui/container"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Loader2, Search, Filter, ArrowRight, Calendar, Clock } from "lucide-react"
import { Input } from "@/components/ui/input"
import { formatCurrency } from "@/lib/format-utils"
import { PaymentStatus, PaymentStatusTracker } from "@/components/payment/payment-status-tracker"
import { useRouter } from "next/navigation"

interface Payment {
  id: string
  status: PaymentStatus
  method: string
  amount: number
  description: string
  createdAt: string
  protocol: string
  entityType: string
  entityId: string
  entityName: string
}

export default function PaymentsHistoryPage() {
  const router = useRouter()
  
  const [loading, setLoading] = useState(true)
  const [payments, setPayments] = useState<Payment[]>([])
  const [filteredPayments, setFilteredPayments] = useState<Payment[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedPayment, setSelectedPayment] = useState<string | null>(null)
  
  // Carregar pagamentos do usuário
  useEffect(() => {
    const fetchPayments = async () => {
      try {
        // Em um ambiente real, faríamos uma chamada para a API
        // Simulando uma chamada com atraso
        await new Promise(resolve => setTimeout(resolve, 1500))
        
        // Simulando dados de pagamentos
        const mockPayments: Payment[] = Array.from({ length: 8 }, (_, i) => {
          const isEvent = Math.random() > 0.3
          const entityType = isEvent ? "event" : "membership"
          const status = getRandomStatus()
          const date = new Date()
          date.setDate(date.getDate() - Math.floor(Math.random() * 30))
          
          return {
            id: `pay_${Math.random().toString(36).substring(2, 15)}`,
            status,
            method: ["PIX", "BOLETO", "CREDIT_CARD"][Math.floor(Math.random() * 3)],
            amount: Math.floor(Math.random() * 20000) / 100 + 50, // Valor entre R$ 50 e R$ 250
            description: isEvent ? "Inscrição em evento" : "Anuidade de filiação",
            createdAt: date.toISOString(),
            protocol: `PAY-${Math.floor(10000000 + Math.random() * 90000000)}`,
            entityType,
            entityId: `${entityType}_${Math.floor(1000 + Math.random() * 9000)}`,
            entityName: isEvent ? `Campeonato ${["Estadual", "Regional", "Nacional"][Math.floor(Math.random() * 3)]} ${new Date().getFullYear()}` : "Filiação Anual"
          }
        })
        
        // Ordenar por data (mais recentes primeiro)
        mockPayments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        
        setPayments(mockPayments)
        setFilteredPayments(mockPayments)
      } catch (err) {
        console.error("Erro ao carregar pagamentos:", err)
      } finally {
        setLoading(false)
      }
    }
    
    fetchPayments()
  }, [])
  
  // Filtrar pagamentos com base na busca
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredPayments(payments)
      return
    }
    
    const query = searchQuery.toLowerCase().trim()
    const filtered = payments.filter(payment => 
      payment.description.toLowerCase().includes(query) ||
      payment.protocol.toLowerCase().includes(query) ||
      payment.entityName.toLowerCase().includes(query) ||
      formatPaymentMethod(payment.method).toLowerCase().includes(query)
    )
    
    setFilteredPayments(filtered)
  }, [searchQuery, payments])
  
  // Função auxiliar para gerar um status aleatório para demonstração
  const getRandomStatus = (): PaymentStatus => {
    const statuses = [
      PaymentStatus.PENDING,
      PaymentStatus.CONFIRMED,
      PaymentStatus.FAILED,
      PaymentStatus.EXPIRED,
      PaymentStatus.PROCESSING
    ]
    
    // Maior probabilidade de pagamentos confirmados
    const weights = [0.2, 0.5, 0.1, 0.1, 0.1]
    const random = Math.random()
    let sum = 0
    
    for (let i = 0; i < weights.length; i++) {
      sum += weights[i]
      if (random < sum) return statuses[i]
    }
    
    return PaymentStatus.CONFIRMED
  }
  
  // Função para formatar o método de pagamento
  const formatPaymentMethod = (method: string): string => {
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
  
  // Função para formatar a data
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(date)
  }
  
  // Função para formatar a hora
  const formatTime = (dateString: string): string => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
  }
  
  // Função para renderizar o indicador de status
  const renderStatusIndicator = (status: PaymentStatus) => {
    let bgColor = "bg-gray-200"
    let textColor = "text-gray-700"
    
    switch (status) {
      case PaymentStatus.CONFIRMED:
        bgColor = "bg-green-100"
        textColor = "text-green-700"
        break
      case PaymentStatus.PENDING:
      case PaymentStatus.PROCESSING:
        bgColor = "bg-yellow-100"
        textColor = "text-yellow-700"
        break
      case PaymentStatus.FAILED:
      case PaymentStatus.EXPIRED:
      case PaymentStatus.CANCELED:
        bgColor = "bg-red-100"
        textColor = "text-red-700"
        break
      case PaymentStatus.REFUNDED:
        bgColor = "bg-blue-100"
        textColor = "text-blue-700"
        break
    }
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${bgColor} ${textColor}`}>
        {getStatusLabel(status)}
      </span>
    )
  }
  
  // Função para obter o label do status
  const getStatusLabel = (status: PaymentStatus): string => {
    switch (status) {
      case PaymentStatus.PENDING:
        return "Pendente"
      case PaymentStatus.PROCESSING:
        return "Processando"
      case PaymentStatus.CONFIRMED:
        return "Confirmado"
      case PaymentStatus.FAILED:
        return "Falhou"
      case PaymentStatus.EXPIRED:
        return "Expirado"
      case PaymentStatus.REFUNDED:
        return "Reembolsado"
      case PaymentStatus.CANCELED:
        return "Cancelado"
      default:
        return "Desconhecido"
    }
  }
  
  const handleSelectPayment = (paymentId: string) => {
    setSelectedPayment(paymentId === selectedPayment ? null : paymentId)
  }
  
  const handleViewDetails = (paymentId: string) => {
    router.push(`/dashboard/pagamentos/${paymentId}`)
  }
  
  if (loading) {
    return (
      <Container className="py-10">
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
          <p className="text-gray-500">Carregando histórico de pagamentos...</p>
        </div>
      </Container>
    )
  }
  
  return (
    <Container className="py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Histórico de Pagamentos</h1>
        <p className="text-gray-500">
          Visualize e gerencie todos os seus pagamentos
        </p>
      </div>
      
      <Tabs defaultValue="all" className="mb-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <TabsList>
            <TabsTrigger value="all">Todos</TabsTrigger>
            <TabsTrigger value="pending">Pendentes</TabsTrigger>
            <TabsTrigger value="confirmed">Confirmados</TabsTrigger>
          </TabsList>
          
          <div className="relative w-full sm:w-auto">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar pagamentos..."
              className="pl-10 w-full sm:w-[300px]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        
        <TabsContent value="all" className="mt-0">
          {renderPaymentsList(filteredPayments)}
        </TabsContent>
        
        <TabsContent value="pending" className="mt-0">
          {renderPaymentsList(filteredPayments.filter(p => 
            p.status === PaymentStatus.PENDING || p.status === PaymentStatus.PROCESSING
          ))}
        </TabsContent>
        
        <TabsContent value="confirmed" className="mt-0">
          {renderPaymentsList(filteredPayments.filter(p => 
            p.status === PaymentStatus.CONFIRMED
          ))}
        </TabsContent>
      </Tabs>
      
      {selectedPayment && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Detalhes do Pagamento</h2>
          <PaymentStatusTracker 
            paymentId={selectedPayment}
            redirectOnConfirm={false}
            refreshInterval={0}
          />
        </div>
      )}
    </Container>
  )
  
  function renderPaymentsList(payments: Payment[]) {
    if (payments.length === 0) {
      return (
        <div className="bg-gray-50 rounded-lg p-8 text-center">
          <p className="text-gray-500 mb-4">Nenhum pagamento encontrado</p>
          <Button variant="outline" onClick={() => setSearchQuery("")}>
            Limpar filtros
          </Button>
        </div>
      )
    }
    
    return (
      <div className="space-y-4">
        {payments.map(payment => (
          <Card 
            key={payment.id} 
            className={`overflow-hidden transition-all ${selectedPayment === payment.id ? 'ring-2 ring-primary' : ''}`}
            onClick={() => handleSelectPayment(payment.id)}
          >
            <CardContent className="p-0">
              <div className="p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                  <div>
                    <h3 className="font-medium text-lg">{payment.entityName}</h3>
                    <p className="text-sm text-gray-500">{payment.description}</p>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="font-semibold text-lg">{formatCurrency(payment.amount)}</span>
                    {renderStatusIndicator(payment.status)}
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500 block">Protocolo</span>
                    <span className="font-medium">{payment.protocol}</span>
                  </div>
                  
                  <div>
                    <span className="text-gray-500 block">Método</span>
                    <span className="font-medium">{formatPaymentMethod(payment.method)}</span>
                  </div>
                  
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 text-gray-400 mr-1" />
                    <span className="font-medium">{formatDate(payment.createdAt)}</span>
                  </div>
                  
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 text-gray-400 mr-1" />
                    <span className="font-medium">{formatTime(payment.createdAt)}</span>
                  </div>
                </div>
                
                <div className="mt-4 flex justify-end">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={(e) => {
                      e.stopPropagation()
                      handleViewDetails(payment.id)
                    }}
                  >
                    Ver detalhes
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }
}
