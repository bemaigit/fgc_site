'use client'

import { useEffect, useState, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { Menu, X } from 'lucide-react'
import { HeaderConfig, HeaderMenu } from '@prisma/client'

const defaultConfig: Partial<HeaderConfig> = {
  id: 'default-header',
  logo: '/images/logo-fgc.png',
  background: '#08285d',
  hoverColor: '#177cc3',
  textColor: '#ffffff',
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date()
}

export function Header() {
  const { data: session, status } = useSession()
  
  // Verificar se o usuário é ADMIN ou SUPER_ADMIN
  const isAdminUser = session?.user?.role === 'ADMIN' || session?.user?.role === 'SUPER_ADMIN'
  
  // Log detalhado da sessão para depuração
  useEffect(() => {
    console.log('Session status:', status)
    console.log('Session data:', session)
    console.log('User role:', session?.user?.role)
    console.log('User ID:', session?.user?.id)
  }, [session, status])
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [headerConfig, setHeaderConfig] = useState<HeaderConfig>(defaultConfig as HeaderConfig)
  const [menus, setMenus] = useState<HeaderMenu[]>([])

  const loadHeaderConfig = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const res = await fetch('/api/header')
      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.error || `Erro no servidor: ${res.status}`)
      }
      
      if (!data || !data.config) {
        throw new Error('Dados inválidos recebidos da API')
      }

      setHeaderConfig(data.config)
      setMenus(data.menus || [])
    } catch (error) {
      console.error('Erro ao carregar configurações do header:', error)
      setError(error instanceof Error ? error.message : 'Erro desconhecido')
      setHeaderConfig(defaultConfig as HeaderConfig)
      setMenus([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadHeaderConfig()
  }, [loadHeaderConfig])

  return (
    <>
      <header 
        className="fixed top-0 left-0 right-0 z-50 shadow-md"
        style={{ backgroundColor: headerConfig.background }}
      >
        <div className="container mx-auto">
          <div className="flex items-center h-20">
            {/* Menu Mobile - Movido para esquerda */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="lg:hidden p-2 rounded-lg hover:bg-white/10 order-first"
              style={{ color: headerConfig.textColor }}
            >
              {isMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>

            {/* Logo - Centralizada em mobile */}
            <Link href="/" className="flex-shrink-0 px-4 mx-auto lg:mx-0">
              <Image
                src={headerConfig.logo && headerConfig.logo.includes('storage/header/') ? 
                  `/api/header/logo?path=${encodeURIComponent(headerConfig.logo.split('storage/header/')[1])}` : 
                  headerConfig.logo.includes('/') && !headerConfig.logo.startsWith('/images/') ? 
                    `/api/header/logo?path=${encodeURIComponent(headerConfig.logo.split('/').pop() || '')}` :
                    headerConfig.logo
                }
                alt="Logo FGC"
                width={72}
                height={36}
                className="h-7 w-auto"
                priority
              />
            </Link>

            {/* Menu Desktop */}
            <nav className={`
              ${isMenuOpen 
                ? 'absolute top-full left-0 right-0 bg-[#08285d] shadow-lg'
                : 'hidden lg:flex'
              }
              lg:static lg:flex-1 lg:bg-transparent
            `}
            >
              {/* Container para os menus principais - Centralizado */}
              <div className="flex flex-col lg:flex-row lg:flex-1 lg:items-center lg:justify-center">
                {menus.map((menu) => (
                  <Link
                    key={menu.id}
                    href={menu.url}
                    className={`
                      px-4 py-3 lg:py-2
                      text-sm font-medium
                      transition-colors duration-200
                      hover:bg-[#177cc3]
                      block lg:inline-block
                    `}
                    style={{ color: headerConfig.textColor }}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {menu.label}
                  </Link>
                ))}
              </div>

              
              {/* Botões de autenticação */}
              <div className="flex flex-col lg:flex-row lg:items-center space-y-2 lg:space-y-0 lg:space-x-2 p-4 lg:p-0">
                {status === 'authenticated' ? (
                  <>
                    {/* Botão de Dashboard apenas para ADMIN ou SUPER_ADMIN */}
                    {isAdminUser && (
                      <Link
                        href="/dashboard"
                        className="px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 text-center"
                        style={{ 
                          backgroundColor: headerConfig.hoverColor,
                          color: headerConfig.textColor
                        }}
                        onClick={() => setIsMenuOpen(false)}
                      >
                        Dashboard
                      </Link>
                    )}
                    
                    {/* Botão Meu Perfil para todos os usuários autenticados */}
                    <Link
                      href="/dashboard/meu-perfil"
                      className="px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 text-center"
                      style={{ 
                        backgroundColor: headerConfig.hoverColor,
                        color: headerConfig.textColor
                      }}
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Meu Perfil
                    </Link>
                    
                    <button
                      onClick={() => {
                        setIsMenuOpen(false)
                        signOut()
                      }}
                      className="px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
                      style={{ 
                        backgroundColor: headerConfig.hoverColor,
                        color: headerConfig.textColor
                      }}
                    >
                      Sair
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      href="/auth/login"
                      className="px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 text-center"
                      style={{ 
                        backgroundColor: headerConfig.hoverColor,
                        color: headerConfig.textColor
                      }}
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Entrar
                    </Link>
                    <Link
                      href="/auth/register"
                      className="px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 text-center"
                      style={{ 
                        backgroundColor: headerConfig.hoverColor,
                        color: headerConfig.textColor
                      }}
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Cadastrar
                    </Link>
                  </>
                )}
              </div>
            </nav>
          </div>
        </div>

        {/* Mensagem de erro */}
        {error && (
          <div className="bg-red-500 text-white px-4 py-2 text-sm text-center">
            {error}
          </div>
        )}
      </header>
      {/* Espaçador para compensar o header fixo */}
      <div className="h-20"></div>
    </>
  )
}