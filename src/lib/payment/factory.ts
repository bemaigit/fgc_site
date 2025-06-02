import { 
  PaymentProvider, 
  PaymentGateway,
  MercadoPagoCredentials,
  BaseCredentials,
  PaymentGatewayConfig,
  EntityType,
  PaymentMethod,
  PagSeguroCredentials
} from "./types"
import { MercadoPagoGateway } from "@/lib/payment/adapters/mercadopago"
import { PagSeguroGateway } from "@/lib/payment/adapters/pagseguro"
import { Prisma } from "@prisma/client"

interface GatewayConfig {
  id: string
  provider: PaymentProvider
  credentials: Prisma.JsonValue
}

type GatewayCredentials = 
  | MercadoPagoCredentials 
  | PagSeguroCredentials

interface RawCredentials extends Record<string, unknown> {
  access_token?: string
  accessToken?: string
  public_key?: string
  publicKey?: string
  email?: string
  token?: string
  appId?: string
  appKey?: string
  apiKey?: string
  apiSecret?: string
  pagseguroToken?: string
  pagseguroAppId?: string
  pagseguroAppKey?: string
  pagseguroEmail?: string
}

function parseCredentials(
  provider: PaymentProvider,
  credentials: string | Prisma.JsonValue
): GatewayCredentials {
  // Log para debug
  console.log("Parseando credenciais:", {
    provider,
    credentialsType: typeof credentials,
    isString: typeof credentials === 'string'
  });

  let parsedCredentials: RawCredentials;
  
  try {
    // Se já for string, tenta parsear
    if (typeof credentials === 'string') {
      parsedCredentials = JSON.parse(credentials);
    }
    // Se for objeto, usa diretamente
    else {
      parsedCredentials = credentials as RawCredentials;
    }
  } catch (error) {
    console.error("Erro ao parsear credenciais:", error);
    throw new Error("Credenciais inválidas");
  }

  // Log para debug
  console.log("Credenciais parseadas:", parsedCredentials);

  // Verificar se as credenciais foram parseadas corretamente
  if (!parsedCredentials) {
    console.error('Credenciais não puderam ser parseadas corretamente');
    throw new Error('Credenciais inválidas ou formato não suportado');
  }

  // Normaliza as credenciais
  const normalizedCredentials: RawCredentials = {
    access_token: parsedCredentials.access_token || parsedCredentials.accessToken,
    public_key: parsedCredentials.public_key || parsedCredentials.publicKey,
    email: parsedCredentials.email,
    token: parsedCredentials.token,
    appId: parsedCredentials.appId,
    appKey: parsedCredentials.appKey,
    apiKey: parsedCredentials.apiKey,
    apiSecret: parsedCredentials.apiSecret,
    pagseguroToken: parsedCredentials.pagseguroToken || parsedCredentials.token,
    pagseguroAppId: parsedCredentials.pagseguroAppId || parsedCredentials.appId,
    pagseguroAppKey: parsedCredentials.pagseguroAppKey || parsedCredentials.appKey,
    pagseguroEmail: parsedCredentials.pagseguroEmail || parsedCredentials.email
  };

  // Retorna as credenciais específicas do provider
  switch (provider) {
    case PaymentProvider.MERCADO_PAGO:
      return {
        access_token: normalizedCredentials.access_token,
        public_key: normalizedCredentials.public_key
      } as MercadoPagoCredentials;
      
    case PaymentProvider.PAGSEGURO:
      return {
        token: normalizedCredentials.pagseguroToken,
        appId: normalizedCredentials.pagseguroAppId,
        appKey: normalizedCredentials.pagseguroAppKey,
        email: normalizedCredentials.pagseguroEmail
      } as PagSeguroCredentials;

    default:
      throw new Error(`Provider ${provider} não suportado`);
  }
}

export function getPaymentGateway(
  provider: PaymentProvider,
  config: PaymentGatewayConfig
): PaymentGateway {
  console.log("Obtendo gateway de pagamento:", provider)

  switch (provider) {
    case PaymentProvider.MERCADO_PAGO:
      console.log("Inicializando Mercado Pago")
      return new MercadoPagoGateway(config.credentials as MercadoPagoCredentials)
      
    case PaymentProvider.PAGSEGURO:
      console.log("Inicializando PagSeguro")
      return new PagSeguroGateway({
        credentials: config.credentials as PagSeguroCredentials,
        sandbox: config.sandbox
      })

    default:
      throw new Error(`Gateway de pagamento não suportado: ${provider}`)
  }
}

export function createPaymentGateway(
  config: {
    provider: PaymentProvider;
    credentials: any; // Usando any para aceitar diferentes formatos
    sandbox?: boolean;
  }
): PaymentGateway {
  console.log("Criando gateway de pagamento:", config.provider);
  
  try {
    // Tratamento específico para cada provedor
    switch (config.provider) {
      case PaymentProvider.MERCADO_PAGO:
        console.log("Inicializando Mercado Pago");
        
        // Validação das credenciais para Mercado Pago
        if (!config.credentials.access_token) {
          throw new Error('Credenciais do Mercado Pago inválidas: access_token é obrigatório');
        }
        
        const mpGateway = new MercadoPagoGateway({
          access_token: config.credentials.access_token,
          public_key: config.credentials.public_key || ''
        });
        
        // Verificar se o gateway implementa os métodos necessários
        if (typeof mpGateway.createPayment !== 'function') {
          throw new Error('MercadoPagoGateway não implementa o método createPayment');
        }
        
        return mpGateway;
        
      case PaymentProvider.PAGSEGURO:
        console.log("Inicializando PagSeguro");
        
        // Validação das credenciais para PagSeguro - aceitar o nome original ou com prefixo
        const token = config.credentials.pagseguroToken || config.credentials.token;
        
        console.log("Checando token do PagSeguro:", token);
        
        if (!token) {
          throw new Error('Credenciais do PagSeguro inválidas: token é obrigatório');
        }
        
        // Usar as credenciais com token válido
        const credentials = {
          token: token,
          appId: config.credentials.pagseguroAppId || config.credentials.appId || '',
          appKey: config.credentials.pagseguroAppKey || config.credentials.appKey || ''
        };
        
        console.log("Criando PagSeguro com token:", token);
        
        const psGateway = new PagSeguroGateway({
          credentials: credentials,
          sandbox: config.sandbox || true
        });
        
        // Verificar se o gateway implementa os métodos necessários
        if (typeof psGateway.createPayment !== 'function') {
          throw new Error('PagSeguroGateway não implementa o método createPayment');
        }
        
        return psGateway;

      default:
        throw new Error(`Gateway de pagamento não suportado: ${config.provider}`);
    }
  } catch (error) {
    console.error('Erro ao criar gateway de pagamento:', error);
    throw error;
  }
}

export function validateGatewayCredentials(
  provider: PaymentProvider, 
  credentials: BaseCredentials
): boolean {
  console.log("Validando credenciais para:", provider)
  
  const rawCredentials = credentials as RawCredentials;
  
  switch (provider) {
    case PaymentProvider.MERCADO_PAGO:
      return !!(rawCredentials.access_token || rawCredentials.accessToken) && 
             !!(rawCredentials.public_key || rawCredentials.publicKey)
             
    case PaymentProvider.PAGSEGURO:
      return !!(rawCredentials.pagseguroToken || rawCredentials.token) && 
             !!(rawCredentials.pagseguroAppId || rawCredentials.appId) && 
             !!(rawCredentials.pagseguroAppKey || rawCredentials.appKey) && 
             !!(rawCredentials.pagseguroEmail || rawCredentials.email)

    default:
      return false
  }
}