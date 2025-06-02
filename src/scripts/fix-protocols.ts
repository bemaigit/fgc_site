/**
 * Script para corrigir protocolos em registros existentes
 * 
 * Este script:
 * 1. Busca todas as inscrições sem protocolo
 * 2. Verifica se existe uma transação de pagamento relacionada
 * 3. Atualiza o protocolo da inscrição com o protocolo da transação
 * 4. Para inscrições sem transação, gera um novo protocolo
 * 
 * Uso: npx ts-node -r tsconfig-paths/register src/scripts/fix-protocols.ts
 */

import { PrismaClient } from '@prisma/client';
import { normalizeProtocol, generateEventProtocol } from '../lib/protocols/utils';

const prisma = new PrismaClient();

async function fixRegistrationProtocols() {
  console.log('Iniciando correção de protocolos...');
  
  // 1. Buscar inscrições sem protocolo ou com protocolo inválido
  const incompleteRegistrations = await prisma.registration.findMany({
    where: {
      OR: [
        { protocol: null },
        { protocol: '' }
      ]
    }
  });
  
  console.log(`Encontradas ${incompleteRegistrations.length} inscrições com protocolo faltando.`);
  
  // Contador de correções
  let corrected = 0;
  
  // 2. Para cada inscrição, tentar encontrar transação de pagamento relacionada
  for (const registration of incompleteRegistrations) {
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
    corrected++;
  }
  
  console.log(`\nResumo da operação:`);
  console.log(`- Inscrições analisadas: ${incompleteRegistrations.length}`);
  console.log(`- Protocolos corrigidos: ${corrected}`);
  console.log('Operação concluída!');
}

// Buscar pagamentos sem entityId
async function fixOrphanPayments() {
  console.log('\nVerificando pagamentos sem entityId...');
  
  const orphanPayments = await prisma.paymentTransaction.findMany({
    where: {
      OR: [
        { entityId: '' },
        { entityId: { equals: '' } }
      ]
    }
  });
  
  console.log(`Encontrados ${orphanPayments.length} pagamentos sem entityId.`);
  
  for (const payment of orphanPayments) {
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
          entityType: 'EVENT_REGISTRATION'
        }
      });
      
      console.log(`Pagamento ${payment.id} vinculado à inscrição ${registration.id}`);
    }
  }
}

// Executar funções de correção
async function main() {
  try {
    await fixRegistrationProtocols();
    await fixOrphanPayments();
    
    console.log('\nTodas as correções foram aplicadas com sucesso!');
  } catch (error) {
    console.error('Erro durante a execução do script:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
