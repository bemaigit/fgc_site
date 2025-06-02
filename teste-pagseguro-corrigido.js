// Script para testar a integração com o PagSeguro usando o token atualizado
// e com o payload corrigido
const fetch = require('node-fetch');

// Credenciais atualizadas do PagSeguro
const credentials = {
  email: "betofoto1@gmail.com",
  token: "2C20AC5358084157AFD3DB315C69A68C",
  appId: "app0155491563",
  appKey: "2A75ECF1E1E1FB6FF4A63FB222D1BBB2"
};

// URL da API (sandbox)
const url = "https://sandbox.api.pagseguro.com/orders";

// Payload corrigido para teste (com o campo type nos telefones)
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
        number: "999999999",
        type: "MOBILE" // Campo adicionado conforme solicitado pelo erro
      }
    ]
  }
};

// Testar diferentes formatos de autenticação
async function testarAutenticacao() {
  console.log("Iniciando teste de integração com PagSeguro (payload corrigido)...");
  
  const formatos = [
    {
      nome: "Token direto",
      headers: {
        "Authorization": credentials.token,
        "Content-Type": "application/json",
        "x-api-version": "4.0"
      }
    },
    {
      nome: "Bearer + Token",
      headers: {
        "Authorization": `Bearer ${credentials.token}`,
        "Content-Type": "application/json",
        "x-api-version": "4.0"
      }
    }
  ];

  for (const formato of formatos) {
    console.log(`\n===== Testando formato: ${formato.nome} =====`);
    try {
      console.log("Enviando payload:", JSON.stringify(payload, null, 2));
      
      const response = await fetch(url, {
        method: "POST",
        headers: formato.headers,
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
        return; // Sair após o primeiro sucesso
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
