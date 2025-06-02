import axios from 'axios';

// Tipos para o adaptador
type ConnectionStatus = {
  status: 'connected' | 'disconnected' | 'error',
  message: string,
  data?: any,
  error?: any
};

type SendMessageResult = {
  success: boolean,
  data: any | null,
  error?: string,
  messageId?: string
};

/**
 * Adaptador para envio de mensagens via WhatsApp usando a Evolution API
 */
export class WhatsAppAdapter {
  private apiUrl: string;
  private instance: string;
  private webhookSecret: string;
  private apiKey: string;

  constructor() {
    // Verifica se estamos em ambiente ngrok (baseado nas URLs do NextAuth)
    const isNgrok = process.env.NEXTAUTH_URL?.includes('ngrok') || 
                   process.env.NEXT_PUBLIC_BASE_URL?.includes('ngrok');
    
    // Se estivermos em ambiente ngrok, usamos o proxy da nossa própria API
    if (isNgrok) {
      // Usa a URL base da aplicação com o proxy que criamos
      this.apiUrl = (process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000') + '/api/whatsapp-proxy';
      console.log(`Usando proxy WhatsApp via ngrok: ${this.apiUrl}`);
    } else {
      // Em ambiente local, acessa diretamente a Evolution API
      this.apiUrl = process.env.WHATSAPP_API_URL || 'http://localhost:8080';
      console.log(`Acessando diretamente a API WhatsApp: ${this.apiUrl}`);
    }
    
    // Na versão 2.2.3 da Evolution API, usamos o nome da instância fornecida
    // no painel de gerenciamento
    this.instance = process.env.WHATSAPP_INSTANCE || 'federacao';
    this.webhookSecret = process.env.WHATSAPP_WEBHOOK_SECRET || 'evolution_webhook_secret';
    this.apiKey = process.env.WHATSAPP_API_KEY || '2FB445106BCF-4C06-B80B-C5841202DF06'; // Corrigido para usar a key correta do .env
  }

  /**
   * Formata o número de telefone para o padrão da API Evolution
   * @param phone Número de telefone (pode incluir + ou não)
   * @returns Número formatado (apenas dígitos)
   */
  private formatPhoneNumber(phone: string): string {
    // Logs detalhados para diagnóstico
    console.log(`\n===== FORMATANDO NÚMERO DE TELEFONE =====`);
    console.log(`INPUT: "${phone}" | Tipo: ${typeof phone} | Length: ${phone?.length || 'N/A'}`);
    
    // Verificar caso especial - valor null, undefined ou string vazia
    if (!phone) {
      console.error(`\u274c Número de telefone inválido: ${phone}`);
      return ''; // Retorna vazio para ser capturado pela validação
    }
    
    // Caso especial - objeto não esperado ou tipo diferente de string
    if (typeof phone !== 'string') {
      console.error(`\u274c Número de telefone com tipo inválido: ${typeof phone}`);
      try {
        // Tentativa de conversão para string
        phone = String(phone);
      } catch (error) {
        console.error(`\u274c Erro ao converter número para string:`, error);
        return '';
      }
    }
    
    // Remove caracteres especiais no input
    console.log(`ANTES DA LIMPEZA: "${phone}"`);
    let formatted = phone.replace(/\D/g, '');
    console.log(`APÓS LIMPEZA (só números): "${formatted}"`);
    
    // Garante que começa com código do país Brasil (55)
    if (!formatted.startsWith('55')) {
      console.log(`Adicionando código do país (55) ao número ${formatted}`);
      formatted = '55' + formatted;
    }
    
    // Trata caso de DDD com zero na frente (estilo 0xx)
    if (formatted.startsWith('550')) {
      console.log(`Removendo o zero na frente do DDD: ${formatted} -> 55${formatted.substring(3)}`);
      formatted = '55' + formatted.substring(3);
    }
    
    // Garante que números brasileiros tenham o 9 no início (formato atual) 
    if (formatted.startsWith('55') && formatted.length === 12) {
      const ddd = formatted.substring(2, 4);
      const numero = formatted.substring(4);
      console.log(`Adicionando o 9 após DDD ${ddd}: ${formatted} -> 55${ddd}9${numero}`);
      formatted = formatted.substring(0, 4) + '9' + formatted.substring(4);
    }
    
    // Tratamento de outros casos de formato
    // Caso receba uma substring de número muito curta
    if (formatted.length < 8) {
      console.error(`\u274c Número de telefone muito curto após formatação: ${formatted}`);
    }
    // Caso tenha formato errado mesmo com codigo país
    else if (formatted.startsWith('55') && formatted.length !== 13) { 
      console.warn(`\u26a0️ Número pode estar em formato não padrão: ${formatted} (${formatted.length} dígitos)`);
    }
    
    console.log(`RESULTADO FINAL: ${formatted}`);
    console.log(`===== FIM DA FORMATAÇÃO =====\n`);
    
    return formatted;
  }

  /**
   * Verifica o status de conexão da instância WhatsApp
   * @returns Status de conexão
   */
  async checkConnectionStatus(): Promise<ConnectionStatus> {
    try {
      // Verifica se estamos usando o proxy via ngrok
      if (this.apiUrl.includes('/api/whatsapp-proxy')) {
        console.log('[WhatsApp] Modo de simulação: Considerando WhatsApp como conectado');
        return {
          status: 'connected',
          message: 'Simulação de conexão ativa'
        };
      }

      // Endpoint para chegar o status da instância para a Evolution API 2.2.3
      const url = `${this.apiUrl}/instance/connectionState/${this.instance}`;
      console.log(`[WhatsApp] Verificando status de conexão em: ${url}`);
      
      const response = await axios.get(url, {
        headers: {
          'Content-Type': 'application/json',
          'apikey': this.apiKey
        }
      });
      
      // Logs detalhados da resposta do servidor
      console.log('[WhatsApp] Resposta do servidor:', JSON.stringify(response.data, null, 2));
      
      // Validação mais robusta do status
      if (response.data?.instance?.state === 'open') {
        console.log(`[WhatsApp] \u2705 Instância "${this.instance}" está conectada!`);
        return {
          status: 'connected',
          message: 'WhatsApp conectado',
          data: response.data
        };
      } else {
        console.warn(`[WhatsApp] \u26a0️ Instância "${this.instance}" está desconectada. Estado: ${response.data?.instance?.state || 'desconhecido'}`);
        return {
          status: 'disconnected',
          message: `WhatsApp desconectado: ${response.data?.instance?.state || 'desconhecido'}`,
          data: response.data
        };
      }
    } catch (error: any) {
      console.error('[WhatsApp] \u274c Erro ao verificar status do WhatsApp:', error.message);
      
      if (error.response) {
        console.error(`[WhatsApp] Status do erro: ${error.response.status}`);
        console.error('[WhatsApp] Detalhes do erro:', error.response.data);
      }
      
      return {
        status: 'error',
        message: `Erro ao verificar status: ${error.message}`,
        error: error
      };
    }
  }

  /**
   * Envia uma mensagem de texto via WhatsApp
   * @param to Número de telefone no formato internacional (553199999999)
   * @param message Texto da mensagem
   */
  async sendTextMessage(to: string, message: string): Promise<SendMessageResult> {
    try {
      console.log(`\n[WhatsApp] ===== INICIANDO ENVIO DE MENSAGEM =====`);
      console.log(`[WhatsApp] Destino (original): "${to}"`);
      console.log(`[WhatsApp] Tamanho da mensagem: ${message.length} caracteres`);
      
      // Verifica se estamos usando o proxy via ngrok
      if (this.apiUrl.includes('/api/whatsapp-proxy')) {
        console.log('[WhatsApp] Modo de simulação para envio de mensagem');
        console.log(`[WhatsApp] Simulando envio para: ${to}`);
        console.log(`[WhatsApp] Trecho da mensagem: ${message.substring(0, 50)}...`);
        
        // Simula uma resposta de sucesso
        return {
          success: true,
          data: {
            key: {
              id: `simulated-${Date.now()}`
            },
            status: 'SENT'
          },
          messageId: `simulated-${Date.now()}`
        };
      }
      
      // Verificar primeiro se a instância está conectada
      const connectionStatus = await this.checkConnectionStatus();
      if (connectionStatus.status !== 'connected') {
        console.error(`[WhatsApp] \u274c Não foi possível enviar mensagem: Instância "${this.instance}" não está conectada (${connectionStatus.status})`);
        return {
          success: false,
          error: `Instância WhatsApp não está conectada: ${connectionStatus.message}`,
          data: null
        };
      }
      
      // IMPORTANTE: Verificar se o número é válido antes de tentar enviar
      if (!to || to.length < 10) {
        console.error('[WhatsApp] \u274c Número de telefone inválido:', to);
        return {
          success: false,
          error: 'Número de telefone inválido ou muito curto',
          data: null
        };
      }
      
      // Formatar o número de telefone
      const formattedNumber = this.formatPhoneNumber(to);
      
      // Verificação adicional após formatação
      if (!formattedNumber || formattedNumber.length < 10) {
        console.error('[WhatsApp] \u274c Número formatado inválido:', formattedNumber);
        return {
          success: false,
          error: 'Número formatado inválido',
          data: null
        };
      }
      
      // URL para endpoint da Evolution API 2.2.3
      const url = `${this.apiUrl}/message/sendText/${this.instance}`;
      console.log(`[WhatsApp] Endpoint para envio: ${url}`);
      console.log(`[WhatsApp] Número formatado: ${formattedNumber}`);
      
      // Formato de payload específico para a Evolution API 2.2.3
      const data = {
        number: formattedNumber,
        text: message,
        options: {
          delay: 1200,
          presence: "composing"
        }
      };
      
      console.log('[WhatsApp] Enviando dados:', JSON.stringify(data, null, 2));
      console.log('[WhatsApp] Iniciando chamada HTTP...');
      
      const startTime = Date.now();
      const response = await axios.post(url, data, {
        headers: {
          'Content-Type': 'application/json',
          'apikey': this.apiKey
        },
        timeout: 15000 // 15 segundos de timeout para evitar bloqueios longos
      });
      const elapsedTime = Date.now() - startTime;
      
      // Log mais detalhado para diagnóstico
      console.log(`[WhatsApp] Resposta recebida em ${elapsedTime}ms`);
      console.log(`[WhatsApp] STATUS HTTP: ${response.status}`);
      console.log('[WhatsApp] Resposta:', JSON.stringify(response.data, null, 2));
      
      // Verificação mais rigorosa para determinar sucesso real
      if (
        // Apenas considerar sucesso se o status HTTP for 2xx
        (response.status >= 200 && response.status < 300) &&
        // E se a resposta não tiver um campo "error" ou "status" com valor numérico
        (typeof response.data?.status !== 'number') && 
        (!response.data?.error) &&
        // E se tiver um indicador positivo
        (response.data?.key?.id || response.data?.status === 'success')
      ) {
        console.log(`[WhatsApp] \u2705 Mensagem enviada com sucesso para: ${formattedNumber}`);
        console.log('[WhatsApp] ===== FIM DO ENVIO (SUCESSO) =====\n');
        return {
          success: true,
          data: response.data,
          messageId: response.data?.key?.id || 'message-' + Date.now()
        };
      } else {
        // Identificar o problema específico
        let errorDetail = '';
        if (response.data?.error) {
          errorDetail = `Erro reportado: ${response.data.error}`;
        } else if (typeof response.data?.status === 'number' && response.data.status !== 200) {
          errorDetail = `Status de erro: ${response.data.status}`;
        } else if (response.data?.response?.message) {
          errorDetail = `Mensagem(s) de erro: ${Array.isArray(response.data.response.message) ? response.data.response.message.join(', ') : response.data.response.message}`;
        } else {
          errorDetail = 'Resposta não contém indicadores de sucesso';
        }
        
        console.error(`[WhatsApp] \u274c Falha ao enviar mensagem: ${errorDetail}`);
        console.error('[WhatsApp] ===== FIM DO ENVIO (FALHA) =====\n');
        throw new Error(`Falha no envio: ${errorDetail}`);
      }
    } catch (error: any) {
      console.error('[WhatsApp] \u274c Erro durante o envio da mensagem:', error.message);
      
      // Log detalhado do erro
      if (error.response) {
        // O servidor respondeu com um código de status fora do intervalo 2xx
        console.error(`[WhatsApp] Status HTTP: ${error.response.status}`);
        console.error('[WhatsApp] Resposta de erro:', JSON.stringify(error.response.data, null, 2));
      } else if (error.request) {
        // A requisição foi feita, mas não houve resposta
        console.error('[WhatsApp] Requisição sem resposta:', error.request);
      } else {
        // Erro na configuração da requisição
        console.error('[WhatsApp] Erro de configuração:', error.message);
      }
      
      console.error('[WhatsApp] ===== FIM DO ENVIO (ERRO) =====\n');
      return {
        success: false,
        error: error.message,
        data: null
      };
    }
  }

  /**
   * Obtém o tipo MIME com base na extensão do arquivo
   * @param filename Nome do arquivo
   * @returns Tipo MIME
   */
  private getMimeType(filename: string): string {
    if (!filename) return 'application/octet-stream';
    
    const ext = filename.split('.').pop()?.toLowerCase();
    const mimeTypes: Record<string, string> = {
      'pdf': 'application/pdf',
      'doc': 'application/msword',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'xls': 'application/vnd.ms-excel',
      'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'ppt': 'application/vnd.ms-powerpoint',
      'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'txt': 'text/plain',
      'csv': 'text/csv',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'mp3': 'audio/mpeg',
      'mp4': 'video/mp4',
      'wav': 'audio/wav',
      'zip': 'application/zip',
      'rar': 'application/x-rar-compressed'
    };
    
    return mimeTypes[ext || ''] || 'application/octet-stream';
  }
}

export default WhatsAppAdapter;
