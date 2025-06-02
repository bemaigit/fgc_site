import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();
const EVENT_ID = '3ea9c87b-9e05-4c2a-a688-b3d8ae7604c6'; // ID do evento "Evento Teste Gratuito"

async function main() {
  try {
    // 1. Buscar as categorias do evento
    const eventCategories = await prisma.eventToCategory.findMany({
      where: {
        eventId: EVENT_ID
      },
      include: {
        EventCategory: true
      }
    });

    if (eventCategories.length === 0) {
      console.log('O evento não possui categorias. Execute o script add-categories-to-event.ts primeiro.');
      return;
    }

    console.log(`Encontradas ${eventCategories.length} categorias no evento.`);
    
    // 2. Buscar usuários de teste
    const testUsers = await prisma.user.findMany({
      where: {
        name: {
          contains: 'teste',
          mode: 'insensitive'
        }
      },
      select: {
        id: true,
        name: true,
        email: true
      },
      take: 30 // Limitar a 30 usuários para não sobrecarregar
    });

    if (testUsers.length === 0) {
      console.log('Não foram encontrados usuários de teste.');
      return;
    }

    console.log(`Encontrados ${testUsers.length} usuários de teste.`);
    
    // 3. Verificar inscrições existentes
    const existingRegistrations = await prisma.registration.findMany({
      where: {
        eventId: EVENT_ID
      },
      select: {
        id: true,
        userId: true,
        categoryid: true
      }
    });

    console.log(`Encontradas ${existingRegistrations.length} inscrições existentes no evento.`);

    // Se já existirem inscrições, não criar novas
    if (existingRegistrations.length > 0) {
      console.log('O evento já possui inscrições. Não serão criadas novas inscrições.');
      return;
    }

    // 4. Distribuir usuários entre as categorias
    const registrations = [];
    
    // Distribuir os usuários entre as categorias disponíveis
    for (let i = 0; i < testUsers.length; i++) {
      const user = testUsers[i];
      const categoryIndex = i % eventCategories.length;
      const category = eventCategories[categoryIndex];
      
      // Verificar se o usuário tem nome e email válidos
      if (!user.name || !user.email) {
        console.log(`Usuário ${user.id} não tem nome ou email válidos. Pulando...`);
        continue;
      }
      
      // Gerar um número de protocolo único
      const protocol = `PROT-${Math.floor(Math.random() * 10000)}`;
      
      // Criar a inscrição
      const registration = await prisma.registration.create({
        data: {
          id: randomUUID(),
          eventId: EVENT_ID,
          name: user.name,
          email: user.email,
          phone: `(${Math.floor(Math.random() * 90) + 10}) 9${Math.floor(Math.random() * 9000) + 1000}-${Math.floor(Math.random() * 9000) + 1000}`,
          status: 'CONFIRMED',
          userId: user.id,
          cpf: `${Math.floor(Math.random() * 900) + 100}.${Math.floor(Math.random() * 900) + 100}.${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 90) + 10}`,
          protocol: protocol,
          birthdate: new Date(1980 + Math.floor(Math.random() * 20), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
          categoryid: category.categoryId,
          updatedAt: new Date()
        }
      });
      
      registrations.push(registration);
      console.log(`Inscrição criada para ${user.name} na categoria ${category.EventCategory.name}`);
    }
    
    console.log(`\nTotal de ${registrations.length} inscrições criadas com sucesso!`);

  } catch (error) {
    console.error('Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
