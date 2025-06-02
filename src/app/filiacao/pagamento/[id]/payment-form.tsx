"use client"

import React, { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { CreditCardForm } from "@/components/payment/CreditCardForm"
import PixDisplay from "@/components/payment/PixDisplay"
import BoletoDisplay from "@/components/payment/BoletoDisplay"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { toast } from "react-hot-toast"
import { Registration } from "@prisma/client"
import { PaymentMethod, PaymentStatus } from "@prisma/client"
import { Loader2, CreditCard, QrCode, Receipt, AlertCircle } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { EntityType } from "@/lib/payment/types"

interface PaymentFormProps {
  paymentId: string;
  athleteId?: string;
  clubId?: string;
  paymentType: string;
  amount: number;
}

interface CardData {
  number: string;
  holderName: string;
  expiryMonth: string;
  expiryYear: string;
  cvv: string;
  installments: number;
}

interface RegistrationData {
  name: string;
  email: string;
  cpf: string;
  phone?: string;
  description: string;
}

export function PaymentForm({
  paymentId,
  athleteId,
  clubId,
  paymentType,
  amount,
}: PaymentFormProps) {
  const router = useRouter();
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDataReady, setIsDataReady] = useState(false);
  const [pixCode, setPixCode] = useState<string | null>(null);
  const [boletoUrl, setBoletoUrl] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | null>(null);
  const [registrationData, setRegistrationData] = useState<RegistrationData | null>(null);
  const intervalRef = React.useRef<NodeJS.Timeout | null>(null);
  
  // Buscar dados do atleta ou clube
  useEffect(() => {
    async function fetchRegistrationData() {
      if (!paymentId) return;
      
      try {
        let response;
        if (athleteId) {
          console.log("Buscando dados do atleta:", athleteId);
          response = await fetch(`/api/athletes/${athleteId}`);
        } else if (clubId) {
          console.log("Buscando dados do clube:", clubId);
          response = await fetch(`/api/clubs/${clubId}`);
        } else {
          throw new Error('ID de atleta ou clube não fornecido');
        }

        if (!response.ok) {
          const errorText = await response.text();
          console.error("Erro na resposta da API:", errorText);
          throw new Error('Não foi possível carregar os dados do registro');
        }

        const data = await response.json();
        console.log("Dados recebidos da API:", data);
        
        // Formatando os dados para exibição
        const modalitiesText = data.modalities && data.modalities.length > 0 
          ? data.modalities.join(', ') 
          : 'Não especificada';
          
        const categoryText = data.category || 'Não especificada';
        const clubText = data.clubName || 'Individual';
        
        // Criando uma descrição mais completa
        const description = `Filiação de atleta: ${data.fullName || 'Nome não disponível'}\nModalidade(s): ${modalitiesText}\nCategoria: ${categoryText}\nClube: ${clubText}`;
        
        setRegistrationData({
          name: data.fullName || data.clubName || 'Nome não encontrado',
          email: data.email || data.User?.email || 'Email não disponível',
          cpf: data.cpf || data.cnpj || '',
          phone: data.phone || '',
          description: description // Adicionando a descrição formatada
        });

        setIsDataReady(true);
      } catch (error) {
        console.error('Erro ao buscar dados:', error);
        // Mesmo com erro, seguimos para mostrar o formulário
        setIsDataReady(true);
      }
    }

    fetchRegistrationData();
  }, [athleteId, clubId, paymentId]);

  // Função de redirecionamento após pagamento bem-sucedido
  const onPaymentSuccess = (status: PaymentStatus) => {
    // Redirecionar com base no tipo de pagamento
    if (athleteId) {
      router.push(`/filiacao/atletas/sucesso?id=${athleteId}&status=${status}`);
    } else if (clubId) {
      router.push(`/filiacao/clubes/sucesso?id=${clubId}&status=${status}`);
    }
  };

  // Função em caso de falha no pagamento
  const onPaymentFailure = () => {
    // Apenas exibe a mensagem de erro (já tratado pelo toast)
  };

  const checkPaymentStatus = useCallback(async () => {
    try {
      // Corrigindo o endpoint para o que realmente existe no sistema
      const response = await fetch(`/api/payments/${paymentId}`);
      if (!response.ok) {
        console.error("Erro ao verificar status do pagamento");
        return;
      }
      const data = await response.json();
      console.log("Dados do pagamento recebidos:", data);
      if (data.status && data.status !== PaymentStatus.PENDING) {
        setPaymentStatus(data.status);
        if (intervalRef.current) clearInterval(intervalRef.current);
        if (data.status === PaymentStatus.PAID) {
          toast.success("Pagamento aprovado!");
          onPaymentSuccess(data.status);
        } else {
          toast.error(`Pagamento ${data.status}. Tente novamente.`);
          onPaymentFailure();
        }
      }
    } catch (error) {
      console.error("Erro ao verificar status do pagamento:", error);
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
  }, [paymentId, router, athleteId, clubId]);

  useEffect(() => {
    if ((pixCode || boletoUrl) && paymentStatus === null) {
      setPaymentStatus(PaymentStatus.PENDING); 
      intervalRef.current = setInterval(checkPaymentStatus, 5000); 
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [pixCode, boletoUrl, checkPaymentStatus, paymentStatus]);

  const handlePixSubmit = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/payments/pix", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentId, 
          amount,
          description: registrationData?.description || 'Não informado',
          payerEmail: registrationData?.email,
          payerName: registrationData?.name,
          payerDocument: registrationData?.cpf
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro ao gerar PIX");
      }

      const data = await response.json();
      setPixCode(data.qr_code);
      toast.success("Código PIX gerado com sucesso!");
    } catch (error: any) {
      console.error("Erro ao gerar PIX:", error);
      toast.error(error.message || "Falha ao gerar PIX.");
      onPaymentFailure();
    } finally {
      setIsLoading(false);
    }
  };

  const handleBoletoSubmit = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/payments/boleto", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentId, 
          amount,
          description: registrationData?.description || 'Não informado',
          payerName: registrationData?.name,
          payerEmail: registrationData?.email,
          payerDocument: registrationData?.cpf,
          payerPhone: registrationData?.phone
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro ao gerar Boleto");
      }

      const data = await response.json();
      setBoletoUrl(data.boleto_url);
      toast.success("Boleto gerado com sucesso!");
    } catch (error: any) {
      console.error("Erro ao gerar Boleto:", error);
      toast.error(error.message || "Falha ao gerar Boleto.");
      onPaymentFailure();
    } finally {
      setIsLoading(false);
    }
  };

  const handleCardSubmit = async (cardData: CardData) => {
    setIsLoading(true);

    try {
      const response = await fetch("/api/payments/card", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentId,
          amount,
          description: registrationData?.description || 'Não informado',
          paymentMethod: PaymentMethod.CREDIT_CARD,
          // Renomeado para 'card' para corresponder à validação da API
          card: {
            number: cardData.number,
            holderName: cardData.holderName,
            expiryMonth: cardData.expiryMonth,
            expiryYear: cardData.expiryYear,
            cvv: cardData.cvv,
            installments: cardData.installments,
          },
          // Adicionar metadados para identificar o tipo de entidade corretamente
          metadata: {
            type: paymentType, // 'ATHLETE' ou 'CLUB' 
            entityId: paymentType === 'ATHLETE' ? athleteId : clubId
          },
          // Renomeado para 'customer' para corresponder à validação da API
          customer: {
            email: registrationData?.email,
            firstName: registrationData?.name?.split(' ')[0] || '',
            lastName: registrationData?.name?.split(' ').slice(1).join(' ') || '',
            identification: {
                type: 'CPF', 
                number: registrationData?.cpf 
            },
            address: { 
            }
          }
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("API Error Data:", errorData);
        throw new Error(errorData.error || "Erro ao processar pagamento com cartão");
      }

      const data = await response.json();
      setPaymentStatus(data.status);

      if (data.status === PaymentStatus.PAID) {
        toast.success("Pagamento com cartão aprovado!");
        onPaymentSuccess(data.status);
      } else {
        toast.error(`Pagamento ${data.status}. Verifique os dados ou tente outro cartão.`);
        onPaymentFailure();
      }
    } catch (error: any) {
      console.error("Erro ao processar pagamento com cartão:", error);
      toast.error(error.message || "Falha no pagamento com cartão.");
      onPaymentFailure();
    } finally {
      setIsLoading(false);
    }
  };

  const renderPaymentMethod = () => {
    if (!selectedPaymentMethod) {
      return <p>Selecione uma forma de pagamento.</p>;
    }
    
    switch (selectedPaymentMethod) {
      case PaymentMethod.CREDIT_CARD:
      case PaymentMethod.DEBIT_CARD: 
        return (
          <CreditCardForm
            onSubmit={handleCardSubmit} 
            amount={amount}
            paymentMethod={PaymentMethod.CREDIT_CARD} 
            loading={isLoading}
            entityType={paymentType === 'ATHLETE' ? EntityType.ATHLETE : paymentType === 'CLUB' ? EntityType.CLUB : EntityType.EVENT}
          />
        );
      case PaymentMethod.PIX:
        if (pixCode) {
          return <PixDisplay qrCode={pixCode} amount={amount} status={paymentStatus} />;
        } else {
          return (
            <Button onClick={handlePixSubmit} disabled={isLoading} className="w-full">
              {isLoading ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Gerando PIX...</>
              ) : (
                "Gerar Código PIX"
              )}
            </Button>
          );
        }
      case PaymentMethod.BOLETO:
        if (boletoUrl) {
          return <BoletoDisplay url={boletoUrl} amount={amount} status={paymentStatus} />;
        } else {
          return (
            <Button onClick={handleBoletoSubmit} disabled={isLoading} className="w-full">
              {isLoading ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Gerando Boleto...</>
              ) : (
                "Gerar Boleto"
              )}
            </Button>
          );
        }
      default:
        return <p>Selecione uma forma de pagamento.</p>;
    }
  };

  const handlePaymentMethodChange = (method: PaymentMethod) => {
    setSelectedPaymentMethod(method);
    setPixCode(null); 
    setBoletoUrl(null);
    setPaymentStatus(null);
    if (intervalRef.current) clearInterval(intervalRef.current); 
  };

  // Estado de carregamento ou erro
  if (!isDataReady) {
    return (
      <div className="flex justify-center items-center h-60">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Se chegou aqui, registration já está disponível
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Forma de Pagamento</CardTitle>
          <CardDescription>Escolha como deseja pagar sua filiação</CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={selectedPaymentMethod || ''}
            onValueChange={(value) => handlePaymentMethodChange(value as PaymentMethod)}
            className="space-y-4"
          >
            <div className="flex items-center space-x-4 p-4 border rounded-lg">
              <RadioGroupItem value={PaymentMethod.PIX} id="pix" disabled={isLoading || !!(pixCode || boletoUrl)} />
              <Label htmlFor="pix" className="flex-1">
                <div className="font-medium">PIX</div>
                <div className="text-sm text-gray-600">Pagamento instantâneo</div>
              </Label>
              <QrCode className="h-6 w-6 text-blue-500" />
            </div>

            <div className="flex items-center space-x-4 p-4 border rounded-lg">
              <RadioGroupItem value={PaymentMethod.BOLETO} id="boleto" disabled={isLoading || !!(pixCode || boletoUrl)} />
              <Label htmlFor="boleto" className="flex-1">
                <div className="font-medium">Boleto Bancário</div>
                <div className="text-sm text-gray-600">Prazo de 1-3 dias úteis</div>
              </Label>
              <Receipt className="h-6 w-6 text-blue-500" />
            </div>

            <div className="flex items-center space-x-4 p-4 border rounded-lg">
              <RadioGroupItem value={PaymentMethod.CREDIT_CARD} id="credit_card" disabled={isLoading} />
              <Label htmlFor="credit_card" className="flex-1">
                <div className="font-medium">Cartão de Crédito</div>
                <div className="text-sm text-gray-600">Pagamento online</div>
              </Label>
              <CreditCard className="h-6 w-6 text-blue-500" />
            </div>
          </RadioGroup>
          
          {selectedPaymentMethod === PaymentMethod.CREDIT_CARD && (
            <div className="mt-4 space-y-4 border rounded-lg p-4">
              <h3 className="text-sm font-medium mb-3">Dados do Cartão</h3>
              {renderPaymentMethod()}
            </div>
          )}
          
          {/* Exibir QR Code PIX ou Link do Boleto quando gerados */}
          {(selectedPaymentMethod === PaymentMethod.PIX || selectedPaymentMethod === PaymentMethod.BOLETO) && (
            <div className="mt-4">
              {renderPaymentMethod()}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Mensagem de status final */}
      {paymentStatus && paymentStatus !== PaymentStatus.PENDING && (
        <div className={`mt-4 p-4 rounded-md ${paymentStatus === PaymentStatus.PAID ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          Status do Pagamento: <strong>{paymentStatus}</strong>
        </div>
      )}
    </>
  );
}
