"use client"

import { Suspense } from "react"
import { PaymentStatusCard } from "@/components/payment/status-card"
import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"

// Página principal com Suspense boundary
export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<div className="container mx-auto py-10"><p>Carregando detalhes do pagamento...</p></div>}>
      <PaymentSuccessContent />
    </Suspense>
  )
}

// Componente interno que usa hooks client-side

interface PaymentDetails {
  protocol: string
  method: string
  value: string
  status: string
}

function PaymentSuccessContent() {
  const searchParams = useSearchParams()
  const [details, setDetails] = useState<PaymentDetails>()
  const [error, setError] = useState<string>()

  useEffect(() => {
    const paymentId = searchParams.get("payment")
    if (!paymentId) {
      setError("ID do pagamento não encontrado")
      return
    }

    // Buscar detalhes do pagamento
    const fetchDetails = async () => {
      try {
        const response = await fetch(`/api/payments/${paymentId}`)
        if (!response.ok) throw new Error("Pagamento não encontrado")
        
        const data = await response.json()
        setDetails(data)
      } catch (error) {
        console.error("Erro ao carregar detalhes:", error)
        setError("Não foi possível carregar os detalhes do pagamento")
      }
    }

    fetchDetails()
  }, [searchParams])

  if (error) {
    return (
      <div className="container mx-auto py-10">
        <PaymentStatusCard
          status="error"
          title="Erro ao carregar pagamento"
          message={error}
          actions={{
            primary: {
              label: "Voltar para o início",
              href: "/"
            }
          }}
        />
      </div>
    )
  }

  if (!details) {
    return (
      <div className="container mx-auto py-10">
        <PaymentStatusCard
          status="pending"
          title="Carregando..."
          message="Aguarde enquanto buscamos os detalhes do seu pagamento"
        />
      </div>
    )
  }

  return (
    <div className="container mx-auto py-10">
      <PaymentStatusCard
        status="success"
        title="Pagamento aprovado!"
        message="Sua filiação foi confirmada com sucesso. Em breve você receberá um email com mais informações."
        protocol={details.protocol}
        paymentDetails={{
          method: details.method,
          value: details.value
        }}
        actions={{
          primary: {
            label: "Ir para minha área",
            href: "/dashboard"
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
