"use client"

import { Suspense, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle2 } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"

// Página principal com Suspense boundary
export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto py-10">
        <Card className="max-w-md mx-auto">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            </div>
            <CardTitle>Carregando...</CardTitle>
            <CardDescription>Aguarde enquanto confirmamos seu pagamento</CardDescription>
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
  const router = useRouter()
  const searchParams = useSearchParams()
  const type = searchParams.get("type") || "payment"
  const entityId = searchParams.get("entityId")
  const protocol = searchParams.get("protocol")

  useEffect(() => {
    // Aqui podemos adicionar lógica para verificar o status do pagamento
    // e atualizar a UI conforme necessário
  }, [])

  const getSuccessMessage = () => {
    switch (type) {
      case "athlete":
        return "Sua filiação foi realizada com sucesso!"
      case "club":
        return "O cadastro do clube foi realizado com sucesso!"
      case "event":
        return "Sua inscrição no evento foi confirmada!"
      default:
        return "Pagamento realizado com sucesso!"
    }
  }

  const handleContinue = () => {
    switch (type) {
      case "athlete":
        router.push("/dashboard/atleta")
        break
      case "club":
        router.push("/dashboard/clube")
        break
      case "event":
        if (entityId && protocol) {
          // Redirecionar para a página de confirmação de inscrição com o protocolo
          router.push(`/eventos/${entityId}/inscricao/sucesso?protocol=${protocol}`)
        } else if (entityId) {
          // Fallback para a página do evento se não tiver protocolo
          router.push(`/eventos/${entityId}`)
        } else {
          router.push("/dashboard/eventos")
        }
        break
      default:
        router.push("/dashboard")
    }
  }

  return (
    <div className="container mx-auto py-10">
      <Card className="max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <CheckCircle2 className="h-12 w-12 text-green-500" />
          </div>
          <CardTitle>Pagamento Confirmado!</CardTitle>
          <CardDescription>{getSuccessMessage()}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
          <Button onClick={handleContinue} className="w-full">
            Continuar
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
