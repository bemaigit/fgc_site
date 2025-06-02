import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

async function main() {
  try {
    const now = new Date();
    
    // Dados de teste para criar um evento
    const eventId = uuidv4();
    
    console.log('Criando evento de teste via Prisma...');
    
    const event = await prisma.event.create({
      data: {
        id: eventId,
        title: 'Evento de Teste Prisma',
        description: 'Este é um evento de teste criado via Prisma',
        slug: `evento-teste-prisma-${Date.now()}`,
        location: 'Campinas, SP',
        startDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), // 7 dias a partir de hoje
        endDate: new Date(now.getTime() + 8 * 24 * 60 * 60 * 1000), // 8 dias a partir de hoje
        registrationEnd: new Date(now.getTime() + 6 * 24 * 60 * 60 * 1000), // 6 dias a partir de hoje
        status: 'DRAFT',
        published: false,
        isFree: true,
        addressDetails: 'Rua de Teste, 123',
        zipCode: '13000-000',
        latitude: -22.9064,
        longitude: -47.0616,
        
        // Campos de imagens e regulamento
        coverImage: 'https://exemplo.com/imagem-teste.jpg',
        posterImage: 'https://exemplo.com/poster-teste.jpg',
        regulationPdf: 'https://exemplo.com/regulamento-teste.pdf',
        
        // Organizador (usando ID válido do banco de dados)
        organizerId: '5fa9fec3-1936-431d-bbac-faf36c62c043', // Administrador
        
        createdAt: now,
        updatedAt: now,
        
        // Relações many-to-many (usando IDs válidos do banco de dados)
        EventToModality: {
          create: [{
            id: uuidv4(),
            modalityId: 'cm7ro2ao80001kja8o4jdj323', // Ciclismo de Estrada
            createdAt: now
          }]
        },
        EventToCategory: {
          create: [{
            id: uuidv4(),
            categoryId: 'cm7rosfmk0009kja876mny3kr', // ELITE
            createdAt: now
          }]
        },
        EventToGender: {
          create: [{
            id: uuidv4(),
            genderId: 'b4f82f14-79d6-4123-a29b-4d45ff890a52', // Masculino
            createdAt: now
          }]
        },
        
        // Lotes de preço
        EventPricingTier: {
          create: [{
            id: uuidv4(),
            name: 'Lote Teste',
            description: 'Lote de teste',
            price: 100.00,
            startDate: now,
            endDate: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000), // 5 dias a partir de hoje
            maxEntries: 100,
            active: true,
            createdAt: now,
            updatedAt: now
          }]
        }
      }
    });
    
    console.log('Evento criado com sucesso. ID:', event.id);
    
    // Verificar se os campos de imagens e regulamento foram salvos corretamente
    const createdEvent = await prisma.event.findUnique({
      where: { id: event.id },
      select: {
        id: true,
        title: true,
        coverImage: true,
        posterImage: true,
        regulationPdf: true
      }
    });
    
    console.log('Evento criado com campos de imagens e regulamento:');
    console.log(JSON.stringify(createdEvent, null, 2));
    
  } catch (error) {
    console.error('Erro ao criar evento:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
