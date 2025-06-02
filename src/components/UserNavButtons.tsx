'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'

interface UserNavButtonsProps {
  mobile?: boolean
  onMobileItemClick?: () => void
}

export function UserNavButtons({ mobile = false, onMobileItemClick }: UserNavButtonsProps) {
  const { data: session, status } = useSession()
  const [userRole, setUserRole] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  
  useEffect(() => {
    // Só prosseguir se o usuário estiver autenticado
    if (status !== 'authenticated' || !session?.user?.id) {
      setIsLoading(false)
      return
    }
    
    // Buscar a role do usuário diretamente da API
    const fetchUserRole = async () => {
      try {
        setIsLoading(true)
        const response = await fetch(`/api/user/role?userId=${session.user.id}`)
        if (response.ok) {
          const data = await response.json()
          console.log('🔍 User role data:', data)
          setUserRole(data.role)
        } else {
          console.error('❌ Failed to fetch user role')
        }
      } catch (error) {
        console.error('❌ Error fetching user role:', error)
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchUserRole()
  }, [session, status])
  
  // Classes para estilização
  const linkClasses = {
    profile: mobile
      ? "-mx-3 block rounded-lg px-3 py-2.5 text-base font-semibold leading-7 text-gray-900 hover:bg-gray-50"
      : "text-sm font-semibold leading-6 text-white bg-[#7db0de] px-4 py-2 rounded-md hover:bg-[#08285d]",
    dashboard: mobile
      ? "-mx-3 block rounded-lg px-3 py-2.5 text-base font-semibold leading-7 text-gray-900 hover:bg-gray-50"
      : "text-sm font-semibold leading-6 text-white bg-[#08285d] px-4 py-2 rounded-md hover:bg-[#7db0de] ml-2",
    logout: mobile
      ? "-mx-3 block rounded-lg px-3 py-2.5 text-base font-semibold leading-7 text-gray-900 hover:bg-gray-50"
      : "text-sm font-semibold leading-6 text-white bg-[#08285d] px-4 py-2 rounded-md hover:bg-[#7db0de] ml-2"
  }
  
  // Se não estiver autenticado, não mostrar nada
  if (status !== 'authenticated') {
    return null
  }
  
  // Se ainda estiver carregando, não mostrar nada ainda
  if (isLoading) {
    return null // Ou um spinner se preferir
  }
  
  // Log para debug
  console.log('🔑 Rendering nav buttons with role:', userRole)
  
  const isAdmin = userRole === 'ADMIN' || userRole === 'SUPER_ADMIN'
  
  return (
    <>
      {/* Botão Meu Perfil - Sempre visível para usuários autenticados */}
      <Link
        href="/dashboard/meu-perfil"
        className={linkClasses.profile}
        onClick={mobile ? onMobileItemClick : undefined}
      >
        Meu Perfil
      </Link>
      
      {/* Botão Dashboard - Apenas para admin/super_admin */}
      {isAdmin && (
        <Link
          href="/dashboard"
          className={linkClasses.dashboard}
          onClick={mobile ? onMobileItemClick : undefined}
        >
          Dashboard
        </Link>
      )}
      
      {/* Botão Sair */}
      <Link
        href="/auth/logout"
        className={linkClasses.logout}
        onClick={mobile ? onMobileItemClick : undefined}
      >
        Sair
      </Link>
    </>
  )
}
