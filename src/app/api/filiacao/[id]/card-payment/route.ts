import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PaymentStatus } from "@prisma/client";
import { createPaymentGateway } from "@/lib/payment/factory";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      );
    }

    const { id } = params;
    const { cardToken, installments, holderName, expiryMonth, expiryYear } = await request.json();

    if (!cardToken) {
      return NextResponse.json(
        { error: "Token do cartão é obrigatório" },
        { status: 400 }
      );
    }

    // Buscar o pagamento
    const payment = await prisma.payment.findUnique({
      where: { id },
      include: {
        gateway: true,
      },
    });

    if (!payment) {
      return NextResponse.json(
        { error: "Pagamento não encontrado" },
        { status: 404 }
      );
    }

    // Verificar se o gateway existe
    if (!payment.gateway) {
      return NextResponse.json(
        { error: "Gateway de pagamento não configurado" },
        { status: 400 }
      );
    }

    // Criar gateway de pagamento
    const gateway = createPaymentGateway(payment.gateway.provider, {
      credentials: payment.gateway.credentials,
      sandbox: payment.gateway.sandbox,
    });

    // Processar pagamento com cartão
    const result = await gateway.processCardPayment({
      id: payment.id,
      cardToken,
      installments: installments || 1,
      holderName,
      expiryMonth,
      expiryYear,
    });

    // Atualizar status do pagamento
    await prisma.payment.update({
      where: { id },
      data: {
        status: result.status,
        paymentUrl: result.paymentUrl,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Erro ao processar pagamento com cartão:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro desconhecido" },
      { status: 500 }
    );
  }
}
