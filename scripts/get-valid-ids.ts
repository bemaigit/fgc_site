import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    // Buscar usuários
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true
      },
      take: 5
    });
    
    console.log('Usuários disponíveis:');
    console.table(users);
    
    // Buscar modalidades
    const modalities = await prisma.eventModality.findMany({
      select: {
        id: true,
        name: true
      },
      take: 5
    });
    
    console.log('\nModalidades disponíveis:');
    console.table(modalities);
    
    // Buscar categorias
    const categories = await prisma.eventCategory.findMany({
      select: {
        id: true,
        name: true,
        modalityId: true
      },
      take: 5
    });
    
    console.log('\nCategorias disponíveis:');
    console.table(categories);
    
    // Buscar gêneros
    const genders = await prisma.gender.findMany({
      select: {
        id: true,
        name: true
      },
      take: 5
    });
    
    console.log('\nGêneros disponíveis:');
    console.table(genders);
    
  } catch (error) {
    console.error('Erro ao buscar dados:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
