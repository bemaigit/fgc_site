import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { PaymentMethod, PaymentStatus, PaymentProvider, CreatePaymentInput } from "@/lib/payment/types";
import { paymentGatewayService } from "@/lib/payment/gateway";
import { v4 as uuidv4 } from "uuid";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { paymentId, amount, description, payerEmail, payerName, payerDocument } = body;

    if (!paymentId) {
      return NextResponse.json(
        { error: "ID do pagamento é obrigatório" },
        { status: 400 }
      );
    }

    // Buscar o pagamento no banco
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        Athlete: true,
        Club: true,
      },
    });

    if (!payment) {
      return NextResponse.json(
        { error: "Pagamento não encontrado" },
        { status: 404 }
      );
    }

    // Obter o gateway de pagamento configurado (Mercado Pago)
    let gateway;
    try {
      gateway = await paymentGatewayService.getActiveGateway();
      
      if (!gateway) {
        return NextResponse.json(
          { error: "Gateway de pagamento não configurado" },
          { status: 500 }
        );
      }
    } catch (gatewayError) {
      console.error("Erro ao obter gateway de pagamento:", gatewayError);
      return NextResponse.json(
        { error: "Erro ao configurar gateway de pagamento" },
        { status: 500 }
      );
    }

    // Gerar um protocolo único para o pagamento
    const protocol = `PIX-${new Date().getFullYear()}-${uuidv4().substring(0, 8).toUpperCase()}`;

    // Preparar os dados para o gateway de pagamento
    const paymentData: CreatePaymentInput = {
      amount: Number(amount) || Number(payment.amount),
      description: description || "Pagamento de filiação",
      paymentMethod: PaymentMethod.PIX,
      customer: {
        email: payerEmail || payment.Athlete?.email || payment.Club?.email || "email@exemplo.com",
        name: payerName || payment.Athlete?.fullName || payment.Club?.clubName || "Nome não informado",
        document: payerDocument || payment.Athlete?.cpf || payment.Club?.cnpj || "00000000000",
      },
      metadata: {
        type: "MEMBERSHIP",
        entityId: payment.athleteId || payment.clubId || "",
        entityType: payment.athleteId ? "ATHLETE" : "CLUB",
        referenceCode: protocol
      }
    };

    console.log("Gerando pagamento PIX com dados:", paymentData);

    // Processar o pagamento com o gateway
    const paymentResult = await gateway.createPayment(paymentData);

    // Obter o ID do gateway de pagamento ativo
    const gatewayConfig = await prisma.paymentGatewayConfig.findFirst({
      where: { active: true },
      select: { id: true }
    });
    
    if (!gatewayConfig) {
      throw new Error("Gateway de pagamento não configurado");
    }
    
    // Registrar a transação no banco de dados
    const transaction = await prisma.paymentTransaction.create({
      data: {
        id: uuidv4(), // Gerar um ID único para a transação
        protocol,
        gatewayConfigId: gatewayConfig.id,
        entityId: payment.athleteId || payment.clubId || "",
        entityType: payment.athleteId ? "ATHLETE" : "CLUB",
        paymentMethod: PaymentMethod.PIX,
        amount: Number(amount) || Number(payment.amount),
        status: PaymentStatus.PENDING,
        externalId: paymentResult.id,
        paymentUrl: paymentResult.paymentUrl || "",
        metadata: {
          qrCode: paymentResult.qrCode || "",
          qrCodeBase64: paymentResult.qrCodeBase64 || "",
          source: "api_request",
        },
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 horas
        updatedAt: new Date(),
        athleteId: payment.athleteId || null,
      },
    });

    // Em ambiente de desenvolvimento, podemos simular o pagamento aprovado automaticamente
    if (process.env.NODE_ENV === "development" && process.env.AUTO_APPROVE_PAYMENTS === "true") {
      // Simular um pagamento aprovado após 5 segundos
      setTimeout(async () => {
        try {
          // Atualizar o status da transação
          await prisma.paymentTransaction.update({
            where: { id: transaction.id },
            data: {
              status: PaymentStatus.PAID,
              updatedAt: new Date(),
            },
          });

          // Atualizar o status do pagamento
          await prisma.payment.update({
            where: { id: payment.id },
            data: {
              status: PaymentStatus.PAID,
            },
          });

          console.log(`Pagamento PIX ${protocol} aprovado automaticamente (ambiente de desenvolvimento)`);
        } catch (error) {
          console.error("Erro ao aprovar pagamento automaticamente:", error);
        }
      }, 5000);
    }

    // Retornar os dados do PIX para o frontend
    return NextResponse.json({
      id: transaction.id,
      protocol: transaction.protocol,
      qr_code: paymentResult.qrCode || "",
      qr_code_base64: paymentResult.qrCodeBase64 || "",
      payment_url: paymentResult.paymentUrl || "",
      status: transaction.status,
      expires_at: transaction.expiresAt,
    });
  } catch (error) {
    console.error("Erro ao processar pagamento PIX:", error);
    return NextResponse.json(
      { error: "Erro ao processar pagamento PIX" },
      { status: 500 }
    );
  }
}
