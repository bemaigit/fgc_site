import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    // Verificar países
    console.log('Verificando países...');
    const countries = await prisma.country.findMany({
      select: {
        id: true,
        name: true
      },
      take: 10
    });
    
    console.log('Países disponíveis:');
    console.table(countries);
    
    // Verificar estados
    console.log('\nVerificando estados...');
    const states = await prisma.state.findMany({
      select: {
        id: true,
        name: true,
        countryId: true
      },
      take: 10
    });
    
    console.log('Estados disponíveis:');
    console.table(states);
    
    // Verificar cidades
    console.log('\nVerificando cidades...');
    const cities = await prisma.city.findMany({
      select: {
        id: true,
        name: true,
        stateId: true
      },
      take: 10
    });
    
    console.log('Cidades disponíveis:');
    console.table(cities);
    
  } catch (error) {
    console.error('Erro ao verificar IDs de localização:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
