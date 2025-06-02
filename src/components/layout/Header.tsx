'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Menu, X, Loader2 } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { processHeaderLogoUrl } from '@/lib/processHeaderLogoUrl'

const navigation = [
  { name: 'Início', href: '/' },
  { name: 'Eventos', href: '/eventos' },
  { name: 'Notícias', href: '/noticias' },
  { name: 'Rankings', href: '/rankings' },
  { name: 'Filiação', href: '/filiacao' },
  { name: 'Contato', href: '/contato' },
]

export function Header() {
  const { data: session, status } = useSession()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [headerConfig, setHeaderConfig] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  
  // Log detalhado da sessão para depuração
  useEffect(() => {
    console.log('Session status:', status)
    console.log('Session data:', session)
    console.log('User role:', session?.user?.role)
    console.log('Session user:', session?.user)
  }, [session, status])

  // Buscar configuração do header
  useEffect(() => {
    const fetchHeaderConfig = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/header')
        if (!response.ok) throw new Error('Erro ao buscar configuração do header')
        const data = await response.json()
        console.log('Header config recebido:', data.config)
        console.log('Logo URL recebida:', data.config?.logo)
        
        // Maior detalhamento para depuração
        if (data.config?.logo) {
          console.log('Logo URL é string?', typeof data.config.logo === 'string')
          console.log('Logo URL inclui storage/header?', data.config.logo.includes('storage/header/'))
          
          // Tentar extrair o nome do arquivo independente do formato
          const filename = data.config.logo.split('/').pop()
          console.log('Nome do arquivo extraído:', filename)

          // Codificar o caminho
          const encodedPath = data.config.logo.includes('storage/header/') 
            ? encodeURIComponent(data.config.logo.split('storage/header/')[1])
            : encodeURIComponent(data.config.logo)
            
          console.log('URL que será usada:', `/api/header/logo?path=${encodedPath}`)
        }
        setHeaderConfig(data.config)
      } catch (error) {
        console.error('Erro ao buscar configuração do header:', error)
        // Configuração padrão em caso de erro
        setHeaderConfig({
          logo: '/images/logo-fgc-dark.png',
          background: '#08285d',
          hoverColor: '#177cc3',
          textColor: '#ffffff'
        })
      } finally {
        setLoading(false)
      }
    }

    fetchHeaderConfig()
  }, [])
  
  // Verificar se o usuário é ADMIN ou SUPER_ADMIN
  const isAdminUser = session?.user?.role === 'ADMIN' || session?.user?.role === 'SUPER_ADMIN'

  return (
    <header className="bg-white shadow-sm">
      <nav className="mx-auto flex max-w-7xl items-center justify-between p-4 lg:px-8" aria-label="Global">
        <div className="flex lg:flex-1">
          <Link href="/" className="-m-1.5 p-1.5">
            {loading ? (
              <div className="flex items-center justify-center w-[120px] h-[34px]">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            ) : (
              <Image
                src={headerConfig?.logo ? 
                  (headerConfig.logo.includes('storage/header/') ? 
                    `/api/header/logo?path=${encodeURIComponent(headerConfig.logo.split('storage/header/')[1])}` : 
                    headerConfig.logo.includes('/') ? 
                      `/api/header/logo?path=${encodeURIComponent(headerConfig.logo.split('/').pop() || '')}` :
                      `/api/header/logo?path=${encodeURIComponent(headerConfig.logo)}`
                  ) 
                  : '/images/logo-fgc-dark.png'}
                alt="FGC Logo"
                width={120}
                height={34}
                className="w-auto h-[34px]"
                priority
              />
            )}
          </Link>
        </div>
        
        <div className="flex lg:hidden">
          <button
            type="button"
            className="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-gray-700"
            onClick={() => setMobileMenuOpen(true)}
          >
            <span className="sr-only">Abrir menu</span>
            <Menu className="h-6 w-6" aria-hidden="true" />
          </button>
        </div>
        
        <div className="hidden lg:flex lg:gap-x-12">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="text-sm font-semibold leading-6 text-gray-900 hover:text-[#7db0de]"
            >
              {item.name}
            </Link>
          ))}
        </div>
        
        <div className="hidden lg:flex lg:flex-1 lg:justify-end">
          {/* Botão de teste para confirmar que é possível adicionar novos botões */}
          <Link
            href="#"
            className="text-sm font-semibold leading-6 text-white bg-green-500 px-4 py-2 rounded-md hover:bg-green-600 mr-2"
          >
            Botão Teste
          </Link>
          
          {status === 'authenticated' ? (
            <>
              {/* Botão de Dashboard apenas para ADMIN e SUPER_ADMIN */}
              {isAdminUser && (
                <Link
                  href="/dashboard"
                  className="text-sm font-semibold leading-6 text-white bg-[#08285d] px-4 py-2 rounded-md hover:bg-[#7db0de] mr-2"
                >
                  Dashboard
                </Link>
              )}
              
              {/* Botão Meu Perfil para todos os usuários autenticados */}
              <Link
                href="/dashboard/meu-perfil"
                className="text-sm font-semibold leading-6 text-white bg-[#7db0de] px-4 py-2 rounded-md hover:bg-[#08285d]"
              >
                Meu Perfil
              </Link>
              
              <Link
                href="/auth/logout"
                className="text-sm font-semibold leading-6 text-white bg-[#08285d] px-4 py-2 rounded-md hover:bg-[#7db0de] ml-2"
              >
                Sair
              </Link>
            </>
          ) : (
            <Link
              href="/auth/login"
              className="text-sm font-semibold leading-6 text-white bg-[#7db0de] px-4 py-2 rounded-md hover:bg-[#08285d]"
            >
              Entrar
            </Link>
          )}
        </div>
      </nav>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden">
          <div className="fixed inset-0 z-50" />
          <div className="fixed inset-y-0 right-0 z-50 w-full overflow-y-auto bg-white px-6 py-6 sm:max-w-sm sm:ring-1 sm:ring-gray-900/10">
            <div className="flex items-center justify-between">
              <Link href="/" className="-m-1.5 p-1.5">
                {loading ? (
                  <div className="flex items-center justify-center w-[120px] h-[34px]">
                    <Loader2 className="h-5 w-5 animate-spin" />
                  </div>
                ) : (
                  <Image
                    src={headerConfig?.logo ? 
                      (headerConfig.logo.includes('storage/header/') ? 
                        `/api/header/logo?path=${encodeURIComponent(headerConfig.logo.split('storage/header/')[1])}` : 
                        headerConfig.logo.includes('/') ? 
                          `/api/header/logo?path=${encodeURIComponent(headerConfig.logo.split('/').pop() || '')}` :
                          `/api/header/logo?path=${encodeURIComponent(headerConfig.logo)}`
                      ) 
                      : '/images/logo-fgc-dark.png'}
                    alt="FGC Logo"
                    width={120}
                    height={34}
                    className="w-auto h-[34px]"
                  />
                )}
              </Link>
              <button
                type="button"
                className="-m-2.5 rounded-md p-2.5 text-gray-700"
                onClick={() => setMobileMenuOpen(false)}
              >
                <span className="sr-only">Fechar menu</span>
                <X className="h-6 w-6" aria-hidden="true" />
              </button>
            </div>
            <div className="mt-6 flow-root">
              <div className="-my-6 divide-y divide-gray-500/10">
                <div className="space-y-2 py-6">
                  {navigation.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      className="-mx-3 block rounded-lg px-3 py-2 text-base font-semibold leading-7 text-gray-900 hover:bg-gray-50"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {item.name}
                    </Link>
                  ))}
                </div>
                <div className="py-6">
                  {/* Botão de teste para confirmar que é possível adicionar novos botões (versão mobile) */}
                  <Link
                    href="#"
                    className="-mx-3 block rounded-lg px-3 py-2.5 text-base font-semibold leading-7 text-green-600 hover:bg-gray-50"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Botão Teste
                  </Link>
                  
                  {status === 'authenticated' ? (
                    <>
                      {/* Botão de Dashboard apenas para ADMIN e SUPER_ADMIN na versão mobile */}
                      {isAdminUser && (
                        <Link
                          href="/dashboard"
                          className="-mx-3 block rounded-lg px-3 py-2.5 text-base font-semibold leading-7 text-gray-900 hover:bg-gray-50"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          Dashboard
                        </Link>
                      )}
                      
                      {/* Botão Meu Perfil para todos os usuários autenticados */}
                      <Link
                        href="/dashboard/meu-perfil"
                        className="-mx-3 block rounded-lg px-3 py-2.5 text-base font-semibold leading-7 text-gray-900 hover:bg-gray-50"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Meu Perfil
                      </Link>
                      
                      <Link
                        href="/auth/logout"
                        className="-mx-3 block rounded-lg px-3 py-2.5 text-base font-semibold leading-7 text-gray-900 hover:bg-gray-50"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Sair
                      </Link>
                    </>
                  ) : (
                    <Link
                      href="/auth/login"
                      className="-mx-3 block rounded-lg px-3 py-2.5 text-base font-semibold leading-7 text-gray-900 hover:bg-gray-50"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Entrar
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
