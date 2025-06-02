// Script para testar a integração com o PagSeguro via terminal
const fetch = require('node-fetch');

// Credenciais do PagSeguro (substitua com suas credenciais reais)
const credentials = {
  pagseguroAppId: "app0155491563",
  pagseguroEmail: "v7363473067977521584@sandbox.pagseguro.com.br",
  pagseguroToken: "887712521728452",
  pagseguroAppKey: "2A75ECF1E1E1FB6FF4A63FB222D1BBB2"
};

// URL da API (sandbox)
const url = "https://sandbox.api.pagseguro.com/orders";

// Função para testar diferentes formatos de autenticação
async function testarAutenticacao() {
  console.log("Iniciando teste de integração com PagSeguro...");
  
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

  // Formatos de autenticação a serem testados
  const authFormatos = [
    { nome: "Token direto", header: credentials.pagseguroToken },
    { nome: "Basic + Token", header: `Basic ${credentials.pagseguroToken}` },
    { nome: "Bearer + Token", header: `Bearer ${credentials.pagseguroToken}` },
  ];

  // Testar cada formato
  for (const formato of authFormatos) {
    console.log(`\n===== Testando formato: ${formato.nome} =====`);
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Authorization": formato.header,
          "Content-Type": "application/json",
          "x-api-version": "4.0",
          "Accept": "application/json"
        },
        body: JSON.stringify(payload)
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
        console.log(`✅ SUCESSO com o formato "${formato.nome}"`);
        break;
      } else {
        console.log(`❌ FALHA com o formato "${formato.nome}"`);
      }
    } catch (error) {
      console.error(`Erro ao testar formato "${formato.nome}":`, error.message);
    }
  }
}

// Executar o teste
testarAutenticacao();
