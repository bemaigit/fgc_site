const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development', // Desabilitar em ambiente de desenvolvimento
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configurar o Next.js para trabalhar com Babel
  transpilePackages: ['next/font'],
  experimental: {
    serverActions: {
      enabled: true
    }
  },
  // Desabilitar verificação de ESLint e TypeScript no build para produção
  eslint: {
    ignoreDuringBuilds: true
  },
  typescript: {
    ignoreBuildErrors: true
  },
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '9000'
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3000'
      },
      {
        protocol: 'http',
        hostname: '127.0.0.1',
        port: '9000'
      },
      {
        protocol: 'http',
        hostname: '127.0.0.1',
        port: '3000'
      },
      {
        protocol: 'http',
        hostname: 'minio',
        port: '9000'
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
      {
        protocol: 'https',
        hostname: '*.ngrok-free.app',
      },
      {
        protocol: 'https',
        hostname: 'dev.bemai.com.br',
      }
    ],
  },
  async rewrites() {
    console.log('Configurando rewrites com:', {
      nodeEnv: process.env.NODE_ENV,
      baseUrl: process.env.NEXT_PUBLIC_BASE_URL 
        ? process.env.NEXT_PUBLIC_BASE_URL.replace(/[\[\]\(\)]/g, '') // Remove colchetes e parênteses
        : 'não definido'
    });
    
    return [
      {
        source: '/storage/:path*',
        destination: 'http://localhost:9000/:path*',
        // Como estamos gerando URLs sem o bucket duplicado, precisamos manter o caminho original
      },
    ]
  },
  pageExtensions: ['ts', 'tsx', 'js', 'jsx'],
}

module.exports = withPWA(nextConfig)
