'use client'

import Link from 'next/link'
import { useSession } from 'next-auth/react'

export function DirectAuthButtons() {
  const { data: session } = useSession()

  // Verificações de segurança - logs extensivos para debug
  console.log('🔴 Session object:', JSON.stringify(session, null, 2))
  
  // Verificação simples - se temos sessão, usuário está logado
  const isLoggedIn = !!session
  
  // Verificação de administrador - diretamente da sessão sem verificações complexas
  const userRole = session?.user?.role
  const isAdmin = userRole === 'ADMIN' || userRole === 'SUPER_ADMIN'
  
  console.log('🔴 isLoggedIn:', isLoggedIn)
  console.log('🔴 userRole:', userRole)
  console.log('🔴 isAdmin:', isAdmin)

  if (!isLoggedIn) {
    return (
      <Link
        href="/auth/login"
        className="text-sm font-semibold leading-6 text-white bg-[#08285d] px-4 py-2 rounded-md hover:bg-[#7db0de]"
      >
        Entrar <span aria-hidden="true">&rarr;</span>
      </Link>
    )
  }

  return (
    <>
      {/* Sempre mostrar Meu Perfil para usuários logados */}
      <Link
        href="/dashboard/meu-perfil"
        className="text-sm font-semibold leading-6 text-white bg-[#7db0de] px-4 py-2 rounded-md hover:bg-[#08285d]"
      >
        Meu Perfil
      </Link>
      
      {/* Condicional para Dashboard */}
      {isAdmin && (
        <Link
          href="/dashboard"
          className="text-sm font-semibold leading-6 text-white bg-[#08285d] px-4 py-2 rounded-md hover:bg-[#7db0de] ml-2"
        >
          Dashboard
        </Link>
      )}
      
      {/* Botão de logout */}
      <Link
        href="/auth/logout"
        className="text-sm font-semibold leading-6 text-white bg-[#08285d] px-4 py-2 rounded-md hover:bg-[#7db0de] ml-2"
      >
        Sair
      </Link>
    </>
  )
}

export function DirectAuthButtonsMobile({ onItemClick }: { onItemClick: () => void }) {
  const { data: session } = useSession()

  // Verificação simples - se temos sessão, usuário está logado
  const isLoggedIn = !!session
  
  // Verificação de administrador - diretamente da sessão sem verificações complexas
  const userRole = session?.user?.role
  const isAdmin = userRole === 'ADMIN' || userRole === 'SUPER_ADMIN'

  if (!isLoggedIn) {
    return (
      <Link
        href="/auth/login"
        className="-mx-3 block rounded-lg px-3 py-2.5 text-base font-semibold leading-7 text-gray-900 hover:bg-gray-50"
        onClick={onItemClick}
      >
        Entrar
      </Link>
    )
  }

  return (
    <>
      {/* Sempre mostrar Meu Perfil para usuários logados */}
      <Link
        href="/dashboard/meu-perfil"
        className="-mx-3 block rounded-lg px-3 py-2.5 text-base font-semibold leading-7 text-gray-900 hover:bg-gray-50"
        onClick={onItemClick}
      >
        Meu Perfil
      </Link>
      
      {/* Condicional para Dashboard */}
      {isAdmin && (
        <Link
          href="/dashboard"
          className="-mx-3 block rounded-lg px-3 py-2.5 text-base font-semibold leading-7 text-gray-900 hover:bg-gray-50"
          onClick={onItemClick}
        >
          Dashboard
        </Link>
      )}
      
      {/* Botão de logout */}
      <Link
        href="/auth/logout"
        className="-mx-3 block rounded-lg px-3 py-2.5 text-base font-semibold leading-7 text-gray-900 hover:bg-gray-50"
        onClick={onItemClick}
      >
        Sair
      </Link>
    </>
  )
}
