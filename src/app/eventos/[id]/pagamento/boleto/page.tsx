"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, Receipt, Download, Copy, CheckCircle, Calendar } from "lucide-react"
import { formatCurrency } from "@/lib/format-utils"

interface PageProps {
  params: { id: string }
}

interface BoletoPaymentDetails {
  id: string
  protocol: string
  amount: number
  barcodeNumber?: string
  pdfUrl?: string
  dueDate?: string
}

export default function BoletoPaymentPage({ params }: PageProps) {
  const router = useRouter()
  const eventId = params.id
  const searchParams = useSearchParams()
  const paymentId = searchParams.get('payment')
  const protocol = searchParams.get('protocol')
  
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [payment, setPayment] = useState<BoletoPaymentDetails | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    async function fetchPaymentDetails() {
      if (!paymentId || !protocol) {
        setError('Informações de pagamento incompletas')
        setLoading(false)
        return
      }

      try {
        // Buscar detalhes do pagamento da API
        const response = await fetch(`/api/payments?id=${paymentId}`)
        
        if (!response.ok) {
          throw new Error('Não foi possível carregar os detalhes do pagamento')
        }
        
        const data = await response.json()
        
        // Calcular data de vencimento (se não vier da API)
        let dueDate = data.dueDate
        if (!dueDate) {
          const dueDateObj = new Date()
          dueDateObj.setDate(dueDateObj.getDate() + 3) // Vencimento em 3 dias
          dueDate = dueDateObj.toISOString()
        }

        setPayment({
          id: data.id,
          protocol: data.protocol,
          amount: data.amount,
          barcodeNumber: data.barcodeNumber,
          pdfUrl: data.pdfUrl,
          dueDate: dueDate
        })
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar detalhes do pagamento')
      } finally {
        setLoading(false)
      }
    }

    fetchPaymentDetails()
  }, [paymentId, protocol])

  const handleCopyBarcodeNumber = () => {
    if (payment?.barcodeNumber) {
      navigator.clipboard.writeText(payment.barcodeNumber)
      setCopied(true)
      setTimeout(() => setCopied(false), 3000)
    }
  }

  const handleDownloadBoleto = () => {
    if (payment?.pdfUrl) {
      window.open(payment.pdfUrl, '_blank')
    } else {
      // Se não houver URL do PDF, redirecionar para a página de pagamento do PagSeguro
      window.open(`https://app.pagseguro.com/boleto/${payment?.id}`, '_blank')
    }
  }

  const handleCheckStatus = () => {
    // Em um ambiente real, verificaríamos o status do pagamento
    // Para este exemplo, vamos simular um redirecionamento para a página de sucesso
    router.push(`/pagamento/sucesso?type=event&entityId=${eventId}`)
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error || !payment) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Card>
          <CardHeader>
            <CardTitle>Erro ao carregar pagamento</CardTitle>
            <CardDescription>{error || 'Não foi possível carregar os detalhes do pagamento'}</CardDescription>
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
      <div className="max-w-md mx-auto">
        <Card>
          <CardHeader className="text-center">
            <CardTitle>Boleto Bancário</CardTitle>
            <CardDescription>
              Imprima o boleto ou copie o código de barras
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col items-center">
              <div className="bg-gray-50 p-6 rounded-lg border mb-4 w-full flex items-center justify-center">
                <Receipt className="h-16 w-16 text-gray-400" />
              </div>
              
              <div className="text-center">
                <p className="text-sm text-gray-500 mb-2">Valor a pagar</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(payment.amount)}
                </p>
              </div>
            </div>
            
            {payment.dueDate && (
              <div className="flex items-center justify-center gap-2 text-amber-600 bg-amber-50 p-3 rounded-md">
                <Calendar className="h-5 w-5" />
                <span>Vencimento: {new Date(payment.dueDate).toLocaleDateString()}</span>
              </div>
            )}
            
            <div className="space-y-2">
              <p className="text-sm text-center text-gray-500">
                Código de barras
              </p>
              
              <div className="flex items-center">
                <div className="flex-1 p-3 bg-gray-50 rounded-l-md border-l border-y text-sm font-mono overflow-hidden whitespace-nowrap overflow-ellipsis">
                  {payment.barcodeNumber}
                </div>
                <button 
                  onClick={handleCopyBarcodeNumber}
                  className="p-3 bg-gray-100 rounded-r-md border flex items-center justify-center"
                >
                  {copied ? <CheckCircle className="h-5 w-5 text-green-500" /> : <Copy className="h-5 w-5" />}
                </button>
              </div>
            </div>
            
            <div className="space-y-3 pt-4">
              <Button 
                onClick={handleDownloadBoleto} 
                className="w-full flex items-center justify-center gap-2"
              >
                <Download className="h-4 w-4" />
                Baixar Boleto
              </Button>
              
              <Button onClick={handleCheckStatus} variant="outline" className="w-full">
                Verificar Status do Pagamento
              </Button>
              
              <Button variant="outline" onClick={() => router.back()} className="w-full">
                Voltar
              </Button>
            </div>
            
            <div className="text-sm text-gray-500 text-center">
              <p>Após o pagamento, a compensação pode levar até 3 dias úteis.</p>
              <p>Seu protocolo: <span className="font-medium">{payment.protocol}</span></p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
