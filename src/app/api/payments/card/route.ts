import { NextRequest, NextResponse } from "next/server"
import { v4 as uuidv4 } from "uuid"
import { PaymentMethod, PaymentStatus, PaymentProvider, PaymentGatewayConfig } from "@/lib/payment/types"
import { prisma } from "@/lib/prisma"
import { Prisma } from "@prisma/client"
import { getPaymentGateway } from "@/lib/payment/factory"

export async function POST(request: NextRequest) {
  try {
    const paymentData = await request.json()

    // Validação básica
    if (!paymentData.amount || !paymentData.card || !paymentData.customer) {
      return NextResponse.json(
        { message: "Dados de pagamento incompletos" },
        { status: 400 }
      )
    }

    // Gerar número de protocolo
    const date = new Date()
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const randomPart = Math.floor(1000 + Math.random() * 9000)
    
    const protocolNumber = `EVE-${year}${month}${day}-${randomPart}`
    
    // Determinar o tipo de entidade com base nos metadados
    const entityType = paymentData.metadata.type === "EVENT" ? "EVENT" : "ATHLETE"
    
    console.log(`Buscando gateway para o tipo de entidade: ${entityType}`)
    console.log(`Método de pagamento: ${paymentData.paymentMethod}`)
    
    // Buscar gateway de pagamento
    let gatewayConfig = await prisma.paymentGatewayConfig.findFirst({
      where: {
        active: true,
        entityTypes: {
          has: entityType
        }
      },
      orderBy: {
        priority: 'desc'
      }
    })
    
    // Se não encontrar um gateway específico para o tipo de entidade, usar qualquer gateway ativo
    if (!gatewayConfig) {
      console.log("Gateway específico não encontrado, buscando qualquer gateway ativo")
      gatewayConfig = await prisma.paymentGatewayConfig.findFirst({
        where: {
          active: true
        },
        orderBy: {
          priority: 'desc'
        }
      })
    }
    
    if (!gatewayConfig) {
      return NextResponse.json(
        { message: "Nenhum gateway de pagamento configurado" },
        { status: 500 }
      )
    }
    
    console.log(`Obtendo gateway de pagamento: ${gatewayConfig.provider}`)
    console.log('Detalhes do gateway config:', gatewayConfig)
    
    // Inicializar gateway de pagamento - corrigido para passar provider e config na ordem correta
    const gateway = getPaymentGateway(
      gatewayConfig.provider as PaymentProvider, 
      gatewayConfig as unknown as PaymentGatewayConfig
    )
    
    if (!gateway) {
      return NextResponse.json(
        { message: "Erro ao inicializar gateway de pagamento" },
        { status: 500 }
      )
    }
    
    // Criar transação no banco de dados
    const transaction = await prisma.paymentTransaction.create({
      data: {
        id: uuidv4(),
        gatewayConfigId: gatewayConfig.id,
        entityId: paymentData.metadata.entityId,
        amount: paymentData.amount,
        description: paymentData.description,
        paymentMethod: paymentData.paymentMethod,
        metadata: paymentData.metadata,
        createdAt: new Date(),
        updatedAt: new Date(),
        protocol: protocolNumber,
        status: PaymentStatus.PENDING,
        entityType
      }
    })

    // Preparar dados para o gateway
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    const webhookUrl = `${baseUrl}/api/payments/gateway/webhook`;
    
    console.log("URL base da API:", baseUrl);
    console.log("URL de webhook para notificações:", webhookUrl);
    
    // Adicionar os dados do cartão ao payload
    const gatewayInput = {
      ...paymentData,
      metadata: {
        ...paymentData.metadata,
        transactionId: transaction.id,
        referenceCode: protocolNumber
      },
      notificationUrl: webhookUrl,
      // Dados do cartão
      card: paymentData.card
    }

    // Processar pagamento no gateway
    const paymentResult = await gateway.createPaymentWithCard(gatewayInput)

    // Armazenar dados do cartão no metadata para não perder informações
    const cardInfo = {
      lastDigits: paymentData.card.number.slice(-4),
      holderName: paymentData.card.holderName,
      installments: paymentData.card.installments
    };
    
    // Combinar metadata existente com novas informações do cartão
    const updatedMetadata = transaction.metadata 
      ? { ...JSON.parse(JSON.stringify(transaction.metadata)), cardInfo } 
      : { cardInfo };

    // Atualizar transação com dados do gateway
    console.log("Atualizando transação com dados do gateway:", {
      id: transaction.id,
      externalId: paymentResult.id,
      paymentUrl: paymentResult.paymentUrl,
      status: paymentResult.status
    });
    
    await prisma.paymentTransaction.update({
      where: { id: transaction.id },
      data: {
        externalId: paymentResult.id,
        paymentUrl: paymentResult.paymentUrl,
        status: paymentResult.status,
        metadata: updatedMetadata,
        updatedAt: new Date()
      }
    })

    // Criar histórico de pagamento
    await prisma.paymentHistory.create({
      data: {
        id: uuidv4(),
        transactionId: transaction.id,
        status: paymentResult.status,
        description: `Pagamento ${paymentResult.status === 'PENDING' ? 'iniciado' : 'processado'} via ${gateway.name}`,
        createdAt: new Date()
      }
    })

    // Em ambiente de desenvolvimento, simular o processamento do webhook
    // para atualizar o status da inscrição automaticamente
    const isDevelopment = process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;
    if (isDevelopment && paymentResult.status === 'PAID') {
      try {
        console.log('Ambiente de desenvolvimento: processando confirmação automática');
        
        // Primeiro, atualizar a transação de pagamento
        await prisma.paymentTransaction.update({
          where: { id: transaction.id },
          data: {
            status: PaymentStatus.PAID,
            paidAt: new Date()
          }
        });
        
        console.log(`Transação de pagamento ${transaction.id} atualizada para PAID`);
        
        // Criar um pagamento na tabela Payment
        const payment = await prisma.payment.create({
          data: {
            id: uuidv4(),
            provider: gateway.name,
            status: 'PAID',
            paymentMethod: paymentData.paymentMethod,
            amount: new Prisma.Decimal(paymentData.amount),
            currency: 'BRL',
            externalId: paymentResult.id,
            paymentData: updatedMetadata,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        });
        
        console.log(`Pagamento ${payment.id} criado com sucesso`);
        
        // Extrair informações do usuário dos metadados ou transação
        if (paymentData.metadata?.entityId && paymentData.metadata?.type === 'EVENT') {
          const eventId = paymentData.metadata.entityId;
          
          // Procurar se há uma inscrição temporária relacionada ao e-mail
          const tempRegistrations = await prisma.tempRegistration.findMany({
            where: {
              eventId: eventId,
              email: paymentData.customer.email
            }
          });
          
          if (tempRegistrations.length > 0) {
            const tempReg = tempRegistrations[0];
            console.log('Inscrição temporária encontrada:', tempReg);
            
            // Criar inscrição confirmada
            const registration = await prisma.registration.create({
              data: {
                id: uuidv4(),
                eventId: tempReg.eventId,
                name: tempReg.name,
                email: tempReg.email,
                phone: tempReg.phone,
                status: 'CONFIRMED',
                userId: paymentData.metadata.userId || 'anonymous',
                protocol: protocolNumber,
                cpf: tempReg.document,
                birthdate: tempReg.birthDate,
                modalityid: tempReg.modalityId,
                categoryid: tempReg.categoryId,
                genderid: tempReg.genderId,
                tierid: tempReg.tierId,
                addressdata: tempReg.addressData,
                createdAt: new Date(),
                updatedAt: new Date(),
                // Criar relação com o pagamento
                Payment: {
                  connect: {
                    id: payment.id
                  }
                }
              }
            });
            
            console.log('Inscrição confirmada criada:', registration);
            
            // Atualizar o pagamento para associá-lo à inscrição
            await prisma.payment.update({
              where: { id: payment.id },
              data: {
                registrationId: registration.id
              }
            });
            
            // Remover inscrição temporária
            await prisma.tempRegistration.delete({
              where: {
                id: tempReg.id
              }
            });
            
            console.log('Inscrição temporária removida');
          } else {
            console.log('Nenhuma inscrição temporária encontrada para o email:', paymentData.customer.email);
          }
        }
      } catch (error) {
        console.error('Erro ao confirmar inscrição automaticamente:', error);
        // Não interromper o fluxo se houver erro na confirmação automática
      }
    }
    
    // Retornar resposta
    return NextResponse.json({
      id: transaction.id,
      protocolNumber,
      status: paymentResult.status,
      amount: paymentData.amount,
      paymentUrl: paymentResult.paymentUrl
    })
  } catch (error) {
    console.error("Erro ao processar pagamento com cartão:", error)
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Erro ao processar pagamento com cartão" },
      { status: 500 }
    )
  }
}
