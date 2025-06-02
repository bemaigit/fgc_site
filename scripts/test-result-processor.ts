import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import { parse } from 'csv-parse/sync';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();
const EVENT_ID = '3ea9c87b-9e05-4c2a-a688-b3d8ae7604c6'; // ID do evento "Evento Teste Gratuito"

// Interface para os resultados processados
interface ProcessedResult {
  id: string;
  eventId: string;
  categoryId: string;
  position: number;
  userId: string | null;
  athleteName: string;
  clubId: string | null;
  clubName: string | null;
  result: string;
  createdAt: Date;
  updatedAt: Date;
}

// Função para converter o arquivo CSV em um array de objetos
function parseCSV(fileContent: Buffer): any[] {
  const content = fileContent.toString('utf-8');
  const records = parse(content, {
    columns: true,
    skip_empty_lines: true,
    trim: true
  });
  
  return records;
}

// Função para processar o arquivo de resultados
async function processResults(eventId: string, fileContent: Buffer): Promise<ProcessedResult[]> {
  try {
    console.log('Processando arquivo CSV...');
    
    // Converter o arquivo para um array de objetos
    const records = parseCSV(fileContent);
    console.log(`Arquivo CSV contém ${records.length} registros.`);
    
    // Obter as categorias do evento
    const eventCategories = await prisma.eventToCategory.findMany({
      where: { eventId },
      include: { EventCategory: true }
    });
    
    const categoryMap = new Map();
    eventCategories.forEach(ec => {
      categoryMap.set(ec.EventCategory.name.toUpperCase(), ec.categoryId);
    });
    
    console.log(`Evento possui ${eventCategories.length} categorias.`);
    
    // Agrupar resultados por categoria
    const resultsByCategory: Record<string, any[]> = {};
    
    records.forEach(record => {
      const categoryName = record.categoria?.toUpperCase();
      if (!categoryName) return;
      
      const categoryId = categoryMap.get(categoryName);
      if (!categoryId) {
        console.log(`Categoria não encontrada: ${categoryName}`);
        return;
      }
      
      if (!resultsByCategory[categoryId]) {
        resultsByCategory[categoryId] = [];
      }
      
      resultsByCategory[categoryId].push({
        position: parseInt(record.posicao) || 0,
        athleteName: record.atleta || 'Desconhecido',
        email: record.email,
        clubName: record.clube,
        result: record.tempo || record.pontos || '0'
      });
    });
    
    // Processar os resultados para cada categoria
    const processedResults: ProcessedResult[] = [];
    
    for (const categoryId in resultsByCategory) {
      const categoryResults = resultsByCategory[categoryId];
      
      // Ordenar por posição
      categoryResults.sort((a, b) => a.position - b.position);
      
      // Pegar os 5 primeiros resultados
      const topResults = categoryResults.slice(0, 5);
      
      for (const result of topResults) {
        // Buscar o usuário pelo email
        let userId = null;
        if (result.email) {
          const user = await prisma.user.findFirst({
            where: { email: result.email }
          });
          if (user) {
            userId = user.id;
          }
        }
        
        // Buscar o clube pelo nome
        let clubId = null;
        if (result.clubName) {
          const club = await prisma.club.findFirst({
            where: { 
              clubName: { 
                contains: result.clubName,
                mode: 'insensitive'
              }
            }
          });
          if (club) {
            clubId = club.id;
          }
        }
        
        // Criar o objeto de resultado processado
        const processedResult: ProcessedResult = {
          id: randomUUID(),
          eventId,
          categoryId,
          position: result.position,
          userId,
          athleteName: result.athleteName,
          clubId,
          clubName: result.clubName,
          result: result.result,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        processedResults.push(processedResult);
        
        // Salvar o resultado no banco de dados
        await prisma.eventTopResult.create({
          data: processedResult
        });
      }
    }
    
    return processedResults;
  } catch (error) {
    console.error('Erro ao processar resultados:', error);
    throw error;
  }
}

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
    const deleteResult = await prisma.eventTopResult.deleteMany({
      where: { eventId: EVENT_ID }
    });
    console.log(`Resultados anteriores removidos: ${deleteResult.count}`);
    
    // Processar o arquivo
    const results = await processResults(EVENT_ID, fileContent);
    
    console.log(`Processamento concluído. ${results.length} resultados processados.`);
    
    // 4. Verificar os resultados no banco de dados
    const savedResults = await prisma.eventTopResult.findMany({
      where: { eventId: EVENT_ID },
      orderBy: [
        { categoryId: 'asc' },
        { position: 'asc' }
      ]
    });
    
    console.log(`\nResultados salvos no banco de dados: ${savedResults.length}`);
    
    // Agrupar por categoria para facilitar a visualização
    const resultsByCategory: Record<string, any[]> = {};
    
    savedResults.forEach(result => {
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
      
      categoryResults.forEach(result => {
        console.log(`${result.position.toString().padStart(2, ' ')} | ${result.athleteName} | ${result.clubName || 'N/A'} | ${result.result}`);
      });
    }
    
    // 5. Verificar a correspondência com usuários
    const resultsWithUsers = savedResults.filter(r => r.userId !== null);
    console.log(`\nResultados vinculados a usuários: ${resultsWithUsers.length} de ${savedResults.length} (${Math.round(resultsWithUsers.length / savedResults.length * 100)}%)`);
    
    // 6. Verificar a correspondência com clubes
    const resultsWithClubs = savedResults.filter(r => r.clubId !== null);
    console.log(`Resultados vinculados a clubes: ${resultsWithClubs.length} de ${savedResults.length} (${Math.round(resultsWithClubs.length / savedResults.length * 100)}%)`);
    
    console.log('\nTeste de processamento de resultados concluído com sucesso!');
    
  } catch (error) {
    console.error('Erro durante o teste:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
