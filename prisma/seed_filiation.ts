import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Criar modalidades
  const modalities = [
    {
      name: 'BMX',
      price: 25.00,
      active: true,
      order: 1
    },
    {
      name: 'Mountain Bike',
      price: 100.00,
      active: true,
      order: 2
    },
    {
      name: 'Ciclismo de Estrada',
      price: 100.00,
      active: true,
      order: 3
    }
  ];

  // Criar categorias
  const categories = [
    { name: 'ELITE', order: 1 },
    { name: 'SUB 23', order: 2 },
    { name: 'SUB-30', order: 3 },
    { name: 'JUNIOR', order: 4 },
    { name: 'JUVENIL', order: 5 },
    { name: 'INFANTOJUVENIL', order: 6 },
    { name: 'MASTER A1', order: 7 },
    { name: 'MASTER A2', order: 8 },
    { name: 'MASTER B1', order: 9 },
    { name: 'MASTER B2', order: 10 },
    { name: 'MASTER C1', order: 11 },
    { name: 'MASTER C2', order: 12 },
    { name: 'MASTER D1', order: 13 },
    { name: 'MASTER D2', order: 14 }
  ];

  // Inserir modalidades
  for (const modality of modalities) {
    await prisma.filiationModality.create({
      data: modality
    });
  }

  // Inserir categorias
  for (const category of categories) {
    await prisma.filiationCategory.create({
      data: {
        ...category,
        active: true
      }
    });
  }

  // Criar configuração inicial
  await prisma.filiationConfig.create({
    data: {
      id: 'default-filiation',
      postPaymentInstructions: 'Instruções sobre o procedimento CBC serão adicionadas aqui.'
    }
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
