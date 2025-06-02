"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, CreditCard, Landmark, QrCode, ArrowRight, CheckCircle } from "lucide-react"
import { formatCurrency } from "@/lib/format-utils"
import { PaymentMethod } from "@/lib/payment/types"
import { Separator } from "@/components/ui/separator"
import { CreditCardForm } from "@/components/payment/CreditCardForm"

interface PaymentIntegrationProps {
  eventId: string
  registrationData: {
    id: string
    modalityIds: string[]
    categoryIds: string[]
    genderIds: string[]
    participantName: string
    participantEmail: string
    participantDocument: string
    amount: number
  }
  onSuccess?: (paymentId: string, protocol: string) => void
  onError?: (error: string) => void
  onCancel?: () => void
  persistData?: boolean
}

export function PaymentIntegration({
  eventId,
  registrationData,
  onSuccess,
  onError,
  onCancel,
  persistData = true
}: PaymentIntegrationProps) {
  const router = useRouter()
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null)
  const [processing, setProcessing] = useState(false)
  const [success, setSuccess] = useState(false)
  const [showCardForm, setShowCardForm] = useState(false)
  
  // Salvar dados no localStorage se persistData for true
  useEffect(() => {
    if (persistData && registrationData) {
      localStorage.setItem(`event_registration_${eventId}`, JSON.stringify(registrationData))
    }
  }, [persistData, registrationData, eventId])
  
  const handleSelectPaymentMethod = (method: PaymentMethod) => {
    setSelectedMethod(method)
    setError(null)
    
    // Se o método for cartão de crédito, mostrar o formulário
    setShowCardForm(method === PaymentMethod.CREDIT_CARD)
  }
  
  // Função para processar pagamentos com cartão de crédito
  const handleProcessPaymentWithCard = async (cardData: {
    number: string;
    holderName: string;
    expiryMonth: string;
    expiryYear: string;
    cvv: string;
    installments: number;
  }) => {
    setProcessing(true)
    setError(null)
    
    try {
      // Preparar dados para o pagamento com cartão
      const paymentData = {
        amount: registrationData.amount,
        description: `Inscrição em evento - ${eventId}`,
        paymentMethod: PaymentMethod.CREDIT_CARD,
        customer: {
          name: registrationData.participantName,
          email: registrationData.participantEmail,
          document: registrationData.participantDocument
        },
        metadata: {
          type: "EVENT",
          entityId: eventId,
          modalityIds: registrationData.modalityIds,
          categoryIds: registrationData.categoryIds,
          genderIds: registrationData.genderIds
        },
        card: {
          number: cardData.number,
          holderName: cardData.holderName,
          expiryMonth: cardData.expiryMonth,
          expiryYear: cardData.expiryYear,
          cvv: cardData.cvv,
          installments: cardData.installments
        }
      }
      
      // Fazer chamada à API de pagamento
      console.log("Enviando dados para a API de pagamento com cartão:", paymentData)
      
      const response = await fetch('/api/payments/card', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Idempotency-Key': `${eventId}-${Date.now()}`
        },
        body: JSON.stringify(paymentData)
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Erro ao processar pagamento com cartão")
      }
      
      const result = await response.json()
      console.log("Resposta da API de pagamento com cartão:", result)
      
      const paymentId = result.id
      const protocol = result.protocolNumber
      
      // Notificar sucesso
      setSuccess(true)
      
      if (onSuccess) {
        onSuccess(paymentId, protocol)
      }
      
      // Redirecionar para a página de sucesso
      setTimeout(() => {
        router.push(`/pagamento/sucesso?type=event&entityId=${eventId}`)
      }, 1000)
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erro ao processar pagamento com cartão"
      setError(errorMessage)
      
      if (onError) {
        onError(errorMessage)
      }
    } finally {
      setProcessing(false)
    }
  }
  
  const handleProcessPayment = async () => {
    if (!selectedMethod) {
      setError("Selecione um método de pagamento")
      return
    }
    
    // Se for pagamento com cartão, exibir o formulário
    if (selectedMethod === PaymentMethod.CREDIT_CARD) {
      setShowCardForm(true)
      return
    }
    
    setProcessing(true)
    setError(null)
    
    try {
      // Preparar dados para o pagamento
      const paymentData = {
        amount: registrationData.amount,
        description: `Inscrição em evento - ${eventId}`,
        paymentMethod: selectedMethod,
        customer: {
          name: registrationData.participantName,
          email: registrationData.participantEmail,
          document: registrationData.participantDocument
        },
        metadata: {
          type: "EVENT",
          entityId: eventId,
          modalityIds: registrationData.modalityIds,
          categoryIds: registrationData.categoryIds,
          genderIds: registrationData.genderIds
        }
      }
      
      // Fazer chamada real à API de pagamento
      console.log("Enviando dados para a API de pagamento:", paymentData)
      
      const response = await fetch('/api/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Idempotency-Key': `${eventId}-${Date.now()}`
        },
        body: JSON.stringify(paymentData)
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Erro ao processar pagamento")
      }
      
      const result = await response.json()
      console.log("Resposta da API de pagamento:", result)
      
      const paymentId = result.id
      const protocol = result.protocolNumber
      
      // Simular sucesso
      setSuccess(true)
      
      // Notificar sucesso se o callback estiver definido
      if (onSuccess) {
        onSuccess(paymentId, protocol)
      }
      
      // Redirecionar com base no método de pagamento
      setTimeout(() => {
        switch (selectedMethod) {
          case PaymentMethod.PIX:
            router.push(`/eventos/${eventId}/pagamento/pix?payment=${paymentId}&protocol=${protocol}`)
            break
          case PaymentMethod.BOLETO:
            router.push(`/eventos/${eventId}/pagamento/boleto?payment=${paymentId}&protocol=${protocol}`)
            break
          case PaymentMethod.CREDIT_CARD:
            router.push(`/eventos/${eventId}/pagamento/cartao?payment=${paymentId}&protocol=${protocol}&amount=${registrationData.amount}`)
            break
          default:
            // Caso não tenha um fluxo específico, vai para a página de sucesso
            router.push(`/pagamento/sucesso?type=event&entityId=${eventId}`)
        }
      }, 1000)
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erro ao processar pagamento"
      setError(errorMessage)
      
      if (onError) {
        onError(errorMessage)
      }
    } finally {
      setProcessing(false)
    }
  }
  
  const handleCancel = () => {
    if (onCancel) {
      onCancel()
    } else {
      router.back()
    }
  }
  
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[300px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Selecione a forma de pagamento</CardTitle>
        <CardDescription>
          Escolha como deseja pagar sua inscrição
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {success ? (
          <div className="flex flex-col items-center py-6">
            <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
            <h3 className="text-xl font-semibold text-green-600">Processando seu pagamento</h3>
            <p className="text-gray-500 mt-2">Redirecionando para a página de pagamento...</p>
            <Loader2 className="h-6 w-6 animate-spin text-primary mt-4" />
          </div>
        ) : (
          <>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Valor total:</span>
                <span className="text-lg font-semibold text-green-600">{formatCurrency(registrationData.amount)}</span>
              </div>
              
              <div className="mt-2 text-xs text-gray-500">
                <p>Modalidades: {registrationData.modalityIds.length}</p>
                <p>Categorias: {registrationData.categoryIds.length}</p>
              </div>
            </div>
            
            <div className="grid gap-3">
              <PaymentMethodOption
                method={PaymentMethod.CREDIT_CARD}
                title="Cartão de Crédito"
                description="Pagamento rápido e seguro"
                icon={<CreditCard className="h-5 w-5" />}
                selected={selectedMethod === PaymentMethod.CREDIT_CARD}
                onClick={() => handleSelectPaymentMethod(PaymentMethod.CREDIT_CARD)}
              />
              
              <PaymentMethodOption
                method={PaymentMethod.PIX}
                title="PIX"
                description="Transferência instantânea"
                icon={<QrCode className="h-5 w-5" />}
                selected={selectedMethod === PaymentMethod.PIX}
                onClick={() => handleSelectPaymentMethod(PaymentMethod.PIX)}
              />
              
              <PaymentMethodOption
                method={PaymentMethod.BOLETO}
                title="Boleto Bancário"
                description="Vencimento em 3 dias úteis"
                icon={<Landmark className="h-5 w-5" />}
                selected={selectedMethod === PaymentMethod.BOLETO}
                onClick={() => handleSelectPaymentMethod(PaymentMethod.BOLETO)}
              />
            </div>
            
            {/* Formulário de cartão de crédito */}
            {showCardForm && selectedMethod === PaymentMethod.CREDIT_CARD && (
              <div className="mt-4 border rounded-lg p-4">
                <h3 className="text-sm font-medium mb-3">Dados do Cartão</h3>
                <CreditCardForm
                  onSubmit={async (cardData) => {
                    console.log("Dados do cartão:", cardData);
                    await handleProcessPaymentWithCard(cardData);
                  }}
                  amount={registrationData.amount}
                  paymentMethod={PaymentMethod.CREDIT_CARD}
                  loading={processing}
                />
              </div>
            )}
            
            {error && (
              <div className="bg-red-50 p-3 rounded-md text-red-600 text-sm">
                {error}
              </div>
            )}
            
            <div className="space-y-3 pt-4">
              {/* Só mostrar o botão de continuar se não for cartão de crédito ou se o formulário de cartão não estiver visível */}
              {(!showCardForm || selectedMethod !== PaymentMethod.CREDIT_CARD) && (
                <Button 
                  onClick={handleProcessPayment} 
                  className="w-full"
                  disabled={!selectedMethod || processing}
                >
                  {processing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processando...
                    </>
                  ) : (
                    <>
                      Continuar
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              )}
              
              <Button variant="outline" onClick={handleCancel} className="w-full">
                Voltar
              </Button>
            </div>
          </>
        )}
        
        <Separator />
        
        <div className="text-xs text-gray-500 text-center">
          <p>Pagamento processado com segurança</p>
          <p>Seus dados estão protegidos por criptografia de ponta a ponta</p>
        </div>
      </CardContent>
    </Card>
  )
}

interface PaymentMethodOptionProps {
  method: PaymentMethod
  title: string
  description: string
  icon: React.ReactNode
  selected: boolean
  onClick: () => void
}

function PaymentMethodOption({ 
  method, 
  title, 
  description, 
  icon, 
  selected, 
  onClick 
}: PaymentMethodOptionProps) {
  return (
    <div 
      className={`
        flex items-center p-4 border rounded-lg cursor-pointer transition-colors
        ${selected ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-gray-300'}
      `}
      onClick={onClick}
    >
      <div className={`
        flex items-center justify-center w-10 h-10 rounded-full mr-4
        ${selected ? 'bg-primary text-white' : 'bg-gray-100 text-gray-500'}
      `}>
        {icon}
      </div>
      
      <div className="flex-1">
        <h3 className="font-medium">{title}</h3>
        <p className="text-sm text-gray-500">{description}</p>
      </div>
      
      <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center">
        {selected && <div className="w-3 h-3 rounded-full bg-primary" />}
      </div>
    </div>
  )
}
