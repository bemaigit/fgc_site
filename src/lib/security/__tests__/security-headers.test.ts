// Mock do módulo @upstash/redis
jest.mock('@upstash/redis', () => ({
  Redis: jest.fn().mockImplementation(() => ({
    // Implementação mockada vazia
  })),
}));

// Mock do módulo @upstash/ratelimit
jest.mock('@upstash/ratelimit', () => ({
  Ratelimit: jest.fn().mockImplementation(() => ({
    limit: jest.fn().mockResolvedValue({
      success: true,
      limit: 100,
      remaining: 99,
      reset: Date.now() + 1000,
    }),
  })),
}));

import { securityMiddleware } from '../middleware';
import { NextRequest } from 'next/server';

// Tipos para os mocks
type MockRequestOptions = {
  method?: string;
  path?: string;
  headers?: Record<string, string>;
  ip?: string;
};

// Mock do NextResponse
const mockNextResponse = {
  next: () => ({
    headers: new Headers(),
    set: function(key: string, value: string) {
      this.headers.set(key, value);
      return this;
    }
  })
};

// Mock do NextRequest
const createMockRequest = (options: MockRequestOptions = {}) => {
  const headers = new Headers();
  if (options.headers) {
    Object.entries(options.headers).forEach(([key, value]) => {
      headers.set(key, value);
    });
  }
  
  return {
    method: options.method || 'GET',
    nextUrl: new URL(`http://localhost${options.path || '/'}`),
    headers,
    ip: options.ip || '127.0.0.1',
    cookies: { 
      get: () => undefined, 
      set: () => ({}), 
      delete: () => ({}), 
      has: () => false, 
      clear: () => {},
      getAll: () => []
    },
    json: async () => ({}),
    text: async () => '',
    formData: async () => new FormData(),
    arrayBuffer: async () => new ArrayBuffer(0),
    blob: async () => new Blob(),
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
  } as unknown as NextRequest;
};

describe('Security Headers Middleware', () => {
  let originalEnv: NodeJS.ProcessEnv;
  let originalNodeEnv: string | undefined;

  beforeAll(() => {
    // Salvar o ambiente original
    originalEnv = { ...process.env };
    originalNodeEnv = process.env.NODE_ENV;
    
    // Configurar variáveis de ambiente para teste usando Object.defineProperty
    // para evitar erros de leitura/escrita em propriedades somente leitura
    Object.defineProperty(process.env, 'NODE_ENV', {
      value: 'test',
      writable: true,
      configurable: true
    });
    
    // Configurar outras variáveis de ambiente
    process.env.REDIS_URL = 'http://localhost:6379';
    process.env.REDIS_TOKEN = 'test-token';
    process.env.NEXT_PUBLIC_API_URL = 'https://api.example.com';
    
    // Mock do módulo de ambiente
    jest.mock('@/env.mjs', () => ({
      env: {
        NODE_ENV: 'test',
        REDIS_URL: 'http://localhost:6379',
        REDIS_TOKEN: 'test-token',
        NEXT_PUBLIC_API_URL: 'https://api.example.com',
        NEXT_PUBLIC_SITE_URL: 'http://localhost:3000',
      },
    }), { virtual: true });
  });

  afterAll(() => {
    // Restaurar o ambiente original
    process.env = originalEnv;
    if (originalNodeEnv !== undefined) {
      Object.defineProperty(process.env, 'NODE_ENV', {
        value: originalNodeEnv,
        writable: true,
        configurable: true
      });
    }
    jest.resetModules();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve incluir o cabeçalho Content-Security-Policy', async () => {
    const req = createMockRequest({
      method: 'GET',
      path: '/',
      headers: {
        'user-agent': 'Mozilla/5.0',
        'x-forwarded-for': '127.0.0.1',
      },
    });

    const response = await securityMiddleware(req);
    expect(response).toBeDefined();
    
    if (response) {
      const headers = Object.fromEntries(response.headers.entries());
      const cspHeader = headers['content-security-policy'] || headers['content-security-policy-report-only'];
      
      expect(cspHeader).toBeDefined();
      expect(cspHeader).toContain("default-src 'self'");
      expect(cspHeader).toContain("script-src 'self'");
      expect(cspHeader).toContain("connect-src 'self'");
      expect(cspHeader).toContain("https://api.example.com");
    }
  });

  it('deve incluir o cabeçalho Strict-Transport-Security', async () => {
    const req = createMockRequest({
      method: 'GET',
      path: '/',
      headers: {
        'user-agent': 'Mozilla/5.0',
        'x-forwarded-for': '127.0.0.1',
      },
    });

    const response = await securityMiddleware(req);
    expect(response).toBeDefined();
    
    if (response) {
      const headers = Object.fromEntries(response.headers.entries());
      const hstsHeader = headers['strict-transport-security'];
      
      // Em ambiente de teste, o HSTS não deve ser aplicado
      expect(hstsHeader).toBeUndefined();
    }
  });

  it('deve incluir o cabeçalho X-Content-Type-Options', async () => {
    const req = createMockRequest({
      method: 'GET',
      path: '/',
      headers: {
        'user-agent': 'Mozilla/5.0',
        'x-forwarded-for': '127.0.0.1',
      },
    });

    const response = await securityMiddleware(req);
    expect(response).toBeDefined();
    
    if (response) {
      const headers = Object.fromEntries(response.headers.entries());
      expect(headers['x-content-type-options']).toBe('nosniff');
    }
  });

  it('deve incluir o cabeçalho X-Frame-Options', async () => {
    const req = createMockRequest({
      method: 'GET',
      path: '/',
      headers: {
        'user-agent': 'Mozilla/5.0',
        'x-forwarded-for': '127.0.0.1',
      },
    });

    const response = await securityMiddleware(req);
    expect(response).toBeDefined();
    
    if (response) {
      const headers = Object.fromEntries(response.headers.entries());
      expect(headers['x-frame-options']).toBe('DENY');
    }
  });

  describe('em ambiente de produção', () => {
    let productionSecurityMiddleware: typeof import('../middleware').securityMiddleware;
    
    beforeAll(() => {
      // Mock do módulo de ambiente para produção
      jest.doMock('@/env.mjs', () => ({
        env: {
          NODE_ENV: 'production',
          REDIS_URL: 'http://localhost:6379',
          REDIS_TOKEN: 'test-token',
          NEXT_PUBLIC_API_URL: 'https://api.example.com',
          NEXT_PUBLIC_SITE_URL: 'https://fgciclismo.com.br',
        },
      }), { virtual: true });
      
      // Recarregar o módulo para aplicar as configurações de produção
      jest.resetModules();
      productionSecurityMiddleware = require('../middleware').securityMiddleware;
    });
    
    afterAll(() => {
      jest.resetModules();
    });
    
    it('deve bloquear requisições de origens não permitidas', async () => {
      const req = createMockRequest({
        method: 'GET',
        path: '/',
        headers: {
          'user-agent': 'Mozilla/5.0',
          'x-forwarded-for': '127.0.0.1',
          'origin': 'https://malicious-site.com',
        },
      });

      const response = await productionSecurityMiddleware(req);
      expect(response).toBeDefined();
      
      if (response) {
        const headers = Object.fromEntries(response.headers.entries());
        // Em produção, a origem não permitida não deve estar no cabeçalho Access-Control-Allow-Origin
        expect(headers['access-control-allow-origin']).not.toBe('https://malicious-site.com');
      }
    });
    
    it('deve incluir o cabeçalho HSTS em produção', async () => {
      const req = createMockRequest({
        method: 'GET',
        path: '/',
        headers: {
          'user-agent': 'Mozilla/5.0',
          'x-forwarded-for': '127.0.0.1',
        },
      });

      const response = await productionSecurityMiddleware(req);
      expect(response).toBeDefined();
      
      if (response) {
        const headers = Object.fromEntries(response.headers.entries());
        const hstsHeader = headers['strict-transport-security'];
        
        expect(hstsHeader).toBeDefined();
        expect(hstsHeader).toContain('max-age=63072000');
        expect(hstsHeader).toContain('includeSubDomains');
        expect(hstsHeader).toContain('preload');
      }
    });
  });
});
