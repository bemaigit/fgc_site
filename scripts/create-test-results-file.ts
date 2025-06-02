import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();
const EVENT_ID = '3ea9c87b-9e05-4c2a-a688-b3d8ae7604c6'; // ID do evento "Evento Teste Gratuito"

// Função para gerar um tempo aleatório no formato mm:ss.ms
function generateRandomTime() {
  const minutes = Math.floor(Math.random() * 10) + 1; // 1-10 minutos
  const seconds = Math.floor(Math.random() * 60); // 0-59 segundos
  const milliseconds = Math.floor(Math.random() * 1000); // 0-999 milissegundos
  
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(3, '0')}`;
}

// Função para gerar uma pontuação aleatória
function generateRandomScore() {
  return Math.floor(Math.random() * 1000) + 1; // 1-1000 pontos
}

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
      console.log('O evento não possui categorias.');
      return;
    }

    console.log(`Encontradas ${eventCategories.length} categorias no evento.`);
    
    // 2. Buscar as inscrições do evento
    const registrations = await prisma.registration.findMany({
      where: {
        eventId: EVENT_ID
      },
      select: {
        id: true,
        name: true,
        userId: true,
        categoryid: true,
        email: true
      }
    });

    if (registrations.length === 0) {
      console.log('O evento não possui inscrições.');
      return;
    }

    console.log(`Encontradas ${registrations.length} inscrições no evento.`);
    
    // 3. Agrupar inscrições por categoria
    const registrationsByCategory: Record<string, any[]> = {};
    
    registrations.forEach(registration => {
      const categoryId = registration.categoryid || 'unknown';
      
      if (!registrationsByCategory[categoryId]) {
        registrationsByCategory[categoryId] = [];
      }
      
      registrationsByCategory[categoryId].push(registration);
    });
    
    // 4. Gerar resultados aleatórios para cada categoria
    const resultsData: any[] = [];
    
    for (const eventCategory of eventCategories) {
      const categoryId = eventCategory.categoryId;
      const categoryName = eventCategory.EventCategory.name;
      const categoryRegistrations = registrationsByCategory[categoryId] || [];
      
      console.log(`Gerando resultados para categoria ${categoryName} (${categoryRegistrations.length} inscrições)`);
      
      // Embaralhar as inscrições para gerar posições aleatórias
      const shuffledRegistrations = [...categoryRegistrations].sort(() => Math.random() - 0.5);
      
      // Gerar resultados para cada inscrição
      shuffledRegistrations.forEach((registration, index) => {
        const position = index + 1;
        const result = generateRandomTime(); // Tempo para corridas
        const score = generateRandomScore(); // Pontuação para outros tipos de competição
        
        // Buscar clube do atleta (simulado)
        const clubName = `Clube ${Math.floor(Math.random() * 10) + 1}`;
        
        resultsData.push({
          categoria: categoryName,
          posicao: position,
          atleta: registration.name,
          email: registration.email,
          clube: clubName,
          tempo: result,
          pontos: score
        });
      });
    }
    
    // 5. Criar arquivo CSV com os resultados
    const csvHeader = 'categoria,posicao,atleta,email,clube,tempo,pontos\n';
    const csvRows = resultsData.map(row => 
      `${row.categoria},${row.posicao},${row.atleta},${row.email},${row.clube},${row.tempo},${row.pontos}`
    ).join('\n');
    
    const csvContent = csvHeader + csvRows;
    const outputDir = path.join(process.cwd(), 'public', 'test-data');
    
    // Criar diretório se não existir
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    const filePath = path.join(outputDir, 'resultados-teste.csv');
    fs.writeFileSync(filePath, csvContent);
    
    console.log(`\nArquivo de resultados gerado com sucesso: ${filePath}`);
    console.log(`Total de ${resultsData.length} resultados gerados.`);
    
  } catch (error) {
    console.error('Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
