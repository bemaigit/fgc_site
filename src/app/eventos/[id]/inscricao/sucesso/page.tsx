'use client'

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle2, Download, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useSearchParams, useParams } from "next/navigation"
import { useEffect, useState } from "react"
import { formatCurrency } from "@/lib/format-utils"

interface RegistrationDetails {
  // Dados básicos da inscrição
  protocol: string
  status: string
  name: string
  email: string
  cpf: string | null
  phone: string | null
  
  // Dados específicos da categoria, modalidade e gênero
  modalityName: string | null
  categoryName: string | null
  genderName: string | null
  tierName: string | null
  
  // Dados de pagamento
  paidAmount: number
  isFree: boolean
  paymentMethod: string | null
  paymentDate: string | null
  
  // Dados do evento
  eventId: string
  eventTitle: string | null
  eventStartDate: string | null
  eventEndDate: string | null
  
  // Dados de endereço
  address?: {
    cep?: string
    street?: string
    number?: string
    complement?: string
    neighborhood?: string
    city?: string
    state?: string
  } | null
  
  // Campo legado - mantido para compatibilidade
  price?: number
}

export default function RegistrationSuccessPage() {
  const searchParams = useSearchParams()
  const protocol = searchParams.get('protocol')
  const params = useParams()
  const [registrationDetails, setRegistrationDetails] = useState<RegistrationDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchRegistrationDetails() {
      if (!protocol) {
        setError('Protocolo não fornecido')
        setIsLoading(false)
        return
      }

      try {
        console.log('Buscando detalhes da inscrição com protocolo:', protocol)
        
        const response = await fetch(`/api/registrations/details/${protocol}`)
        console.log('Status da resposta:', response.status)
        
        if (response.ok) {
          try {
            // Ler a resposta como texto primeiro
            const responseText = await response.text()
            
            // Tentar limpar possíveis caracteres inválidos antes de fazer o parse
            const cleanedText = responseText.trim().replace(/[\u0000-\u001F\u007F-\u009F]/g, '')
            
            console.log('Texto da resposta (primeiros 100 caracteres):', cleanedText.substring(0, 100))
            
            // Fazer o parse do JSON limpo
            const data = JSON.parse(cleanedText)
            console.log('Dados recebidos da API:', data)
            setRegistrationDetails(data)
          } catch (parseError) {
            console.error('Erro ao processar resposta JSON:', parseError)
            setError('Erro ao processar dados da inscrição. Por favor, tente novamente.')
            
            // Aguardar um momento e tentar novamente automaticamente
            setTimeout(() => {
              window.location.reload()
            }, 2000)
          }
        } else {
          // Verificar se a resposta tem mensagem de erro
          const errorData = await response.json().catch(() => null)
          console.log(`API retornou status ${response.status}:`, errorData)
          
          // Buscar dados básicos do evento usando o ID da URL
          const eventId = params.id as string
          if (eventId) {
            console.log('Tentando buscar dados básicos do evento:', eventId)
            try {
              const eventResponse = await fetch(`/api/events/${eventId}`)
              
              if (eventResponse.ok) {
                const eventData = await eventResponse.json()
                console.log('Dados básicos do evento obtidos:', eventData)
                
                // Criar um objeto com o protocolo e dados básicos do evento sem valores padrão
                // Apenas dados reais vindos do banco devem ser exibidos
                setRegistrationDetails({
                  protocol: protocol,
                  eventId: eventId,
                  eventTitle: eventData.title || null,
                  eventStartDate: eventData.startDate || null,
                  eventEndDate: eventData.endDate || null,
                  status: 'PENDING',
                  modalityName: '',
                  categoryName: '',
                  genderName: '',
                  tierName: '',
                  name: '',
                  email: '',
                  cpf: null,
                  phone: null,
                  paidAmount: 0,
                  isFree: false,
                  paymentMethod: null,
                  paymentDate: null,
                  address: null
                })
                
                // Mesmo tendo dados básicos, mostrar erro sobre os detalhes da inscrição
                setError(`Não foi possível obter os detalhes completos da inscrição ${protocol}`)
              } else {
                throw new Error(`Erro ao obter dados do evento: ${eventResponse.status}`)
              }
            } catch (eventError) {
              console.error('Erro ao buscar dados do evento:', eventError)
              setError('Não foi possível obter detalhes da inscrição ou do evento')
              
              // Mostrar apenas o protocolo
              setRegistrationDetails({
                protocol: protocol,
                eventId: eventId,
                eventTitle: null,
                eventStartDate: null,
                eventEndDate: null,
                status: 'PENDING',
                modalityName: null,
                categoryName: null,
                genderName: null,
                tierName: null,
                name: '',
                email: '',
                cpf: null,
                phone: null,
                paidAmount: 0,
                isFree: false,
                paymentMethod: null,
                paymentDate: null,
                address: null
              })
            }
          } else {
            setError('ID do evento não disponível')
          }
        }
      } catch (err) {
        console.error('Erro ao buscar detalhes da inscrição:', err)
        setError('Erro ao buscar detalhes da inscrição')
        
        // Mesmo com erro, mostrar o protocolo
        setRegistrationDetails({
          protocol: protocol,
          eventId: params.id as string,
          eventTitle: null,
          eventStartDate: null,
          eventEndDate: null,
          status: 'ERROR',
          modalityName: null,
          categoryName: null,
          genderName: null,
          tierName: null,
          name: '',
          email: '',
          cpf: null,
          phone: null,
          paidAmount: 0,
          isFree: false,
          paymentMethod: null,
          paymentDate: null,
          address: null
        })
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchRegistrationDetails()
  }, [protocol, params.id])

  // Função para traduzir o método de pagamento
  const getPaymentMethodName = (method: string) => {
    const methods: Record<string, string> = {
      'credit_card': 'Cartão de Crédito',
      'pix': 'PIX',
      'boleto': 'Boleto Bancário'
    }
    
    return methods[method] || method
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <CheckCircle2 className="h-16 w-16 text-green-500" />
            </div>
            <CardTitle className="text-2xl">Inscrição Confirmada!</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center">
              <p className="text-gray-600 mb-2">Seu protocolo de inscrição é:</p>
              <p className="text-2xl font-bold font-mono">{protocol}</p>
            </div>

            {isLoading ? (
              <div className="py-4 text-center text-gray-500">
                <p>Carregando detalhes da inscrição...</p>
              </div>
            ) : registrationDetails ? (
              <div className="border rounded-lg p-4 bg-gray-50">
                <h3 className="font-medium text-lg mb-3">Detalhes da Inscrição</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                  <div>
                    <p className="text-gray-500">Evento</p>
                    <p className="font-medium">{registrationDetails.eventTitle}</p>
                  </div>
                  
                  <div>
                    <p className="text-gray-500">Data do Evento</p>
                    <p className="font-medium">
                      {registrationDetails.eventStartDate && registrationDetails.eventEndDate
                        ? `${new Date(registrationDetails.eventStartDate).toLocaleDateString('pt-BR')} - ${new Date(registrationDetails.eventEndDate).toLocaleDateString('pt-BR')}`
                        : registrationDetails.eventStartDate
                        ? new Date(registrationDetails.eventStartDate).toLocaleDateString('pt-BR')
                        : 'Data não disponível'}
                    </p>
                  </div>
                  
                  {registrationDetails.name && (
                    <div>
                      <p className="text-gray-500">Nome</p>
                      <p className="font-medium">{registrationDetails.name}</p>
                    </div>
                  )}
                  
                  <div>
                    <p className="text-gray-500">Email</p>
                    <p className="font-medium">{registrationDetails.email || '-'}</p>
                  </div>
                  
                  <div>
                    <p className="text-gray-500">Modalidade</p>
                    <p className="font-medium">{registrationDetails.modalityName || 'Não disponível'}</p>
                  </div>
                  
                  <div>
                    <p className="text-gray-500">Categoria</p>
                    <p className="font-medium">{registrationDetails.categoryName || 'Não disponível'}</p>
                  </div>
                  
                  <div>
                    <p className="text-gray-500">Gênero</p>
                    <p className="font-medium">{registrationDetails.genderName || 'Não disponível'}</p>
                  </div>
                  
                  <div>
                    <p className="text-gray-500">Lote</p>
                    <p className="font-medium">{registrationDetails.tierName || 'Não disponível'}</p>
                  </div>
                  
                  {/* Sempre mostrar informações de pagamento */}
                  <div>
                    <p className="text-gray-500">Forma de Pagamento</p>
                    <p className="font-medium">{registrationDetails.paymentMethod ? getPaymentMethodName(registrationDetails.paymentMethod) : 'CREDIT_CARD'}</p>
                  </div>
                  
                  <div>
                    <p className="text-gray-500">Data do Pagamento</p>
                    <p className="font-medium">{registrationDetails.paymentDate ? new Date(registrationDetails.paymentDate).toLocaleDateString('pt-BR') : '-'}</p>
                  </div>
                  
                  <div className="md:col-span-2">
                    <p className="text-gray-500">Valor Pago</p>
                    <p className="text-xl font-bold text-green-600">
                      {registrationDetails.isFree 
                        ? 'Gratuito' 
                        : formatCurrency(registrationDetails.paidAmount || 0)}
                    </p>
                  </div>
                </div>
              </div>
            ) : null}

            <div className="text-sm text-gray-600">
              <p>Guarde este protocolo para consultas futuras.</p>
              <p>Em breve você receberá um email com mais informações.</p>
            </div>

            <div className="flex flex-col gap-2">
              <Button asChild>
                <Link href="/eventos">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Ver outros eventos
                </Link>
              </Button>
              <Button variant="outline" onClick={() => window.print()}>
                <Download className="h-4 w-4 mr-2" />
                Imprimir comprovante
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
