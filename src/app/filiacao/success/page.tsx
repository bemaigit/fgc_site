"use client"

import { Suspense } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Icons } from "@/components/ui/icons"

// Página principal com Suspense boundary
export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <div className="container max-w-lg py-8">
        <Card>
          <CardHeader>
            <div className="flex justify-center mb-4">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            </div>
            <CardTitle>Carregando...</CardTitle>
            <CardDescription>Aguarde enquanto confirmamos sua filiação</CardDescription>
          </CardHeader>
        </Card>
      </div>
    }>
      <PaymentSuccessContent />
    </Suspense>
  )
}

// Componente interno que usa hooks client-side
function PaymentSuccessContent() {
  const { useSearchParams } = require("next/navigation")
  const { Button } = require("@/components/ui/button")
  const Link = require("next/link").default

  const searchParams = useSearchParams()
  const protocol = searchParams.get('protocol')
  const status = searchParams.get('status')
  const paymentId = searchParams.get('payment_id')
  const type = searchParams.get('type') // tipo de filiação: 'athlete' ou 'club'
  const id = searchParams.get('id') // id do atleta ou clube
  
  // Para filiações gratuitas, não teremos protocol, status ou payment_id
  const isFreeRegistration = type && id && !protocol && !paymentId

  return (
    <div className="container max-w-lg py-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Icons.check className="h-6 w-6 text-green-500" />
            {isFreeRegistration ? 'Filiação Confirmada' : 'Pagamento Confirmado'}
          </CardTitle>
          <CardDescription>
            {isFreeRegistration 
              ? 'Sua filiação gratuita foi registrada com sucesso' 
              : 'Seu pagamento foi registrado com sucesso'
            }
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
          {status && (
            <div className="text-sm">
              <span className="font-semibold">Status:</span> {status}
            </div>
          )}
          {isFreeRegistration && id && (
            <div className="text-sm">
              <span className="font-semibold">ID da Filiação:</span> {id}
            </div>
          )}
          <p className="text-sm">
            {isFreeRegistration 
              ? 'Em breve você receberá um e-mail com a confirmação da filiação e instruções para acessar sua área do atleta.'
              : 'Em breve você receberá um e-mail com a confirmação do pagamento e instruções para acessar sua área do atleta.'
            }
          </p>
        </CardContent>
        <CardFooter className="flex-col gap-4">
          <Link href="/" className="w-full">
            <Button className="w-full" variant="outline">
              Voltar ao início
            </Button>
          </Link>
          <Link href="/dashboard" className="w-full">
            <Button className="w-full">
              Ir para o painel
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  )
}
