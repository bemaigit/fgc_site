import { NextRequest, NextResponse } from "next/server"
import { v4 as uuidv4 } from "uuid"
import { prisma } from "@/lib/prisma"
import { getPaymentGateway } from "@/lib/payment/factory"
import { PaymentStatus } from "@/lib/payment/types"
import { WebhookService } from "@/lib/webhooks/service"
import NotificationService from "@/lib/notifications/notification-service"

export async function POST(request: NextRequest) {
  try {
    // Obter dados do corpo da requisição
    const body = await request.json()
    const headers = Object.fromEntries(request.headers.entries())

    // Validar se é uma requisição do PagSeguro
    if (!body || !body.charge) {
      return NextResponse.json(
        { message: "Payload inválido" },
        { status: 400 }
      )
    }

    // Buscar a transação pelo ID externo
    const transaction = await prisma.paymentTransaction.findFirst({
      where: {
        externalId: body.charge.id
      }
    })
    
    // Buscar a configuração do gateway separadamente
    let gatewayConfig = null
    if (transaction) {
      gatewayConfig = await prisma.paymentGatewayConfig.findUnique({
        where: { id: transaction.gatewayConfigId }
      })
    }

    if (!transaction) {
      return NextResponse.json(
        { message: "Transação não encontrada" },
        { status: 404 }
      )
    }

    if (!gatewayConfig) {
      return NextResponse.json(
        { message: "Configuração de gateway não encontrada" },
        { status: 404 }
      )
    }

    // Inicializar gateway
    const gateway = getPaymentGateway(gatewayConfig.provider as any, {
      credentials: gatewayConfig.credentials,
      sandbox: gatewayConfig.sandbox
    })

    // Validar assinatura do webhook (se aplicável)
    const isValid = await gateway.validateWebhook(headers, body)
    if (!isValid) {
      return NextResponse.json(
        { message: "Assinatura inválida" },
        { status: 401 }
      )
    }

    // Processar dados do webhook
    const webhookData = await gateway.parseWebhookData(body)

    // Verificar se o status mudou
    if (webhookData.status !== transaction.status) {
      // Atualizar status da transação
      await prisma.paymentTransaction.update({
        where: { id: transaction.id },
        data: {
          status: webhookData.status,
          updatedAt: new Date()
        }
      })

      // Registrar histórico de pagamento
      await prisma.paymentHistory.create({
        data: {
          id: uuidv4(),
          transactionId: transaction.id,
          status: webhookData.status,
          metadata: {
            source: "webhook",
            ...webhookData.metadata
          },
          createdAt: new Date()
        }
      })

      // Processar ações baseadas no novo status
      await processStatusChange(transaction.id, webhookData.status)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Erro ao processar webhook:", error)
    return NextResponse.json(
      { message: "Erro ao processar webhook" },
      { status: 500 }
    )
  }
}

async function processStatusChange(transactionId: string, status: PaymentStatus) {
  try {
    console.log(`Processando mudança de status para transação ${transactionId}. Novo status: ${status}`);
    
    // Buscar detalhes completos da transação
    const transaction = await prisma.paymentTransaction.findUnique({
      where: { id: transactionId }
    })

    if (!transaction) {
      console.log(`Transação ${transactionId} não encontrada`);
      return;
    }
    
    console.log(`Transação encontrada: ${JSON.stringify({
      id: transaction.id,
      protocol: transaction.protocol,
      entityId: transaction.entityId,
      entityType: transaction.entityType,
      status: transaction.status,
      newStatus: status
    })}`);

    // Extrair registrationId do metadata se existír
    const metadata = transaction.metadata as Record<string, any> || {};
    const registrationId = metadata.registrationId as string;

    // ETAPA 1: Processar com base no tipo de entidade para EventRegistration (modelo legado)
    if (transaction.entityType === "EVENT_REGISTRATION" && registrationId) {
      console.log(`Processando inscrição legada (EventRegistration): ${registrationId}`);
      
      // Buscar inscrição no modelo antigo se existír
      try {
        // O objeto prisma pode não ter eventRegistration, então usamos SQL bruto
        const registrations = await prisma.$queryRaw`
          SELECT r.*, e.name as event_name 
          FROM "EventRegistration" r 
          JOIN "Event" e ON r."eventId" = e.id 
          WHERE r.id = ${registrationId}
        `;
        
        const registration = registrations[0];
        
        if (registration) {
          console.log(`Inscrição legada encontrada: ${registration.id}`);
          
          // Lógica para atualizar status...
        } else {
          console.log(`Inscrição legada ${registrationId} não encontrada`);
        }
      } catch (error) {
        console.error("Erro ao buscar registro legado:", error);
      }

      // Removido código legado que usan eventRegistration
    }
    
    // ETAPA 2: Sincronizar com a tabela Registration (novo modelo)
    // Esta etapa é executada independentemente do tipo de entidade para garantir compatibilidade
    console.log(`Verificando tabela Registration para protocolo: ${transaction.protocol}`);
    
    // Tentar encontrar a inscrição por vários métodos
    const protocolVariations = [
      transaction.protocol,
      transaction.protocol.startsWith('EVE-') ? transaction.protocol.substring(4) : `EVE-${transaction.protocol}`,
      transaction.protocol.replace(/^[A-Z]+-/, ''), // Versão sem qualquer prefixo
    ];
    
    console.log(`Variações de protocolo para busca: ${JSON.stringify(protocolVariations)}`);
    
    let registration = await prisma.registration.findFirst({
      where: { 
        OR: [
          { id: transaction.entityId },
          { protocol: { in: protocolVariations } }
        ]
      }
    });
    
    if (registration) {
      console.log(`Inscrição encontrada na tabela Registration: ${registration.id}`);
      console.log(`Status atual: ${registration.status}, Protocolo atual: ${registration.protocol || 'Não definido'}`);
      
      // Definir o novo status com base no status do pagamento
      let newStatus = registration.status;
      if (status === "PAID") {
        newStatus = "CONFIRMED";
      } else if (status === "FAILED" || status === "CANCELLED") {
        newStatus = "PAYMENT_FAILED";
      } else if (status === "REFUNDED") {
        newStatus = "CANCELED";
      }
      
      // Atualizar o protocolo na Registration se estiver vazio
      if (!registration.protocol || registration.status !== newStatus) {
        await prisma.registration.update({
          where: { id: registration.id },
          data: { 
            protocol: transaction.protocol,
            status: newStatus
          }
        });
        console.log(`Atualizada inscrição ${registration.id} com protocolo ${transaction.protocol} e status ${newStatus}`);
        
        // Enviar notificação de pagamento confirmado se o status for PAID
        if (status === "PAID") {
          try {
            // Buscar informações do evento
            const event = await prisma.event.findUnique({
              where: { id: registration.eventId },
              select: { title: true, startDate: true, location: true }
            });
            
            // Buscar informações do atleta diretamente da tabela Athlete
            const athlete = await prisma.athlete.findFirst({
              where: { userId: registration.userId }
            });
            
            // Buscar informações básicas do usuário
            const user = await prisma.user.findUnique({
              where: { id: registration.userId }
            });
            
            if (event && athlete?.phone) {
              const formattedDate = event.startDate
                ? new Date(event.startDate).toLocaleDateString('pt-BR')
                : 'Data a confirmar';
              
              // Enviar notificação via WhatsApp
              console.log(`Enviando notificação de pagamento aprovado para ${athlete.phone}`);
              const notificationService = new NotificationService();
              await notificationService.sendNotification({
                type: 'PAYMENT_CONFIRMED',
                recipient: athlete.phone,
                channel: 'whatsapp',
                content: `*Pagamento Confirmado!* \u2705\n\nOlá, ${athlete.fullName || user?.name || 'Atleta'}!\n\nSeu pagamento para o evento *${event.title}* foi confirmado com sucesso!\n\n*Protocolo:* ${transaction.protocol}\n*Data do Evento:* ${formattedDate}\n*Local:* ${event.location || 'A confirmar'}\n\nObrigado pela inscrição e boa competição!\n\nAtenciosamente,\nFederação Goiana de Ciclismo`,
                priority: 'high',
                metadata: {
                  eventId: registration.eventId,
                  registrationId: registration.id,
                  transactionId: transaction.id,
                  protocol: transaction.protocol,
                  paymentDate: new Date().toISOString()
                }
              });
            } else {
              console.log('Atleta sem telefone cadastrado ou evento não encontrado - Notificação não enviada');
            }
          } catch (notificationError) {
            // Não interromper o fluxo em caso de falha na notificação
            console.error('Erro ao enviar notificação de pagamento confirmado:', notificationError);
          }
        }
      }
    } else {
      console.log(`Nenhuma inscrição encontrada para o ID ${transaction.entityId} ou protocolo ${transaction.protocol}`);
    }
    
    // ETAPA 3: Atletas (implementação futura)
    if (transaction.entityType === "ATHLETE_MEMBERSHIP" && transaction.athleteId) {
      // Caso seja uma filiação de atleta
      // Implementação futura para filiações
    }
  } catch (error) {
    console.error("Erro ao processar mudança de status:", error);
  }
}
