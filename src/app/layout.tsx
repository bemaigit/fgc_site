import type { Metadata } from 'next'
// Removido import da fonte Inter do next/font para evitar conflito com Babel
import './globals.css'
import '@/styles/scrollbar-hide.css'
import '@/styles/select-fix.css' // CSS para corrigir fundos transparentes nos selects
import '@/styles/dropdown-fix.css' // CSS adicional para corrigir problemas de dropdown
import { NextAuthProvider } from "@/providers/auth"
import { QueryProvider } from "@/providers/query"

export const metadata: Metadata = {
  title: {
    default: 'FGC - Federação Goiana de Ciclismo',
    template: '%s | FGC'
  },
  description: 'Site oficial da Federação Goiana de Ciclismo',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'FGC',
  },
  formatDetection: {
    telephone: false
  },
}

export const viewport = {
  themeColor: '#0ea5e9',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        {/* Adicionar link para a fonte Inter via Google Fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body className="font-sans">
        <NextAuthProvider>
          <QueryProvider>
            {children}
          </QueryProvider>
        </NextAuthProvider>
      </body>
    </html>
  )
}
