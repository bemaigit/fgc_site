"use client"

import { Suspense } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"
import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Copy, CheckCircle2 } from "lucide-react"
import { TransactionService } from "@/lib/transaction/service"

// Componente principal que será renderizado dentro do Suspense
export default function PixPage() {
  return (
    <Suspense fallback={
      <div className="container max-w-2xl py-8">
        <Card>
          <CardHeader>
            <CardTitle>Pagamento via PIX</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="ml-2">Carregando informações de pagamento...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    }>
      <PixContent />
    </Suspense>
  )
}

// Componente de conteúdo que usa hooks client-side

interface PaymentInfo {
  qrCodeBase64?: string
  qrCode?: string
  amount: number
  status: string
}

function PixContent() {
  const router = useRouter()
  const { data: session } = useSession()
  const searchParams = useSearchParams()
  const paymentId = searchParams.get("payment")
  const protocolNumber = searchParams.get("protocol")

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [payment, setPayment] = useState<PaymentInfo | null>(null)
  const [copied, setCopied] = useState(false)
  const [checkingStatus, setCheckingStatus] = useState(false)

  useEffect(() => {
    if (!session?.user) {
      router.push("/auth/login")
      return
    }

    if (!paymentId || !protocolNumber) {
      router.push("/filiacao/erro")
      return
    }

    const loadPayment = async () => {
      try {
        const transactionService = TransactionService.getInstance()
        const transaction = await transactionService.findTransactionByExternalId(paymentId)
        
        if (!transaction) {
          throw new Error("Pagamento não encontrado")
        }

        // Extrair metadata com tipagem correta
        const metadata = transaction.metadata as Record<string, any> || {}
        
        setPayment({
          qrCodeBase64: metadata.qrCodeBase64,
          qrCode: metadata.qrCode,
          amount: Number(transaction.amount),
          status: transaction.status
        })
      } catch (error: any) {
        setError(error.message || "Erro ao carregar pagamento")
      } finally {
        setLoading(false)
      }
    }

    loadPayment()

    // Verificar status a cada 5 segundos
    const interval = setInterval(async () => {
      if (!checkingStatus) {
        setCheckingStatus(true)
        try {
          const transactionService = TransactionService.getInstance()
          const transaction = await transactionService.findTransactionByExternalId(paymentId)
          
          if (transaction?.status === "PAID") {
            router.push("/filiacao/sucesso")
          }

          setPayment(prev => prev ? {
            ...prev,
            status: transaction?.status || prev.status
          } : null)
        } catch (error) {
          console.error("Erro ao verificar status:", error)
        } finally {
          setCheckingStatus(false)
        }
      }
    }, 5000)

    return () => clearInterval(interval)
  }, [session, router, paymentId, protocolNumber, checkingStatus])

  const copyQRCode = async () => {
    if (payment?.qrCode) {
      await navigator.clipboard.writeText(payment.qrCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (!session?.user || !paymentId || !protocolNumber) {
    return null
  }

  return (
    <div className="container max-w-2xl py-8">
      <Card>
        <CardHeader>
          <CardTitle>Pagamento via PIX</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : error ? (
            <div className="bg-red-50 text-red-600 p-4 rounded-lg">
              {error}
            </div>
          ) : payment ? (
            <div className="space-y-6">
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-2">Valor a pagar</p>
                <p className="text-3xl font-bold">
                  R$ {(payment.amount / 100).toFixed(2)}
                </p>
              </div>

              {payment.qrCodeBase64 && (
                <div className="flex justify-center">
                  <img
                    src={`data:image/png;base64,${payment.qrCodeBase64}`}
                    alt="QR Code PIX"
                    className="w-48 h-48"
                  />
                </div>
              )}

              {payment.qrCode && (
                <div className="relative">
                  <div className="p-4 bg-gray-50 rounded-lg break-all font-mono text-sm">
                    {payment.qrCode}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-1/2 -translate-y-1/2"
                    onClick={copyQRCode}
                  >
                    {copied ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              )}

              <div className="text-center text-sm text-gray-600">
                <p>Protocolo: {protocolNumber}</p>
                <p className="mt-4">
                  Após o pagamento, você receberá um e-mail de confirmação
                </p>
              </div>
            </div>
          ) : null}

          <div className="mt-8 flex justify-between">
            <Button variant="outline" onClick={() => router.back()}>
              Voltar
            </Button>
            <Button onClick={() => router.push("/")}>
              Ir para Home
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
