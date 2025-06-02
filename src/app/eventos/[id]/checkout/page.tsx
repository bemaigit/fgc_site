'use client'

import * as React from "react"
import { useEffect, useState } from "react"
import { useRouter, useSearchParams, useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Loader2, CreditCard, QrCode, Receipt, AlertCircle } from "lucide-react"
import { formatCurrency } from "@/lib/format-utils"
import { PaymentMethod } from "@/lib/payment/types"
import { CreditCardForm } from "@/components/payment/CreditCardForm"

interface PageProps {
  params: {
    id: string
  }
}

interface Address {
  cep: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
}

interface RegistrationDetails {
  id: string
  name: string
  email: string
  modalityId: string
  modalityName: string
  categoryId: string
  categoryName: string
  genderId: string
  genderName: string
  tierId: string
  tierName: string
  price: number
  originalPrice: number
  discountAmount: number
  discountPercentage: number
  couponCode: string
  address: Address | null
  document: string
  phone: string
  protocol: string
  eventId: string
  eventName: string
  status: string
  isFree: boolean
  athleteId?: string
}

export default function CheckoutPage({ params }: PageProps) {
  const router = useRouter()
  const routeParams = useParams()
  const eventId = routeParams.id as string
  const searchParams = useSearchParams()
  const registrationId = searchParams.get('registration')
  
  const [registration, setRegistration] = useState<RegistrationDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>(PaymentMethod.PIX)
  const [installments, setInstallments] = useState<number>(1)
  const [isProcessing, setIsProcessing] = useState(false)
  const [cardData, setCardData] = useState<any>(null)

  // Opções de parcelamento
  const installmentOptions = [1, 2, 3, 6, 12]

  // Buscar detalhes da inscrição
  useEffect(() => {
    async function fetchRegistrationDetails() {
      if (!registrationId) {
        setError('ID de inscrição não fornecido')
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        const response = await fetch(`/api/events/${eventId}/registration/${registrationId}`)
        
        if (!response.ok) {
          throw new Error('Não foi possível carregar os detalhes da inscrição')
        }
        
        const data = await response.json()
        setRegistration(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar detalhes da inscrição')
      } finally {
        setIsLoading(false)
      }
    }

    fetchRegistrationDetails()
  }, [eventId, registrationId])

  // Processar pagamento
  const handlePayment = async () => {
    if (!registration) return

    setIsProcessing(true)

    try {
      // Dados do pagamento
      const paymentData = {
        amount: registration.price,
        description: `Inscrição em ${registration.modalityName} - ${registration.categoryName}`,
        paymentMethod: selectedMethod,
        customer: {
          name: registration.name,
          email: registration.email,
          document: registration.document || '', // CPF do participante
          phone: registration.phone || ''
        },
        metadata: {
          type: 'EVENT',
          entityId: eventId,
          registrationId: registrationId,
          modalityId: registration.modalityId,
          categoryId: registration.categoryId,
          genderId: registration.genderId,
          tierId: registration.tierId,
          athleteId: registration.athleteId
        },
        card: selectedMethod === PaymentMethod.CREDIT_CARD ? cardData : undefined
      }

      // Chamada à API de pagamento
      const response = await fetch(`/api/payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(paymentData)
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || 'Erro ao processar pagamento')
      }

      // Redirecionamento baseado no método de pagamento
      if (selectedMethod === PaymentMethod.PIX) {
        router.push(`/eventos/${eventId}/pagamento/pix?payment=${result.id}&protocol=${result.protocolNumber}`)
      } else if (selectedMethod === PaymentMethod.BOLETO) {
        router.push(`/eventos/${eventId}/pagamento/boleto?payment=${result.id}&protocol=${result.protocolNumber}`)
      } else if (result.paymentUrl) {
        // Redirecionar para gateway de pagamento externo
        window.location.href = result.paymentUrl
      } else {
        // Caso de sucesso direto - incluindo o protocolo na URL
        router.push(`/pagamento/sucesso?type=event&entityId=${eventId}&protocol=${result.protocolNumber}`)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao processar pagamento')
      setIsProcessing(false)
    }
  }

  // Calcular valor da parcela
  const calculateInstallmentValue = (total: number, installments: number) => {
    return total / installments
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error || !registration) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <CardTitle>Erro ao carregar detalhes</CardTitle>
            </div>
            <CardDescription>
              {error || 'Detalhes da inscrição não encontrados'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.back()} className="w-full">
              Voltar
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Finalizar Pagamento</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Resumo da compra */}
          <div className="md:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Resumo da Inscrição</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500">Participante</p>
                  <p className="font-medium">{registration.name}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500">Modalidade</p>
                  <p className="font-medium">{registration.modalityName}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500">Categoria</p>
                  <p className="font-medium">{registration.categoryName}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500">Gênero</p>
                  <p className="font-medium">{registration.genderName}</p>
                </div>
                
                <Separator />
                
                <div className="flex flex-col space-y-3">
                  <div className="text-gray-500">
                    Lote
                  </div>
                  <div>
                    {registration.tierName}
                  </div>
                </div>
                
                <div className="flex flex-col space-y-3">
                  <div className="text-gray-500">
                    Valor Total
                  </div>
                  {registration.discountAmount > 0 ? (
                    <>
                      <div className="text-gray-400 line-through text-sm">
                        {formatCurrency(registration.originalPrice)}
                      </div>
                      <div className="text-xl text-green-600 font-semibold">
                        {formatCurrency(registration.price)}
                      </div>
                      <div className="text-sm text-green-600">
                        Cupom {registration.couponCode} aplicado: {registration.discountPercentage}% de desconto
                      </div>
                    </>
                  ) : (
                    <div className="text-xl font-semibold">
                      {formatCurrency(registration.price)}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Formulário de pagamento */}
          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Forma de Pagamento</CardTitle>
                <CardDescription>
                  Escolha como deseja pagar sua inscrição
                </CardDescription>
              </CardHeader>
              <CardContent>
                <RadioGroup
                  value={selectedMethod}
                  onValueChange={(value) => setSelectedMethod(value as PaymentMethod)}
                  className="space-y-4"
                >
                  <div className="flex items-center space-x-4 p-4 border rounded-lg">
                    <RadioGroupItem value={PaymentMethod.PIX} id="pix" />
                    <Label htmlFor="pix" className="flex-1">
                      <div className="font-medium">PIX</div>
                      <div className="text-sm text-gray-600">Pagamento instantâneo</div>
                    </Label>
                    <QrCode className="h-6 w-6 text-blue-500" />
                  </div>

                  <div className="flex items-center space-x-4 p-4 border rounded-lg">
                    <RadioGroupItem value={PaymentMethod.BOLETO} id="boleto" />
                    <Label htmlFor="boleto" className="flex-1">
                      <div className="font-medium">Boleto Bancário</div>
                      <div className="text-sm text-gray-600">Prazo de 1-3 dias úteis</div>
                    </Label>
                    <Receipt className="h-6 w-6 text-blue-500" />
                  </div>

                  <div className="flex items-center space-x-4 p-4 border rounded-lg">
                    <RadioGroupItem value={PaymentMethod.CREDIT_CARD} id="credit_card" />
                    <Label htmlFor="credit_card" className="flex-1">
                      <div className="font-medium">Cartão de Crédito</div>
                      <div className="text-sm text-gray-600">Pagamento online</div>
                    </Label>
                    <CreditCard className="h-6 w-6 text-blue-500" />
                  </div>
                </RadioGroup>
                
                {selectedMethod === PaymentMethod.CREDIT_CARD && (
                  <div className="mt-4 space-y-4 border rounded-lg p-4">
                    <h3 className="text-sm font-medium mb-3">Dados do Cartão</h3>
                    <CreditCardForm
                      onSubmit={async (data) => {
                        console.log("Dados do cartão:", data);
                        // Armazenar os dados do cartão
                        setCardData(data);
                        // Atualizar o valor de installments com o do formulário
                        setInstallments(data.installments);
                        // Processar o pagamento
                        await handlePayment();
                      }}
                      amount={registration.price}
                      paymentMethod={PaymentMethod.CREDIT_CARD}
                      loading={isProcessing}
                    />
                  </div>
                )}
                
                {selectedMethod !== PaymentMethod.CREDIT_CARD && (
                  <div className="mt-6">
                    <Button 
                      onClick={handlePayment} 
                      className="w-full" 
                      disabled={isProcessing}
                    >
                      {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      {isProcessing ? 'Processando...' : 'Finalizar Pagamento'}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
