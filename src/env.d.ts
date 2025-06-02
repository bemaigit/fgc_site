// Type definitions for @/env.mjs

declare module '@/env.mjs' {
  export const env: {
    NODE_ENV: 'development' | 'production' | 'test';
    REDIS_URL: string;
    REDIS_TOKEN: string;
    NEXTAUTH_URL: string;
    NEXTAUTH_SECRET: string;
    NEXT_PUBLIC_API_URL: string;
    NEXT_PUBLIC_SITE_URL: string;
    MERCADOPAGO_ACCESS_TOKEN: string;
    DATABASE_URL: string;
    SMTP_HOST: string;
    SMTP_PORT: string;
    SMTP_USER?: string;
    SMTP_PASS?: string;
    EMAIL_FROM: string;
    JWT_SECRET: string;
    CORS_ORIGIN: string;
    RATE_LIMIT_WINDOW_MS: string;
    RATE_LIMIT_MAX: string;
    CSP_REPORT_ONLY: string;
    HSTS_MAX_AGE: string;
    HSTS_INCLUDE_SUB_DOMAINS: string;
    HSTS_PRELOAD: string;
  };
}
