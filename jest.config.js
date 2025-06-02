/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest/presets/default-esm', // Usando preset ESM
  testEnvironment: 'jsdom', // Alterado de 'node' para 'jsdom' para suportar React
  testMatch: ['**/__tests__/**/*.test.{ts,tsx}'], // Adicionado suporte a .tsx
  
  // Mapeamento de módulos
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@/env\\.mjs$': '<rootDir>/src/__mocks__/env-mock.js',
    '^@/env$': '<rootDir>/src/__mocks__/env-mock.js',
    '^@/env\\.mjs\\?import$': '<rootDir>/src/__mocks__/env-mock.js',
    // Adiciona suporte para arquivos estáticos
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '^@/components/(.*)$': '<rootDir>/src/components/$1',
  },
  
  // Configuração do transform
  transform: {
    '^.+\\.(t|j)sx?$': ['ts-jest', {
      useESM: true,
      tsconfig: 'tsconfig.json',
      babelConfig: true, // Habilita o uso do babel.config.js
    }],
  },
  
  // Extensões de arquivo que serão processadas
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  
  // Configurações de transformação
  transformIgnorePatterns: [
    'node_modules/(?!(?:@upstash/.*|next/dist/.*|@testing-library/.*|@radix-ui/.*|@hookform/.*|@tanstack/.*|@t3-oss/.*)/)',
  ],
  
  // Arquivos de setup
  setupFiles: ['<rootDir>/src/__tests__/setup.ts'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js', '@testing-library/jest-dom'],
  
  // Opções do ambiente de teste
  testEnvironmentOptions: {
    url: 'http://localhost:3000',
  },
  
  // Globais necessários
  globals: {
    'ts-jest': {
      useESM: true,
      babelConfig: true,
    },
  },
  
  // Extensões que serão tratadas como módulos ES
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
  
  // Configurações para lidar com módulos ES
  moduleDirectories: ['node_modules', 'src'],
  
  // Configuração para ignorar erros de tipo durante os testes
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.test.json',
      babelConfig: true,
      useESM: true,
    },
  },
  
  // Configuração para ignorar certos erros de tipo durante os testes
  testPathIgnorePatterns: [
    '/node_modules/',
    '/.next/',
    '/out/',
    '/public/',
  ],
  
  // Configuração de cobertura de código
  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.test.{ts,tsx}',
    '!src/**/__tests__/**',
    '!src/**/__mocks__/**',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['json', 'lcov', 'text', 'clover'],
  
  // Adiciona suporte para módulos ES
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@/components/(.*)$': '<rootDir>/src/components/$1',
    '^@/lib/(.*)$': '<rootDir>/src/lib/$1',
    '^@/types/(.*)$': '<rootDir>/src/types/$1',
    '^@/styles/(.*)$': '<rootDir>/src/styles/$1',
    '^@/public/(.*)$': '<rootDir>/public/$1',
  },
};
