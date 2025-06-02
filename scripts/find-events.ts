import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    // Buscar eventos finalizados
    const finishedEvents = await prisma.event.findMany({
      where: {
        endDate: {
          lt: new Date()
        }
      },
      select: {
        id: true,
        title: true,
        startDate: true,
        endDate: true,
        status: true,
        _count: {
          select: {
            EventToCategory: true
          }
        }
      },
      orderBy: {
        endDate: 'desc'
      },
      take: 5
    });

    console.log('Eventos finalizados:');
    console.log(JSON.stringify(finishedEvents, null, 2));

    // Buscar eventos de teste
    const testEvents = await prisma.event.findMany({
      where: {
        title: {
          contains: 'teste',
          mode: 'insensitive'
        }
      },
      select: {
        id: true,
        title: true,
        startDate: true,
        endDate: true,
        status: true,
        _count: {
          select: {
            EventToCategory: true
          }
        }
      }
    });

    console.log('\nEventos de teste:');
    console.log(JSON.stringify(testEvents, null, 2));

  } catch (error) {
    console.error('Erro ao buscar eventos:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
