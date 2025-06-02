"use client"

import React, { useState, useEffect } from "react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { PaymentMethod } from "@prisma/client"
import { InstallmentOption } from "@/lib/payment/types"
import { EntityType } from "@/lib/payment/types"

interface CreditCardFormProps {
  onSubmit: (cardData: {
    number: string;
    holderName: string;
    expiryMonth: string;
    expiryYear: string;
    cvv: string;
    installments: number;
  }) => Promise<void>;
  amount: number;
  paymentMethod: PaymentMethod;
  loading: boolean;
  entityType?: EntityType; // Tipo de entidade opcional (ATHLETE, CLUB, EVENT)
}

export function CreditCardForm({ onSubmit, amount, paymentMethod, loading, entityType = EntityType.EVENT }: CreditCardFormProps) {
  const [cardNumber, setCardNumber] = useState("")
  const [holderName, setHolderName] = useState("")
  const [expiry, setExpiry] = useState("")
  const [cvv, setCvv] = useState("")
  const [installments, setInstallments] = useState(1)
  const [installmentOptions, setInstallmentOptions] = useState<InstallmentOption[]>([])
  const [loadingInstallments, setLoadingInstallments] = useState(false)
  
  // Buscar opções de parcelamento do gateway
  useEffect(() => {
    const fetchInstallmentOptions = async () => {
      if (amount <= 0 || paymentMethod !== PaymentMethod.CREDIT_CARD) return;
      
      try {
        setLoadingInstallments(true);
        const response = await fetch(
          `/api/payments/installments?amount=${amount}&entityType=${entityType}`
        );
        
        if (!response.ok) {
          throw new Error('Erro ao buscar opções de parcelamento');
        }
        
        const data = await response.json();
        setInstallmentOptions(data.installmentOptions || []);
      } catch (error) {
        console.error('Erro ao buscar opções de parcelamento:', error);
        // Fallback para opções básicas sem juros em caso de erro
        const defaultOptions = [1, 2, 3, 6, 12].map(option => ({
          installments: option,
          installmentAmount: amount / option,
          totalAmount: amount,
          message: `${option}x de ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(amount / option)}${option === 1 ? ' à vista' : ''}`
        }));
        setInstallmentOptions(defaultOptions);
      } finally {
        setLoadingInstallments(false);
      }
    };
    
    fetchInstallmentOptions();
  }, [amount, paymentMethod])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Extrair mês e ano da data de validade
    const [expiryMonth, expiryYear] = expiry.split("/")
    
    onSubmit({
      number: cardNumber.replace(/\s/g, ""),
      holderName,
      expiryMonth,
      expiryYear: `20${expiryYear}`,
      cvv,
      installments
    })
  }
  
  // Formatação do número do cartão
  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "")
    const matches = v.match(/\d{4,16}/g)
    const match = (matches && matches[0]) || ""
    const parts = []
    
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4))
    }
    
    if (parts.length) {
      return parts.join(" ")
    } else {
      return value
    }
  }
  
  // Formatação da data de validade
  const formatExpiry = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "")
    
    if (v.length >= 2) {
      return `${v.substring(0, 2)}/${v.substring(2, 4)}`
    }
    
    return v
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="card-number">Número do Cartão</Label>
        <Input 
          id="card-number" 
          value={cardNumber}
          onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
          placeholder="1234 5678 9012 3456"
          maxLength={19}
          required
        />
      </div>
      
      <div>
        <Label htmlFor="holder-name">Nome no Cartão</Label>
        <Input 
          id="holder-name" 
          value={holderName}
          onChange={(e) => setHolderName(e.target.value.toUpperCase())}
          placeholder="NOME COMO ESTÁ NO CARTÃO"
          required
        />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="expiry">Validade</Label>
          <Input 
            id="expiry" 
            value={expiry}
            onChange={(e) => setExpiry(formatExpiry(e.target.value))}
            placeholder="MM/AA"
            maxLength={5}
            required
          />
        </div>
        
        <div>
          <Label htmlFor="cvv">CVV</Label>
          <Input 
            id="cvv" 
            value={cvv}
            onChange={(e) => setCvv(e.target.value.replace(/\D/g, ""))}
            placeholder="123"
            maxLength={4}
            required
          />
        </div>
      </div>
      
      {paymentMethod === PaymentMethod.CREDIT_CARD && (
        <div>
          <Label htmlFor="installments">Parcelamento</Label>
          <select 
            id="installments" 
            className="w-full p-2 border rounded"
            value={installments}
            onChange={(e) => setInstallments(Number(e.target.value))}
            disabled={loadingInstallments}
          >
            {loadingInstallments ? (
              <option>Carregando opções de parcelamento...</option>
            ) : installmentOptions.length > 0 ? (
              installmentOptions.map(option => (
                <option key={option.installments} value={option.installments}>
                  {option.message}
                </option>
              ))
            ) : (
              // Fallback se não houver opções
              <option value={1}>1x de {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(amount)} à vista</option>
            )}
          </select>
          {loadingInstallments && (
            <div className="mt-1 text-xs text-gray-500 flex items-center">
              <Loader2 className="h-3 w-3 animate-spin mr-1" />
              <span>Calculando juros e parcelamento...</span>
            </div>
          )}
        </div>
      )}
      
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processando...
          </>
        ) : (
          "Finalizar Pagamento"
        )}
      </Button>
    </form>
  )
}
