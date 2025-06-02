"use client"

import { useState, useEffect } from "react"
import { Container } from "@/components/ui/container"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Loader2, ArrowLeft, Download, Share2, Receipt, Calendar, Clock, User, CreditCard, Building, Tag } from "lucide-react"
import { useRouter } from "next/navigation"
import { PaymentStatus, PaymentStatusTracker } from "@/components/payment/payment-status-tracker"
import { formatCurrency } from "@/lib/format-utils"
import Link from "next/link"

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
  customer: {
    name: string
    email: string
    document: string
  }
  metadata: {
    type: string
    entityId: string
    entityName: string
    modalityIds?: string[]
    categoryIds?: string[]
    genderIds?: string[]
    [key: string]: any
  }
  paymentDetails?: {
    cardBrand?: string
    cardLastDigits?: string
    installments?: number
    authorizationCode?: string
    pixCode?: string
    pixQrCodeUrl?: string
    boletoCode?: string
    boletoUrl?: string
    dueDate?: string
  }
}

export default function PaymentDetailsPage({ 
  params 
}: { 
  params: { id: string } 
}) {
  const router = useRouter()
  const paymentId = params.id
  
  const [loading, setLoading] = useState(true)
  const [payment, setPayment] = useState<PaymentDetails | null>(null)
  const [error, setError] = useState<string | null>(null)
  
  // Carregar detalhes do pagamento
  useEffect(() => {
    const fetchPaymentDetails = async () => {
      try {
        // Em um ambiente real, faríamos uma chamada para a API
        // Simulando uma chamada com atraso
        await new Promise(resolve => setTimeout(resolve, 1500))
        
        // Simulando dados de pagamento
        // Em um ambiente real, isso viria da API
        const isEvent = Math.random() > 0.3
        const entityType = isEvent ? "event" : "membership"
        const status = getRandomStatus()
        const method = ["PIX", "BOLETO", "CREDIT_CARD"][Math.floor(Math.random() * 3)]
        const date = new Date()
        date.setDate(date.getDate() - Math.floor(Math.random() * 30))
        
        // Detalhes específicos com base no método de pagamento
        const paymentDetails: any = {}
        
        if (method === "CREDIT_CARD") {
          paymentDetails.cardBrand = ["Visa", "Mastercard", "Elo", "American Express"][Math.floor(Math.random() * 4)]
          paymentDetails.cardLastDigits = Math.floor(1000 + Math.random() * 9000).toString().slice(-4)
          paymentDetails.installments = Math.floor(Math.random() * 6) + 1
          paymentDetails.authorizationCode = Math.floor(100000 + Math.random() * 900000).toString()
        } else if (method === "PIX") {
          paymentDetails.pixCode = "00020126580014br.gov.bcb.pix0136a629532e-7693-4846-b028-f24631756b6f5204000053039865802BR5913Federacao FGC6008Sao Paulo62070503***63041234"
          paymentDetails.pixQrCodeUrl = "https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=00020126580014br.gov.bcb.pix0136a629532e-7693-4846-b028-f24631756b6f5204000053039865802BR5913Federacao%20FGC6008Sao%20Paulo62070503***63041234"
        } else if (method === "BOLETO") {
          paymentDetails.boletoCode = "34191.79001 01043.510047 91020.150008 9 87770026000"
          paymentDetails.boletoUrl = "https://example.com/boleto/123456"
          
          const dueDate = new Date()
          dueDate.setDate(dueDate.getDate() + 3)
          paymentDetails.dueDate = dueDate.toISOString()
        }
        
        const mockPayment: PaymentDetails = {
          id: paymentId,
          status,
          method,
          amount: Math.floor(Math.random() * 20000) / 100 + 50, // Valor entre R$ 50 e R$ 250
          description: isEvent ? "Inscrição em evento" : "Anuidade de filiação",
          createdAt: date.toISOString(),
          updatedAt: new Date().toISOString(),
          expiresAt: status === PaymentStatus.PENDING ? new Date(date.getTime() + 86400000 * 3).toISOString() : undefined,
          protocol: `PAY-${Math.floor(10000000 + Math.random() * 90000000)}`,
          customer: {
            name: "João Silva",
            email: "joao.silva@example.com",
            document: "123.456.789-00"
          },
          metadata: {
            type: entityType.toUpperCase(),
            entityId: `${entityType}_${Math.floor(1000 + Math.random() * 9000)}`,
            entityName: isEvent ? `Campeonato ${["Estadual", "Regional", "Nacional"][Math.floor(Math.random() * 3)]} ${new Date().getFullYear()}` : "Filiação Anual",
            modalityIds: isEvent ? ["mod_1", "mod_2"] : undefined,
            categoryIds: isEvent ? ["cat_1"] : undefined,
            genderIds: isEvent ? ["gen_1"] : undefined
          },
          paymentDetails
        }
        
        setPayment(mockPayment)
      } catch (err) {
        setError("Erro ao carregar detalhes do pagamento. Tente novamente.")
        console.error("Erro ao carregar detalhes do pagamento:", err)
      } finally {
        setLoading(false)
      }
    }
    
    fetchPaymentDetails()
  }, [paymentId])
  
  // Função auxiliar para gerar um status aleatório para demonstração
  const getRandomStatus = (): PaymentStatus => {
    const statuses = [
      PaymentStatus.PENDING,
      PaymentStatus.PROCESSING,
      PaymentStatus.CONFIRMED,
      PaymentStatus.FAILED,
      PaymentStatus.EXPIRED
    ]
    
    // Maior probabilidade de pagamentos confirmados
    const weights = [0.2, 0.1, 0.5, 0.1, 0.1]
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
  
  // Função para formatar data e hora
  const formatDateTime = (dateString: string): string => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
  }
  
  // Função para lidar com o download do comprovante
  const handleDownloadReceipt = () => {
    // Em um ambiente real, aqui faríamos uma chamada para a API
    // para gerar e baixar o comprovante
    alert("Funcionalidade de download de comprovante será implementada em breve.")
  }
  
  // Função para lidar com o compartilhamento do comprovante
  const handleShareReceipt = () => {
    // Em um ambiente real, aqui abriríamos um modal para compartilhar
    // ou copiar um link para o comprovante
    alert("Funcionalidade de compartilhamento de comprovante será implementada em breve.")
  }
  
  // Função para voltar à página anterior
  const handleGoBack = () => {
    router.back()
  }
  
  if (loading) {
    return (
      <Container className="py-10">
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
          <p className="text-gray-500">Carregando detalhes do pagamento...</p>
        </div>
      </Container>
    )
  }
  
  if (error || !payment) {
    return (
      <Container className="py-10">
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          <div className="bg-red-50 p-6 rounded-lg text-center max-w-md">
            <h2 className="text-xl font-semibold text-red-700 mb-2">Erro ao carregar pagamento</h2>
            <p className="text-gray-700 mb-6">{error || "Não foi possível encontrar os detalhes do pagamento"}</p>
            <Button onClick={handleGoBack}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>
          </div>
        </div>
      </Container>
    )
  }
  
  return (
    <Container className="py-10">
      <div className="mb-6">
        <Button variant="ghost" onClick={handleGoBack} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar para pagamentos
        </Button>
        
        <h1 className="text-2xl font-bold mb-2">Detalhes do Pagamento</h1>
        <p className="text-gray-500">
          Protocolo: {payment.protocol}
        </p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Status do Pagamento */}
          <PaymentStatusTracker 
            paymentId={payment.id}
            initialStatus={payment.status}
            redirectOnConfirm={false}
          />
          
          {/* Detalhes do Pagamento */}
          <Card>
            <CardHeader>
              <CardTitle>Informações do Pagamento</CardTitle>
              <CardDescription>
                Detalhes da transação
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="flex items-center text-sm text-gray-500">
                    <Receipt className="h-4 w-4 mr-2" />
                    Descrição
                  </div>
                  <p className="font-medium">{payment.description}</p>
                </div>
                
                <div className="space-y-1">
                  <div className="flex items-center text-sm text-gray-500">
                    <CreditCard className="h-4 w-4 mr-2" />
                    Método de Pagamento
                  </div>
                  <p className="font-medium">{formatPaymentMethod(payment.method)}</p>
                </div>
                
                <div className="space-y-1">
                  <div className="flex items-center text-sm text-gray-500">
                    <Calendar className="h-4 w-4 mr-2" />
                    Data
                  </div>
                  <p className="font-medium">{formatDate(payment.createdAt)}</p>
                </div>
                
                <div className="space-y-1">
                  <div className="flex items-center text-sm text-gray-500">
                    <Clock className="h-4 w-4 mr-2" />
                    Hora
                  </div>
                  <p className="font-medium">{formatTime(payment.createdAt)}</p>
                </div>
              </div>
              
              <Separator />
              
              {/* Detalhes específicos com base no método de pagamento */}
              {payment.method === "CREDIT_CARD" && payment.paymentDetails && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-medium mb-3">Detalhes do Cartão</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-gray-500 block">Bandeira</span>
                      <span className="font-medium">{payment.paymentDetails.cardBrand}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block">Final do Cartão</span>
                      <span className="font-medium">**** **** **** {payment.paymentDetails.cardLastDigits}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block">Parcelas</span>
                      <span className="font-medium">{payment.paymentDetails.installments}x de {formatCurrency(payment.amount / (payment.paymentDetails.installments || 1))}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block">Código de Autorização</span>
                      <span className="font-medium">{payment.paymentDetails.authorizationCode}</span>
                    </div>
                  </div>
                </div>
              )}
              
              {payment.method === "PIX" && payment.paymentDetails && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-medium mb-3">Detalhes do PIX</h3>
                  {payment.status === PaymentStatus.PENDING && (
                    <div className="flex flex-col items-center mb-4">
                      {payment.paymentDetails.pixQrCodeUrl && (
                        <img 
                          src={payment.paymentDetails.pixQrCodeUrl} 
                          alt="QR Code PIX" 
                          className="w-40 h-40 mb-3"
                        />
                      )}
                      <div className="text-sm bg-white p-3 rounded border w-full overflow-hidden">
                        <p className="text-gray-500 mb-1">Código PIX (copia e cola)</p>
                        <div className="flex">
                          <p className="text-xs font-mono truncate flex-1">
                            {payment.paymentDetails.pixCode}
                          </p>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-6 px-2"
                            onClick={() => {
                              navigator.clipboard.writeText(payment.paymentDetails.pixCode || "")
                              alert("Código PIX copiado!")
                            }}
                          >
                            Copiar
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {payment.method === "BOLETO" && payment.paymentDetails && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-medium mb-3">Detalhes do Boleto</h3>
                  <div className="grid grid-cols-1 gap-3 text-sm">
                    <div>
                      <span className="text-gray-500 block">Código de Barras</span>
                      <span className="font-mono text-xs">{payment.paymentDetails.boletoCode}</span>
                    </div>
                    {payment.paymentDetails.dueDate && (
                      <div>
                        <span className="text-gray-500 block">Vencimento</span>
                        <span className="font-medium">{formatDate(payment.paymentDetails.dueDate)}</span>
                      </div>
                    )}
                    {payment.status === PaymentStatus.PENDING && payment.paymentDetails.boletoUrl && (
                      <div className="mt-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full"
                          onClick={() => window.open(payment.paymentDetails.boletoUrl, "_blank")}
                        >
                          <Download className="mr-2 h-4 w-4" />
                          Baixar Boleto
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
            
            {payment.status === PaymentStatus.CONFIRMED && (
              <CardFooter className="flex flex-col sm:flex-row gap-3">
                <Button onClick={handleDownloadReceipt} className="w-full sm:w-auto">
                  <Download className="mr-2 h-4 w-4" />
                  Baixar Comprovante
                </Button>
                <Button variant="outline" onClick={handleShareReceipt} className="w-full sm:w-auto">
                  <Share2 className="mr-2 h-4 w-4" />
                  Compartilhar
                </Button>
              </CardFooter>
            )}
          </Card>
          
          {/* Detalhes da Entidade (Evento ou Filiação) */}
          <Card>
            <CardHeader>
              <CardTitle>{payment.metadata.type === "EVENT" ? "Detalhes do Evento" : "Detalhes da Filiação"}</CardTitle>
            </CardHeader>
            
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center">
                  <Building className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <h3 className="font-medium">{payment.metadata.entityName}</h3>
                    <p className="text-sm text-gray-500">ID: {payment.metadata.entityId}</p>
                  </div>
                </div>
                
                {payment.metadata.type === "EVENT" && payment.metadata.modalityIds && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-sm font-medium mb-2">Detalhes da Inscrição</h3>
                    <div className="space-y-2">
                      <div className="flex items-start">
                        <Tag className="h-4 w-4 text-gray-400 mr-2 mt-0.5" />
                        <div>
                          <p className="text-sm text-gray-500">Modalidades</p>
                          <p className="text-sm">{payment.metadata.modalityIds.length} modalidade(s) selecionada(s)</p>
                        </div>
                      </div>
                      
                      {payment.metadata.categoryIds && (
                        <div className="flex items-start">
                          <Tag className="h-4 w-4 text-gray-400 mr-2 mt-0.5" />
                          <div>
                            <p className="text-sm text-gray-500">Categorias</p>
                            <p className="text-sm">{payment.metadata.categoryIds.length} categoria(s) selecionada(s)</p>
                          </div>
                        </div>
                      )}
                      
                      {payment.metadata.genderIds && (
                        <div className="flex items-start">
                          <Tag className="h-4 w-4 text-gray-400 mr-2 mt-0.5" />
                          <div>
                            <p className="text-sm text-gray-500">Gêneros</p>
                            <p className="text-sm">{payment.metadata.genderIds.length} gênero(s) selecionado(s)</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                <div className="mt-4">
                  <Link 
                    href={payment.metadata.type === "EVENT" 
                      ? `/eventos/${payment.metadata.entityId}` 
                      : `/dashboard/filiacao`
                    }
                    className="text-primary hover:underline text-sm flex items-center"
                  >
                    <ArrowRight className="h-4 w-4 mr-1" />
                    {payment.metadata.type === "EVENT" 
                      ? "Ver detalhes do evento" 
                      : "Ver detalhes da filiação"
                    }
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="space-y-6">
          {/* Resumo do Pagamento */}
          <Card>
            <CardHeader>
              <CardTitle>Resumo</CardTitle>
            </CardHeader>
            
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Valor:</span>
                  <span className="text-xl font-semibold">{formatCurrency(payment.amount)}</span>
                </div>
                
                <Separator />
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Subtotal:</span>
                    <span>{formatCurrency(payment.amount)}</span>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Taxas:</span>
                    <span>{formatCurrency(0)}</span>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Descontos:</span>
                    <span>{formatCurrency(0)}</span>
                  </div>
                </div>
                
                <Separator />
                
                <div className="flex justify-between items-center font-medium">
                  <span>Total:</span>
                  <span className="text-green-600">{formatCurrency(payment.amount)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Informações do Cliente */}
          <Card>
            <CardHeader>
              <CardTitle>Informações do Cliente</CardTitle>
            </CardHeader>
            
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start">
                  <User className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <h3 className="font-medium">{payment.customer.name}</h3>
                    <p className="text-sm text-gray-500">{payment.customer.email}</p>
                    <p className="text-sm text-gray-500">{payment.customer.document}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Suporte */}
          <Card>
            <CardHeader>
              <CardTitle>Precisa de ajuda?</CardTitle>
            </CardHeader>
            
            <CardContent>
              <p className="text-sm text-gray-500 mb-4">
                Se você tiver alguma dúvida sobre este pagamento, entre em contato com nosso suporte.
              </p>
              
              <Button variant="outline" className="w-full">
                Contatar Suporte
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </Container>
  )
}
