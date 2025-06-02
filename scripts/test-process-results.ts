import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import { parse } from 'csv-parse/sync';
import { processResultFile } from '../src/services/resultProcessor';

const prisma = new PrismaClient();
const EVENT_ID = '3ea9c87b-9e05-4c2a-a688-b3d8ae7604c6'; // ID do evento "Evento Teste Gratuito"

async function main() {
  try {
    console.log('Iniciando teste de processamento de resultados...');
    
    // 1. Verificar se o arquivo de resultados existe
    const filePath = path.join(process.cwd(), 'public', 'test-data', 'resultados-teste.csv');
    
    if (!fs.existsSync(filePath)) {
      console.error('Arquivo de resultados não encontrado. Execute o script create-test-results-file.ts primeiro.');
      return;
    }
    
    console.log(`Arquivo de resultados encontrado: ${filePath}`);
    
    // 2. Ler o conteúdo do arquivo
    const fileContent = fs.readFileSync(filePath);
    console.log('Arquivo lido com sucesso.');
    
    // 3. Processar o arquivo usando o serviço de processamento de resultados
    console.log('Processando resultados...');
    
    // Limpar resultados existentes para o evento
    const deleteResult = await prisma.$executeRaw`DELETE FROM "EventTopResult" WHERE "eventId" = ${EVENT_ID}`;
    console.log(`Resultados anteriores removidos: ${deleteResult}`);
    
    // Processar o arquivo - corrigindo a ordem dos parâmetros
    const results = await processResultFile(fileContent, 'csv', EVENT_ID);
    
    console.log(`Processamento concluído. ${results.length} resultados processados.`);
    
    // 4. Verificar os resultados no banco de dados
    type EventTopResult = {
      id: string;
      eventId: string;
      categoryId: string;
      position: number;
      userId: string | null;
      athleteName: string;
      clubId: string | null;
      clubName: string | null;
      result: string;
    };
    
    const savedResults = await prisma.$queryRaw<EventTopResult[]>`
      SELECT * FROM "EventTopResult" 
      WHERE "eventId" = ${EVENT_ID}
      ORDER BY "categoryId" ASC, "position" ASC
    `;
    
    console.log(`\nResultados salvos no banco de dados: ${savedResults.length}`);
    
    // Agrupar por categoria para facilitar a visualização
    const resultsByCategory: Record<string, EventTopResult[]> = {};
    
    savedResults.forEach((result: EventTopResult) => {
      if (!resultsByCategory[result.categoryId]) {
        resultsByCategory[result.categoryId] = [];
      }
      
      resultsByCategory[result.categoryId].push(result);
    });
    
    // Exibir resultados por categoria
    for (const categoryId in resultsByCategory) {
      const categoryResults = resultsByCategory[categoryId];
      const category = await prisma.eventCategory.findUnique({
        where: { id: categoryId }
      });
      
      console.log(`\nCategoria: ${category?.name || categoryId}`);
      console.log('Posição | Atleta | Clube | Resultado');
      console.log('----------------------------------------');
      
      categoryResults.forEach((result: EventTopResult) => {
        console.log(`${result.position.toString().padStart(2, ' ')} | ${result.athleteName} | ${result.clubName || 'N/A'} | ${result.result}`);
      });
    }
    
    // 5. Verificar a correspondência com usuários
    const resultsWithUsers = savedResults.filter((r: EventTopResult) => r.userId !== null);
    console.log(`\nResultados vinculados a usuários: ${resultsWithUsers.length} de ${savedResults.length} (${Math.round(resultsWithUsers.length / savedResults.length * 100)}%)`);
    
    // 6. Verificar a correspondência com clubes
    const resultsWithClubs = savedResults.filter((r: EventTopResult) => r.clubId !== null);
    console.log(`Resultados vinculados a clubes: ${resultsWithClubs.length} de ${savedResults.length} (${Math.round(resultsWithClubs.length / savedResults.length * 100)}%)`);
    
    console.log('\nTeste de processamento de resultados concluído com sucesso!');
    
  } catch (error) {
    console.error('Erro durante o teste:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
