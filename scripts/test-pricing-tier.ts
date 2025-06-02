import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

// Inicializar o Prisma Client
const prisma = new PrismaClient();

async function main() {
  try {
    // Primeiro, vamos buscar um evento existente para associar o lote de preço
    const event = await prisma.event.findFirst({
      where: {
        // Filtrar por eventos publicados
        published: true
      }
    });

    if (!event) {
      console.error('Nenhum evento encontrado para testar');
      return;
    }

    console.log('Evento encontrado:', event.id, event.title);

    // Vamos testar diferentes formatos de preço
    const testPrices = [
      { format: 'Número', value: 100 },
      { format: 'String numérica', value: '150' },
      { format: 'String com formatação', value: 'R$ 200,00' },
      { format: 'String com toFixed(2)', value: (250).toFixed(2) },
      { format: 'Decimal string', value: '300.50' }
    ];

    // Testar cada formato de preço
    for (const test of testPrices) {
      console.log(`\nTestando formato: ${test.format} - Valor original: ${test.value}`);
      
      try {
        // Processar o preço conforme a lógica da API
        let processedPrice;
        
        if (typeof test.value === 'string') {
          // Remover formatação de moeda se existir
          const cleanValue = test.value.replace(/[^\d.,]/g, '').replace(',', '.');
          processedPrice = parseFloat(cleanValue);
        } else {
          processedPrice = test.value;
        }
        
        if (isNaN(processedPrice)) {
          console.error('Preço inválido após processamento');
          continue;
        }
        
        // Formatar para o tipo Decimal do Prisma
        const priceForPrisma = processedPrice.toFixed(2);
        console.log('Preço processado:', processedPrice);
        console.log('Preço formatado para Prisma:', priceForPrisma);
        
        // Criar o lote de preço
        const pricingTier = await prisma.eventPricingTier.create({
          data: {
            id: uuidv4(),
            eventId: event.id,
            name: `Teste ${test.format}`,
            description: `Lote de teste para formato ${test.format}`,
            price: priceForPrisma,
            startDate: new Date(),
            endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            maxEntries: 100,
            active: true,
            updatedAt: new Date()
          }
        });
        
        console.log('Lote de preço criado com sucesso:', pricingTier.id);
        console.log('Preço salvo no banco:', pricingTier.price);
      } catch (error) {
        console.error(`Erro ao criar lote com formato ${test.format}:`, error);
      }
    }
    
    // Buscar todos os lotes de preço criados para verificar
    const createdTiers = await prisma.eventPricingTier.findMany({
      where: {
        eventId: event.id,
        name: {
          startsWith: 'Teste '
        }
      }
    });
    
    console.log('\nLotes de preço criados:');
    createdTiers.forEach(tier => {
      console.log(`- ${tier.name}: ${tier.price} (ID: ${tier.id})`);
    });
    
  } catch (error) {
    console.error('Erro geral:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  });
