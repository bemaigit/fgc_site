import { v4 as uuidv4 } from 'uuid';

async function main() {
  try {
    const now = new Date();
    
    // Dados de teste para criar um evento
    const eventData = {
      title: 'Evento de Teste API',
      description: 'Este é um evento de teste criado via API',
      slug: `evento-teste-api-${Date.now()}`,
      location: 'Campinas, SP',
      startDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), // 7 dias a partir de hoje
      endDate: new Date(now.getTime() + 8 * 24 * 60 * 60 * 1000), // 8 dias a partir de hoje
      registrationEnd: new Date(now.getTime() + 6 * 24 * 60 * 60 * 1000), // 6 dias a partir de hoje
      status: 'PUBLISHED',
      published: true,
      isFree: true,
      addressDetails: 'Rua de Teste, 123',
      zipCode: '13000-000',
      latitude: -22.9064,
      longitude: -47.0616,
      countryId: null,
      stateId: null,
      cityId: null,
      modalityIds: ['cm7ro2ao80001kja8o4jdj323'], // Ciclismo de Estrada
      categoryIds: ['cm7rosfmk0009kja876mny3kr'], // ELITE
      genderIds: ['b4f82f14-79d6-4123-a29b-4d45ff890a52'], // Masculino
      
      // Campos de imagens e regulamento
      coverImage: 'https://exemplo.com/imagem-teste.jpg',
      posterImage: 'https://exemplo.com/poster-teste.jpg',
      regulationPdf: 'https://exemplo.com/regulamento-teste.pdf',
      
      // Lotes de preço
      EventPricingTier: [{
        id: uuidv4(),
        name: 'Lote Teste',
        price: 100.00,
        startDate: now,
        endDate: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000), // 5 dias a partir de hoje
      }]
    };
    
    console.log('Enviando dados para API:', JSON.stringify(eventData, null, 2));
    
    // Enviar para a API
    const response = await fetch('http://localhost:3000/api/events', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(eventData),
    });
    
    const responseData = await response.json();
    
    if (!response.ok) {
      console.error('Resposta da API:', responseData);
      throw new Error(responseData.error || 'Erro ao criar evento');
    }
    
    console.log('Evento criado com sucesso:', responseData);
    
  } catch (error) {
    console.error('Erro ao criar evento:', error);
  }
}

main();
