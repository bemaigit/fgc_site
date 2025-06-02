'use client'

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { PricingTier } from "@/types/event-details"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Input } from "@/components/ui/input"
import { useState, useEffect } from "react"
import { Tag } from "lucide-react"

interface MiniCheckoutProps {
  tier: PricingTier
  onProceed: () => void
  disabled?: boolean
  disabledReason?: string
  onApplyCoupon?: (couponCode: string) => Promise<number | null>
  appliedCoupon?: { code: string, discount: number } | null
  originalPrice?: number
  currentParticipants?: number
}

export function MiniCheckout({ 
  tier, 
  onProceed, 
  disabled, 
  disabledReason, 
  onApplyCoupon, 
  appliedCoupon, 
  originalPrice, 
  currentParticipants 
}: MiniCheckoutProps) {
  // DEBUG: log slots info
  console.log('MiniCheckout slots debug:', { maxEntries: tier.maxEntries, currentParticipants });
  const [couponCode, setCouponCode] = useState('')
  const [appliedDiscount, setAppliedDiscount] = useState<number | null>(null)
  const [discountedPrice, setDiscountedPrice] = useState<number | null>(null)
  const [applyingCoupon, setApplyingCoupon] = useState(false)
  const [couponError, setCouponError] = useState<string | null>(null)
  const [appliedCouponCode, setAppliedCouponCode] = useState<string | null>(null)

  useEffect(() => {
    if (appliedCoupon) {
      setAppliedDiscount(appliedCoupon.discount);
      setAppliedCouponCode(appliedCoupon.code);
    } else if (!appliedCoupon && appliedCouponCode) {
      removeCoupon();
    }
  }, [appliedCoupon, tier.price]);

  const handleApplyCoupon = async () => {
    if (!couponCode || !onApplyCoupon) return;
    
    try {
      setApplyingCoupon(true);
      setCouponError(null);
      
      const discount = await onApplyCoupon(couponCode);
      
      if (discount !== null) {
        setAppliedDiscount(discount);
        const discounted = tier.price * (1 - discount / 100);
        setDiscountedPrice(discounted);
        setAppliedCouponCode(couponCode);
        setCouponCode('');
      } else {
        setCouponError('Cupom inválido ou expirado');
      }
    } catch (error) {
      console.error('Erro ao aplicar cupom:', error);
      setCouponError('Erro ao aplicar cupom');
    } finally {
      setApplyingCoupon(false);
    }
  };

  const removeCoupon = () => {
    setAppliedDiscount(null);
    setDiscountedPrice(null);
    setAppliedCouponCode(null);
    setCouponError(null);
  };

  return (
    <Card>
      <CardContent className="p-6">
        <h2 className="text-xl font-bold mb-4">Inscrição</h2>
        
        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-500">Lote atual</p>
            <p className="text-lg font-medium">{tier.name}</p>
          </div>

          <div className="space-y-1">
            <p className="text-sm text-gray-500">Valor</p>
            
            {appliedCoupon && originalPrice ? (
              <>
                <p className="text-gray-400 line-through text-sm">
                  R$ {originalPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-2xl font-bold text-green-600">
                  R$ {tier.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-sm text-green-600">
                  Desconto de {appliedCoupon.discount}% aplicado
                </p>
              </>
            ) : (
              <p className="text-2xl font-bold text-green-600">
                R$ {tier.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            )}
          </div>

          <div>
            <p className="text-sm text-gray-500">Disponível até</p>
            <p className="text-sm">
              {format(tier.endDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </p>
          </div>

          {tier.maxEntries && (
            <div>
              <p className="text-sm text-gray-500">Vagas Restantes</p>
              <p className="text-sm">
                {Math.max(tier.maxEntries - (currentParticipants || 0), 0)}
              </p>
            </div>
          )}

          {onApplyCoupon && (
            <div className="space-y-2">
              {appliedCouponCode ? (
                <div className="mt-2 flex items-center bg-green-50 p-2 rounded text-sm gap-1">
                  <Tag size={16} className="text-green-600" />
                  <span className="font-medium">Cupom {appliedCouponCode} aplicado</span>
                  <button 
                    onClick={removeCoupon} 
                    className="ml-auto text-xs text-red-600 hover:underline"
                  >
                    Remover
                  </button>
                </div>
              ) : (
                <>
                  <p className="text-sm text-gray-500">Cupom de desconto</p>
                  <div className="flex gap-2">
                    <Input
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      placeholder="Digite o código"
                      className="flex-1"
                    />
                    <Button 
                      variant="outline" 
                      onClick={handleApplyCoupon} 
                      disabled={!couponCode || applyingCoupon}
                      className="whitespace-nowrap"
                    >
                      {applyingCoupon ? 'Aplicando...' : 'Aplicar'}
                    </Button>
                  </div>
                  {couponError && (
                    <p className="text-xs text-red-500 mt-1">{couponError}</p>
                  )}
                </>
              )}
            </div>
          )}

          <Button 
            className="w-full" 
            onClick={onProceed}
            disabled={disabled}
          >
            Inscrever-se
          </Button>

          {disabledReason && disabled && (
            <p className="text-sm text-gray-500 text-center">
              {disabledReason}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
