"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Icons } from "@/components/ui/icons"

interface PaymentDetails {
  amount: number
  protocolNumber: string
  barcodeNumber: string
  boletoUrl: string
  dueDate: string
}

export default function BoletoPaymentPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session } = useSession()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>()
  const [details, setDetails] = useState<PaymentDetails>()
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!session) {
      router.push('/auth/login')
      return
    }

    // Carregar detalhes do pagamento
    const fetchDetails = async () => {
      try {
        const response = await fetch(`/api/filiacao/${params.id}`)
        if (!response.ok) throw new Error("Pagamento não encontrado")
        
        const data = await response.json()
        setDetails({
          ...data,
          barcodeNumber: searchParams.get('code') || '',
          boletoUrl: searchParams.get('url') || ''
        })
      } catch (error) {
        console.error("Erro ao carregar detalhes:", error)
        setError("Não foi possível carregar os detalhes do pagamento")
      }
    }

    fetchDetails()
  }, [session, params.id, router, searchParams])

  const copyToClipboard = async () => {
    if (!details?.barcodeNumber) return
    
    try {
      await navigator.clipboard.writeText(details.barcodeNumber)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error("Erro ao copiar:", error)
    }
  }

  const downloadBoleto = () => {
    if (details?.boletoUrl) {
      window.open(details.boletoUrl, '_blank')
    }
  }

  if (error) {
    return (
      <div className="container mx-auto py-10">
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-10">
      <Card>
        <CardHeader>
          <CardTitle>Pagamento via Boleto</CardTitle>
          <CardDescription>
            Você pode copiar o código de barras ou baixar o boleto para pagamento
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {details && (
            <>
              <div className="flex flex-col items-center space-y-4">
                <div className="flex flex-col items-center space-y-2 w-full max-w-md">
                  <Button
                    variant="default"
                    className="w-full"
                    onClick={downloadBoleto}
                  >
                    <Icons.download className="mr-2 h-4 w-4" />
                    Baixar Boleto
                  </Button>

                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={copyToClipboard}
                  >
                    {copied ? (
                      <>
                        <Icons.check className="mr-2 h-4 w-4" />
                        Copiado!
                      </>
                    ) : (
                      <>
                        <Icons.copy className="mr-2 h-4 w-4" />
                        Copiar código de barras
                      </>
                    )}
                  </Button>
                </div>

                <div className="text-center space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Protocolo: {details.protocolNumber}
                  </p>
                  <p className="font-medium">
                    Valor: R$ {(details.amount / 100).toFixed(2)}
                  </p>
                  {details.dueDate && (
                    <p className="text-sm text-muted-foreground">
                      Vencimento: {new Date(details.dueDate).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>

              <Alert>
                <AlertDescription>
                  O boleto pode levar até 3 dias úteis para ser compensado após o pagamento.
                  Você receberá um e-mail quando o pagamento for confirmado.
                </AlertDescription>
              </Alert>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
