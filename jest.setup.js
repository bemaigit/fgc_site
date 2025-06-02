// Configurações globais para os testes
require('@testing-library/jest-dom');

// Mock de variáveis de ambiente
process.env.NEXT_PUBLIC_API_URL = 'http://localhost:3000/api';
process.env.NEXT_PUBLIC_SITE_URL = 'http://localhost:3000';
process.env.NEXTAUTH_URL = 'http://localhost:3000';
process.env.NEXTAUTH_SECRET = 'test-secret';
process.env.REDIS_URL = 'redis://localhost:6379';
process.env.REDIS_TOKEN = 'test-token';

// Mock do Next.js router
jest.mock('next/router', () => ({
  useRouter() {
    return {
      route: '/',
      pathname: '',
      query: {},
      asPath: '',
      push: jest.fn(),
      events: {
        on: jest.fn(),
        off: jest.fn(),
      },
      beforePopState: jest.fn(),
      prefetch: jest.fn(),
    };
  },
}));

// Mock do Next.js Head
jest.mock('next/head', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: ({ children }) => {
      return React.createElement(React.Fragment, null, children);
    },
  };
});
