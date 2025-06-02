import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const EVENT_ID = '3ea9c87b-9e05-4c2a-a688-b3d8ae7604c6'; // ID do evento "Evento Teste Gratuito"

async function main() {
  try {
    // Excluir todas as inscrições do evento
    const result = await prisma.registration.deleteMany({
      where: {
        eventId: EVENT_ID
      }
    });
    
    console.log(`Removidas ${result.count} inscrições do evento.`);
    
  } catch (error) {
    console.error('Erro ao remover inscrições:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
