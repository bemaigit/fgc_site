import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { v4 as uuidv4 } from 'uuid';

/**
 * API endpoint para testar a funcionalidade de preços avançados por categoria
 * Esta rota é apenas para testes e não deve ser exposta em produção
 * 
 * Caso precise remover esta rota após os testes:
 * 1. Delete este arquivo
 */

// IDs existentes para teste
const TEST_DATA = {
  eventId: "e645ff0d-656d-4af6-814b-158c4b3ab122", // ID do evento existente nos logs anteriores
  modalityId: "cm7ro2ao80001kja8o4jdj323",
  categoryId: "3524e809-1524-4219-81dd-5a6459aa1894",
  genderId: "7718a8b0-03f1-42af-a484-6176f8bf055e",
  tierId: "dd62ad7d-a567-474c-9924-ff3506f00970"
};

export async function GET(request: NextRequest) {
  try {
    const now = new Date();
    
    console.log('=== TESTE DE PREÇOS AVANÇADOS POR CATEGORIA ===');
    console.log(`Usando evento existente com ID: ${TEST_DATA.eventId}`);
    
    // 1. Verificar se o evento existe
    const event = await prisma.event.findUnique({
      where: { id: TEST_DATA.eventId }
    });
    
    if (!event) {
      return NextResponse.json({
        success: false,
        error: `Evento com ID ${TEST_DATA.eventId} não encontrado`
      }, { status: 404 });
    }
    
    console.log(`Evento encontrado: ${event.title}`);
    
    // 2. Verificar se o lote de preço existe
    const tier = await prisma.eventPricingTier.findFirst({
      where: { 
        id: TEST_DATA.tierId,
        eventId: TEST_DATA.eventId
      }
    });
    
    if (!tier) {
      return NextResponse.json({
        success: false,
        error: `Lote com ID ${TEST_DATA.tierId} não encontrado para o evento ${TEST_DATA.eventId}`
      }, { status: 404 });
    }
    
    console.log(`Lote encontrado: ${tier.name} (ID: ${tier.id})`);
    
    // 3. Verificar se modalidade, categoria e gênero existem
    const modality = await prisma.eventModality.findUnique({
      where: { id: TEST_DATA.modalityId }
    });
    
    if (!modality) {
      return NextResponse.json({
        success: false,
        error: `Modalidade com ID ${TEST_DATA.modalityId} não encontrada`
      }, { status: 404 });
    }
    
    console.log(`Modalidade encontrada: ${modality.name}`);
    
    const category = await prisma.eventCategory.findUnique({
      where: { id: TEST_DATA.categoryId }
    });
    
    if (!category) {
      return NextResponse.json({
        success: false,
        error: `Categoria com ID ${TEST_DATA.categoryId} não encontrada`
      }, { status: 404 });
    }
    
    console.log(`Categoria encontrada: ${category.name}`);
    
    const gender = await prisma.gender.findUnique({
      where: { id: TEST_DATA.genderId }
    });
    
    if (!gender) {
      return NextResponse.json({
        success: false,
        error: `Gênero com ID ${TEST_DATA.genderId} não encontrado`
      }, { status: 404 });
    }
    
    console.log(`Gênero encontrado: ${gender.name}`);
    
    // 4. Remover preço específico existente (se houver)
    await prisma.eventPricingByCategory.deleteMany({
      where: {
        eventId: TEST_DATA.eventId,
        modalityId: TEST_DATA.modalityId,
        categoryId: TEST_DATA.categoryId,
        genderId: TEST_DATA.genderId,
        tierId: TEST_DATA.tierId
      }
    });
    
    console.log(`Removidos preços existentes com a mesma combinação de IDs`);
    
    // 5. Criar preço avançado por categoria
    const categoryPriceId = uuidv4();
    const priceValue = 90.00; // Preço de teste
    
    console.log(`Tentando criar preço avançado com valor ${priceValue}...`);
    console.log(`modalityId: ${TEST_DATA.modalityId}`);
    console.log(`categoryId: ${TEST_DATA.categoryId}`);
    console.log(`genderId: ${TEST_DATA.genderId}`);
    console.log(`tierId: ${TEST_DATA.tierId}`);
    
    const categoryPrice = await prisma.eventPricingByCategory.create({
      data: {
        id: categoryPriceId,
        eventId: TEST_DATA.eventId,
        categoryId: TEST_DATA.categoryId,
        modalityId: TEST_DATA.modalityId,
        genderId: TEST_DATA.genderId,
        tierId: TEST_DATA.tierId,
        price: priceValue,
        createdAt: now,
        updatedAt: now
      }
    });
    
    console.log(`Preço por categoria criado com sucesso! ID: ${categoryPriceId}`);
    
    // 6. Buscar preços por categoria para verificar
    const categoryPrices = await prisma.eventPricingByCategory.findMany({
      where: { eventId: TEST_DATA.eventId }
    });
    
    return NextResponse.json({
      success: true,
      message: 'Teste de preços avançados concluído com sucesso',
      eventId: TEST_DATA.eventId,
      tierId: TEST_DATA.tierId,
      categoryPriceId: categoryPriceId,
      categoryPrice: categoryPrice,
      allCategoryPrices: categoryPrices
    });
    
  } catch (error) {
    console.error('Erro durante o teste:', error);
    
    // Detalhar o erro do Prisma
    if (error.code) {
      console.error(`Código de erro Prisma: ${error.code}`);
      console.error(`Mensagem detalhada: ${error.message}`);
      if (error.meta) {
        console.error(`Metadados do erro: ${JSON.stringify(error.meta, null, 2)}`);
      }
    }
    
    return NextResponse.json({
      success: false,
      error: String(error)
    }, { status: 500 });
  }
}
