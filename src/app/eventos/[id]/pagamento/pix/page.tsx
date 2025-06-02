"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Image from "next/image"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, QrCode, Copy, CheckCircle, RefreshCw } from "lucide-react"
import { formatCurrency } from "@/lib/format-utils"
import React from "react"

interface PageProps {
  params: { id: string }
}

interface PixPaymentDetails {
  id: string
  protocol: string
  amount: number
  qrCode: string
  qrCodeBase64?: string
  expiresAt?: string
}

export default function PixPaymentPage({ params }: PageProps) {
  const router = useRouter()
  
  // Corrigindo o acesso aos params usando React.use()
  // com tipagem adequada para evitar erros
  const resolvedParams = React.use(params as any) as { id: string }
  const eventId = resolvedParams.id
  
  const searchParams = useSearchParams()
  const paymentId = searchParams.get('payment')
  const protocol = searchParams.get('protocol')
  
  const [loading, setLoading] = useState(true)
  const [checking, setChecking] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [payment, setPayment] = useState<PixPaymentDetails | null>(null)
  const [copied, setCopied] = useState(false)
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'confirmed' | 'failed'>('pending')

  useEffect(() => {
    async function fetchPaymentDetails() {
      if (!paymentId || !protocol) {
        setError('Informações de pagamento incompletas')
        setLoading(false)
        return
      }

      try {
        // Buscar detalhes do pagamento da API usando a nova rota específica
        const response = await fetch(`/api/payments/${paymentId}`)
        
        if (!response.ok) {
          throw new Error('Não foi possível carregar os detalhes do pagamento')
        }
        
        const data = await response.json()
        
        // Log detalhado para debugging
        console.log('Dados do pagamento recebidos:', {
          ...data,
          qrCode: data.qrCode || 'QR Code não disponível',
          qrCodeBase64: data.qrCodeBase64 ? 'Dados base64 disponíveis' : 'Dados base64 não disponíveis'
        })
        
        setPayment({
          id: data.id,
          protocol: data.protocol,
          amount: data.amount,
          qrCode: data.qrCode,
          qrCodeBase64: data.qrCodeBase64,
          expiresAt: data.expiresAt
        })
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar detalhes do pagamento')
      } finally {
        setLoading(false)
      }
    }

    fetchPaymentDetails()
  }, [paymentId, protocol])

  const handleCopyPixCode = () => {
    if (payment?.qrCode) {
      navigator.clipboard.writeText(payment.qrCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 3000)
    }
  }

  const handleCheckStatus = async () => {
    if (!payment?.id) return
    
    setChecking(true)
    
    try {
      // Verificar status do pagamento
      const response = await fetch(`/api/payments?id=${payment.id}`)
      
      if (!response.ok) {
        throw new Error('Não foi possível verificar o status do pagamento')
      }
      
      const data = await response.json()
      
      if (data.status === 'PAID') {
        setPaymentStatus('confirmed')
        
        // Redirecionamento após 2 segundos
        setTimeout(() => {
          router.push(`/pagamento/sucesso?type=event&entityId=${eventId}`)
        }, 2000)
      } else if (data.status === 'FAILED' || data.status === 'EXPIRED' || data.status === 'CANCELED') {
        setPaymentStatus('failed')
        setError('Pagamento não aprovado ou expirado')
      } else {
        // Pagamento ainda pendente
        setPaymentStatus('pending')
      }
    } catch (err) {
      setPaymentStatus('failed')
      setError('Erro ao verificar o status do pagamento')
    } finally {
      setChecking(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error || !payment) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Card>
          <CardHeader>
            <CardTitle>Erro ao carregar pagamento</CardTitle>
            <CardDescription>{error || 'Não foi possível carregar os detalhes do pagamento'}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.back()} className="w-full">
              Voltar
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-md mx-auto">
        <Card>
          <CardHeader className="text-center">
            <CardTitle>Pagamento via PIX</CardTitle>
            <CardDescription>
              Escaneie o QR Code abaixo ou copie o código PIX
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {paymentStatus === 'confirmed' ? (
              <div className="flex flex-col items-center py-6">
                <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
                <h3 className="text-xl font-semibold text-green-600">Pagamento Confirmado!</h3>
                <p className="text-gray-500 mt-2">Redirecionando para a página de confirmação...</p>
              </div>
            ) : (
              <>
                <div className="flex flex-col items-center">
                  <div className="bg-white p-4 rounded-lg border mb-4">
                    {payment.qrCode ? (
                      // Abordagem híbrida para o QR code:
                      // 1. Usar qrCodeBase64 do gateway se disponível
                      // 2. Caso contrário, gerar via QR Server API
                      <div className="relative w-48 h-48 overflow-hidden">
                        <img 
                          src={payment.qrCodeBase64 || 
                            `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(payment.qrCode)}`}
                          alt="QR Code PIX" 
                          className="w-full h-full object-contain"
                          onError={(e) => {
                            console.log("Erro ao carregar QR code, tentando fallback");
                            // Tentar usar diretamente a API QR Server se a imagem base64 falhar
                            if ((e.target as HTMLImageElement).src !== `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(payment.qrCode)}`) {
                              (e.target as HTMLImageElement).src = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(payment.qrCode)}`;
                            } else {
                              // Se já estamos usando QR Server e ainda falhou, mostrar placeholder
                              (e.target as HTMLImageElement).src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 200 200'%3E%3Crect width='200' height='200' fill='%23f0f0f0'/%3E%3Ctext x='50%25' y='50%25' font-family='Arial' font-size='12' text-anchor='middle' dominant-baseline='middle' fill='%23666'%3EPara pagar, copie o código abaixo%3C/text%3E%3C/svg%3E";
                            }
                          }}
                        />
                      </div>
                    ) : (
                      <div className="w-48 h-48 flex items-center justify-center bg-gray-100">
                        <QrCode className="h-16 w-16 text-gray-400" />
                      </div>
                    )}
                  </div>
                  
                  <div className="text-center">
                    <p className="text-sm text-gray-500 mb-2">Valor a pagar</p>
                    <p className="text-2xl font-bold text-green-600">
                      {formatCurrency(payment.amount)}
                    </p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <p className="text-sm text-center text-gray-500">
                    Código PIX copia e cola
                  </p>
                  
                  <div className="flex items-center">
                    <div className="flex-1 p-3 bg-gray-50 rounded-l-md border-l border-y text-sm font-mono overflow-hidden whitespace-nowrap overflow-ellipsis">
                      {payment.qrCode}
                    </div>
                    <button 
                      onClick={handleCopyPixCode}
                      className="p-3 bg-gray-100 rounded-r-md border flex items-center justify-center"
                    >
                      {copied ? <CheckCircle className="h-5 w-5 text-green-500" /> : <Copy className="h-5 w-5" />}
                    </button>
                  </div>
                </div>
                
                <div className="space-y-3 pt-4">
                  <Button 
                    onClick={handleCheckStatus} 
                    className="w-full flex items-center justify-center gap-2"
                    disabled={checking}
                  >
                    {checking ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Verificando...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-4 w-4" />
                        Verificar Status do Pagamento
                      </>
                    )}
                  </Button>
                  
                  <Button variant="outline" onClick={() => router.back()} className="w-full">
                    Voltar
                  </Button>
                </div>
              </>
            )}
            
            <div className="text-sm text-gray-500 text-center">
              <p>Após o pagamento, a confirmação pode levar alguns instantes.</p>
              <p>Seu protocolo: <span className="font-medium">{payment.protocol}</span></p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
