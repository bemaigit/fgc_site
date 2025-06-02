// Script para testar a API de eventos via terminal
import fetch from 'node-fetch';

async function testEventAPI() {
  console.log('Iniciando teste da API de eventos...');

  // Dados de teste para um evento completo
  const eventData = {
    // Informações básicas
    name: 'Evento de Teste Terminal',
    description: 'Descrição do evento de teste via terminal',
    startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    endDate: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toISOString(),
    registrationStartDate: new Date().toISOString(),
    registrationEndDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    maxParticipants: 100,
    
    // Localização
    address: 'Rua de Teste Terminal, 123',
    city: 'Cidade de Teste Terminal',
    state: 'Estado de Teste Terminal',
    zipCode: '12345-678',
    complement: 'Complemento de Teste Terminal',
    latitude: -23.5505,
    longitude: -46.6333,
    
    // Modalidades (simplificado para o teste)
    modality: 'Teste',
    
    // Imagens
    coverImage: 'https://minio.fgc.com.br/fgc/eventos/cover/teste-terminal-cover.jpg',
    posterImage: 'https://minio.fgc.com.br/fgc/eventos/poster/teste-terminal-poster.jpg',
    
    // Regulamento
    regulationPdf: 'https://minio.fgc.com.br/fgc/regulamento/teste-terminal-regulamento.pdf',
    
    // Preços
    EventPricingTier: [
      {
        name: 'Lote Terminal 1',
        description: 'Lote promocional terminal',
        price: 50.00,
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        maxEntries: 30,
        active: true
      }
    ]
  };

  try {
    console.log('Enviando dados para a API de teste...');
    
    // Enviar requisição para a API de teste
    const response = await fetch('http://localhost:3000/api/test-event', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(eventData)
    });

    // Verificar resposta
    const responseText = await response.text();
    let data;
    
    try {
      data = JSON.parse(responseText);
    } catch (_) {
      console.log('Resposta não é JSON válido:', responseText);
      return;
    }
    
    if (response.ok) {
      console.log('Teste de criação de evento concluído com sucesso!');
      console.log('Resposta da API:', JSON.stringify(data, null, 2));
    } else {
      console.error('Erro no teste de criação de evento:');
      console.error('Status:', response.status);
      console.error('Resposta da API:', data);
    }
  } catch (error) {
    console.error('Erro durante a requisição:', error);
  }
}

// Executar o teste
testEventAPI();
