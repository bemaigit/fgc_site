import { parse } from 'csv-parse/sync';
import { prisma } from '@/lib/prisma';
import { randomUUID } from 'crypto';

// Interfaces para o processamento de dados
interface RawResultRow {
  [key: string]: string | number;
}

interface ResultRow {
  position?: number;
  athleteName?: string;
  clubName?: string;
  result?: string;
  category?: string;
}

interface ProcessedResult {
  id: string;         // ID único para cada resultado
  eventId: string;    // ID do evento
  categoryId: string; // ID da categoria original, exatamente como está no CSV
  categoryName: string; // Nome da categoria, exatamente como está no CSV
  position: number;
  athleteName: string;
  clubName: string | null;
  result: string;
  userId: string | null;
  clubId: string | null;
}

/**
 * Processa um arquivo de resultados e extrai os resultados de cada categoria
 */
export async function processResultFile(
  fileBuffer: Buffer,
  fileType: string,
  eventId: string
): Promise<ProcessedResult[]> {
  try {
    console.log(`Iniciando processamento de arquivo para o evento ${eventId}`);
    
    // Buscar categorias existentes para este evento
    console.log('Buscando categorias existentes para o evento');
    const eventCategories = await prisma.eventCategory.findMany({
      where: {
        EventToCategory: {
          some: {
            eventId: eventId
          }
        }
      }
    });
    
    console.log(`Encontradas ${eventCategories.length} categorias para o evento`);
    
    // Criar mapeamento de nomes de categorias para IDs válidos
    const categoryMapping: Record<string, string> = {};
    eventCategories.forEach(ec => {
      // Normalizar o nome da categoria para comparação (minúsculas, sem espaços extras)
      const normalizedName = ec.name.toLowerCase().trim();
      categoryMapping[normalizedName] = ec.id;
      
      // Também mapear versões sem especificação de gênero
      if (normalizedName.includes('masculino')) {
        const baseName = normalizedName.replace('masculino', '').trim();
        if (!categoryMapping[baseName]) {
          categoryMapping[baseName] = ec.id;
        }
      }
      
      if (normalizedName.includes('feminino')) {
        const baseName = normalizedName.replace('feminino', '').trim();
        if (!categoryMapping[baseName]) {
          categoryMapping[baseName] = ec.id;
        }
      }
    });
    
    console.log('Mapeamento de categorias:', categoryMapping);
    
    // Extrair dados do arquivo
    const rawData = parseFileToJson(fileBuffer);
    console.log(`Extraídas ${rawData.length} linhas do arquivo`);
    
    // Normalizar os dados para um formato padronizado
    const normalizedData = normalizeData(rawData);
    console.log(`Dados normalizados com ${normalizedData.length} resultados`);
    
    // Agrupar os resultados por categoria, mantendo a categoria EXATA do CSV
    const groupedResults = groupResultsByExactCategory(normalizedData);
    console.log(`Resultados agrupados em ${Object.keys(groupedResults).length} categorias`);
    
    // Extrair os top 5 resultados de cada categoria
    const topResults = extractTopNResults(groupedResults, 5, categoryMapping, eventId);
    console.log(`Extraídos ${topResults.length} resultados no top 5`);
    
    // Enriquecer com informações de usuários/clubes se possível
    const enrichedResults = await enrichResultsWithUserData(topResults, eventId);
    console.log(`Resultados enriquecidos com dados de usuários: ${enrichedResults.length}`);
    
    return enrichedResults;
  } catch (error) {
    console.error('Erro ao processar arquivo de resultados:', error);
    throw error;
  }
}

/**
 * Converte um arquivo CSV para um array de objetos
 */
function parseFileToJson(fileBuffer: Buffer): RawResultRow[] {
  try {
    // Parsear o CSV usando a biblioteca csv-parse
    const records = parse(fileBuffer, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    });
    
    return records;
  } catch (error) {
    console.error('Erro ao processar arquivo CSV:', error);
    throw new Error('Erro ao processar arquivo CSV. Verifique o formato do arquivo.');
  }
}

/**
 * Normaliza os dados para um formato padronizado
 */
function normalizeData(data: RawResultRow[]): ResultRow[] {
  console.log('Normalizando dados...');
  
  return data.map(row => {
    const normalizedRow: ResultRow = {};
    
    // Identificar coluna de posição
    const positionKey = findKeyByPattern(row, ['posição', 'posicao', 'pos', 'colocação', 'colocacao']);
    if (positionKey) {
      normalizedRow.position = Number(row[positionKey]);
    }
    
    // Identificar coluna de nome do atleta
    const athleteKey = findKeyByPattern(row, ['atleta', 'nome', 'competidor', 'name']);
    if (athleteKey) {
      normalizedRow.athleteName = String(row[athleteKey]);
    }
    
    // Identificar coluna de clube
    const clubKey = findKeyByPattern(row, ['clube', 'equipe', 'team', 'club']);
    if (clubKey) {
      normalizedRow.clubName = String(row[clubKey]);
    }
    
    // Identificar coluna de resultado
    const resultKey = findKeyByPattern(row, ['resultado', 'tempo', 'time', 'result']);
    if (resultKey) {
      normalizedRow.result = String(row[resultKey]);
    }
    
    // Identificar coluna de categoria - CRUCIAL para separação correta
    const categoryKey = findKeyByPattern(row, ['categoria', 'category', 'class']);
    if (categoryKey) {
      normalizedRow.category = String(row[categoryKey]);
    }
    
    return normalizedRow;
  });
}

/**
 * Encontra uma chave em um objeto que contenha um dos padrões fornecidos
 */
function findKeyByPattern(obj: RawResultRow, patterns: string[]): string | null {
  for (const key of Object.keys(obj)) {
    const lowerKey = key.toLowerCase();
    if (patterns.some(pattern => lowerKey.includes(pattern))) {
      return key;
    }
  }
  return null;
}

/**
 * Agrupa os resultados por categoria EXATA do CSV
 * Esta é a função MAIS IMPORTANTE para garantir que categorias não se misturem
 */
function groupResultsByExactCategory(data: ResultRow[]): Record<string, ResultRow[]> {
  console.log('Agrupando resultados por categoria exata do CSV...');
  
  const grouped: Record<string, ResultRow[]> = {};
  
  data.forEach(row => {
    if (!row.category) {
      const unknownCategory = 'Sem Categoria';
      if (!grouped[unknownCategory]) {
        grouped[unknownCategory] = [];
      }
      grouped[unknownCategory].push(row);
      return;
    }
    
    // CRUCIAL: Usar a categoria EXATAMENTE como está no CSV, sem modificações
    const exactCategory = String(row.category).trim();
    
    if (!grouped[exactCategory]) {
      grouped[exactCategory] = [];
    }
    
    grouped[exactCategory].push(row);
  });
  
  // Ordenar resultados dentro de cada categoria por posição
  Object.keys(grouped).forEach(category => {
    grouped[category].sort((a, b) => {
      const posA = a.position ? Number(a.position) : Number.MAX_SAFE_INTEGER;
      const posB = b.position ? Number(b.position) : Number.MAX_SAFE_INTEGER;
      return posA - posB;
    });
  });
  
  return grouped;
}

/**
 * Extrai os N primeiros resultados de cada categoria
 */
function extractTopNResults(
  resultsByCategory: Record<string, ResultRow[]>,
  limit: number,
  categoryMapping: Record<string, string>,
  eventId: string
): ProcessedResult[] {
  console.log(`Extraindo top ${limit} resultados de cada categoria...`);
  
  const topResults: ProcessedResult[] = [];
  
  // Log detalhado para depuração
  console.log('Mapeamento de categorias disponível:', categoryMapping);
  console.log('Categorias no arquivo de resultados:', Object.keys(resultsByCategory));
  
  // Verificar categorias que faltam no mapeamento
  const missingCategories = Object.keys(resultsByCategory).filter(
    cat => !Object.keys(categoryMapping).some(
      mappedCat => mappedCat.toLowerCase().includes(cat.toLowerCase()) || cat.toLowerCase().includes(mappedCat.toLowerCase())
    )
  );
  
  if (missingCategories.length > 0) {
    console.warn('ATENÇÃO: Categorias no arquivo sem correspondência no sistema:', missingCategories);
    console.warn('Você precisará adicionar estas categorias ao evento ou ajustar os nomes no arquivo.');
  }
  
  Object.entries(resultsByCategory).forEach(([categoryName, results]) => {
    // Tentar encontrar a categoria no mapeamento (case insensitive)
    let categoryId = categoryMapping[categoryName.toLowerCase().trim()];
    
    // Se não encontrar diretamente, tentar uma correspondência parcial
    if (!categoryId) {
      console.log(`Tentando encontrar correspondência parcial para categoria "${categoryName}"`);
      
      // Tentar encontrar por inclusão (ex: "SUB-23 FEMININO" pode corresponder a "SUB-23" ou "FEMININO")
      const normalizedCatName = categoryName.toLowerCase().trim();
      for (const [key, id] of Object.entries(categoryMapping)) {
        if (normalizedCatName.includes(key) || key.includes(normalizedCatName)) {
          categoryId = id;
          console.log(`Correspondência parcial encontrada: "${categoryName}" -> "${key}" (${id})`);
          break;
        }
      }
    }
    
    if (!categoryId) {
      console.error(`Nenhuma categoria correspondente encontrada para "${categoryName}". Este resultado será ignorado.`);
      return; // Pular esta categoria
    }
    
    console.log(`Processando categoria "${categoryName}" (ID: ${categoryId})`);
    
    // Pegar apenas os primeiros N resultados (ou menos se não houver N)
    const topN = results.slice(0, limit);
    
    topN.forEach((result, index) => {
        const resultId = randomUUID();
        
        topResults.push({
          id: resultId,
          eventId: eventId,
          categoryId: categoryId,
          categoryName: categoryName,
          position: result.position ? Number(result.position) : index + 1,
          athleteName: result.athleteName || '',
          clubName: result.clubName || '',
          result: result.result || '',
          // Estes campos serão preenchidos na função enrichResultsWithUserData se possível
          userId: null,
          clubId: null
        });
    });
  });
  
  return topResults;
}

/**
 * Enriquece os resultados com informações de usuários e clubes se possível
 */
async function enrichResultsWithUserData(
  results: ProcessedResult[],
  eventId: string
): Promise<ProcessedResult[]> {
  console.log('Enriquecendo resultados com dados de usuários e clubes...');
  
  const enrichedResults: ProcessedResult[] = [];
  
  for (const result of results) {
    // Tentar encontrar um usuário correspondente pelo nome
    if (result.athleteName) {
      const user = await prisma.user.findFirst({
        where: {
          name: {
            contains: result.athleteName,
            mode: 'insensitive'
          }
        }
      });
      
      if (user) {
        result.userId = user.id;
      }
    }
    
    // Tentar encontrar um clube correspondente pelo nome
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
        result.clubId = club.id;
      }
    }
    
    enrichedResults.push(result);
  }
  
  return enrichedResults;
}

/**
 * Salva os resultados processados no banco de dados
 */
export async function saveTopResults(
  eventId: string,
  results: ProcessedResult[]
): Promise<void> {
  console.log(`Salvando ${results.length} resultados no banco de dados para o evento ${eventId}...`);
  
  if (results.length === 0) {
    console.log('Nenhum resultado para salvar');
    return;
  }
  
  // Verificar se temos IDs de categoria válidos
  console.log('Verificando IDs de categoria antes de salvar...');
  const categoryIds = [...new Set(results.map(r => r.categoryId))];
  console.log('IDs de categoria encontrados:', categoryIds);
  
  // Buscar categorias existentes para confirmar
  const existingCategories = await prisma.eventCategory.findMany({
    where: {
      id: {
        in: categoryIds
      }
    },
    select: {
      id: true,
      name: true
    }
  });
  
  console.log('Categorias existentes encontradas:', existingCategories.map(c => `${c.id} (${c.name})`));
  
  // Criar um mapa de categorias válidas
  const validCategoryIds = new Set(existingCategories.map(c => c.id));
  
  // Filtrar resultados para incluir apenas aqueles com categorias válidas
  const validResults = results.filter(result => {
    const isValid = validCategoryIds.has(result.categoryId);
    if (!isValid) {
      console.warn(`Ignorando resultado para atleta ${result.athleteName} - categoria inválida: ${result.categoryId} (${result.categoryName})`);
    }
    return isValid;
  });
  
  console.log(`${validResults.length} de ${results.length} resultados têm categorias válidas`);
  
  // Se não houver resultados válidos, encerrar
  if (validResults.length === 0) {
    console.error('Nenhum resultado com categoria válida para salvar. Verifique o mapeamento de categorias.');
    throw new Error('Nenhuma categoria válida encontrada. Verifique se as categorias do arquivo existem no sistema.');
  }
  
  // Primeiro, remover resultados existentes para este evento
  await prisma.$executeRaw`DELETE FROM "EventTopResult" WHERE "eventId" = ${eventId}`;
  console.log('Resultados anteriores removidos com sucesso');
  
  // Depois, inserir os novos resultados
  let successCount = 0;
  for (const result of validResults) {
    try {
      await prisma.$executeRaw`
        INSERT INTO "EventTopResult" (
          "id", "eventId", "categoryId", "position", "userId", 
          "athleteName", "clubId", "clubName", "result", "createdAt", "updatedAt"
        ) VALUES (
          ${result.id}, ${eventId}, ${result.categoryId}, ${result.position}, ${result.userId},
          ${result.athleteName}, ${result.clubId}, ${result.clubName}, ${result.result}, 
          ${new Date()}, ${new Date()}
        )
      `;
      successCount++;
    } catch (error) {
      console.error(`Erro ao inserir resultado para ${result.athleteName} (Categoria: ${result.categoryName}):`, error);
    }
  }
  
  console.log(`${successCount} de ${validResults.length} resultados salvos com sucesso para o evento ${eventId}`);
}
