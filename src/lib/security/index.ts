/**
 * Módulo de Segurança
 * 
 * Este módulo exporta todas as funcionalidades de segurança da aplicação,
 * incluindo middlewares, configurações e utilitários relacionados à segurança.
 */

export * from './config'
export * from './middleware'

export { default as securityMiddleware } from './middleware'
export { default as securityConfig } from './config'
