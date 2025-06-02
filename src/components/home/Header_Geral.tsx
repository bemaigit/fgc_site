'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { Menu, X, ChevronDown } from 'lucide-react'
import { HeaderConfig, HeaderMenu } from '@prisma/client'

export function Header_Geral() {
  const { data: session } = useSession()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [headerConfig, setHeaderConfig] = useState<HeaderConfig | null>(null)
  const [menus, setMenus] = useState<HeaderMenu[]>([])

  useEffect(() => {
    const loadHeaderConfig = async () => {
      try {
        setIsLoading(true)
        const res = await fetch('/api/header')
        
        if (!res.ok) {
          throw new Error(`Erro HTTP: ${res.status}`)
        }

        let data
        try {
          data = await res.json()
        } catch (jsonError) {
          console.error('Erro ao fazer parse do JSON:', jsonError)
          throw new Error('Falha ao processar resposta do servidor')
        }
        
        if (!data || !data.config) {
          throw new Error('Dados inválidos recebidos da API')
        }

        setHeaderConfig(data.config)
        setMenus(data.menus || [])
      } catch (error) {
        console.error('Erro ao carregar configurações do header:', error)
        // Em caso de erro, usar configuração padrão
        setHeaderConfig({
          id: 'default-header',
          logo: '/images/logo-fgc.png',
          background: '#08285d',
          hoverColor: '#177cc3',
          textColor: '#ffffff',
          createdAt: new Date(),
          updatedAt: new Date()
        })
        setMenus([])
      } finally {
        setIsLoading(false)
      }
    }

    loadHeaderConfig()
  }, [])

  const isAdmin = session?.user?.role === 'ADMIN'
  const isEditor = session?.user?.role === 'EDITOR'
  const showDashboard = isAdmin || isEditor

  if (isLoading) {
    return (
      <header 
        className="fixed top-0 left-0 right-0 z-50 bg-[#08285d] text-white h-16 flex items-center justify-between px-4 md:px-8"
      >
        <div className="animate-pulse bg-gray-600 h-8 w-24"></div>
      </header>
    )
  }

  return (
    <header 
      className="fixed top-0 left-0 right-0 z-50 h-16 flex items-center justify-between px-4 md:px-8"
      style={{ 
        backgroundColor: headerConfig?.background || '#08285d',
        color: headerConfig?.textColor || '#ffffff'
      }}
    >
      {/* Logo */}
      <Link href="/" className="flex items-center">
        <Image
          src={headerConfig?.logo || '/images/logo-fgc.png'}
          alt="Logo FGC"
          width={120}
          height={40}
          className="h-10 w-auto"
        />
      </Link>

      {/* Menu Mobile */}
      <button
        className="md:hidden"
        onClick={() => setIsMenuOpen(!isMenuOpen)}
      >
        {isMenuOpen ? <X /> : <Menu />}
      </button>

      {/* Menu Desktop */}
      <nav className={`
        fixed md:relative top-16 md:top-0 left-0 w-full md:w-auto
        ${isMenuOpen ? 'block' : 'hidden'} md:block
        bg-[#08285d] md:bg-transparent
        py-4 md:py-0
      `}>
        <ul className="flex flex-col md:flex-row items-start md:items-center gap-4 px-4 md:px-0">
          {menus.map((menu) => (
            <li key={menu.id}>
              <Link
                href={menu.url}
                className="hover:text-[#177cc3] transition-colors"
                style={{ 
                  '&:hover': { color: headerConfig?.hoverColor || '#177cc3' }
                }}
              >
                {menu.label}
              </Link>
            </li>
          ))}

          {/* Botões de autenticação */}
          {session ? (
            <>
              {showDashboard && (
                <li>
                  <Link
                    href="/dashboard"
                    className="hover:text-[#177cc3] transition-colors"
                    style={{ 
                      '&:hover': { color: headerConfig?.hoverColor || '#177cc3' }
                    }}
                  >
                    Dashboard
                  </Link>
                </li>
              )}
              <li>
                <button
                  onClick={() => signOut()}
                  className="hover:text-[#177cc3] transition-colors"
                  style={{ 
                    '&:hover': { color: headerConfig?.hoverColor || '#177cc3' }
                  }}
                >
                  Sair
                </button>
              </li>
            </>
          ) : (
            <>
              <li>
                <Link
                  href="/register"
                  className="hover:text-[#177cc3] transition-colors"
                  style={{ 
                    '&:hover': { color: headerConfig?.hoverColor || '#177cc3' }
                  }}
                >
                  Cadastrar
                </Link>
              </li>
              <li>
                <Link
                  href="/login"
                  className="hover:text-[#177cc3] transition-colors"
                  style={{ 
                    '&:hover': { color: headerConfig?.hoverColor || '#177cc3' }
                  }}
                >
                  Entrar
                </Link>
              </li>
            </>
          )}
        </ul>
      </nav>
    </header>
  )
}
