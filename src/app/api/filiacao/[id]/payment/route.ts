import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// Importando o utilitário que já existe no projeto para o Mercado Pago
import { createMercadoPagoClient } from '@/lib/payment/utils/mercadopago';

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Aguardar os params conforme requerido pelo Next.js 14
    const resolvedParams = await params;
    const paymentId = resolvedParams.id
    console.log("1.0 Iniciando POST para pagamento ID:", paymentId)
    
    // Verificar variáveis de ambiente
    console.log("1.1 Verificando variáveis de ambiente:")
    console.log("- MP_SANDBOX_ACCESS_TOKEN:", process.env.MP_SANDBOX_ACCESS_TOKEN ? "Definido" : "Não definido")
    console.log("- NEXT_PUBLIC_BASE_URL:", process.env.NEXT_PUBLIC_BASE_URL)
    console.log("- NEXT_PUBLIC_MP_SANDBOX_PUBLIC_KEY:", process.env.NEXT_PUBLIC_MP_SANDBOX_PUBLIC_KEY ? "Definido" : "Não definido")

    if (!process.env.MP_SANDBOX_ACCESS_TOKEN) {
      console.error("1.2 Token do Mercado Pago não configurado")
      return NextResponse.json(
        { error: "Configuração do gateway de pagamento ausente" },
        { status: 500 }
      )
    }

    // Obter sessão
    console.log("2.0 Obtendo sessão")
    const session = await getServerSession(authOptions)
    console.log("2.1 Sessão:", session ? "Presente" : "Ausente")
    console.log("2.2 User ID:", session?.user?.id)

    if (!session?.user) {
      console.log("2.3 Usuário não autenticado")
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      )
    }

    // Ler body
    let body;
    try {
      console.log("3.0 Lendo body da requisição")
      body = await req.json()
      console.log("3.1 Body recebido:", body)
    } catch (error) {
      console.error("3.2 Erro ao ler body:", error)
      return NextResponse.json(
        { error: "Erro ao ler dados da requisição" },
        { status: 400 }
      )
    }

    if (!body.paymentMethod) {
      console.log("3.3 Método de pagamento ausente")
      return NextResponse.json(
        { error: "Método de pagamento é obrigatório" },
        { status: 400 }
      )
    }

    // Buscar o pagamento
    let payment;
    try {
      console.log("4.0 Buscando pagamento:", paymentId)
      payment = await prisma.payment.findUnique({
        where: { id: paymentId },
        include: {
          Athlete: {
            include: { User_Athlete_userIdToUser: true }
          },
          Club: true
        }
      })
      console.log("4.1 Pagamento encontrado:", payment ? "Sim" : "Não")
    } catch (error) {
      console.error("4.2 Erro ao buscar pagamento:", error)
      return NextResponse.json(
        { error: "Erro ao buscar dados do pagamento" },
        { status: 500 }
      )
    }

    if (!payment) {
      console.log("4.3 Pagamento não encontrado")
      return NextResponse.json(
        { error: "Pagamento não encontrado" },
        { status: 404 }
      )
    }
    
    // Identificar o tipo de pagamento
    const isAthletePayment = !!payment.athleteId;
    const isClubPayment = !!payment.clubId;
    
    console.log("4.4 Tipo de pagamento:", {
      isAthletePayment, 
      isClubPayment,
      athleteId: payment.athleteId,
      clubId: payment.clubId
    })
    
    // Verificar e tratar os dados de pagamento como objeto ou string
    let paymentDataObj: any = {};
    if (payment.paymentData) {
      try {
        // Se for string, tentar converter para objeto
        if (typeof payment.paymentData === 'string') {
          paymentDataObj = JSON.parse(payment.paymentData);
        } else {
          // Se já for objeto, usar diretamente
          paymentDataObj = payment.paymentData;
        }
      } catch (parseError) {
        console.error("4.5 Erro ao processar paymentData:", parseError);
      }
    }

    // Validar permissões
    console.log("5.0 Validando permissões")
    
    // Para pagamentos de atletas
    if (isAthletePayment && payment.Athlete) {
      console.log("5.1 Validando permissões para pagamento de atleta")
      console.log("5.1.1 Comparando IDs:", {
        atletaUserId: payment.Athlete.User_Athlete_userIdToUser.id,
        sessionUserId: session.user.id,
        role: session.user.role
      })
      
      if (payment.Athlete.User_Athlete_userIdToUser.id !== session.user.id && 
          session.user.role !== "ADMIN" && 
          session.user.role !== "SUPER_ADMIN") {
        console.log("5.1.2 Usuário sem permissão")
        return NextResponse.json(
          { error: "Não autorizado" },
          { status: 403 }
        )
      }

      // Validar status do pagamento para atleta
      console.log("5.1.3 Validando status do pagamento:", payment.Athlete.paymentStatus)
      if (payment.Athlete.paymentStatus === "PAID") {
        console.log("5.1.4 Filiação já paga")
        return NextResponse.json(
          { error: "Filiação já está paga" },
          { status: 400 }
        )
      }
    } 
    // Para pagamentos de clubes - apenas verificar permissões
    else if (isClubPayment) {
      console.log("5.2 Validando permissões para pagamento de clube")
      
      // Verificar se o status do pagamento é válido
      if (payment.status === "PAID") {
        console.log("5.2.1 Pagamento já realizado")
        return NextResponse.json(
          { error: "Este pagamento já foi processado" },
          { status: 400 }
        )
      }
    } 
    // Tipo de pagamento não identificado
    else {
      console.log("5.3 Tipo de pagamento não identificado")
      return NextResponse.json(
        { error: "Tipo de pagamento inválido" },
        { status: 400 }
      )
    }

    // Obter valor do pagamento
    console.log("7.0 Obtendo valor do pagamento")
    let totalPrice = Number(payment.amount);
    console.log("7.1 Valor do pagamento:", totalPrice);

    try {
      // Inicializar o cliente do Mercado Pago usando o utilitário existente
      console.log("9.0 Inicializando cliente do Mercado Pago")
      const mpClient = createMercadoPagoClient(process.env.MP_SANDBOX_ACCESS_TOKEN || '');
      console.log("9.1 Cliente do Mercado Pago inicializado")

      // Criar preferência simplificada para PIX
      // Determinar o título do pagamento com base no tipo
      let paymentTitle = "Pagamento FGC";
      
      if (isAthletePayment && payment.Athlete) {
        // Para atletas
        const modalities = payment.Athlete.modalities || [];
        paymentTitle = `Filiação Atleta FGC - ${payment.Athlete.fullName}`;
        if (modalities.length > 0) {
          paymentTitle += ` (${modalities.join(", ")})`;
        }
      } else if (isClubPayment && payment.Club) {
        // Para clubes
        const paymentType = paymentDataObj?.type?.toString() || "";
        const isRenewal = paymentType.includes("RENEWAL");
        paymentTitle = isRenewal 
          ? `Renovação Anuidade Clube - ${payment.Club.clubName}` 
          : `Nova Filiação Clube - ${payment.Club.clubName}`;
      }

      const pixPreferenceData = {
        items: [
          {
            title: paymentTitle,
            unit_price: totalPrice,
            quantity: 1,
            currency_id: "BRL"
          }
        ],
        payment_methods: {
          default_payment_method_id: null,
          excluded_payment_methods: [
            { id: "master" },
            { id: "visa" },
            { id: "amex" },
            { id: "elo" },
            { id: "hipercard" }
          ],
          excluded_payment_types: [
            { id: "credit_card" },
            { id: "debit_card" },
            { id: "ticket" }
          ],
          installments: 1
        },
        back_urls: {
          success: `${process.env.NEXT_PUBLIC_BASE_URL}/filiacao/success`,
          failure: `${process.env.NEXT_PUBLIC_BASE_URL}/filiacao/failure`,
          pending: `${process.env.NEXT_PUBLIC_BASE_URL}/filiacao/pending`
        },
        notification_url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/webhooks/payment`,
        external_reference: paymentId,
        expires: true,
        expiration_date_from: new Date().toISOString(),
        expiration_date_to: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 horas
      }

      console.log("9.3 Criando preferência no Mercado Pago com dados:", JSON.stringify(pixPreferenceData, null, 2))
      
      // Declarar result no escopo externo para que esteja disponível após o try/catch
      let result;
      try {
        // @ts-ignore - O tipo está correto na implementação, mas pode ter desalinhamento no TypeScript
        result = await mpClient.preference.create(pixPreferenceData);
        console.log("9.4 Preferência criada com sucesso:", JSON.stringify(result, null, 2))
        
        // Validar resultado antes de prosseguir
        if (!result || !result.id) {
          console.error("9.4.1 Resultado inválido da API do Mercado Pago:", result)
          throw new Error("Erro ao gerar preferencia de pagamento: resultado inválido")
        }
      } catch (mpError: any) { // Tipando o erro como any para acessar a propriedade message
        console.error("9.4.2 Erro ao criar preferência:", mpError)
        return NextResponse.json(
          { error: `Erro ao gerar QR Code: ${mpError?.message || 'Falha na comunicação com o gateway de pagamento'}` },
          { status: 500 }
        )
      }

      // Atualizar status do pagamento
      console.log("10.0 Atualizando status do pagamento")
      await prisma.payment.update({
        where: { id: paymentId },
        data: {
          status: "PENDING",
          updatedAt: new Date()
        }
      })
      console.log("10.1 Status do pagamento atualizado com sucesso")
      
      // Se for pagamento de atleta, atualizar status do atleta também
      if (isAthletePayment && payment.athleteId) {
        console.log("10.2 Atualizando status do atleta")
        await prisma.athlete.update({
          where: { id: payment.athleteId },
          data: {
            paymentStatus: "PENDING",
            updatedAt: new Date()
          }
        })
        console.log("10.3 Status do atleta atualizado com sucesso")
      }

      // Verificar se result existe antes de acessar suas propriedades
      if (!result || !result.id) {
        console.error("11.0 Result não definido ou ID ausente antes de retornar resposta")
        return NextResponse.json(
          { error: "Erro ao gerar QR Code: resposta do gateway de pagamento inválida" },
          { status: 500 }
        )
      }

      return NextResponse.json({
        preferenceId: result.id,
        publicKey: process.env.NEXT_PUBLIC_MP_SANDBOX_PUBLIC_KEY,
        paymentId: paymentId,
        paymentType: isAthletePayment ? 'ATHLETE' : (isClubPayment ? 'CLUB' : 'OTHER'),
        athleteId: payment.athleteId || undefined,
        clubId: payment.clubId || undefined
      })
    } catch (error) {
      console.error("11.0 Erro ao criar preferência:", error instanceof Error ? error.message : 'Erro desconhecido')
      console.error("11.1 Erro completo:", error)
      return NextResponse.json(
        { error: "Erro ao criar preferência de pagamento" },
        { status: 500 }
      )
    }
  } catch (error) {
    // Garantir que sempre retorne uma resposta, mesmo em caso de erro não tratado
    console.error("12.0 Erro geral não tratado:", error instanceof Error ? error.message : 'Erro desconhecido')
    console.error("12.1 Erro completo:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}
