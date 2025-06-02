import WhatsAppAdapter from './whatsapp-adapter';
import axios, { AxiosError } from 'axios';

// Configuração para teste - usando o nome da instância
process.env.WHATSAPP_API_KEY = '429683C4C977415CAAFCCE10F7D57E11';
process.env.WHATSAPP_INSTANCE = 'federacao';

async function testWhatsAppAdapter() {
  try {
    console.log('Iniciando teste do adaptador WhatsApp com Evolution API...');
    
    // Criar instância do adaptador
    const whatsapp = new WhatsAppAdapter();
    
    // Verificar status da conexão
    console.log('1. Verificando status da conexão...');
    const statusResult = await whatsapp.checkConnectionStatus();
    console.log('Resultado do status:', JSON.stringify(statusResult, null, 2));
    
    // Se está conectado, enviar mensagem de teste
    if (statusResult.isConnected) {
      console.log('2. Enviando mensagem de teste...');
      
      // Usar o número que você mencionou como destinatário
      const to = '556294242329';
      const message = '🤖 Teste de integração da Evolution API: ' + new Date().toLocaleString();
      
      const sendResult = await whatsapp.sendTextMessage(to, message);
      console.log('Resultado do envio:', JSON.stringify(sendResult, null, 2));
    } else {
      console.log('WhatsApp não está conectado. Status:', statusResult.state);
      console.log('Por favor, verifique a conexão antes de enviar mensagens de teste.');
    }
    
    console.log('Teste concluído!');
  } catch (error) {
    console.error('Erro durante o teste:', error instanceof Error ? error.message : String(error));
  }
}

// Executar o teste
testWhatsAppAdapter();
