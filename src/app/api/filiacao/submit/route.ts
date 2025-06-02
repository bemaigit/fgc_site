import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from 'zod';
import crypto from 'crypto';

// Atualizando schema para incluir os novos campos
const schema = z.object({
  filiationType: z.enum(["NEW", "RENEWAL"]),
  fullName: z.string().min(3),
  cpf: z.string().length(11),
  email: z.string().email(),
  cbcRegistration: z.string().optional(),
  birthDate: z.string(),
  phone: z.string(),
  address: z.string(),
  city: z.string(),
  state: z.string(),
  zipCode: z.string(),
  modalities: z.array(z.string()),
  category: z.string(),
  affiliationType: z.enum(["INDIVIDUAL", "CLUB"]),
  isIndividual: z.boolean().optional(),
  clubId: z.string().optional().nullable(),
  userId: z.string().optional(),
  isRenewal: z.boolean().optional(),
  athleteId: z.string().optional().nullable() // ID do atleta existente, se for uma atualização
});

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      )
    }

    const body = await request.json();
    
    // Garantir que o userId esteja definido
    if (!body.userId && session.user.id) {
      body.userId = session.user.id;
    }
    
    // Converter affiliationType para isIndividual para compatibilidade
    if (body.affiliationType && !body.hasOwnProperty('isIndividual')) {
      body.isIndividual = body.affiliationType === "INDIVIDUAL";
    }
    
    const validation = schema.safeParse(body);

    if (!validation.success) {
      console.error("Validation errors:", validation.error.errors);
      return NextResponse.json(
        { error: "Dados inválidos", errors: validation.error.errors },
        { status: 400 }
      );
    }
    
    // Identificar se é renovação
    const isRenewal = validation.data.filiationType === "RENEWAL";

    // Se foi fornecido um athleteId, verificar se ele existe
    let existingAthleteById = null;
    if (validation.data.athleteId) {
      existingAthleteById = await prisma.athlete.findUnique({
        where: { id: validation.data.athleteId }
      });
    }

    // Verificar se o usuário já tem um atleta associado
    const existingAthleteByUser = await prisma.athlete.findUnique({
      where: { userId: session.user.id }
    })

    // Verificar se já existe atleta com o mesmo CPF
    const existingAthlete = await prisma.athlete.findUnique({
      where: { cpf: validation.data.cpf }
    });
    
    // Determinar qual atleta existente usar (prioridade: athleteId > existingAthleteByUser > existingAthlete)
    const athleteToUpdate = existingAthleteById || existingAthleteByUser || existingAthlete;

    // Se for renovação, precisamos ter um atleta existente
    if (isRenewal && !athleteToUpdate) {
      return NextResponse.json(
        { error: "Atleta não encontrado para renovação" },
        { status: 400 }
      );
    }
    
    // IMPORTANTE: Comentando TODAS as verificações de CPF duplicado para permitir múltiplas filiações
    /*
    // Se não for renovação e o atleta já existir com o mesmo CPF (e não for do usuário atual), impedir cadastro duplicado
    if (!isRenewal && existingAthlete && existingAthlete.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Já existe um atleta cadastrado com este CPF" },
        { status: 400 }
      );
    }

    // Se encontramos um CPF para outro usuário (não para o usuário atual)
    if (existingAthlete && existingAthlete.userId !== session.user.id) {
      return NextResponse.json(
        { error: "CPF já cadastrado para outro usuário" },
        { status: 400 }
      );
    }
    */

    // IMPORTANTE: Comentando a verificação de modalidades para permitir múltiplas filiações
    /*
    // Verificar se o atleta já está filiado na mesma modalidade
    if (existingAthlete && existingAthlete.userId === session.user.id && !isRenewal) {
      // Obter as modalidades selecionadas
      const selectedModalities = validation.data.modalities || [];
      
      // Verificar se alguma das modalidades selecionadas já está associada ao atleta
      const existingAthleteModalities = existingAthlete.modalities || [];
      
      console.log('Verificação de modalidades:', {
        selectedModalities,
        existingAthleteModalities,
        existingAthlete: {
          id: existingAthlete.id,
          fullName: existingAthlete.fullName,
          modalities: existingAthlete.modalities
        }
      });
      
      // Se o atleta já existe e estamos tentando adicionar novas modalidades,
      // vamos apenas adicionar as novas modalidades ao array existente
      if (existingAthlete && selectedModalities.length > 0) {
        // Filtrar apenas as modalidades que ainda não existem
        const newModalities = selectedModalities.filter(
          modalityId => !existingAthleteModalities.includes(modalityId)
        );
        
        // Se não há novas modalidades, significa que todas já estão registradas
        if (newModalities.length === 0) {
          // Buscar os nomes das modalidades já registradas
          const modalitiesInfo = await prisma.filiationModality.findMany({
            where: { 
              id: { in: selectedModalities } 
            }
          });
          
          console.log('Modalidades já registradas:', {
            selectedModalities,
            modalitiesInfo
          });
          
          const modalityNames = modalitiesInfo.map(m => m.name).join(", ");
          return NextResponse.json(
            { 
              error: `Você já está filiado na(s) modalidade(s): ${modalityNames}. Para adicionar uma nova modalidade, selecione uma diferente.` 
            },
            { status: 400 }
          );
        }
        
        // Se chegamos aqui, significa que há novas modalidades para adicionar
        console.log('Novas modalidades a serem adicionadas:', newModalities);
        
        // Vamos continuar o processamento com apenas as novas modalidades
        validation.data.modalities = newModalities;
      }
    }
    */

    // Se o atleta já existe, vamos atualizar seus dados
    if (athleteToUpdate) {
      // Buscar o valor da modalidade escolhida
      const modalities = validation.data.modalities || [];
      let modalityPrice = 80; // Valor padrão se não encontrar modalidade
      let isFreeModality = false; // Flag para indicar se a modalidade é gratuita
      
      try {
        if (modalities.length > 0) {
          const modalityInfo = await prisma.filiationModality.findUnique({
            where: { id: modalities[0] }
          });
          if (modalityInfo && modalityInfo.price !== undefined) {
            modalityPrice = Number(modalityInfo.price);
            // Verificar se a modalidade é gratuita (preço zero)
            isFreeModality = modalityPrice === 0;
          }
        }
      } catch (error) {
        console.error("Erro ao buscar preço da modalidade:", error);
      }
      
      // Verificar se o tipo de filiação é individual ou clube
      const isIndividual = validation.data.isIndividual || validation.data.affiliationType === "INDIVIDUAL";
      
      // Determinar o ano atual para o registro de filiação
      const currentYear = new Date().getFullYear();
      
      // Verificar se houve mudança de clube ou status (avulso/clube)
      // Usando valores seguros com operador optional chaining para evitar erros de tipos
      const clubChanged = !isIndividual && athleteToUpdate.clubId !== validation.data.clubId;
      const statusChanged = athleteToUpdate.isIndividual !== isIndividual;
      
      // Combinar as modalidades existentes com as novas modalidades
      const existingModalities = athleteToUpdate.modalities || [];
      const newModalities = validation.data.modalities || [];
      
      // Criar um Set para garantir que não haja duplicatas
      const combinedModalitiesSet = new Set([...existingModalities, ...newModalities]);
      const combinedModalities = Array.from(combinedModalitiesSet);
      
      console.log('Combinando modalidades:', {
        existingModalities,
        newModalities,
        combinedModalities
      });
      
      // Se houve mudança de status ou clube, vamos verificar se precisa registrar no histórico
      if (clubChanged || statusChanged) {
        // Buscar configuração de filiação anual para o ano atual
        let filiationConfig = await prisma.filiationAnnualConfig.findUnique({
          where: { year: currentYear }
        });
        
        // Se não existir configuração para o ano atual, criar uma com valores padrão
        if (!filiationConfig) {
          filiationConfig = await prisma.filiationAnnualConfig.create({
            data: {
              id: crypto.randomUUID(),
              year: currentYear,
              initialFilingFee: modalityPrice, // Usar o preço da modalidade como taxa padrão
              renewalFee: modalityPrice,       // Taxa de renovação
              clubChangeStatusFee: 50.00,      // Taxa padrão para mudança de clube
              isActive: true,
            }
          });
        }
        
        // Criar registro de pagamento para a mudança de status/clube se aplicável
        let changePaymentId = null;
        
        // Se mudou de clube para avulso, aplica taxa de avulso
        if (statusChanged && isIndividual) {
          changePaymentId = crypto.randomUUID();
          
          // Criar pagamento para a mudança
          await prisma.payment.create({
            data: {
              id: changePaymentId,
              amount: filiationConfig.initialFilingFee,
              status: 'PENDING',
              updatedAt: new Date(),
              provider: 'MERCADO_PAGO',
              paymentMethod: 'PIX',
              currency: 'BRL',
              externalId: crypto.randomUUID(),
              paymentData: {
                type: 'STATUS_CHANGE',
                description: `Mudança para atleta avulso: ${athleteToUpdate.fullName}`,
                userId: session.user.id,
                changeType: 'TO_INDIVIDUAL'
              },
              athleteId: athleteToUpdate.id
            }
          });
        }
        // Se mudou de clube para outro clube, verifica se há taxa
        else if (clubChanged && !isIndividual) {
          // Taxa zero para mudança de clube
          const clubChangeFee = 0; // sem taxa para mudança entre clubes
          
          // Só criar registro de pagamento se tiver taxa
          if (clubChangeFee > 0) {
            changePaymentId = crypto.randomUUID();
            
            await prisma.payment.create({
              data: {
                id: changePaymentId,
                amount: clubChangeFee,
                status: 'PENDING',
                updatedAt: new Date(),
                provider: 'MERCADO_PAGO',
                paymentMethod: 'PIX',
                currency: 'BRL',
                externalId: crypto.randomUUID(),
                paymentData: {
                  type: 'CLUB_CHANGE',
                  description: `Mudança de clube para atleta: ${athleteToUpdate.fullName}`,
                  userId: session.user.id,
                  changeType: 'CLUB_TO_CLUB'
                },
                athleteId: athleteToUpdate.id
              }
            });
          }
        }
        
        // Registrar a mudança no histórico de status do atleta
        // Somente criar histórico se estiver mudando para um clube que existe
        try {
          // Verificar se está tentando associar com um clube e se o clube existe
          let newClubIdToUse = null;
          if (!isIndividual && validation.data.clubId && validation.data.clubId.trim() !== "") {
            const clubExists = await prisma.club.findUnique({
              where: { id: validation.data.clubId }
            });
            
            if (clubExists) {
              newClubIdToUse = validation.data.clubId;
            } else {
              console.log(`Aviso: Clube com ID ${validation.data.clubId} não encontrado. Não será associado ao histórico.`);
            }
          }
          
          // Só criar o histórico se tivermos um clubId válido ou se for uma transição para individual
          if (newClubIdToUse || isIndividual) {
            await prisma.athleteStatusHistory.create({
              data: {
                id: crypto.randomUUID(),
                athleteId: athleteToUpdate.id,
                wasIndividual: !!(athleteToUpdate.isIndividual),
                becameIndividual: isIndividual,
                previousClubId: athleteToUpdate.clubId || null,
                newClubId: newClubIdToUse, // Usar o ID validado ou null
                reason: statusChanged ? (isIndividual ? "CLUB_TO_INDIVIDUAL" : "INDIVIDUAL_TO_CLUB") : "CLUB_CHANGE",
                paymentId: changePaymentId,
                createdAt: new Date()
              }
            });
            console.log("Histórico de status criado com sucesso");
          } else {
            console.log("Pulando criação de histórico porque não temos clube válido");
          }
        } catch (historyError) {
          console.error("Erro ao criar histórico de status:", historyError);
          // Não vamos falhar a atualização apenas por causa do histórico
        }
      }

      // Extração de um clubId válido para atualização
      let clubIdForUpdate = null;
      
      // Se não é individual, precisamos verificar se o clube existe
      if (!isIndividual && validation.data.clubId) {
        try {
          // Garantir que o ID seja uma string sem espaços extras
          const normalizedClubId = validation.data.clubId.trim();
          
          // Buscar o clube e incluir informações detalhadas para diagnóstico
          const clubExists = await prisma.club.findUnique({
            where: { id: normalizedClubId }
          });
          
          console.log("Resultado da busca de clube:", clubExists ? "Encontrado" : "Não encontrado");
          if (clubExists) {
            console.log("Detalhes do clube encontrado:", { 
              id: clubExists.id, 
              nome: clubExists.clubName,
              ativo: clubExists.active
            });
          }
          
          if (!clubExists) {
            console.log(`ERRO: Clube com ID '${normalizedClubId}' não encontrado no banco de dados`);
            return NextResponse.json(
              { error: `Clube com ID '${normalizedClubId}' não encontrado. Por favor, selecione um clube válido.` },
              { status: 400 }
            );
          }
          
          // Se o clube existe, mas não está ativo
          if (clubExists && !clubExists.active) {
            console.log(`ERRO: Clube com ID '${normalizedClubId}' existe, mas está inativo`);
            return NextResponse.json(
              { error: `O clube selecionado está inativo. Por favor, selecione outro clube.` },
              { status: 400 }
            );
          }
          
          clubIdForUpdate = normalizedClubId;
          console.log("ID do clube validado com sucesso:", clubIdForUpdate);
        } catch (clubLookupError) {
          console.error("ERRO ao buscar clube no banco de dados:", clubLookupError);
          return NextResponse.json(
            { error: "Erro ao verificar clube. Por favor, tente novamente." },
            { status: 500 }
          );
        }
      } else {
        // Para atletas individuais, garantir que clubId seja explicitamente null
        console.log("Atleta individual: clubId será definido como null");
        clubIdForUpdate = null;
      }
      
      // Log de depuração detalhado
      console.log("Atualizando atleta:", {
        id: athleteToUpdate.id,
        clubIdAtual: athleteToUpdate.clubId,
        novoClubId: clubIdForUpdate,
        isIndividual: isIndividual
      });
      
      // Atualização garantindo que clubId seja sempre válido ou null
      const updatedAthlete = await prisma.athlete.update({
        where: { id: athleteToUpdate.id },
        data: {
          fullName: validation.data.fullName,
          // @ts-ignore - Os campos existem no banco, mas o tipo ainda não está totalmente sincronizado
          email: validation.data.email,
          // @ts-ignore - Os campos existem no banco, mas o tipo ainda não está totalmente sincronizado
          cbcRegistration: validation.data.cbcRegistration || null,
          birthDate: new Date(validation.data.birthDate),
          phone: validation.data.phone,
          address: validation.data.address,
          city: validation.data.city,
          state: validation.data.state,
          zipCode: validation.data.zipCode,
          modalities: combinedModalities,
          category: validation.data.category,
          // @ts-ignore - Os campos existem no banco, mas o tipo ainda não está totalmente sincronizado
          isIndividual: isIndividual,
          // @ts-ignore - Os campos existem no banco, mas o tipo ainda não está totalmente sincronizado
          // Clube: ou null para atletas individuais ou um ID válido pré-verificado
          clubId: isIndividual ? null : clubIdForUpdate,
          paymentStatus: isFreeModality ? "CONFIRMED" : "PENDING",
          active: isFreeModality ? true : false,
          updatedAt: new Date(),
        }
      });
      
      // Criar registro de pagamento (mesmo para modalidades gratuitas, para manter histórico)
      // Importante: precisamos usar validatedClubId que foi definido antes, não newClubIdToUse que é de outro escopo
      const payment = await prisma.payment.create({
        data: {
          id: crypto.randomUUID(),
          amount: modalityPrice,
          status: isFreeModality ? 'CONFIRMED' : 'PENDING', // Confirma automaticamente para modalidades gratuitas
          updatedAt: new Date(),
          provider: isFreeModality ? 'SYSTEM' : 'MERCADO_PAGO', // Provedor SYSTEM para modalidades gratuitas
          paymentMethod: isFreeModality ? 'FREE' : 'PIX',
          currency: 'BRL',
          externalId: crypto.randomUUID(),
          paymentData: {
            type: 'ATHLETE_REGISTRATION',
            description: `Filiação de atleta: ${updatedAthlete.fullName}`,
            userId: session.user.id,
            isFreeModality: isFreeModality
          },
          Athlete: {
            connect: {
              id: updatedAthlete.id
            }
          }
        }
      });
      
      // Atualizar atleta com ID do pagamento
      await prisma.athlete.update({
        where: { id: updatedAthlete.id },
        data: { paymentId: payment.id }
      });

      return NextResponse.json({
        success: true,
        athleteId: updatedAthlete.id,
        paymentId: payment.id,
        isFreeModality: isFreeModality,
        message: "Dados atualizados com sucesso"
      })
    }

    // Se não existe, criar novo atleta
    const athleteId = crypto.randomUUID();
    
    // Buscar o valor da modalidade escolhida
    const modalities = validation.data.modalities || [];
    let modalityPrice = 80; // Valor padrão se não encontrar modalidade
    let isFreeModality = false; // Flag para indicar se a modalidade é gratuita
    
    try {
      if (modalities.length > 0) {
        const modalityInfo = await prisma.filiationModality.findUnique({
          where: { id: modalities[0] }
        });
        if (modalityInfo && modalityInfo.price !== undefined) {
          modalityPrice = Number(modalityInfo.price);
          // Verificar se a modalidade é gratuita (preço zero)
          isFreeModality = modalityPrice === 0;
        }
      }
    } catch (error) {
      console.error("Erro ao buscar preço da modalidade:", error);
    }
    
    // Criar registro de pagamento
    const paymentId = crypto.randomUUID();
    
    // Verificar se o tipo de filiação é individual ou clube
    const isIndividual = validation.data.isIndividual || validation.data.affiliationType === "INDIVIDUAL";
    
    console.log("=== Diagnóstico de Problemas FK ====");
    console.log("isIndividual:", isIndividual);
    console.log("dados recebidos do formulário:", JSON.stringify(validation.data, null, 2));
    console.log("clubId recebido:", validation.data.clubId);
    console.log("Tipo do clubId:", typeof validation.data.clubId);
    
    // Para registros não individuais, o clubId é obrigatório e deve existir
    // Inicializa como null para garantir que não haja valores inválidos
    let validatedClubId = null;
    
    if (!isIndividual) {
      if (!validation.data.clubId || validation.data.clubId === "" || validation.data.clubId.trim() === "") {
        console.log("ERRO: clubId ausente ou vazio para filiação não individual");
        return NextResponse.json(
          { error: "Para filiação não individual, o clube é obrigatório." },
          { status: 400 }
        );
      }
      
      // Garantir que o ID seja uma string sem espaços extras
      const normalizedClubId = validation.data.clubId.trim();
      console.log("clubId normalizado:", normalizedClubId);
      
      try {
        // Buscar o clube e incluir informações detalhadas para diagnóstico
        const clubExists = await prisma.club.findUnique({
          where: { id: normalizedClubId }
        });
        
        console.log("Resultado da busca de clube:", clubExists ? "Encontrado" : "Não encontrado");
        if (clubExists) {
          console.log("Detalhes do clube encontrado:", { 
            id: clubExists.id, 
            nome: clubExists.clubName,
            ativo: clubExists.active
          });
        }
        
        if (!clubExists) {
          console.log(`ERRO: Clube com ID '${normalizedClubId}' não encontrado no banco de dados`);
          return NextResponse.json(
            { error: `Clube com ID '${normalizedClubId}' não encontrado. Por favor, selecione um clube válido.` },
            { status: 400 }
          );
        }
        
        // Se o clube existe, mas não está ativo
        if (clubExists && !clubExists.active) {
          console.log(`ERRO: Clube com ID '${normalizedClubId}' existe, mas está inativo`);
          return NextResponse.json(
            { error: `O clube selecionado está inativo. Por favor, selecione outro clube.` },
            { status: 400 }
          );
        }
        
        validatedClubId = normalizedClubId;
        console.log("ID do clube validado com sucesso:", validatedClubId);
      } catch (clubLookupError) {
        console.error("ERRO ao buscar clube no banco de dados:", clubLookupError);
        return NextResponse.json(
          { error: "Erro ao verificar clube. Por favor, tente novamente." },
          { status: 500 }
        );
      }
    } else {
      // Para atletas individuais, garantir que clubId seja explicitamente null
      console.log("Atleta individual: clubId será definido como null");
      validatedClubId = null;
    }
    
    // Determinar o ano atual para o registro de filiação
    const currentYear = new Date().getFullYear();
    
    // Buscar configuração de filiação anual para o ano atual (se existir)
    // @ts-ignore - A tabela existe no banco, mas o tipo ainda não está totalmente sincronizado
    let filiationConfig = await prisma.filiationAnnualConfig.findUnique({
      where: { year: currentYear }
    });
    
    // Se não existir configuração para o ano atual, criar uma com valores padrão
    if (!filiationConfig) {
      // @ts-ignore - A tabela existe no banco, mas o tipo ainda não está totalmente sincronizado
      filiationConfig = await prisma.filiationAnnualConfig.create({
        data: {
          id: crypto.randomUUID(),
          year: currentYear,
          initialFilingFee: modalityPrice, // Usar o preço da modalidade como taxa padrão
          clubChangeStatusFee: 50.00, // Taxa padrão para mudança de clube
          renewalFee: modalityPrice * 0.8, // Taxa de renovação como 80% da taxa de entrada
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      });
    }
    
    const athlete = await prisma.athlete.create({
      data: {
        id: athleteId,
        userId: session.user.id,
        fullName: validation.data.fullName,
        cpf: validation.data.cpf,
        // @ts-ignore - Os campos existem no banco, mas o tipo ainda não está totalmente sincronizado
        email: validation.data.email,
        // @ts-ignore - Os campos existem no banco, mas o tipo ainda não está totalmente sincronizado
        cbcRegistration: validation.data.cbcRegistration || null,
        birthDate: new Date(validation.data.birthDate), // Converter para DateTime
        phone: validation.data.phone,
        address: validation.data.address,
        city: validation.data.city,
        state: validation.data.state,
        zipCode: validation.data.zipCode,
        modalities: validation.data.modalities,
        category: validation.data.category,
        paymentStatus: isFreeModality ? "CONFIRMED" : "PENDING",
        active: isFreeModality ? true : false, // Ativa automaticamente para modalidades gratuitas
        // @ts-ignore - Os campos existem no banco, mas o tipo ainda não está totalmente sincronizado
        isIndividual: isIndividual, // Novo campo para indicar se é atleta avulso
        // @ts-ignore - Os campos existem no banco, mas o tipo ainda não está totalmente sincronizado
        clubId: isIndividual ? null : validatedClubId, // ID do clube apenas para filiações não individuais
        // @ts-ignore - Os campos existem no banco, mas o tipo ainda não está totalmente sincronizado
        expirationDate: new Date(currentYear, 11, 31), // Validade até 31 de dezembro do ano atual
        updatedAt: new Date(),
        paymentId: paymentId // Associar o pagamento ao atleta
      }
    });
    
    // REMOVER COMPLETAMENTE a criação do histórico para essa primeira versão
    // O histórico de status será criado posteriormente quando o sistema de transição
    // entre clubes estiver implementado corretamente
    console.log("Sistema de histórico de status desativado temporariamente para evitar problemas de chave estrangeira.");
    
    // Garantindo que o clubId seja válido no momento da criação do atleta
    console.log("Verificando clubId final antes da criação do atleta:", 
      isIndividual ? "atleta individual (clubId = null)" : `atleta de clube (clubId = ${validatedClubId})`);
    
    if (!isIndividual && !validatedClubId) {
      console.error("ERRO CRÍTICO: Tentando criar atleta de clube sem um validatedClubId válido");
      return NextResponse.json(
        { error: "Erro interno: ID do clube inválido. Por favor, tente novamente." },
        { status: 500 }
      );
    }
    
    // Criar o pagamento (mesmo para modalidades gratuitas, para manter histórico)
    const paymentDescription = athleteToUpdate 
      ? `Renovação de filiação: ${athleteToUpdate.fullName}` 
      : `Filiação de atleta: ${validation.data.fullName}`;
    
    await prisma.payment.create({
      data: {
        id: paymentId,
        amount: modalityPrice,
        status: isFreeModality ? 'CONFIRMED' : 'PENDING', // Confirma automaticamente para modalidades gratuitas
        updatedAt: new Date(),
        provider: isFreeModality ? 'SYSTEM' : 'MERCADO_PAGO', // Provedor SYSTEM para modalidades gratuitas
        paymentMethod: isFreeModality ? 'FREE' : 'PIX',
        currency: 'BRL',
        externalId: crypto.randomUUID(),
        paymentData: {
          type: 'ATHLETE_REGISTRATION',
          description: paymentDescription,
          userId: session.user.id,
          isFreeModality: isFreeModality
        },
        athleteId: athleteToUpdate ? athleteToUpdate.id : athleteId
      }
    });

    // Determinar o ID do atleta para a resposta
    const responseAthleteId = athleteToUpdate ? athleteToUpdate.id : athleteId;
    
    return NextResponse.json({
      id: responseAthleteId,
      paymentId: paymentId,
      isFreeModality: isFreeModality,
      message: athleteToUpdate ? "Filiação atualizada com sucesso" : "Filiação criada com sucesso"
    })
  } catch (error: any) {
    console.error("Erro ao criar filiação:", {
      error: error.message,
      stack: error.stack
    })
    return NextResponse.json(
      { error: "Erro ao criar filiação: " + error.message },
      { status: 500 }
    )
  }
}
