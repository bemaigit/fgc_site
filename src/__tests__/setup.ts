// Polyfill para APIs do navegador
import nodeFetch, { Request, Response, Headers } from 'node-fetch';
import { TextEncoder, TextDecoder } from 'util';

// Polyfill para APIs do navegador
globalThis.Request = Request as any;
globalThis.Response = Response as any;
globalThis.Headers = Headers as any;
globalThis.fetch = nodeFetch as any;

// Polyfill para TextEncoder e TextDecoder
global.TextEncoder = TextEncoder as any;
global.TextDecoder = TextDecoder as any;

// Mock para localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = String(value);
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

// Adiciona o mock do localStorage ao global
global.localStorage = localStorageMock as any;

// Mock para sessionStorage
const sessionStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = String(value);
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

global.sessionStorage = sessionStorageMock as any;

// Mock para matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock para scrollTo
window.scrollTo = jest.fn();
