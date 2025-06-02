"use client"

import { Suspense } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Loader2 } from "lucide-react"
import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useSession } from "next-auth/react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Icons } from "@/components/ui/icons"

// Componente principal que será renderizado dentro do Suspense
export default function PixPaymentPage({ params }: { params: { id: string } }) {
  return (
    <Suspense fallback={
      <div className="container mx-auto py-10">
        <Card>
          <CardHeader>
            <CardTitle>Pagamento via PIX</CardTitle>
            <CardDescription>
              Carregando informações de pagamento...
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </CardContent>
        </Card>
      </div>
    }>
      <PixPaymentContent params={params} />
    </Suspense>
  )
}

// Componente de conteúdo que usa hooks client-side
interface PaymentDetails {
  amount: number
  protocolNumber: string
  qrCodeBase64: string
  qrCodeText: string
}

function PixPaymentContent({ params }: { params: { id: string } }) {
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
          qrCodeBase64: searchParams.get('qrcode') || '',
          qrCodeText: searchParams.get('code') || ''
        })
      } catch (error) {
        console.error("Erro ao carregar detalhes:", error)
        setError("Não foi possível carregar os detalhes do pagamento")
      }
    }

    fetchDetails()
  }, [session, params.id, router, searchParams])

  const copyToClipboard = async () => {
    if (!details?.qrCodeText) return
    
    try {
      await navigator.clipboard.writeText(details.qrCodeText)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error("Erro ao copiar:", error)
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
          <CardTitle>Pagamento via PIX</CardTitle>
          <CardDescription>
            Escaneie o QR Code ou copie o código PIX para realizar o pagamento
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {details && (
            <>
              <div className="flex flex-col items-center space-y-4">
                <div className="relative w-64 h-64">
                  {details.qrCodeBase64 && (
                    <Image
                      src={`data:image/png;base64,${details.qrCodeBase64}`}
                      alt="QR Code PIX"
                      fill
                      style={{ objectFit: 'contain' }}
                    />
                  )}
                </div>
                
                <div className="flex flex-col items-center space-y-2 w-full max-w-md">
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
                        Copiar código PIX
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
                </div>
              </div>

              <Alert>
                <AlertDescription>
                  Após o pagamento, você receberá um e-mail de confirmação.
                  A página será atualizada automaticamente quando o pagamento for confirmado.
                </AlertDescription>
              </Alert>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
