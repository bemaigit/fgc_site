// Script para testar o SDK do Mercado Pago
const mercadopago = require('mercadopago');

// Função para testar a API do Mercado Pago
async function testMercadoPago() {
  try {
    // Listar as propriedades disponíveis no SDK
    console.log('Propriedades do SDK:', Object.keys(mercadopago));
    
    // Verificar se a propriedade preference existe
    console.log('preference existe?', !!mercadopago.preference);
    
    // Verificar se a propriedade preferences existe
    console.log('preferences existe?', !!mercadopago.preferences);
    
    // Verificar o tipo de mercadopago.preference
    console.log('Tipo de preference:', typeof mercadopago.preference);
    
    // Verificar o tipo de mercadopago.preferences
    console.log('Tipo de preferences:', typeof mercadopago.preferences);
    
    // Verificar se mercadopago.preference tem um método create
    console.log('preference.create existe?', mercadopago.preference && typeof mercadopago.preference.create === 'function');
    
    // Verificar se mercadopago.preferences tem um método create
    console.log('preferences.create existe?', mercadopago.preferences && typeof mercadopago.preferences.create === 'function');
    
    // Verificar a estrutura do SDK
    if (mercadopago.default) {
      console.log('mercadopago.default existe e tem as seguintes propriedades:', Object.keys(mercadopago.default));
    }
    
    // Verificar se o SDK tem uma classe Preference
    console.log('Preference existe?', !!mercadopago.Preference);
    if (mercadopago.Preference) {
      const preference = new mercadopago.Preference();
      console.log('Instância de Preference tem create?', typeof preference.create === 'function');
    }
  } catch (error) {
    console.error('Erro ao testar o SDK:', error);
  }
}

// Executar o teste
testMercadoPago();
