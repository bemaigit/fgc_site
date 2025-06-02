import { createEnv } from "@t3-oss/env-nextjs"
import { z } from "zod"

export const env = createEnv({
  server: {
    // Database
    DATABASE_URL: z.string().url(),
    SHADOW_DATABASE_URL: z.string().url(),

    // NextAuth
    NEXTAUTH_URL: z.string().url(),
    NEXTAUTH_SECRET: z.string().min(32),

    // Storage
    STORAGE_TYPE: z.enum(["minio", "local"]),
    MINIO_ENDPOINT: z.string().url(),
    MINIO_ACCESS_KEY: z.string().min(1),
    MINIO_SECRET_KEY: z.string().min(1),
    MINIO_BUCKET: z.string().min(1),
    MINIO_REGION: z.string().min(1),

    // Redis
    REDIS_URL: z.string().url(),

    // Email
    SMTP_HOST: z.string().min(1),
    SMTP_PORT: z.string().min(1),
    SMTP_USER: z.string().optional(),
    SMTP_PASS: z.string().optional(),
    EMAIL_FROM: z.string().email(),

    // Logs
    LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]),
  },
  client: {
    // Adicione variáveis públicas aqui se necessário
  },
  runtimeEnv: {
    // Database
    DATABASE_URL: process.env.DATABASE_URL,
    SHADOW_DATABASE_URL: process.env.SHADOW_DATABASE_URL,

    // NextAuth
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,

    // Storage
    STORAGE_TYPE: process.env.STORAGE_TYPE,
    MINIO_ENDPOINT: process.env.MINIO_ENDPOINT,
    MINIO_ACCESS_KEY: process.env.MINIO_ACCESS_KEY,
    MINIO_SECRET_KEY: process.env.MINIO_SECRET_KEY,
    MINIO_BUCKET: process.env.MINIO_BUCKET,
    MINIO_REGION: process.env.MINIO_REGION,

    // Redis
    REDIS_URL: process.env.REDIS_URL,

    // Email
    SMTP_HOST: process.env.SMTP_HOST,
    SMTP_PORT: process.env.SMTP_PORT,
    SMTP_USER: process.env.SMTP_USER,
    SMTP_PASS: process.env.SMTP_PASS,
    EMAIL_FROM: process.env.EMAIL_FROM,

    // Logs
    LOG_LEVEL: process.env.LOG_LEVEL,
  },
})
