// Script para testar APIs de imagem
const fetch = require('node-fetch');

// Função para testar uma API de imagem
async function testImageApi(apiUrl, description) {
  console.log(`\n🔍 Testando: ${description} - ${apiUrl}`);
  
  try {
    const response = await fetch(apiUrl);
    
    // Verificar status da resposta
    console.log(`Status: ${response.status} ${response.statusText}`);
    
    // Verificar headers relevantes
    const contentType = response.headers.get('content-type');
    const cacheControl = response.headers.get('cache-control');
    const fallbackHeader = response.headers.get('x-image-fallback');
    
    console.log(`Content-Type: ${contentType}`);
    console.log(`Cache-Control: ${cacheControl}`);
    
    if (fallbackHeader) {
      console.log(`✅ FALLBACK ATIVO: API está usando sistema de fallback!`);
    }
    
    // Verificar se a resposta é uma imagem válida
    if (contentType && contentType.startsWith('image/')) {
      console.log(`✅ SUCESSO: API retornou uma imagem válida`);
    } else {
      console.log(`❌ ERRO: API não retornou uma imagem válida`);
    }
    
    return response.status >= 200 && response.status < 300;
  } catch (error) {
    console.error(`❌ ERRO: ${error.message}`);
    return false;
  }
}

// Função principal para testar todas as APIs
async function runTests() {
  console.log('🧪 INICIANDO TESTES DE APIS DE IMAGEM');
  console.log('====================================');
  
  // Array de testes com URLs que provavelmente não existem (para testar fallback)
  const tests = [
    {
      url: 'http://localhost:3000/api/banner/image?path=nao-existe-12345.jpg',
      description: 'API de Banner (não existente)'
    },
    {
      url: 'http://localhost:3000/api/partners/image?path=parceiro-inexistente-67890.png',
      description: 'API de Parceiros (não existente)'
    },
    {
      url: 'http://localhost:3000/api/gallery/image?path=imagem-galeria-inexistente-54321.jpg',
      description: 'API de Galeria (não existente)'
    },
    {
      url: 'http://localhost:3000/api/footer/logo?path=logo-inexistente-98765.png',
      description: 'API de Logo do Footer (não existente)'
    },
    {
      url: 'http://localhost:3000/api/calendar/image?path=calendario-inexistente-13579.jpg',
      description: 'API de Calendário (não existente)'
    }
  ];
  
  // Executar todos os testes
  let passedTests = 0;
  let failedTests = 0;
  
  for (const test of tests) {
    const success = await testImageApi(test.url, test.description);
    if (success) {
      passedTests++;
    } else {
      failedTests++;
    }
  }
  
  // Exibir resumo
  console.log('\n====================================');
  console.log(`✅ Testes bem-sucedidos: ${passedTests}`);
  console.log(`❌ Testes com falha: ${failedTests}`);
  console.log('====================================');
}

// Executar testes
runTests().catch(console.error);
