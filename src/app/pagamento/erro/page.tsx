"use client"

import { useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { XCircle } from "lucide-react"

function PaymentErrorContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const type = searchParams.get("type") || "payment"
  const error = searchParams.get("error")

  useEffect(() => {
    // Aqui podemos adicionar lógica para registrar o erro
    // ou tentar recuperar mais informações sobre a falha
  }, [])

  const getErrorMessage = () => {
    switch (type) {
      case "athlete":
        return "Houve um problema ao processar o pagamento da sua filiação."
      case "club":
        return "Houve um problema ao processar o pagamento do cadastro do clube."
      case "event":
        return "Houve um problema ao processar o pagamento da inscrição no evento."
      default:
        return "Houve um problema ao processar seu pagamento."
    }
  }

  const handleTryAgain = () => {
    switch (type) {
      case "athlete":
        router.push("/filiacao")
        break
      case "club":
        router.push("/clube/cadastro")
        break
      case "event":
        router.push("/eventos")
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
            <XCircle className="h-12 w-12 text-red-500" />
          </div>
          <CardTitle>Falha no Pagamento</CardTitle>
          <CardDescription>{getErrorMessage()}</CardDescription>
          {error && (
            <p className="text-sm text-muted-foreground mt-2">
              Erro: {error}
            </p>
          )}
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
          <Button onClick={handleTryAgain} className="w-full">
            Tentar Novamente
          </Button>
          <Button 
            variant="outline" 
            onClick={() => router.push("/dashboard")}
            className="w-full"
          >
            Voltar ao Dashboard
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

export default function PaymentErrorPage() {
  return (
    <Suspense fallback={<div className="container mx-auto py-10">
      <Card className="max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <XCircle className="h-12 w-12 text-yellow-500" />
          </div>
          <CardTitle>Carregando...</CardTitle>
          <CardDescription>Aguarde enquanto processamos suas informações</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        </CardContent>
      </Card>
    </div>}>
      <PaymentErrorContent />
    </Suspense>
  )
}
