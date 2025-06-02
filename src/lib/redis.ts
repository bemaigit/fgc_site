import { createClient } from 'redis';

// Configuração do cliente Redis
let redisClient: ReturnType<typeof createClient> | null = null;

// URL de conexão do Redis
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

/**
 * Obtém uma instância do cliente Redis
 */
export const getRedisClient = async () => {
  if (!redisClient) {
    redisClient = createClient({
      url: REDIS_URL,
    });

    // Configurar handlers de erro
    redisClient.on('error', (err: Error) => {
      console.error('Redis Error:', err);
    });

    redisClient.on('connect', () => {
      console.log('Redis connected successfully');
    });

    redisClient.on('reconnecting', () => {
      console.log('Redis reconnecting...');
    });

    // Conectar ao servidor Redis
    await redisClient.connect();
  }

  return redisClient;
};

/**
 * Fecha o cliente Redis
 */
export const closeRedisClient = async () => {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
    console.log('Redis connection closed');
  }
};

/**
 * Cliente Redis para uso com BullMQ
 * BullMQ utiliza conexões independentes com IORedis
 */
export const redis = {
  host: new URL(REDIS_URL).hostname,
  port: parseInt(new URL(REDIS_URL).port || '6379'),
  // Opcionalmente use senha se configurada
  ...(new URL(REDIS_URL).password ? { password: new URL(REDIS_URL).password } : {}),
};

export default getRedisClient;
