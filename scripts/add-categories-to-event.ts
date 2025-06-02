import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();
const EVENT_ID = '3ea9c87b-9e05-4c2a-a688-b3d8ae7604c6'; // ID do evento "Evento Teste Gratuito"

async function main() {
  try {
    // 1. Verificar categorias existentes
    const categories = await prisma.eventCategory.findMany({
      select: {
        id: true,
        name: true,
        description: true
      },
      take: 10
    });

    console.log('Categorias existentes:');
    console.log(JSON.stringify(categories, null, 2));

    // 2. Verificar se o evento já tem categorias
    const eventCategories = await prisma.eventToCategory.findMany({
      where: {
        eventId: EVENT_ID
      },
      include: {
        EventCategory: true
      }
    });

    console.log('\nCategorias do evento:');
    console.log(JSON.stringify(eventCategories, null, 2));

    // 3. Se não houver categorias, adicionar algumas
    if (eventCategories.length === 0 && categories.length > 0) {
      console.log('\nAdicionando categorias ao evento...');
      
      // Selecionar até 3 categorias para adicionar ao evento
      const categoriesToAdd = categories.slice(0, Math.min(3, categories.length));
      
      for (const category of categoriesToAdd) {
        await prisma.eventToCategory.create({
          data: {
            id: randomUUID(),
            eventId: EVENT_ID,
            categoryId: category.id
          }
        });
        console.log(`Categoria "${category.name}" adicionada ao evento.`);
      }
      
      // Verificar categorias adicionadas
      const updatedEventCategories = await prisma.eventToCategory.findMany({
        where: {
          eventId: EVENT_ID
        },
        include: {
          EventCategory: true
        }
      });
      
      console.log('\nCategorias do evento atualizadas:');
      console.log(JSON.stringify(updatedEventCategories, null, 2));
    }

  } catch (error) {
    console.error('Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
