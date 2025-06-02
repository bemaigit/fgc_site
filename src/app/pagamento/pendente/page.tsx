'use client'

import { Suspense } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, AlertTriangle } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/utils'

// Página principal com Suspense boundary
export default function PendingPaymentPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto py-10">
        <Card className="max-w-md mx-auto">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Loader2 className="h-12 w-12 text-primary animate-spin" />
            </div>
            <CardTitle>Carregando...</CardTitle>
            <CardDescription>Aguarde enquanto verificamos o status do seu pagamento</CardDescription>
          </CardHeader>
        </Card>
      </div>
    }>
      <PendingPaymentContent />
    </Suspense>
  )
}

// Componente interno que usa hooks client-side

function PendingPaymentContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [paymentDetails, setPaymentDetails] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const paymentId = searchParams.get('payment')
  const entityType = searchParams.get('type')
  const entityId = searchParams.get('entityId')

  useEffect(() => {
    if (!paymentId) {
      setError('ID do pagamento não encontrado')
      setLoading(false)
      return
    }

    // Buscar detalhes do pagamento
    fetch(`/api/payments?id=${paymentId}`)
      .then(response => {
        if (!response.ok) {
          throw new Error('Não foi possível carregar os detalhes do pagamento')
        }
        return response.json()
      })
      .then(data => {
        setPaymentDetails(data)
        setLoading(false)
      })
      .catch(err => {
        setError(err instanceof Error ? err.message : 'Erro ao carregar detalhes do pagamento')
        setLoading(false)
      })
  }, [paymentId])

  const handleBackToHome = () => {
    router.push('/')
  }

  const handleCheckStatus = () => {
    // Recarregar a página para verificar o status atualizado
    setLoading(true)
    window.location.reload()
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-10">
            <Loader2 className="h-16 w-16 text-primary animate-spin mb-4" />
            <p className="text-lg text-center">Verificando status do pagamento...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Card>
          <CardHeader>
            <CardTitle>Erro ao carregar pagamento</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleBackToHome} className="w-full">
              Voltar para a página inicial
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-md mx-auto">
        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <AlertTriangle className="h-16 w-16 text-yellow-500" />
            </div>
            <CardTitle>Pagamento em Análise</CardTitle>
            <CardDescription>
              Seu pagamento está sendo processado pela operadora do cartão
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {paymentDetails && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Protocolo:</span>
                  <span className="font-medium">{paymentDetails.protocol}</span>
                </div>
                
                <div className="flex justify-between items-center mt-2">
                  <span className="text-sm text-gray-500">Valor:</span>
                  <span className="font-medium">{formatCurrency(paymentDetails.amount)}</span>
                </div>
                
                <div className="flex justify-between items-center mt-2">
                  <span className="text-sm text-gray-500">Status:</span>
                  <span className="font-medium text-yellow-600">Em análise</span>
                </div>
              </div>
            )}
            
            <div className="space-y-4">
              <p className="text-gray-600 text-sm">
                Seu pagamento está sendo analisado pela operadora do cartão. Este processo pode levar até 48 horas.
                Você receberá um e-mail assim que o pagamento for aprovado ou recusado.
              </p>
              
              <div className="flex flex-col gap-3">
                <Button onClick={handleCheckStatus} variant="outline" className="w-full">
                  Verificar status novamente
                </Button>
                <Button onClick={handleBackToHome} className="w-full">
                  Voltar para a página inicial
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
