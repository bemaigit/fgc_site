"use client"

import { Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Icons } from "@/components/ui/icons"
import Link from "next/link"

function PaymentFailureContent() {
  const searchParams = useSearchParams()
  const protocol = searchParams.get('protocol')
  const error = searchParams.get('error')
  const paymentId = searchParams.get('payment_id')

  return (
    <div className="container max-w-lg py-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Icons.warning className="h-6 w-6 text-red-500" />
            Erro no Pagamento
          </CardTitle>
          <CardDescription>
            Não foi possível processar seu pagamento
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
          {error && (
            <div className="text-sm text-red-500">
              <span className="font-semibold">Erro:</span> {error}
            </div>
          )}
          <p className="text-sm">
            Por favor, tente novamente em alguns minutos. Se o problema persistir,
            entre em contato com nosso suporte.
          </p>
        </CardContent>
        <CardFooter className="flex-col gap-4">
          <Link href="/filiacao" className="w-full">
            <Button className="w-full" variant="outline">
              Voltar ao início
            </Button>
          </Link>
          <Button 
            className="w-full" 
            variant="default"
            onClick={() => window.history.back()}
          >
            Tentar novamente
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

export default function PaymentFailurePage() {
  return (
    <Suspense fallback={<div className="container max-w-lg py-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Icons.warning className="h-6 w-6 text-red-500" />
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
      <PaymentFailureContent />
    </Suspense>
  )
}
