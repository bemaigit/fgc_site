'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'

interface UserMenuLinksProps {
  mobile?: boolean
  onMobileItemClick?: () => void
}

export function UserMenuLinks({ mobile = false, onMobileItemClick = () => {} }: UserMenuLinksProps) {
  const { data: session, status } = useSession()
  const [showDashboardLink, setShowDashboardLink] = useState(false)
  
  useEffect(() => {
    if (status === 'loading') return
    
    // Debug dos dados da sessão
    console.log('⭐ Session data:', session)
    console.log('⭐ User role:', session?.user?.role)
    
    // Verificar explicitamente se o usuário é admin
    const role = session?.user?.role
    const hasAdminAccess = role === 'ADMIN' || role === 'SUPER_ADMIN'
    
    console.log('⭐ Role:', role)
    console.log('⭐ Has admin access:', hasAdminAccess)
    
    setShowDashboardLink(hasAdminAccess)
  }, [session, status])
  
  // Se o usuário não estiver autenticado, não mostrar nada
  if (status !== 'authenticated' || !session?.user) {
    return null
  }
  
  // Classes CSS baseadas no tipo de menu (mobile ou desktop)
  const classes = {
    link: mobile 
      ? "-mx-3 block rounded-lg px-3 py-2.5 text-base font-semibold leading-7 text-gray-900 hover:bg-gray-50"
      : "text-sm font-semibold leading-6 text-white bg-[#08285d] px-4 py-2 rounded-md hover:bg-[#7db0de]",
    profileLink: mobile
      ? "-mx-3 block rounded-lg px-3 py-2.5 text-base font-semibold leading-7 text-gray-900 hover:bg-gray-50"
      : "text-sm font-semibold leading-6 text-white bg-[#7db0de] px-4 py-2 rounded-md hover:bg-[#08285d]",
    marginLeft: !mobile ? "ml-2" : ""
  }
  
  return (
    <>
      {/* Botão Meu Perfil - para qualquer usuário autenticado */}
      <Link
        href="/dashboard/meu-perfil"
        className={classes.profileLink}
        onClick={mobile ? onMobileItemClick : undefined}
      >
        Meu Perfil
      </Link>
      
      {/* Botão Dashboard - APENAS para admin */}
      {showDashboardLink && (
        <Link
          href="/dashboard"
          className={`${classes.link} ${!mobile ? classes.marginLeft : ""}`}
          onClick={mobile ? onMobileItemClick : undefined}
        >
          Dashboard
        </Link>
      )}
      
      {/* Botão Sair */}
      <Link
        href="/auth/logout"
        className={`${classes.link} ${!mobile ? classes.marginLeft : ""}`}
        onClick={mobile ? onMobileItemClick : undefined}
      >
        Sair
      </Link>
    </>
  )
}
