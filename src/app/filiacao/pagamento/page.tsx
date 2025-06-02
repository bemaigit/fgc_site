"use client"

import { Suspense } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"

// Página principal com Suspense boundary
export default function PaymentPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto py-10">
        <Card className="max-w-md mx-auto">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Loader2 className="h-12 w-12 text-primary animate-spin" />
            </div>
            <CardTitle>Carregando...</CardTitle>
          </CardHeader>
        </Card>
      </div>
    }>
      <PaymentPageContent />
    </Suspense>
  )
}

// Componente interno que usa hooks client-side
function PaymentPageContent() {
  const { useEffect, useState } = require("react")
  const { useRouter, useSearchParams } = require("next/navigation")
  const { useSession } = require("next-auth/react")
  const { Button } = require("@/components/ui/button")
  const { RadioGroup, RadioGroupItem } = require("@/components/ui/radio-group")
  const { Label } = require("@/components/ui/label")
  const { membershipService } = require("@/lib/membership/service")
  const { PaymentMethod } = require("@/lib/payment/types")
  
  const router = useRouter()
  const { data: session } = useSession()
  const searchParams = useSearchParams()
  const athleteId = searchParams.get("athleteId")

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>(PaymentMethod.PIX)

  useEffect(() => {
    if (!session?.user) {
      router.push("/auth/login")
    }
  }, [session, router])

  const handlePayment = async () => {
    if (!session?.user || !athleteId) return

    setLoading(true)
    setError("")

    try {
      const payment = await membershipService.createMembership({
        userId: session.user.id,
        type: "ATHLETE",
        paymentMethod: selectedMethod
      })

      // Redirecionar baseado no método de pagamento
      if (selectedMethod === PaymentMethod.PIX) {
        router.push(`/filiacao/pix?payment=${payment.id}&protocol=${payment.protocolNumber}`)
      } else if (selectedMethod === PaymentMethod.BOLETO) {
        router.push(`/filiacao/boleto?payment=${payment.id}&protocol=${payment.protocolNumber}`)
      } else {
        // Redirecionar para URL de pagamento do Mercado Pago
        if (payment.paymentUrl) {
          window.location.href = payment.paymentUrl
        }
      }
    } catch (error: any) {
      setError(error.message || "Erro ao processar pagamento")
    } finally {
      setLoading(false)
    }
  }

  if (!session?.user || !athleteId) {
    return null
  }

  return (
    <div className="container max-w-2xl py-8">
      <Card>
        <CardHeader>
          <CardTitle>Escolha a forma de pagamento</CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-4">
              {error}
            </div>
          )}

          <RadioGroup
            value={selectedMethod}
            onValueChange={(value) => setSelectedMethod(value as PaymentMethod)}
            className="space-y-4"
          >
            <div className="flex items-center space-x-4 p-4 border rounded-lg">
              <RadioGroupItem value={PaymentMethod.PIX} id="pix" />
              <Label htmlFor="pix" className="flex-1">
                <div className="font-medium">PIX</div>
                <div className="text-sm text-gray-600">Pagamento instantâneo</div>
              </Label>
              <img src="/pix-logo.png" alt="PIX" className="h-8" />
            </div>

            <div className="flex items-center space-x-4 p-4 border rounded-lg">
              <RadioGroupItem value={PaymentMethod.BOLETO} id="boleto" />
              <Label htmlFor="boleto" className="flex-1">
                <div className="font-medium">Boleto Bancário</div>
                <div className="text-sm text-gray-600">Prazo de 1-3 dias úteis</div>
              </Label>
              <img src="/boleto-logo.png" alt="Boleto" className="h-8" />
            </div>

            <div className="flex items-center space-x-4 p-4 border rounded-lg">
              <RadioGroupItem value={PaymentMethod.CREDIT_CARD} id="credit-card" />
              <Label htmlFor="credit-card" className="flex-1">
                <div className="font-medium">Cartão de Crédito</div>
                <div className="text-sm text-gray-600">Aprovação imediata</div>
              </Label>
              <div className="flex space-x-2">
                <img src="/visa-logo.png" alt="Visa" className="h-6" />
                <img src="/mastercard-logo.png" alt="Mastercard" className="h-6" />
              </div>
            </div>
          </RadioGroup>

          <div className="mt-8 flex justify-between">
            <Button variant="outline" onClick={() => router.back()}>
              Voltar
            </Button>
            <Button onClick={handlePayment} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processando...
                </>
              ) : (
                "Continuar"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
