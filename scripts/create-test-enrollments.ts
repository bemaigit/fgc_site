import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();
const EVENT_ID = '3ea9c87b-9e05-4c2a-a688-b3d8ae7604c6'; // ID do evento "Evento Teste Gratuito"

// Nomes fictícios para atletas
const athleteNames = [
  'João Silva', 'Maria Oliveira', 'Pedro Santos', 'Ana Costa', 'Carlos Souza',
  'Fernanda Lima', 'Ricardo Pereira', 'Juliana Alves', 'Marcos Rodrigues', 'Patrícia Ferreira',
  'Lucas Carvalho', 'Camila Gomes', 'Bruno Martins', 'Amanda Ribeiro', 'Felipe Almeida',
  'Larissa Barbosa', 'Gustavo Cardoso', 'Daniela Teixeira', 'Rafael Moreira', 'Bianca Correia'
];

// Emails fictícios
const generateEmail = (name: string) => {
  const nameParts = name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').split(' ');
  return `${nameParts[0]}.${nameParts[nameParts.length - 1]}@example.com`;
};

// Telefones fictícios
const generatePhone = () => {
  return `(${Math.floor(Math.random() * 90) + 10}) 9${Math.floor(Math.random() * 9000) + 1000}-${Math.floor(Math.random() * 9000) + 1000}`;
};

// CPFs fictícios
const generateCPF = () => {
  const n1 = Math.floor(Math.random() * 10);
  const n2 = Math.floor(Math.random() * 10);
  const n3 = Math.floor(Math.random() * 10);
  const n4 = Math.floor(Math.random() * 10);
  const n5 = Math.floor(Math.random() * 10);
  const n6 = Math.floor(Math.random() * 10);
  const n7 = Math.floor(Math.random() * 10);
  const n8 = Math.floor(Math.random() * 10);
  const n9 = Math.floor(Math.random() * 10);
  
  return `${n1}${n2}${n3}.${n4}${n5}${n6}.${n7}${n8}${n9}-00`;
};

// Gerar data de nascimento aleatória (entre 18 e 45 anos)
const generateBirthdate = () => {
  const now = new Date();
  const year = now.getFullYear() - Math.floor(Math.random() * 28) - 18; // 18-45 anos
  const month = Math.floor(Math.random() * 12);
  const day = Math.floor(Math.random() * 28) + 1;
  return new Date(year, month, day);
};

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
    
    // 2. Verificar usuários existentes para usar como atletas
    const existingUsers = await prisma.user.findMany({
      take: 10,
      select: {
        id: true,
        name: true,
        email: true
      }
    });

    console.log(`Encontrados ${existingUsers.length} usuários existentes.`);
    
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

    // 4. Criar inscrições fictícias para cada categoria
    console.log('\nCriando inscrições fictícias...');
    
    const registrations = [];
    
    for (const eventCategory of eventCategories) {
      const categoryId = eventCategory.categoryId;
      const categoryName = eventCategory.EventCategory.name;
      
      // Criar entre 5 e 10 inscrições por categoria
      const numRegistrations = Math.floor(Math.random() * 6) + 5;
      console.log(`Criando ${numRegistrations} inscrições para a categoria ${categoryName}...`);
      
      for (let i = 0; i < numRegistrations; i++) {
        // Decidir se usa um usuário existente ou cria um fictício
        const useExistingUser = Math.random() < 0.3 && existingUsers.length > 0;
        
        let userId;
        let name;
        let email;
        
        if (useExistingUser) {
          const randomUser = existingUsers[Math.floor(Math.random() * existingUsers.length)];
          userId = randomUser.id;
          name = randomUser.name || athleteNames[Math.floor(Math.random() * athleteNames.length)];
          email = randomUser.email;
        } else {
          // Usar o primeiro usuário disponível para todas as inscrições fictícias
          // já que o modelo requer um userId válido
          userId = existingUsers[0].id;
          name = athleteNames[Math.floor(Math.random() * athleteNames.length)];
          email = generateEmail(name);
        }
        
        // Criar a inscrição
        const registration = await prisma.registration.create({
          data: {
            id: randomUUID(),
            eventId: EVENT_ID,
            name: name,
            email: email,
            phone: generatePhone(),
            status: 'CONFIRMED',
            userId: userId,
            cpf: generateCPF(),
            protocol: `PROT-${Math.floor(Math.random() * 10000)}`,
            birthdate: generateBirthdate(),
            categoryid: categoryId,
            updatedAt: new Date()
          }
        });
        
        registrations.push(registration);
        console.log(`Inscrição criada para ${name} na categoria ${categoryName}`);
      }
    }
    
    console.log(`\nTotal de ${registrations.length} inscrições criadas com sucesso!`);

  } catch (error) {
    console.error('Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
