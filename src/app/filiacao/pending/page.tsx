"use client"

import { Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Icons } from "@/components/ui/icons"
import Link from "next/link"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

function PaymentPendingContent() {
  const searchParams = useSearchParams()
  const protocol = searchParams.get('protocol')
  const paymentId = searchParams.get('payment_id')
  const qrCode = searchParams.get('qr_code')
  const qrCodeBase64 = searchParams.get('qr_code_base64')

  return (
    <div className="container max-w-lg py-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Icons.clock className="h-6 w-6 text-yellow-500" />
            Pagamento em Processamento
          </CardTitle>
          <CardDescription>
            Aguardando confirmação do pagamento
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {protocol && (
            <div className="text-sm">
              <span className="font-semibold">Protocolo:</span> {protocol}
            </div>
          )}
          {paymentId && (
            <div className="text-sm">
              <span className="font-semibold">ID do Pagamento:</span> {paymentId}
            </div>
          )}

          {qrCode && (
            <Alert>
              <AlertTitle>QR Code do PIX</AlertTitle>
              <AlertDescription>
                <div className="mt-2 space-y-2">
                  <img 
                    src={`data:image/png;base64,${qrCodeBase64}`}
                    alt="QR Code do PIX"
                    className="mx-auto h-48 w-48"
                  />
                  <div className="text-xs text-center">
                    <p>Escaneie o QR Code acima com o app do seu banco</p>
                    <p className="mt-1">Ou copie o código abaixo:</p>
                    <pre className="mt-2 p-2 bg-muted rounded text-center break-all">
                      {qrCode}
                    </pre>
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}

          <Alert variant="info" className="mt-4">
            <AlertTitle>Importante</AlertTitle>
            <AlertDescription>
              Você receberá um e-mail assim que confirmarmos seu pagamento.
              Por favor, aguarde alguns instantes.
            </AlertDescription>
          </Alert>
        </CardContent>
        <CardFooter className="flex-col gap-4">
          <Link href="/filiacao" className="w-full">
            <Button className="w-full" variant="outline">
              Voltar ao início
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  )
}

export default function PaymentPendingPage() {
  return (
    <Suspense fallback={<div className="container max-w-lg py-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Icons.clock className="h-6 w-6 text-yellow-500" />
            Carregando...
          </CardTitle>
          <CardDescription>
            Aguarde enquanto processamos suas informações
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        </CardContent>
      </Card>
    </div>}>
      <PaymentPendingContent />
    </Suspense>
  )
}
