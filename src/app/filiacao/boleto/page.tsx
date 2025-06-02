"use client"

import { useEffect, useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, Copy, CheckCircle2, Download } from "lucide-react"
import { TransactionService } from "@/lib/transaction/service"

interface PaymentInfo {
  barcodeNumber?: string
  paymentUrl?: string
  amount: number
  status: string
}

function BoletoPageContent() {
  const router = useRouter()
  const { data: session } = useSession()
  const searchParams = useSearchParams()
  const paymentId = searchParams.get("payment")
  const protocolNumber = searchParams.get("protocol")

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [payment, setPayment] = useState<PaymentInfo | null>(null)
  const [copied, setCopied] = useState(false)

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
        // Usando o método que adicionamos ao TransactionService
        const transaction = await transactionService.findTransactionByExternalId(paymentId)
        
        if (!transaction) {
          throw new Error("Pagamento não encontrado")
        }

        setPayment({
          barcodeNumber: transaction.metadata?.barcodeNumber,
          paymentUrl: transaction.metadata?.paymentUrl,
          amount: transaction.amount,
          status: transaction.status
        })
      } catch (error: any) {
        setError(error.message || "Erro ao carregar pagamento")
      } finally {
        setLoading(false)
      }
    }

    loadPayment()
  }, [session, router, paymentId, protocolNumber])

  const copyBarcode = async () => {
    if (payment?.barcodeNumber) {
      await navigator.clipboard.writeText(payment.barcodeNumber)
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
          <CardTitle>Pagamento via Boleto</CardTitle>
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

              {payment.barcodeNumber && (
                <div className="relative">
                  <div className="p-4 bg-gray-50 rounded-lg break-all font-mono text-sm">
                    {payment.barcodeNumber}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-1/2 -translate-y-1/2"
                    onClick={copyBarcode}
                  >
                    {copied ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              )}

              {payment.paymentUrl && (
                <div className="flex justify-center">
                  <Button
                    variant="outline"
                    onClick={() => window.open(payment.paymentUrl, "_blank")}
                    className="w-full"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Baixar Boleto
                  </Button>
                </div>
              )}

              <div className="text-center text-sm text-gray-600">
                <p>Protocolo: {protocolNumber}</p>
                <p className="mt-4">
                  O pagamento será confirmado em até 3 dias úteis após o pagamento.
                  Você receberá um e-mail de confirmação.
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

export default function BoletoPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center py-12">
      <Loader2 className="h-8 w-8 animate-spin" />
    </div>}>
      <BoletoPageContent />
    </Suspense>
  )
}
