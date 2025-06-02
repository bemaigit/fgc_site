declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV: 'development' | 'production' | 'test';
    REDIS_URL?: string;
    REDIS_TOKEN?: string;
  }
}

interface MockRequestOptions {
  method?: string;
  path?: string;
  headers?: Record<string, string>;
  ip?: string;
}

interface MockNextResponse {
  next: jest.Mock;
  headers: Headers;
  set: jest.Mock;
}
