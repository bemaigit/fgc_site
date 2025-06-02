"use client"

import { useEffect, useState, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { PaymentStatusCard } from "@/components/payment/status-card"

interface PaymentError {
  code: string
  message: string
  protocol?: string
  details?: {
    method: string
    value: string
  }
}

const errorMessages: Record<string, string> = {
  EXPIRED: "O prazo para pagamento expirou",
  CANCELLED: "O pagamento foi cancelado",
  FAILED: "Houve uma falha ao processar o pagamento",
  INSUFFICIENT_FUNDS: "Saldo insuficiente para realizar o pagamento",
  CARD_DECLINED: "O cartão foi recusado pela operadora",
  DEFAULT: "Ocorreu um erro ao processar seu pagamento"
}

function PaymentErrorContent() {
  const searchParams = useSearchParams()
  const [error, setError] = useState<PaymentError>()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const paymentId = searchParams.get("payment")
    const errorCode = searchParams.get("error")

    if (!paymentId || !errorCode) {
      setError({
        code: "UNKNOWN",
        message: "Dados do pagamento não encontrados"
      })
      setLoading(false)
      return
    }

    // Buscar detalhes do erro
    const fetchError = async () => {
      try {
        const response = await fetch(`/api/payments/${paymentId}/error`)
        if (!response.ok) throw new Error("Erro não encontrado")
        
        const data = await response.json()
        setError(data)
      } catch (error) {
        console.error("Erro ao carregar detalhes:", error)
        setError({
          code: errorCode,
          message: errorMessages[errorCode] || errorMessages.DEFAULT
        })
      } finally {
        setLoading(false)
      }
    }

    fetchError()
  }, [searchParams])

  if (loading) {
    return (
      <div className="container mx-auto py-10">
        <PaymentStatusCard
          status="pending"
          title="Carregando..."
          message="Aguarde enquanto verificamos o status do seu pagamento"
        />
      </div>
    )
  }

  if (!error) {
    return (
      <div className="container mx-auto py-10">
        <PaymentStatusCard
          status="error"
          title="Erro desconhecido"
          message="Ocorreu um erro inesperado ao processar seu pagamento"
          actions={{
            primary: {
              label: "Tentar novamente",
              href: "/filiacao/pagamento"
            },
            secondary: {
              label: "Voltar para o início",
              href: "/"
            }
          }}
        />
      </div>
    )
  }

  return (
    <div className="container mx-auto py-10">
      <PaymentStatusCard
        status="error"
        title="Falha no pagamento"
        message={error.message}
        protocol={error.protocol}
        paymentDetails={error.details && {
          method: error.details.method,
          value: error.details.value
        }}
        actions={{
          primary: {
            label: "Tentar novamente",
            href: "/filiacao/pagamento"
          },
          secondary: {
            label: "Entrar em contato",
            href: "/contato"
          }
        }}
      />
    </div>
  )
}

export default function PaymentErrorPage() {
  return (
    <Suspense fallback={<div className="container mx-auto py-10">
      <PaymentStatusCard
        status="pending"
        title="Carregando..."
        message="Aguarde enquanto verificamos o status do seu pagamento"
      />
    </div>}>
      <PaymentErrorContent />
    </Suspense>
  )
}
