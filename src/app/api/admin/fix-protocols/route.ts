import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

/**
 * Utilitário para gerar protocolo de evento padronizado
 */
function generateEventProtocol(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const randomPart = Math.floor(1000 + Math.random() * 9000);
  
  return `EVE-${year}${month}${day}-${randomPart}`;
}

/**
 * Normaliza um protocolo para facilitar buscas
 */
function normalizeProtocol(protocol: string): string[] {
  if (!protocol) return [];
  
  // Extrair o número base do protocolo removendo qualquer prefixo
  const baseProtocol = protocol.replace(/^[A-Z]+-/, '');
  
  // Gerar variações com diferentes prefixos
  return [
    protocol,                        // Protocolo original
    baseProtocol,                    // Sem prefixo
    `EVE-${baseProtocol}`,           // Com prefixo EVE-
    `REG-${baseProtocol}`,           // Com prefixo REG-
    protocol.toUpperCase(),          // Versão em maiúsculas
    protocol.toLowerCase()           // Versão em minúsculas
  ];
}

// Função auxiliar para vincular pagamentos às inscrições correspondentes
async function linkPaymentsToRegistrations() {
  console.log('Iniciando processo de vinculação de pagamentos às inscrições...');
  
  // Passo 1: Buscar todas as transações de pagamento que não possuem registro vinculado
  const unlinkedPayments = await prisma.paymentTransaction.findMany({
    where: {
      status: { equals: 'APPROVED' as any },
      registrationId: null
    }
  });
  
  console.log(`Encontrado(s) ${unlinkedPayments.length} pagamento(s) não vinculado(s)`);
  
  let linkedCount = 0;
  
  // Passo 2: Para cada pagamento, tentar encontrar a inscrição correspondente
  for (const payment of unlinkedPayments) {
    // Tentar diferentes estratégias de correspondência
    let registration = null;
    
    // A. Se temos entityId e é sobre inscrição em evento
    if (payment.entityId && 
        (payment.entityType === 'EVENT_REGISTRATION' || 
         payment.entityType?.includes('REGISTRATION'))) {
      registration = await prisma.registration.findUnique({
        where: { id: payment.entityId }
      });
      
      if (registration) {
        console.log(`Vinculação direta pelo entityId: ${payment.id} -> ${registration.id}`);
      }
    }
    
    // B. Se temos um protocolo, tentar buscar por ele
    if (!registration && payment.protocol) {
      // Tentar variações do protocolo
      const protocolVariations = [
        payment.protocol,                         // Original
        payment.protocol.startsWith('EVE-') ? payment.protocol.substring(4) : `EVE-${payment.protocol}`, // Com/sem prefixo
        payment.protocol.replace(/^[A-Z]+-/, ''), // Sem prefixo
        `EVE-${payment.protocol.replace(/^[A-Z]+-/, '')}` // Com prefixo EVE-
      ];
      
      registration = await prisma.registration.findFirst({
        where: {
          protocol: { in: [...new Set(protocolVariations)] }
        }
      });
      
      if (registration) {
        console.log(`Vinculação pelo protocolo: ${payment.id} -> ${registration.id}`);
      }
    }
    
    // C. Se temos externalId, tentar buscar por ele (às vezes o externalId é usado como protocolo)
    if (!registration && payment.externalId) {
      const protocolVariations = [
        payment.externalId,
        payment.externalId.startsWith('EVE-') ? payment.externalId.substring(4) : `EVE-${payment.externalId}`,
        payment.externalId.replace(/^[A-Z]+-/, ''),
        `EVE-${payment.externalId.replace(/^[A-Z]+-/, '')}`
      ];
      
      registration = await prisma.registration.findFirst({
        where: {
          protocol: { in: [...new Set(protocolVariations)] }
        }
      });
      
      if (registration) {
        console.log(`Vinculação pelo externalId: ${payment.id} -> ${registration.id}`);
      }
    }
    
    // D. Busca por valor e data próxima
    if (!registration) {
      // Se temos entityId e é um evento, buscar inscrições para esse evento
      if (payment.entityId && payment.entityType === 'EVENT') {
        const registrations = await prisma.registration.findMany({
          where: {
            eventId: payment.entityId,
            // Buscar inscrições criadas em um período de 24h antes ou depois do pagamento
            createdAt: {
              gte: new Date(payment.createdAt.getTime() - 24 * 60 * 60 * 1000),
              lte: new Date(payment.createdAt.getTime() + 24 * 60 * 60 * 1000)
            }
          }
        });
        
        // Procurar por uma inscrição com o mesmo valor
        const paymentAmount = payment.amount?.toNumber() || 0;
        
        for (const reg of registrations) {
          // Verificar se há um preço vinculado à inscrição
          let regPrice = 0;
          
          if (reg.tierid) {
            const tier = await prisma.eventPricingTier.findUnique({
              where: { id: reg.tierid }
            });
            
            if (tier) {
              regPrice = tier.price?.toNumber() || 0;
            }
          }
          
          // Se o valor for próximo (margem de 0.01), considerar uma correspondência
          if (Math.abs(regPrice - paymentAmount) < 0.01) {
            registration = reg;
            console.log(`Vinculação por valor e data: ${payment.id} -> ${registration.id}`);
            break;
          }
        }
      }
    }
    
    // Atualizar o pagamento com a vinculação da inscrição, se encontrada
    if (registration) {
      try {
        await prisma.paymentTransaction.update({
          where: { id: payment.id },
          data: {
            registrationId: registration.id,
            protocol: registration.protocol || undefined // Sincronizar o protocolo, usar undefined se for null
          }
        });
        
        console.log(`Pagamento ${payment.id} vinculado à inscrição ${registration.id}`);
        linkedCount++;
      } catch (error) {
        console.error(`Erro ao atualizar pagamento ${payment.id}:`, error);
      }
    }
  }
  
  return { totalProcessed: unlinkedPayments.length, linkedCount };
}

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação (apenas admin)
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const admin = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { role: true },
    });

    if (!admin || admin.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Acesso permitido apenas para administradores' }, { status: 403 });
    }
    
    // Executar o processo de vinculação de pagamentos às inscrições
    console.log('Iniciando processo de correção de protocolos e vinculação de pagamentos...');
    const linkResult = await linkPaymentsToRegistrations();

    const results = {
      registrationsChecked: 0,
      registrationsUpdated: 0,
      paymentsFixed: 0,
      paymentsLinked: linkResult.linkedCount,
      paymentsProcessed: linkResult.totalProcessed,
      errors: [] as string[]
    };

    // 1. Buscar inscrições sem protocolo
    const incompleteRegistrations = await prisma.registration.findMany({
      where: {
        OR: [
          { protocol: null },
          { protocol: "" }
        ]
      }
    });
    
    results.registrationsChecked = incompleteRegistrations.length;
    console.log(`Encontradas ${incompleteRegistrations.length} inscrições com protocolo faltando.`);
    
    // 2. Para cada inscrição, tentar encontrar transação de pagamento relacionada
    for (const registration of incompleteRegistrations) {
      try {
        console.log(`Processando inscrição ${registration.id}...`);
        
        // Buscar transação relacionada
        const transaction = await prisma.paymentTransaction.findFirst({
          where: {
            entityId: registration.id
          }
        });
        
        let newProtocol: string;
        
        if (transaction?.protocol) {
          console.log(`Encontrada transação com protocolo: ${transaction.protocol}`);
          newProtocol = transaction.protocol;
        } else {
          // Gerar novo protocolo se não encontrou transação
          newProtocol = generateEventProtocol();
          console.log(`Gerado novo protocolo: ${newProtocol}`);
        }
        
        // Atualizar inscrição com protocolo
        await prisma.registration.update({
          where: {
            id: registration.id
          },
          data: {
            protocol: newProtocol
          }
        });
        
        console.log(`Inscrição ${registration.id} atualizada com protocolo ${newProtocol}`);
        results.registrationsFixed++;
      } catch (error) {
        const errorMessage = `Erro ao corrigir inscrição ${registration.id}: ${error instanceof Error ? error.message : String(error)}`;
        console.error(errorMessage);
        results.errors.push(errorMessage);
      }
    }
    
    // 3. Buscar pagamentos sem entityId
    const orphanPayments = await prisma.paymentTransaction.findMany({
      where: {
        OR: [
          { entityId: "" },
          { entityId: { equals: "" } }
        ]
      }
    });
    
    results.paymentsChecked = orphanPayments.length;
    console.log(`Encontrados ${orphanPayments.length} pagamentos sem entityId.`);
    
    // 4. Vincular pagamentos órfãos a inscrições
    for (const payment of orphanPayments) {
      try {
        if (!payment.protocol) continue;
        
        // Tentar encontrar inscrição pelo protocolo
        const protocolVariations = normalizeProtocol(payment.protocol);
        
        const registration = await prisma.registration.findFirst({
          where: {
            protocol: {
              in: protocolVariations
            }
          }
        });
        
        if (registration) {
          console.log(`Encontrada inscrição ${registration.id} para pagamento ${payment.id}`);
          
          // Atualizar transação com entityId
          await prisma.paymentTransaction.update({
            where: {
              id: payment.id
            },
            data: {
              entityId: registration.id,
              entityType: "EVENT_REGISTRATION"
            }
          });
          
          console.log(`Pagamento ${payment.id} vinculado à inscrição ${registration.id}`);
          results.paymentsFixed++;
        }
      } catch (error) {
        const errorMessage = `Erro ao vincular pagamento ${payment.id}: ${error instanceof Error ? error.message : String(error)}`;
        console.error(errorMessage);
        results.errors.push(errorMessage);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Correção de protocolos concluída",
      results
    });
    
  } catch (error) {
    console.error("Erro geral:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : "Erro desconhecido ao corrigir protocolos"
      }, 
      { status: 500 }
    );
  }
}
