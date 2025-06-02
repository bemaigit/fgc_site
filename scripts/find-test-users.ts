import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    // Buscar usuários que têm "teste" no nome ou email
    const testUsers = await prisma.user.findMany({
      where: {
        OR: [
          {
            name: {
              contains: 'teste',
              mode: 'insensitive'
            }
          },
          {
            email: {
              contains: 'teste',
              mode: 'insensitive'
            }
          }
        ]
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true
      }
    });

    console.log(`Encontrados ${testUsers.length} usuários de teste:`);
    console.log(JSON.stringify(testUsers, null, 2));

    // Buscar alguns usuários aleatórios para complementar, se necessário
    if (testUsers.length < 10) {
      const randomUsers = await prisma.user.findMany({
        take: 10 - testUsers.length,
        orderBy: {
          id: 'desc'
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true
        }
      });

      console.log(`\nEncontrados ${randomUsers.length} usuários adicionais:`);
      console.log(JSON.stringify(randomUsers, null, 2));
    }

  } catch (error) {
    console.error('Erro ao buscar usuários de teste:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
