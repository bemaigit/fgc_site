"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Container } from "@/components/ui/container"
import { PaymentIntegration } from "@/components/payment/payment-integration"
import { Loader2, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"

interface RegistrationData {
  id: string
  modalityIds: string[]
  categoryIds: string[]
  genderIds: string[]
  participantName: string
  participantEmail: string
  participantDocument: string
  amount: number
}

export default function EventRegistrationPaymentPage({ 
  params 
}: { 
  params: { id: string } 
}) {
  const router = useRouter()
  const { toast } = useToast()
  const eventId = params.id
  
  const [loading, setLoading] = useState(true)
  const [registrationData, setRegistrationData] = useState<RegistrationData | null>(null)
  const [error, setError] = useState<string | null>(null)
  
  // Carregar dados de registro salvos no localStorage
  useEffect(() => {
    const loadRegistrationData = () => {
      try {
        const savedData = localStorage.getItem(`event_registration_${eventId}`)
        
        if (!savedData) {
          setError("Dados de inscrição não encontrados. Por favor, preencha o formulário de inscrição.")
          return null
        }
        
        const parsedData = JSON.parse(savedData) as RegistrationData
        
        // Verificar se todos os dados necessários estão presentes
        if (!parsedData.participantName || !parsedData.participantEmail || !parsedData.participantDocument) {
          setError("Dados de inscrição incompletos. Por favor, preencha todos os campos obrigatórios.")
          return null
        }
        
        // Verificar se pelo menos uma modalidade, categoria e gênero foram selecionados
        if (!parsedData.modalityIds?.length || !parsedData.categoryIds?.length || !parsedData.genderIds?.length) {
          setError("Selecione pelo menos uma modalidade, categoria e gênero para continuar.")
          return null
        }
        
        return parsedData
      } catch (err) {
        console.error("Erro ao carregar dados de inscrição:", err)
        setError("Erro ao carregar dados de inscrição. Por favor, tente novamente.")
        return null
      }
    }
    
    // Simular carregamento de dados do servidor
    setTimeout(() => {
      const data = loadRegistrationData()
      
      if (data) {
        // Se não tiver um ID, gerar um temporário
        if (!data.id) {
          data.id = `reg_${Math.random().toString(36).substring(2, 15)}`
        }
        
        // Se não tiver um valor, calcular com base nas modalidades selecionadas
        // Em um ambiente real, isso seria calculado no servidor
        if (!data.amount) {
          // Valor base por modalidade (R$ 50,00)
          const baseAmount = 50
          data.amount = data.modalityIds.length * baseAmount
        }
        
        setRegistrationData(data)
      }
      
      setLoading(false)
    }, 1000)
  }, [eventId])
  
  const handlePaymentSuccess = (paymentId: string, protocol: string) => {
    toast({
      title: "Pagamento iniciado",
      description: `Protocolo: ${protocol}`,
      variant: "default"
    })
    
    // Em um ambiente real, aqui faríamos uma chamada para o servidor
    // para atualizar o status da inscrição
    console.log("Pagamento iniciado:", { paymentId, protocol })
  }
  
  const handlePaymentError = (errorMessage: string) => {
    toast({
      title: "Erro no pagamento",
      description: errorMessage,
      variant: "destructive"
    })
  }
  
  const handleBackToForm = () => {
    router.push(`/eventos/${eventId}/inscricao`)
  }
  
  if (loading) {
    return (
      <Container className="py-10">
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
          <p className="text-gray-500">Carregando dados da inscrição...</p>
        </div>
      </Container>
    )
  }
  
  if (error || !registrationData) {
    return (
      <Container className="py-10">
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          <div className="bg-red-50 p-6 rounded-lg text-center max-w-md">
            <h2 className="text-xl font-semibold text-red-700 mb-2">Erro ao processar inscrição</h2>
            <p className="text-gray-700 mb-6">{error || "Dados de inscrição não encontrados"}</p>
            <Button onClick={handleBackToForm}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar para o formulário
            </Button>
          </div>
        </div>
      </Container>
    )
  }
  
  return (
    <Container className="py-10">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-2">Finalizar Inscrição</h1>
          <p className="text-gray-500">
            Complete o pagamento para confirmar sua inscrição no evento
          </p>
        </div>
        
        <div className="mb-8">
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <h2 className="font-medium mb-2">Resumo da inscrição</h2>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="text-gray-500">Participante:</div>
              <div className="font-medium">{registrationData.participantName}</div>
              
              <div className="text-gray-500">Email:</div>
              <div className="font-medium">{registrationData.participantEmail}</div>
              
              <div className="text-gray-500">Documento:</div>
              <div className="font-medium">{registrationData.participantDocument}</div>
              
              <div className="text-gray-500">Modalidades:</div>
              <div className="font-medium">{registrationData.modalityIds.length}</div>
              
              <div className="text-gray-500">Categorias:</div>
              <div className="font-medium">{registrationData.categoryIds.length}</div>
              
              <div className="text-gray-500">Gêneros:</div>
              <div className="font-medium">{registrationData.genderIds.length}</div>
            </div>
          </div>
        </div>
        
        <PaymentIntegration
          eventId={eventId}
          registrationData={registrationData}
          onSuccess={handlePaymentSuccess}
          onError={handlePaymentError}
          onCancel={handleBackToForm}
          persistData={true}
        />
      </div>
    </Container>
  )
}
