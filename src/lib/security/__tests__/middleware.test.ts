// Importando o middleware diretamente
// Mock global para o módulo @/env.mjs
jest.mock('@/env.mjs', () => ({
  env: {
    NODE_ENV: 'test',
    REDIS_URL: 'http://localhost:6379',
    REDIS_TOKEN: 'test-token',
    NEXTAUTH_SECRET: 'test-secret',
    NEXTAUTH_URL: 'http://localhost:3000',
  },
}));

const { securityMiddleware } = require('../middleware');

// Definindo um tipo mínimo para o request
type NextRequest = {
  method: string;
  nextUrl: URL;
  headers: Headers;
  ip?: string;
  cookies: any;
  [key: string]: any;
};

// Adiciona tipagem para o this no mock
interface MockResponseThis {
  headers: Headers;
}

// Mock do NextResponse
const mockNextResponse: MockNextResponse = {
  next: jest.fn().mockReturnThis(),
  headers: new Headers(),
  set: jest.fn<MockNextResponse, [string, string]>(function(this: MockResponseThis, key: string, value: string) {
    this.headers.set(key, value);
    return this as unknown as MockNextResponse;
  }),
};

// Mock do NextRequest
const createMockRequest = (options: MockRequestOptions = {}) => {
  const headers = new Headers();
  if (options.headers) {
    Object.entries(options.headers).forEach(([key, value]) => {
      headers.set(key, value);
    });
  }
  
  // Cria um objeto que implementa o mínimo necessário para o teste
  const mockRequest = {
    method: options.method || 'GET',
    nextUrl: new URL(`http://localhost${options.path || '/'}`),
    headers,
    ip: options.ip,
    // Propriedades mínimas necessárias para o tipo NextRequest
    cookies: { 
      get: () => undefined, 
      set: () => ({}), 
      delete: () => ({}), 
      has: () => false, 
      clear: () => {},
      getAll: () => []
    },
    // Métodos básicos de Request
    json: async () => ({}),
    text: async () => '',
    formData: async () => new FormData(),
    arrayBuffer: async () => new ArrayBuffer(0),
    blob: async () => new Blob(),
    // Outras propriedades necessárias
    url: `http://localhost${options.path || '/'}`,
    body: null,
    bodyUsed: false,
    cache: 'default',
    credentials: 'same-origin',
    destination: '',
    integrity: '',
    keepalive: false,
    mode: 'cors',
    redirect: 'follow',
    referrer: '',
    referrerPolicy: 'no-referrer',
    signal: { aborted: false } as AbortSignal,
    clone: function() { return this; }
  };
  
  return mockRequest as unknown as NextRequest;
};

describe('Security Middleware', () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeAll(() => {
    // Salvar o ambiente original
    originalEnv = { ...process.env };
    // Configurar variáveis de ambiente para teste
    process.env = {
      ...process.env,
      NODE_ENV: 'test',
      REDIS_URL: 'http://localhost:6379',
      REDIS_TOKEN: 'test-token'
    };
  });

  afterAll(() => {
    // Restaurar o ambiente original
    process.env = originalEnv;
  });

  beforeEach(() => {
    // Limpar mocks antes de cada teste
    jest.clearAllMocks();
  });

  it('deve adicionar cabeçalhos de segurança', async () => {
    const req = createMockRequest({
      method: 'GET',
      path: '/',
      headers: {
        'user-agent': 'Mozilla/5.0',
      },
    });

    const response = await securityMiddleware(req);
    
    // Verificar se a resposta não é nula
    expect(response).toBeDefined();
    
    // Verificar se os cabeçalhos de segurança foram adicionados
    if (response) {
      const headers = Object.fromEntries(response.headers.entries());
      expect(headers['x-content-type-options']).toBe('nosniff');
      expect(headers['x-frame-options']).toBe('DENY');
      expect(headers['x-xss-protection']).toBe('1; mode=block');
    }
  });

  it('deve permitir requisições de origens permitidas', async () => {
    const req = createMockRequest({
      method: 'GET',
      path: '/',
      headers: {
        'user-agent': 'Mozilla/5.0',
        origin: 'http://localhost:3000',
      },
    });

    const response = await securityMiddleware(req);
    expect(response).toBeDefined();
  });

  it('deve lidar com requisições OPTIONS para CORS', async () => {
    const req = createMockRequest({
      method: 'OPTIONS',
      path: '/',
      headers: {
        'user-agent': 'Mozilla/5.0',
        origin: 'http://localhost:3000',
      },
    });

    const response = await securityMiddleware(req);
    expect(response).toBeDefined();
    
    if (response) {
      expect(response.status).toBe(204);
      const headers = Object.fromEntries(response.headers.entries());
      expect(headers['access-control-allow-methods']).toBeDefined();
      expect(headers['access-control-allow-headers']).toBeDefined();
    }
  });
});
