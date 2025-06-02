"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Loader2, CreditCard, CheckCircle, AlertCircle } from "lucide-react"
import { formatCurrency } from "@/lib/format-utils"

interface PageProps {
  params: { id: string }
}

interface CardPaymentDetails {
  id: string
  protocol: string
  amount: number
  installments?: number
}

export default function CreditCardPaymentPage({ params }: PageProps) {
  const router = useRouter()
  const eventId = params.id
  const searchParams = useSearchParams()
  const paymentId = searchParams.get('payment')
  const protocol = searchParams.get('protocol')
  const amountParam = searchParams.get('amount')
  
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [payment, setPayment] = useState<CardPaymentDetails | null>(null)
  
  // Dados do cartão
  const [cardNumber, setCardNumber] = useState("")
  const [cardName, setCardName] = useState("")
  const [expiryDate, setExpiryDate] = useState("")
  const [cvv, setCvv] = useState("")
  const [installments, setInstallments] = useState("1")
  
  useEffect(() => {
    if (!paymentId || !protocol || !amountParam) {
      setError('Informações de pagamento incompletas')
      return
    }

    const amount = parseFloat(amountParam)
    if (isNaN(amount)) {
      setError('Valor de pagamento inválido')
      return
    }

    // Buscar detalhes do pagamento
    fetch(`/api/payments?id=${paymentId}`)
      .then(response => {
        if (!response.ok) {
          throw new Error('Não foi possível carregar os detalhes do pagamento')
        }
        return response.json()
      })
      .then(data => {
        setPayment({
          id: data.id,
          protocol: data.protocol,
          amount: data.amount,
          installments: data.installments || 1
        })
        
        if (data.installments) {
          setInstallments(data.installments.toString())
        }
      })
      .catch(err => {
        setError(err instanceof Error ? err.message : 'Erro ao carregar detalhes do pagamento')
      })
  }, [paymentId, protocol, amountParam])

  const formatCardNumber = (value: string) => {
    // Remove todos os espaços e caracteres não numéricos
    const numbers = value.replace(/\D/g, '')
    
    // Limita a 16 dígitos
    const truncated = numbers.slice(0, 16)
    
    // Formata em grupos de 4
    const formatted = truncated.replace(/(\d{4})(?=\d)/g, '$1 ')
    
    return formatted
  }

  const formatExpiryDate = (value: string) => {
    // Remove todos os caracteres não numéricos
    const numbers = value.replace(/\D/g, '')
    
    // Limita a 4 dígitos
    const truncated = numbers.slice(0, 4)
    
    // Formata como MM/YY
    if (truncated.length > 2) {
      return `${truncated.slice(0, 2)}/${truncated.slice(2)}`
    }
    
    return truncated
  }

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCardNumber(formatCardNumber(e.target.value))
  }

  const handleExpiryDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setExpiryDate(formatExpiryDate(e.target.value))
  }

  const validateForm = () => {
    // Validação básica do cartão
    if (cardNumber.replace(/\s/g, '').length !== 16) {
      setError('Número de cartão inválido')
      return false
    }
    
    if (!cardName.trim()) {
      setError('Nome no cartão é obrigatório')
      return false
    }
    
    if (expiryDate.length !== 5) {
      setError('Data de validade inválida')
      return false
    }
    
    const [month, year] = expiryDate.split('/')
    const currentYear = new Date().getFullYear() % 100
    const currentMonth = new Date().getMonth() + 1
    
    if (parseInt(year) < currentYear || (parseInt(year) === currentYear && parseInt(month) < currentMonth)) {
      setError('Cartão expirado')
      return false
    }
    
    if (cvv.length < 3) {
      setError('CVV inválido')
      return false
    }
    
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    
    if (!validateForm() || !payment) return
    
    setProcessing(true)
    
    try {
      // Em um ambiente real, enviaríamos os dados do cartão para tokenização
      // e depois processaríamos o pagamento com o token
      
      // Simular tokenização do cartão (em produção, usaríamos a SDK do PagSeguro)
      const cardToken = `simulated-token-${Date.now()}`
      
      // Atualizar o pagamento com os dados do cartão
      const response = await fetch(`/api/payments/gateway/credit-card`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          paymentId: payment.id,
          cardData: {
            token: cardToken,
            installments: parseInt(installments),
            holderName: cardName,
            expiryMonth: expiryDate.split('/')[0],
            expiryYear: `20${expiryDate.split('/')[1]}`
          }
        })
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.message || 'Erro ao processar pagamento')
      }
      
      if (result.status === 'PAID') {
        setSuccess(true)
        
        // Redirecionamento após 2 segundos
        setTimeout(() => {
          router.push(`/pagamento/sucesso?type=event&entityId=${eventId}`)
        }, 2000)
      } else if (result.status === 'PENDING') {
        // Pagamento em análise
        setSuccess(true)
        setTimeout(() => {
          router.push(`/pagamento/pendente?payment=${payment.id}&type=event&entityId=${eventId}`)
        }, 2000)
      } else {
        setError('Transação recusada pela operadora do cartão. Verifique os dados ou tente outro método de pagamento.')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao processar pagamento')
    } finally {
      setProcessing(false)
    }
  }

  if (error && !payment) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Card>
          <CardHeader>
            <CardTitle>Erro ao carregar pagamento</CardTitle>
            <CardDescription>{error}</CardDescription>
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
            <CardTitle>Pagamento com Cartão de Crédito</CardTitle>
            <CardDescription>
              Preencha os dados do seu cartão para finalizar o pagamento
            </CardDescription>
          </CardHeader>
          
          {success ? (
            <CardContent className="space-y-6">
              <div className="flex flex-col items-center py-6">
                <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
                <h3 className="text-xl font-semibold text-green-600">Pagamento Aprovado!</h3>
                <p className="text-gray-500 mt-2">Redirecionando para a página de confirmação...</p>
              </div>
            </CardContent>
          ) : (
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {payment && (
                  <div className="bg-gray-50 p-4 rounded-lg mb-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">Valor total:</span>
                      <span className="text-lg font-semibold text-green-600">{formatCurrency(payment.amount)}</span>
                    </div>
                    
                    {parseInt(installments) > 1 && (
                      <div className="flex justify-between items-center mt-1">
                        <span className="text-sm text-gray-500">Parcelas:</span>
                        <span className="text-sm">{installments}x de {formatCurrency(payment.amount / parseInt(installments))}</span>
                      </div>
                    )}
                  </div>
                )}
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="cardNumber">Número do Cartão</Label>
                    <div className="relative">
                      <Input
                        id="cardNumber"
                        placeholder="0000 0000 0000 0000"
                        value={cardNumber}
                        onChange={handleCardNumberChange}
                        className="pl-10"
                        required
                      />
                      <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="cardName">Nome no Cartão</Label>
                    <Input
                      id="cardName"
                      placeholder="Nome como está no cartão"
                      value={cardName}
                      onChange={(e) => setCardName(e.target.value.toUpperCase())}
                      required
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="expiryDate">Validade</Label>
                      <Input
                        id="expiryDate"
                        placeholder="MM/AA"
                        value={expiryDate}
                        onChange={handleExpiryDateChange}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="cvv">CVV</Label>
                      <Input
                        id="cvv"
                        placeholder="123"
                        value={cvv}
                        onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="installments">Parcelas</Label>
                    <Select value={installments} onValueChange={setInstallments}>
                      <SelectTrigger id="installments">
                        <SelectValue placeholder="Selecione o número de parcelas" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1x sem juros</SelectItem>
                        <SelectItem value="2">2x sem juros</SelectItem>
                        <SelectItem value="3">3x sem juros</SelectItem>
                        <SelectItem value="6">6x sem juros</SelectItem>
                        <SelectItem value="12">12x com juros</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                {error && (
                  <div className="bg-red-50 p-3 rounded-md flex items-start gap-2 text-red-600">
                    <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}
                
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={processing}
                >
                  {processing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processando...
                    </>
                  ) : (
                    'Finalizar Pagamento'
                  )}
                </Button>
              </form>
            </CardContent>
          )}
          
          <CardFooter className="flex flex-col space-y-4">
            <Separator />
            <div className="text-xs text-gray-500 text-center">
              <p>Seus dados estão protegidos por criptografia de ponta a ponta.</p>
              <p>Protocolo: {payment?.protocol}</p>
            </div>
            
            {!processing && !success && (
              <Button variant="outline" onClick={() => router.back()} className="w-full">
                Voltar
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
