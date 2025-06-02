import { Prisma, PrismaClient, User, Athlete, Club, PaymentStatus as PrismaPaymentStatus, PaymentMethod } from '@prisma/client'
import { 
  CreatePaymentInput,
  CardData,
  PaymentStatus,
  ProtocolData,
  TransactionType
} from "../payment/types"
import { NotificationData } from "../types/notification"
import { TransactionService } from "../transaction/service"
import { ProtocolService } from "../protocol/service"
import { NotificationService } from "../notification/service"
import { PaymentGatewayService } from "../payment/gateway"
import { randomUUID } from "crypto"
import { NotificationType, NotificationChannel } from '../notifications/types'
import NotificationServiceWithWhatsApp from '../notifications/notification-service'

const prisma = new PrismaClient()

export class MembershipService {
  private static instance: MembershipService
  private notificationService: NotificationService
  private protocolService: ProtocolService
  private transactionService: TransactionService
  private gatewayService: PaymentGatewayService

  private constructor() {
    this.notificationService = NotificationService.getInstance()
    this.protocolService = ProtocolService.getInstance()
    this.transactionService = TransactionService.getInstance()
    this.gatewayService = PaymentGatewayService.getInstance()
  }

  public static getInstance(): MembershipService {
    if (!MembershipService.instance) {
      MembershipService.instance = new MembershipService()
    }
    return MembershipService.instance
  }

  private async calculateMembershipAmount(): Promise<number> {
    return 15000 // Valor fixo por enquanto (R$ 150,00 em centavos)
  }

  private async getGateway() {
    const gateway = await this.gatewayService.getActiveGateway()
    if (!gateway) {
      throw new Error("No active payment gateway found")
    }
    return gateway
  }

  async createMembership(data: {
    userId: string;
    type: "ATHLETE" | "CLUB";
    amount?: number;
    description?: string;
    paymentMethod: PaymentMethod;
    customer?: {
      name: string;
      email: string;
      document: string;
      address?: {
        street: string;
        city: string;
        state: string;
        zipCode: string;
      };
    };
    cardData?: CardData;
  }) {
    try {
      console.log("1. Iniciando criação de filiação para usuário:", data.userId)
      
      // 1. Buscar atleta pelo ID do usuário
      const athlete = await prisma.athlete.findFirst({
        where: { userId: data.userId }
      })

      if (!athlete) throw new Error("Athlete not found for this user")
      console.log("2. Atleta encontrado:", athlete.id, athlete.fullName)
      
      // Buscar usuário separadamente para obter email
      const user = await prisma.user.findUnique({
        where: { id: data.userId }
      })
      
      if (!user) throw new Error("User not found")
      const amount = data.amount || await this.calculateMembershipAmount()
      console.log("3. Valor calculado:", amount)

      // 3. Preparar metadados do pagamento
      const paymentMetadata = {
        type: 'MEMBERSHIP',
        entityId: athlete.id,
        entityType: data.type === "ATHLETE" ? 'ATHLETE' : 'CLUB',
        referenceCode: athlete.id
      }
      console.log("4. Metadados:", paymentMetadata)

      // 4. Criar pagamento no gateway
      const gateway = await this.getGateway()
      console.log("5. Gateway obtido:", gateway.name)

      const paymentInput: CreatePaymentInput = {
        amount: data.amount || amount,
        description: data.description || `Filiação ${data.type === "ATHLETE" ? "Atleta" : "Clube"} - ${user.name || ""}`,
        paymentMethod: data.paymentMethod,
        customer: {
          name: data.customer?.name || user.name || "",
          email: data.customer?.email || user.email || "",
          document: data.customer?.document || athlete.cpf || "",
          address: data.customer?.address || (athlete.address ? {
            street: athlete.address,
            city: athlete.city,
            state: athlete.state,
            zipCode: athlete.zipCode
          } : undefined)
        },
        metadata: paymentMetadata,
        cardData: data.cardData
      }

      console.log("6. Dados do pagamento:", JSON.stringify(paymentInput, null, 2))

      // Usar o serviço de gateway para criar o pagamento
      const payment = await this.gatewayService.createPayment(paymentInput)
      console.log("7. Pagamento criado no gateway:", payment)

      const now = new Date()
      const transactionId = randomUUID()

      // 4. Criar transação de pagamento
      const transactionData = {
        id: transactionId,
        gatewayConfigId: gateway.id,
        entityId: athlete.id,
        entityType: 'ATHLETE_MEMBERSHIP' as const,
        amount: new Prisma.Decimal(data.amount || 0),
        description: `Anuidade ${data.type === 'ATHLETE' ? 'de Atleta' : 'de Clube'} - ${athlete.fullName}`,
        paymentMethod: data.paymentMethod,
        paymentUrl: payment.paymentUrl || '',
        externalId: payment.id,
        metadata: paymentMetadata as Prisma.InputJsonValue,
        status: 'PENDING' as const,
        athleteId: athlete.id,
        protocol: randomUUID(),
        updatedAt: now,
        createdAt: now
      }

      const transaction = await prisma.paymentTransaction.create({
        data: transactionData
      })

      // 5. Registrar protocolo
      const protocolData = {
        type: TransactionType.MEMBERSHIP,
        entityId: athlete.id,
        paymentId: payment.id,
        status: 'PENDING' as const, // Usando o tipo correto do Prisma
        metadata: {
          membershipType: data.type,
          paymentMethod: data.paymentMethod,
          amount: data.amount,
          // Adicionando metadados adicionais para rastreamento
          athleteId: athlete.id,
          athleteName: athlete.fullName,
          createdAt: new Date().toISOString()
        }
      }

      console.log("8.1 Dados do protocolo:", JSON.stringify(protocolData, null, 2))
      
      const protocol = await this.protocolService.generateProtocol(protocolData)
      console.log("8.2 Protocolo gerado com sucesso:", protocol)
      console.log("9. Protocolo gerado:", protocol)

      // 7. Enviar notificação
      const notificationData: NotificationData = {
        userId: data.userId,
        type: 'MEMBERSHIP_CREATED',
        channel: 'EMAIL',
        data: {
          userId: data.userId,
          membershipType: data.type,
          paymentMethod: data.paymentMethod,
          amount: data.amount,
          protocol: protocol.number,
          athleteName: athlete.fullName,
          paymentId: payment.id,
          email: user.email || '',
          // Adicionando campos necessários para o template de email
          fullName: athlete.fullName,
          protocolNumber: protocol.number,
          paymentAmount: data.amount,
          paymentMethodName: data.paymentMethod,
          paymentStatus: 'pending',
          paymentDate: new Date().toISOString(),
          dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString() // 3 dias a partir de agora
        }
      }
      await this.notificationService.sendNotification(notificationData)
      console.log("10. Notificação enviada")

      // 8. Retornar dados do pagamento
      return {
        ...payment,
        protocolNumber: protocol.number
      }
    } catch (error) {
      console.error("Erro ao criar filiação:", error)
      if (error instanceof Error) {
        throw new Error(`Erro ao criar filiação: ${error.message}`)
      }
      throw new Error("Erro desconhecido ao criar filiação")
    }
  }

  async activateMembership(userId: string) {
    try {
      console.log("Ativando filiação para o usuário:", userId)
      
      // Buscar o atleta diretamente pelo userId
      const athlete = await prisma.athlete.findFirst({
        where: { userId: userId }
      })

      if (!athlete) throw new Error("Athlete not found")
      
      // Buscar os dados do usuário separadamente
      const user = await prisma.user.findUnique({
        where: { id: userId }
      })
      
      if (!user) throw new Error("User not found")
      
      // Buscar informações adicionais para o email
      // Obter a categoria do atleta
      let category = athlete.category || "Não especificada"
      
      // Obter o clube do atleta
      let clubName = "Independente"
      if (athlete.clubId) {
        const clubRecord = await prisma.club.findUnique({
          where: { id: athlete.clubId }
        })
        clubName = clubRecord?.clubName || "Independente"
      }
      
      // Obter modalidades do atleta
      let modalidades = "Não especificadas"
      if (athlete.modalities && Array.isArray(athlete.modalities) && athlete.modalities.length > 0) {
        modalidades = athlete.modalities.join(", ")
      }
      
      // Calcular data de expiração (geralmente 1 ano após a ativação)
      const activationDate = new Date()
      const expiryDate = new Date(activationDate)
      expiryDate.setFullYear(expiryDate.getFullYear() + 1)
      
      // Formatar datas para exibição no email
      const formattedActivationDate = activationDate.toLocaleDateString('pt-BR')
      const formattedExpiryDate = expiryDate.toLocaleDateString('pt-BR')
      
      // Atualizar o status do atleta
      const updateData: any = {
        active: true,
        // Atualizando o ano de registro para o ano atual
        registrationYear: new Date().getFullYear(),
        // Marcando como renovação se aplicável
        isRenewal: true
      }
      
      // Se for a primeira inscrição, atualiza a data de primeira inscrição
      if (!athlete.firstRegistrationDate) {
        updateData.firstRegistrationDate = new Date()
      }
      
      // Atualiza o atleta
      await prisma.athlete.update({
        where: { id: athlete.id },
        data: updateData
      })

      // Buscar o protocol da filiação na tabela de transações
      let protocol = "N/A"
      try {
        // Primeiro, buscamos a transação de pagamento para este atleta
        const transaction = await prisma.paymentTransaction.findFirst({
          where: { 
            entityId: athlete.id,
            status: 'PAID' as const
          },
          select: {
            protocol: true,
            updatedAt: true
          },
          orderBy: { updatedAt: 'desc' as const }
        })
        
        if (transaction?.protocol) {
          protocol = transaction.protocol
        } else {
          // Se não encontrou o protocolo na transação, tenta buscar na tabela de protocolos
          const protocolRecord = await prisma.protocol.findFirst({
            where: {
              entityId: athlete.id,
              type: 'MEMBERSHIP'
            },
            orderBy: { createdAt: 'desc' },
            select: { number: true }
          })
          
          if (protocolRecord?.number) {
            protocol = protocolRecord.number
          }
        }
      } catch (error) {
        console.error("Erro ao buscar protocolo da transação:", error)
      }

      // Enviar notificação de ativação usando o novo template
      if (user.email) {
        const notificationData: NotificationData = {
          userId,
          type: 'MEMBERSHIP_ACTIVATED',
          channel: 'EMAIL',
          data: {
            // Dados básicos
            name: user.name || athlete.fullName || '',
            email: user.email,
            phone: athlete.phone || '',
            
            // Informações da filiação
            category: category || 'Não especificada',
            protocol: protocol || 'N/A',
            club: clubName || 'Independente',
            modalities: modalidades || 'Não especificadas',
            
            // Datas
            activationDate: formattedActivationDate,
            expiryDate: formattedExpiryDate,
            
            // URLs
            membershipUrl: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://fgciclismo.com.br'}/dashboard/perfil/filiacao`,
            logoUrl: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://fgciclismo.com.br'}/images/logo.png`,
            
            // Campos adicionais para o template
            fullName: athlete.fullName || user.name || '',
            protocolNumber: protocol || 'N/A',
            membershipType: 'Anual',
            membershipStatus: 'Ativa',
            registrationYear: new Date().getFullYear(),
            
            // Informações de contato
            supportEmail: 'contato@fgciclismo.com.br',
            supportPhone: '(62) 1234-5678',
            
            // Timestamps
            currentDate: new Date().toLocaleDateString('pt-BR'),
            currentYear: new Date().getFullYear()
          }
        }
        
        try {
          console.log("Enviando notificação de confirmação de filiação por email:", notificationData)
          await this.notificationService.sendNotification(notificationData)
        } catch (notifyError) {
          console.error("Erro ao enviar notificação de filiação por email:", notifyError)
        }
      }
      
      // Enviar notificação por WhatsApp se tiver telefone
      if (athlete.phone) {
        try {
          // Criar instância do serviço de notificações WhatsApp
          const whatsappNotificationService = new NotificationServiceWithWhatsApp();
          
          // Verificar conexão com WhatsApp antes de enviar
          const connectionStatus = await whatsappNotificationService.checkWhatsAppStatus();
          
          if (connectionStatus.status === 'connected' || connectionStatus.status === 'success') {
            // Formatar o número de telefone (remover caracteres não numéricos e garantir formato 55DDNNNNNNNNN)
            const formattedPhone = athlete.phone.replace(/\D/g, '');
            const phoneWithCountryCode = formattedPhone.startsWith('55') ? formattedPhone : `55${formattedPhone}`;
            
            // Criar mensagem de confirmação de filiação
            const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://fgciclismo.com.br';
            const nome = athlete.fullName || user.name || 'Atleta';
            
            // Verificar se é atleta ou clube para personalizar a mensagem
            const isClub = athlete.clubId !== null && athlete.clubId !== undefined;
            const tipoFiliacao = isClub ? 'do clube' : 'de atleta';
            
            // Construir a mensagem de confirmação
            const mensagem = `*Parabéns, ${nome}!* 🏁

Sua filiação ${tipoFiliacao} foi *CONFIRMADA* com sucesso!

Protocolo: *${protocol || 'N/A'}*
${isClub ? `Clube: *${clubName || 'Não informado'}*` : `Categoria: *${category || 'Não informada'}*`}
Modalidades: *${modalidades || 'Não informadas'}*
Validade: *${formattedActivationDate} até ${formattedExpiryDate}*

Acesse sua filiação em:
${baseUrl}/dashboard/perfil/filiacao

A Federação Goiana de Ciclismo agradece sua confiança!
Dúvidas? Entre em contato: contato@fgciclismo.com.br`;
            
            // Enviar notificação por WhatsApp
            await whatsappNotificationService.sendNotification({
              type: NotificationType.AFFILIATION_CONFIRMED,
              channel: NotificationChannel.WHATSAPP,
              recipient: phoneWithCountryCode,
              content: mensagem,
              priority: 'high',
              metadata: {
                userId: user.id,
                athleteId: athlete.id,
                protocol: protocol || 'N/A',
                entityType: isClub ? 'CLUB' : 'ATHLETE',
                timestamp: new Date().toISOString()
              }
            });
            
            console.log(`Mensagem de confirmação de filiação enviada por WhatsApp para: ${phoneWithCountryCode}`);
          } else {
            console.warn(`WhatsApp não está conectado para enviar confirmação de filiação. Status: ${connectionStatus.status}`);
          }
        } catch (whatsappError) {
          console.error('Erro ao enviar notificação de filiação via WhatsApp:', whatsappError);
          // Continuar mesmo se falhar, pois já enviamos por email
        }
      } else {
        console.log('Atleta não possui número de telefone cadastrado. Não foi possível enviar notificação por WhatsApp.');
      }

      return athlete
    } catch (error) {
      console.error("Error activating membership:", error)
      throw error
    }
  }
}

// Instância global do serviço
export const membershipService = MembershipService.getInstance()
