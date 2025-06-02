// Script para testar a integração com o PagSeguro usando múltiplas abordagens de autenticação
const fetch = require('node-fetch');

// Credenciais do PagSeguro
const credentials = {
  email: "v7363473067977521584@sandbox.pagseguro.com.br",
  token: "887712521728452",
  appId: "app0155491563",
  appKey: "2A75ECF1E1E1FB6FF4A63FB222D1BBB2",
  publicKey: "PUBD1BBE24259244AE88E59FADF42CC8FF2"
};

// URL base da API (sandbox)
const baseUrl = "https://sandbox.api.pagseguro.com";

// Payload básico para teste
const payload = {
  reference_id: `teste-${Date.now()}`,
  description: "Teste de integração via script",
  amount: {
    value: 100, // R$ 1,00 em centavos
    currency: "BRL"
  },
  payment_method: {
    type: "PIX",
    installments: 1,
    capture: true
  },
  notification_urls: ["https://example.com/webhook"],
  customer: {
    name: "Cliente Teste",
    email: "teste@example.com",
    tax_id: "12345678909",
    phones: [
      {
        country: "55",
        area: "11",
        number: "999999999"
      }
    ]
  }
};

// Função para testar diferentes combinações de credenciais e endpoints
async function testarIntegracao() {
  console.log("Iniciando teste completo de integração com PagSeguro...");

  // Testar diferentes combinações
  const testes = [
    // Teste 1: Auth V4 com token direto
    {
      descricao: "API V4 - Token direto",
      url: `${baseUrl}/orders`,
      headers: {
        "Authorization": credentials.token,
        "Content-Type": "application/json",
        "x-api-version": "4.0",
        "Accept": "application/json"
      }
    },
    
    // Teste 2: Auth V4 com Bearer
    {
      descricao: "API V4 - Bearer Token",
      url: `${baseUrl}/orders`,
      headers: {
        "Authorization": `Bearer ${credentials.token}`,
        "Content-Type": "application/json",
        "x-api-version": "4.0",
        "Accept": "application/json"
      }
    },
    
    // Teste 3: Auth Basic (email + token)
    {
      descricao: "API V4 - Basic Auth com email:token",
      url: `${baseUrl}/orders`,
      headers: {
        "Authorization": `Basic ${Buffer.from(`${credentials.email}:${credentials.token}`).toString('base64')}`,
        "Content-Type": "application/json",
        "x-api-version": "4.0",
        "Accept": "application/json"
      }
    },

    // Teste 4: API Charges com token
    {
      descricao: "API Charges - Token direto",
      url: `${baseUrl}/charges`,
      headers: {
        "Authorization": credentials.token,
        "Content-Type": "application/json",
        "Accept": "application/json"
      }
    },
    
    // Teste 5: API Auth
    {
      descricao: "API Auth - Teste autenticação",
      url: `${baseUrl}/oauth2/application`,
      method: "GET",
      headers: {
        "Authorization": `Basic ${Buffer.from(`${credentials.appId}:${credentials.appKey}`).toString('base64')}`,
        "Content-Type": "application/json"
      },
      payload: null
    }
  ];

  // Executar cada teste em sequência
  for (const teste of testes) {
    console.log(`\n===== ${teste.descricao} =====`);
    try {
      const response = await fetch(teste.url, {
        method: teste.method || "POST",
        headers: teste.headers,
        body: teste.payload === null ? null : JSON.stringify(payload)
      });

      const responseText = await response.text();
      console.log(`Status: ${response.status}`);
      
      try {
        const responseData = JSON.parse(responseText);
        console.log("Resposta:", JSON.stringify(responseData, null, 2));
      } catch {
        console.log("Resposta (texto):", responseText);
      }

      if (response.ok) {
        console.log(`✅ SUCESSO com "${teste.descricao}"`);
      } else {
        console.log(`❌ FALHA com "${teste.descricao}"`);
      }
    } catch (error) {
      console.error(`Erro ao testar "${teste.descricao}":`, error.message);
    }
  }
}

// Executar o teste
testarIntegracao();
